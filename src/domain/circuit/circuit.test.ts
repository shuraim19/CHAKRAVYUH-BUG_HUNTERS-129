import { describe, it, expect, beforeEach } from 'vitest';
import { Circuit, ComponentInstance, Wire } from '../project/schema';
import { buildNetlist, isDuplicateWire, areTerminalsConnected } from './netlist';
import { validateCircuit } from './validate';
import { validateStreetLightTopology } from './streetLightTopology';
import { useProjectStore } from '../../store/projectStore';
import { validateProjectImport, serializeProject } from '../../lib/persistence';

describe('Phase 3: Pin-based Wiring & Circuit Validation', () => {
  // Canonical reference components
  const createReferenceCircuit = (): Circuit => {
    const components: ComponentInstance[] = [
      {
        id: 'u1',
        type: 'arduino-uno',
        label: 'U1',
        position: { x: 260, y: 160 },
        properties: { microcontroller: 'ATmega328P', operatingVoltage: 5.0, clockSpeed: '16 MHz' }
      },
      {
        id: 'ldr1',
        type: 'ldr',
        label: 'LDR1',
        position: { x: 80, y: 60 },
        properties: { darkResistance: 100000, brightResistance: 1000 }
      },
      {
        id: 'r1',
        type: 'resistor',
        label: 'R1',
        position: { x: 80, y: 240 },
        properties: { resistance: 10000, unit: 'ohm' }
      },
      {
        id: 'r2',
        type: 'resistor',
        label: 'R2',
        position: { x: 480, y: 60 },
        properties: { resistance: 220, unit: 'ohm' }
      },
      {
        id: 'led1',
        type: 'led',
        label: 'LED1',
        position: { x: 480, y: 240 },
        properties: { color: 'white', forwardVoltage: 3.2 }
      }
    ];

    const wires: Wire[] = [
      // 1. Uno 5V -> LDR pin-1
      {
        id: 'w1',
        endpointA: { componentId: 'u1', pinId: 'pin-5v' },
        endpointB: { componentId: 'ldr1', pinId: 'pin-1' },
        colour: '#ef4444'
      },
      // 2. LDR pin-2 -> Uno A0
      {
        id: 'w2',
        endpointA: { componentId: 'ldr1', pinId: 'pin-2' },
        endpointB: { componentId: 'u1', pinId: 'pin-a0' },
        colour: '#06b6d4'
      },
      // 3. LDR pin-2 -> R1 pin-1
      {
        id: 'w3',
        endpointA: { componentId: 'ldr1', pinId: 'pin-2' },
        endpointB: { componentId: 'r1', pinId: 'pin-1' },
        colour: '#06b6d4'
      },
      // 4. R1 pin-2 -> Uno GND
      {
        id: 'w4',
        endpointA: { componentId: 'r1', pinId: 'pin-2' },
        endpointB: { componentId: 'u1', pinId: 'pin-gnd-1' },
        colour: '#334155'
      },
      // 5. Uno D9 -> R2 pin-1
      {
        id: 'w5',
        endpointA: { componentId: 'u1', pinId: 'pin-d9' },
        endpointB: { componentId: 'r2', pinId: 'pin-1' },
        colour: '#eab308'
      },
      // 6. R2 pin-2 -> LED Anode
      {
        id: 'w6',
        endpointA: { componentId: 'r2', pinId: 'pin-2' },
        endpointB: { componentId: 'led1', pinId: 'anode' },
        colour: '#eab308'
      },
      // 7. LED Cathode -> Uno GND
      {
        id: 'w7',
        endpointA: { componentId: 'led1', pinId: 'cathode' },
        endpointB: { componentId: 'u1', pinId: 'pin-gnd-2' },
        colour: '#334155'
      }
    ];

    return { components, wires };
  };

  beforeEach(() => {
    useProjectStore.getState().initialize();
  });

  // Test 1: Undirected duplicate-wire detection
  it('1. detects undirected duplicate wires regardless of endpoint order', () => {
    const wires: Wire[] = [
      {
        id: 'w1',
        endpointA: { componentId: 'u1', pinId: 'pin-5v' },
        endpointB: { componentId: 'ldr1', pinId: 'pin-1' },
        colour: '#ef4444'
      }
    ];

    // Forward duplicate
    expect(
      isDuplicateWire(
        wires,
        { componentId: 'u1', pinId: 'pin-5v' },
        { componentId: 'ldr1', pinId: 'pin-1' }
      )
    ).toBe(true);

    // Reverse duplicate
    expect(
      isDuplicateWire(
        wires,
        { componentId: 'ldr1', pinId: 'pin-1' },
        { componentId: 'u1', pinId: 'pin-5v' }
      )
    ).toBe(true);

    // Different pin is not duplicate
    expect(
      isDuplicateWire(
        wires,
        { componentId: 'u1', pinId: 'pin-3v3' },
        { componentId: 'ldr1', pinId: 'pin-1' }
      )
    ).toBe(false);
  });

  // Test 2: Multiple connections sharing one ground pin
  it('2. supports multiple connections sharing one ground pin into a single electrical net', () => {
    const circuit: Circuit = {
      components: [
        {
          id: 'u1',
          type: 'arduino-uno',
          label: 'U1',
          position: { x: 0, y: 0 },
          properties: {}
        },
        {
          id: 'r1',
          type: 'resistor',
          label: 'R1',
          position: { x: 0, y: 0 },
          properties: { resistance: 10000, unit: 'ohm' }
        },
        {
          id: 'led1',
          type: 'led',
          label: 'LED1',
          position: { x: 0, y: 0 },
          properties: { color: 'red' }
        }
      ],
      wires: [
        // Two separate wires both connecting to u1:pin-gnd-1
        {
          id: 'w1',
          endpointA: { componentId: 'r1', pinId: 'pin-2' },
          endpointB: { componentId: 'u1', pinId: 'pin-gnd-1' },
          colour: '#334155'
        },
        {
          id: 'w2',
          endpointA: { componentId: 'led1', pinId: 'cathode' },
          endpointB: { componentId: 'u1', pinId: 'pin-gnd-1' },
          colour: '#334155'
        }
      ]
    };

    const netlist = buildNetlist(circuit);
    expect(areTerminalsConnected(netlist, { componentId: 'r1', pinId: 'pin-2' }, { componentId: 'led1', pinId: 'cathode' })).toBe(true);
    expect(areTerminalsConnected(netlist, { componentId: 'r1', pinId: 'pin-2' }, { componentId: 'u1', pinId: 'pin-gnd-1' })).toBe(true);
  });

  // Test 3: A0 branching
  it('3. allows sensor branching at the A0 node to resistor R1', () => {
    const circuit = createReferenceCircuit();
    const netlist = buildNetlist(circuit);

    // LDR pin-2, Uno A0, and R1 pin-1 must all belong to the same net
    const ldrPin2Net = netlist.terminalToNetMap.get('ldr1:pin-2');
    const unoA0Net = netlist.terminalToNetMap.get('u1:pin-a0');
    const r1Pin1Net = netlist.terminalToNetMap.get('r1:pin-1');

    expect(ldrPin2Net).toBeDefined();
    expect(ldrPin2Net).toBe(unoA0Net);
    expect(ldrPin2Net).toBe(r1Pin1Net);
  });

  // Test 4: Resistor terminals remaining separate nets
  it('4. ensures passive resistor terminals remain separate nets when no wire connects them', () => {
    const circuit = createReferenceCircuit();
    const netlist = buildNetlist(circuit);

    const r1Pin1Net = netlist.terminalToNetMap.get('r1:pin-1');
    const r1Pin2Net = netlist.terminalToNetMap.get('r1:pin-2');

    // R1 pin-1 is the A0 node, R1 pin-2 is GND
    expect(r1Pin1Net).not.toBe(r1Pin2Net);
    expect(areTerminalsConnected(netlist, { componentId: 'r1', pinId: 'pin-1' }, { componentId: 'r1', pinId: 'pin-2' })).toBe(false);
  });

  // Test 5: Correct street-light topology passing
  it('5. validates that the complete reference street-light circuit passes with no errors', () => {
    const circuit = createReferenceCircuit();
    const generalRes = validateCircuit(circuit);
    const topRes = validateStreetLightTopology(circuit);

    expect(generalRes.isValid).toBe(true);
    expect(generalRes.diagnostics).toHaveLength(0);
    expect(topRes.isTopologyMatched).toBe(true);
    expect(topRes.readyForSimulation).toBe(true);
    expect(topRes.diagnostics).toHaveLength(0);
  });

  // Test 6: Each required connection removed independently causing a relevant diagnostic
  it('6. produces specific diagnostics when each of the 7 required connections is missing', () => {
    const baseCircuit = createReferenceCircuit();

    // 1. Remove 5V supply wire (w1)
    const no5V = { ...baseCircuit, wires: baseCircuit.wires.filter(w => w.id !== 'w1') };
    const resNo5V = validateStreetLightTopology(no5V);
    expect(resNo5V.isTopologyMatched).toBe(false);
    expect(resNo5V.diagnostics.some(d => d.code === 'LDR_MISSING_POWER')).toBe(true);

    // 2. Remove A0 sensor tap wire (w2)
    const noA0 = { ...baseCircuit, wires: baseCircuit.wires.filter(w => w.id !== 'w2') };
    const resNoA0 = validateStreetLightTopology(noA0);
    expect(resNoA0.diagnostics.some(d => d.code === 'LDR_MISSING_A0')).toBe(true);

    // 3. Remove divider tap wire (w3)
    const noDivider = { ...baseCircuit, wires: baseCircuit.wires.filter(w => w.id !== 'w3') };
    const resNoDivider = validateStreetLightTopology(noDivider);
    expect(resNoDivider.diagnostics.some(d => d.code === 'DIVIDER_RESISTOR_DISCONNECTED')).toBe(true);

    // 4. Remove divider ground wire (w4)
    const noGnd = { ...baseCircuit, wires: baseCircuit.wires.filter(w => w.id !== 'w4') };
    const resNoGnd = validateStreetLightTopology(noGnd);
    expect(resNoGnd.diagnostics.some(d => d.code === 'DIVIDER_RESISTOR_DISCONNECTED')).toBe(true);

    // 5. Remove D9 drive wire (w5)
    const noD9 = { ...baseCircuit, wires: baseCircuit.wires.filter(w => w.id !== 'w5') };
    const resNoD9 = validateStreetLightTopology(noD9);
    expect(resNoD9.diagnostics.some(d => d.code === 'LED_SERIES_RESISTOR_DISCONNECTED')).toBe(true);

    // 6. Remove LED series resistor wire (w6)
    const noR2Led = { ...baseCircuit, wires: baseCircuit.wires.filter(w => w.id !== 'w6') };
    const resNoR2Led = validateStreetLightTopology(noR2Led);
    expect(resNoR2Led.diagnostics.some(d => d.code === 'LED_SERIES_RESISTOR_DISCONNECTED')).toBe(true);

    // 7. Remove LED ground return (w7)
    const noLedGnd = { ...baseCircuit, wires: baseCircuit.wires.filter(w => w.id !== 'w7') };
    const resNoLedGnd = validateStreetLightTopology(noLedGnd);
    expect(resNoLedGnd.diagnostics.some(d => d.code === 'LED_CATHODE_DISCONNECTED')).toBe(true);
  });

  // Test 7: Reversed LED failing
  it('7. detects reversed LED polarity (anode to GND, cathode to D9)', () => {
    const circuit = createReferenceCircuit();
    // Swap LED anode and cathode connections
    circuit.wires = circuit.wires.map(w => {
      if (w.id === 'w6') {
        return { ...w, endpointB: { componentId: 'led1', pinId: 'cathode' } };
      }
      if (w.id === 'w7') {
        return { ...w, endpointA: { componentId: 'led1', pinId: 'anode' } };
      }
      return w;
    });

    const res = validateStreetLightTopology(circuit);
    expect(res.isTopologyMatched).toBe(false);
    expect(res.diagnostics.some(d => d.code === 'LED_REVERSED_POLARITY')).toBe(true);
  });

  // Test 8: Bypassed series resistor failing
  it('8. detects bypassed LED series resistor (D9 connected directly to LED anode)', () => {
    const circuit = createReferenceCircuit();
    // Connect D9 directly to LED anode, bypassing R2
    circuit.wires = circuit.wires.filter(w => w.id !== 'w5' && w.id !== 'w6');
    circuit.wires.push({
      id: 'w-bypass',
      endpointA: { componentId: 'u1', pinId: 'pin-d9' },
      endpointB: { componentId: 'led1', pinId: 'anode' },
      colour: '#ef4444'
    });

    const res = validateStreetLightTopology(circuit);
    expect(res.isTopologyMatched).toBe(false);
    expect(res.diagnostics.some(d => d.code === 'LED_BYPASSED_SERIES_RESISTOR')).toBe(true);
  });

  // Test 9: Supply-to-ground short detected through several wires
  it('9. detects direct 5V-to-GND shorts across intermediate wires', () => {
    const circuit = createReferenceCircuit();
    // Add short circuit wire: Uno 5V directly to Uno GND
    circuit.wires.push({
      id: 'w-short',
      endpointA: { componentId: 'u1', pinId: 'pin-5v' },
      endpointB: { componentId: 'u1', pinId: 'pin-gnd-1' },
      colour: '#ef4444'
    });

    const general = validateCircuit(circuit);
    expect(general.isValid).toBe(false);
    expect(general.diagnostics.some(d => d.code === 'SHORT_CIRCUIT_POWER_GND')).toBe(true);
  });

  // Test 10: Renamed components still validating
  it('10. validates reference topology successfully even when components are renamed', () => {
    const circuit = createReferenceCircuit();
    // Rename components from default labels to student labels
    circuit.components = circuit.components.map(c => {
      if (c.id === 'u1') return { ...c, label: 'MainController' };
      if (c.id === 'ldr1') return { ...c, label: 'PhotoSensor' };
      if (c.id === 'r1') return { ...c, label: 'DividerResistor' };
      if (c.id === 'r2') return { ...c, label: 'CurrentLimiter' };
      if (c.id === 'led1') return { ...c, label: 'StreetLightLamp' };
      return c;
    });

    const res = validateStreetLightTopology(circuit);
    expect(res.isTopologyMatched).toBe(true);
    expect(res.readyForSimulation).toBe(true);
    expect(res.diagnostics).toHaveLength(0);
  });

  // Test 11: Swapped passive-terminal order still validating
  it('11. accepts swapped terminal order on non-polarised resistors and LDR', () => {
    const circuit = createReferenceCircuit();
    // Swap terminals on R1: connect pin-2 to A0 and pin-1 to GND
    circuit.wires = circuit.wires.map(w => {
      if (w.id === 'w3') {
        return { ...w, endpointB: { componentId: 'r1', pinId: 'pin-2' } };
      }
      if (w.id === 'w4') {
        return { ...w, endpointA: { componentId: 'r1', pinId: 'pin-1' } };
      }
      return w;
    });

    const res = validateStreetLightTopology(circuit);
    expect(res.isTopologyMatched).toBe(true);
    expect(res.readyForSimulation).toBe(true);
  });

  // Test 12: Deleting a component removes its attached wires
  it('12. removes all attached wires when a component is deleted', () => {
    const store = useProjectStore.getState();
    store.loadStreetLightLayout(true);

    const initialWiresCount = useProjectStore.getState().project.circuit.wires.length;
    expect(initialWiresCount).toBe(7);

    // Delete LED component
    const ledComp = useProjectStore.getState().project.circuit.components.find(c => c.type === 'led');
    expect(ledComp).toBeDefined();

    store.deleteComponent(ledComp!.id);

    const stateAfter = useProjectStore.getState();
    expect(stateAfter.project.circuit.components.some(c => c.id === ledComp!.id)).toBe(false);

    // Wires connected to LED must be removed (w6 and w7)
    const remainingWires = stateAfter.project.circuit.wires;
    expect(remainingWires.some(w => w.endpointA.componentId === ledComp!.id || w.endpointB.componentId === ledComp!.id)).toBe(false);
    expect(remainingWires.length).toBe(5);
  });

  // Test 13: Moving a component preserves electrical endpoints
  it('13. preserves electrical endpoints and connectivity when a component is moved', () => {
    const store = useProjectStore.getState();
    store.loadStreetLightLayout(true);

    const uno = useProjectStore.getState().project.circuit.components.find(c => c.type === 'arduino-uno');
    expect(uno).toBeDefined();

    // Move Uno to new coordinates
    store.updateComponentPosition(uno!.id, { x: 999, y: 888 });

    const stateAfter = useProjectStore.getState();
    const updatedUno = stateAfter.project.circuit.components.find(c => c.id === uno!.id);
    expect(updatedUno?.position).toEqual({ x: 999, y: 888 });

    // Wires must remain intact and connect to the same pins
    const unoWires = stateAfter.project.circuit.wires.filter(
      w => w.endpointA.componentId === uno!.id || w.endpointB.componentId === uno!.id
    );
    expect(unoWires.length).toBe(5);
  });

  // Test 14: Invalid imported project leaves current state intact
  it('14. rejects invalid imported projects without mutating the current workspace', () => {
    const store = useProjectStore.getState();
    store.loadStreetLightLayout(true);
    const originalProject = JSON.parse(JSON.stringify(useProjectStore.getState().project));

    // Malformed JSON
    const malformedResult = store.importProject('{ invalid-json');
    expect(malformedResult.success).toBe(false);
    expect(useProjectStore.getState().project.id).toBe(originalProject.id);

    // Invalid schema / missing components
    const invalidSchemaResult = store.importProject(JSON.stringify({ schemaVersion: 999 }));
    expect(invalidSchemaResult.success).toBe(false);
    expect(useProjectStore.getState().project.circuit.components.length).toBe(originalProject.circuit.components.length);

    // Wire referencing non-existent component
    const badWireProject = {
      ...originalProject,
      circuit: {
        ...originalProject.circuit,
        wires: [
          {
            id: 'wire-bad',
            endpointA: { componentId: 'non-existent', pinId: 'pin-1' },
            endpointB: { componentId: 'neither', pinId: 'pin-2' },
            colour: '#ef4444'
          }
        ]
      }
    };
    const badWireResult = store.importProject(JSON.stringify(badWireProject));
    expect(badWireResult.success).toBe(false);
    expect(useProjectStore.getState().project.id).toBe(originalProject.id);
  });

  // Test 15: Export/import round trip preserves files, properties, and connectivity
  it('15. round-trips exported project through import preserving files, properties, and connectivity', () => {
    const store = useProjectStore.getState();
    store.loadStreetLightLayout(true);
    const current = useProjectStore.getState().project;

    // Export to JSON string
    const jsonStr = serializeProject(current);
    const validation = validateProjectImport(jsonStr);

    expect(validation.valid).toBe(true);
    expect(validation.project).toBeDefined();

    const restored = validation.project!;
    expect(restored.name).toBe(current.name);
    expect(restored.circuit.components.length).toBe(current.circuit.components.length);
    expect(restored.circuit.wires.length).toBe(current.circuit.wires.length);

    // Verify properties preservation
    const r1Orig = current.circuit.components.find(c => c.label === 'R1');
    const r1Restored = restored.circuit.components.find(c => c.label === 'R1');
    expect(r1Restored?.properties).toEqual(r1Orig?.properties);

    // Verify wire endpoints
    for (let i = 0; i < current.circuit.wires.length; i++) {
      expect(restored.circuit.wires[i].id).toBe(current.circuit.wires[i].id);
      expect(restored.circuit.wires[i].endpointA).toEqual(current.circuit.wires[i].endpointA);
      expect(restored.circuit.wires[i].endpointB).toEqual(current.circuit.wires[i].endpointB);
    }
  });
});
