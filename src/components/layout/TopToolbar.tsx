import React, { useState, useEffect } from 'react';
import { useProjectStore } from '../../store/projectStore';
import {
  Cpu,
  Save,
  FilePlus,
  Play,
  Square,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Loader2,
  Check,
  X
} from 'lucide-react';

export const TopToolbar: React.FC = () => {
  const {
    project,
    saveStatus,
    setProjectName,
    save,
    newProject,
    forceNewProject
  } = useProjectStore();

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(project.name);
  const [nameError, setNameError] = useState<string | null>(null);

  const [showNewConfirm, setShowNewConfirm] = useState(false);

  // Sync project name when project changes externally
  useEffect(() => {
    setNameInput(project.name);
  }, [project.name]);

  // Global Ctrl/Cmd + S hotkey
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [save]);

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

  return (
    <header className="top-toolbar">
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

      {/* Center: Disabled Simulation Engine Controls */}
      <div className="top-toolbar-center">
        <div className="tooltip-wrap">
          <button disabled className="toolbar-btn" aria-disabled="true">
            <CheckCircle size={13} />
            <span>Validate</span>
          </button>
          <span className="tooltip-text">Available after the simulation phase.</span>
        </div>

        <div style={{ width: '1px', height: '16px', background: 'var(--pf-border-color)', margin: '0 4px' }} />

        <div className="tooltip-wrap">
          <button disabled className="toolbar-btn" aria-disabled="true">
            <Play size={13} />
            <span>Run</span>
          </button>
          <span className="tooltip-text">Available after the simulation phase.</span>
        </div>

        <div className="tooltip-wrap">
          <button disabled className="toolbar-btn" aria-disabled="true">
            <Square size={13} />
            <span>Stop</span>
          </button>
          <span className="tooltip-text">Available after the simulation phase.</span>
        </div>

        <div className="tooltip-wrap">
          <button disabled className="toolbar-btn" aria-disabled="true">
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
          <span className="tooltip-text">Available after the simulation phase.</span>
        </div>
      </div>

      {/* Right: Project Actions & Save Status */}
      <div className="top-toolbar-right">
        {/* Status Pill */}
        <div className={`status-pill ${saveStatus}`}>
          {saveStatus === 'saved' && (
            <>
              <CheckCircle size={12} />
              <span>Saved</span>
            </>
          )}
          {saveStatus === 'unsaved' && (
            <>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fbbf24' }} />
              <span>Unsaved changes</span>
            </>
          )}
          {saveStatus === 'saving' && (
            <>
              <Loader2 size={12} className="spin" />
              <span>Saving...</span>
            </>
          )}
          {saveStatus === 'error' && (
            <>
              <AlertCircle size={12} />
              <span>Save failed</span>
            </>
          )}
        </div>

        <button
          className="toolbar-btn"
          onClick={handleNewProjectClick}
          title="Create New Project"
        >
          <FilePlus size={13} />
          <span>New</span>
        </button>

        <button
          className="toolbar-btn primary"
          onClick={() => save()}
          disabled={saveStatus === 'saving'}
          title="Save Project (Ctrl+S / ⌘S)"
        >
          <Save size={13} />
          <span>Save</span>
        </button>
      </div>

      {/* Confirmation Modal for Unsaved Changes on New Project */}
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
                Creating a new project will discard all unsaved edits.
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
    </header>
  );
};
