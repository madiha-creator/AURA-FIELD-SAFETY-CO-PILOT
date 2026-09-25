import React, { useState } from 'react';
import { X, Volume2, Mic, Eye, Sliders, ShieldCheck, LogOut, Check } from 'lucide-react';

interface WorkerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAudioTest: () => void;
  workerId?: string;
  siteName?: string;
}

export const WorkerProfileModal: React.FC<WorkerProfileModalProps> = ({
  isOpen,
  onClose,
  onAudioTest,
  workerId = 'W-4882',
  siteName = 'Warehouse 03 — Bay 7'
}) => {
  const [highContrast, setHighContrast] = useState(() => {
    return document.body.classList.contains('high-contrast-mode');
  });

  const [largeText, setLargeText] = useState(() => {
    return document.body.classList.contains('large-text-mode');
  });

  if (!isOpen) return null;

  const toggleHighContrast = () => {
    const next = !highContrast;
    setHighContrast(next);
    if (next) {
      document.body.classList.add('high-contrast-mode');
    } else {
      document.body.classList.remove('high-contrast-mode');
    }
  };

  const toggleLargeText = () => {
    const next = !largeText;
    setLargeText(next);
    if (next) {
      document.body.classList.add('large-text-mode');
    } else {
      document.body.classList.remove('large-text-mode');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Worker Profile & Settings"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(17, 28, 36, 0.75)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        backdropFilter: 'blur(2px)'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '20px',
          maxWidth: '520px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-elevated)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--aura-teal)', textTransform: 'uppercase' }}>
              OPERATOR PROFILE & SETTINGS
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ink-950)', marginTop: '2px' }}>
              Worker {workerId}
            </h2>
            <div style={{ fontSize: '13px', color: 'var(--ink-500)' }}>
              Assigned Site: {siteName}
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-app)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--ink-700)',
              cursor: 'pointer'
            }}
            aria-label="Close Settings"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Quick Voice Commands Reference */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--ink-500)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              VOICE COMMAND CHEATSHEET
            </span>
            <div style={{ backgroundColor: 'var(--bg-app)', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
              <div><strong>“Walk me through the check”</strong> — Starts step-by-step guidance</div>
              <div><strong>“I need to report a hazard”</strong> — Starts near-miss reporting</div>
              <div><strong>“Confirm” / “Next step”</strong> — Confirms and advances step</div>
              <div><strong>“Repeat step”</strong> — Plays current instruction again</div>
              <div><strong>“Stop” / Tap Orb</strong> — Instantly interrupts Aura audio</div>
            </div>
          </div>

          {/* Audio & Headset Diagnostic Test */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--ink-500)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              HARDWARE & AUDIO TEST
            </span>
            <button
              onClick={onAudioTest}
              style={{
                height: '52px',
                backgroundColor: 'var(--bg-secondary-surface)',
                border: '1px solid var(--outline-variant)',
                borderRadius: '12px',
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
              <Volume2 size={18} />
              PLAY AUDIO TEST CHIME (HEADSET CHECK)
            </button>
          </div>

          {/* Accessibility Settings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--ink-500)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              ACCESSIBILITY & DISPLAY
            </span>

            {/* High Contrast Toggle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                backgroundColor: 'var(--bg-app)',
                borderRadius: '12px'
              }}
            >
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink-950)' }}>
                  High Contrast Mode
                </div>
                <div style={{ fontSize: '13px', color: 'var(--ink-500)' }}>
                  Maximizes contrast borders for sunlight glare
                </div>
              </div>
              <button
                onClick={toggleHighContrast}
                style={{
                  width: '56px',
                  height: '32px',
                  borderRadius: '16px',
                  backgroundColor: highContrast ? 'var(--aura-teal)' : 'var(--border-subtle)',
                  padding: '3px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: highContrast ? 'flex-end' : 'flex-start',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: '#FFFFFF' }} />
              </button>
            </div>

            {/* Large Text Mode Toggle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                backgroundColor: 'var(--bg-app)',
                borderRadius: '12px'
              }}
            >
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink-950)' }}>
                  Large Text (+15%)
                </div>
                <div style={{ fontSize: '13px', color: 'var(--ink-500)' }}>
                  Enlarges critical copy for distant viewing
                </div>
              </div>
              <button
                onClick={toggleLargeText}
                style={{
                  width: '56px',
                  height: '32px',
                  borderRadius: '16px',
                  backgroundColor: largeText ? 'var(--aura-teal)' : 'var(--border-subtle)',
                  padding: '3px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: largeText ? 'flex-end' : 'flex-start',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: '#FFFFFF' }} />
              </button>
            </div>
          </div>

          {/* Privacy & Recording Notice */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--ink-500)', lineHeight: 1.4 }}>
            <ShieldCheck size={16} color="var(--aura-teal)" style={{ flexShrink: 0 }} />
            <span>Voice telemetry is processed solely for safety check logging and site incident analysis in compliance with plant data policy.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
