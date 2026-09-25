import React from 'react';
import { HelpCircle, Mic, ArrowRight, CheckCircle2 } from 'lucide-react';
import { ReportDraft } from '../../types/workerWorkflows';

interface QuestionConfig {
  key: string;
  fieldLabel: string;
  question: string;
  options: { label: string; value: string }[];
}

const QUESTIONS: QuestionConfig[] = [
  {
    key: 'injury',
    fieldLabel: 'INJURY STATUS',
    question: 'Was anyone injured or requires medical attention?',
    options: [
      { label: 'NO INJURIES', value: 'No injuries reported' },
      { label: 'FIRST AID ONLY', value: 'First aid rendered on site' },
      { label: 'YES — MEDICAL REQUIRED', value: 'Medical attention required' },
      { label: 'UNKNOWN / NOT SURE', value: 'Unknown' }
    ]
  },
  {
    key: 'location',
    fieldLabel: 'SPECIFIC LOCATION',
    question: 'Where did this event take place?',
    options: [
      { label: 'BAY 7 SOUTH CROSSING', value: 'Bay 7 South Crossing' },
      { label: 'DOCK 3 LOADING BAY', value: 'Dock 3 Loading Bay' },
      { label: 'CHEMICAL PUMP ROOM', value: 'Chemical Pump Room B' },
      { label: 'OTHER LOCATION', value: 'Unspecified Facility Area' }
    ]
  },
  {
    key: 'equipment',
    fieldLabel: 'EQUIPMENT INVOLVED',
    question: 'Which specific equipment or vehicle was involved?',
    options: [
      { label: 'FORKLIFT #4 (TOYOTA)', value: 'Forklift #4 (Toyota 8FGU25)' },
      { label: 'COOLANT MANIFOLD B-7', value: 'Coolant Manifold Block B-7' },
      { label: 'CONVEYOR LINE 2', value: 'Conveyor Line 2' },
      { label: 'NO EQUIPMENT / FACILITY ONLY', value: 'Facility infrastructure only' }
    ]
  },
  {
    key: 'immediate_action',
    fieldLabel: 'IMMEDIATE MITIGATION',
    question: 'What immediate action did you or your crew take?',
    options: [
      { label: 'FLAGGED / BARRICADED AREA', value: 'Flagged crossing with magnetic red stanchions' },
      { label: 'NOTIFIED SHIFT LEAD', value: 'Notified shift supervisor' },
      { label: 'SHUT DOWN POWER', value: 'Isolated power / E-stopped' },
      { label: 'NO ACTION TAKEN YET', value: 'No immediate action taken' }
    ]
  }
];

interface AdaptiveQuestionsViewProps {
  draft: ReportDraft;
  activeKey: string;
  onAnswer: (field: any, value: string) => void;
  onProceedToReview: () => void;
}

export const AdaptiveQuestionsView: React.FC<AdaptiveQuestionsViewProps> = ({
  draft,
  activeKey,
  onAnswer,
  onProceedToReview
}) => {
  const currentIndex = QUESTIONS.findIndex(q => q.key === activeKey);
  const activeQuestion = QUESTIONS[currentIndex >= 0 ? currentIndex : 0];

  const handleSelect = (val: string) => {
    onAnswer(activeQuestion.key, val);
  };

  const isLastQuestion = currentIndex >= QUESTIONS.length - 1;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      {/* Stage Header */}
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
            HAZARD REPORT · STAGE 2 OF 3
          </span>
          <span
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: 'var(--ink-500)'
            }}
          >
            QUESTION {currentIndex + 1} OF {QUESTIONS.length}
          </span>
        </div>

        <h2
          style={{
            fontSize: '24px',
            fontWeight: 800,
            color: 'var(--ink-950)',
            lineHeight: 1.25,
            marginTop: '4px'
          }}
        >
          Adaptive Clarification
        </h2>
      </div>

      {/* Main Question Card */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--border-subtle)',
          padding: '20px',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-secondary-surface)',
              color: 'var(--aura-teal)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <HelpCircle size={18} strokeWidth={2.4} />
          </div>
          <span
            style={{
              fontSize: '13px',
              fontWeight: 800,
              letterSpacing: '0.08em',
              color: 'var(--ink-700)',
              textTransform: 'uppercase'
            }}
          >
            {activeQuestion.fieldLabel}
          </span>
        </div>

        <h3
          style={{
            fontSize: '20px',
            fontWeight: 800,
            color: 'var(--ink-950)',
            lineHeight: 1.3
          }}
        >
          {activeQuestion.question}
        </h3>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--surface-container-low)',
            padding: '8px 12px',
            borderRadius: '10px',
            color: 'var(--aura-teal-dark)',
            fontSize: '14px',
            fontWeight: 600
          }}
        >
          <Mic size={16} />
          <span>Speak your answer or tap any quick-select button below.</span>
        </div>

        {/* Glove-friendly Quick Answer Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
          {activeQuestion.options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              style={{
                minHeight: 'var(--touch-target-min)',
                padding: '12px 16px',
                borderRadius: 'var(--radius-btn)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--ink-950)',
                fontSize: '16px',
                fontWeight: 700,
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-secondary-surface)';
                e.currentTarget.style.borderColor = 'var(--aura-teal)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-app)';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
              }}
            >
              <span>{opt.label}</span>
              <CheckCircle2 size={18} color="var(--aura-teal)" opacity={0.5} />
            </button>
          ))}
        </div>
      </div>

      {/* Skip or Jump to Full Review */}
      <button
        onClick={onProceedToReview}
        style={{
          height: 'var(--btn-secondary-height)',
          minHeight: 'var(--touch-target-min)',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-btn)',
          color: 'var(--ink-700)',
          fontSize: '16px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          cursor: 'pointer'
        }}
      >
        <span>Skip to Structured Review</span>
        <ArrowRight size={18} />
      </button>
    </div>
  );
};
