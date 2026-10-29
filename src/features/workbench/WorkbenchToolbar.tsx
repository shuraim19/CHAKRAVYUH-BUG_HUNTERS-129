import React from 'react';
import { useProjectStore } from '../../store/projectStore';
import {
  Layers,
  Sliders,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';
import { useReactFlow } from '@xyflow/react';

export const WorkbenchToolbar: React.FC = () => {
  const {
    project,
    isPaletteOpen,
    setPaletteOpen,
    isInspectorOpen,
    setInspectorOpen,
    clearWorkbench
  } = useProjectStore();

  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const componentCount = project.circuit.components.length;

  const handleClear = () => {
    if (componentCount === 0) return;
    if (window.confirm('Are you sure you want to clear all components from the workbench?')) {
      clearWorkbench();
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 15,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'rgba(13, 19, 31, 0.95)',
        backdropFilter: 'blur(8px)',
        border: '1px solid var(--pf-border-color)',
        borderRadius: '8px',
        padding: '4px 10px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)'
      }}
      role="toolbar"
      aria-label="Workbench Controls"
    >
      {/* Palette Toggle */}
      <button
        className={`toolbar-btn ${isPaletteOpen ? 'primary' : ''}`}
        onClick={() => setPaletteOpen(!isPaletteOpen)}
        title="Toggle Component Palette"
        style={{ padding: '4px 8px', fontSize: '11px' }}
      >
        <Layers size={13} />
        <span>Library</span>
      </button>

      <div style={{ width: '1px', height: '16px', background: 'var(--pf-border-color)' }} />

      {/* Zoom / View controls */}
      <button
        className="icon-btn"
        onClick={() => zoomIn({ duration: 200 })}
        title="Zoom In"
      >
        <ZoomIn size={14} />
      </button>

      <button
        className="icon-btn"
        onClick={() => zoomOut({ duration: 200 })}
        title="Zoom Out"
      >
        <ZoomOut size={14} />
      </button>

      <button
        className="icon-btn"
        onClick={() => fitView({ duration: 300, padding: 0.2 })}
        title="Fit View"
      >
        <Maximize2 size={13} />
      </button>

      <div style={{ width: '1px', height: '16px', background: 'var(--pf-border-color)' }} />

      {/* Component Count */}
      <span style={{ fontSize: '11px', color: '#94a3b8', padding: '0 4px' }}>
        {componentCount} {componentCount === 1 ? 'component' : 'components'}
      </span>

      {componentCount > 0 && (
        <button
          className="icon-btn"
          onClick={handleClear}
          title="Clear all workbench components"
          style={{ padding: '4px' }}
        >
          <Trash2 size={13} color="#f43f5e" />
        </button>
      )}

      <div style={{ width: '1px', height: '16px', background: 'var(--pf-border-color)' }} />

      {/* Inspector Toggle */}
      <button
        className={`toolbar-btn ${isInspectorOpen ? 'primary' : ''}`}
        onClick={() => setInspectorOpen(!isInspectorOpen)}
        title="Toggle Properties Inspector"
        style={{ padding: '4px 8px', fontSize: '11px' }}
      >
        <Sliders size={13} />
        <span>Inspector</span>
      </button>
    </div>
  );
};
