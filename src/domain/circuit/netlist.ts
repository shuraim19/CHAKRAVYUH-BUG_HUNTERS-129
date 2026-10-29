import { ComponentInstance, Wire, Circuit } from '../project/schema';
import { getComponentDefinition } from '../components/registry';
import {
  TerminalKey,
  ElectricalNet,
  Netlist,
  makeTerminalKey,
  parseTerminalKey
} from './types';

/**
 * Union-Find (Disjoint-Set) data structure with path compression and rank heuristics.
 */
export class UnionFind {
  private parent = new Map<TerminalKey, TerminalKey>();
  private rank = new Map<TerminalKey, number>();

  find(key: TerminalKey): TerminalKey {
    if (!this.parent.has(key)) {
      this.parent.set(key, key);
      this.rank.set(key, 0);
      return key;
    }
    const p = this.parent.get(key)!;
    if (p !== key) {
      const root = this.find(p);
      this.parent.set(key, root);
      return root;
    }
    return key;
  }

  union(keyA: TerminalKey, keyB: TerminalKey): void {
    const rootA = this.find(keyA);
    const rootB = this.find(keyB);
    if (rootA === rootB) return;

    const rankA = this.rank.get(rootA) || 0;
    const rankB = this.rank.get(rootB) || 0;

    if (rankA < rankB) {
      this.parent.set(rootA, rootB);
    } else if (rankA > rankB) {
      this.parent.set(rootB, rootA);
    } else {
      this.parent.set(rootB, rootA);
      this.rank.set(rootA, rankA + 1);
    }
  }

  connected(keyA: TerminalKey, keyB: TerminalKey): boolean {
    return this.find(keyA) === this.find(keyB);
  }

  getAllRoots(): Map<TerminalKey, TerminalKey[]> {
    const groups = new Map<TerminalKey, TerminalKey[]>();
    for (const key of this.parent.keys()) {
      const root = this.find(key);
      const list = groups.get(root) || [];
      list.push(key);
      groups.set(root, list);
    }
    return groups;
  }
}

/**
 * Checks whether an identical connection already exists (undirected check).
 */
export function isDuplicateWire(
  wires: Wire[],
  endpointA: { componentId: string; pinId: string },
  endpointB: { componentId: string; pinId: string }
): boolean {
  for (const w of wires) {
    const forwardMatch =
      w.endpointA.componentId === endpointA.componentId &&
      w.endpointA.pinId === endpointA.pinId &&
      w.endpointB.componentId === endpointB.componentId &&
      w.endpointB.pinId === endpointB.pinId;

    const reverseMatch =
      w.endpointA.componentId === endpointB.componentId &&
      w.endpointA.pinId === endpointB.pinId &&
      w.endpointB.componentId === endpointA.componentId &&
      w.endpointB.pinId === endpointA.pinId;

    if (forwardMatch || reverseMatch) {
      return true;
    }
  }
  return false;
}

/**
 * Builds electrical nets across explicit wire endpoints.
 * Crucial rule: Terminals connected by ideal wires merge into the same Net.
 * Terminals on discrete components (resistors, LEDs, LDRs) do NOT merge together.
 * Common PCB ground planes on microcontrollers (Uno GND-1, GND-2, GND-3) merge together.
 */
export function buildNetlist(
  circuitOrComponents: Circuit | ComponentInstance[],
  maybeWires?: Wire[]
): Netlist {
  const components: ComponentInstance[] = Array.isArray(circuitOrComponents)
    ? circuitOrComponents
    : circuitOrComponents.components;

  const wires: Wire[] = Array.isArray(circuitOrComponents)
    ? maybeWires || []
    : circuitOrComponents.wires;

  const uf = new UnionFind();
  const validComponentIds = new Set(components.map(c => c.id));

  // 1. Initialize each valid component pin as an individual terminal in the graph
  for (const comp of components) {
    const def = getComponentDefinition(comp.type);
    if (def) {
      for (const pin of def.pins) {
        uf.find(makeTerminalKey(comp.id, pin.id));
      }

      // Board internal ground plane: GND pins on the same MCU board are tied internally
      if (comp.type === 'arduino-uno' || comp.type === 'esp32') {
        const gndPins = def.pins.filter(p => p.electricalRole === 'ground');
        if (gndPins.length > 1) {
          const firstKey = makeTerminalKey(comp.id, gndPins[0].id);
          for (let i = 1; i < gndPins.length; i++) {
            uf.union(firstKey, makeTerminalKey(comp.id, gndPins[i].id));
          }
        }
      }
    }
  }

  // 2. Merge terminals connected by each wire
  for (const wire of wires) {
    if (
      validComponentIds.has(wire.endpointA.componentId) &&
      validComponentIds.has(wire.endpointB.componentId)
    ) {
      const keyA = makeTerminalKey(wire.endpointA.componentId, wire.endpointA.pinId);
      const keyB = makeTerminalKey(wire.endpointB.componentId, wire.endpointB.pinId);
      uf.union(keyA, keyB);
    }
  }

  const groups = uf.getAllRoots();
  const nets: ElectricalNet[] = [];
  const terminalToNetMap = new Map<TerminalKey, string>();

  let netIndex = 1;
  for (const [, terminalKeys] of groups.entries()) {
    if (terminalKeys.length === 0) continue;

    const terminals = terminalKeys.map(k => parseTerminalKey(k));

    // Determine semantic net name and power/ground attributes
    let isPowerRail = false;
    let isGroundRail = false;
    let nominalVoltage: number | undefined;
    let suggestedName = '';

    for (const t of terminals) {
      const comp = components.find(c => c.id === t.componentId);
      const def = comp ? getComponentDefinition(comp.type) : undefined;
      const pin = def?.pins.find(p => p.id === t.pinId);

      if (pin) {
        if (pin.electricalRole === 'ground' || pin.id.includes('gnd')) {
          isGroundRail = true;
          suggestedName = 'GND';
        } else if (pin.id === 'pin-5v') {
          isPowerRail = true;
          nominalVoltage = 5.0;
          if (!suggestedName) suggestedName = '5V';
        } else if (pin.id === 'pin-3v3') {
          isPowerRail = true;
          nominalVoltage = 3.3;
          if (!suggestedName) suggestedName = '3V3';
        } else if (pin.id === 'pin-a0') {
          if (!suggestedName) suggestedName = 'A0_SENSE';
        } else if (pin.id === 'pin-d9') {
          if (!suggestedName) suggestedName = 'D9_PWM';
        }
      }
    }

    const netId = `net-${netIndex}`;
    const netName = suggestedName || `NET_${netIndex}`;
    netIndex++;

    const net: ElectricalNet = {
      id: netId,
      name: netName,
      terminals,
      isPowerRail,
      isGroundRail,
      nominalVoltage
    };

    nets.push(net);

    for (const k of terminalKeys) {
      terminalToNetMap.set(k, netId);
    }
  }

  return {
    nets,
    terminalToNetMap
  };
}

export function areTerminalsConnected(
  netlist: Netlist,
  termA: TerminalKey | { componentId: string; pinId: string },
  termB: TerminalKey | { componentId: string; pinId: string }
): boolean {
  const keyA = typeof termA === 'string' ? termA : makeTerminalKey(termA.componentId, termA.pinId);
  const keyB = typeof termB === 'string' ? termB : makeTerminalKey(termB.componentId, termB.pinId);
  const netA = netlist.terminalToNetMap.get(keyA);
  const netB = netlist.terminalToNetMap.get(keyB);
  return !!netA && netA === netB;
}

export function getTerminalNet(
  netlist: Netlist,
  componentId: string,
  pinId: string
): ElectricalNet | undefined {
  const key = makeTerminalKey(componentId, pinId);
  const netId = netlist.terminalToNetMap.get(key);
  return netlist.nets.find(n => n.id === netId);
}
