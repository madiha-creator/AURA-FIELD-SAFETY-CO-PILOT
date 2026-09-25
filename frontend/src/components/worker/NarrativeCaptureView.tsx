import React from 'react';
import { AuraVoiceElement } from '../voice/AuraVoiceElement';
import { VoiceState, SemanticVariant } from '../../types/voiceSession';
import { Square, ArrowRight, Mic } from 'lucide-react';

interface NarrativeCaptureViewProps {
  voiceState: VoiceState;
  variant: SemanticVariant;
  currentCaption: string;
  partialUserText?: string;
  onOrbClick: () => void;
  onFinishCapture: () => void;
  onCancel: () => void;
}

export const NarrativeCaptureView: React.FC<NarrativeCaptureViewProps> = ({
  voiceState,
  variant,
  currentCaption,
  partialUserText,
  onOrbClick,
  onFinishCapture,
  onCancel
}) => {
  const isListening = voiceState === 'listening';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      {/* Header and Stage Progress */}
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
            HAZARD REPORT · STAGE 1 OF 3
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
            Describe What Happened
          </h2>
        </div>
        <button
          onClick={onCancel}
          style={{
            fontSize: '14px',
            fontWeight: 700,
            color: 'var(--ink-700)',
            padding: '6px 12px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
      </div>

      {/* Voice Orb Area */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: '16px 0 8px 0'
        }}
      >
        <AuraVoiceElement
          state={voiceState}
          variant={variant}
          size={170}
          onClick={onOrbClick}
        />

        <div
          style={{
            marginTop: '16px',
            fontSize: '18px',
            fontWeight: 800,
            letterSpacing: '0.06em',
            color: isListening ? 'var(--aura-teal)' : 'var(--ink-950)',
            textTransform: 'uppercase'
          }}
        >
          {isListening ? 'AURA IS LISTENING...' : 'TAP ORB TO SPEAK'}
        </div>

        <p
          style={{
            fontSize: '15px',
            color: 'var(--ink-500)',
            marginTop: '4px',
            maxWidth: '320px'
          }}
        >
          Speak naturally about the equipment, location, and conditions observed.
        </p>
      </div>

      {/* Real-time Transcription Well */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-card)',
          padding: '16px 18px',
          minHeight: '110px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: 'var(--shadow-card)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <Mic size={16} color="var(--aura-teal)" />
          <span
            style={{
              fontSize: '12px',
              fontWeight: 800,
              letterSpacing: '0.08em',
              color: 'var(--ink-700)',
              textTransform: 'uppercase'
            }}
          >
            LIVE TRANSCRIPTION
          </span>
        </div>

        <div
          style={{
            fontSize: '17px',
            fontWeight: 600,
            color: partialUserText || currentCaption ? 'var(--ink-950)' : 'var(--ink-500)',
            lineHeight: 1.4,
            fontStyle: partialUserText || currentCaption ? 'normal' : 'italic'
          }}
        >
          {partialUserText || currentCaption || '“Near miss at Bay 7 South Crossing with Forklift #4...”'}
        </div>

        <div
          style={{
            fontSize: '12px',
            color: 'var(--ink-500)',
            marginTop: '10px',
            textAlign: 'right'
          }}
        >
          {isListening ? 'Listening for speech pause...' : 'Ready'}
        </div>
      </div>

      {/* Consequential Bottom Action: STOP & REVIEW */}
      <button
        onClick={onFinishCapture}
        style={{
          height: 'var(--btn-primary-height)',
          minHeight: 'var(--touch-target-preferred)',
          backgroundColor: 'var(--ink-950)',
          color: '#FFFFFF',
          borderRadius: 'var(--radius-btn)',
          fontSize: '17px',
          fontWeight: 800,
          letterSpacing: '0.04em',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          cursor: 'pointer',
          boxShadow: 'var(--shadow-card)',
          transition: 'background-color 0.15s ease'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--ink-900)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--ink-950)')}
      >
        <Square size={20} fill="#FFFFFF" />
        STOP & REVIEW QUESTIONS
        <ArrowRight size={20} />
      </button>
    </div>
  );
};
