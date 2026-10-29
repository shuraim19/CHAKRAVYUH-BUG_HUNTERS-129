import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Square,
  RotateCcw,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  Sparkles,
  Cpu,
  Code,
  Info
} from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import {
  fetchAssistantStatus,
  sendAssistantMessage,
  buildProjectContext,
  ChatMessage
} from '../../lib/assistant-client';
import { ProposalReview } from './ProposalReview';

export const AssistantPanel: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [lastError, setLastError] = useState<{ message: string; retryable: boolean } | null>(null);
  const [lastFailedPayload, setLastFailedPayload] = useState<{ mode: any; message: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeAbortControllerRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    project,
    activeTabId,
    selectedComponentId,
    diagnostics,
    validationSummary,
    assistantMessages,
    activeProposal,
    lastUndoProposal,
    assistantStatus,
    isAssistantLoading,
    setAssistantStatus,
    setAssistantLoading,
    addAssistantMessage,
    clearAssistantMessages,
    setActiveProposal,
    undoProposal
  } = useProjectStore();

  const selectedComponent = project.circuit.components.find(c => c.id === selectedComponentId);

  // Check server assistant status on mount
  useEffect(() => {
    let isMounted = true;
    fetchAssistantStatus().then(status => {
      if (isMounted) {
        setAssistantStatus(status);
      }
    });

    return () => {
      isMounted = false;
      if (activeAbortControllerRef.current) {
        activeAbortControllerRef.current.abort();
        activeAbortControllerRef.current = null;
      }
    };
  }, [setAssistantStatus]);

  // Auto-scroll messages to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [assistantMessages, isAssistantLoading, activeProposal]);

  const handleStop = () => {
    if (activeAbortControllerRef.current) {
      activeAbortControllerRef.current.abort();
      activeAbortControllerRef.current = null;
    }
    setAssistantLoading(false);
  };

  const handleClear = () => {
    handleStop();
    clearAssistantMessages();
    setLastError(null);
    setLastFailedPayload(null);
  };

  const executeSend = async (mode: 'ask' | 'explainComponent' | 'diagnoseCircuit' | 'explainCode' | 'proposeCode', text: string) => {
    if (isAssistantLoading) return;
    const trimmed = text.trim();
    if (!trimmed) return;

    setLastError(null);
    setInputValue('');

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: trimmed
    };
    addAssistantMessage(userMsg);

    // Bounded context capture
    const context = buildProjectContext(
      project,
      activeTabId,
      selectedComponentId,
      diagnostics,
      validationSummary
    );

    const controller = new AbortController();
    activeAbortControllerRef.current = controller;
    setAssistantLoading(true);

    const snapshotRevision = project.revision;

    try {
      const result = await sendAssistantMessage(
        {
          requestId: `req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          mode,
          message: trimmed,
          history: assistantMessages.slice(-8),
          projectId: project.id,
          projectRevision: project.revision,
          circuitRevision: 1,
          context
        },
        controller.signal
      );

      if (activeAbortControllerRef.current !== controller) {
        // Obsolete or aborted request
        return;
      }

      if (result.success) {
        const response = result.response;
        const modelMsg: ChatMessage = {
          id: `msg-${Date.now()}-model`,
          role: 'model',
          content: response.reply
        };
        addAssistantMessage(modelMsg);

        if (response.proposal) {
          setActiveProposal(response.proposal);
        }

        // Check if project state moved while response was pending
        if (project.revision !== snapshotRevision) {
          useProjectStore.getState().addLog('warn', 'Gemini response refers to an earlier project revision snapshot.');
        }
      } else {
        setLastError({
          message: result.error.message,
          retryable: result.error.retryable
        });
        setLastFailedPayload({ mode, message: trimmed });
      }
    } catch {
      setLastError({
        message: 'Unexpected network error communicating with assistant.',
        retryable: true
      });
      setLastFailedPayload({ mode, message: trimmed });
    } finally {
      if (activeAbortControllerRef.current === controller) {
        activeAbortControllerRef.current = null;
        setAssistantLoading(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      executeSend('ask', inputValue);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Safe markdown renderer without raw HTML
  const renderSafeMarkdown = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeLanguage = '';
    let codeBuffer: string[] = [];

    lines.forEach((line, lineIdx) => {
      // Code block start/end
      if (line.trim().startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeLanguage = line.trim().slice(3).trim();
          codeBuffer = [];
        } else {
          inCodeBlock = false;
          const codeContent = codeBuffer.join('\n');
          const codeId = `code-${lineIdx}`;
          elements.push(
            <div key={`code-block-${lineIdx}`} className="code-block-wrap" style={{
              background: '#090d16',
              border: '1px solid #1e293b',
              borderRadius: '6px',
              margin: '8px 0',
              overflow: 'hidden'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '4px 10px',
                background: '#0f172a',
                borderBottom: '1px solid #1e293b',
                fontSize: '11px',
                color: '#64748b'
              }}>
                <span>{codeLanguage || 'code'}</span>
                <button
                  type="button"
                  className="toolbar-btn"
                  style={{ fontSize: '10px', padding: '2px 6px', height: 'auto' }}
                  onClick={() => copyToClipboard(codeContent, codeId)}
                  title="Copy code"
                >
                  {copiedId === codeId ? <Check size={11} color="#10b981" /> : <Copy size={11} />}
                  <span>{copiedId === codeId ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre style={{
                margin: 0,
                padding: '10px',
                fontSize: '12px',
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                color: '#38bdf8',
                overflowX: 'auto',
                whiteSpace: 'pre'
              }}>
                <code>{codeContent}</code>
              </pre>
            </div>
          );
        }
        return;
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        return;
      }

      // Headers
      if (line.startsWith('### ')) {
        elements.push(
          <h4 key={`h3-${lineIdx}`} style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc', margin: '8px 0 4px 0' }}>
            {line.replace(/^###\s+/, '')}
          </h4>
        );
        return;
      }
      if (line.startsWith('## ')) {
        elements.push(
          <h3 key={`h2-${lineIdx}`} style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc', margin: '10px 0 4px 0' }}>
            {line.replace(/^##\s+/, '')}
          </h3>
        );
        return;
      }

      // Bullet items
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const itemText = line.trim().replace(/^[-*]\s+/, '');
        elements.push(
          <div key={`li-${lineIdx}`} style={{ display: 'flex', gap: '6px', margin: '3px 0', paddingLeft: '6px' }}>
            <span style={{ color: '#06b6d4' }}>•</span>
            <span>{renderInlineStyles(itemText)}</span>
          </div>
        );
        return;
      }

      // Normal paragraph
      if (line.trim().length > 0) {
        elements.push(
          <p key={`p-${lineIdx}`} style={{ margin: '4px 0' }}>
            {renderInlineStyles(line)}
          </p>
        );
      }
    });

    return elements;
  };

  // Inline formatting helper (bold, code, italic)
  const renderInlineStyles = (text: string) => {
    const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} style={{
            background: 'rgba(15, 23, 42, 0.8)',
            padding: '2px 5px',
            borderRadius: '4px',
            fontSize: '11px',
            fontFamily: 'monospace',
            color: '#38bdf8',
            border: '1px solid #1e293b'
          }}>
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} style={{ color: '#f8fafc', fontWeight: 600 }}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="assistant-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Panel Header */}
      <div className="panel-header" style={{ flexShrink: 0 }}>
        <div className="panel-title">
          <Bot size={15} color="#06b6d4" />
          <span>Gemini Assistant</span>
        </div>

        <div className="panel-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Status Badge */}
          {assistantStatus.configured ? (
            <span style={{
              fontSize: '10px',
              fontWeight: 600,
              color: '#10b981',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              padding: '2px 6px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
              Ready ({assistantStatus.model})
            </span>
          ) : (
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                color: '#f59e0b',
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                padding: '2px 6px',
                borderRadius: '4px'
              }}
              title="Add GEMINI_API_KEY to .env.local to enable AI features"
            >
              AI Not Configured
            </span>
          )}

          {lastUndoProposal && (
            <button
              type="button"
              className="toolbar-btn"
              onClick={() => undoProposal()}
              title="Undo accepted code proposal"
              style={{ fontSize: '11px', padding: '2px 6px', height: '22px' }}
            >
              <RotateCcw size={11} />
              <span>Undo Code</span>
            </button>
          )}

          {assistantMessages.length > 0 && (
            <button
              type="button"
              className="toolbar-btn"
              onClick={handleClear}
              title="Clear conversation"
              style={{ fontSize: '11px', padding: '2px 6px', height: '22px' }}
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Notice Banner */}
      <div style={{
        padding: '6px 12px',
        background: 'rgba(15, 23, 42, 0.7)',
        borderBottom: '1px solid #1e293b',
        fontSize: '11px',
        color: '#94a3b8',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        flexShrink: 0
      }}>
        <Info size={12} color="#06b6d4" style={{ flexShrink: 0 }} />
        <span>Selected project context is sent to Google Gemini. Chats are not saved by this app.</span>
      </div>

      {/* Main Messages Container */}
      <div className="assistant-body" style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {assistantMessages.length === 0 ? (
          <div className="assistant-card" style={{ maxWidth: '420px', margin: '20px auto' }}>
            <div className="gemini-badge">
              <Sparkles size={13} color="#06b6d4" />
              <span>Engineering Guidance</span>
            </div>

            <h4>How can I assist your electronics lab?</h4>

            <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
              I can analyze the automatic street light circuit, debug sensor divider thresholds, explain component pinouts, and suggest reviewed code modifications.
            </p>

            {/* Quick Action Chips */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '14px' }}>
              <button
                type="button"
                className="toolbar-btn"
                disabled={!selectedComponent || isAssistantLoading}
                onClick={() => {
                  if (selectedComponent) {
                    executeSend('explainComponent', `Explain the selected ${selectedComponent.label} (${selectedComponent.type}) and its pin functions.`);
                  }
                }}
                style={{
                  justifyContent: 'flex-start',
                  fontSize: '11px',
                  padding: '7px 10px',
                  opacity: selectedComponent ? 1 : 0.5
                }}
              >
                <Cpu size={13} color="#06b6d4" />
                <span>
                  {selectedComponent
                    ? `Explain selected ${selectedComponent.label}`
                    : 'Explain selected component (Select one on canvas)'}
                </span>
              </button>

              <button
                type="button"
                className="toolbar-btn"
                disabled={isAssistantLoading}
                onClick={() => {
                  executeSend('diagnoseCircuit', 'Why is my LED off? Please analyze my current wiring and diagnostics.');
                }}
                style={{ justifyContent: 'flex-start', fontSize: '11px', padding: '7px 10px' }}
              >
                <AlertCircle size={13} color="#f59e0b" />
                <span>Why is my LED off? (Diagnose Circuit)</span>
              </button>

              <button
                type="button"
                className="toolbar-btn"
                disabled={isAssistantLoading}
                onClick={() => {
                  executeSend('explainCode', 'Explain the active Arduino source code and its threshold logic.');
                }}
                style={{ justifyContent: 'flex-start', fontSize: '11px', padding: '7px 10px' }}
              >
                <Code size={13} color="#38bdf8" />
                <span>Explain this code</span>
              </button>

              <button
                type="button"
                className="toolbar-btn"
                disabled={isAssistantLoading}
                onClick={() => {
                  executeSend('proposeCode', 'Suggest a code improvement for the automatic street light hysteresis threshold.');
                }}
                style={{ justifyContent: 'flex-start', fontSize: '11px', padding: '7px 10px' }}
              >
                <Sparkles size={13} color="#ec4899" />
                <span>Suggest a code improvement (Reviewable Diff)</span>
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {assistantMessages.map(msg => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '90%',
                  background: msg.role === 'user' ? '#0369a1' : 'rgba(15, 23, 42, 0.85)',
                  border: msg.role === 'user' ? '1px solid #0284c7' : '1px solid #1e293b',
                  borderRadius: msg.role === 'user' ? '10px 10px 2px 10px' : '10px 10px 10px 2px',
                  padding: '10px 12px',
                  color: '#f8fafc',
                  fontSize: '12px',
                  lineHeight: 1.5,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '4px',
                  fontSize: '11px',
                  color: msg.role === 'user' ? '#bae6fd' : '#94a3b8'
                }}>
                  <span style={{ fontWeight: 600 }}>{msg.role === 'user' ? 'You' : 'Gemini'}</span>
                  {msg.role === 'model' && (
                    <button
                      type="button"
                      className="toolbar-btn"
                      style={{ fontSize: '10px', padding: '1px 4px', height: 'auto', background: 'transparent', border: 'none' }}
                      onClick={() => copyToClipboard(msg.content, msg.id || 'msg')}
                      title="Copy response"
                    >
                      {copiedId === msg.id ? <Check size={11} color="#10b981" /> : <Copy size={11} />}
                    </button>
                  )}
                </div>

                <div style={{ wordBreak: 'break-word' }}>
                  {msg.role === 'user' ? msg.content : renderSafeMarkdown(msg.content)}
                </div>
              </div>
            ))}

            {/* Active Code Proposal Review Widget */}
            {activeProposal && (
              <ProposalReview
                proposal={activeProposal}
                onAccept={() => setActiveProposal(null)}
                onReject={() => setActiveProposal(null)}
              />
            )}

            {/* Loading Indicator */}
            {isAssistantLoading && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                background: 'rgba(15, 23, 42, 0.7)',
                borderRadius: '8px',
                border: '1px solid #0284c7',
                alignSelf: 'flex-start',
                fontSize: '12px',
                color: '#38bdf8'
              }}>
                <Sparkles size={14} className="spin-animation" />
                <span>Gemini is analyzing project context...</span>
                <button
                  type="button"
                  className="toolbar-btn"
                  onClick={handleStop}
                  style={{ marginLeft: '10px', fontSize: '11px', padding: '2px 8px' }}
                >
                  <Square size={10} color="#f87171" />
                  <span>Stop</span>
                </button>
              </div>
            )}

            {/* Error Banner */}
            {lastError && (
              <div style={{
                padding: '10px 12px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#f87171',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{lastError.message}</span>
                </div>
                {lastError.retryable && lastFailedPayload && (
                  <button
                    type="button"
                    className="toolbar-btn"
                    onClick={() => executeSend(lastFailedPayload.mode, lastFailedPayload.message)}
                    style={{ fontSize: '11px', padding: '3px 8px', flexShrink: 0 }}
                  >
                    <span>Retry</span>
                  </button>
                )}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Footer */}
      <div className="assistant-footer" style={{
        padding: '10px 12px',
        borderTop: '1px solid #1e293b',
        background: '#090d16',
        flexShrink: 0
      }}>
        {/* Quick action bar */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
          <button
            type="button"
            className="toolbar-btn"
            disabled={!selectedComponent || isAssistantLoading}
            onClick={() => {
              if (selectedComponent) {
                executeSend('explainComponent', `Explain the selected ${selectedComponent.label} (${selectedComponent.type}) and its pin functions.`);
              }
            }}
            style={{ fontSize: '10px', padding: '3px 8px', whiteSpace: 'nowrap', opacity: selectedComponent ? 1 : 0.5 }}
            title={selectedComponent ? `Explain ${selectedComponent.label}` : 'Select a component on the canvas first'}
          >
            <Cpu size={11} />
            <span>Explain Component</span>
          </button>

          <button
            type="button"
            className="toolbar-btn"
            disabled={isAssistantLoading}
            onClick={() => executeSend('diagnoseCircuit', 'Why is my LED off? Analyze current wiring and problems.')}
            style={{ fontSize: '10px', padding: '3px 8px', whiteSpace: 'nowrap' }}
          >
            <AlertCircle size={11} />
            <span>Diagnose Circuit</span>
          </button>

          <button
            type="button"
            className="toolbar-btn"
            disabled={isAssistantLoading}
            onClick={() => executeSend('explainCode', 'Explain the active Arduino code.')}
            style={{ fontSize: '10px', padding: '3px 8px', whiteSpace: 'nowrap' }}
          >
            <Code size={11} />
            <span>Explain Code</span>
          </button>

          <button
            type="button"
            className="toolbar-btn"
            disabled={isAssistantLoading}
            onClick={() => executeSend('proposeCode', 'Suggest a code improvement for the street light threshold logic.')}
            style={{ fontSize: '10px', padding: '3px 8px', whiteSpace: 'nowrap' }}
          >
            <Sparkles size={11} />
            <span>Propose Code</span>
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            className="assistant-input"
            rows={2}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              assistantStatus.configured
                ? "Ask about electronics, wiring, or code (Enter to send, Shift+Enter for newline)..."
                : "Ask question (AI not configured in .env.local)..."
            }
            aria-label="Assistant message prompt"
            style={{
              flex: 1,
              resize: 'none',
              borderRadius: '6px',
              padding: '8px',
              fontSize: '12px',
              fontFamily: 'inherit',
              background: '#0f172a',
              border: '1px solid #1e293b',
              color: '#f8fafc',
              lineHeight: 1.4
            }}
          />

          {isAssistantLoading ? (
            <button
              type="button"
              className="toolbar-btn"
              onClick={handleStop}
              title="Stop generating"
              style={{ padding: '8px 12px', height: '44px' }}
            >
              <Square size={14} color="#f87171" />
            </button>
          ) : (
            <button
              type="button"
              className="toolbar-btn primary"
              disabled={!inputValue.trim()}
              onClick={() => executeSend('ask', inputValue)}
              title="Send message (Enter)"
              style={{
                padding: '8px 12px',
                height: '44px',
                opacity: inputValue.trim() ? 1 : 0.5
              }}
            >
              <Send size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
