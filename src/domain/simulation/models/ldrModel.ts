/**
 * Mathematical model for Photoresistor (LDR) and Voltage Divider simulation.
 *
 * Implements the deterministic educational approximation specified in Phase 4:
 *   R_LDR = 100000 * (1000 / 100000) ^ (lightPercentage / 100)
 *
 * Connected with a 10 kΩ pull-down resistor:
 *   V_A0 = V_supply * R_div / (R_LDR + R_div)
 *   ADC = round((V_A0 / V_ref) * 1023)
 */

export const LDR_DARK_RESISTANCE = 100000;   // 100 kΩ at 0% illumination
export const LDR_BRIGHT_RESISTANCE = 1000;   // 1 kΩ at 100% illumination
export const DEFAULT_SUPPLY_VOLTAGE = 5.0;   // Uno 5V rail
export const DEFAULT_ADC_RESOLUTION = 1023;  // 10-bit ATmega328P ADC
export const DEFAULT_THRESHOLD = 512;        // Reference midpoint threshold

/**
 * Calculates approximate LDR resistance given an ambient illumination percentage [0, 100].
 */
export function calculateLdrResistance(
  lightPercentage: number,
  rDark: number = LDR_DARK_RESISTANCE,
  rBright: number = LDR_BRIGHT_RESISTANCE
): number {
  const clampedLight = Math.max(0, Math.min(100, lightPercentage));
  const ratio = rBright / rDark;
  const exponent = clampedLight / 100;
  const resistance = rDark * Math.pow(ratio, exponent);

  // Clamp resistance within valid physical limits
  return Math.max(rBright, Math.min(rDark, Math.round(resistance)));
}

/**
 * Calculates voltage at center divider tap (A0) with an LDR in the upper leg
 * and a pull-down resistor to GND in the lower leg.
 */
export function calculateDividerVoltage(
  rLdr: number,
  rDivider: number = 10000,
  vSupply: number = DEFAULT_SUPPLY_VOLTAGE
): number {
  if (rDivider <= 0) return 0;
  if (rLdr <= 0) return vSupply;

  const vA0 = (vSupply * rDivider) / (rLdr + rDivider);
  return Math.max(0, Math.min(vSupply, Number(vA0.toFixed(4))));
}

/**
 * Converts analog voltage (0 - 5V) to 10-bit integer ADC counts (0 - 1023).
 */
export function voltageToAdc(
  voltage: number,
  vRef: number = DEFAULT_SUPPLY_VOLTAGE,
  resolution: number = DEFAULT_ADC_RESOLUTION
): number {
  if (voltage <= 0) return 0;
  if (voltage >= vRef) return resolution;

  const rawAdc = Math.round((voltage / vRef) * resolution);
  return Math.max(0, Math.min(resolution, rawAdc));
}

/**
 * Evaluates simulated LED state and D9 pin output voltage given ADC reading and darkness threshold.
 */
export function evaluateLedOutput(
  adcValue: number,
  threshold: number = DEFAULT_THRESHOLD,
  rSeries: number = 220,
  ledForwardVoltage: number = 3.2
): {
  isDark: boolean;
  ledState: 'ON' | 'OFF';
  d9Voltage: number;
  ledCurrentMa: number;
} {
  const isDark = adcValue < threshold;

  if (isDark) {
    // LED illuminates: D9 driven HIGH (5.0V)
    const effectiveDrop = Math.max(0, DEFAULT_SUPPLY_VOLTAGE - ledForwardVoltage);
    const currentMa = rSeries > 0 ? (effectiveDrop / rSeries) * 1000 : 0;

    return {
      isDark: true,
      ledState: 'ON',
      d9Voltage: DEFAULT_SUPPLY_VOLTAGE,
      ledCurrentMa: Number(currentMa.toFixed(1))
    };
  }

  // LED unlit: D9 driven LOW (0.0V)
  return {
    isDark: false,
    ledState: 'OFF',
    d9Voltage: 0.0,
    ledCurrentMa: 0.0
  };
}
