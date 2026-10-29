import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

// Configure Monaco Environment to use local bundled workers (no external CDN dependency)
(self as unknown as { MonacoEnvironment: unknown }).MonacoEnvironment = {
  getWorker(_: unknown, label: string) {
    if (label === 'json') {
      return new jsonWorker();
    }
    if (label === 'typescript' || label === 'javascript') {
      return new tsWorker();
    }
    return new editorWorker();
  }
};

// Define dark navy / cyan theme for ProtoForge
monaco.editor.defineTheme('protoforge-dark', {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
    { token: 'keyword', foreground: '22d3ee', fontStyle: 'bold' },
    { token: 'number', foreground: '38bdf8' },
    { token: 'string', foreground: '34d399' },
    { token: 'type', foreground: '818cf8' },
    { token: 'identifier', foreground: 'e2e8f0' }
  ],
  colors: {
    'editor.background': '#0c121d',
    'editor.foreground': '#f1f5f9',
    'editor.lineHighlightBackground': '#141d2d',
    'editorCursor.foreground': '#22d3ee',
    'editorWhitespace.foreground': '#1e293b',
    'editorIndentGuide.background': '#1a2436',
    'editorIndentGuide.activeBackground': '#06b6d4',
    'editorLineNumber.foreground': '#475569',
    'editorLineNumber.activeForeground': '#22d3ee',
    'editor.selectionBackground': '#1e3a5f',
    'editor.inactiveSelectionBackground': '#172b47'
  }
});

export { monaco };
