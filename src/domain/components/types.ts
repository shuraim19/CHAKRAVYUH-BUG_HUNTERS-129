import { z } from 'zod';
import { PinDefinition, SupportLevel } from '../project/schema';

export type ComponentCategory =
  | 'Boards'
  | 'Passive components'
  | 'Sensors'
  | 'Outputs'
  | 'Displays'
  | 'Power and interconnects';

export interface ComponentDefinition {
  type: string;
  name: string;
  category: ComponentCategory;
  description: string;
  pins: PinDefinition[];
  defaultProperties: Record<string, unknown>;
  propertySchema: z.ZodType<unknown>;
  supportLevel: SupportLevel;
  supportedScenarios: string[];
  isPlaceable: boolean;
  prefix: string; // e.g. "R", "U", "LED", "LDR"
  keywords: string[];
}

export interface ComponentInstanceData {
  id: string;
  type: string;
  label: string;
  position: { x: number; y: number };
  properties: Record<string, unknown>;
}
