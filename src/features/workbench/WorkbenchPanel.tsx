import React from 'react';
import { Cpu, Layers, Sparkles } from 'lucide-react';

export const WorkbenchPanel: React.FC = () => {
  return (
    <div className="workbench-container">
      {/* Header */}
      <div className="panel-header">
        <div className="panel-title">
          <Cpu size={14} color="#06b6d4" />
          <span>Electronics Workbench</span>
        </div>
        <div className="panel-actions">
          <span style={{ fontSize: '11px', color: '#64748b' }}>Phase 1 Foundation</span>
        </div>
      </div>

      {/* Dotted Canvas Area with Phase 1 Empty State */}
      <div className="workbench-canvas">
        <div className="workbench-card">
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            background: 'rgba(6, 182, 212, 0.12)',
            color: '#22d3ee',
            marginBottom: '16px'
          }}>
            <Layers size={22} />
          </div>

          <h3>Your workbench is ready. Component placement arrives in Phase 2.</h3>
          
          <p>
            This canvas is prepared for the interactive breadboard, component placement library,
            and pin-to-pin wiring engine.
          </p>

          <ul className="workbench-feature-list">
            <li>
              <span className="dot" />
              <span>Interactive Arduino Uno, LDR, Resistors, and LED placement</span>
            </li>
            <li>
              <span className="dot" />
              <span>Dynamic terminal net-graph and electrical connection validation</span>
            </li>
            <li>
              <span className="dot" />
              <span>Real-time ambient light sensor and divider simulation</span>
            </li>
          </ul>

          <div style={{
            marginTop: '16px',
            fontSize: '11px',
            color: '#475569',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}>
            <Sparkles size={12} color="#06b6d4" />
            <span>Target experiment: Automatic Street Light</span>
          </div>
        </div>
      </div>
    </div>
  );
};
