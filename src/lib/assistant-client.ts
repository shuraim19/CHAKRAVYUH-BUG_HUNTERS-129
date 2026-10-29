import {
  AssistantRequest,
  AssistantResponse,
  AssistantError,
  CodeProposal,
  ChatMessage
} from '../../server/assistant-contracts';
import { Project, Diagnostic, isProtectedFile } from '../domain/project/schema';
import { getComponentDefinition } from '../domain/components/registry';

export interface AssistantStatus {
  configured: boolean;
  model: string;
}

export type AssistantResult =
  | { success: true; response: AssistantResponse }
  | { success: false; error: AssistantError };

/**
 * Check if the Gemini assistant is configured on the backend server.
 */
export async function fetchAssistantStatus(signal?: AbortSignal): Promise<AssistantStatus> {
  try {
    const res = await fetch('/api/assistant', {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' },
      signal
    });

    if (!res.ok) {
      return { configured: false, model: 'gemini-3.5-flash-lite' };
    }

    const data = await res.json();
    return {
      configured: Boolean(data.configured),
      model: data.model || 'gemini-3.5-flash-lite'
    };
  } catch {
    return { configured: false, model: 'gemini-3.5-flash-lite' };
  }
}

/**
 * Build safe, bounded project context from the current workspace state.
 */
export function buildProjectContext(
  project: Project,
  activeTabId: string | null,
  selectedComponentId: string | null,
  diagnostics: Diagnostic[],
  validationSummary: { tested: boolean; readyForSimulation: boolean; errorCount: number; warningCount: number }
): AssistantRequest['context'] {
  // 1. Active File (Arduino code or documentation)
  let activeFileContext: {
    path: string;
    content: string;
    language: string;
    isProtected: boolean;
  } | undefined;

  if (activeTabId) {
    const activeFile = project.files.find(f => f.id === activeTabId);
    if (activeFile) {
      // Exclude oversized files or non-code/project files
      activeFileContext = {
        path: activeFile.path,
        content: activeFile.content.slice(0, 16000), // Bounded file slice
        language: activeFile.language,
        isProtected: isProtectedFile(activeFile.path)
      };
    }
  }

  // 2. Selected Component
  let selectedComponentContext: {
    id: string;
    type: string;
    label: string;
    properties: Record<string, unknown>;
    pins: Array<{ id: string; label: string; electricalType: string }>;
  } | undefined;

  if (selectedComponentId) {
    const comp = project.circuit.components.find(c => c.id === selectedComponentId);
    if (comp) {
      const def = getComponentDefinition(comp.type);
      selectedComponentContext = {
        id: comp.id,
        type: comp.type,
        label: comp.label,
        properties: comp.properties,
        pins: (def?.pins || []).map(p => ({
          id: p.id,
          label: p.label,
          electricalType: p.electricalRole
        }))
      };
    }
  }

  // 3. Circuit Components & Wires
  const circuitContext = {
    components: project.circuit.components.map(c => ({
      id: c.id,
      type: c.type,
      label: c.label,
      properties: c.properties
    })),
    wires: project.circuit.wires.map(w => ({
      id: w.id,
      endpointA: w.endpointA,
      endpointB: w.endpointB,
      colour: w.colour
    }))
  };

  // 4. Deterministic Diagnostics
  const diagContext = diagnostics.map(d => ({
    code: d.code,
    severity: d.severity,
    message: d.message,
    componentIds: d.componentIds,
    wireIds: d.wireIds
  }));

  // 5. Simulation Summary
  const simContext = {
    tested: validationSummary.tested,
    readyForSimulation: validationSummary.readyForSimulation,
    errorCount: validationSummary.errorCount,
    warningCount: validationSummary.warningCount,
    statusMessage: validationSummary.tested
      ? (validationSummary.errorCount === 0 ? 'No errors found by the implemented checks.' : `${validationSummary.errorCount} error(s) present.`)
      : 'Circuit not yet validated.'
  };

  return {
    activeFile: activeFileContext,
    selectedComponent: selectedComponentContext,
    circuit: circuitContext,
    diagnostics: diagContext,
    simulationSummary: simContext
  };
}

/**
 * Send an assistant prompt with current workspace context.
 */
export async function sendAssistantMessage(
  payload: AssistantRequest,
  signal?: AbortSignal
): Promise<AssistantResult> {
  try {
    const response = await fetch('/api/assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      },
      body: JSON.stringify(payload),
      signal
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: {
          code: data.code || 'HTTP_ERROR',
          message: data.message || `Request failed with status ${response.status}`,
          retryable: data.retryable ?? true,
          retryAfter: data.retryAfter
        }
      };
    }

    return {
      success: true,
      response: data as AssistantResponse
    };
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      return {
        success: false,
        error: {
          code: 'ABORTED',
          message: 'Assistant request was cancelled.',
          retryable: false
        }
      };
    }

    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Could not connect to the assistant service. Please verify the local development server is running.',
        retryable: true
      }
    };
  }
}

export type { CodeProposal, ChatMessage, AssistantResponse, AssistantError };
