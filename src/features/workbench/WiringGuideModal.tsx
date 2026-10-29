import React from 'react';
import { X, BookOpen, ExternalLink, AlertTriangle } from 'lucide-react';

interface WiringGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadUnwired: () => void;
  onLoadWired: () => void;
}

export const WiringGuideModal: React.FC<WiringGuideModalProps> = ({
  isOpen,
  onClose,
  onLoadUnwired,
  onLoadWired
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 100 }}>
      <div
        className="modal-dialog"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '580px', width: '90%' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={16} color="#06b6d4" />
            <span style={{ fontWeight: 600 }}>Automatic Street Light Wiring Guide</span>
          </div>
          <button className="icon-btn" onClick={onClose} title="Close guide">
            <X size={14} />
          </button>
        </div>

        <div className="modal-content" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5 }}>
            The automatic street light project uses an Arduino Uno, a Photoresistor (LDR) in a voltage divider
            circuit, and a white/yellow LED with a current-limiting series resistor.
          </p>

          <div style={{
            background: '#041f36',
            border: '1px solid #1e3a5f',
            borderRadius: '6px',
            padding: '10px 14px'
          }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#38bdf8', marginBottom: '8px' }}>
              Required 7 Wire Connections (Undirected):
            </div>
            <ol style={{ fontSize: '11px', color: '#e2e8f0', paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>
                <strong>Uno 5V</strong> → <strong>LDR Terminal 1</strong>
                <span style={{ color: '#94a3b8' }}> (Power supply rail to upper sensor divider)</span>
              </li>
              <li>
                <strong>LDR Terminal 2</strong> → <strong>Uno A0</strong>
                <span style={{ color: '#94a3b8' }}> (Analog input sensing light level voltage)</span>
              </li>
              <li>
                <strong>LDR Terminal 2 (or Uno A0)</strong> → <strong>10 kΩ Resistor Terminal 1</strong>
                <span style={{ color: '#94a3b8' }}> (Divider node tap)</span>
              </li>
              <li>
                <strong>10 kΩ Resistor Terminal 2</strong> → <strong>Uno GND</strong>
                <span style={{ color: '#94a3b8' }}> (Pull-down ground return)</span>
              </li>
              <li>
                <strong>Uno Pin D9</strong> → <strong>220 Ω Resistor Terminal 1</strong>
                <span style={{ color: '#94a3b8' }}> (PWM / digital LED drive output)</span>
              </li>
              <li>
                <strong>220 Ω Resistor Terminal 2</strong> → <strong>LED Anode (A / +)</strong>
                <span style={{ color: '#94a3b8' }}> (Current limiting resistor)</span>
              </li>
              <li>
                <strong>LED Cathode (K / -)</strong> → <strong>Uno GND</strong>
                <span style={{ color: '#94a3b8' }}> (Cathode return to ground rail)</span>
              </li>
            </ol>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 10px',
            background: 'rgba(234, 179, 8, 0.1)',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            borderRadius: '4px',
            fontSize: '11px',
            color: '#fbbf24'
          }}>
            <AlertTriangle size={14} style={{ flexShrink: 0 }} />
            <span>
              Resistors and LDRs are non-polarised (either terminal works). The LED is polarised:
              the anode must connect towards D9 (through the 220 Ω resistor) and the cathode to GND.
            </span>
          </div>

          <div style={{
            borderTop: '1px solid var(--pf-border-color)',
            paddingTop: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="toolbar-btn"
                onClick={() => {
                  onClose();
                  onLoadUnwired();
                }}
                title="Place Uno, LDR, 2 resistors, and LED arranged on canvas"
              >
                <span>Load Unwired Layout</span>
              </button>

              <button
                className="toolbar-btn"
                style={{ background: 'rgba(6, 182, 212, 0.15)', borderColor: '#06b6d4', color: '#22d3ee' }}
                onClick={() => {
                  onClose();
                  onLoadWired();
                }}
                title="Load full reference circuit for verification"
              >
                <ExternalLink size={12} />
                <span>Load Wired Example</span>
              </button>
            </div>

            <button className="toolbar-btn primary" onClick={onClose}>
              Got It
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
