import { Project } from './schema';

export const INITIAL_MAIN_INO = `/*
 * ProtoForge AI - Automatic Street Light Controller
 * Target: Arduino Uno R3
 * 
 * Hardware Connections:
 * - LDR Divider: 5V -> LDR -> A0 -> 10k Resistor -> GND
 * - Street LED: Pin D9 -> 220 ohm Resistor -> LED Anode -> LED Cathode -> GND
 */

const int SENSOR_PIN = A0;   // LDR voltage divider input
const int LED_PIN = 9;       // Street light control output
const int THRESHOLD = 512;   // Light trigger threshold (ADC count, ~50% illumination)

void setup() {
  pinMode(LED_PIN, OUTPUT);
  Serial.begin(9600);
  Serial.println(F("[ProtoForge] Automatic Street Light System Initialized"));
}

void loop() {
  int sensorValue = analogRead(SENSOR_PIN);
  
  Serial.print(F("Ambient Light ADC: "));
  Serial.print(sensorValue);

  // When ambient light drops below threshold, turn the street light ON
  if (sensorValue < THRESHOLD) {
    digitalWrite(LED_PIN, HIGH);
    Serial.println(F(" -> Status: NIGHT (Lamp ON)"));
  } else {
    digitalWrite(LED_PIN, LOW);
    Serial.println(F(" -> Status: DAY (Lamp OFF)"));
  }

  delay(200); // 200ms sample interval
}
`;

export const INITIAL_CIRCUIT_JSON = `{
  "schemaVersion": 1,
  "description": "Workbench circuit configuration for Automatic Street Light",
  "components": [],
  "wires": []
}
`;

export const INITIAL_COMPONENTS_JSON = `[
  {
    "type": "arduino-uno",
    "name": "Arduino Uno R3",
    "status": "catalog"
  },
  {
    "type": "ldr",
    "name": "Photoresistor (LDR)",
    "status": "catalog"
  },
  {
    "type": "resistor-10k",
    "name": "10k Resistor",
    "status": "catalog"
  },
  {
    "type": "resistor-220",
    "name": "220 Ohm Resistor",
    "status": "catalog"
  },
  {
    "type": "led-white",
    "name": "Street Light LED (White)",
    "status": "catalog"
  }
]
`;

export const INITIAL_PROJECT_JSON = `{
  "id": "proj-street-light-001",
  "name": "Automatic Street Light",
  "version": "1.0.0",
  "target": "Arduino Uno",
  "scenario": "street-light-demo",
  "author": "Team BUG HUNTERS"
}
`;

export const INITIAL_README_MD = `# Automatic Street Light — ProtoForge AI

Welcome to **ProtoForge AI**, Team BUG HUNTERS' engineering environment for embedded electronics.

## Project Overview
This reference project implements an intelligent, energy-saving Automatic Street Light using an Arduino Uno microcontroller and a photoresistor (LDR) voltage divider.

### Hardware Reference:
1. **Microcontroller**: Arduino Uno R3
2. **Light Sensor**: Light Dependent Resistor (LDR) in series with a 10 kΩ pull-down resistor to GND
3. **Sensor Node**: Center divider tap connected to analog input **A0**
4. **Actuator**: High-brightness street LED connected from digital output **D9** via a 220 Ω current-limiting resistor to GND

### Operational Logic:
- In daylight, LDR resistance is low (~1 kΩ), raising the A0 divider voltage (ADC >= 512). The street lamp remains **OFF**.
- In darkness, LDR resistance surges to ~100 kΩ, pulling A0 low (ADC < 512). Pin D9 goes **HIGH**, switching the lamp **ON**.

> **Phase 4 Functional Simulation Active:**
> Interactive circuit simulation is now live! Use the **Run**, **Stop**, and **Reset** toolbar controls or the interactive Ambient Light slider on the workbench canvas to simulate varying daylight levels and inspect real-time ADC conversion, pin voltages, and LED illumination.
`;

export function createInitialProject(): Project {
  const timestamp = new Date().toISOString();
  return {
    schemaVersion: 1,
    id: 'proj-street-light-001',
    name: 'Automatic Street Light',
    revision: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
    files: [
      {
        id: 'file-main-ino',
        path: 'main.ino',
        language: 'cpp',
        content: INITIAL_MAIN_INO
      },
      {
        id: 'file-circuit-json',
        path: 'circuit.json',
        language: 'json',
        content: INITIAL_CIRCUIT_JSON
      },
      {
        id: 'file-components-json',
        path: 'components.json',
        language: 'json',
        content: INITIAL_COMPONENTS_JSON
      },
      {
        id: 'file-project-json',
        path: 'project.json',
        language: 'json',
        content: INITIAL_PROJECT_JSON
      },
      {
        id: 'file-readme-md',
        path: 'README.md',
        language: 'markdown',
        content: INITIAL_README_MD
      }
    ],
    circuit: {
      components: [],
      wires: []
    },
    simulationConfig: {
      targetScenarioId: 'street-light-demo',
      targetBoard: 'arduino-uno',
      sampleIntervalMs: 50
    }
  };
}
