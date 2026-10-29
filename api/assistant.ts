import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleAssistantService } from '../server/assistant-service.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Always disable caching for AI endpoints
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  if (req.method === 'GET') {
    const configured = Boolean(process.env.GEMINI_API_KEY?.trim());
    const model = process.env.GEMINI_MODEL?.trim() || 'gemini-3.5-flash-lite';
    return res.status(200).json({
      status: 'ok',
      configured,
      model
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      code: 'METHOD_NOT_ALLOWED',
      message: 'Only POST method is supported on /api/assistant.',
      retryable: false
    });
  }

  // Get client IP for rate limiting
  const forwarded = req.headers['x-forwarded-for'];
  const clientIp = typeof forwarded === 'string'
    ? forwarded.split(',')[0].trim()
    : req.socket.remoteAddress || '127.0.0.1';

  try {
    const result = await handleAssistantService(req.body, clientIp);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected server error occurred.',
      retryable: true
    });
  }
}
