import { ComponentDefinition } from './types';
import {
  ResistorPropertiesSchema,
  LedPropertiesSchema,
  LdrPropertiesSchema,
  ArduinoUnoPropertiesSchema,
  Esp32PropertiesSchema,
  GenericCatalogPropertiesSchema
} from './schemas';

export const COMPONENT_REGISTRY: ComponentDefinition[] = [
  // 1. Arduino Uno R3 (Placeable, Visual-only)
  {
    type: 'arduino-uno',
    name: 'Arduino Uno R3',
    category: 'Boards',
    description: 'ATmega328P microcontroller board with 14 digital I/O pins, 6 analog inputs, 5V regulator and 16 MHz crystal.',
    prefix: 'U',
    isPlaceable: true,
    supportLevel: 'visual-only',
    supportedScenarios: ['street-light-demo'],
    keywords: ['arduino', 'uno', 'atmega328p', 'microcontroller', 'board', 'mcu'],
    defaultProperties: {
      microcontroller: 'ATmega328P',
      operatingVoltage: 5.0,
      clockSpeed: '16 MHz'
    },
    propertySchema: ArduinoUnoPropertiesSchema,
    pins: [
      // Power & Control
      { id: 'pin-5v', label: '5V', electricalRole: 'power', supportedSignalTypes: ['dc_power'], nominalVoltage: 5.0 },
      { id: 'pin-3v3', label: '3V3', electricalRole: 'power', supportedSignalTypes: ['dc_power'], nominalVoltage: 3.3 },
      { id: 'pin-gnd-1', label: 'GND', electricalRole: 'ground', supportedSignalTypes: ['ground'], nominalVoltage: 0.0 },
      { id: 'pin-gnd-2', label: 'GND', electricalRole: 'ground', supportedSignalTypes: ['ground'], nominalVoltage: 0.0 },
      { id: 'pin-vin', label: 'VIN', electricalRole: 'power', supportedSignalTypes: ['dc_power'], nominalVoltage: 9.0 },
      { id: 'pin-reset', label: 'RESET', electricalRole: 'passive', supportedSignalTypes: ['digital_logic'] },
      // Analog Inputs
      { id: 'pin-a0', label: 'A0', electricalRole: 'analog_in', supportedSignalTypes: ['analog_voltage'] },
      { id: 'pin-a1', label: 'A1', electricalRole: 'analog_in', supportedSignalTypes: ['analog_voltage'] },
      { id: 'pin-a2', label: 'A2', electricalRole: 'analog_in', supportedSignalTypes: ['analog_voltage'] },
      { id: 'pin-a3', label: 'A3', electricalRole: 'analog_in', supportedSignalTypes: ['analog_voltage'] },
      { id: 'pin-a4', label: 'A4', electricalRole: 'analog_in', supportedSignalTypes: ['analog_voltage'] },
      { id: 'pin-a5', label: 'A5', electricalRole: 'analog_in', supportedSignalTypes: ['analog_voltage'] },
      // Digital I/O (D0/RX to D13)
      { id: 'pin-d0', label: 'D0 (RX)', electricalRole: 'digital_io', supportedSignalTypes: ['digital_logic'] },
      { id: 'pin-d1', label: 'D1 (TX)', electricalRole: 'digital_io', supportedSignalTypes: ['digital_logic'] },
      { id: 'pin-d2', label: 'D2', electricalRole: 'digital_io', supportedSignalTypes: ['digital_logic'] },
      { id: 'pin-d3', label: 'D3 (~)', electricalRole: 'digital_io', supportedSignalTypes: ['digital_logic'] },
      { id: 'pin-d4', label: 'D4', electricalRole: 'digital_io', supportedSignalTypes: ['digital_logic'] },
      { id: 'pin-d5', label: 'D5 (~)', electricalRole: 'digital_io', supportedSignalTypes: ['digital_logic'] },
      { id: 'pin-d6', label: 'D6 (~)', electricalRole: 'digital_io', supportedSignalTypes: ['digital_logic'] },
      { id: 'pin-d7', label: 'D7', electricalRole: 'digital_io', supportedSignalTypes: ['digital_logic'] },
      { id: 'pin-d8', label: 'D8', electricalRole: 'digital_io', supportedSignalTypes: ['digital_logic'] },
      { id: 'pin-d9', label: 'D9 (~)', electricalRole: 'digital_io', supportedSignalTypes: ['digital_logic'] },
      { id: 'pin-d10', label: 'D10 (~)', electricalRole: 'digital_io', supportedSignalTypes: ['digital_logic'] },
      { id: 'pin-d11', label: 'D11 (~)', electricalRole: 'digital_io', supportedSignalTypes: ['digital_logic'] },
      { id: 'pin-d12', label: 'D12', electricalRole: 'digital_io', supportedSignalTypes: ['digital_logic'] },
      { id: 'pin-d13', label: 'D13 (LED)', electricalRole: 'digital_io', supportedSignalTypes: ['digital_logic'] },
      { id: 'pin-gnd-3', label: 'GND', electricalRole: 'ground', supportedSignalTypes: ['ground'], nominalVoltage: 0.0 },
      { id: 'pin-aref', label: 'AREF', electricalRole: 'passive', supportedSignalTypes: ['analog_voltage'] }
    ]
  },

  // 2. ESP32 DevKit (Placeable, Visual-only)
  {
    type: 'esp32',
    name: 'ESP32 DevKit',
    category: 'Boards',
    description: 'Dual-core Xtensa 32-bit LX6 microcontroller with integrated Wi-Fi and Bluetooth. Simplified pinout view.',
    prefix: 'MCU',
    isPlaceable: true,
    supportLevel: 'visual-only',
    supportedScenarios: [],
    keywords: ['esp32', 'espressif', 'wifi', 'bluetooth', 'iot', 'mcu', 'board'],
    defaultProperties: {
      microcontroller: 'ESP32-WROOM-32',
      operatingVoltage: 3.3,
      clockSpeed: '240 MHz'
    },
    propertySchema: Esp32PropertiesSchema,
    pins: [
      { id: 'pin-3v3', label: '3V3', electricalRole: 'power', supportedSignalTypes: ['dc_power'], nominalVoltage: 3.3 },
      { id: 'pin-gnd', label: 'GND', electricalRole: 'ground', supportedSignalTypes: ['ground'], nominalVoltage: 0.0 },
      { id: 'pin-gpio18', label: 'GPIO18', electricalRole: 'digital_io', supportedSignalTypes: ['digital_logic'] },
      { id: 'pin-gpio19', label: 'GPIO19', electricalRole: 'digital_io', supportedSignalTypes: ['digital_logic'] },
      { id: 'pin-gpio21', label: 'GPIO21', electricalRole: 'digital_io', supportedSignalTypes: ['digital_logic'] },
      { id: 'pin-gpio22', label: 'GPIO22', electricalRole: 'digital_io', supportedSignalTypes: ['digital_logic'] },
      { id: 'pin-gpio23', label: 'GPIO23', electricalRole: 'digital_io', supportedSignalTypes: ['digital_logic'] },
      { id: 'pin-gpio34', label: 'GPIO34 (Input only)', electricalRole: 'digital_in', supportedSignalTypes: ['digital_logic'] }
    ]
  },

  // 3. Resistor (Placeable, Visual-only)
  {
    type: 'resistor',
    name: 'Resistor',
    category: 'Passive components',
    description: 'Two-terminal passive component that resists electric current flow to protect LEDs and bias sensor circuits.',
    prefix: 'R',
    isPlaceable: true,
    supportLevel: 'visual-only',
    supportedScenarios: ['street-light-demo'],
    keywords: ['resistor', 'resistance', 'passive', 'ohm', 'divider'],
    defaultProperties: {
      resistance: 220,
      unit: 'ohm'
    },
    propertySchema: ResistorPropertiesSchema,
    pins: [
      { id: 'pin-1', label: '1', electricalRole: 'passive', supportedSignalTypes: ['passive_resistance'] },
      { id: 'pin-2', label: '2', electricalRole: 'passive', supportedSignalTypes: ['passive_resistance'] }
    ]
  },

  // 4. LED (Placeable, Visual-only)
  {
    type: 'led',
    name: 'LED (Light Emitting Diode)',
    category: 'Outputs',
    description: 'Polarized light emitter. Current flows from anode (A/+) to cathode (K/-). Always use with a series resistor.',
    prefix: 'LED',
    isPlaceable: true,
    supportLevel: 'visual-only',
    supportedScenarios: ['street-light-demo'],
    keywords: ['led', 'diode', 'light', 'output', 'indicator', 'lamp'],
    defaultProperties: {
      color: 'red',
      forwardVoltage: 2.0
    },
    propertySchema: LedPropertiesSchema,
    pins: [
      { id: 'anode', label: 'Anode (+)', electricalRole: 'passive', supportedSignalTypes: ['digital_logic', 'dc_power'] },
      { id: 'cathode', label: 'Cathode (-)', electricalRole: 'passive', supportedSignalTypes: ['ground'] }
    ]
  },

  // 5. LDR (Placeable, Visual-only)
  {
    type: 'ldr',
    name: 'Photoresistor (LDR)',
    category: 'Sensors',
    description: 'Light-dependent resistor. Resistance decreases as incident ambient illumination increases.',
    prefix: 'LDR',
    isPlaceable: true,
    supportLevel: 'visual-only',
    supportedScenarios: ['street-light-demo'],
    keywords: ['ldr', 'photoresistor', 'light', 'sensor', 'analog', 'photocell'],
    defaultProperties: {
      darkResistance: 100000,
      brightResistance: 1000
    },
    propertySchema: LdrPropertiesSchema,
    pins: [
      { id: 'pin-1', label: '1', electricalRole: 'passive', supportedSignalTypes: ['passive_resistance'] },
      { id: 'pin-2', label: '2', electricalRole: 'passive', supportedSignalTypes: ['passive_resistance'] }
    ]
  },

  // 6. Catalog-only components (Discovery mode, unplaceable in Phase 2)
  {
    type: 'push-button',
    name: 'Push Button (Tactile)',
    category: 'Passive components',
    description: 'Momentary normally-open tactile pushbutton switch for user input.',
    prefix: 'SW',
    isPlaceable: false,
    supportLevel: 'catalog-only',
    supportedScenarios: [],
    keywords: ['button', 'switch', 'tactile', 'input'],
    defaultProperties: {},
    propertySchema: GenericCatalogPropertiesSchema,
    pins: []
  },
  {
    type: 'potentiometer',
    name: 'Potentiometer (10k)',
    category: 'Passive components',
    description: 'Three-terminal rotary resistor creating an adjustable voltage divider.',
    prefix: 'POT',
    isPlaceable: false,
    supportLevel: 'catalog-only',
    supportedScenarios: [],
    keywords: ['potentiometer', 'pot', 'variable', 'knob', 'divider'],
    defaultProperties: {},
    propertySchema: GenericCatalogPropertiesSchema,
    pins: []
  },
  {
    type: 'capacitor',
    name: 'Ceramic Capacitor (100nF)',
    category: 'Passive components',
    description: 'Decoupling and noise-suppression capacitor for power rails.',
    prefix: 'C',
    isPlaceable: false,
    supportLevel: 'catalog-only',
    supportedScenarios: [],
    keywords: ['capacitor', 'decoupling', 'filter'],
    defaultProperties: {},
    propertySchema: GenericCatalogPropertiesSchema,
    pins: []
  },
  {
    type: 'temperature-sensor',
    name: 'Temperature Sensor (TMP36)',
    category: 'Sensors',
    description: 'Precision analog voltage temperature sensor with 10 mV/°C scale factor.',
    prefix: 'TEMP',
    isPlaceable: false,
    supportLevel: 'catalog-only',
    supportedScenarios: [],
    keywords: ['temp', 'temperature', 'tmp36', 'celsius', 'sensor'],
    defaultProperties: {},
    propertySchema: GenericCatalogPropertiesSchema,
    pins: []
  },
  {
    type: 'ultrasonic-sensor',
    name: 'Ultrasonic Distance Sensor (HC-SR04)',
    category: 'Sensors',
    description: 'Non-contact distance measurement module using 40 kHz acoustic ping echoes.',
    prefix: 'DIST',
    isPlaceable: false,
    supportLevel: 'catalog-only',
    supportedScenarios: [],
    keywords: ['ultrasonic', 'hcsr04', 'sonar', 'range', 'distance'],
    defaultProperties: {},
    propertySchema: GenericCatalogPropertiesSchema,
    pins: []
  },
  {
    type: 'soil-moisture-sensor',
    name: 'Capacitive Soil Moisture Sensor',
    category: 'Sensors',
    description: 'Corrosion-resistant capacitive moisture detector for smart agriculture.',
    prefix: 'SOIL',
    isPlaceable: false,
    supportLevel: 'catalog-only',
    supportedScenarios: [],
    keywords: ['soil', 'moisture', 'agriculture', 'analog'],
    defaultProperties: {},
    propertySchema: GenericCatalogPropertiesSchema,
    pins: []
  },
  {
    type: 'buzzer',
    name: 'Piezo Buzzer',
    category: 'Outputs',
    description: 'Audio transducer generating audible tones via PWM square waves.',
    prefix: 'BZ',
    isPlaceable: false,
    supportLevel: 'catalog-only',
    supportedScenarios: [],
    keywords: ['buzzer', 'audio', 'sound', 'piezo', 'tone'],
    defaultProperties: {},
    propertySchema: GenericCatalogPropertiesSchema,
    pins: []
  },
  {
    type: 'relay',
    name: '5V SPDT Relay Module',
    category: 'Outputs',
    description: 'Electromechanically operated switch isolating low-voltage MCU signals from high-voltage AC/DC loads.',
    prefix: 'RLY',
    isPlaceable: false,
    supportLevel: 'catalog-only',
    supportedScenarios: [],
    keywords: ['relay', 'switch', 'isolation', 'ac', 'high-power'],
    defaultProperties: {},
    propertySchema: GenericCatalogPropertiesSchema,
    pins: []
  },
  {
    type: 'dc-motor',
    name: 'DC Gear Motor',
    category: 'Outputs',
    description: 'Rotational actuator converting electrical power into mechanical torque.',
    prefix: 'M',
    isPlaceable: false,
    supportLevel: 'catalog-only',
    supportedScenarios: [],
    keywords: ['motor', 'dc', 'actuator', 'rotation'],
    defaultProperties: {},
    propertySchema: GenericCatalogPropertiesSchema,
    pins: []
  },
  {
    type: 'servo',
    name: 'Micro Servo (SG90)',
    category: 'Outputs',
    description: 'Position-controlled rotary actuator with 0° to 180° range using 50 Hz PWM pulses.',
    prefix: 'SRV',
    isPlaceable: false,
    supportLevel: 'catalog-only',
    supportedScenarios: [],
    keywords: ['servo', 'sg90', 'pwm', 'position', 'angle'],
    defaultProperties: {},
    propertySchema: GenericCatalogPropertiesSchema,
    pins: []
  },
  {
    type: 'lcd-1602',
    name: 'LCD 16x2 Display (I2C)',
    category: 'Displays',
    description: 'Alphanumeric display with PCF8574 I2C backpack interface.',
    prefix: 'LCD',
    isPlaceable: false,
    supportLevel: 'catalog-only',
    supportedScenarios: [],
    keywords: ['lcd', 'screen', 'display', '1602', 'i2c'],
    defaultProperties: {},
    propertySchema: GenericCatalogPropertiesSchema,
    pins: []
  },
  {
    type: 'oled-ssd1306',
    name: 'OLED Display 0.96" (I2C SSD1306)',
    category: 'Displays',
    description: '128x64 monochrome graphical display with I2C bus.',
    prefix: 'OLED',
    isPlaceable: false,
    supportLevel: 'catalog-only',
    supportedScenarios: [],
    keywords: ['oled', 'ssd1306', 'graphics', 'screen', 'i2c'],
    defaultProperties: {},
    propertySchema: GenericCatalogPropertiesSchema,
    pins: []
  },
  {
    type: 'breadboard',
    name: 'Half-size Breadboard (400 Tie Points)',
    category: 'Power and interconnects',
    description: 'Solderless prototyping board with power distribution rails and terminal strips.',
    prefix: 'BB',
    isPlaceable: false,
    supportLevel: 'catalog-only',
    supportedScenarios: [],
    keywords: ['breadboard', 'prototyping', 'bus', 'rails'],
    defaultProperties: {},
    propertySchema: GenericCatalogPropertiesSchema,
    pins: []
  },
  {
    type: 'dc-power-source',
    name: 'DC Regulated Power Supply',
    category: 'Power and interconnects',
    description: 'Dual-output bench supply providing stable 5V and 3.3V power rails.',
    prefix: 'PWR',
    isPlaceable: false,
    supportLevel: 'catalog-only',
    supportedScenarios: [],
    keywords: ['power', 'supply', 'voltage', 'regulator', '5v', '3v3'],
    defaultProperties: {},
    propertySchema: GenericCatalogPropertiesSchema,
    pins: []
  }
];

export function getComponentDefinition(type: string): ComponentDefinition | undefined {
  return COMPONENT_REGISTRY.find(c => c.type === type);
}

export function getAllComponents(): ComponentDefinition[] {
  return COMPONENT_REGISTRY;
}

export function getPlaceableComponents(): ComponentDefinition[] {
  return COMPONENT_REGISTRY.filter(c => c.isPlaceable);
}

export function filterComponents(searchQuery: string, category: string | null): ComponentDefinition[] {
  const q = searchQuery.trim().toLowerCase();

  return COMPONENT_REGISTRY.filter(c => {
    // Category filter
    if (category && category !== 'All' && c.category !== category) {
      return false;
    }
    // Search query filter
    if (!q) return true;

    return (
      c.name.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.type.toLowerCase().includes(q) ||
      c.keywords.some(k => k.toLowerCase().includes(q))
    );
  });
}

/**
 * Generate next independent instance label (e.g. R1, R2, LED1, U1).
 */
export function generateNextInstanceLabel(type: string, existingLabels: string[]): string {
  const def = getComponentDefinition(type);
  const prefix = def ? def.prefix : 'C';

  let counter = 1;
  const labelSet = new Set(existingLabels.map(l => l.trim().toUpperCase()));

  while (labelSet.has(`${prefix}${counter}`.toUpperCase())) {
    counter++;
  }

  return `${prefix}${counter}`;
}
