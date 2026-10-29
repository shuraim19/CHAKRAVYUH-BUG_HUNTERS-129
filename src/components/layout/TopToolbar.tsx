import React, { useState, useEffect, useRef } from 'react';
import { useProjectStore } from '../../store/projectStore';
import {
  Cpu,
  Download,
  Upload,
  FilePlus,
  Play,
  Square,
  RotateCcw,
  CheckCircle,
  Check,
  X,
  ShieldAlert
} from 'lucide-react';

export const TopToolbar: React.FC = () => {
  const {
    project,
    saveStatus,
    setProjectName,
    downloadProject,
    importProject,
    newProject,
    forceNewProject,
    runValidation,
    validationSummary
  } = useProjectStore();

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(project.name);
  const [nameError, setNameError] = useState<string | null>(null);

  const [showNewConfirm, setShowNewConfirm] = useState(false);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [pendingImportContent, setPendingImportContent] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync project name when project changes externally
  useEffect(() => {
    setNameInput(project.name);
  }, [project.name]);

  // Global Ctrl/Cmd + S hotkey triggers explicit project download
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        downloadProject();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [downloadProject]);

  const handleNameSubmit = () => {
    const res = setProjectName(nameInput);
    if (res.success) {
      setIsEditingName(false);
      setNameError(null);
    } else {
      setNameError(res.error || 'Invalid project name.');
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSubmit();
    } else if (e.key === 'Escape') {
      setNameInput(project.name);
      setIsEditingName(false);
      setNameError(null);
    }
  };

  const handleNewProjectClick = () => {
    const res = newProject(false);
    if (res.needConfirmation) {
      setShowNewConfirm(true);
    }
  };

  const confirmNewProject = () => {
    forceNewProject();
    setShowNewConfirm(false);
  };

  const handleImportClick = () => {
    // If project has unsaved changes or existing work, confirm first
    if (saveStatus === 'unsaved' || project.circuit.components.length > 0) {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      fileInputRef.current?.click();
    } else {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (!content) return;

      if (saveStatus === 'unsaved' || project.circuit.components.length > 0) {
        setPendingImportContent(content);
        setShowImportConfirm(true);
      } else {
        importProject(content);
      }
    };
    reader.readAsText(file);
  };

  const confirmImport = () => {
    if (pendingImportContent) {
      importProject(pendingImportContent);
      setPendingImportContent(null);
    }
    setShowImportConfirm(false);
  };

  return (
    <header className="top-toolbar">
      {/* Hidden File Picker for Import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Left: Brand & Project Name */}
      <div className="top-toolbar-left">
        <div className="brand-badge">
          <div className="brand-icon">
            <Cpu size={18} />
          </div>
          <span>ProtoForge AI</span>
        </div>

        <span className="team-badge">BUG HUNTERS</span>

        <div style={{ width: '1px', height: '18px', background: 'var(--pf-border-color)' }} />

        {/* Editable Project Name */}
        <div className={`project-name-editor ${isEditingName ? 'editing' : ''}`}>
          {isEditingName ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input
                type="text"
                autoFocus
                className="project-name-input"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={handleNameKeyDown}
              />
              <button
                className="icon-btn"
                title="Save name"
                onClick={handleNameSubmit}
                style={{ padding: '2px' }}
              >
                <Check size={12} color="#10b981" />
              </button>
              <button
                className="icon-btn"
                title="Cancel"
                onClick={() => {
                  setNameInput(project.name);
                  setIsEditingName(false);
                  setNameError(null);
                }}
                style={{ padding: '2px' }}
              >
                <X size={12} color="#f43f5e" />
              </button>
            </div>
          ) : (
            <span
              onClick={() => setIsEditingName(true)}
              style={{ cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
              title="Click to rename project"
            >
              {project.name}
            </span>
          )}
        </div>
        {nameError && (
          <span style={{ fontSize: '11px', color: 'var(--pf-error)' }}>{nameError}</span>
        )}
      </div>

      {/* Center: Circuit Validation & Simulation Controls */}
      <div className="top-toolbar-center">
        {/* Real Circuit Validation Button */}
        <button
          className={`toolbar-btn ${validationSummary.tested ? (validationSummary.errorCount === 0 ? 'success' : 'warn') : 'primary'}`}
          onClick={() => runValidation()}
          title="Run electrical netlist and street light topology validation"
          style={{ padding: '4px 10px', fontSize: '11px' }}
        >
          <CheckCircle size={13} />
          <span>Validate Circuit</span>
        </button>

        <div style={{ width: '1px', height: '16px', background: 'var(--pf-border-color)', margin: '0 4px' }} />

        {/* Disabled Simulation Controls (Arrive in Phase 4) */}
        <div className="tooltip-wrap">
          <button disabled className="toolbar-btn" aria-disabled="true">
            <Play size={13} />
            <span>Run</span>
          </button>
          <span className="tooltip-text">Functional simulation arrives in Phase 4.</span>
        </div>

        <div className="tooltip-wrap">
          <button disabled className="toolbar-btn" aria-disabled="true">
            <Square size={13} />
            <span>Stop</span>
          </button>
          <span className="tooltip-text">Functional simulation arrives in Phase 4.</span>
        </div>

        <div className="tooltip-wrap">
          <button disabled className="toolbar-btn" aria-disabled="true">
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
          <span className="tooltip-text">Functional simulation arrives in Phase 4.</span>
        </div>
      </div>

      {/* Right: Session Notice, Import/Download & New */}
      <div className="top-toolbar-right">
        {/* Session-only workspace warning pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            color: '#fbbf24',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '4px',
            padding: '3px 8px',
            maxWidth: '360px',
            lineHeight: 1.2
          }}
          title="Temporary workspace. Download your project to keep it. Refreshing or closing this page discards current work."
        >
          <ShieldAlert size={13} style={{ flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Temporary workspace • In-memory only
          </span>
        </div>

        <button
          className="toolbar-btn"
          onClick={handleNewProjectClick}
          title="Start Fresh Project Workspace"
        >
          <FilePlus size={13} />
          <span>New</span>
        </button>

        <button
          className="toolbar-btn"
          onClick={handleImportClick}
          title="Import project JSON file"
        >
          <Upload size={13} />
          <span>Import</span>
        </button>

        <button
          className="toolbar-btn primary"
          onClick={downloadProject}
          title="Download project snapshot as JSON (Ctrl+S / ⌘S)"
        >
          <Download size={13} />
          <span>Download</span>
        </button>
      </div>

      {/* Confirmation Modal for Discarding Workspace on New Project */}
      {showNewConfirm && (
        <div className="modal-overlay" onClick={() => setShowNewConfirm(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span>Discard Unsaved Work?</span>
              <button className="icon-btn" onClick={() => setShowNewConfirm(false)}>
                <X size={14} />
              </button>
            </div>
            <div className="modal-content">
              <p>
                You have unsaved changes in project <strong>{project.name}</strong>.
                Starting a new project will discard all current components, wires, and file edits.
              </p>
              <p style={{ marginTop: '8px', fontSize: '11px', color: '#94a3b8' }}>
                Tip: Click "Download" to keep your project JSON file before resetting.
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="toolbar-btn"
                onClick={() => setShowNewConfirm(false)}
              >
                Keep Editing
              </button>
              <button
                className="toolbar-btn"
                style={{ background: 'rgba(244, 63, 94, 0.2)', borderColor: 'rgba(244, 63, 94, 0.5)', color: '#f43f5e' }}
                onClick={confirmNewProject}
              >
                Discard &amp; Start New
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Overwriting Workspace on Import */}
      {showImportConfirm && (
        <div className="modal-overlay" onClick={() => setShowImportConfirm(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span>Replace Current Workspace?</span>
              <button className="icon-btn" onClick={() => setShowImportConfirm(false)}>
                <X size={14} />
              </button>
            </div>
            <div className="modal-content">
              <p>
                Importing this file will replace the current open workspace in <strong>{project.name}</strong>.
                All current components, wires, and file edits will be replaced.
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="toolbar-btn"
                onClick={() => {
                  setPendingImportContent(null);
                  setShowImportConfirm(false);
                }}
              >
                Cancel
              </button>
              <button
                className="toolbar-btn primary"
                onClick={confirmImport}
              >
                Import &amp; Replace
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
