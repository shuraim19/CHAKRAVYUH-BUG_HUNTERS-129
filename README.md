# ProtoForge AI

> **CHAKRAVYUH Smart ENTC Learning & Innovation Platform**  
> **Team:** BUG HUNTERS  
> **Target Deployment:** Vercel (Zero paid services, session-only in-memory architecture)  

ProtoForge AI is a browser-based engineering IDE for electronics, embedded systems, and IoT education. It combines an extensible component registry, interactive electronics canvas, undirected pin-to-pin wiring, electrical netlist validation, and educational circuit diagnostics into a unified student workspace.

---

## Current Status: Phase 3 Implemented (Wiring & Circuit Validation)

- **Phase 1 (Foundation & Monaco IDE)**: Completed & verified.
- **Phase 2 (Component Registry & Electronics Workbench)**: Completed & verified.
- **Phase 3 (Pin-to-Pin Wiring, Netlist Validation & Session-Only Storage)**: **Completed & verified.**
- **Phase 4 (Functional Automatic Street Light Simulation)**: Queued next.

---

## Phase 3 Architecture: Session-Only Projects

Per updated challenge requirements, ProtoForge operates in a **strictly session-only, in-memory model**:

1. **No Automatic Browser Persistence**:
   - Project work is kept in browser memory during the active session.
   - `localStorage`, `sessionStorage`, `IndexedDB`, cookies, and service worker caches are **never** used to retain project files, components, or wires.
   - Legacy storage keys (`protoforge.project.*`) are automatically removed upon startup without clearing unrelated browser storage.
   - Refreshing or closing the tab discards the current workspace.

2. **Manual Download & Import**:
   - **Download Project (`Ctrl+S` / `Cmd+S`)**: Exports a schema-versioned JSON snapshot containing all project files, components, wires, properties, and metadata.
   - **Import Project**: File picker that validates JSON syntax, schema version (`schemaVersion: 1`), maximum file size (5 MB), ID uniqueness, component registry definitions, property schemas, relative file paths, and wire endpoint integrity before loading.
   - Invalid import files leave the active workspace untouched.
   - User confirmation is required before `New` or `Import` replaces a modified workspace.

---

## Wiring & Electrical Validation Features

### 1. Pin-to-Pin Canvas Wiring
- **Undirected Electrical Connections**: Wires represent physical conductors (`A ↔ B`). Dragging from A to B or from B to A creates the identical electrical connection.
- **Dual Stacked Handles**: Every component terminal has bidirectional source/target handles (`isConnectable={true}`) for effortless drag-and-drop wiring.
- **Wire Inspector**: Click any wire on the canvas to inspect its endpoints (e.g. `U1 [5V] ↔ LDR1 [Terminal 1]`), change its color (Cyan, Red, Slate/Black, Yellow, Green, Purple, White), or delete it.
- **Keyboard & Touch Connection Tool**: Accessible dropdown form allowing students to connect Component A/Pin A to Component B/Pin B without mouse dragging, plus a list of active connections.
- **Lifecycle Safety**:
  - Moving a component preserves all electrical wire connections and positions.
  - Deleting a component automatically purges all connected wires.
  - Self-loops, duplicate wires, and missing endpoints are rejected with immediate feedback.

### 2. Electrical Netlist & Validation Engine
- **Union-Find Graph Traversal**: Merges connected terminals into discrete electrical nets.
- **Microcontroller Ground Plane**: Ground pins on the same board (`pin-gnd-1`, `pin-gnd-2`, `pin-gnd-3`) share the board's internal ground plane.
- **Discrete Component Separation**: Passives (resistors, LEDs, LDRs) remain strictly separated as elements between nets.
- **Static Check Rules**:
  - Direct 5V-to-GND and 3.3V-to-GND short circuit detection (`SHORT_CIRCUIT_POWER_GND`).
  - Conflicting fixed-voltage supply rails (`CONFLICTING_POWER_RAILS`).
  - Duplicate/redundant wire detection.
  - Invalid component property detection.
- **Responsible Validation Limits**: When all static checks pass, the IDE reports:  
  *"No errors found by the implemented checks."* with an explicit disclaimer that static rule checking does not constitute a full electrical safety analysis.

### 3. Automatic Street Light Reference Topology Checker
Validates the complete reference topology for the Automatic Street Light project:
- **Reference Components**: 1× Arduino Uno R3, 1× Photoresistor (LDR), 1× 10 kΩ divider pull-down resistor, 1× 220 Ω LED series resistor, 1× White LED.
- **Expected Connections**:
  1. `Uno 5V` → `LDR Terminal 1`
  2. `LDR Terminal 2` → `Uno A0`
  3. `A0 Node` → `10 kΩ Resistor Terminal 1`
  4. `10 kΩ Resistor Terminal 2` → `Uno GND`
  5. `Uno Pin D9` → `220 Ω Resistor Terminal 1`
  6. `220 Ω Resistor Terminal 2` → `LED Anode (A / +)`
  7. `LED Cathode (K / -)` → `Uno GND`
- **Tolerant & Robust**:
  - Non-polarised passive terminals: Accepts swapped terminal orders on resistors and LDRs.
  - Components identified by electrical connectivity and type, not hardcoded label strings.
  - Fault detection: detects missing power, missing A0 tap, disconnected divider, disconnected LED series resistor, bypassed series resistor, reversed LED polarity, missing ground, and multiple candidate boards.

---

## Step-by-Step Walkthrough: Wiring the Street Light Circuit

### Option A: Using the Automated Preset
1. In the workbench floating toolbar, click **Layout**.
2. Click **Load Unwired Layout** (or **Load Wired Example** to inspect the verified reference circuit).
3. Click **Validate Circuit** in the top toolbar to view live diagnostics in the **Problems** tab.

### Option B: Manual Wiring from Scratch
1. Place **Arduino Uno R3**, **Photoresistor (LDR)**, two **Resistors**, and one **LED** from the Component Library.
2. In the Properties Inspector, configure one resistor to **10 kΩ** (`R1`) and the other to **220 Ω** (`R2`).
3. Drag a wire from **Uno 5V** to **LDR Terminal 1** (Red wire).
4. Drag a wire from **LDR Terminal 2** to **Uno A0** (Cyan wire).
5. Drag a wire from **LDR Terminal 2** (or Uno A0) to **R1 Terminal 1** (Cyan wire).
6. Drag a wire from **R1 Terminal 2** to **Uno GND** (Slate/Black wire).
7. Drag a wire from **Uno D9** to **R2 Terminal 1** (Yellow wire).
8. Drag a wire from **R2 Terminal 2** to **LED Anode (A / +)** (Yellow wire).
9. Drag a wire from **LED Cathode (K / -)** to **Uno GND** (Slate/Black wire).
10. Click **Validate Circuit** in the top toolbar:
    - If properly wired, the Problems panel displays: *"No errors found by the implemented checks."*
    - Click **Download** (or press `Ctrl+S`) to save your circuit snapshot to your computer.

---

## Phase Boundaries & Non-Goals

- **Simulation Engine**: Run, Stop, and Reset buttons are disabled with *"Functional simulation arrives in Phase 4."* Functional light level simulation, analog sensor math, and LED illumination will be delivered in Phase 4.
- **Serial Monitor**: Displays *"No firmware runtime connected."* Firmware emulation arrives in later phases.
- **AI Assistant**: Gemini integration arrives in Phase 6.
- **Deployment**: Targeted for free Vercel hosting with zero paid services or database infrastructure.

---

## Getting Started

### Prerequisites
- **Node.js**: `>= 18.0.0`
- **npm**: `>= 9.0.0`

### Installation
```bash
npm install
```

### Running Locally
```bash
npm run dev
```
Open **`http://localhost:5173`** in your browser.

### Running Tests
```bash
npm test
```
Executes all 37 unit tests across schema validation, component registry, project store, wiring netlist, and street-light topology checks.

### Production Build
```bash
npm run build
```
Executes TypeScript type checking (`tsc`) and compiles the production bundle into `dist/`.