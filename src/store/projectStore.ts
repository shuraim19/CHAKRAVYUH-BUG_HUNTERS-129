import { create } from 'zustand';
import {
  Project,
  ProjectFile,
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
            message: `Restored saved project "${p.name}" (Revision ${p.revision}) from local storage.`
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
      diagnostics: []
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
      logs: [...state.logs.slice(-199), entry] // keep last 200 logs
    }));
  },

  clearLogs: () => {
    set({ logs: [] });
  }
}));
