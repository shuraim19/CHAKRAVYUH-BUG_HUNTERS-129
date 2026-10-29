# ProtoForge AI

> **CHAKRAVYUH Smart ENTC Learning & Innovation Platform**  
> **Team:** BUG HUNTERS  
> **Target Deployment:** Vercel  

ProtoForge AI is a browser-based engineering IDE for electronics, embedded systems, and IoT education. It integrates code editing, interactive circuit workbench simulation, and AI-assisted engineering guidance into a unified development environment.

---

## Current Status: Phase 2 Implemented (Workbench & Component Registry)

- **Phase 1 (Foundation & Monaco IDE)**: Completed & verified.
- **Phase 2 (Component Registry & Electronics Workbench)**: Completed & verified.
- **Phase 3 (Pin-to-Pin Wiring Net Graph & Electrical Validation)**: Queued next.

---

## Phase 2 Highlights

1. **Interactive Electronics Workbench**:
   - Built on `@xyflow/react` with custom high-fidelity component nodes.
   - Dotted engineering grid with smooth panning, zooming, and fit-view controls.
   - Dual placement: Drag-and-drop from the palette or click the "+ Add" button with staggered positioning.
   - Visual terminal pins with large pointer targets and connections temporarily disabled with clear feedback (*"Component placement is active. Electrical wiring arrives in Phase 3."*).

2. **Extensible Component Registry**:
   - **Arduino Uno R3**: Original blue PCB illustration, ATmega328P DIP chip, digital header (D0/RX to D13, AREF, GND), and analog/power header (5V, 3V3, GND, VIN, RESET, A0–A5).
   - **ESP32 DevKit**: Dark development-board view with ESP-WROOM-32 RF shield, exposed subset pins (3V3, GND, GPIO18–23, GPIO34 input-only), and visual-only badge.
   - **Resistor**: Axial beige body with live value display and convenient presets (220 Ω, 1 kΩ, 10 kΩ).
   - **LED**: Polarized 5mm dome with configurable colors (red, green, blue, yellow) and Anode (+)/Cathode (−) terminals.
   - **Photoresistor (LDR)**: Ceramic sensor disc with CdS serpentine pattern and configurable dark/bright resistance.
   - **14 Catalog-Only Discovery Items**: Push buttons, potentiometers, sensors (temperature, ultrasonic, soil moisture), actuators (relays, motors, servos, buzzers), and displays (LCD, OLED).

3. **Properties Inspector**:
   - Inspects placed components, instance labels, and terminal pinouts with electrical roles.
   - Validated property editing with inline error messages (rejects negative numbers, `NaN`, and empty labels).
   - Independent component instances: modifying one resistor does not mutate another.

4. **Keyboard & Interaction Safety**:
   - `Delete`/`Backspace` keys only remove selected components when the canvas is focused.
   - Keystrokes in Monaco, filename inputs, and property fields are never intercepted.

---

## Walkthrough: Setting Up the Automatic Street Light Components

To prepare the workbench for the reference Automatic Street Light experiment:
1. Open the **Component Library** palette on the left side of the workbench.
2. Click **Add** next to **Arduino Uno R3** (or drag it onto the canvas). Notice label `U1` is assigned.
3. Click **Add** next to **Photoresistor (LDR)**. Notice label `LDR1` is assigned.
4. Click **Add** next to **Resistor**. Notice label `R1` (default 220 Ω) is placed.
5. In the **Properties Inspector** for `R1`, click the **10 kΩ (Divider)** preset. It updates to 10,000 Ω.
6. Click **Add** next to **Resistor** again. Notice label `R2` is placed and retains its default 220 Ω.
7. Click **Add** next to **LED (Light Emitting Diode)**. Notice label `LED1` is placed.
8. Drag the components to arrange them clearly on the dotted workbench grid.
9. Click **Save** in the top bar (or press `Ctrl+S`). Refresh the browser to verify that all components, positions, and properties are preserved.

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
Open **`http://localhost:5173`** in your browser.

### Running Tests
```bash
npm test
```

### Production Build
```bash
npm run build
```

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
│   ├── domain/
│   │   ├── components/
│   │   │   ├── types.ts            # Component definitions & categories
│   │   │   ├── schemas.ts          # Zod property validation schemas
│   │   │   ├── registry.ts         # Registry of placeable and catalog items
│   │   │   └── registry.test.ts    # Unit tests for components & schemas
│   │   └── project/
│   │       ├── schema.ts           # Authoritative project schema
│   │       ├── schema.test.ts      # Path sanitization & schema tests
│   │       └── initialProject.ts   # Street light starter project
│   ├── features/
│   │   ├── files/
│   │   │   ├── FileExplorer.tsx    # Project explorer & file operations
│   │   │   └── CodeEditor.tsx      # Monaco editor & tab manager
│   │   ├── workbench/
│   │   │   ├── WorkbenchPanel.tsx  # React Flow interactive canvas
│   │   │   ├── ComponentPalette.tsx# Searchable component library
│   │   │   ├── ComponentNode.tsx   # Custom SVG/CSS component nodes
│   │   │   ├── PropertiesInspector.tsx # Validated properties drawer
│   │   │   └── WorkbenchToolbar.tsx# Pan/zoom controls & component counter
│   │   └── assistant/
│   │       └── AssistantPanel.tsx  # Gemini assistant placeholder
│   ├── lib/
│   │   ├── monaco.ts               # Monaco bundled workers & theme
│   │   └── persistence.ts          # LocalStorage persistence manager
│   ├── store/
│   │   ├── projectStore.ts         # Authoritative Zustand state store
│   │   └── projectStore.test.ts    # Store integration tests
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