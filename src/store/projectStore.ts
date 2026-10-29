import { create } from 'zustand';
import {
  Project,
  ProjectFile,
  ComponentInstance,
  Wire,
  Circuit,
  Diagnostic,
  detectLanguage,
  validateFilePath,
  isProtectedFile
} from '../domain/project/schema';
import { createInitialProject } from '../domain/project/initialProject';
import {
  cleanupLegacyStorage,
  downloadProjectJson,
  validateProjectImport
} from '../lib/persistence';
import {
  getComponentDefinition,
  generateNextInstanceLabel
} from '../domain/components/registry';
import { isDuplicateWire } from '../domain/circuit/netlist';
import { validateCircuit } from '../domain/circuit/validate';
import { validateStreetLightTopology } from '../domain/circuit/streetLightTopology';
import { GeneralValidationResult, StreetLightValidationResult } from '../domain/circuit/types';

export type BottomTab = 'output' | 'problems' | 'serial';
export type MobileTab = 'files' | 'workbench' | 'assistant';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

export interface ProjectState {
  project: Project;
  openTabIds: string[];
  activeTabId: string | null;
  dirtyFiles: Record<string, boolean>;
  saveStatus: 'saved' | 'unsaved' | 'saving' | 'error';
  activeBottomTab: BottomTab;
  bottomPanelHeight: number;
  isBottomCollapsed: boolean;
  activeMobileTab: MobileTab;
  logs: LogEntry[];
  diagnostics: Diagnostic[];

  // Workbench State
  selectedComponentId: string | null;
  selectedWireId: string | null;
  isPaletteOpen: boolean;
  isInspectorOpen: boolean;

  // Validation Result
  validationSummary: {
    tested: boolean;
    readyForSimulation: boolean;
    errorCount: number;
    warningCount: number;
  };

  // Actions
  initialize: () => void;
  setProjectName: (name: string) => { success: boolean; error?: string };
  openFile: (fileId: string) => void;
  closeTab: (fileId: string) => void;
  updateFileContent: (fileId: string, content: string) => void;
  createFile: (path: string) => { success: boolean; error?: string; fileId?: string };
  renameFile: (fileId: string, newPath: string) => { success: boolean; error?: string };
  deleteFile: (fileId: string) => { success: boolean; error?: string };
  newProject: (force?: boolean) => { needConfirmation: boolean };
  forceNewProject: () => void;
  downloadProject: () => void;
  importProject: (jsonString: string) => { success: boolean; error?: string };
  setActiveBottomTab: (tab: BottomTab) => void;
  setBottomPanelHeight: (height: number) => void;
  toggleBottomCollapsed: () => void;
  setActiveMobileTab: (tab: MobileTab) => void;
  addLog: (level: LogEntry['level'], message: string) => void;
  clearLogs: () => void;

  // Workbench Component Actions
  addComponent: (type: string, position?: { x: number; y: number }) => ComponentInstance | null;
  updateComponentPosition: (id: string, position: { x: number; y: number }) => void;
  updateComponentProperties: (
    id: string,
    properties: Record<string, unknown>,
    newLabel?: string
  ) => { success: boolean; error?: string };
  deleteComponent: (id: string) => void;
  selectComponent: (id: string | null) => void;

  // Workbench Wire Actions
  addWire: (
    endpointA: { componentId: string; pinId: string },
    endpointB: { componentId: string; pinId: string },
    colour?: string
  ) => { success: boolean; error?: string; wireId?: string };
  deleteWire: (wireId: string) => void;
  updateWireColour: (wireId: string, colour: string) => void;
  selectWire: (wireId: string | null) => void;

  // Validation
  runValidation: () => { general: GeneralValidationResult; streetLight: StreetLightValidationResult };

  // Example Layout Loaders
  loadStreetLightLayout: (wired: boolean) => void;
  setPaletteOpen: (open: boolean) => void;
  setInspectorOpen: (open: boolean) => void;
  clearWorkbench: () => void;
}

/**
 * Regenerate circuit.json and components.json to reflect authoritative circuit state.
 */
function syncGeneratedJsonFiles(files: ProjectFile[], circuit: Circuit): ProjectFile[] {
  const circuitJsonStr = JSON.stringify(
    {
      schemaVersion: 1,
      description: 'Workbench circuit configuration for Automatic Street Light',
      components: circuit.components,
      wires: circuit.wires
    },
    null,
    2
  );

  const componentsJsonStr = JSON.stringify(
    circuit.components.map(c => ({
      id: c.id,
      type: c.type,
      label: c.label,
      properties: c.properties
    })),
    null,
    2
  );

  return files.map(file => {
    if (file.path === 'circuit.json') {
      return { ...file, content: circuitJsonStr };
    }
    if (file.path === 'components.json') {
      return { ...file, content: componentsJsonStr };
    }
    return file;
  });
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  project: createInitialProject(),
  openTabIds: ['file-main-ino', 'file-readme-md'],
  activeTabId: 'file-main-ino',
  dirtyFiles: {},
  saveStatus: 'saved',
  activeBottomTab: 'output',
  bottomPanelHeight: 180,
  isBottomCollapsed: false,
  activeMobileTab: 'files',
  logs: [
    {
      id: 'init-1',
      timestamp: new Date().toLocaleTimeString(),
      level: 'info',
      message: 'ProtoForge AI session-only IDE initialized. Download your project to retain work.'
    }
  ],
  diagnostics: [],

  // Workbench state
  selectedComponentId: null,
  selectedWireId: null,
  isPaletteOpen: true,
  isInspectorOpen: true,

  validationSummary: {
    tested: false,
    readyForSimulation: false,
    errorCount: 0,
    warningCount: 0
  },

  initialize: () => {
    // Purge any legacy browser storage records so projects remain strictly session-only
    cleanupLegacyStorage();
    const fresh = createInitialProject();
    const initialTab = fresh.files.find(f => f.path === 'main.ino')?.id || fresh.files[0]?.id || null;

    set({
      project: fresh,
      openTabIds: initialTab ? [initialTab] : [],
      activeTabId: initialTab,
      saveStatus: 'saved',
      logs: [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          level: 'info',
          message: 'Initialized fresh temporary workspace. All progress is kept in browser memory.'
        }
      ]
    });
  },

  setProjectName: (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      return { success: false, error: 'Project name cannot be empty.' };
    }
    const current = get().project;
    const updated: Project = {
      ...current,
      name: trimmed,
      revision: current.revision + 1,
      updatedAt: new Date().toISOString()
    };
    set({
      project: updated,
      saveStatus: 'unsaved'
    });
    get().addLog('info', `Renamed project to "${trimmed}".`);
    return { success: true };
  },

  openFile: (fileId: string) => {
    const { openTabIds, project } = get();
    const file = project.files.find(f => f.id === fileId);
    if (!file) return;

    if (!openTabIds.includes(fileId)) {
      set({
        openTabIds: [...openTabIds, fileId],
        activeTabId: fileId
      });
    } else {
      set({ activeTabId: fileId });
    }
  },

  closeTab: (fileId: string) => {
    const { openTabIds, activeTabId } = get();
    const newTabs = openTabIds.filter(id => id !== fileId);
    let nextActive = activeTabId;

    if (activeTabId === fileId) {
      const closedIndex = openTabIds.indexOf(fileId);
      if (newTabs.length > 0) {
        nextActive = newTabs[Math.max(0, closedIndex - 1)];
      } else {
        nextActive = null;
      }
    }

    set({
      openTabIds: newTabs,
      activeTabId: nextActive
    });
  },

  updateFileContent: (fileId: string, content: string) => {
    const { project, dirtyFiles, diagnostics } = get();
    const file = project.files.find(f => f.id === fileId);
    if (!file) return;

    const updatedFiles = project.files.map(f =>
      f.id === fileId ? { ...f, content } : f
    );

    // Validate JSON drafts
    const newDiagnostics = diagnostics.filter(d => d.fileLocation?.fileId !== fileId);
    if (file.language === 'json') {
      try {
        JSON.parse(content);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        newDiagnostics.push({
          id: `diag-json-${fileId}-${Date.now()}`,
          severity: 'error',
          code: 'JSON_SYNTAX_ERROR',
          message: `JSON syntax error in ${file.path}: ${errorMsg}`,
          fileLocation: { fileId }
        });
      }
    }

    set({
      project: {
        ...project,
        files: updatedFiles,
        updatedAt: new Date().toISOString()
      },
      dirtyFiles: {
        ...dirtyFiles,
        [fileId]: true
      },
      saveStatus: 'unsaved',
      diagnostics: newDiagnostics
    });
  },

  createFile: (path: string) => {
    const { project, openTabIds } = get();
    const existingPaths = project.files.map(f => f.path);
    const validation = validateFilePath(path, existingPaths);

    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const trimmed = path.trim();
    const newId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newFile: ProjectFile = {
      id: newId,
      path: trimmed,
      language: detectLanguage(trimmed),
      content: trimmed.endsWith('.json') ? '{\n  \n}\n' : ''
    };

    set({
      project: {
        ...project,
        revision: project.revision + 1,
        files: [...project.files, newFile],
        updatedAt: new Date().toISOString()
      },
      openTabIds: [...openTabIds, newId],
      activeTabId: newId,
      saveStatus: 'unsaved'
    });

    get().addLog('info', `Created new file: ${trimmed}`);
    return { success: true, fileId: newId };
  },

  renameFile: (fileId: string, newPath: string) => {
    const { project } = get();
    const targetFile = project.files.find(f => f.id === fileId);
    if (!targetFile) {
      return { success: false, error: 'File not found.' };
    }

    if (isProtectedFile(targetFile.path)) {
      return {
        success: false,
        error: `"${targetFile.path}" is a required core project file and cannot be renamed.`
      };
    }

    const existingPaths = project.files.map(f => f.path);
    const validation = validateFilePath(newPath, existingPaths, targetFile.path);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const trimmed = newPath.trim();
    const updatedFiles = project.files.map(f =>
      f.id === fileId
        ? { ...f, path: trimmed, language: detectLanguage(trimmed) }
        : f
    );

    set({
      project: {
        ...project,
        revision: project.revision + 1,
        files: updatedFiles,
        updatedAt: new Date().toISOString()
      },
      saveStatus: 'unsaved'
    });

    get().addLog('info', `Renamed file "${targetFile.path}" to "${trimmed}".`);
    return { success: true };
  },

  deleteFile: (fileId: string) => {
    const { project, openTabIds, activeTabId, dirtyFiles } = get();
    const targetFile = project.files.find(f => f.id === fileId);
    if (!targetFile) {
      return { success: false, error: 'File not found.' };
    }

    if (isProtectedFile(targetFile.path)) {
      return {
        success: false,
        error: `"${targetFile.path}" is a core project file required by ProtoForge AI and cannot be deleted.`
      };
    }

    const updatedFiles = project.files.filter(f => f.id !== fileId);
    const newOpenTabs = openTabIds.filter(id => id !== fileId);
    let nextActive = activeTabId;
    if (activeTabId === fileId) {
      nextActive = newOpenTabs.length > 0 ? newOpenTabs[0] : null;
    }

    const newDirty = { ...dirtyFiles };
    delete newDirty[fileId];

    set({
      project: {
        ...project,
        revision: project.revision + 1,
        files: updatedFiles,
        updatedAt: new Date().toISOString()
      },
      openTabIds: newOpenTabs,
      activeTabId: nextActive,
      dirtyFiles: newDirty,
      saveStatus: 'unsaved'
    });

    get().addLog('warn', `Deleted file: ${targetFile.path}`);
    return { success: true };
  },

  newProject: (force = false) => {
    const { saveStatus } = get();
    if (saveStatus === 'unsaved' && !force) {
      return { needConfirmation: true };
    }

    get().forceNewProject();
    return { needConfirmation: false };
  },

  forceNewProject: () => {
    const fresh = createInitialProject();
    set({
      project: fresh,
      openTabIds: ['file-main-ino', 'file-readme-md'],
      activeTabId: 'file-main-ino',
      dirtyFiles: {},
      saveStatus: 'saved',
      diagnostics: [],
      selectedComponentId: null,
      selectedWireId: null,
      validationSummary: {
        tested: false,
        readyForSimulation: false,
        errorCount: 0,
        warningCount: 0
      }
    });

    get().addLog('info', 'Started fresh in-memory project workspace.');
  },

  downloadProject: () => {
    const current = get().project;
    downloadProjectJson(current);
    set({ saveStatus: 'saved', dirtyFiles: {} });
    get().addLog('info', `Downloaded project snapshot "${current.name}" as JSON.`);
  },

  importProject: (jsonString: string) => {
    const validation = validateProjectImport(jsonString);
    if (!validation.valid || !validation.project) {
      get().addLog('error', `Import rejected: ${validation.error}`);
      return { success: false, error: validation.error };
    }

    const imported = validation.project;
    const initialTab = imported.files.find(f => f.path === 'main.ino')?.id || imported.files[0]?.id || null;

    set({
      project: imported,
      openTabIds: initialTab ? [initialTab] : [],
      activeTabId: initialTab,
      dirtyFiles: {},
      saveStatus: 'saved',
      selectedComponentId: null,
      selectedWireId: null,
      diagnostics: [],
      validationSummary: {
        tested: false,
        readyForSimulation: false,
        errorCount: 0,
        warningCount: 0
      }
    });

    get().addLog('info', `Successfully imported project "${imported.name}" with ${imported.circuit.components.length} components and ${imported.circuit.wires.length} wires.`);
    return { success: true };
  },

  setActiveBottomTab: (tab: BottomTab) => {
    set({ activeBottomTab: tab, isBottomCollapsed: false });
  },

  setBottomPanelHeight: (height: number) => {
    set({ bottomPanelHeight: Math.max(100, Math.min(height, 500)) });
  },

  toggleBottomCollapsed: () => {
    set(state => ({ isBottomCollapsed: !state.isBottomCollapsed }));
  },

  setActiveMobileTab: (tab: MobileTab) => {
    set({ activeMobileTab: tab });
  },

  addLog: (level: LogEntry['level'], message: string) => {
    const entry: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString(),
      level,
      message
    };
    set(state => ({
      logs: [...state.logs.slice(-199), entry]
    }));
  },

  clearLogs: () => {
    set({ logs: [] });
  },

  // ---------------- Workbench Component Actions ----------------

  addComponent: (type: string, position?: { x: number; y: number }) => {
    const def = getComponentDefinition(type);
    if (!def) {
      get().addLog('error', `Unknown component type: "${type}".`);
      return null;
    }

    if (!def.isPlaceable) {
      get().addLog('warn', `${def.name} is a catalog-only component. Placement arrives in a future phase.`);
      return null;
    }

    const { project } = get();
    const existingLabels = project.circuit.components.map(c => c.label);
    const label = generateNextInstanceLabel(type, existingLabels);
    const newId = `comp-${type}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const compCount = project.circuit.components.length;
    const pos = position || {
      x: 180 + (compCount % 5) * 40,
      y: 120 + (compCount % 5) * 35
    };

    const properties = JSON.parse(JSON.stringify(def.defaultProperties));

    const newInstance: ComponentInstance = {
      id: newId,
      type,
      label,
      position: pos,
      properties
    };

    const updatedCircuit: Circuit = {
      ...project.circuit,
      components: [...project.circuit.components, newInstance]
    };

    const updatedFiles = syncGeneratedJsonFiles(project.files, updatedCircuit);

    set({
      project: {
        ...project,
        revision: project.revision + 1,
        circuit: updatedCircuit,
        files: updatedFiles,
        updatedAt: new Date().toISOString()
      },
      selectedComponentId: newId,
      selectedWireId: null,
      saveStatus: 'unsaved'
    });

    get().addLog('info', `Placed ${label} (${def.name}) on the workbench.`);
    return newInstance;
  },

  updateComponentPosition: (id: string, position: { x: number; y: number }) => {
    const { project } = get();
    const exists = project.circuit.components.some(c => c.id === id);
    if (!exists) return;

    const updatedComponents = project.circuit.components.map(c =>
      c.id === id ? { ...c, position } : c
    );

    const updatedCircuit: Circuit = {
      ...project.circuit,
      components: updatedComponents
    };

    const updatedFiles = syncGeneratedJsonFiles(project.files, updatedCircuit);

    set({
      project: {
        ...project,
        circuit: updatedCircuit,
        files: updatedFiles,
        updatedAt: new Date().toISOString()
      },
      saveStatus: 'unsaved'
    });
  },

  updateComponentProperties: (
    id: string,
    properties: Record<string, unknown>,
    newLabel?: string
  ) => {
    const { project } = get();
    const instance = project.circuit.components.find(c => c.id === id);
    if (!instance) {
      return { success: false, error: 'Component instance not found.' };
    }

    const def = getComponentDefinition(instance.type);
    if (!def) {
      return { success: false, error: 'Component definition not found in registry.' };
    }

    const parse = def.propertySchema.safeParse(properties);
    if (!parse.success) {
      const issueMsg = parse.error.issues.map(i => i.message).join('; ');
      return { success: false, error: issueMsg };
    }

    let finalLabel = instance.label;
    if (newLabel !== undefined) {
      const trimmedLabel = newLabel.trim();
      if (!trimmedLabel) {
        return { success: false, error: 'Component label cannot be empty.' };
      }
      const duplicate = project.circuit.components.some(
        c => c.id !== id && c.label.toLowerCase() === trimmedLabel.toLowerCase()
      );
      if (duplicate) {
        return { success: false, error: `Label "${trimmedLabel}" is already used by another component.` };
      }
      finalLabel = trimmedLabel;
    }

    const updatedComponents = project.circuit.components.map(c =>
      c.id === id
        ? {
            ...c,
            label: finalLabel,
            properties: parse.data as Record<string, unknown>
          }
        : c
    );

    const updatedCircuit: Circuit = {
      ...project.circuit,
      components: updatedComponents
    };

    const updatedFiles = syncGeneratedJsonFiles(project.files, updatedCircuit);

    set({
      project: {
        ...project,
        revision: project.revision + 1,
        circuit: updatedCircuit,
        files: updatedFiles,
        updatedAt: new Date().toISOString()
      },
      saveStatus: 'unsaved'
    });

    get().addLog('info', `Updated properties for ${finalLabel}.`);
    return { success: true };
  },

  deleteComponent: (id: string) => {
    const { project, selectedComponentId } = get();
    const target = project.circuit.components.find(c => c.id === id);
    if (!target) return;

    const updatedComponents = project.circuit.components.filter(c => c.id !== id);
    // Automatic wire cleanup: remove all wires attached to this component
    const updatedWires = project.circuit.wires.filter(
      w => w.endpointA.componentId !== id && w.endpointB.componentId !== id
    );

    const updatedCircuit: Circuit = {
      components: updatedComponents,
      wires: updatedWires
    };

    const updatedFiles = syncGeneratedJsonFiles(project.files, updatedCircuit);

    set({
      project: {
        ...project,
        revision: project.revision + 1,
        circuit: updatedCircuit,
        files: updatedFiles,
        updatedAt: new Date().toISOString()
      },
      selectedComponentId: selectedComponentId === id ? null : selectedComponentId,
      saveStatus: 'unsaved'
    });

    get().addLog('warn', `Removed ${target.label} and cleaned up attached wires.`);
  },

  selectComponent: (id: string | null) => {
    set({ selectedComponentId: id, selectedWireId: null });
  },

  // ---------------- Workbench Wire Actions ----------------

  addWire: (
    endpointA: { componentId: string; pinId: string },
    endpointB: { componentId: string; pinId: string },
    colour = '#06b6d4'
  ) => {
    const { project } = get();

    // 1. Structural checks
    if (!endpointA.componentId || !endpointA.pinId || !endpointB.componentId || !endpointB.pinId) {
      return { success: false, error: 'Incomplete wire endpoints.' };
    }

    if (endpointA.componentId === endpointB.componentId && endpointA.pinId === endpointB.pinId) {
      return { success: false, error: 'Cannot connect a terminal to itself.' };
    }

    const compA = project.circuit.components.find(c => c.id === endpointA.componentId);
    const compB = project.circuit.components.find(c => c.id === endpointB.componentId);

    if (!compA || !compB) {
      return { success: false, error: 'One or both component endpoints do not exist.' };
    }

    // 2. Undirected duplicate check
    if (isDuplicateWire(project.circuit.wires, endpointA, endpointB)) {
      return { success: false, error: 'An identical connection already exists between these terminals.' };
    }

    const newWireId = `wire-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newWire: Wire = {
      id: newWireId,
      endpointA,
      endpointB,
      colour
    };

    const updatedCircuit: Circuit = {
      ...project.circuit,
      wires: [...project.circuit.wires, newWire]
    };

    const updatedFiles = syncGeneratedJsonFiles(project.files, updatedCircuit);

    set({
      project: {
        ...project,
        revision: project.revision + 1,
        circuit: updatedCircuit,
        files: updatedFiles,
        updatedAt: new Date().toISOString()
      },
      selectedWireId: newWireId,
      selectedComponentId: null,
      saveStatus: 'unsaved'
    });

    const defA = getComponentDefinition(compA.type);
    const defB = getComponentDefinition(compB.type);
    const pinALabel = defA?.pins.find(p => p.id === endpointA.pinId)?.label || endpointA.pinId;
    const pinBLabel = defB?.pins.find(p => p.id === endpointB.pinId)?.label || endpointB.pinId;

    get().addLog('info', `Connected ${compA.label} [${pinALabel}] <-> ${compB.label} [${pinBLabel}].`);
    return { success: true, wireId: newWireId };
  },

  deleteWire: (wireId: string) => {
    const { project, selectedWireId } = get();
    const target = project.circuit.wires.find(w => w.id === wireId);
    if (!target) return;

    const updatedWires = project.circuit.wires.filter(w => w.id !== wireId);
    const updatedCircuit: Circuit = {
      ...project.circuit,
      wires: updatedWires
    };

    const updatedFiles = syncGeneratedJsonFiles(project.files, updatedCircuit);

    set({
      project: {
        ...project,
        revision: project.revision + 1,
        circuit: updatedCircuit,
        files: updatedFiles,
        updatedAt: new Date().toISOString()
      },
      selectedWireId: selectedWireId === wireId ? null : selectedWireId,
      saveStatus: 'unsaved'
    });

    get().addLog('warn', `Removed wire connection.`);
  },

  updateWireColour: (wireId: string, colour: string) => {
    const { project } = get();
    const updatedWires = project.circuit.wires.map(w =>
      w.id === wireId ? { ...w, colour } : w
    );

    const updatedCircuit: Circuit = {
      ...project.circuit,
      wires: updatedWires
    };

    set({
      project: {
        ...project,
        circuit: updatedCircuit,
        updatedAt: new Date().toISOString()
      },
      saveStatus: 'unsaved'
    });
  },

  selectWire: (wireId: string | null) => {
    set({ selectedWireId: wireId, selectedComponentId: null });
  },

  // ---------------- Electrical & Topology Validation ----------------

  runValidation: () => {
    const { project } = get();
    const general = validateCircuit(project.circuit);
    const streetLight = validateStreetLightTopology(project.circuit);

    // Merge diagnostics
    const combinedDiagnostics = [...general.diagnostics, ...streetLight.diagnostics];

    const errorCount = combinedDiagnostics.filter(d => d.severity === 'error').length;
    const warningCount = combinedDiagnostics.filter(d => d.severity === 'warning').length;

    set({
      diagnostics: combinedDiagnostics,
      activeBottomTab: 'problems',
      validationSummary: {
        tested: true,
        readyForSimulation: streetLight.readyForSimulation,
        errorCount,
        warningCount
      }
    });

    if (errorCount === 0 && warningCount === 0) {
      get().addLog('info', 'Validation completed: No errors found by the implemented checks. Reference topology matches.');
    } else {
      get().addLog('warn', `Validation completed: Found ${errorCount} error(s) and ${warningCount} warning(s).`);
    }

    return { general, streetLight };
  },

  // ---------------- Example Layout Loaders ----------------

  loadStreetLightLayout: (wired: boolean) => {
    const fresh = createInitialProject();

    // 1. Create standard components with distinct IDs and proper presets
    const unoId = 'comp-arduino-uno-001';
    const ldrId = 'comp-ldr-001';
    const r1Id = 'comp-resistor-10k-001';
    const r2Id = 'comp-resistor-220-002';
    const ledId = 'comp-led-001';

    const components: ComponentInstance[] = [
      {
        id: unoId,
        type: 'arduino-uno',
        label: 'U1',
        position: { x: 260, y: 160 },
        properties: { microcontroller: 'ATmega328P', operatingVoltage: 5.0, clockSpeed: '16 MHz' }
      },
      {
        id: ldrId,
        type: 'ldr',
        label: 'LDR1',
        position: { x: 80, y: 60 },
        properties: { darkResistance: 100000, brightResistance: 1000 }
      },
      {
        id: r1Id,
        type: 'resistor',
        label: 'R1',
        position: { x: 80, y: 240 },
        properties: { resistance: 10000, unit: 'ohm' } // 10 kΩ pull-down divider
      },
      {
        id: r2Id,
        type: 'resistor',
        label: 'R2',
        position: { x: 480, y: 60 },
        properties: { resistance: 220, unit: 'ohm' } // 220 Ω LED limiter
      },
      {
        id: ledId,
        type: 'led',
        label: 'LED1',
        position: { x: 480, y: 240 },
        properties: { color: 'white', forwardVoltage: 3.2 }
      }
    ];

    let wires: Wire[] = [];

    if (wired) {
      wires = [
        // 1. Uno 5V -> LDR pin-1 (Power rail)
        {
          id: 'wire-1-5v-ldr',
          endpointA: { componentId: unoId, pinId: 'pin-5v' },
          endpointB: { componentId: ldrId, pinId: 'pin-1' },
          colour: '#ef4444' // Red
        },
        // 2. LDR pin-2 -> Uno A0 (Sensor tap)
        {
          id: 'wire-2-ldr-a0',
          endpointA: { componentId: ldrId, pinId: 'pin-2' },
          endpointB: { componentId: unoId, pinId: 'pin-a0' },
          colour: '#06b6d4' // Cyan
        },
        // 3. LDR pin-2 -> R1 pin-1 (Divider node branch)
        {
          id: 'wire-3-ldr-r1',
          endpointA: { componentId: ldrId, pinId: 'pin-2' },
          endpointB: { componentId: r1Id, pinId: 'pin-1' },
          colour: '#06b6d4' // Cyan
        },
        // 4. R1 pin-2 -> Uno GND (Ground return)
        {
          id: 'wire-4-r1-gnd',
          endpointA: { componentId: r1Id, pinId: 'pin-2' },
          endpointB: { componentId: unoId, pinId: 'pin-gnd-1' },
          colour: '#334155' // Dark slate/Black
        },
        // 5. Uno D9 -> R2 pin-1 (LED drive output)
        {
          id: 'wire-5-d9-r2',
          endpointA: { componentId: unoId, pinId: 'pin-d9' },
          endpointB: { componentId: r2Id, pinId: 'pin-1' },
          colour: '#eab308' // Yellow
        },
        // 6. R2 pin-2 -> LED anode (A/+)
        {
          id: 'wire-6-r2-led',
          endpointA: { componentId: r2Id, pinId: 'pin-2' },
          endpointB: { componentId: ledId, pinId: 'anode' },
          colour: '#eab308' // Yellow
        },
        // 7. LED cathode (K/-) -> Uno GND
        {
          id: 'wire-7-led-gnd',
          endpointA: { componentId: ledId, pinId: 'cathode' },
          endpointB: { componentId: unoId, pinId: 'pin-gnd-2' },
          colour: '#334155' // Dark slate/Black
        }
      ];
    }

    const updatedCircuit: Circuit = {
      components,
      wires
    };

    const updatedFiles = syncGeneratedJsonFiles(fresh.files, updatedCircuit);

    set({
      project: {
        ...fresh,
        circuit: updatedCircuit,
        files: updatedFiles
      },
      selectedComponentId: null,
      selectedWireId: null,
      saveStatus: 'unsaved',
      diagnostics: []
    });

    get().addLog(
      'info',
      wired
        ? 'Loaded verified reference Automatic Street Light circuit (5 components, 7 wires).'
        : 'Loaded clean unwired Automatic Street Light layout.'
    );
  },

  setPaletteOpen: (open: boolean) => {
    set({ isPaletteOpen: open });
  },

  setInspectorOpen: (open: boolean) => {
    set({ isInspectorOpen: open });
  },

  clearWorkbench: () => {
    const { project } = get();
    const updatedCircuit: Circuit = {
      components: [],
      wires: []
    };
    const updatedFiles = syncGeneratedJsonFiles(project.files, updatedCircuit);

    set({
      project: {
        ...project,
        revision: project.revision + 1,
        circuit: updatedCircuit,
        files: updatedFiles,
        updatedAt: new Date().toISOString()
      },
      selectedComponentId: null,
      selectedWireId: null,
      saveStatus: 'unsaved',
      diagnostics: []
    });

    get().addLog('info', 'Cleared all components and wires from the workbench.');
  }
}));
