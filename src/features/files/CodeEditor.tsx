import React, { useEffect, useRef } from 'react';
import { monaco } from '../../lib/monaco';
import { useProjectStore } from '../../store/projectStore';
import { FileCode, X, AlertCircle } from 'lucide-react';

export const CodeEditor: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const currentFileIdRef = useRef<string | null>(null);

  const {
    project,
    openTabIds,
    activeTabId,
    dirtyFiles,
    openFile,
    closeTab,
    updateFileContent
  } = useProjectStore();

  const activeFile = project.files.find(f => f.id === activeTabId);

  // Initialize and manage Monaco editor
  useEffect(() => {
    if (!containerRef.current) return;

    if (!editorRef.current) {
      editorRef.current = monaco.editor.create(containerRef.current, {
        value: activeFile?.content ?? '',
        language: activeFile?.language === 'markdown' ? 'markdown' : activeFile?.language === 'json' ? 'json' : 'cpp',
        theme: 'protoforge-dark',
        automaticLayout: true,
        fontSize: 13,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        tabSize: 2,
        minimap: { enabled: false },
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        padding: { top: 8, bottom: 8 }
      });

      // Handle content changes without triggering re-renders
      editorRef.current.onDidChangeModelContent(() => {
        if (!editorRef.current || !currentFileIdRef.current) return;
        const val = editorRef.current.getValue();
        updateFileContent(currentFileIdRef.current, val);
      });
    }

    return () => {
      if (editorRef.current) {
        editorRef.current.dispose();
        editorRef.current = null;
      }
    };
  }, []); // Run once on mount

  // Update editor content and language when activeTabId changes
  useEffect(() => {
    if (!editorRef.current) return;

    if (!activeFile) {
      currentFileIdRef.current = null;
      editorRef.current.setValue('');
      return;
    }

    const currentModel = editorRef.current.getModel();
    const currentVal = editorRef.current.getValue();

    // Map language
    let lang = 'cpp';
    if (activeFile.language === 'json') lang = 'json';
    else if (activeFile.language === 'markdown') lang = 'markdown';
    else if (activeFile.language === 'plaintext') lang = 'plaintext';

    if (currentFileIdRef.current !== activeFile.id) {
      currentFileIdRef.current = activeFile.id;
      editorRef.current.setValue(activeFile.content);
      if (currentModel) {
        monaco.editor.setModelLanguage(currentModel, lang);
      }
    } else if (currentVal !== activeFile.content) {
      // Content updated from outside (e.g., reset/load)
      const pos = editorRef.current.getPosition();
      editorRef.current.setValue(activeFile.content);
      if (pos) editorRef.current.setPosition(pos);
    }
  }, [activeFile?.id, activeFile?.content, activeFile?.language]);

  return (
    <div className="editor-wrapper">
      {/* Tab Bar */}
      <div className="editor-tabs-bar" role="tablist">
        {openTabIds.map(id => {
          const file = project.files.find(f => f.id === id);
          if (!file) return null;
          const isActive = id === activeTabId;
          const isDirty = !!dirtyFiles[id];

          return (
            <div
              key={id}
              role="tab"
              aria-selected={isActive}
              className={`editor-tab ${isActive ? 'active' : ''}`}
              onClick={() => openFile(id)}
            >
              <FileCode size={13} color={isActive ? '#22d3ee' : '#64748b'} />
              <span>{file.path}</span>
              {isDirty && <span className="dirty-dot" title="Unsaved changes" />}
              <button
                className="tab-close-btn"
                title="Close tab"
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(id);
                }}
              >
                <X size={12} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Notice Banner */}
      <div className="editor-notice-banner">
        <AlertCircle size={13} color="#22d3ee" />
        <span>Editing source only. Firmware execution is not available in this phase.</span>
      </div>

      {/* Monaco Mount or Empty State */}
      <div className="monaco-container-outer">
        {activeFile ? (
          <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--pf-text-dim)',
            gap: '8px',
            fontSize: '13px'
          }}>
            <FileCode size={36} strokeWidth={1.5} />
            <p>No open files. Select a file from the explorer on the left.</p>
          </div>
        )}
      </div>
    </div>
  );
};
