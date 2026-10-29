import React from 'react';
import { useProjectStore } from '../../store/projectStore';
import { getComponentDefinition } from '../../domain/components/registry';
import { Trash2, X, Cable } from 'lucide-react';

const WIRE_COLOURS = [
  { label: 'Cyan (Signal/Data)', value: '#06b6d4' },
  { label: 'Red (5V Power)', value: '#ef4444' },
  { label: 'Slate/Black (GND Return)', value: '#334155' },
  { label: 'Yellow (Control/PWM)', value: '#eab308' },
  { label: 'Green (Analog)', value: '#10b981' },
  { label: 'Purple (Clock/Special)', value: '#a855f7' },
  { label: 'White (Neutral)', value: '#f8fafc' }
];

export const WireInspector: React.FC = () => {
  const {
    project,
    selectedWireId,
    selectWire,
    deleteWire,
    updateWireColour
  } = useProjectStore();

  if (!selectedWireId) return null;

  const wire = project.circuit.wires.find(w => w.id === selectedWireId);
  if (!wire) return null;

  const compA = project.circuit.components.find(c => c.id === wire.endpointA.componentId);
  const compB = project.circuit.components.find(c => c.id === wire.endpointB.componentId);

  const defA = compA ? getComponentDefinition(compA.type) : null;
  const defB = compB ? getComponentDefinition(compB.type) : null;

  const pinALabel = defA?.pins.find(p => p.id === wire.endpointA.pinId)?.label || wire.endpointA.pinId;
  const pinBLabel = defB?.pins.find(p => p.id === wire.endpointB.pinId)?.label || wire.endpointB.pinId;

  const handleDelete = () => {
    deleteWire(wire.id);
  };

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '48px',
        right: '16px',
        zIndex: 25,
        width: '280px',
        background: 'rgba(13, 19, 31, 0.96)',
        backdropFilter: 'blur(10px)',
        border: '1px solid var(--pf-border-color)',
        borderRadius: '8px',
        padding: '12px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
        color: '#ffffff',
        fontFamily: 'var(--font-sans)',
        fontSize: '12px'
      }}
      role="region"
      aria-label="Wire Inspector"
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#38bdf8' }}>
          <Cable size={14} color={wire.colour} />
          <span>Wire Connection</span>
        </div>
        <button
          className="icon-btn"
          onClick={() => selectWire(null)}
          title="Close Inspector (Esc)"
          style={{ padding: '2px' }}
        >
          <X size={13} />
        </button>
      </div>

      {/* Endpoints display */}
      <div style={{
        background: '#041f36',
        borderRadius: '6px',
        padding: '8px 10px',
        marginBottom: '10px',
        border: '1px solid #1e3a5f'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ color: '#94a3b8' }}>Endpoint A:</span>
          <span style={{ fontWeight: 600, color: '#f1f5f9' }}>
            {compA?.label || wire.endpointA.componentId} [{pinALabel}]
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', margin: '2px 0', color: wire.colour, fontWeight: 700 }}>
          ↕
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#94a3b8' }}>Endpoint B:</span>
          <span style={{ fontWeight: 600, color: '#f1f5f9' }}>
            {compB?.label || wire.endpointB.componentId} [{pinBLabel}]
          </span>
        </div>
      </div>

      {/* Wire Colour Swatches */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>Wire Colour:</div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {WIRE_COLOURS.map(c => (
            <button
              key={c.value}
              onClick={() => updateWireColour(wire.id, c.value)}
              title={c.label}
              style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: c.value,
                border: wire.colour === c.value ? '2px solid #ffffff' : '1px solid rgba(0,0,0,0.5)',
                boxShadow: wire.colour === c.value ? `0 0 6px ${c.value}` : 'none',
                cursor: 'pointer',
                outline: 'none',
                padding: 0
              }}
            />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #1e293b', paddingTop: '8px' }}>
        <span style={{ fontSize: '10px', color: '#64748b' }}>
          Electrical: undirected
        </span>
        <button
          className="toolbar-btn"
          onClick={handleDelete}
          style={{
            background: 'rgba(244, 63, 94, 0.15)',
            borderColor: 'rgba(244, 63, 94, 0.4)',
            color: '#f43f5e',
            fontSize: '11px',
            padding: '3px 8px'
          }}
          title="Delete this wire (Delete / Backspace)"
        >
          <Trash2 size={12} />
          <span>Delete Wire</span>
        </button>
      </div>
    </div>
  );
};
