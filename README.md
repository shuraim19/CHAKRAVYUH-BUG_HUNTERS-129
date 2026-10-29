# ProtoForge AI

> **CHAKRAVYUH Smart ENTC Learning & Innovation Platform**  
> **Team:** BUG HUNTERS  
> **Target Deployment:** Vercel  

ProtoForge AI is a browser-based engineering IDE for electronics, embedded systems, and IoT education. It combines code editing, interactive circuit workbench simulation, and AI-assisted engineering guidance into a unified development environment.

---

## Phase 1 Implementation Summary

Phase 1 establishes the foundational engineering IDE:
- **Three-Panel Layout**:
  - **Left (~30%)**: Project Explorer with file tree and integrated Monaco code editor with file tabs.
  - **Centre (~45%)**: Electronics Workbench canvas with dark dotted engineering grid and Phase 1 state notice.
  - **Right (~25%)**: Gemini Engineering Assistant panel in truthful "Not connected" status with disabled controls.
- **Top Bar**:
  - Branding and BUG HUNTERS attribution.
  - Editable project name with non-empty validation.
  - Project actions: Save (with `Ctrl+S` / `Cmd+S`), New Project (with unsaved changes guard).
  - Status indicator (Saved, Unsaved changes, Saving, Save failed).
  - Explicitly disabled simulation controls (Validate, Run, Stop, Reset) with explanations.
- **Bottom Dock**:
  - Resizable and collapsible dock with Output, Problems, and Serial monitor tabs.
  - Live log tracking real user and project actions.
  - Real-time JSON draft syntax verification.
  - Explicit notification that serial stream activates with simulation.
- **Monaco Code Editor**:
  - Bundled local web workers without CDN dependencies.
  - Syntax highlighting for C++ (`.ino`, `.cpp`, `.h`), JSON, and Markdown.
  - Automatic language detection, dirty indicators, and non-blocking edits.
- **File Management**:
  - Create, rename, delete files with full path safety (rejects directory traversal, absolute paths, illegal characters, and duplicates).
  - Protection for core project metadata files (`main.ino`, `circuit.json`, `components.json`, `project.json`, `README.md`).
- **Local Persistence**:
  - Namespaced versioned storage (`protoforge.project.v1`).
  - Zod schema validation on save and load.
  - Corruption safeguard that preserves timestamped backups and offers recovery.

---

## Technology Stack

- **Framework**: React 18, Vite 6, TypeScript 5
- **State Management**: Zustand
- **Schema & Validation**: Zod
- **Editor**: Monaco Editor (bundled local web workers)
- **Icons**: Lucide React
- **Testing**: Vitest

---

## Getting Started

### Prerequisites
- **Node.js**: `>= 18.0.0` (Verified on `v20.20.2`)
- **npm**: `>= 9.0.0` (Verified on `10.8.2`)

### Installation
```bash
npm install
```

### Running Locally
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### Running Tests
```bash
npm test
```

### Production Build
```bash
npm run build
```

---

## Honest Limitations in Phase 1

- **No Component Placement Yet**: The workbench canvas is prepared with its dotted engineering grid; interactive placement arrives in Phase 2.
- **No Pin-to-Pin Wiring**: Electrical net graph validation arrives in Phase 3.
- **No Firmware Emulation**: The editor edits actual code, but arbitrary MCU emulation is not running; reference mathematical simulation arrives in Phase 4.
- **AI Assistant Offline**: Gemini assistant UI is present with truthful "Not connected" status; secure server-side proxy arrives in Phase 6.

---

## Project Structure

```
├── docs/
│   └── status.md                   # Project status and scope matrix
├── src/
│   ├── components/layout/
│   │   ├── IdeShell.tsx            # 3-panel split layout with resizers
│   │   ├── TopToolbar.tsx          # Branding, actions, and status
│   │   └── BottomPanel.tsx         # Output, Problems, Serial tabs
│   ├── domain/project/
│   │   ├── schema.ts               # Zod domain models & path validators
│   │   ├── schema.test.ts          # Vitest test suite
│   │   └── initialProject.ts       # Starter files for Automatic Street Light
│   ├── features/
│   │   ├── files/
│   │   │   ├── FileExplorer.tsx    # Project explorer & file operations
│   │   │   └── CodeEditor.tsx      # Monaco editor & tab manager
│   │   ├── workbench/
│   │   │   └── WorkbenchPanel.tsx  # Electronics workbench canvas
│   │   └── assistant/
│   │       └── AssistantPanel.tsx  # Gemini assistant placeholder
│   ├── lib/
│   │   ├── monaco.ts               # Monaco bundled workers & theme
│   │   └── persistence.ts          # LocalStorage persistence manager
│   ├── store/
│   │   └── projectStore.ts         # Authoritative Zustand state store
│   ├── styles/
│   │   ├── theme.css               # Color tokens & dark navy palette
│   │   └── index.css               # IDE layout & component styles
│   ├── App.tsx                     # App root
│   ├── main.tsx                    # React DOM entry
│   └── vite-env.d.ts               # Vite worker types
├── package.json
├── tsconfig.json
└── vite.config.ts
```