import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateLdrResistance,
  calculateDividerVoltage,
  voltageToAdc,
  evaluateLedOutput,
  evaluateStreetLightSimulation,
  DEFAULT_THRESHOLD
} from './index';
import { useProjectStore } from '../../store/projectStore';
import { Circuit, ComponentInstance, Wire } from '../project/schema';

describe('Phase 4: Functional Electronics Simulation Engine', () => {
  describe('1. LDR & Voltage Divider Sensor Model', () => {
    it('calculates approximate LDR resistance conforming to exponential illumination model', () => {
      // R_LDR = 100000 * (1000 / 100000) ^ (light / 100)
      const rDark = calculateLdrResistance(0);
      const rMid = calculateLdrResistance(50);
      const rBright = calculateLdrResistance(100);

      expect(rDark).toBe(100000); // 100 kΩ at 0% light
      expect(rMid).toBe(10000);   // 10 kΩ at 50% light
      expect(rBright).toBe(1000);  // 1 kΩ at 100% light

      // Resistance must monotonically decrease as light increases
      expect(rDark).toBeGreaterThan(rMid);
      expect(rMid).toBeGreaterThan(rBright);
    });

    it('verifies bright light produces a higher A0 reading than darkness for the specified divider', () => {
      // Upper leg = LDR, Lower leg = 10k resistor
      const rDark = calculateLdrResistance(0);    // 100 kΩ
      const rBright = calculateLdrResistance(100); // 1 kΩ

      const vDark = calculateDividerVoltage(rDark, 10000, 5.0);
      const vBright = calculateDividerVoltage(rBright, 10000, 5.0);

      // Dark: 5V * 10k / (100k + 10k) = 0.4545 V
      // Bright: 5V * 10k / (1k + 10k) = 4.5455 V
      expect(vDark).toBeCloseTo(0.455, 2);
      expect(vBright).toBeCloseTo(4.545, 2);

      const adcDark = voltageToAdc(vDark, 5.0, 1023);
      const adcBright = voltageToAdc(vBright, 5.0, 1023);

      expect(adcDark).toBe(93);
      expect(adcBright).toBe(930);

      // Bright light reading MUST be strictly higher than darkness
      expect(adcBright).toBeGreaterThan(adcDark);
    });

    it('demonstrates darkness turns the LED ON and bright light turns the LED OFF', () => {
      const threshold = 512;

      // Darkness (0% light -> ADC 93 < 512)
      const darkAdc = 93;
      const darkOutput = evaluateLedOutput(darkAdc, threshold);
      expect(darkOutput.isDark).toBe(true);
      expect(darkOutput.ledState).toBe('ON');
      expect(darkOutput.d9Voltage).toBe(5.0);
      expect(darkOutput.ledCurrentMa).toBeGreaterThan(0); // ~8.2 mA

      // Bright light (100% light -> ADC 930 >= 512)
      const brightAdc = 930;
      const brightOutput = evaluateLedOutput(brightAdc, threshold);
      expect(brightOutput.isDark).toBe(false);
      expect(brightOutput.ledState).toBe('OFF');
      expect(brightOutput.d9Voltage).toBe(0.0);
      expect(brightOutput.ledCurrentMa).toBe(0.0);
    });

    it('demonstrates adjusting the threshold produces correct switching behavior', () => {
      // At 30% light:
      // R_LDR = 100000 * (0.01)^0.3 = 25119 Ω
      // V_A0 = 5 * 10000 / (25119 + 10000) = 1.4237 V
      // ADC = round((1.4237 / 5) * 1023) = 291
      const r30 = calculateLdrResistance(30);
      const v30 = calculateDividerVoltage(r30, 10000, 5.0);
      const adc30 = voltageToAdc(v30, 5.0, 1023);
      expect(adc30).toBe(291);

      // With default threshold (512), 291 < 512 -> LED ON
      const normalThresh = evaluateLedOutput(adc30, 512);
      expect(normalThresh.ledState).toBe('ON');

      // If user adjusts threshold down to 250 (more strict night requirement):
      // 291 >= 250 -> LED switches OFF
      const lowThresh = evaluateLedOutput(adc30, 250);
      expect(lowThresh.ledState).toBe('OFF');

      // If user adjusts threshold up to 700 (sensitive twilight):
      // 291 < 700 -> LED switches ON
      const highThresh = evaluateLedOutput(adc30, 700);
      expect(highThresh.ledState).toBe('ON');
    });
  });

  describe('2. Topology & Fault Validation Integration', () => {
    function buildReferenceCircuit(): Circuit {
      const components: ComponentInstance[] = [
        {
          id: 'u1',
          type: 'arduino-uno',
          label: 'U1',
          position: { x: 0, y: 0 },
          properties: { operatingVoltage: 5.0 }
        },
        {
          id: 'ldr1',
          type: 'ldr',
          label: 'LDR1',
          position: { x: 100, y: 0 },
          properties: { darkResistance: 100000, brightResistance: 1000 }
        },
        {
          id: 'r1',
          type: 'resistor',
          label: 'R1',
          position: { x: 100, y: 100 },
          properties: { resistance: 10000 } // 10 kΩ pull-down
        },
        {
          id: 'r2',
          type: 'resistor',
          label: 'R2',
          position: { x: 200, y: 0 },
          properties: { resistance: 220 } // 220 Ω limiter
        },
        {
          id: 'led1',
          type: 'led',
          label: 'LED1',
          position: { x: 200, y: 100 },
          properties: { color: 'white', forwardVoltage: 3.2 }
        }
      ];

      const wires: Wire[] = [
        { id: 'w1', endpointA: { componentId: 'u1', pinId: 'pin-5v' }, endpointB: { componentId: 'ldr1', pinId: 'pin-1' }, colour: '#ef4444' },
        { id: 'w2', endpointA: { componentId: 'ldr1', pinId: 'pin-2' }, endpointB: { componentId: 'u1', pinId: 'pin-a0' }, colour: '#06b6d4' },
        { id: 'w3', endpointA: { componentId: 'ldr1', pinId: 'pin-2' }, endpointB: { componentId: 'r1', pinId: 'pin-1' }, colour: '#06b6d4' },
        { id: 'w4', endpointA: { componentId: 'r1', pinId: 'pin-2' }, endpointB: { componentId: 'u1', pinId: 'pin-gnd-1' }, colour: '#334155' },
        { id: 'w5', endpointA: { componentId: 'u1', pinId: 'pin-d9' }, endpointB: { componentId: 'r2', pinId: 'pin-1' }, colour: '#eab308' },
        { id: 'w6', endpointA: { componentId: 'r2', pinId: 'pin-2' }, endpointB: { componentId: 'led1', pinId: 'anode' }, colour: '#eab308' },
        { id: 'w7', endpointA: { componentId: 'led1', pinId: 'cathode' }, endpointB: { componentId: 'u1', pinId: 'pin-gnd-2' }, colour: '#334155' }
      ];

      return { components, wires };
    }

    it('evaluates a valid reference topology successfully', () => {
      const circuit = buildReferenceCircuit();
      const evalResult = evaluateStreetLightSimulation(circuit, { ambientLight: 10, threshold: 512 });

      expect(evalResult.valid).toBe(true);
      expect(evalResult.topologyMatched).toBe(true);
      expect(evalResult.telemetry).toBeDefined();
      expect(evalResult.telemetry?.ledState).toBe('ON');
      expect(evalResult.telemetry?.d9Voltage).toBe(5.0);
    });

    it('detects missing LDR power connection and refuses simulation', () => {
      const circuit = buildReferenceCircuit();
      // Remove wire from 5V to LDR
      circuit.wires = circuit.wires.filter(w => w.id !== 'w1');

      const evalResult = evaluateStreetLightSimulation(circuit, { ambientLight: 10, threshold: 512 });
      expect(evalResult.valid).toBe(false);
      expect(evalResult.faultDiagnostic?.code).toBe('LDR_MISSING_POWER');
    });

    it('detects disconnected A0 analog input and refuses simulation', () => {
      const circuit = buildReferenceCircuit();
      // Remove wire connecting LDR center tap to Uno A0
      circuit.wires = circuit.wires.filter(w => w.id !== 'w2');

      const evalResult = evaluateStreetLightSimulation(circuit, { ambientLight: 10, threshold: 512 });
      expect(evalResult.valid).toBe(false);
      expect(evalResult.faultDiagnostic?.code).toBe('LDR_MISSING_A0');
    });

    it('detects missing 10 kΩ pull-down path and refuses simulation', () => {
      const circuit = buildReferenceCircuit();
      // Remove wire connecting R1 to GND
      circuit.wires = circuit.wires.filter(w => w.id !== 'w4');

      const evalResult = evaluateStreetLightSimulation(circuit, { ambientLight: 10, threshold: 512 });
      expect(evalResult.valid).toBe(false);
      expect(evalResult.faultDiagnostic?.code).toBe('DIVIDER_RESISTOR_DISCONNECTED');
    });

    it('detects reversed LED polarity and refuses simulation', () => {
      const circuit = buildReferenceCircuit();
      // Reverse LED: connect R2 to cathode instead of anode
      circuit.wires = circuit.wires.map(w => {
        if (w.id === 'w6') {
          return { ...w, endpointB: { componentId: 'led1', pinId: 'cathode' } };
        }
        if (w.id === 'w7') {
          return { ...w, endpointA: { componentId: 'led1', pinId: 'anode' } };
        }
        return w;
      });

      const evalResult = evaluateStreetLightSimulation(circuit, { ambientLight: 10, threshold: 512 });
      expect(evalResult.valid).toBe(false);
      expect(evalResult.faultDiagnostic?.code).toBe('LED_REVERSED_POLARITY');
    });

    it('detects bypassed series resistor (direct D9 to LED anode) and refuses simulation', () => {
      const circuit = buildReferenceCircuit();
      // Connect D9 directly to LED anode, bypassing R2
      circuit.wires = circuit.wires.filter(w => w.id !== 'w5' && w.id !== 'w6');
      circuit.wires.push({
        id: 'w-bypass',
        endpointA: { componentId: 'u1', pinId: 'pin-d9' },
        endpointB: { componentId: 'led1', pinId: 'anode' },
        colour: '#eab308'
      });

      const evalResult = evaluateStreetLightSimulation(circuit, { ambientLight: 10, threshold: 512 });
      expect(evalResult.valid).toBe(false);
      expect(evalResult.faultDiagnostic?.code).toBe('LED_BYPASSED_SERIES_RESISTOR');
    });

    it('detects direct 5V to GND power short circuit and refuses simulation', () => {
      const circuit = buildReferenceCircuit();
      // Add dangerous direct 5V to GND wire
      circuit.wires.push({
        id: 'w-short',
        endpointA: { componentId: 'u1', pinId: 'pin-5v' },
        endpointB: { componentId: 'u1', pinId: 'pin-gnd-3' },
        colour: '#f43f5e'
      });

      const evalResult = evaluateStreetLightSimulation(circuit, { ambientLight: 10, threshold: 512 });
      expect(evalResult.valid).toBe(false);
      expect(evalResult.faultDiagnostic?.code).toBe('SHORT_CIRCUIT_POWER_GND');
    });

    it('demonstrates that disconnecting a wire invalidates operation and reconnecting restores it', () => {
      const circuit = buildReferenceCircuit();

      // Step 1: Valid initial simulation
      let evalResult = evaluateStreetLightSimulation(circuit, { ambientLight: 15, threshold: 512 });
      expect(evalResult.valid).toBe(true);

      // Step 2: Student disconnects the LED cathode ground wire (w7)
      const removedWire = circuit.wires.find(w => w.id === 'w7')!;
      circuit.wires = circuit.wires.filter(w => w.id !== 'w7');

      evalResult = evaluateStreetLightSimulation(circuit, { ambientLight: 15, threshold: 512 });
      expect(evalResult.valid).toBe(false);
      expect(evalResult.faultDiagnostic?.code).toBe('LED_CATHODE_DISCONNECTED');

      // Step 3: Student repairs the connection
      circuit.wires.push(removedWire);

      evalResult = evaluateStreetLightSimulation(circuit, { ambientLight: 15, threshold: 512 });
      expect(evalResult.valid).toBe(true);
      expect(evalResult.telemetry?.ledState).toBe('ON');
    });

    it('does not falsely mark unsupported circuits as simulated', () => {
      // Circuit with only an Arduino and a potentiometer or random resistor
      const circuit: Circuit = {
        components: [
          { id: 'u1', type: 'arduino-uno', label: 'U1', position: { x: 0, y: 0 }, properties: {} },
          { id: 'r1', type: 'resistor', label: 'R1', position: { x: 50, y: 0 }, properties: { resistance: 1000 } }
        ],
        wires: [
          { id: 'w1', endpointA: { componentId: 'u1', pinId: 'pin-5v' }, endpointB: { componentId: 'r1', pinId: 'pin-1' }, colour: '#ef4444' }
        ]
      };

      const evalResult = evaluateStreetLightSimulation(circuit, { ambientLight: 20, threshold: 512 });
      expect(evalResult.valid).toBe(false);
      expect(evalResult.topologyMatched).toBe(false);
    });
  });

  describe('3. Project Store & Interactive Simulation Controls', () => {
    beforeEach(() => {
      useProjectStore.getState().initialize();
    });

    it('cannot start simulation when circuit is unwired', () => {
      const store = useProjectStore.getState();
      store.loadStreetLightLayout(false); // Unwired

      const startRes = store.startSimulation();
      expect(startRes.success).toBe(false);
      expect(useProjectStore.getState().simulationStatus).toBe('fault');
      expect(useProjectStore.getState().simulationFault).toBeDefined();
    });

    it('can start simulation when reference circuit is wired', () => {
      const store = useProjectStore.getState();
      store.loadStreetLightLayout(true); // Pre-wired reference

      const startRes = store.startSimulation();
      expect(startRes.success).toBe(true);
      expect(useProjectStore.getState().simulationStatus).toBe('running');
      expect(useProjectStore.getState().simulationTelemetry).toBeDefined();

      // Default ambient light is 20% (< 50% night) -> LED should be ON
      const telemetry = useProjectStore.getState().simulationTelemetry;
      expect(telemetry?.ledState).toBe('ON');
      expect(telemetry?.d9Voltage).toBe(5.0);
    });

    it('updates telemetry immediately when ambient light changes while running', () => {
      const store = useProjectStore.getState();
      store.loadStreetLightLayout(true);
      store.startSimulation();

      expect(useProjectStore.getState().simulationTelemetry?.ledState).toBe('ON');

      // Adjust to broad daylight (80% light)
      store.setAmbientLight(80);

      const updatedTelemetry = useProjectStore.getState().simulationTelemetry;
      expect(updatedTelemetry?.ambientLight).toBe(80);
      expect(updatedTelemetry?.adcValue).toBeGreaterThan(512);
      expect(updatedTelemetry?.ledState).toBe('OFF');
      expect(updatedTelemetry?.d9Voltage).toBe(0.0);
    });

    it('suspends simulation to fault state and turns off LED if wire is deleted during simulation', () => {
      const store = useProjectStore.getState();
      store.loadStreetLightLayout(true);
      store.startSimulation();

      expect(useProjectStore.getState().simulationStatus).toBe('running');

      // Delete the D9 output wire
      store.deleteWire('wire-5-d9-r2');

      const stateAfterDelete = useProjectStore.getState();
      expect(stateAfterDelete.simulationStatus).toBe('fault');
      expect(stateAfterDelete.simulationTelemetry?.ledState).toBe('OFF');
      expect(stateAfterDelete.simulationTelemetry?.d9Voltage).toBe(0.0);
      expect(stateAfterDelete.simulationFault).toBeDefined();
    });

    it('resumes simulation when missing wire is reconnected', () => {
      const store = useProjectStore.getState();
      store.loadStreetLightLayout(true);
      store.startSimulation();

      // Break connection
      store.deleteWire('wire-5-d9-r2');
      expect(useProjectStore.getState().simulationStatus).toBe('fault');

      // Repair connection: reconnect Uno D9 to R2 pin-1
      const addRes = store.addWire(
        { componentId: 'comp-arduino-uno-001', pinId: 'pin-d9' },
        { componentId: 'comp-resistor-220-002', pinId: 'pin-1' },
        '#eab308'
      );
      expect(addRes.success).toBe(true);

      // Simulation must automatically restore to 'running'
      expect(useProjectStore.getState().simulationStatus).toBe('running');
      expect(useProjectStore.getState().simulationFault).toBeNull();
      expect(useProjectStore.getState().simulationTelemetry?.ledState).toBe('ON');
    });

    it('handles stop and reset properly without modifying circuit components or wires', () => {
      const store = useProjectStore.getState();
      store.loadStreetLightLayout(true);
      store.startSimulation();

      const initialCompCount = useProjectStore.getState().project.circuit.components.length;
      const initialWireCount = useProjectStore.getState().project.circuit.wires.length;
      expect(initialCompCount).toBe(5);
      expect(initialWireCount).toBe(7);

      // Adjust light to 80%
      store.setAmbientLight(80);
      expect(useProjectStore.getState().simulationInputs.ambientLight).toBe(80);

      // Stop simulation
      store.stopSimulation();
      const stoppedState = useProjectStore.getState();
      expect(stoppedState.simulationStatus).toBe('stopped');
      expect(stoppedState.simulationTelemetry?.ledState).toBe('OFF');
      expect(stoppedState.simulationTelemetry?.d9Voltage).toBe(0.0);
      // Circuit design unchanged
      expect(stoppedState.project.circuit.components.length).toBe(initialCompCount);
      expect(stoppedState.project.circuit.wires.length).toBe(initialWireCount);

      // Reset simulation
      store.resetSimulation();
      const resetState = useProjectStore.getState();
      expect(resetState.simulationInputs.ambientLight).toBe(20);
      expect(resetState.simulationInputs.threshold).toBe(DEFAULT_THRESHOLD);
      // Circuit design still preserved
      expect(resetState.project.circuit.components.length).toBe(initialCompCount);
      expect(resetState.project.circuit.wires.length).toBe(initialWireCount);
    });
  });
});
