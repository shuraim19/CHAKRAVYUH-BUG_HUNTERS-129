import React, { useState, useMemo } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { getComponentDefinition } from '../../domain/components/registry';
import { Cable, Plus, Trash2, X, AlertCircle } from 'lucide-react';

interface ConnectionListProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConnectionList: React.FC<ConnectionListProps> = ({ isOpen, onClose }) => {
  const {
    project,
    addWire,
    deleteWire,
    selectedWireId,
    selectWire
  } = useProjectStore();

  const components = project.circuit.components;

  const [compAId, setCompAId] = useState<string>('');
  const [pinAId, setPinAId] = useState<string>('');
  const [compBId, setCompBId] = useState<string>('');
  const [pinBId, setPinBId] = useState<string>('');
  const [wireColour, setWireColour] = useState<string>('#06b6d4');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Available pins for comp A
  const pinsA = useMemo(() => {
    const comp = components.find(c => c.id === compAId);
    if (!comp) return [];
    const def = getComponentDefinition(comp.type);
    return def ? def.pins : [];
  }, [components, compAId]);

  // Available pins for comp B
  const pinsB = useMemo(() => {
    const comp = components.find(c => c.id === compBId);
    if (!comp) return [];
    const def = getComponentDefinition(comp.type);
    return def ? def.pins : [];
  }, [components, compBId]);

  if (!isOpen) return null;

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!compAId || !pinAId || !compBId || !pinBId) {
      setErrorMessage('Please select both components and pins.');
      return;
    }

    const res = addWire(
      { componentId: compAId, pinId: pinAId },
      { componentId: compBId, pinId: pinBId },
      wireColour
    );

    if (!res.success) {
      setErrorMessage(res.error || 'Connection failed.');
    } else {
      // Clear or keep selected component for fast chaining
      setPinAId('');
      setPinBId('');
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: '60px',
        right: '16px',
        zIndex: 25,
        width: '340px',
        maxHeight: 'calc(100% - 80px)',
        background: 'rgba(13, 19, 31, 0.98)',
        backdropFilter: 'blur(12px)',
        border: '1px solid var(--pf-border-color)',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
        color: '#ffffff',
        fontFamily: 'var(--font-sans)',
        fontSize: '12px',
        overflow: 'hidden'
      }}
      role="dialog"
      aria-label="Wiring & Connections"
    >
      {/* Header */}
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid var(--pf-border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(15, 23, 42, 0.6)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#38bdf8' }}>
          <Cable size={14} color="#06b6d4" />
          <span>Wiring &amp; Connections</span>
        </div>
        <button className="icon-btn" onClick={onClose} title="Close dialog">
          <X size={14} />
        </button>
      </div>

      <div style={{ padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Keyboard / Touch Connection Form */}
        <form onSubmit={handleConnect} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
            New Pin Connection
          </div>

          {/* From Component A + Pin */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <div>
              <label style={{ fontSize: '10px', color: '#64748b', display: 'block', marginBottom: '2px' }}>
                Component A
              </label>
              <select
                className="select-field"
                value={compAId}
                onChange={e => {
                  setCompAId(e.target.value);
                  setPinAId('');
                }}
                style={{
                  width: '100%',
                  background: '#041f36',
                  color: '#f8fafc',
                  border: '1px solid #1e3a5f',
                  borderRadius: '4px',
                  padding: '4px 6px',
                  fontSize: '11px'
                }}
              >
                <option value="">Select...</option>
                {components.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.label} ({c.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '10px', color: '#64748b', display: 'block', marginBottom: '2px' }}>
                Pin A
              </label>
              <select
                className="select-field"
                value={pinAId}
                onChange={e => setPinAId(e.target.value)}
                disabled={!compAId}
                style={{
                  width: '100%',
                  background: '#041f36',
                  color: '#f8fafc',
                  border: '1px solid #1e3a5f',
                  borderRadius: '4px',
                  padding: '4px 6px',
                  fontSize: '11px'
                }}
              >
                <option value="">Select pin...</option>
                {pinsA.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* To Component B + Pin */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <div>
              <label style={{ fontSize: '10px', color: '#64748b', display: 'block', marginBottom: '2px' }}>
                Component B
              </label>
              <select
                className="select-field"
                value={compBId}
                onChange={e => {
                  setCompBId(e.target.value);
                  setPinBId('');
                }}
                style={{
                  width: '100%',
                  background: '#041f36',
                  color: '#f8fafc',
                  border: '1px solid #1e3a5f',
                  borderRadius: '4px',
                  padding: '4px 6px',
                  fontSize: '11px'
                }}
              >
                <option value="">Select...</option>
                {components.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.label} ({c.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '10px', color: '#64748b', display: 'block', marginBottom: '2px' }}>
                Pin B
              </label>
              <select
                className="select-field"
                value={pinBId}
                onChange={e => setPinBId(e.target.value)}
                disabled={!compBId}
                style={{
                  width: '100%',
                  background: '#041f36',
                  color: '#f8fafc',
                  border: '1px solid #1e3a5f',
                  borderRadius: '4px',
                  padding: '4px 6px',
                  fontSize: '11px'
                }}
              >
                <option value="">Select pin...</option>
                {pinsB.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Colour and Connect button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>Colour:</span>
              <input
                type="color"
                value={wireColour}
                onChange={e => setWireColour(e.target.value)}
                style={{
                  width: '24px',
                  height: '24px',
                  padding: 0,
                  border: 'none',
                  borderRadius: '4px',
                  background: 'none',
                  cursor: 'pointer'
                }}
                title="Choose wire colour"
              />
            </div>

            <button
              type="submit"
              className="toolbar-btn primary"
              style={{ padding: '4px 10px', fontSize: '11px' }}
            >
              <Plus size={12} />
              <span>Connect</span>
            </button>
          </div>

          {errorMessage && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 8px',
              borderRadius: '4px',
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#f43f5e',
              fontSize: '11px'
            }}>
              <AlertCircle size={12} />
              <span>{errorMessage}</span>
            </div>
          )}
        </form>

        {/* Existing Wires List */}
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '6px',
            fontSize: '11px',
            fontWeight: 600,
            color: '#94a3b8',
            textTransform: 'uppercase'
          }}>
            <span>Active Wires</span>
            <span style={{ fontSize: '10px', color: '#64748b' }}>
              {project.circuit.wires.length} {project.circuit.wires.length === 1 ? 'wire' : 'wires'}
            </span>
          </div>

          {project.circuit.wires.length === 0 ? (
            <div style={{
              padding: '12px',
              textAlign: 'center',
              color: '#64748b',
              fontStyle: 'italic',
              background: '#060a12',
              borderRadius: '6px',
              border: '1px dashed #1e293b'
            }}>
              No wires connected. Drag between pin handles or use the form above to add a wire.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '180px', overflowY: 'auto' }}>
              {project.circuit.wires.map(w => {
                const cA = components.find(c => c.id === w.endpointA.componentId);
                const cB = components.find(c => c.id === w.endpointB.componentId);
                const dA = cA ? getComponentDefinition(cA.type) : null;
                const dB = cB ? getComponentDefinition(cB.type) : null;
                const pA = dA?.pins.find(p => p.id === w.endpointA.pinId)?.label || w.endpointA.pinId;
                const pB = dB?.pins.find(p => p.id === w.endpointB.pinId)?.label || w.endpointB.pinId;
                const isSelected = selectedWireId === w.id;

                return (
                  <div
                    key={w.id}
                    onClick={() => selectWire(w.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '4px 8px',
                      background: isSelected ? 'rgba(6, 182, 212, 0.15)' : '#070d17',
                      border: isSelected ? '1px solid #06b6d4' : '1px solid #1e293b',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: w.colour,
                          flexShrink: 0
                        }}
                      />
                      <span style={{ color: '#cbd5e1' }}>
                        {cA?.label || w.endpointA.componentId} [{pA}] ↔ {cB?.label || w.endpointB.componentId} [{pB}]
                      </span>
                    </div>

                    <button
                      className="icon-btn"
                      onClick={e => {
                        e.stopPropagation();
                        deleteWire(w.id);
                      }}
                      title="Delete connection"
                      style={{ padding: '2px', color: '#f43f5e' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
