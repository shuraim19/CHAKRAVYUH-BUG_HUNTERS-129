import { Circuit } from '../project/schema';
import { validateCircuit } from '../circuit/validate';
import { validateStreetLightTopology } from '../circuit/streetLightTopology';
import {
  StreetLightInputs,
  StreetLightTelemetry,
  SimulationEvaluationResult
} from './types';
import {
  calculateLdrResistance,
  calculateDividerVoltage,
  voltageToAdc,
  evaluateLedOutput,
  DEFAULT_THRESHOLD
} from './models/ldrModel';

/**
 * Core simulation evaluator for the Automatic Street Light experiment.
 *
 * Checks both electrical integrity (e.g. short circuits) and reference topology rules
 * (correct Uno R3, LDR divider node, series resistor, LED polarity, and ground return).
 */
export function evaluateStreetLightSimulation(
  circuit: Circuit,
  inputs: StreetLightInputs
): SimulationEvaluationResult {
  // 1. General electrical circuit validation (netlist, short circuits, orphan wires)
  const generalValidation = validateCircuit(circuit);
  const generalErrors = generalValidation.diagnostics.filter(d => d.severity === 'error');
  if (generalErrors.length > 0) {
    return {
      valid: false,
      topologyMatched: false,
      faultDiagnostic: generalErrors[0]
    };
  }

  // 2. Reference topology validation (specific Automatic Street Light circuit)
  const topologyValidation = validateStreetLightTopology(circuit);
  const topologyErrors = topologyValidation.diagnostics.filter(d => d.severity === 'error');
  if (topologyErrors.length > 0 || !topologyValidation.isTopologyMatched || !topologyValidation.resolvedComponents) {
    const specificFault =
      topologyErrors.find(d => d.code === 'LED_REVERSED_POLARITY') ||
      topologyErrors.find(d => d.code.includes('SHORT')) ||
      topologyErrors[0];

    const firstFault = specificFault || {
      id: 'diag-sim-topology-mismatch',
      severity: 'error' as const,
      code: 'TOPOLOGY_MISMATCH',
      message: 'Circuit does not match the supported Automatic Street Light topology.'
    };
    return {
      valid: false,
      topologyMatched: false,
      faultDiagnostic: firstFault
    };
  }

  const { resolvedComponents } = topologyValidation;
  const dividerResistor = circuit.components.find(c => c.id === resolvedComponents.dividerResistorId);
  const ledResistor = circuit.components.find(c => c.id === resolvedComponents.ledResistorId);
  const led = circuit.components.find(c => c.id === resolvedComponents.ledId);
  const ldr = circuit.components.find(c => c.id === resolvedComponents.ldrId);

  // Extract component physical parameters or defaults
  const rDivider = (dividerResistor?.properties.resistance as number) || 10000;
  const rLedSeries = (ledResistor?.properties.resistance as number) || 220;
  const forwardVoltage = (led?.properties.forwardVoltage as number) || 3.2;
  const rDark = (ldr?.properties.darkResistance as number) || 100000;
  const rBright = (ldr?.properties.brightResistance as number) || 1000;

  // 3. Compute LDR resistance based on ambient illumination
  const lightPct = Math.max(0, Math.min(100, inputs.ambientLight));
  const ldrResistance = calculateLdrResistance(lightPct, rDark, rBright);

  // 4. Compute voltage divider potential at A0
  const dividerVoltage = calculateDividerVoltage(ldrResistance, rDivider, 5.0);

  // 5. Convert analog voltage to 10-bit ADC count
  const adcValue = voltageToAdc(dividerVoltage, 5.0, 1023);

  // 6. Evaluate LED driver output based on threshold
  const threshold = typeof inputs.threshold === 'number' ? Math.max(0, Math.min(1023, inputs.threshold)) : DEFAULT_THRESHOLD;
  const ledOutput = evaluateLedOutput(adcValue, threshold, rLedSeries, forwardVoltage);

  const statusText = ledOutput.isDark
    ? `NIGHT (ADC: ${adcValue} < ${threshold}) -> Lamp ON`
    : `DAYLIGHT (ADC: ${adcValue} >= ${threshold}) -> Lamp OFF`;

  const telemetry: StreetLightTelemetry = {
    ambientLight: lightPct,
    ldrResistance,
    dividerVoltage,
    adcValue,
    threshold,
    isDark: ledOutput.isDark,
    ledState: ledOutput.ledState,
    d9Voltage: ledOutput.d9Voltage,
    ledCurrentMa: ledOutput.ledCurrentMa,
    statusText
  };

  return {
    valid: true,
    topologyMatched: true,
    telemetry
  };
}
