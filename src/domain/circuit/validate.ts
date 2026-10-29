import { Circuit, Diagnostic } from '../project/schema';
import { getComponentDefinition } from '../components/registry';
import { buildNetlist } from './netlist';
import { GeneralValidationResult } from './types';

export function validateCircuit(circuit: Circuit): GeneralValidationResult {
  const diagnostics: Diagnostic[] = [];
  const { components, wires } = circuit;

  const componentMap = new Map(components.map(c => [c.id, c]));

  // 1. Check Wire References & Structural Integrity
  const seenPairs = new Set<string>();

  for (const wire of wires) {
    const compA = componentMap.get(wire.endpointA.componentId);
    const compB = componentMap.get(wire.endpointB.componentId);

    // Missing component
    if (!compA || !compB) {
      diagnostics.push({
        id: `diag-wire-orphan-${wire.id}`,
        severity: 'error',
        code: 'WIRE_ORPHAN_ENDPOINT',
        message: `Wire references an unplaced or deleted component.`,
        wireIds: [wire.id]
      });
      continue;
    }

    const defA = getComponentDefinition(compA.type);
    const defB = getComponentDefinition(compB.type);

    const pinA = defA?.pins.find(p => p.id === wire.endpointA.pinId);
    const pinB = defB?.pins.find(p => p.id === wire.endpointB.pinId);

    // Missing pin
    if (!pinA || !pinB) {
      diagnostics.push({
        id: `diag-wire-invalid-pin-${wire.id}`,
        severity: 'error',
        code: 'WIRE_INVALID_PIN',
        message: `Wire references an invalid terminal on ${!pinA ? compA.label : compB.label}.`,
        wireIds: [wire.id],
        componentIds: [!pinA ? compA.id : compB.id]
      });
      continue;
    }

    // Pin connected to itself
    if (wire.endpointA.componentId === wire.endpointB.componentId && wire.endpointA.pinId === wire.endpointB.pinId) {
      diagnostics.push({
        id: `diag-wire-self-${wire.id}`,
        severity: 'error',
        code: 'WIRE_SELF_CONNECTION',
        message: `Terminal ${pinA.label} on ${compA.label} is connected directly to itself.`,
        wireIds: [wire.id],
        componentIds: [compA.id]
      });
      continue;
    }

    // Duplicate wire check (undirected)
    const key1 = `${wire.endpointA.componentId}:${wire.endpointA.pinId}`;
    const key2 = `${wire.endpointB.componentId}:${wire.endpointB.pinId}`;
    const pairKey = key1 < key2 ? `${key1}<->${key2}` : `${key2}<->${key1}`;

    if (seenPairs.has(pairKey)) {
      diagnostics.push({
        id: `diag-wire-dup-${wire.id}`,
        severity: 'warning',
        code: 'WIRE_DUPLICATE',
        message: `Redundant identical wire between ${compA.label} (${pinA.label}) and ${compB.label} (${pinB.label}).`,
        wireIds: [wire.id]
      });
    } else {
      seenPairs.add(pairKey);
    }
  }

  // 2. Build Netlist over current circuit
  const netlist = buildNetlist(components, wires);

  // 3. Electrical Checks on Derived Nets
  for (const net of netlist.nets) {
    let has5V = false;
    let has3V3 = false;
    let hasGnd = false;
    const powerComponentIds: string[] = [];
    const groundComponentIds: string[] = [];
    const activeDriverComponentIds: string[] = [];

    for (const t of net.terminals) {
      const comp = componentMap.get(t.componentId);
      const def = comp ? getComponentDefinition(comp.type) : undefined;
      const pin = def?.pins.find(p => p.id === t.pinId);

      if (!pin || !comp) continue;

      if (pin.id === 'pin-5v') {
        has5V = true;
        powerComponentIds.push(comp.id);
      } else if (pin.id === 'pin-3v3') {
        has3V3 = true;
        powerComponentIds.push(comp.id);
      } else if (pin.electricalRole === 'ground' || pin.id.includes('gnd')) {
        hasGnd = true;
        groundComponentIds.push(comp.id);
      }

      // Check for multiple dedicated outputs driving the same net (e.g. D9 + D10)
      if (pin.id.startsWith('pin-d') && pin.id !== 'pin-d0' && pin.id !== 'pin-d1') {
        // Known scenario-driven output
        activeDriverComponentIds.push(comp.id);
      }
    }

    // Direct 5V / 3V3 to GND short circuit check
    if ((has5V || has3V3) && hasGnd) {
      diagnostics.push({
        id: `diag-short-pwr-gnd-${net.id}`,
        severity: 'error',
        code: 'SHORT_CIRCUIT_POWER_GND',
        message: `Direct power-to-ground short circuit detected on net "${net.name}". Current path bypasses all resistance and will overload the power supply.`,
        componentIds: [...new Set([...powerComponentIds, ...groundComponentIds])]
      });
    }

    // Direct 5V to 3.3V rail conflict
    if (has5V && has3V3) {
      diagnostics.push({
        id: `diag-short-5v-3v3-${net.id}`,
        severity: 'error',
        code: 'CONFLICTING_POWER_RAILS',
        message: `Direct connection detected between 5V and 3.3V power rails on net "${net.name}". This will damage 3.3V logic components.`,
        componentIds: [...new Set(powerComponentIds)]
      });
    }
  }

  // 4. Component Properties Validation
  for (const comp of components) {
    const def = getComponentDefinition(comp.type);
    if (def) {
      const parse = def.propertySchema.safeParse(comp.properties);
      if (!parse.success) {
        diagnostics.push({
          id: `diag-prop-${comp.id}`,
          severity: 'error',
          code: 'COMPONENT_INVALID_PROPERTY',
          message: `Invalid configuration on ${comp.label} (${def.name}): ${parse.error.issues.map(i => i.message).join('; ')}`,
          componentIds: [comp.id]
        });
      }
    }
  }

  const isValid = !diagnostics.some(d => d.severity === 'error');

  return {
    isValid,
    diagnostics,
    netlist
  };
}
