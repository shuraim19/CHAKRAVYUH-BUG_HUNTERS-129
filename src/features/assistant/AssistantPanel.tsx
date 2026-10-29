import React from 'react';
import { Bot, Send, ShieldCheck, Lock } from 'lucide-react';

export const AssistantPanel: React.FC = () => {
  return (
    <div className="assistant-container">
      {/* Panel Header */}
      <div className="panel-header">
        <div className="panel-title">
          <Bot size={14} color="#06b6d4" />
          <span>Gemini Engineering Assistant</span>
        </div>
        <div className="panel-actions">
          <span style={{
            fontSize: '10px',
            fontWeight: 600,
            color: '#f59e0b',
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            padding: '2px 6px',
            borderRadius: '4px'
          }}>
            Not connected
          </span>
        </div>
      </div>

      {/* Main Body */}
      <div className="assistant-body">
        <div className="assistant-card">
          <div className="gemini-badge">
            <Lock size={12} color="#f59e0b" />
            <span>AI Module Offline</span>
          </div>

          <h4>Project-Aware Engineering Assistant</h4>

          <p>
            The Gemini assistant will analyze circuit topologies, debug code logic, explain voltage
            dividers, and propose safe, reviewable project modifications.
          </p>

          <p style={{
            fontSize: '11px',
            color: '#94a3b8',
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '8px',
            borderRadius: '6px',
            border: '1px solid #1e293b'
          }}>
            Secure server-side API proxy configuration arrives in Phase 6. No client-side API keys or
            fabricated responses are permitted.
          </p>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            marginTop: '12px',
            fontSize: '11px',
            color: '#64748b'
          }}>
            <ShieldCheck size={13} color="#10b981" />
            <span>Safe proposal review workflow</span>
          </div>
        </div>
      </div>

      {/* Disabled Footer Input */}
      <div className="assistant-footer">
        <input
          type="text"
          disabled
          className="assistant-input"
          placeholder="Assistant input disabled until Phase 6..."
          aria-label="Assistant message prompt"
        />
        <button
          disabled
          className="toolbar-btn"
          style={{ opacity: 0.4, cursor: 'not-allowed' }}
          title="AI Assistant arrives in Phase 6"
        >
          <Send size={13} />
        </button>
      </div>
    </div>
  );
};
