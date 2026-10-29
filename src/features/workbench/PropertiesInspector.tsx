import React, { useState, useEffect } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { getComponentDefinition } from '../../domain/components/registry';
import {
  Sliders,
  Trash2,
  X,
  Check,
  AlertCircle,
  HelpCircle
} from 'lucide-react';

export const PropertiesInspector: React.FC = () => {
  const {
    project,
    selectedComponentId,
    updateComponentProperties,
    deleteComponent,
    isInspectorOpen,
    setInspectorOpen
  } = useProjectStore();

  const selectedInstance = project.circuit.components.find(c => c.id === selectedComponentId);
  const def = selectedInstance ? getComponentDefinition(selectedInstance.type) : null;

  // Local editable form state
  const [labelInput, setLabelInput] = useState('');
  const [propertyDrafts, setPropertyDrafts] = useState<Record<string, unknown>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState(false);

  // Sync draft state when selection changes
  useEffect(() => {
    if (selectedInstance) {
      setLabelInput(selectedInstance.label);
      setPropertyDrafts(JSON.parse(JSON.stringify(selectedInstance.properties)));
      setErrorMessage(null);
      setSuccessNotice(false);
    }
  }, [selectedInstance?.id]);

  if (!isInspectorOpen) {
    return (
      <button
        onClick={() => setInspectorOpen(true)}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'rgba(13, 19, 31, 0.95)',
          border: '1px solid var(--pf-border-color)',
          borderRadius: '6px',
          padding: '6px 10px',
          color: 'var(--pf-cyan-light)',
          fontSize: '11px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          zIndex: 20,
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
        }}
        title="Open Properties Inspector"
      >
        <Sliders size={13} />
        <span>Inspector</span>
      </button>
    );
  }

  // Handle property change with validation
  const handleApplyChanges = (newProps: Record<string, unknown>, newLbl: string) => {
    if (!selectedInstance) return;

    const res = updateComponentProperties(selectedInstance.id, newProps, newLbl);
    if (!res.success) {
      setErrorMessage(res.error || 'Validation failed.');
      setSuccessNotice(false);
    } else {
      setErrorMessage(null);
      setSuccessNotice(true);
      setTimeout(() => setSuccessNotice(false), 2000);
    }
  };

  // Specific preset buttons for resistor (220, 1000, 10000)
  const handleResistorPreset = (ohms: number) => {
    const nextProps = { ...propertyDrafts, resistance: ohms, unit: 'ohm' };
    setPropertyDrafts(nextProps);
    handleApplyChanges(nextProps, labelInput);
  };

  return (
    <aside
      className="properties-inspector"
      style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        bottom: '10px',
        width: '300px',
        background: 'rgba(13, 19, 31, 0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid var(--pf-border-color)',
        borderRadius: '8px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
      aria-label="Component Properties Inspector"
    >
      {/* Header */}
      <div style={{
        height: '42px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        borderBottom: '1px solid var(--pf-border-subtle)',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sliders size={15} color="#06b6d4" />
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#f1f5f9' }}>
            Properties Inspector
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {selectedInstance && (
            <button
              className="icon-btn"
              title="Delete component"
              onClick={() => deleteComponent(selectedInstance.id)}
            >
              <Trash2 size={13} color="#f43f5e" />
            </button>
          )}
          <button
            className="icon-btn"
            onClick={() => setInspectorOpen(false)}
            title="Minimize Inspector"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>
        {!selectedInstance || !def ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            textAlign: 'center',
            color: 'var(--pf-text-dim)',
            gap: '10px',
            padding: '20px'
          }}>
            <HelpCircle size={32} strokeWidth={1.5} color="#475569" />
            <p style={{ fontSize: '13px', fontWeight: 500, color: '#94a3b8' }}>
              No component selected
            </p>
            <p style={{ fontSize: '11px', lineHeight: 1.5 }}>
              Click any placed component on the workbench to inspect its labelled pinout and configure
              electrical parameters.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Component Identity Card */}
            <div style={{
              background: 'var(--pf-bg-panel-alt)',
              border: '1px solid var(--pf-border-subtle)',
              borderRadius: '6px',
              padding: '10px 12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#f1f5f9' }}>
                  {def.name}
                </span>
                <span style={{
                  fontSize: '9px',
                  fontWeight: 600,
                  color: '#22d3ee',
                  background: 'rgba(6, 182, 212, 0.12)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  padding: '1px 6px',
                  borderRadius: '4px'
                }}>
                  Visual Only
                </span>
              </div>
              <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', lineHeight: 1.4 }}>
                {def.description}
              </p>
            </div>

            {/* Label Field */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>
                Instance Label
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  value={labelInput}
                  onChange={e => setLabelInput(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'var(--pf-bg-panel-alt)',
                    border: '1px solid var(--pf-border-subtle)',
                    borderRadius: '4px',
                    padding: '5px 8px',
                    color: '#ffffff',
                    fontSize: '12px',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                  onBlur={() => handleApplyChanges(propertyDrafts, labelInput)}
                  onKeyDown={e => e.key === 'Enter' && handleApplyChanges(propertyDrafts, labelInput)}
                />
                <button
                  className="toolbar-btn primary"
                  style={{ padding: '4px 8px' }}
                  onClick={() => handleApplyChanges(propertyDrafts, labelInput)}
                  title="Save Label"
                >
                  <Check size={12} />
                </button>
              </div>
            </div>

            {/* Dynamic Property Fields Based on Component Type */}
            {selectedInstance.type === 'resistor' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>
                    Resistance Value (Ω)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={propertyDrafts.resistance as number || ''}
                    onChange={e => {
                      const val = parseFloat(e.target.value);
                      const next = { ...propertyDrafts, resistance: val };
                      setPropertyDrafts(next);
                      if (!isNaN(val) && val > 0) {
                        handleApplyChanges(next, labelInput);
                      }
                    }}
                    style={{
                      width: '100%',
                      background: 'var(--pf-bg-panel-alt)',
                      border: '1px solid var(--pf-border-subtle)',
                      borderRadius: '4px',
                      padding: '6px 8px',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontFamily: 'var(--font-mono)'
                    }}
                  />
                </div>

                {/* Quick Presets */}
                <div>
                  <span style={{ fontSize: '10px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                    Street Light Presets:
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      className="toolbar-btn"
                      onClick={() => handleResistorPreset(220)}
                      style={{ flex: 1, fontSize: '11px' }}
                    >
                      220 Ω (LED)
                    </button>
                    <button
                      className="toolbar-btn"
                      onClick={() => handleResistorPreset(1000)}
                      style={{ flex: 1, fontSize: '11px' }}
                    >
                      1 kΩ
                    </button>
                    <button
                      className="toolbar-btn"
                      onClick={() => handleResistorPreset(10000)}
                      style={{ flex: 1, fontSize: '11px' }}
                    >
                      10 kΩ (Divider)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {selectedInstance.type === 'led' && (
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                  LED Color
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                  {(['red', 'green', 'blue', 'yellow'] as const).map(c => {
                    const active = propertyDrafts.color === c;
                    return (
                      <button
                        key={c}
                        onClick={() => {
                          const next = { ...propertyDrafts, color: c };
                          setPropertyDrafts(next);
                          handleApplyChanges(next, labelInput);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 8px',
                          borderRadius: '4px',
                          background: active ? 'var(--pf-bg-active)' : 'var(--pf-bg-panel-alt)',
                          border: `1px solid ${active ? 'var(--pf-cyan)' : 'var(--pf-border-subtle)'}`,
                          fontSize: '11px',
                          color: '#ffffff',
                          textTransform: 'capitalize'
                        }}
                      >
                        <span style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: c === 'red' ? '#ef4444' : c === 'green' ? '#22c55e' : c === 'blue' ? '#3b82f6' : '#eab308'
                        }} />
                        <span>{c}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedInstance.type === 'ldr' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>
                    Dark Resistance (Ω)
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    value={propertyDrafts.darkResistance as number || ''}
                    onChange={e => {
                      const val = parseFloat(e.target.value);
                      const next = { ...propertyDrafts, darkResistance: val };
                      setPropertyDrafts(next);
                      if (!isNaN(val) && val > 0) {
                        handleApplyChanges(next, labelInput);
                      }
                    }}
                    style={{
                      width: '100%',
                      background: 'var(--pf-bg-panel-alt)',
                      border: '1px solid var(--pf-border-subtle)',
                      borderRadius: '4px',
                      padding: '6px 8px',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontFamily: 'var(--font-mono)'
                    }}
                  />
                  <span style={{ fontSize: '10px', color: '#64748b' }}>Default: 100,000 Ω (100 kΩ in dark)</span>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>
                    Bright Resistance (Ω)
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={propertyDrafts.brightResistance as number || ''}
                    onChange={e => {
                      const val = parseFloat(e.target.value);
                      const next = { ...propertyDrafts, brightResistance: val };
                      setPropertyDrafts(next);
                      if (!isNaN(val) && val > 0) {
                        handleApplyChanges(next, labelInput);
                      }
                    }}
                    style={{
                      width: '100%',
                      background: 'var(--pf-bg-panel-alt)',
                      border: '1px solid var(--pf-border-subtle)',
                      borderRadius: '4px',
                      padding: '6px 8px',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontFamily: 'var(--font-mono)'
                    }}
                  />
                  <span style={{ fontSize: '10px', color: '#64748b' }}>Default: 1,000 Ω (1 kΩ in daylight)</span>
                </div>

                <div style={{
                  fontSize: '10px',
                  color: '#94a3b8',
                  background: 'rgba(15, 23, 42, 0.6)',
                  padding: '6px 8px',
                  borderRadius: '4px',
                  border: '1px solid #1e293b'
                }}>
                  Note: Simplified model parameters for voltage divider math, not measured component calibration.
                </div>
              </div>
            )}

            {(selectedInstance.type === 'arduino-uno' || selectedInstance.type === 'esp32') && (
              <div style={{
                background: 'var(--pf-bg-panel-alt)',
                border: '1px solid var(--pf-border-subtle)',
                borderRadius: '6px',
                padding: '8px 10px',
                fontSize: '11px',
                color: '#94a3b8',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Operating Voltage:</span>
                  <strong style={{ color: '#ffffff' }}>
                    {selectedInstance.type === 'arduino-uno' ? '5.0V DC' : '3.3V DC'}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Clock Frequency:</span>
                  <strong style={{ color: '#ffffff' }}>
                    {selectedInstance.type === 'arduino-uno' ? '16 MHz' : '240 MHz'}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Architecture:</span>
                  <strong style={{ color: '#ffffff' }}>
                    {selectedInstance.type === 'arduino-uno' ? 'AVR 8-bit' : 'Xtensa Dual-Core 32-bit'}
                  </strong>
                </div>
                <span style={{ fontSize: '10px', color: '#64748b', fontStyle: 'italic', marginTop: '4px' }}>
                  * Fixed board hardware specifications cannot be arbitrarily altered.
                </span>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 8px',
                background: 'rgba(244, 63, 94, 0.12)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                borderRadius: '4px',
                fontSize: '11px',
                color: '#f43f5e'
              }}>
                <AlertCircle size={13} style={{ flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Notice */}
            {successNotice && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 8px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '4px',
                fontSize: '11px',
                color: '#10b981'
              }}>
                <Check size={13} />
                <span>Properties updated.</span>
              </div>
            )}

            {/* Pinout Overview */}
            <div style={{ marginTop: '4px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '6px'
              }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#cbd5e1' }}>
                  Terminal Pinout ({def.pins.length})
                </span>
                <span style={{ fontSize: '10px', color: '#64748b' }}>Wiring in Phase 3</span>
              </div>

              <div style={{
                maxHeight: '140px',
                overflowY: 'auto',
                background: 'var(--pf-bg-panel-alt)',
                border: '1px solid var(--pf-border-subtle)',
                borderRadius: '5px',
                padding: '4px 8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                {def.pins.map(pin => (
                  <div
                    key={pin.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '10px',
                      padding: '2px 0',
                      borderBottom: '1px solid rgba(255,255,255,0.04)'
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>{pin.label}</span>
                    <span style={{ color: '#64748b', textTransform: 'capitalize' }}>{pin.electricalRole}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
