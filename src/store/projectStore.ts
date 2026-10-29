import { create } from 'zustand';
import {
  Project,
  ProjectFile,
  ComponentInstance,
  Circuit,
  Diagnostic,
  detectLanguage,
  validateFilePath,
  isProtectedFile
} from '../domain/project/schema';
import { createInitialProject } from '../domain/project/initialProject';
import {
  saveProjectToStorage,
  loadProjectFromStorage,
  clearProjectStorage
} from '../lib/persistence';
import {
  getComponentDefinition,
  generateNextInstanceLabel
} from '../domain/components/registry';

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
  saveError: string | null;
  activeBottomTab: BottomTab;
  bottomPanelHeight: number;
  isBottomCollapsed: boolean;
  activeMobileTab: MobileTab;
  logs: LogEntry[];
  diagnostics: Diagnostic[];
  corruptNotice: { rawData: string; error: string } | null;

  // Phase 2 Workbench State
  selectedComponentId: string | null;
  isPaletteOpen: boolean;
  isInspectorOpen: boolean;

  // Actions
  initialize: () => void;
  setProjectName: (name: string) => { success: boolean; error?: string };
  openFile: (fileId: string) => void;
  closeTab: (fileId: string) => void;
  updateFileContent: (fileId: string, content: string) => void;
  createFile: (path: string) => { success: boolean; error?: string; fileId?: string };
  renameFile: (fileId: string, newPath: string) => { success: boolean; error?: string };
  deleteFile: (fileId: string) => { success: boolean; error?: string };
  save: () => Promise<boolean>;
  newProject: (force?: boolean) => { needConfirmation: boolean };
  forceNewProject: () => void;
  dismissCorruptNotice: () => void;
  setActiveBottomTab: (tab: BottomTab) => void;
  setBottomPanelHeight: (height: number) => void;
  toggleBottomCollapsed: () => void;
  setActiveMobileTab: (tab: MobileTab) => void;
  addLog: (level: LogEntry['level'], message: string) => void;
  clearLogs: () => void;

  // Workbench Actions
  addComponent: (type: string, position?: { x: number; y: number }) => ComponentInstance | null;
  updateComponentPosition: (id: string, position: { x: number; y: number }) => void;
  updateComponentProperties: (
    id: string,
    properties: Record<string, unknown>,
    newLabel?: string
  ) => { success: boolean; error?: string };
  deleteComponent: (id: string) => void;
  selectComponent: (id: string | null) => void;
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
  saveError: null,
  activeBottomTab: 'output',
  bottomPanelHeight: 180,
  isBottomCollapsed: false,
  activeMobileTab: 'files',
  logs: [
    {
      id: 'init-1',
      timestamp: new Date().toLocaleTimeString(),
      level: 'info',
      message: 'ProtoForge AI IDE initialized. Loaded Automatic Street Light project.'
    }
  ],
  diagnostics: [],
  corruptNotice: null,

  // Workbench UI state
  selectedComponentId: null,
  isPaletteOpen: true,
  isInspectorOpen: true,

  initialize: () => {
    const loaded = loadProjectFromStorage();
    if (loaded.status === 'found') {
      const p = loaded.project;
      const initialTab = p.files.find(f => f.path === 'main.ino')?.id || p.files[0]?.id || null;
      set({
        project: p,
        openTabIds: initialTab ? [initialTab] : [],
        activeTabId: initialTab,
        saveStatus: 'saved',
        saveError: null,
        logs: [
          {
            id: `log-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            level: 'info',
            message: `Restored saved project "${p.name}" (${p.circuit.components.length} components) from local storage.`
          }
        ]
      });
    } else if (loaded.status === 'corrupt') {
      set({
        corruptNotice: {
          rawData: loaded.rawData,
          error: loaded.error
        },
        logs: [
          {
            id: `log-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            level: 'error',
            message: `Corrupt saved project data detected. Preserved backup in local storage.`
          }
        ]
      });
    }
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

  save: async () => {
    set({ saveStatus: 'saving', saveError: null });
    const current = get().project;
    const result = saveProjectToStorage(current);

    if (result.success) {
      set({
        saveStatus: 'saved',
        dirtyFiles: {},
        saveError: null
      });
      get().addLog('info', `Project "${current.name}" successfully saved to local storage.`);
      return true;
    } else {
      set({
        saveStatus: 'error',
        saveError: result.error || 'Failed to save project.'
      });
      get().addLog('error', `Save failed: ${result.error}`);
      return false;
    }
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
    clearProjectStorage();
    saveProjectToStorage(fresh);

    set({
      project: fresh,
      openTabIds: ['file-main-ino', 'file-readme-md'],
      activeTabId: 'file-main-ino',
      dirtyFiles: {},
      saveStatus: 'saved',
      saveError: null,
      corruptNotice: null,
      diagnostics: [],
      selectedComponentId: null
    });

    get().addLog('info', 'Created new Automatic Street Light project.');
  },

  dismissCorruptNotice: () => {
    set({ corruptNotice: null });
    get().forceNewProject();
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

  // ---------------- Workbench Actions (Phase 2) ----------------

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

    // Default position with dynamic staggering
    const compCount = project.circuit.components.length;
    const pos = position || {
      x: 180 + (compCount % 5) * 40,
      y: 120 + (compCount % 5) * 35
    };

    // Deep clone default properties to guarantee independence
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

    // Validate properties against component's Zod schema
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
      // Check label uniqueness among other components
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
    // Also remove any attached wires connected to this component
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

    get().addLog('warn', `Removed ${target.label} from workbench.`);
  },

  selectComponent: (id: string | null) => {
    // Note: Changing selection alone does NOT mark the project unsaved
    set({ selectedComponentId: id });
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
      saveStatus: 'unsaved'
    });

    get().addLog('info', 'Cleared all components from the workbench.');
  }
}));
