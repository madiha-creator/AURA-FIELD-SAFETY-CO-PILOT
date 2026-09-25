/**
 * Domain State Interfaces for FE-001 Part B Frontline Worker Workflows.
 * Extends the Part A voice session state machine without replacing it.
 */

export type ProvenanceType = 'said' | 'inferred' | 'confirmed' | 'unknown' | 'attention';

export interface FieldWithProvenance<T = string> {
  value: T;
  source: ProvenanceType;
  originalValue?: T;
  isCorrected?: boolean;
}

export interface ReportCorrection {
  field: string;
  previousValue: string;
  newValue: string;
  timestamp: string;
  source: ProvenanceType;
}

export interface ReportDraft {
  id: string;
  worker_id: string;
  site_id: string;
  location: FieldWithProvenance<string>;
  equipment: FieldWithProvenance<string>;
  hazard_type: FieldWithProvenance<string>;
  injury: FieldWithProvenance<string>;
  narrative: FieldWithProvenance<string>;
  immediate_action: FieldWithProvenance<string>;
  potential_consequence?: string;
  corrections: ReportCorrection[];
  createdAt: string;
  status: 'draft' | 'awaiting_review' | 'submitted';
  idempotency_key?: string;
}

export type WorkerWorkflowMode =
  | 'home'
  | 'safety_gate'
  | 'narrative_capture'
  | 'follow_up'
  | 'read_back'
  | 'draft_review'
  | 'confirm_report'
  | 'saved_report'
  | 'procedure'
  | 'safety_alert';

export interface ProcedureStep {
  id: number;
  instruction: string;
  details?: string;
  warning?: string;
  checkRequired?: boolean;
  readingParam?: string;
  expectedRange?: {
    min: number;
    max: number;
    unit: string;
  };
  requiresConfirmation: boolean;
}

export interface ProcedureDefinition {
  id: string;
  title: string;
  revision: string;
  totalSteps: number;
  steps: ProcedureStep[];
}

export interface SafetyAlertData {
  title: string;
  parameter: string;
  measuredValue: number;
  unit: string;
  expectedRange: {
    min: number;
    max: number;
  };
  deviationPct: number;
  severity: 'critical' | 'warn';
  message: string;
  prescribedAction: string;
  sourceContext: 'procedure' | 'general';
}

export interface PatternCheckResult {
  status: 'none' | 'found' | 'checking' | 'unavailable';
  count?: number;
  message: string;
  similarReports?: Array<{
    id: string;
    similarity: number;
    summary: string;
    date: string;
  }>;
}

export interface TaskItem {
  id: string;
  title: string;
  procedureId: string;
  status: 'assigned' | 'in_progress' | 'paused' | 'completed';
  stepCurrent: number;
  stepTotal: number;
  location: string;
  equipment: string;
  estimatedMinutes: number;
}

export interface LogItem {
  id: string;
  type: 'near_miss' | 'maintenance' | 'draft';
  title: string;
  subtitle: string;
  timestamp: string;
  status: 'awaiting_review' | 'approved' | 'rejected' | 'draft';
  location: string;
  equipment: string;
  payload?: any;
}
