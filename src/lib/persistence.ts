import { Project, ProjectSchema, validateFilePath } from '../domain/project/schema';
import { getComponentDefinition } from '../domain/components/registry';

export const LEGACY_STORAGE_PREFIX = 'protoforge.project.';
export const MAX_IMPORT_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Remove legacy ProtoForge project storage records without clearing unrelated browser storage.
 * ProtoForge operates strictly in-memory per session-only requirements.
 */
export function cleanupLegacyStorage(): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(LEGACY_STORAGE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
  } catch {
    // Ignore storage restriction errors
  }
}

export interface ImportValidationResult {
  valid: boolean;
  project?: Project;
  error?: string;
}

/**
 * Validate imported project JSON completely before replacing workspace.
 */
export function validateProjectImport(jsonString: string): ImportValidationResult {
  if (!jsonString || typeof jsonString !== 'string') {
    return { valid: false, error: 'Empty or invalid import payload.' };
  }

  if (new Blob([jsonString]).size > MAX_IMPORT_SIZE_BYTES) {
    return { valid: false, error: 'Project file exceeds maximum allowed size (5 MB).' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err: unknown) {
    return {
      valid: false,
      error: `JSON parse error: ${err instanceof Error ? err.message : String(err)}`
    };
  }

  // 1. Validate top-level Project schema with Zod
  const schemaResult = ProjectSchema.safeParse(parsed);
  if (!schemaResult.success) {
    const issueSummary = schemaResult.error.issues
      .map(i => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    return {
      valid: false,
      error: `Schema validation failed: ${issueSummary}`
    };
  }

  const project = schemaResult.data;

  // 2. Validate Project Files & Paths
  const existingPaths: string[] = [];
  for (const file of project.files) {
    const pathCheck = validateFilePath(file.path, existingPaths);
    if (!pathCheck.valid) {
      return {
        valid: false,
        error: `Invalid project file path "${file.path}": ${pathCheck.error}`
      };
    }
    existingPaths.push(file.path);
  }

  // 3. Validate Components: Known types & unique IDs
  const componentIdSet = new Set<string>();
  const componentMap = new Map<string, { type: string; id: string }>();

  for (const comp of project.circuit.components) {
    if (componentIdSet.has(comp.id)) {
      return { valid: false, error: `Duplicate component ID detected: "${comp.id}".` };
    }
    componentIdSet.add(comp.id);
    componentMap.set(comp.id, { type: comp.type, id: comp.id });

    const def = getComponentDefinition(comp.type);
    if (!def) {
      return {
        valid: false,
        error: `Unknown component type: "${comp.type}" for component "${comp.label}".`
      };
    }

    // Validate component properties
    const propCheck = def.propertySchema.safeParse(comp.properties);
    if (!propCheck.success) {
      return {
        valid: false,
        error: `Invalid properties for component ${comp.label} (${comp.type}): ${propCheck.error.message}`
      };
    }
  }

  // 4. Validate Wires: Unique IDs and valid endpoints
  const wireIdSet = new Set<string>();
  for (const wire of project.circuit.wires) {
    if (wireIdSet.has(wire.id)) {
      return { valid: false, error: `Duplicate wire ID detected: "${wire.id}".` };
    }
    wireIdSet.add(wire.id);

    // Verify endpoint A
    const compA = componentMap.get(wire.endpointA.componentId);
    if (!compA) {
      return {
        valid: false,
        error: `Wire "${wire.id}" references non-existent component "${wire.endpointA.componentId}".`
      };
    }
    const defA = getComponentDefinition(compA.type);
    if (!defA || !defA.pins.some(p => p.id === wire.endpointA.pinId)) {
      return {
        valid: false,
        error: `Wire "${wire.id}" references invalid pin "${wire.endpointA.pinId}" on component ${wire.endpointA.componentId}.`
      };
    }

    // Verify endpoint B
    const compB = componentMap.get(wire.endpointB.componentId);
    if (!compB) {
      return {
        valid: false,
        error: `Wire "${wire.id}" references non-existent component "${wire.endpointB.componentId}".`
      };
    }
    const defB = getComponentDefinition(compB.type);
    if (!defB || !defB.pins.some(p => p.id === wire.endpointB.pinId)) {
      return {
        valid: false,
        error: `Wire "${wire.id}" references invalid pin "${wire.endpointB.pinId}" on component ${wire.endpointB.componentId}.`
      };
    }

    // Prevent self-pin connection
    if (wire.endpointA.componentId === wire.endpointB.componentId && wire.endpointA.pinId === wire.endpointB.pinId) {
      return {
        valid: false,
        error: `Wire "${wire.id}" attempts to connect pin "${wire.endpointA.pinId}" to itself.`
      };
    }
  }

  return { valid: true, project };
}

/**
 * Serializes project to JSON string.
 */
export function serializeProject(project: Project): string {
  return JSON.stringify(project, null, 2);
}

/**
 * Downloads a schema-versioned JSON snapshot of the active project.
 */
export function downloadProjectJson(project: Project): void {
  try {
    const filename = `${project.name.toLowerCase().replace(/[^a-z0-9_-]+/g, '-')}-rev${project.revision}.json`;
    const serialized = serializeProject(project);
    const blob = new Blob([serialized], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  } catch (err: unknown) {
    console.error('Failed to trigger project download:', err);
  }
}
