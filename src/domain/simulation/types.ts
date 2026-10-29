import { Diagnostic } from '../project/schema';

export type SimulationStatus = 'idle' | 'running' | 'fault' | 'stopped';

export interface StreetLightInputs {
  ambientLight: number; // 0 to 100 % (0 = Pitch dark, 100 = Full daylight)
  threshold: number;    // 0 to 1023 ADC count (default: 512)
}

export interface StreetLightTelemetry {
  ambientLight: number;       // 0 - 100 %
  ldrResistance: number;      // Ω (approximate, e.g. 100kΩ at 0% to 1kΩ at 100%)
  dividerVoltage: number;     // Volts (0.0 to 5.0 V at A0 node)
  adcValue: number;           // 0 to 1023
  threshold: number;          // 0 to 1023
  isDark: boolean;            // true if adcValue < threshold
  ledState: 'ON' | 'OFF';     // 'ON' when isDark, 'OFF' otherwise
  d9Voltage: number;          // 5.0 V when ON, 0.0 V when OFF
  ledCurrentMa: number;       // mA through series resistor (e.g. ~8.2 mA when ON, 0 mA when OFF)
  statusText: string;         // Human-readable status (e.g. "NIGHT (Lamp Active)" or "DAYLIGHT (Lamp Inactive)")
}

export interface SimulationEvaluationResult {
  valid: boolean;
  topologyMatched: boolean;
  faultDiagnostic?: Diagnostic;
  telemetry?: StreetLightTelemetry;
}
