import React, { useState, useEffect } from 'react';
import { TopToolbar } from './TopToolbar';
import { BottomPanel } from './BottomPanel';
import { FileExplorer } from '../../features/files/FileExplorer';
import { CodeEditor } from '../../features/files/CodeEditor';
import { WorkbenchPanel } from '../../features/workbench/WorkbenchPanel';
import { AssistantPanel } from '../../features/assistant/AssistantPanel';
import { useProjectStore } from '../../store/projectStore';
import { FolderCode, Cpu, Bot, ChevronDown, ChevronRight, AlertOctagon } from 'lucide-react';

export const IdeShell: React.FC = () => {
  const {
    activeMobileTab,
    setActiveMobileTab,
    corruptNotice,
    dismissCorruptNotice
  } = useProjectStore();

  // Desktop panel widths (percentages or pixels)
  const [leftWidth, setLeftWidth] = useState(380); // ~30%
  const [rightWidth, setRightWidth] = useState(300); // ~25%
  const [isExplorerExpanded, setIsExplorerExpanded] = useState(true);
  const [explorerHeight, setExplorerHeight] = useState(190);

  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);
  const [isDraggingExplorer, setIsDraggingExplorer] = useState(false);

  // Divider 1 (between Left and Centre)
  const handleLeftDividerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingLeft(true);
    const startX = e.clientX;
    const startWidth = leftWidth;

    const handleMouseMove = (ev: MouseEvent) => {
      const newWidth = Math.max(260, Math.min(startWidth + (ev.clientX - startX), 650));
      setLeftWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDraggingLeft(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Divider 2 (between Centre and Right)
  const handleRightDividerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingRight(true);
    const startX = e.clientX;
    const startWidth = rightWidth;

    const handleMouseMove = (ev: MouseEvent) => {
      const newWidth = Math.max(220, Math.min(startWidth - (ev.clientX - startX), 500));
      setRightWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDraggingRight(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Explorer vertical divider
  const handleExplorerDividerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingExplorer(true);
    const startY = e.clientY;
    const startH = explorerHeight;

    const handleMouseMove = (ev: MouseEvent) => {
      const newH = Math.max(100, Math.min(startH + (ev.clientY - startY), 380));
      setExplorerHeight(newH);
    };

    const handleMouseUp = () => {
      setIsDraggingExplorer(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Keyboard accessibility for resizing left divider
  const handleLeftKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      setLeftWidth(w => Math.max(260, w - 20));
    } else if (e.key === 'ArrowRight') {
      setLeftWidth(w => Math.min(650, w + 20));
    }
  };

  // Check if screen is mobile size (<768px)
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="ide-container">
      {/* Top Application Bar */}
      <TopToolbar />

      {/* Mobile Tab Switcher */}
      <nav className="mobile-nav-bar" aria-label="Mobile workspace navigation">
        <button
          className={`mobile-nav-btn ${activeMobileTab === 'files' ? 'active' : ''}`}
          onClick={() => setActiveMobileTab('files')}
        >
          <FolderCode size={14} />
          <span>Files &amp; Code</span>
        </button>
        <button
          className={`mobile-nav-btn ${activeMobileTab === 'workbench' ? 'active' : ''}`}
          onClick={() => setActiveMobileTab('workbench')}
        >
          <Cpu size={14} />
          <span>Workbench</span>
        </button>
        <button
          className={`mobile-nav-btn ${activeMobileTab === 'assistant' ? 'active' : ''}`}
          onClick={() => setActiveMobileTab('assistant')}
        >
          <Bot size={14} />
          <span>Assistant</span>
        </button>
      </nav>

      {/* Main Workspace 3-Panel Split Area */}
      <main className="main-workspace-area">
        {/* Left Panel: Explorer + Code Editor */}
        <section
          className="ide-panel"
          style={{
            width: isMobile ? '100%' : `${leftWidth}px`,
            display: isMobile && activeMobileTab !== 'files' ? 'none' : 'flex',
            flexShrink: 0
          }}
          aria-label="Files and Code Editor"
        >
          {/* Collapsible File Explorer Header */}
          <div
            className="panel-header"
            style={{ cursor: 'pointer', userSelect: 'none' }}
            onClick={() => setIsExplorerExpanded(!isExplorerExpanded)}
          >
            <div className="panel-title">
              {isExplorerExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <FolderCode size={13} color="#06b6d4" />
              <span>Project Files</span>
            </div>
            <span style={{ fontSize: '10px', color: '#64748b' }}>
              {isExplorerExpanded ? 'click to collapse' : 'click to expand'}
            </span>
          </div>

          {/* File Explorer Tree */}
          {isExplorerExpanded && (
            <>
              <div style={{ height: `${explorerHeight}px`, overflow: 'hidden' }}>
                <FileExplorer />
              </div>
              <div
                className={`panel-resizer-horizontal ${isDraggingExplorer ? 'resizing' : ''}`}
                onMouseDown={handleExplorerDividerMouseDown}
                title="Drag to resize file explorer"
              />
            </>
          )}

          {/* Monaco Editor fills remainder of left column */}
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <CodeEditor />
          </div>
        </section>

        {/* Resizer Divider 1 */}
        {!isMobile && (
          <div
            tabIndex={0}
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize left editor panel"
            className={`panel-resizer ${isDraggingLeft ? 'resizing' : ''}`}
            onMouseDown={handleLeftDividerMouseDown}
            onKeyDown={handleLeftKeyDown}
          />
        )}

        {/* Centre Panel: Electronics Workbench */}
        <section
          className="ide-panel"
          style={{
            flex: 1,
            minWidth: isMobile ? '100%' : '320px',
            display: isMobile && activeMobileTab !== 'workbench' ? 'none' : 'flex'
          }}
          aria-label="Electronics Workbench Canvas"
        >
          <WorkbenchPanel />
        </section>

        {/* Resizer Divider 2 */}
        {!isMobile && (
          <div
            tabIndex={0}
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize right assistant panel"
            className={`panel-resizer ${isDraggingRight ? 'resizing' : ''}`}
            onMouseDown={handleRightDividerMouseDown}
          />
        )}

        {/* Right Panel: Gemini Engineering Assistant */}
        <section
          className="ide-panel"
          style={{
            width: isMobile ? '100%' : `${rightWidth}px`,
            display: isMobile && activeMobileTab !== 'assistant' ? 'none' : 'flex',
            flexShrink: 0
          }}
          aria-label="Gemini Engineering Assistant"
        >
          <AssistantPanel />
        </section>
      </main>

      {/* Bottom Dock: Output, Problems, Serial */}
      <BottomPanel />

      {/* Corrupt Data Recovery Modal */}
      {corruptNotice && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-header">
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f43f5e' }}>
                <AlertOctagon size={16} />
                Corrupt Storage Data Detected
              </span>
            </div>
            <div className="modal-content">
              <p>
                ProtoForge AI found corrupt or unparseable project data in your local browser storage:
              </p>
              <pre style={{
                background: '#0c121d',
                padding: '8px',
                borderRadius: '4px',
                fontSize: '11px',
                color: '#f43f5e',
                margin: '8px 0',
                overflowX: 'auto'
              }}>
                {corruptNotice.error}
              </pre>
              <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                A timestamped backup of the raw data was safely preserved in local storage.
                Would you like to start a fresh "Automatic Street Light" project?
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="toolbar-btn primary"
                onClick={dismissCorruptNotice}
              >
                Start Fresh Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
