# ProtoForge AI

> **CHAKRAVYUH Smart ENTC Learning & Innovation Platform**  
> **Team:** BUG HUNTERS  
> **Live Deployment:** [https://protoforge-ai-tau.vercel.app](https://protoforge-ai-tau.vercel.app)  
> **API Endpoint:** [https://protoforge-ai-tau.vercel.app/api/assistant](https://protoforge-ai-tau.vercel.app/api/assistant)  
> **Repository:** [https://github.com/shuraim19/CHAKRAVYUH-BUG_HUNTERS-129](https://github.com/shuraim19/CHAKRAVYUH-BUG_HUNTERS-129)  

ProtoForge AI is a browser-based engineering IDE for electronics, embedded systems, and IoT education. It combines an extensible component registry, interactive electronics canvas, undirected pin-to-pin wiring, electrical netlist validation, a deterministic functional simulation engine (Automatic Street Light experiment), and an educational Google Gemini engineering assistant with human-in-the-loop reviewed code proposals.

---

## Scope Matrix & Milestones

| Phase | Milestone | Priority | Status |
|---|---|---|---|
| **Phase 1** | Foundation & IDE Interface (Explorer, Monaco Editor, Project Structure) | P0 | **Implemented & Verified** |
| **Phase 2** | Component Registry & Interactive Electronics Workbench | P0 | **Implemented & Verified** |
| **Phase 3** | Pin Wiring, Circuit Netlist, Validation & Session-Only Storage | P0 | **Implemented & Verified** |
| **Phase 4** | Functional Electronics Simulation Engine (Automatic Street Light) | P0 | **Implemented & Verified** |
| **Phase 5** | Extended Multi-Experiment Simulations & Hardware Expansion | P1 | Planned Next |
| **Phase 6** | End-to-End Polish, Final Documentation & Vercel Production Deploy | P1 | Final Phase |

---

## Phase 4: Functional Electronics Simulation Engine

ProtoForge AI features a **deterministic, interactive functional simulation engine** tightly integrated with the project netlist and topological validator.

### 1. Supported Reference Experiment: Automatic Street Light
- **Microcontroller**: Arduino Uno R3.
- **Sensor**: Photoresistor (LDR) connected between `5V` and `A0`.
- **Divider**: 10 kΩ pull-down resistor connected between `A0` and `GND`.
- **Actuator**: White LED connected via a 220 Ω series resistor from `D9` to `GND`.

### 2. Mathematical Sensor & Divider Model
The simulation utilizes an educational, continuous exponential approximation of photoresistor response under varying ambient illumination:
```
R_LDR = 100,000 × (1,000 / 100,000) ^ (lightPercentage / 100)
```
- At **0% light (complete darkness)**: `R_LDR ≈ 100 kΩ`
- At **20% light (dusk / default)**: `R_LDR ≈ 39.8 kΩ`
- At **100% light (bright daylight)**: `R_LDR = 1 kΩ`

With the 10 kΩ pull-down resistor in place:
```
V_A0 = 5.0 × (10,000 / (R_LDR + 10,000))
ADC = round((V_A0 / 5.0) × 1023)
```
*Values are clamped to valid physical ranges (`0.0 V – 5.0 V` and `0 – 1023` ADC counts).*

### 3. LED Control Logic & Darkness Threshold
- **Default Darkness Threshold**: `ADC = 512` (configurable via slider from 0 to 1023).
- **Control Rule**:
  - When `ADC < threshold`: Darkness detected → Arduino D9 outputs `HIGH (5.0V)` → LED turns **ON**.
  - When `ADC ≥ threshold`: Sufficient ambient light → Arduino D9 outputs `LOW (0.0V)` → LED turns **OFF**.

### 4. Interactive Simulation HUD & Real-Time Visualization
- **Top Toolbar**: Controls for **Run** (with green pulse), **Stop**, and **Reset** (restores default 20% light and 512 threshold without modifying circuit components or wires). Live status badges (`RUNNING`, `FAULT`, `STOPPED`).
- **Floating HUD Overlay**:
  - Ambient Light slider (`0%` to `100%`).
  - Darkness Threshold slider (`0` to `1023`).
  - Live telemetry readout cards: Ambient Light %, LDR Resistance (kΩ), Analog Input (V & ADC), Digital Output D9 (0V/5V), and Lamp Status (`● ON` / `○ OFF`).
- **Canvas Realism**:
  - **LED Component**: Bright glowing circular dome with radial bloom when ON (`● ON • 5.0V`, `~8.2 mA`), dimmed with transparent dome when OFF.
  - **LDR Component**: Live light percentage badge, live resistance readout, and dynamic disc color shifting from dark navy (`#0f172a`) to sunny amber (`#fde047`).
  - **Arduino Uno**: Real-time pin badges showing `~9 [5V]` / `~9 [0V]` and `A0 [ADC]`.

### 5. Strict Fault Detection & Safety Guardrails
The simulation engine actively verifies electrical net connectivity on every state change (wire added/deleted, component moved, or property changed):
- **Missing Power / Ground**: Disconnecting LDR 5V or GND halts the circuit and drops A0 to 0V.
- **Reversed LED Polarity**: Connecting LED anode to GND suspends simulation into `FAULT` and isolates the output.
- **Bypassed or Missing Series Resistor**: Connecting LED directly to D9 triggers a safety violation diagnostic and suspends simulation.
- **Power-to-Ground Short Circuits**: Direct 5V to GND shorts immediately trigger `FAULT` state and disable outputs.
- **Dynamic Re-evaluation**: Reconnecting missing wires or correcting component polarity immediately clears faults and restores running simulation.

### 6. Simulation Event Log
Every simulation lifecycle event is dispatched directly to the bottom Output dock:
- Simulation initialized and reference topology verified.
- Ambient light adjusted with computed A0 and ADC telemetry.
- Threshold crossed and D9 pin transition (`HIGH` / `LOW`).
- Fault detected with root-cause diagnostic code.
- Stop and reset confirmations.

### 7. Explicit Simulation Boundaries & Limitations
> [!IMPORTANT]
> - **Deterministic Functional Model**: ProtoForge AI simulates verified pedagogical circuit topologies using physical mathematical models. It is **not** an arbitrary AVR machine-code emulator or arbitrary C++ compiler.
> - **Firmware Consistency**: The reference `main.ino` sketch matches the simulated control loop (`pinMode(9, OUTPUT); analogRead(A0); digitalWrite(9, HIGH/LOW)`). Custom edits to `.ino` files will not alter the simulated physics unless a compatible execution runtime is configured.
> - **Session-Only Memory**: Simulation telemetry and runtime settings remain in volatile browser memory. Refreshing resets the IDE to a fresh state.

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
Executes all 70 automated unit tests across 6 test suites covering schemas, component registry, circuit netlists, street light topology, mathematical LDR models, ADC computations, dynamic threshold logic, fault injection, assistant contracts, rate limiting, and client secret isolation.

### 5. Production Build
```bash
npm run build
```
Executes TypeScript type checking (`tsc`) across both frontend and backend modules, and compiles the production bundle into `dist/`.

---

## Deployment: Vercel Production

ProtoForge AI is live in production on Vercel:
- **Live Application URL**: [https://protoforge-ai-tau.vercel.app](https://protoforge-ai-tau.vercel.app)
- **Serverless API Status**: [https://protoforge-ai-tau.vercel.app/api/assistant](https://protoforge-ai-tau.vercel.app/api/assistant)
- **Frontend Architecture**: Static SPA hosted from `dist/` with client-side SPA routing rewrites (`vercel.json`).
- **Serverless API**: `api/assistant.ts` handles `POST /api/assistant` using the official `@google/genai` Node runtime.
- **Environment Variables**: Configure `GEMINI_API_KEY` and `GEMINI_MODEL` in the Vercel Project Settings dashboard. If unconfigured, the application gracefully operates in truthful unconfigured mode with the complete electronics lab and simulation 100% operational.