import React, { useState } from 'react';
import { ReportDraft, ProvenanceType } from '../../types/workerWorkflows';
import { Volume2, Edit3, CheckCircle, ArrowRight, ArrowLeft, History } from 'lucide-react';

interface DraftReviewViewProps {
  draft: ReportDraft;
  onUpdateField: (field: any, val: string, source?: ProvenanceType) => void;
  onReadBack: () => void;
  onContinueToConfirm: () => void;
  onBack: () => void;
  isReadingBack?: boolean;
}

export const DraftReviewView: React.FC<DraftReviewViewProps> = ({
  draft,
  onUpdateField,
  onReadBack,
  onContinueToConfirm,
  onBack,
  isReadingBack = false
}) => {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>('');

  const startEdit = (fieldKey: string, currentVal: string) => {
    setEditingField(fieldKey);
    setTempValue(currentVal);
  };

  const saveEdit = (fieldKey: string) => {
    if (tempValue.trim()) {
      onUpdateField(fieldKey as any, tempValue.trim(), 'said');
    }
    setEditingField(null);
  };

  const getProvenanceBadge = (source: ProvenanceType) => {
    switch (source) {
      case 'confirmed':
        return (
          <span
            style={{
              backgroundColor: 'var(--success-green-bg)',
              color: 'var(--success-green)',
              border: '1px solid var(--success-green-border)',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.08em',
              padding: '3px 8px',
              borderRadius: 'var(--radius-pill)',
              textTransform: 'uppercase'
            }}
          >
            CONFIRMED
          </span>
        );
      case 'inferred':
        return (
          <span
            style={{
              backgroundColor: 'var(--warning-amber-bg)',
              color: 'var(--warning-amber-text)',
              border: '1px solid var(--warning-amber-border)',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.08em',
              padding: '3px 8px',
              borderRadius: 'var(--radius-pill)',
              textTransform: 'uppercase'
            }}
          >
            AI INTERPRETED
          </span>
        );
      case 'unknown':
        return (
          <span
            style={{
              backgroundColor: 'var(--surface-neutral)',
              color: 'var(--ink-500)',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.08em',
              padding: '3px 8px',
              borderRadius: 'var(--radius-pill)',
              textTransform: 'uppercase'
            }}
          >
            UNKNOWN
          </span>
        );
      case 'attention':
        return (
          <span
            style={{
              backgroundColor: 'var(--danger-red-bg)',
              color: 'var(--danger-red-text)',
              border: '1px solid var(--danger-red-border)',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.08em',
              padding: '3px 8px',
              borderRadius: 'var(--radius-pill)',
              textTransform: 'uppercase'
            }}
          >
            NEEDS ATTENTION
          </span>
        );
      case 'said':
      default:
        return (
          <span
            style={{
              backgroundColor: 'var(--bg-secondary-surface)',
              color: 'var(--aura-teal-dark)',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.08em',
              padding: '3px 8px',
              borderRadius: 'var(--radius-pill)',
              textTransform: 'uppercase'
            }}
          >
            YOU SAID
          </span>
        );
    }
  };

  const fields: { key: keyof ReportDraft; label: string; field: any }[] = [
    { key: 'hazard_type', label: 'HAZARD TYPE', field: draft.hazard_type },
    { key: 'location', label: 'LOCATION', field: draft.location },
    { key: 'equipment', label: 'EQUIPMENT / TAG', field: draft.equipment },
    { key: 'injury', label: 'INJURY STATUS', field: draft.injury },
    { key: 'immediate_action', label: 'IMMEDIATE ACTION', field: draft.immediate_action }
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      {/* Header and Step Indicator */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span
            style={{
              fontSize: '13px',
              fontWeight: 800,
              letterSpacing: '0.08em',
              color: 'var(--aura-teal)',
              textTransform: 'uppercase'
            }}
          >
            HAZARD REPORT · STAGE 3 OF 3
          </span>
          <h2
            style={{
              fontSize: '24px',
              fontWeight: 800,
              color: 'var(--ink-950)',
              lineHeight: 1.25,
              marginTop: '2px'
            }}
          >
            Structured Draft Review
          </h2>
        </div>
        <button
          onClick={onBack}
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
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      {/* Read-Back Trigger Card */}
      <button
        onClick={onReadBack}
        style={{
          minHeight: 'var(--touch-target-min)',
          backgroundColor: isReadingBack ? 'var(--bg-secondary-surface)' : 'var(--bg-surface)',
          border: isReadingBack ? '2px solid var(--aura-teal)' : '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-card)',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          boxShadow: 'var(--shadow-card)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-secondary-surface)',
              color: 'var(--aura-teal)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Volume2 size={20} strokeWidth={2.5} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--ink-950)' }}>
              {isReadingBack ? 'READING BACK REPORT...' : 'READ BACK REPORT (VOICE)'}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--ink-500)' }}>
              Tap anytime to interrupt or correct any spoken field.
            </div>
          </div>
        </div>
      </button>

      {/* Structured Fields Container */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {fields.map(({ key, label, field }) => {
          const isEditing = editingField === key;

          return (
            <div
              key={key}
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-card)',
                border: '1px solid var(--border-subtle)',
                padding: '14px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                boxShadow: 'var(--shadow-card)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    color: 'var(--ink-500)',
                    textTransform: 'uppercase'
                  }}
                >
                  {label}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {getProvenanceBadge(field.source)}
                  <button
                    onClick={() => startEdit(key, field.value)}
                    style={{
                      color: 'var(--ink-700)',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '13px',
                      fontWeight: 700
                    }}
                    aria-label={`Edit ${label}`}
                  >
                    <Edit3 size={15} /> Edit
                  </button>
                </div>
              </div>

              {isEditing ? (
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <input
                    type="text"
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    autoFocus
                    style={{
                      flex: 1,
                      height: '44px',
                      borderRadius: '8px',
                      border: '1px solid var(--aura-teal)',
                      padding: '0 12px',
                      fontSize: '16px',
                      color: 'var(--ink-950)'
                    }}
                  />
                  <button
                    onClick={() => saveEdit(key)}
                    style={{
                      backgroundColor: 'var(--aura-teal)',
                      color: '#FFFFFF',
                      padding: '0 16px',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    fontSize: '17px',
                    fontWeight: 700,
                    color: 'var(--ink-950)',
                    lineHeight: 1.35
                  }}
                >
                  {field.value || 'Not specified'}
                </div>
              )}

              {/* Correction History Note if updated */}
              {field.isCorrected && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--ink-500)',
                    marginTop: '2px'
                  }}
                >
                  <History size={13} />
                  <span>Corrected from original interpretation</span>
                </div>
              )}
            </div>
          );
        })}

        {/* Narrative Box */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-card)',
            border: '1px solid var(--border-subtle)',
            padding: '14px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            boxShadow: 'var(--shadow-card)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 800,
                letterSpacing: '0.08em',
                color: 'var(--ink-500)',
                textTransform: 'uppercase'
              }}
            >
              RECORDED NARRATIVE
            </span>
            {getProvenanceBadge(draft.narrative.source)}
          </div>
          <p style={{ fontSize: '15px', color: 'var(--ink-900)', lineHeight: 1.45, fontStyle: 'italic' }}>
            “{draft.narrative.value}”
          </p>
        </div>
      </div>

      {/* Consequential Action: CONTINUE TO CONFIRM */}
      <button
        onClick={onContinueToConfirm}
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
        <CheckCircle size={22} strokeWidth={2.5} />
        CONTINUE TO CONFIRMATION
        <ArrowRight size={20} />
      </button>
    </div>
  );
};
