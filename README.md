# ProtoForge AI

> **CHAKRAVYUH Smart ENTC Learning & Innovation Platform**  
> **Team:** BUG HUNTERS  
> **Target Deployment:** Vercel (Zero paid services, session-only in-memory architecture)  

ProtoForge AI is a browser-based engineering IDE for electronics, embedded systems, and IoT education. It combines an extensible component registry, interactive electronics canvas, undirected pin-to-pin wiring, electrical netlist validation, and an educational Google Gemini engineering assistant with human-in-the-loop reviewed code proposals.

---

## Scope Matrix & Milestones

| Phase | Milestone | Priority | Status |
|---|---|---|---|
| **Phase 1** | Foundation & IDE Interface (Explorer, Monaco Editor, Project Structure) | P0 | **Implemented & Verified** |
| **Phase 2** | Component Registry & Interactive Electronics Workbench | P0 | **Implemented & Verified** |
| **Phase 3** | Pin Wiring, Circuit Netlist, Validation & Session-Only Storage | P0 | **Implemented & Verified** |
| **Phase 4** | Gemini Engineering Assistant & Reviewed Proposals | P1 | **Implemented & Verified** |
| **Phase 5** | Functional Automatic Street Light Experiment Simulation | P0 | Deferred to Phase 5 |
| **Phase 6** | End-to-End Polish, Documentation & Vercel Deployment | P1 | Next Phase |

---

## Session-Only Architecture & Data Policy

Per challenge requirements, ProtoForge operates in a **strictly session-only, in-memory model**:

1. **Zero Browser-Side Persistence**:
   - Project work and assistant conversations stay in browser memory during the active session.
   - `localStorage`, `sessionStorage`, `IndexedDB`, cookies, and service worker caches are **never** used to retain project files, components, wires, or chat messages.
   - Legacy storage keys (`protoforge.project.*`) are automatically purged upon startup without clearing unrelated browser storage.
   - Refreshing or closing the tab discards the current workspace.

2. **Manual Download & Import**:
   - **Download Project (`Ctrl+S` / `Cmd+S`)**: Exports a schema-versioned JSON snapshot containing all project files, components, wires, properties, and metadata.
   - **Import Project**: File picker that strictly validates JSON syntax, schema version (`schemaVersion: 1`), maximum file size (5 MB), ID uniqueness, component registry definitions, property schemas, relative file paths, and wire endpoint integrity before loading.
   - Invalid import files leave the active workspace untouched.
   - User confirmation is required before `New` or `Import` replaces a modified workspace.

3. **Assistant Privacy Notice**:
   - Using the Gemini assistant sends selected project context (active source file, selected component, circuit wiring summary, deterministic diagnostics) to Google Gemini.
   - Google API data policies apply to transmitted prompts.
   - Submitted projects and conversations are **never** stored server-side.

---

## Gemini Engineering Assistant Architecture

The assistant panel provides real-time educational engineering support:

1. **Supported Capabilities**:
   - **Electronics Questions**: Conversational technical questions about circuit theory, microcontrollers, and sensors.
   - **Explain Selected Component**: Pinout roles, electrical parameters, and usage guidelines for the active canvas selection.
   - **Diagnose Circuit**: Synthesizes the actual netlist and deterministic validation diagnostics (e.g. why an LED is unpowered).
   - **Explain Arduino Code**: Deep walkthrough of active `.ino` logic, pin modes, and threshold comparisons.
   - **Reviewed Code Proposals (Diff Review)**: Structured source proposals using Monaco Diff Editor. Students inspect original vs proposed code, review explanation and warnings, and must explicitly click **Accept Changes** or **Reject**. Stale proposals are rejected if the source file was edited after proposal generation.
   - **Atomic In-Memory Undo**: One-click rollback for accepted proposals, guarded against overwriting subsequent manual edits.

2. **Security & Cost Guardrails**:
   - **Server-Side Only**: Official `@google/genai` SDK runs exclusively on the backend (`server/dev.ts` locally or `api/assistant.ts` on Vercel). No API keys or SDK modules are bundled into frontend assets.
   - **Default Model**: Configured for `gemini-3.5-flash-lite` on the free tier.
   - **Strict Input Sanitization**: 64 KiB request body limit, 4,000 character message limit, 8-message history cap, and rejection of client-supplied system/developer roles.
   - **In-Memory Rate Limiting**: Enforces a per-client sliding window (max 10 requests / minute) with retry headers.
   - **Truthful Unconfigured State**: If `GEMINI_API_KEY` is not present, the assistant displays *"AI Not Configured"* and leaves the electronics lab fully usable.

---

## Getting Started

### Prerequisites
- **Node.js**: `>= 20.0.0`
- **npm**: `>= 9.0.0`

### 1. Installation
```bash
npm install
```

### 2. Configure Gemini API Key (Private Setup)
Copy the example environment template to `.env.local`:
```bash
cp .env.example .env.local
```
Open `.env.local` in your editor and enter your Google AI Studio API key:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL=gemini-3.5-flash-lite
```
> [!IMPORTANT]
> - `.env.local` is gitignored and will never be tracked or committed.
> - Verify in Google AI Studio that your project is on the **Free Tier** to prevent unintended billing.
> - If no API key is set, the electronics lab, wiring canvas, and validator remain 100% functional.

### 3. Running Locally
Run the combined development command that starts both the Node assistant service (`http://127.0.0.1:3001`) and Vite frontend (`http://localhost:5173`):
```bash
npm run dev
```
Open **`http://localhost:5173`** in your browser.

### 4. Running Tests
```bash
npm test
```
Executes all 51 automated unit tests covering schemas, component registry, circuit netlists, street light topology, assistant contracts, rate limiting, proposal diff reviews, and client secret isolation.

### 5. Production Build
```bash
npm run build
```
Executes TypeScript type checking (`tsc`) across both frontend and backend modules, and compiles the production bundle into `dist/`.

---

## Deployment Target: Vercel

ProtoForge AI is prepared for zero-cost deployment on Vercel:
- **Frontend**: Static SPA hosted from `dist/` with client-side routing rewrites (`vercel.json`).
- **Serverless API**: `api/assistant.ts` handles `POST /api/assistant` using the official `@google/genai` Node runtime.
- **Environment Variables**: Configure `GEMINI_API_KEY` and `GEMINI_MODEL` in the Vercel Project Settings dashboard.