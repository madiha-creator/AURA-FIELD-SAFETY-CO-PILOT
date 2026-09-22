import React, { useState } from 'react';
import { ReportDraft } from '../../types/workerWorkflows';
import { CheckCircle2, ShieldCheck, AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react';

interface ReportConfirmViewProps {
  draft: ReportDraft;
  onConfirm: () => Promise<void>;
  onEdit: () => void;
}

export const ReportConfirmView: React.FC<ReportConfirmViewProps> = ({
  draft,
  onConfirm,
  onEdit
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleConfirmClick = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onConfirm();
    } catch (e: any) {
      setErrorMsg(e?.message || 'Submission failed. Your draft has been safely preserved locally.');
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      {/* Header */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span
            style={{
              fontSize: '13px',
              fontWeight: 800,
              letterSpacing: '0.08em',
              color: 'var(--aura-teal)',
              textTransform: 'uppercase'
            }}
          >
            FINAL CONFIRMATION
          </span>
          <button
            onClick={onEdit}
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: 'var(--ink-700)',
              padding: '6px 12px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <ArrowLeft size={16} /> Make Changes
          </button>
        </div>

        <h2
          style={{
            fontSize: '24px',
            fontWeight: 800,
            color: 'var(--ink-950)',
            lineHeight: 1.25,
            marginTop: '2px'
          }}
        >
          Confirm Incident Submission
        </h2>
      </div>

      {/* Deliberate Confirmation Notice */}
      <div
        style={{
          backgroundColor: 'var(--bg-secondary-surface)',
          border: '1px solid var(--outline-variant)',
          borderRadius: 'var(--radius-card)',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <ShieldCheck size={28} color="var(--aura-teal)" />
        <div style={{ fontSize: '14px', color: 'var(--aura-teal-dark)', lineHeight: 1.4, fontWeight: 600 }}>
          This record will be signed with your Worker ID (<strong>{draft.worker_id}</strong>) and routed to the Plant Safety Supervisor Cockpit.
        </div>
      </div>

      {/* Summary Card */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--border-subtle)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: 'var(--shadow-card)'
        }}
      >
        <div>
          <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--ink-500)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            HAZARD / INCIDENT
          </div>
          <div style={{ fontSize: '19px', fontWeight: 800, color: 'var(--ink-950)', marginTop: '2px' }}>
            {draft.hazard_type.value}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ink-500)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              LOCATION
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ink-950)', marginTop: '2px' }}>
              {draft.location.value}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ink-500)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              EQUIPMENT
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ink-950)', marginTop: '2px' }}>
              {draft.equipment.value}
            </div>
          </div>
        </div>

        {/* Potential Consequence Block */}
        {draft.potential_consequence && (
          <div
            style={{
              backgroundColor: 'var(--warning-amber-bg)',
              border: '1px solid var(--warning-amber-border)',
              borderRadius: '12px',
              padding: '12px 14px',
              display: 'flex',
              gap: '10px'
            }}
          >
            <AlertTriangle size={18} color="var(--warning-amber-text)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--warning-amber-text)', textTransform: 'uppercase' }}>
                POTENTIAL CONSEQUENCE EVALUATION
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--warning-amber-text)', marginTop: '2px', lineHeight: 1.35 }}>
                {draft.potential_consequence}
              </div>
            </div>
          </div>
        )}

        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ink-500)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            ACTION TAKEN
          </div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink-900)', marginTop: '2px' }}>
            {draft.immediate_action.value}
          </div>
        </div>
      </div>

      {/* Error state if submission fails */}
      {errorMsg && (
        <div
          role="alert"
          style={{
            backgroundColor: 'var(--danger-red-bg)',
            border: '1px solid var(--danger-red-border)',
            borderRadius: '12px',
            padding: '12px 16px',
            color: 'var(--danger-red-text)',
            fontSize: '14px',
            fontWeight: 600
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* Consequential Action Button */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button
          onClick={handleConfirmClick}
          disabled={isSubmitting}
          style={{
            height: 'var(--btn-primary-height)',
            minHeight: 'var(--touch-target-preferred)',
            backgroundColor: 'var(--aura-teal)',
            color: '#FFFFFF',
            borderRadius: 'var(--radius-btn)',
            fontSize: '18px',
            fontWeight: 800,
            letterSpacing: '0.04em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            opacity: isSubmitting ? 0.75 : 1,
            boxShadow: '0 2px 6px rgba(14, 119, 116, 0.25)',
            transition: 'background-color 0.15s ease'
          }}
          onMouseEnter={(e) => {
            if (!isSubmitting) e.currentTarget.style.backgroundColor = 'var(--aura-teal-dark)';
          }}
          onMouseLeave={(e) => {
            if (!isSubmitting) e.currentTarget.style.backgroundColor = 'var(--aura-teal)';
          }}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
              SIGNING & SUBMITTING...
            </>
          ) : (
            <>
              <CheckCircle2 size={24} strokeWidth={2.6} />
              CONFIRM & SUBMIT REPORT
            </>
          )}
        </button>

        <button
          onClick={onEdit}
          disabled={isSubmitting}
          style={{
            height: 'var(--btn-secondary-height)',
            minHeight: 'var(--touch-target-min)',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-btn)',
            fontSize: '16px',
            fontWeight: 700,
            color: 'var(--ink-700)',
            cursor: 'pointer'
          }}
        >
          MAKE CORRECTIONS
        </button>
      </div>
    </div>
  );
};
