import React, { useEffect, useRef, useState } from 'react';
import { monaco } from '../../lib/monaco';
import { useProjectStore } from '../../store/projectStore';
import { CodeProposal } from '../../lib/assistant-client';
import { Check, X, AlertTriangle, FileCode, Columns, AlignJustify } from 'lucide-react';

interface ProposalReviewProps {
  proposal: CodeProposal;
  onAccept: () => void;
  onReject: () => void;
}

export const ProposalReview: React.FC<ProposalReviewProps> = ({
  proposal,
  onAccept,
  onReject
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const diffEditorRef = useRef<monaco.editor.IStandaloneDiffEditor | null>(null);
  const originalModelRef = useRef<monaco.editor.ITextModel | null>(null);
  const modifiedModelRef = useRef<monaco.editor.ITextModel | null>(null);

  const [renderSideBySide, setRenderSideBySide] = useState<boolean>(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  const { project, applyProposal } = useProjectStore();

  const targetFile = project.files.find(
    f => f.id === proposal.fileId || f.path === proposal.filePath
  );

  // Validate state integrity
  const isProjectMismatch = project.id !== proposal.projectId;
  const isFileMissing = !targetFile;
  const isContentStale = targetFile ? targetFile.content !== proposal.expectedOriginalContent : true;
  const isStale = isProjectMismatch || isFileMissing || isContentStale;

  // Mount Monaco Diff Editor
  useEffect(() => {
    if (!containerRef.current) return;

    if (!diffEditorRef.current) {
      diffEditorRef.current = monaco.editor.createDiffEditor(containerRef.current, {
        theme: 'protoforge-dark',
        readOnly: true,
        automaticLayout: true,
        fontSize: 12,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        minimap: { enabled: false },
        lineNumbers: 'on',
        renderSideBySide,
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        originalEditable: false,
        padding: { top: 6, bottom: 6 }
      });
    }

    const lang = proposal.filePath.endsWith('.json')
      ? 'json'
      : proposal.filePath.endsWith('.md')
      ? 'markdown'
      : 'cpp';

    if (originalModelRef.current) originalModelRef.current.dispose();
    if (modifiedModelRef.current) modifiedModelRef.current.dispose();

    originalModelRef.current = monaco.editor.createModel(proposal.expectedOriginalContent, lang);
    modifiedModelRef.current = monaco.editor.createModel(proposal.replacementContent, lang);

    diffEditorRef.current.setModel({
      original: originalModelRef.current,
      modified: modifiedModelRef.current
    });

    return () => {
      if (diffEditorRef.current) {
        diffEditorRef.current.dispose();
        diffEditorRef.current = null;
      }
      if (originalModelRef.current) {
        originalModelRef.current.dispose();
        originalModelRef.current = null;
      }
      if (modifiedModelRef.current) {
        modifiedModelRef.current.dispose();
        modifiedModelRef.current = null;
      }
    };
  }, [proposal, renderSideBySide]);

  const handleAcceptClick = () => {
    setApplyError(null);
    const result = applyProposal(proposal);
    if (result.success) {
      onAccept();
    } else {
      setApplyError(result.error || 'Failed to apply proposal.');
    }
  };

  return (
    <div style={{
      background: 'rgba(15, 23, 42, 0.95)',
      border: '1px solid #0284c7',
      borderRadius: '8px',
      overflow: 'hidden',
      marginTop: '12px',
      marginBottom: '12px',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)'
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 14px',
        background: 'rgba(2, 132, 199, 0.15)',
        borderBottom: '1px solid rgba(2, 132, 199, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileCode size={16} color="#38bdf8" />
          <span style={{ fontWeight: 600, fontSize: '13px', color: '#f8fafc' }}>
            Proposed Changes: {proposal.filePath}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            className="toolbar-btn"
            style={{ fontSize: '11px', padding: '3px 7px' }}
            onClick={() => setRenderSideBySide(!renderSideBySide)}
            title={renderSideBySide ? 'Switch to inline diff' : 'Switch to side-by-side diff'}
          >
            {renderSideBySide ? <AlignJustify size={12} /> : <Columns size={12} />}
            <span>{renderSideBySide ? 'Inline' : 'Side-by-Side'}</span>
          </button>
        </div>
      </div>

      {/* Summary & Explanation */}
      <div style={{ padding: '12px 14px', fontSize: '12px', lineHeight: 1.5, color: '#e2e8f0' }}>
        <p style={{ fontWeight: 600, color: '#38bdf8', margin: '0 0 6px 0' }}>
          {proposal.summary}
        </p>
        <p style={{ margin: 0, color: '#94a3b8' }}>
          {proposal.explanation}
        </p>

        {/* Warnings */}
        {proposal.warnings && proposal.warnings.length > 0 && (
          <div style={{
            marginTop: '10px',
            padding: '8px 10px',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '6px',
            color: '#fbbf24',
            fontSize: '11px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, marginBottom: '4px' }}>
              <AlertTriangle size={13} />
              <span>Warnings & Limitations:</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px' }}>
              {proposal.warnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Stale Warning */}
        {isStale && (
          <div style={{
            marginTop: '10px',
            padding: '8px 10px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '6px',
            color: '#f87171',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <AlertTriangle size={14} style={{ flexShrink: 0 }} />
            <span>
              {isFileMissing
                ? `File ${proposal.filePath} no longer exists in project.`
                : 'File content was modified after proposal generation. Proposal is stale and cannot be applied.'}
            </span>
          </div>
        )}

        {applyError && (
          <div style={{
            marginTop: '8px',
            color: '#f87171',
            fontSize: '11px',
            fontWeight: 500
          }}>
            Error: {applyError}
          </div>
        )}
      </div>

      {/* Monaco Diff View */}
      <div
        ref={containerRef}
        style={{
          height: '240px',
          width: '100%',
          borderTop: '1px solid #1e293b',
          borderBottom: '1px solid #1e293b'
        }}
      />

      {/* Action Footer */}
      <div style={{
        padding: '10px 14px',
        background: '#090d16',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: '8px'
      }}>
        <button
          type="button"
          className="toolbar-btn"
          onClick={onReject}
          title="Reject proposal and keep current code unchanged"
          style={{ fontSize: '12px', padding: '5px 12px' }}
        >
          <X size={13} />
          <span>Reject</span>
        </button>

        <button
          type="button"
          className="toolbar-btn primary"
          disabled={isStale}
          onClick={handleAcceptClick}
          title={isStale ? 'Cannot apply stale proposal' : 'Apply replacement content to file'}
          style={{
            fontSize: '12px',
            padding: '5px 14px',
            opacity: isStale ? 0.4 : 1,
            cursor: isStale ? 'not-allowed' : 'pointer'
          }}
        >
          <Check size={13} />
          <span>Accept Changes</span>
        </button>
      </div>
    </div>
  );
};
