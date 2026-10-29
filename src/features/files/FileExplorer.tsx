import React, { useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { isProtectedFile } from '../../domain/project/schema';
import {
  Folder,
  FileCode,
  FileText,
  FileJson,
  Plus,
  Trash2,
  Edit2,
  ShieldAlert,
  ChevronDown,
  X
} from 'lucide-react';

export const FileExplorer: React.FC = () => {
  const {
    project,
    activeTabId,
    openFile,
    createFile,
    renameFile,
    deleteFile
  } = useProjectStore();

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newPathInput, setNewPathInput] = useState('');
  const [newFileError, setNewFileError] = useState<string | null>(null);

  const [renameTarget, setRenameTarget] = useState<{ id: string; currentPath: string } | null>(null);
  const [renamePathInput, setRenamePathInput] = useState('');
  const [renameError, setRenameError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; path: string } | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = createFile(newPathInput);
    if (res.success) {
      setIsNewModalOpen(false);
      setNewPathInput('');
      setNewFileError(null);
    } else {
      setNewFileError(res.error || 'Failed to create file.');
    }
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget) return;
    const res = renameFile(renameTarget.id, renamePathInput);
    if (res.success) {
      setRenameTarget(null);
      setRenamePathInput('');
      setRenameError(null);
    } else {
      setRenameError(res.error || 'Failed to rename file.');
    }
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    const res = deleteFile(deleteTarget.id);
    if (!res.success) {
      setActionNotice(res.error || 'Could not delete file.');
    }
    setDeleteTarget(null);
  };

  const getFileIcon = (path: string) => {
    const lower = path.toLowerCase();
    if (lower.endsWith('.json')) {
      return <FileJson size={14} color="#f59e0b" />;
    }
    if (lower.endsWith('.md')) {
      return <FileText size={14} color="#38bdf8" />;
    }
    if (lower.endsWith('.ino') || lower.endsWith('.cpp') || lower.endsWith('.h')) {
      return <FileCode size={14} color="#06b6d4" />;
    }
    return <FileText size={14} color="#94a3b8" />;
  };

  return (
    <div className="explorer-container">
      {/* Panel Header */}
      <div className="panel-header">
        <div className="panel-title">
          <Folder size={13} color="#06b6d4" />
          <span>Explorer</span>
        </div>
        <div className="panel-actions">
          <button
            className="icon-btn"
            title="Create New File"
            onClick={() => {
              setNewFileError(null);
              setNewPathInput('');
              setIsNewModalOpen(true);
            }}
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Project Folder Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '6px 12px',
        fontSize: '11px',
        fontWeight: 600,
        color: 'var(--pf-text-dim)',
        letterSpacing: '0.05em',
        gap: '6px'
      }}>
        <ChevronDown size={13} />
        <span>PROJECT ROOT ({project.files.length} files)</span>
      </div>

      {/* File Tree List */}
      <div className="file-tree" role="tree">
        {project.files.map(file => {
          const isActive = file.id === activeTabId;
          const isProtected = isProtectedFile(file.path);

          return (
            <div
              key={file.id}
              role="treeitem"
              aria-selected={isActive}
              className={`file-tree-item ${isActive ? 'active' : ''}`}
              onClick={() => openFile(file.id)}
            >
              <div className="file-item-left">
                {getFileIcon(file.path)}
                <span>{file.path}</span>
                {isProtected && (
                  <span title="Core required project file" style={{ display: 'flex', opacity: 0.6 }}>
                    <ShieldAlert size={11} color="#64748b" />
                  </span>
                )}
              </div>

              <div className="file-item-actions">
                {!isProtected ? (
                  <>
                    <button
                      className="icon-btn"
                      title="Rename file"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenameTarget({ id: file.id, currentPath: file.path });
                        setRenamePathInput(file.path);
                        setRenameError(null);
                      }}
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      className="icon-btn"
                      title="Delete file"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget({ id: file.id, path: file.path });
                      }}
                    >
                      <Trash2 size={12} color="#f43f5e" />
                    </button>
                  </>
                ) : (
                  <span style={{ fontSize: '10px', color: '#475569', padding: '0 4px' }}>core</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create New File */}
      {isNewModalOpen && (
        <div className="modal-overlay" onClick={() => setIsNewModalOpen(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span>Create New File</span>
              <button className="icon-btn" onClick={() => setIsNewModalOpen(false)}>
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <div className="modal-content">
                <p>Enter the relative file path (e.g. <code>config.h</code>, <code>notes.txt</code>):</p>
                <input
                  type="text"
                  autoFocus
                  className="modal-input"
                  placeholder="filename.ext"
                  value={newPathInput}
                  onChange={e => setNewPathInput(e.target.value)}
                />
                {newFileError && (
                  <p style={{ color: 'var(--pf-error)', marginTop: '8px', fontSize: '12px' }}>
                    {newFileError}
                  </p>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="toolbar-btn"
                  onClick={() => setIsNewModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="toolbar-btn primary">
                  Create File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Rename File */}
      {renameTarget && (
        <div className="modal-overlay" onClick={() => setRenameTarget(null)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span>Rename File</span>
              <button className="icon-btn" onClick={() => setRenameTarget(null)}>
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleRenameSubmit}>
              <div className="modal-content">
                <p>New relative path for <code>{renameTarget.currentPath}</code>:</p>
                <input
                  type="text"
                  autoFocus
                  className="modal-input"
                  value={renamePathInput}
                  onChange={e => setRenamePathInput(e.target.value)}
                />
                {renameError && (
                  <p style={{ color: 'var(--pf-error)', marginTop: '8px', fontSize: '12px' }}>
                    {renameError}
                  </p>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="toolbar-btn"
                  onClick={() => setRenameTarget(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="toolbar-btn primary">
                  Rename
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Confirmation */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span>Delete File</span>
              <button className="icon-btn" onClick={() => setDeleteTarget(null)}>
                <X size={14} />
              </button>
            </div>
            <div className="modal-content">
              <p>
                Are you sure you want to delete <strong>{deleteTarget.path}</strong>?
                This action will remove the file from your local project.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="toolbar-btn"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="toolbar-btn"
                style={{ background: 'rgba(244, 63, 94, 0.2)', borderColor: 'rgba(244, 63, 94, 0.5)', color: '#f43f5e' }}
                onClick={handleDeleteConfirm}
              >
                Delete File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notice alert modal */}
      {actionNotice && (
        <div className="modal-overlay" onClick={() => setActionNotice(null)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span>Notice</span>
              <button className="icon-btn" onClick={() => setActionNotice(null)}>
                <X size={14} />
              </button>
            </div>
            <div className="modal-content">
              <p>{actionNotice}</p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="toolbar-btn primary"
                onClick={() => setActionNotice(null)}
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
