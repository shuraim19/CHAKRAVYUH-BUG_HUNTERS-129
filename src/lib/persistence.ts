import { Project, ProjectSchema } from '../domain/project/schema';

export const STORAGE_KEY_V1 = 'protoforge.project.v1';
export const STORAGE_BACKUP_PREFIX = 'protoforge.project.corrupt.';

export interface SaveResult {
  success: boolean;
  error?: string;
}

export type LoadResult =
  | { status: 'found'; project: Project }
  | { status: 'empty' }
  | { status: 'corrupt'; rawData: string; error: string };

/**
 * Check whether localStorage is available.
 */
export function isStorageAvailable(): boolean {
  try {
    const testKey = '__protoforge_storage_test__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Persists project state to local storage with schema validation.
 */
export function saveProjectToStorage(project: Project): SaveResult {
  if (!isStorageAvailable()) {
    return {
      success: false,
      error: 'Local browser storage is unavailable or restricted in this environment.'
    };
  }

  // Validate before writing
  const parseResult = ProjectSchema.safeParse(project);
  if (!parseResult.success) {
    const issueMsg = parseResult.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
    return {
      success: false,
      error: `Project validation failed: ${issueMsg}`
    };
  }

  try {
    const serialized = JSON.stringify(parseResult.data);
    localStorage.setItem(STORAGE_KEY_V1, serialized);
    return { success: true };
  } catch (err: unknown) {
    if (err instanceof DOMException && (err.name === 'QuotaExceededError' || err.code === 22)) {
      return {
        success: false,
        error: 'Browser storage quota exceeded. Please free storage space or remove large assets.'
      };
    }
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `Failed to write to local storage: ${message}`
    };
  }
}

/**
 * Loads project state from local storage.
 * If corrupt, preserves raw data into a timestamped key and alerts caller.
 */
export function loadProjectFromStorage(): LoadResult {
  if (!isStorageAvailable()) {
    return { status: 'empty' };
  }

  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY_V1);
  } catch (err) {
    return {
      status: 'corrupt',
      rawData: '',
      error: `Error reading local storage: ${err instanceof Error ? err.message : String(err)}`
    };
  }

  if (!raw) {
    return { status: 'empty' };
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch (parseErr) {
    // Preserve corrupt data before caller replaces it
    const backupKey = `${STORAGE_BACKUP_PREFIX}${Date.now()}`;
    try {
      localStorage.setItem(backupKey, raw);
    } catch {
      // Ignore backup failure
    }
    return {
      status: 'corrupt',
      rawData: raw,
      error: `JSON Syntax error: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`
    };
  }

  const result = ProjectSchema.safeParse(parsedJson);
  if (!result.success) {
    const backupKey = `${STORAGE_BACKUP_PREFIX}${Date.now()}`;
    try {
      localStorage.setItem(backupKey, raw);
    } catch {
      // Ignore backup failure
    }
    const issueMsg = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
    return {
      status: 'corrupt',
      rawData: raw,
      error: `Schema validation error: ${issueMsg}`
    };
  }

  return {
    status: 'found',
    project: result.data
  };
}

/**
 * Safely removes project storage key.
 */
export function clearProjectStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_V1);
  } catch {
    // Ignore error
  }
}
