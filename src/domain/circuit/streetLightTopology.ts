import { Circuit, Diagnostic } from '../project/schema';
import { buildNetlist } from './netlist';
import { StreetLightValidationResult, makeTerminalKey } from './types';

/**
 * Validates the Automatic Street Light reference circuit topology.
 */
export function validateStreetLightTopology(circuit: Circuit): StreetLightValidationResult {
  const diagnostics: Diagnostic[] = [];
  const { components, wires } = circuit;

  // 1. Component Resolution & Ambiguity Checks
  const unos = components.filter(c => c.type === 'arduino-uno');
  const ldrs = components.filter(c => c.type === 'ldr');
  const leds = components.filter(c => c.type === 'led');
  const resistors = components.filter(c => c.type === 'resistor');

  if (unos.length === 0) {
    diagnostics.push({
      id: 'diag-top-no-uno',
      severity: 'error',
      code: 'TOPOLOGY_MISSING_UNO',
      message: 'Automatic Street Light requires an Arduino Uno R3 on the workbench.'
    });
  } else if (unos.length > 1) {
    diagnostics.push({
      id: 'diag-top-multi-uno',
      severity: 'error',
      code: 'TOPOLOGY_AMBIGUOUS_BOARDS',
      message: `Ambiguous circuit: Found ${unos.length} Arduino Uno boards. Please keep a single board for this experiment.`,
      componentIds: unos.map(u => u.id)
    });
  }

  if (ldrs.length === 0) {
    diagnostics.push({
      id: 'diag-top-no-ldr',
      severity: 'error',
      code: 'TOPOLOGY_MISSING_LDR',
      message: 'Automatic Street Light requires a Photoresistor (LDR) sensor.'
    });
  } else if (ldrs.length > 1) {
    diagnostics.push({
      id: 'diag-top-multi-ldr',
      severity: 'error',
      code: 'TOPOLOGY_AMBIGUOUS_LDR',
      message: `Ambiguous circuit: Found ${ldrs.length} LDR sensors. Only one ambient light sensor is supported.`,
      componentIds: ldrs.map(l => l.id)
    });
  }

  if (leds.length === 0) {
    diagnostics.push({
      id: 'diag-top-no-led',
      severity: 'error',
      code: 'TOPOLOGY_MISSING_LED',
      message: 'Automatic Street Light requires a street lamp LED output.'
    });
  } else if (leds.length > 1) {
    diagnostics.push({
      id: 'diag-top-multi-led',
      severity: 'error',
      code: 'TOPOLOGY_AMBIGUOUS_LED',
      message: `Ambiguous circuit: Found ${leds.length} LEDs. Only one street light LED is supported.`,
      componentIds: leds.map(l => l.id)
    });
  }

  if (resistors.length < 2) {
    diagnostics.push({
      id: 'diag-top-insufficient-resistors',
      severity: 'error',
      code: 'TOPOLOGY_INSUFFICIENT_RESISTORS',
      message: `Found ${resistors.length} resistor(s). Two resistors are required: one 10 kΩ divider pull-down and one 220 Ω LED series limiter.`
    });
  }

  // If prerequisites fail, return early with structural diagnostics
  if (unos.length !== 1 || ldrs.length !== 1 || leds.length !== 1 || resistors.length < 2) {
    return {
      isTopologyMatched: false,
      readyForSimulation: false,
      diagnostics
    };
  }

  const uno = unos[0];
  const ldr = ldrs[0];
  const led = leds[0];

  const netlist = buildNetlist(components, wires);

  // Identify Ground net (all Uno GND pins belong to the Ground Net)
  const gndKeys = ['pin-gnd-1', 'pin-gnd-2', 'pin-gnd-3'].map(p => makeTerminalKey(uno.id, p));
  const gndNetId = netlist.terminalToNetMap.get(gndKeys[0]) ||
                   netlist.terminalToNetMap.get(gndKeys[1]) ||
                   netlist.terminalToNetMap.get(gndKeys[2]);

  // Identify 5V Power net
  const uno5VKey = makeTerminalKey(uno.id, 'pin-5v');
  const powerNetId = netlist.terminalToNetMap.get(uno5VKey);

  // Identify A0 Sensor net
  const unoA0Key = makeTerminalKey(uno.id, 'pin-a0');
  const sensorNetId = netlist.terminalToNetMap.get(unoA0Key);

  // Identify D9 LED Signal net
  const unoD9Key = makeTerminalKey(uno.id, 'pin-d9');
  const ledSignalNetId = netlist.terminalToNetMap.get(unoD9Key);

  // 2. Validate LDR Voltage Divider Connections
  const ldrPin1Key = makeTerminalKey(ldr.id, 'pin-1');
  const ldrPin2Key = makeTerminalKey(ldr.id, 'pin-2');

  const ldr1Net = netlist.terminalToNetMap.get(ldrPin1Key);
  const ldr2Net = netlist.terminalToNetMap.get(ldrPin2Key);

  let ldrPowerPin: string | null = null;
  let ldrDividerPin: string | null = null;

  if (ldr1Net && ldr1Net === powerNetId) {
    ldrPowerPin = 'pin-1';
    ldrDividerPin = 'pin-2';
  } else if (ldr2Net && ldr2Net === powerNetId) {
    ldrPowerPin = 'pin-2';
    ldrDividerPin = 'pin-1';
  } else {
    diagnostics.push({
      id: 'diag-ldr-no-power',
      severity: 'error',
      code: 'LDR_MISSING_POWER',
      message: 'Photoresistor (LDR) is not connected to Uno 5V power supply rail.',
      componentIds: [ldr.id, uno.id]
    });
  }

  // Check LDR divider terminal connection to A0
  if (ldrDividerPin) {
    const ldrDivKey = makeTerminalKey(ldr.id, ldrDividerPin);
    const ldrDivNet = netlist.terminalToNetMap.get(ldrDivKey);

    if (!ldrDivNet || ldrDivNet !== sensorNetId) {
      diagnostics.push({
        id: 'diag-ldr-no-a0',
        severity: 'error',
        code: 'LDR_MISSING_A0',
        message: 'LDR center tap is not connected to analog input A0.',
        componentIds: [ldr.id, uno.id]
      });
    }
  }

  // 3. Find and Validate the 10 kΩ Divider Pull-Down Resistor
  // The divider resistor connects between the sensorNetId (A0) and gndNetId
  let resolvedDividerResistor: typeof resistors[0] | null = null;
  let resolvedLedResistor: typeof resistors[0] | null = null;

  for (const r of resistors) {
    const rPin1Key = makeTerminalKey(r.id, 'pin-1');
    const rPin2Key = makeTerminalKey(r.id, 'pin-2');
    const rNet1 = netlist.terminalToNetMap.get(rPin1Key);
    const rNet2 = netlist.terminalToNetMap.get(rPin2Key);

    // Check if resistor is connected between A0 and GND
    const isConnectedToA0 = (rNet1 === sensorNetId) || (rNet2 === sensorNetId);
    const isConnectedToGnd = (rNet1 === gndNetId) || (rNet2 === gndNetId);

    if (isConnectedToA0 && isConnectedToGnd) {
      if (rNet1 === rNet2) {
        diagnostics.push({
          id: `diag-resistor-shorted-${r.id}`,
          severity: 'error',
          code: 'RESISTOR_TERMINALS_SHORTED',
          message: `Divider resistor ${r.label} has both terminals connected to the same net (shorted).`,
          componentIds: [r.id]
        });
      } else {
        resolvedDividerResistor = r;
      }
    }
  }

  if (!resolvedDividerResistor) {
    diagnostics.push({
      id: 'diag-divider-resistor-missing',
      severity: 'error',
      code: 'DIVIDER_RESISTOR_DISCONNECTED',
      message: 'Missing pull-down resistor between analog input A0 and GND. (Expected: 10 kΩ resistor).',
      componentIds: [uno.id]
    });
  } else {
    // Check resistance value for divider
    const val = resolvedDividerResistor.properties.resistance as number;
    if (val < 1000 || val > 100000) {
      diagnostics.push({
        id: `diag-divider-resistance-warn-${resolvedDividerResistor.id}`,
        severity: 'warning',
        code: 'DIVIDER_RESISTANCE_SUBOPTIMAL',
        message: `Divider resistor ${resolvedDividerResistor.label} is ${val} Ω. Recommended value is 10,000 Ω (10 kΩ) for optimal LDR daylight sensitivity.`,
        componentIds: [resolvedDividerResistor.id]
      });
    }
  }

  // 4. Validate LED Series Resistor and Drive Path from D9
  const ledAnodeKey = makeTerminalKey(led.id, 'anode');
  const ledCathodeKey = makeTerminalKey(led.id, 'cathode');
  const ledAnodeNet = netlist.terminalToNetMap.get(ledAnodeKey);
  const ledCathodeNet = netlist.terminalToNetMap.get(ledCathodeKey);

  // Check if series resistor is bypassed (anode or cathode directly on D9)
  if (ledAnodeNet === ledSignalNetId) {
    diagnostics.push({
      id: 'diag-led-bypassed-resistor',
      severity: 'error',
      code: 'LED_BYPASSED_SERIES_RESISTOR',
      message: `LED anode is connected directly to pin D9 without a current-limiting resistor! This causes overcurrent damage.`,
      componentIds: [led.id, uno.id]
    });
  }

  // Check for reversed LED polarity
  if (ledCathodeNet && ledCathodeNet === ledSignalNetId) {
    diagnostics.push({
      id: 'diag-led-reversed-d9',
      severity: 'error',
      code: 'LED_REVERSED_POLARITY',
      message: `LED cathode is wired towards pin D9. The LED is reversed and will not illuminate.`,
      componentIds: [led.id]
    });
  }

  // Find resistor in series between D9 and LED anode
  for (const r of resistors) {
    if (resolvedDividerResistor && r.id === resolvedDividerResistor.id) continue;

    const rPin1Key = makeTerminalKey(r.id, 'pin-1');
    const rPin2Key = makeTerminalKey(r.id, 'pin-2');
    const rNet1 = netlist.terminalToNetMap.get(rPin1Key);
    const rNet2 = netlist.terminalToNetMap.get(rPin2Key);

    const connectedToD9 = (rNet1 === ledSignalNetId) || (rNet2 === ledSignalNetId);
    const connectedToAnode = (rNet1 === ledAnodeNet) || (rNet2 === ledAnodeNet);

    if (connectedToD9 && connectedToAnode && ledAnodeNet) {
      if (rNet1 === rNet2) {
        diagnostics.push({
          id: `diag-led-resistor-shorted-${r.id}`,
          severity: 'error',
          code: 'RESISTOR_TERMINALS_SHORTED',
          message: `LED series resistor ${r.label} has both terminals connected to the same net.`,
          componentIds: [r.id]
        });
      } else {
        resolvedLedResistor = r;
      }
    }
  }

  if (!resolvedLedResistor && ledAnodeNet !== ledSignalNetId) {
    diagnostics.push({
      id: 'diag-led-resistor-missing',
      severity: 'error',
      code: 'LED_SERIES_RESISTOR_DISCONNECTED',
      message: 'Missing series current-limiting resistor between pin D9 and the LED anode. (Expected: 220 Ω resistor).',
      componentIds: [led.id, uno.id]
    });
  } else if (resolvedLedResistor) {
    const val = resolvedLedResistor.properties.resistance as number;
    if (val < 100) {
      diagnostics.push({
        id: `diag-led-resistance-low-${resolvedLedResistor.id}`,
        severity: 'warning',
        code: 'LED_RESISTANCE_LOW',
        message: `LED series resistor ${resolvedLedResistor.label} is only ${val} Ω. At least 220 Ω is recommended for safe LED current.`,
        componentIds: [resolvedLedResistor.id]
      });
    } else if (val > 2200) {
      diagnostics.push({
        id: `diag-led-resistance-high-${resolvedLedResistor.id}`,
        severity: 'warning',
        code: 'LED_RESISTANCE_HIGH',
        message: `LED series resistor ${resolvedLedResistor.label} is ${val} Ω. The street LED may appear very dim.`,
        componentIds: [resolvedLedResistor.id]
      });
    }
  }

  // Check LED Cathode connection to GND
  if (!ledCathodeNet || ledCathodeNet !== gndNetId) {
    // Check if anode was erroneously connected to GND (reversed)
    if (ledAnodeNet === gndNetId) {
      diagnostics.push({
        id: 'diag-led-reversed-gnd',
        severity: 'error',
        code: 'LED_REVERSED_POLARITY',
        message: 'LED anode (A/+) is wired to GND instead of cathode (K/-). Reverse the LED orientation.',
        componentIds: [led.id]
      });
    } else {
      diagnostics.push({
        id: 'diag-led-cathode-gnd',
        severity: 'error',
        code: 'LED_CATHODE_DISCONNECTED',
        message: 'LED cathode (K/-) is not connected to Uno GND ground rail.',
        componentIds: [led.id, uno.id]
      });
    }
  }

  const hasErrors = diagnostics.some(d => d.severity === 'error');
  const isTopologyMatched = !hasErrors &&
    !!resolvedDividerResistor &&
    !!resolvedLedResistor &&
    ldrPowerPin !== null;

  return {
    isTopologyMatched,
    readyForSimulation: isTopologyMatched,
    resolvedComponents: isTopologyMatched && resolvedDividerResistor && resolvedLedResistor
      ? {
          unoId: uno.id,
          ldrId: ldr.id,
          dividerResistorId: resolvedDividerResistor.id,
          ledResistorId: resolvedLedResistor.id,
          ledId: led.id
        }
      : undefined,
    resolvedNets: isTopologyMatched
      ? {
          powerNet: powerNetId || 'net-5v',
          groundNet: gndNetId || 'net-gnd',
          sensorDividerNet: sensorNetId || 'net-a0',
          ledSignalNet: ledSignalNetId || 'net-d9'
        }
      : undefined,
    diagnostics
  };
}
