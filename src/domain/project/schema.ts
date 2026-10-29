import { z } from 'zod';

export const ElectricalRoleSchema = z.enum([
  'power',
  'ground',
  'digital_in',
  'digital_out',
  'digital_io',
  'analog_in',
  'analog_out',
  'passive'
]);
export type ElectricalRole = z.infer<typeof ElectricalRoleSchema>;

export const SignalTypeSchema = z.enum([
  'dc_power',
  'ground',
  'analog_voltage',
  'digital_logic',
  'passive_resistance'
]);
export type SignalType = z.infer<typeof SignalTypeSchema>;

export const SupportLevelSchema = z.enum([
  'simulated',
  'visual-only',
  'catalog-only'
]);
export type SupportLevel = z.infer<typeof SupportLevelSchema>;

export const PinDefinitionSchema = z.object({
  id: z.string(),
  label: z.string(),
  electricalRole: ElectricalRoleSchema,
  supportedSignalTypes: z.array(SignalTypeSchema),
  nominalVoltage: z.number().optional()
});
export type PinDefinition = z.infer<typeof PinDefinitionSchema>;

export const ComponentDefinitionSchema = z.object({
  type: z.string(),
  name: z.string(),
  category: z.string(),
  description: z.string(),
  pins: z.array(PinDefinitionSchema),
  defaultProperties: z.record(z.unknown()),
  propertySchema: z.record(z.unknown()),
  supportLevel: SupportLevelSchema,
  supportedScenarios: z.array(z.string())
});
export type ComponentDefinition = z.infer<typeof ComponentDefinitionSchema>;

export const ComponentInstanceSchema = z.object({
  id: z.string(),
  type: z.string(),
  label: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number()
  }),
  properties: z.record(z.unknown())
});
export type ComponentInstance = z.infer<typeof ComponentInstanceSchema>;

export const WireEndpointSchema = z.object({
  componentId: z.string(),
  pinId: z.string()
});
export type WireEndpoint = z.infer<typeof WireEndpointSchema>;

export const WireSchema = z.object({
  id: z.string(),
  endpointA: WireEndpointSchema,
  endpointB: WireEndpointSchema,
  colour: z.string().default('#06b6d4')
});
export type Wire = z.infer<typeof WireSchema>;

export const CircuitSchema = z.object({
  components: z.array(ComponentInstanceSchema).default([]),
  wires: z.array(WireSchema).default([])
});
export type Circuit = z.infer<typeof CircuitSchema>;

export const ProjectFileSchema = z.object({
  id: z.string(),
  path: z.string(),
  language: z.enum(['cpp', 'json', 'markdown', 'plaintext']),
  content: z.string()
});
export type ProjectFile = z.infer<typeof ProjectFileSchema>;

export const DiagnosticSeveritySchema = z.enum(['error', 'warning', 'info']);
export type DiagnosticSeverity = z.infer<typeof DiagnosticSeveritySchema>;

export const DiagnosticSchema = z.object({
  id: z.string(),
  severity: DiagnosticSeveritySchema,
  code: z.string(),
  message: z.string(),
  componentIds: z.array(z.string()).optional(),
  wireIds: z.array(z.string()).optional(),
  fileLocation: z.object({
    fileId: z.string(),
    line: z.number().optional(),
    column: z.number().optional()
  }).optional()
});
export type Diagnostic = z.infer<typeof DiagnosticSchema>;

export const SimulationConfigSchema = z.object({
  targetScenarioId: z.string().default('street-light-demo'),
  targetBoard: z.string().default('arduino-uno'),
  sampleIntervalMs: z.number().default(50)
});
export type SimulationConfig = z.infer<typeof SimulationConfigSchema>;

export const ProjectSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string(),
  name: z.string().min(1, 'Project name must not be empty'),
  revision: z.number().int().nonnegative().default(1),
  createdAt: z.string(),
  updatedAt: z.string(),
  files: z.array(ProjectFileSchema),
  circuit: CircuitSchema,
  simulationConfig: SimulationConfigSchema
});
export type Project = z.infer<typeof ProjectSchema>;

/**
 * Required project files that must not be deleted.
 */
export const PROTECTED_FILE_PATHS = new Set([
  'main.ino',
  'circuit.json',
  'components.json',
  'project.json',
  'README.md'
]);

export function isProtectedFile(filePath: string): boolean {
  return PROTECTED_FILE_PATHS.has(filePath.trim());
}

/**
 * Strict path validator to reject traversal, invalid characters, duplicates, and invalid format.
 */
export function validateFilePath(
  path: string,
  existingPaths: string[],
  currentPath?: string
): { valid: boolean; error?: string } {
  const trimmed = path.trim();

  if (!trimmed) {
    return { valid: false, error: 'File path cannot be empty.' };
  }

  if (trimmed.startsWith('/') || trimmed.startsWith('\\') || /^[a-zA-Z]:/.test(trimmed)) {
    return { valid: false, error: 'Absolute paths are not allowed. Use relative paths.' };
  }

  // Traversal check
  const segments = trimmed.split(/[\\/]/);
  for (const seg of segments) {
    if (seg === '..' || seg === '.') {
      return { valid: false, error: 'Path traversal (".." or ".") is prohibited.' };
    }
    if (!seg) {
      return { valid: false, error: 'Path contains empty directory segments.' };
    }
    // Invalid characters on Linux/Windows filenames
    if (/[<>:"|?*\\~]/.test(seg)) {
      return { valid: false, error: `Invalid character in filename segment: "${seg}".` };
    }
  }

  // Duplicate check
  const lowerTrimmed = trimmed.toLowerCase();
  const duplicate = existingPaths.some(
    p => p.toLowerCase() === lowerTrimmed && (!currentPath || p.toLowerCase() !== currentPath.toLowerCase())
  );

  if (duplicate) {
    return { valid: false, error: `A file named "${trimmed}" already exists.` };
  }

  return { valid: true };
}

export function detectLanguage(path: string): ProjectFile['language'] {
  const lower = path.toLowerCase();
  if (lower.endsWith('.ino') || lower.endsWith('.cpp') || lower.endsWith('.h') || lower.endsWith('.c')) {
    return 'cpp';
  }
  if (lower.endsWith('.json')) {
    return 'json';
  }
  if (lower.endsWith('.md') || lower.endsWith('.markdown')) {
    return 'markdown';
  }
  return 'plaintext';
}
