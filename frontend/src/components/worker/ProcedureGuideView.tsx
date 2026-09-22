import React, { useState } from 'react';
import { ProcedureDefinition } from '../../types/workerWorkflows';
import {
  CheckCircle2,
  RotateCcw,
  AlertTriangle,
  ArrowLeft,
  Pause,
  Play,
  Gauge,
  HelpCircle,
  ShieldCheck
} from 'lucide-react';

interface ProcedureGuideViewProps {
  procedure: ProcedureDefinition;
  currentStepIndex: number;
  isPaused: boolean;
  onConfirmStep: () => void;
  onRepeatStep: () => void;
  onTogglePause: () => void;
  onExit: () => void;
  onReportReading: (val: number) => void;
}

export const ProcedureGuideView: React.FC<ProcedureGuideViewProps> = ({
  procedure,
  currentStepIndex,
  isPaused,
  onConfirmStep,
  onRepeatStep,
  onTogglePause,
  onExit,
  onReportReading
}) => {
  const currentStep = procedure.steps[currentStepIndex] || procedure.steps[0];
  const [readingInput, setReadingInput] = useState<string>('');
  const [showReadingModal, setShowReadingModal] = useState<boolean>(false);

  const handleReadingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(readingInput);
    if (!isNaN(val)) {
      onReportReading(val);
      setShowReadingModal(false);
      setReadingInput('');
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
      {/* Top Header: Procedure Title & Approved Revision */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={onExit}
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: 'var(--ink-700)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              padding: '4px 0'
            }}
          >
            <ArrowLeft size={16} /> Exit Procedure
          </button>
          <button
            onClick={onTogglePause}
            style={{
              fontSize: '13px',
              fontWeight: 800,
              color: isPaused ? 'var(--warning-amber-text)' : 'var(--ink-700)',
              backgroundColor: isPaused ? 'var(--warning-amber-bg)' : 'var(--bg-surface)',
              border: isPaused ? '1px solid var(--warning-amber-border)' : '1px solid var(--border-subtle)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-pill)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {isPaused ? <Play size={14} /> : <Pause size={14} />}
            {isPaused ? 'RESUME' : 'PAUSE'}
          </button>
        </div>

        <div style={{ marginTop: '8px' }}>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 800,
              letterSpacing: '0.08em',
              color: 'var(--aura-teal)',
              textTransform: 'uppercase'
            }}
          >
            {procedure.revision}
          </span>
          <h2
            style={{
              fontSize: '22px',
              fontWeight: 800,
              color: 'var(--ink-950)',
              lineHeight: 1.25,
              marginTop: '2px'
            }}
          >
            {procedure.title}
          </h2>
        </div>
      </div>

      {/* Progress & Step Counter */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-surface)',
          padding: '10px 16px',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)'
        }}
      >
        <span
          style={{
            fontSize: '14px',
            fontWeight: 800,
            letterSpacing: '0.06em',
            color: 'var(--ink-950)',
            textTransform: 'uppercase'
          }}
        >
          STEP {currentStep.id} OF {procedure.totalSteps}
        </span>

        {/* Progress Dots */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {procedure.steps.map((st, idx) => (
            <div
              key={st.id}
              style={{
                width: idx === currentStepIndex ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                backgroundColor:
                  idx === currentStepIndex
                    ? 'var(--aura-teal)'
                    : idx < currentStepIndex
                    ? 'var(--success-green)'
                    : 'var(--border-subtle)',
                transition: 'all 0.2s ease'
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Step Instruction Card */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--border-subtle)',
          padding: '22px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: 'var(--shadow-card)'
        }}
      >
        {/* CHECK REQUIRED badge if applicable */}
        {currentStep.checkRequired && (
          <div
            style={{
              backgroundColor: 'var(--warning-amber-bg)',
              border: '1px solid var(--warning-amber-border)',
              color: 'var(--warning-amber-text)',
              padding: '8px 12px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 800, letterSpacing: '0.04em' }}>
              <Gauge size={18} />
              CHECK REQUIRED: {currentStep.readingParam?.toUpperCase()}
            </div>
            {currentStep.expectedRange && (
              <span style={{ fontSize: '13px', fontWeight: 700 }}>
                {currentStep.expectedRange.min} – {currentStep.expectedRange.max} {currentStep.expectedRange.unit}
              </span>
            )}
          </div>
        )}

        {/* Instruction Text */}
        <h3
          style={{
            fontSize: '22px',
            fontWeight: 800,
            color: 'var(--ink-950)',
            lineHeight: 1.35
          }}
        >
          {currentStep.instruction}
        </h3>

        {/* Optional Supporting Detail */}
        {currentStep.details && (
          <p
            style={{
              fontSize: '16px',
              color: 'var(--ink-700)',
              lineHeight: 1.45,
              borderLeft: '3px solid var(--aura-teal)',
              paddingLeft: '12px'
            }}
          >
            {currentStep.details}
          </p>
        )}

        {/* Warning Callout if present */}
        {currentStep.warning && (
          <div
            style={{
              backgroundColor: 'var(--danger-red-bg)',
              border: '1px solid var(--danger-red-border)',
              borderRadius: '10px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: 'var(--danger-red-text)',
              fontSize: '14px',
              fontWeight: 700
            }}
          >
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <span>{currentStep.warning}</span>
          </div>
        )}

        {/* Consequential Confirmation Mandate Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--surface-container-low)',
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 700,
            color: 'var(--aura-teal-dark)'
          }}
        >
          <ShieldCheck size={16} />
          <span>SAY “CONFIRMED” OR TAP BUTTON BELOW TO ADVANCE</span>
        </div>
      </div>

      {/* Manual Reading Input Trigger if checkRequired */}
      {currentStep.checkRequired && (
        <button
          onClick={() => setShowReadingModal(true)}
          style={{
            height: '52px',
            backgroundColor: 'var(--bg-secondary-surface)',
            border: '1px solid var(--outline-variant)',
            borderRadius: 'var(--radius-btn)',
            color: 'var(--aura-teal-dark)',
            fontSize: '15px',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer'
          }}
        >
          <Gauge size={18} />
          ENTER OR VERIFY NUMERIC READING ({currentStep.readingParam})
        </button>
      )}

      {/* Reading Input Modal / Flyout */}
      {showReadingModal && (
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '2px solid var(--aura-teal)',
            borderRadius: 'var(--radius-card)',
            padding: '18px',
            boxShadow: 'var(--shadow-elevated)'
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ink-950)', marginBottom: '10px' }}>
            Check Reading: {currentStep.readingParam}
          </div>
          <form onSubmit={handleReadingSubmit} style={{ display: 'flex', gap: '10px' }}>
            <input
              type="number"
              step="any"
              placeholder={`Enter ${currentStep.expectedRange?.unit || 'value'} (e.g. 7.5 or 15)`}
              value={readingInput}
              onChange={(e) => setReadingInput(e.target.value)}
              autoFocus
              style={{
                flex: 1,
                height: '48px',
                padding: '0 14px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                fontSize: '16px'
              }}
            />
            <button
              type="submit"
              style={{
                backgroundColor: 'var(--aura-teal)',
                color: '#FFFFFF',
                padding: '0 18px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '15px',
                cursor: 'pointer'
              }}
            >
              Check
            </button>
          </form>
          <div style={{ fontSize: '12px', color: 'var(--ink-500)', marginTop: '8px' }}>
            Safe range: {currentStep.expectedRange?.min} – {currentStep.expectedRange?.max} {currentStep.expectedRange?.unit}. Out-of-range values trigger safety sentinels.
          </div>
        </div>
      )}

      {/* Primary Execution Control: CONFIRM STEP */}
      <button
        onClick={onConfirmStep}
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
          cursor: 'pointer',
          boxShadow: '0 2px 6px rgba(14, 119, 116, 0.25)',
          transition: 'background-color 0.15s ease'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--aura-teal-dark)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--aura-teal)')}
      >
        <CheckCircle2 size={24} strokeWidth={2.6} />
        CONFIRM STEP {currentStep.id}
      </button>

      {/* Secondary Actions: Repeat & Ask Aura */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <button
          onClick={onRepeatStep}
          style={{
            height: 'var(--btn-secondary-height)',
            minHeight: 'var(--touch-target-min)',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-btn)',
            fontSize: '15px',
            fontWeight: 700,
            color: 'var(--ink-950)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer'
          }}
        >
          <RotateCcw size={18} />
          REPEAT STEP
        </button>

        <button
          onClick={() => {}}
          style={{
            height: 'var(--btn-secondary-height)',
            minHeight: 'var(--touch-target-min)',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-btn)',
            fontSize: '15px',
            fontWeight: 700,
            color: 'var(--ink-950)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer'
          }}
        >
          <HelpCircle size={18} />
          ASK AURA
        </button>
      </div>
    </div>
  );
};
