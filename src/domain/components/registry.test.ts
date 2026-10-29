import { describe, it, expect } from 'vitest';
import {
  COMPONENT_REGISTRY,
  getComponentDefinition,
  getPlaceableComponents,
  filterComponents,
  generateNextInstanceLabel
} from './registry';
import {
  ResistorPropertiesSchema,
  LedPropertiesSchema,
  LdrPropertiesSchema
} from './schemas';

describe('Component Registry Integrity & Validation', () => {
  it('contains registered components', () => {
    expect(COMPONENT_REGISTRY.length).toBeGreaterThanOrEqual(15);
  });
  it('contains all required placeable components for the Street Light experiment', () => {
    const placeables = getPlaceableComponents();
    const placeableTypes = placeables.map(c => c.type);

    expect(placeableTypes).toContain('arduino-uno');
    expect(placeableTypes).toContain('esp32');
    expect(placeableTypes).toContain('resistor');
    expect(placeableTypes).toContain('led');
    expect(placeableTypes).toContain('ldr');
  });

  it('separates placeable visual components from catalog-only entries', () => {
    const uno = getComponentDefinition('arduino-uno');
    expect(uno?.isPlaceable).toBe(true);
    expect(uno?.supportLevel).toBe('visual-only');

    const button = getComponentDefinition('push-button');
    expect(button?.isPlaceable).toBe(false);
    expect(button?.supportLevel).toBe('catalog-only');

    const relay = getComponentDefinition('relay');
    expect(relay?.isPlaceable).toBe(false);
    expect(relay?.supportLevel).toBe('catalog-only');
  });

  it('generates sequential independent labels without collisions', () => {
    expect(generateNextInstanceLabel('resistor', [])).toBe('R1');
    expect(generateNextInstanceLabel('resistor', ['R1'])).toBe('R2');
    expect(generateNextInstanceLabel('resistor', ['R1', 'R2'])).toBe('R3');
    expect(generateNextInstanceLabel('led', ['LED1'])).toBe('LED2');
    expect(generateNextInstanceLabel('arduino-uno', [])).toBe('U1');
    expect(generateNextInstanceLabel('ldr', [])).toBe('LDR1');
  });

  it('validates resistor properties strictly', () => {
    // Valid 220 ohm
    const valid = ResistorPropertiesSchema.safeParse({ resistance: 220, unit: 'ohm' });
    expect(valid.success).toBe(true);

    // Valid 10k
    const valid10k = ResistorPropertiesSchema.safeParse({ resistance: 10000, unit: 'ohm' });
    expect(valid10k.success).toBe(true);

    // Negative resistance rejected
    const negative = ResistorPropertiesSchema.safeParse({ resistance: -50, unit: 'ohm' });
    expect(negative.success).toBe(false);

    // Zero resistance rejected
    const zero = ResistorPropertiesSchema.safeParse({ resistance: 0, unit: 'ohm' });
    expect(zero.success).toBe(false);

    // NaN / Infinity rejected
    const nanVal = ResistorPropertiesSchema.safeParse({ resistance: NaN, unit: 'ohm' });
    expect(nanVal.success).toBe(false);
    const infVal = ResistorPropertiesSchema.safeParse({ resistance: Infinity, unit: 'ohm' });
    expect(infVal.success).toBe(false);
  });

  it('validates LED properties and colors', () => {
    const validRed = LedPropertiesSchema.safeParse({ color: 'red', forwardVoltage: 2.0 });
    expect(validRed.success).toBe(true);

    const validBlue = LedPropertiesSchema.safeParse({ color: 'blue', forwardVoltage: 3.2 });
    expect(validBlue.success).toBe(true);

    const invalidColor = LedPropertiesSchema.safeParse({ color: 'purple', forwardVoltage: 2.0 });
    expect(invalidColor.success).toBe(false);
  });

  it('enforces LDR darkResistance > brightResistance > 0', () => {
    // Valid: 100k dark, 1k bright
    const valid = LdrPropertiesSchema.safeParse({ darkResistance: 100000, brightResistance: 1000 });
    expect(valid.success).toBe(true);

    // Inverted: dark <= bright must fail
    const inverted = LdrPropertiesSchema.safeParse({ darkResistance: 500, brightResistance: 2000 });
    expect(inverted.success).toBe(false);

    // Equal: dark == bright must fail
    const equal = LdrPropertiesSchema.safeParse({ darkResistance: 1000, brightResistance: 1000 });
    expect(equal.success).toBe(false);

    // Negative must fail
    const negative = LdrPropertiesSchema.safeParse({ darkResistance: -1000, brightResistance: -5000 });
    expect(negative.success).toBe(false);
  });

  it('filters components by search query and category', () => {
    const resistorResults = filterComponents('resistor', null);
    expect(resistorResults.some(c => c.type === 'resistor')).toBe(true);

    const sensorCategory = filterComponents('', 'Sensors');
    expect(sensorCategory.every(c => c.category === 'Sensors')).toBe(true);
    expect(sensorCategory.some(c => c.type === 'ldr')).toBe(true);

    const unmatched = filterComponents('xyznonexistent999', null);
    expect(unmatched.length).toBe(0);
  });
});
