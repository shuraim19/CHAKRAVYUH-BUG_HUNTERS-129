import { z } from 'zod';

export const AssistantModeSchema = z.enum([
  'ask',
  'explainComponent',
  'diagnoseCircuit',
  'explainCode',
  'proposeCode'
]);
export type AssistantMode = z.infer<typeof AssistantModeSchema>;

export const ChatMessageRoleSchema = z.enum(['user', 'model']);
export type ChatMessageRole = z.infer<typeof ChatMessageRoleSchema>;

export const ChatMessageSchema = z.object({
  id: z.string().optional(),
  role: ChatMessageRoleSchema,
  content: z.string().max(4000, 'Message content must not exceed 4,000 characters')
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ActiveFileContextSchema = z.object({
  path: z.string(),
  content: z.string().max(32000, 'Source file content exceeds max context limit'),
  language: z.string(),
  isProtected: z.boolean().default(false)
});
export type ActiveFileContext = z.infer<typeof ActiveFileContextSchema>;

export const ComponentPinContextSchema = z.object({
  id: z.string(),
  label: z.string(),
  electricalType: z.string()
});

export const SelectedComponentContextSchema = z.object({
  id: z.string(),
  type: z.string(),
  label: z.string(),
  properties: z.record(z.unknown()),
  pins: z.array(ComponentPinContextSchema)
});
export type SelectedComponentContext = z.infer<typeof SelectedComponentContextSchema>;

export const CircuitSummaryComponentSchema = z.object({
  id: z.string(),
  type: z.string(),
  label: z.string(),
  properties: z.record(z.unknown())
});

export const CircuitSummaryWireSchema = z.object({
  id: z.string(),
  endpointA: z.object({
    componentId: z.string(),
    pinId: z.string()
  }),
  endpointB: z.object({
    componentId: z.string(),
    pinId: z.string()
  }),
  colour: z.string()
});

export const DiagnosticContextSchema = z.object({
  code: z.string(),
  severity: z.enum(['error', 'warning', 'info']),
  message: z.string(),
  componentIds: z.array(z.string()).optional(),
  wireIds: z.array(z.string()).optional()
});

export const SimulationSummaryContextSchema = z.object({
  tested: z.boolean(),
  readyForSimulation: z.boolean(),
  errorCount: z.number(),
  warningCount: z.number(),
  statusMessage: z.string().optional()
});

export const ProjectContextSchema = z.object({
  activeFile: ActiveFileContextSchema.optional(),
  selectedComponent: SelectedComponentContextSchema.optional(),
  circuit: z.object({
    components: z.array(CircuitSummaryComponentSchema),
    wires: z.array(CircuitSummaryWireSchema)
  }).optional(),
  diagnostics: z.array(DiagnosticContextSchema).optional(),
  simulationSummary: SimulationSummaryContextSchema.optional()
});
export type ProjectContext = z.infer<typeof ProjectContextSchema>;

export const CodeProposalSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  baseRevision: z.number().int().nonnegative(),
  fileId: z.string(),
  filePath: z.string().regex(/^.+\.(ino|cpp|c|h)$/i, 'Only Arduino/C/C++ source files can be modified'),
  expectedOriginalContent: z.string(),
  replacementContent: z.string(),
  summary: z.string().min(1, 'Summary required'),
  explanation: z.string().min(1, 'Explanation required'),
  warnings: z.array(z.string()).default([])
});
export type CodeProposal = z.infer<typeof CodeProposalSchema>;

export const AssistantRequestSchema = z.object({
  requestId: z.string().min(1, 'requestId required'),
  mode: AssistantModeSchema,
  message: z.string().trim().min(1, 'Message cannot be empty').max(4000, 'Message cannot exceed 4,000 characters'),
  history: z.array(ChatMessageSchema).max(8, 'History cannot exceed 8 messages').default([]),
  projectId: z.string(),
  projectRevision: z.number().int().nonnegative(),
  circuitRevision: z.number().int().nonnegative().default(1),
  context: ProjectContextSchema.optional()
});
export type AssistantRequest = z.infer<typeof AssistantRequestSchema>;

export const AssistantResponseSchema = z.object({
  requestId: z.string(),
  reply: z.string(),
  proposal: CodeProposalSchema.optional(),
  contextSnapshot: z.object({
    projectId: z.string(),
    projectRevision: z.number(),
    fileId: z.string().optional(),
    filePath: z.string().optional()
  }).optional()
});
export type AssistantResponse = z.infer<typeof AssistantResponseSchema>;

export const AssistantErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  retryable: z.boolean(),
  retryAfter: z.number().optional()
});
export type AssistantError = z.infer<typeof AssistantErrorSchema>;
