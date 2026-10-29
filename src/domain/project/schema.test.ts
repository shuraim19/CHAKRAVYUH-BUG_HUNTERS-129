import { describe, it, expect } from 'vitest';
import { validateFilePath, isProtectedFile, detectLanguage, ProjectSchema } from './schema';
import { createInitialProject } from './initialProject';

describe('Project File Schema and Path Validation', () => {
  const existingFiles = ['main.ino', 'circuit.json', 'components.json', 'README.md'];

  it('accepts valid relative filenames', () => {
    expect(validateFilePath('config.h', existingFiles).valid).toBe(true);
    expect(validateFilePath('sensor_driver.cpp', existingFiles).valid).toBe(true);
    expect(validateFilePath('notes.txt', existingFiles).valid).toBe(true);
    expect(validateFilePath('subfolder/helper.h', existingFiles).valid).toBe(true);
  });

  it('rejects empty paths', () => {
    const res = validateFilePath('   ', existingFiles);
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/cannot be empty/i);
  });

  it('rejects directory traversal attempts', () => {
    expect(validateFilePath('../evil.cpp', existingFiles).valid).toBe(false);
    expect(validateFilePath('sub/../../evil.cpp', existingFiles).valid).toBe(false);
    expect(validateFilePath('./evil.cpp', existingFiles).valid).toBe(false);
  });

  it('rejects absolute paths', () => {
    expect(validateFilePath('/etc/passwd', existingFiles).valid).toBe(false);
    expect(validateFilePath('\\windows\\system32', existingFiles).valid).toBe(false);
    expect(validateFilePath('C:\\Users\\admin', existingFiles).valid).toBe(false);
  });

  it('rejects illegal filename characters', () => {
    expect(validateFilePath('file*name.h', existingFiles).valid).toBe(false);
    expect(validateFilePath('file?name.h', existingFiles).valid).toBe(false);
    expect(validateFilePath('file<name>.h', existingFiles).valid).toBe(false);
    expect(validateFilePath('file|name.h', existingFiles).valid).toBe(false);
  });

  it('rejects duplicate paths (case-insensitive)', () => {
    expect(validateFilePath('main.ino', existingFiles).valid).toBe(false);
    expect(validateFilePath('MAIN.INO', existingFiles).valid).toBe(false);
    expect(validateFilePath('circuit.json', existingFiles).valid).toBe(false);
  });

  it('allows renaming to the same current path', () => {
    expect(validateFilePath('main.ino', existingFiles, 'main.ino').valid).toBe(true);
  });

  it('identifies protected core project files', () => {
    expect(isProtectedFile('main.ino')).toBe(true);
    expect(isProtectedFile('circuit.json')).toBe(true);
    expect(isProtectedFile('components.json')).toBe(true);
    expect(isProtectedFile('project.json')).toBe(true);
    expect(isProtectedFile('README.md')).toBe(true);
    expect(isProtectedFile('custom.ino')).toBe(false);
  });

  it('detects language correctly', () => {
    expect(detectLanguage('main.ino')).toBe('cpp');
    expect(detectLanguage('driver.cpp')).toBe('cpp');
    expect(detectLanguage('header.h')).toBe('cpp');
    expect(detectLanguage('circuit.json')).toBe('json');
    expect(detectLanguage('README.md')).toBe('markdown');
    expect(detectLanguage('notes.txt')).toBe('plaintext');
  });

  it('validates initial project structure against ProjectSchema', () => {
    const initial = createInitialProject();
    const parse = ProjectSchema.safeParse(initial);
    expect(parse.success).toBe(true);
    expect(initial.files.length).toBe(5);
    expect(initial.circuit.components).toEqual([]);
    expect(initial.circuit.wires).toEqual([]);
  });
});
