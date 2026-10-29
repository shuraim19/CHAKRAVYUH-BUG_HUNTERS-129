import { z } from 'zod';

export const ResistorPropertiesSchema = z.object({
  resistance: z.number().positive('Resistance must be a positive finite number').finite('Resistance must be finite'),
  unit: z.enum(['ohm', 'kohm']).default('ohm')
});
export type ResistorProperties = z.infer<typeof ResistorPropertiesSchema>;

export const LedColorSchema = z.enum(['red', 'green', 'blue', 'yellow']);
export type LedColor = z.infer<typeof LedColorSchema>;

export const LedPropertiesSchema = z.object({
  color: LedColorSchema.default('red'),
  forwardVoltage: z.number().default(2.0)
});
export type LedProperties = z.infer<typeof LedPropertiesSchema>;

export const LdrPropertiesSchema = z.object({
  darkResistance: z.number().positive('Dark resistance must be a positive number').finite(),
  brightResistance: z.number().positive('Bright resistance must be a positive number').finite()
}).refine(data => data.darkResistance > data.brightResistance, {
  message: 'Dark resistance must be strictly greater than bright resistance.',
  path: ['darkResistance']
});
export type LdrProperties = z.infer<typeof LdrPropertiesSchema>;

export const ArduinoUnoPropertiesSchema = z.object({
  microcontroller: z.string().default('ATmega328P'),
  operatingVoltage: z.number().default(5.0),
  clockSpeed: z.string().default('16 MHz')
});
export type ArduinoUnoProperties = z.infer<typeof ArduinoUnoPropertiesSchema>;

export const Esp32PropertiesSchema = z.object({
  microcontroller: z.string().default('ESP32-WROOM-32'),
  operatingVoltage: z.number().default(3.3),
  clockSpeed: z.string().default('240 MHz')
});
export type Esp32Properties = z.infer<typeof Esp32PropertiesSchema>;

export const GenericCatalogPropertiesSchema = z.record(z.unknown());
