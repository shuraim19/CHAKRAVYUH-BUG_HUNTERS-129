import React, { useRef, useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import {
  Terminal,
  AlertTriangle,
  Radio,
  ChevronDown,
  ChevronUp,
  Trash2,
  Info
} from 'lucide-react';

export const BottomPanel: React.FC = () => {
  const {
    activeBottomTab,
    setActiveBottomTab,
    bottomPanelHeight,
    setBottomPanelHeight,
    isBottomCollapsed,
    toggleBottomCollapsed,
    logs,
    diagnostics,
    clearLogs
  } = useProjectStore();

  const [isResizing, setIsResizing] = useState(false);
  const dragStartY = useRef(0);
  const startHeight = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    dragStartY.current = e.clientY;
    startHeight.current = bottomPanelHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = dragStartY.current - moveEvent.clientY;
      setBottomPanelHeight(startHeight.current + deltaY);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const errorCount = diagnostics.filter(d => d.severity === 'error').length;
  const warnCount = diagnostics.filter(d => d.severity === 'warning').length;

  return (
    <div
      className="bottom-dock"
      style={{
        height: isBottomCollapsed ? '32px' : `${bottomPanelHeight}px`
      }}
    >
      {/* Draggable Top Handle */}
      {!isBottomCollapsed && (
        <div
          className={`panel-resizer-horizontal ${isResizing ? 'resizing' : ''}`}
          onMouseDown={handleMouseDown}
          title="Drag to resize bottom dock"
        />
      )}

      {/* Tab Header Bar */}
      <div className="bottom-tab-bar">
        <div className="bottom-tabs-group" role="tablist">
          <button
            role="tab"
            aria-selected={activeBottomTab === 'output'}
            className={`bottom-tab-btn ${activeBottomTab === 'output' ? 'active' : ''}`}
            onClick={() => setActiveBottomTab('output')}
          >
            <Terminal size={12} />
            <span>Output</span>
            {logs.length > 0 && (
              <span style={{ fontSize: '10px', opacity: 0.7 }}>({logs.length})</span>
            )}
          </button>

          <button
            role="tab"
            aria-selected={activeBottomTab === 'problems'}
            className={`bottom-tab-btn ${activeBottomTab === 'problems' ? 'active' : ''}`}
            onClick={() => setActiveBottomTab('problems')}
          >
            <AlertTriangle size={12} color={errorCount > 0 ? '#f43f5e' : undefined} />
            <span>Problems</span>
            {(errorCount > 0 || warnCount > 0) && (
              <span style={{
                fontSize: '10px',
                background: errorCount > 0 ? 'rgba(244, 63, 94, 0.2)' : 'rgba(251, 191, 36, 0.2)',
                color: errorCount > 0 ? '#f43f5e' : '#fbbf24',
                padding: '1px 5px',
                borderRadius: '8px'
              }}>
                {errorCount + warnCount}
              </span>
            )}
          </button>

          <button
            role="tab"
            aria-selected={activeBottomTab === 'serial'}
            className={`bottom-tab-btn ${activeBottomTab === 'serial' ? 'active' : ''}`}
            onClick={() => setActiveBottomTab('serial')}
          >
            <Radio size={12} />
            <span>Serial</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {activeBottomTab === 'output' && !isBottomCollapsed && (
            <button
              className="icon-btn"
              title="Clear logs"
              onClick={clearLogs}
            >
              <Trash2 size={12} />
            </button>
          )}

          <button
            className="icon-btn"
            title={isBottomCollapsed ? 'Expand panel' : 'Collapse panel'}
            onClick={toggleBottomCollapsed}
          >
            {isBottomCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      {!isBottomCollapsed && (
        <div className="bottom-content-area" role="tabpanel">
          {activeBottomTab === 'output' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {logs.length === 0 ? (
                <div style={{ color: 'var(--pf-text-dim)', fontStyle: 'italic' }}>
                  No output events recorded.
                </div>
              ) : (
                logs.map(log => (
                  <div key={log.id} className="log-line">
                    <span className="log-time">[{log.timestamp}]</span>
                    <span className={`log-msg ${log.level}`}>
                      {log.level === 'error' && '❌ '}
                      {log.level === 'warn' && '⚠️ '}
                      {log.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {activeBottomTab === 'problems' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Notice regarding future circuit diagnostics */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 8px',
                background: 'rgba(15, 23, 42, 0.8)',
                borderRadius: '4px',
                fontSize: '11px',
                color: '#94a3b8',
                border: '1px solid #1e293b'
              }}>
                <Info size={13} color="#06b6d4" />
                <span>
                  Showing file syntax diagnostics. Electrical schematic and circuit connection checks
                  will activate in Phase 3.
                </span>
              </div>

              {diagnostics.length === 0 ? (
                <div style={{ color: 'var(--pf-success)', padding: '6px 0' }}>
                  ✓ No file syntax problems detected.
                </div>
              ) : (
                diagnostics.map(diag => (
                  <div
                    key={diag.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      padding: '4px 6px',
                      background: 'rgba(244, 63, 94, 0.08)',
                      borderLeft: '2px solid #f43f5e',
                      borderRadius: '2px'
                    }}
                  >
                    <AlertTriangle size={14} color="#f43f5e" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      <div style={{ color: '#f43f5e', fontWeight: 600 }}>{diag.code}</div>
                      <div style={{ color: '#cbd5e1' }}>{diag.message}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeBottomTab === 'serial' && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              minHeight: '80px',
              color: 'var(--pf-text-dim)',
              textAlign: 'center',
              gap: '6px'
            }}>
              <Radio size={24} style={{ opacity: 0.4 }} />
              <p style={{ color: 'var(--pf-text-secondary)', fontWeight: 500 }}>
                No firmware runtime connected.
              </p>
              <p style={{ fontSize: '11px', maxWidth: '360px' }}>
                Serial monitor stream (9600 baud) will activate when running the supported
                simulation experiment in Phase 4.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
