/**
 * TypeScript definitions for Aura Field Safety Co-Pilot Tool Schemas & SAF Contracts
 */

export type SessionMode = 'field_ops' | 'reporting';

export type ExposureState = 'clear' | 'exposed' | 'unknown';
export type RecommendedAction = 'proceed' | 'evacuate_or_isolate' | 'confirm_clear_then_retry';
export type ThresholdSeverity = 'ok' | 'warn' | 'critical' | 'unknown';

// ============================================================================
// Locked SAF Contracts
// ============================================================================

export interface CheckSafetyStatusInput {
  session_id: string;
  mode: SessionMode;
  worker_id: string;
  site_id?: string | null;
  equipment_id?: string | null;
  self_reported_clear?: boolean | null;
}

export interface CheckSafetyStatusOutput {
  safe_to_report: boolean;
  exposure_state: ExposureState;
  reason: string;
  recommended_action: RecommendedAction;
}

export interface CheckSafetyThresholdContext {
  procedure?: string | null;
  step?: number | null;
  equipment?: string | null;
  location?: string | null;
}

export interface CheckSafetyThresholdInput {
  parameter: string;
  value: number;
  unit: string;
  context?: CheckSafetyThresholdContext;
}

export interface CheckSafetyThresholdOutput {
  in_range: boolean;
  measured_value: number;
  unit: string;
  expected_range: {
    min: number;
    max: number;
  };
  deviation_pct: number;
  severity: ThresholdSeverity;
  message: string;
}

// ============================================================================
// Tool Inputs & Outputs
// ============================================================================

export interface QueryManualDbInput {
  procedure: string;
  step?: number | null;
  parameter?: string | null;
}

export interface RelatedRange {
  parameter: string;
  min: number;
  max: number;
  unit: string;
}

export interface QueryManualDbOutput {
  excerpt: string;
  step_text: string | null;
  related_ranges: RelatedRange[];
}

export interface GetNextStepInput {
  procedure: string;
  current_step: number;
}

export interface GetNextStepOutput {
  next_step_id: number | null;
  step_text: string;
  is_final: boolean;
}

export interface LogMaintenanceEntryInput {
  component: string;
  action: string;
  condition: string;
  technician_id: string;
  location?: string | null;
  equipment?: string | null;
}

export interface LogMaintenanceEntryOutput {
  entry_id: string;
  written: boolean;
}

export interface MissingFieldDetail {
  field: string;
  question: string;
}

export interface GetMissingFieldsInput {
  schema_state: Record<string, any>;
}

export interface GetMissingFieldsOutput {
  missing: MissingFieldDetail[];
  complete: boolean;
}

export interface SearchSimilarReportsFilters {
  site?: string | null;
  equipment?: string | null;
  since?: string | null;
}

export interface SearchSimilarReportsInput {
  embedding_or_text: string;
  filters?: SearchSimilarReportsFilters;
}

export interface SimilarReportMatch {
  id: string;
  similarity: number;
  summary: string;
  date: string;
}

export interface PatternSignal {
  recurring: boolean;
  count: number;
  sentence: string;
}

export interface SearchSimilarReportsOutput {
  matches: SimilarReportMatch[];
  pattern_signal: PatternSignal;
}

export interface NearMissReportPayload {
  location: string;
  equipment: string;
  hazard_type: string;
  injury: string;
  narrative: string;
  worker_id?: string;
  provenance?: Record<string, any>;
}

export interface CreateNearMissInput {
  report: NearMissReportPayload;
  idempotency_key: string;
}

export interface CreateNearMissOutput {
  report_id: string;
  created: boolean;
  duplicate: boolean;
}

export interface SitePolicy {
  auto_notify_roles?: string[];
  channel?: string;
}

export interface NotifySafetyContactInput {
  report_id: string;
  site_policy?: SitePolicy;
}

export interface NotifySafetyContactOutput {
  notified: string[];
  channel: string;
}

export interface DraftCorrectiveActionInput {
  report_id: string;
  pattern_signal: PatternSignal;
}

export interface DraftCorrectiveActionOutput {
  draft_id: string;
  sentence: string;
  status: 'pending_supervisor';
}
