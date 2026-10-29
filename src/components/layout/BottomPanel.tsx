import React, { useRef, useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import {
  Terminal,
  AlertTriangle,
  Radio,
  ChevronDown,
  ChevronUp,
  Trash2,
  Info,
  CheckCircle2,
  Cable,
  Cpu
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
    clearLogs,
    validationSummary,
    selectComponent,
    selectWire,
    openFile
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

  const handleDiagnosticClick = (diag: typeof diagnostics[0]) => {
    if (diag.wireIds && diag.wireIds.length > 0) {
      selectWire(diag.wireIds[0]);
    } else if (diag.componentIds && diag.componentIds.length > 0) {
      selectComponent(diag.componentIds[0]);
    } else if (diag.fileLocation?.fileId) {
      openFile(diag.fileLocation.fileId);
    }
  };

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
              {/* Not yet validated state */}
              {!validationSummary.tested ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  borderRadius: '4px',
                  border: '1px solid #1e293b',
                  fontSize: '12px',
                  color: '#94a3b8'
                }}>
                  <Info size={14} color="#06b6d4" style={{ flexShrink: 0 }} />
                  <span>
                    Circuit validation has not been run yet. Click <strong>Validate Circuit</strong> in the top
                    toolbar to test netlist integrity, shorts, and Automatic Street Light reference topology.
                  </span>
                </div>
              ) : diagnostics.length === 0 ? (
                /* Passed validation state */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#34d399',
                    fontWeight: 500
                  }}>
                    <CheckCircle2 size={16} />
                    <span>No errors found by the implemented checks.</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic', paddingLeft: '4px' }}>
                    * Validation is limited to static netlist rules and reference topology. It is not a full electrical safety analysis.
                  </div>
                </div>
              ) : (
                /* Diagnostics list */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {diagnostics.map(diag => {
                    const isError = diag.severity === 'error';
                    const isWarn = diag.severity === 'warning';
                    const borderCol = isError ? '#f43f5e' : isWarn ? '#fbbf24' : '#38bdf8';
                    const bgCol = isError ? 'rgba(244, 63, 94, 0.08)' : isWarn ? 'rgba(251, 191, 36, 0.08)' : 'rgba(56, 189, 248, 0.08)';

                    return (
                      <div
                        key={diag.id}
                        onClick={() => handleDiagnosticClick(diag)}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: '8px',
                          padding: '6px 10px',
                          background: bgCol,
                          borderLeft: `3px solid ${borderCol}`,
                          borderRadius: '3px',
                          cursor: 'pointer'
                        }}
                        title="Click to select component or wire in workbench"
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                          <AlertTriangle
                            size={14}
                            color={borderCol}
                            style={{ marginTop: '2px', flexShrink: 0 }}
                          />
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ color: borderCol, fontWeight: 700, fontSize: '11px' }}>
                                [{diag.code}]
                              </span>
                              <span style={{ color: '#f8fafc', fontSize: '11px' }}>
                                {diag.message}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Location tags */}
                        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                          {diag.componentIds?.map(cId => (
                            <span
                              key={cId}
                              style={{
                                fontSize: '10px',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                background: '#1e293b',
                                color: '#38bdf8',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                            >
                              <Cpu size={10} />
                              {cId}
                            </span>
                          ))}
                          {diag.wireIds && diag.wireIds.length > 0 && (
                            <span
                              style={{
                                fontSize: '10px',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                background: '#1e293b',
                                color: '#a855f7',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                            >
                              <Cable size={10} />
                              wire
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ fontSize: '10px', color: '#64748b', fontStyle: 'italic', marginTop: '4px' }}>
                    * Validation is limited to static netlist rules and reference topology. It is not a full electrical safety analysis.
                  </div>
                </div>
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
