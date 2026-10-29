import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { handleAssistantService } from './assistant-service.js';

// Load environment variables locally from .env.local or .env
function loadLocalEnv() {
  const root = process.cwd();
  const envLocalPath = path.join(root, '.env.local');
  const envPath = path.join(root, '.env');

  if (fs.existsSync(envLocalPath)) {
    try {
      if (typeof process.loadEnvFile === 'function') {
        process.loadEnvFile(envLocalPath);
        console.log('[Server] Loaded environment from .env.local');
      }
    } catch (e) {
      console.warn('[Server] Note: Could not load .env.local:', (e as Error).message);
    }
  } else if (fs.existsSync(envPath)) {
    try {
      if (typeof process.loadEnvFile === 'function') {
        process.loadEnvFile(envPath);
        console.log('[Server] Loaded environment from .env');
      }
    } catch (e) {
      console.warn('[Server] Note: Could not load .env:', (e as Error).message);
    }
  }
}

loadLocalEnv();

const PORT = 3001;
const HOST = '127.0.0.1'; // strictly loopback bound for security
const MAX_BODY_BYTES = 64 * 1024; // 64 KiB limit enforced before full read

const server = http.createServer(async (req, res) => {
  // Always set security & no-cache headers
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cache-Control');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://${req.headers.host || HOST}`);

  if (url.pathname === '/api/assistant') {
    if (req.method === 'GET') {
      const configured = Boolean(process.env.GEMINI_API_KEY?.trim());
      const model = process.env.GEMINI_MODEL?.trim() || 'gemini-3.5-flash-lite';
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'ok',
        configured,
        model
      }));
      return;
    }

    if (req.method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only POST method is supported on /api/assistant.',
        retryable: false
      }));
      return;
    }

    // Read request body with bounded size check
    let receivedBytes = 0;
    const chunks: Buffer[] = [];
    let isOversized = false;

    req.on('data', (chunk: Buffer) => {
      receivedBytes += chunk.length;
      if (receivedBytes > MAX_BODY_BYTES) {
        isOversized = true;
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', async () => {
      if (isOversized) {
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          code: 'OVERSIZED_INPUT',
          message: 'Request payload exceeds 64 KiB limit.',
          retryable: false
        }));
        return;
      }

      const bodyStr = Buffer.concat(chunks).toString('utf-8');
      let rawJson: unknown;

      try {
        rawJson = JSON.parse(bodyStr);
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          code: 'INVALID_JSON',
          message: 'Malformed JSON payload.',
          retryable: false
        }));
        return;
      }

      const clientIp = req.socket.remoteAddress || '127.0.0.1';
      const result = await handleAssistantService(rawJson, clientIp);

      res.writeHead(result.status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result.body));
    });

    req.on('error', () => {
      if (!res.headersSent) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          code: 'BAD_REQUEST',
          message: 'Error receiving request stream.',
          retryable: false
        }));
      }
    });

    return;
  }

  // Not found
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    code: 'NOT_FOUND',
    message: 'Endpoint not found',
    retryable: false
  }));
});

server.listen(PORT, HOST, () => {
  console.log(`[ProtoForge Server] Local assistant service listening on http://${HOST}:${PORT}`);
  console.log(`[ProtoForge Server] AI configured: ${Boolean(process.env.GEMINI_API_KEY?.trim())}`);
  console.log(`[ProtoForge Server] Model: ${process.env.GEMINI_MODEL?.trim() || 'gemini-3.5-flash-lite'}`);
});
