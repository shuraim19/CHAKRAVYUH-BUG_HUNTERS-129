import React, { useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import {
  Layers,
  Sliders,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Cable,
  BookOpen,
  Sparkles
} from 'lucide-react';
import { useReactFlow } from '@xyflow/react';
import { ConnectionList } from './ConnectionList';
import { WiringGuideModal } from './WiringGuideModal';

export const WorkbenchToolbar: React.FC = () => {
  const {
    project,
    isPaletteOpen,
    setPaletteOpen,
    isInspectorOpen,
    setInspectorOpen,
    clearWorkbench,
    loadStreetLightLayout
  } = useProjectStore();

  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const componentCount = project.circuit.components.length;
  const wireCount = project.circuit.wires.length;

  const [isConnectionListOpen, setConnectionListOpen] = useState(false);
  const [isGuideOpen, setGuideOpen] = useState(false);

  const handleClear = () => {
    if (componentCount === 0 && wireCount === 0) return;
    if (window.confirm('Are you sure you want to clear all components and wires from the workbench?')) {
      clearWorkbench();
    }
  };

  const handleLoadUnwired = () => {
    if (componentCount > 0 || wireCount > 0) {
      if (!window.confirm('Load street-light layout? This will replace your current workbench components.')) {
        return;
      }
    }
    loadStreetLightLayout(false);
  };

  const handleLoadWired = () => {
    if (componentCount > 0 || wireCount > 0) {
      if (!window.confirm('Load verified reference circuit? This will replace your current workbench components and wires.')) {
        return;
      }
    }
    loadStreetLightLayout(true);
  };

  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 15,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
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

        {/* Wiring & Connections list dialog */}
        <button
          className={`toolbar-btn ${isConnectionListOpen ? 'primary' : ''}`}
          onClick={() => setConnectionListOpen(!isConnectionListOpen)}
          title="Open Wiring & Connections Manager"
          style={{ padding: '4px 8px', fontSize: '11px' }}
        >
          <Cable size={13} />
          <span>Wires ({wireCount})</span>
        </button>

        {/* Wiring Guide */}
        <button
          className="toolbar-btn"
          onClick={() => setGuideOpen(true)}
          title="Automatic Street Light Wiring Guide"
          style={{ padding: '4px 8px', fontSize: '11px' }}
        >
          <BookOpen size={13} />
          <span>Guide</span>
        </button>

        {/* Presets */}
        <button
          className="toolbar-btn"
          onClick={handleLoadUnwired}
          title="Load neatly arranged unwired Uno, LDR, resistors, and LED"
          style={{ padding: '4px 8px', fontSize: '11px' }}
        >
          <Sparkles size={12} color="#06b6d4" />
          <span>Layout</span>
        </button>

        <div style={{ width: '1px', height: '16px', background: 'var(--pf-border-color)' }} />

        {/* Component Count */}
        <span style={{ fontSize: '11px', color: '#94a3b8', padding: '0 4px' }}>
          {componentCount} {componentCount === 1 ? 'part' : 'parts'}
        </span>

        {componentCount > 0 && (
          <button
            className="icon-btn"
            onClick={handleClear}
            title="Clear workbench"
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

      {/* Floating Connection List / Keyboard Alternative */}
      <ConnectionList
        isOpen={isConnectionListOpen}
        onClose={() => setConnectionListOpen(false)}
      />

      {/* Wiring Guide Modal */}
      <WiringGuideModal
        isOpen={isGuideOpen}
        onClose={() => setGuideOpen(false)}
        onLoadUnwired={handleLoadUnwired}
        onLoadWired={handleLoadWired}
      />
    </>
  );
};
