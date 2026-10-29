import { Diagnostic } from '../project/schema';

export type TerminalKey = string; // format: `${componentId}:${pinId}`

export function makeTerminalKey(componentId: string, pinId: string): TerminalKey {
  return `${componentId}:${pinId}`;
}

export function parseTerminalKey(key: TerminalKey): { componentId: string; pinId: string } {
  const colonIndex = key.indexOf(':');
  if (colonIndex === -1) {
    return { componentId: key, pinId: '' };
  }
  return {
    componentId: key.slice(0, colonIndex),
    pinId: key.slice(colonIndex + 1)
  };
}

export interface ElectricalNet {
  id: string;
  name: string;
  terminals: Array<{ componentId: string; pinId: string }>;
  isPowerRail: boolean;
  isGroundRail: boolean;
  nominalVoltage?: number;
}

export interface Netlist {
  nets: ElectricalNet[];
  terminalToNetMap: Map<TerminalKey, string>; // TerminalKey -> netId
}

export interface GeneralValidationResult {
  isValid: boolean;
  diagnostics: Diagnostic[];
  netlist: Netlist;
}

export interface StreetLightValidationResult {
  isTopologyMatched: boolean;
  readyForSimulation: boolean;
  resolvedComponents?: {
    unoId: string;
    ldrId: string;
    dividerResistorId: string;
    ledResistorId: string;
    ledId: string;
  };
  resolvedNets?: {
    powerNet: string;
    groundNet: string;
    sensorDividerNet: string;
    ledSignalNet: string;
  };
  diagnostics: Diagnostic[];
}
