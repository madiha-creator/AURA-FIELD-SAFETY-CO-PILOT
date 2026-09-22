import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, AlertOctagon, ArrowLeft, PhoneCall } from 'lucide-react';

interface SafetyGateViewProps {
  onSafeConfirmed: () => void;
  onCancel: () => void;
}

export const SafetyGateView: React.FC<SafetyGateViewProps> = ({
  onSafeConfirmed,
  onCancel
}) => {
  const [exposedHelpTriggered, setExposedHelpTriggered] = useState(false);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      {/* Top back navigation */}
      <button
        onClick={onCancel}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          color: 'var(--ink-700)',
          fontSize: '15px',
          fontWeight: 700,
          alignSelf: 'flex-start',
          padding: '8px 0',
          cursor: 'pointer'
        }}
        aria-label="Back to Home"
      >
        <ArrowLeft size={18} />
        Back to Standby
      </button>

      {/* Main High-Contrast Question Card */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--border-subtle)',
          padding: '24px 20px',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '16px'
        }}
      >
        {/* Security Shield Icon */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: exposedHelpTriggered ? 'var(--danger-red-bg)' : 'var(--bg-secondary-surface)',
            color: exposedHelpTriggered ? 'var(--danger-red)' : 'var(--aura-teal)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {exposedHelpTriggered ? (
            <AlertOctagon size={36} strokeWidth={2.5} />
          ) : (
            <ShieldAlert size={36} strokeWidth={2.5} />
          )}
        </div>

        <div>
          <span
            style={{
              fontSize: '13px',
              fontWeight: 800,
              letterSpacing: '0.08em',
              color: 'var(--ink-500)',
              textTransform: 'uppercase'
            }}
          >
            MANDATORY SAFETY GATE
          </span>
          <h2
            style={{
              fontSize: '26px',
              fontWeight: 800,
              color: 'var(--ink-950)',
              lineHeight: 1.25,
              marginTop: '6px'
            }}
          >
            Are you in a safe place away from the hazard?
          </h2>
        </div>

        <p
          style={{
            fontSize: '16px',
            color: 'var(--ink-700)',
            lineHeight: 1.45,
            maxWidth: '380px'
          }}
        >
          Aura requires you to be in a secure location before documenting an incident or near-miss. Do not report while exposed to physical hazards.
        </p>

        {/* Emergency Escalation Guidance if worker indicates NOT safe */}
        {exposedHelpTriggered && (
          <div
            role="alert"
            style={{
              backgroundColor: 'var(--danger-red-bg)',
              border: '2px solid var(--danger-red)',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'left',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger-red)', fontWeight: 800, fontSize: '15px' }}>
              <AlertOctagon size={20} />
              EMERGENCY SITE ESCALATION
            </div>
            <p style={{ fontSize: '15px', color: 'var(--danger-red-text)', lineHeight: 1.4, fontWeight: 600 }}>
              1. Evacuate immediate hazard zone immediately toward marked muster area.
              <br />
              2. Pull manual pull station or radio Plant Dispatch on Channel 1.
              <br />
              3. Aura is not an emergency response service. Move to safety now.
            </p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <a
                href="tel:911"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  backgroundColor: 'var(--danger-red)',
                  color: '#FFFFFF',
                  height: '48px',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '14px',
                  flex: 1,
                  letterSpacing: '0.04em'
                }}
              >
                <PhoneCall size={18} /> CALL DISPATCH (EXT 222)
              </a>
            </div>
          </div>
        )}

        {/* Primary Safety Gate Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', marginTop: '8px' }}>
          <button
            onClick={onSafeConfirmed}
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
            <ShieldCheck size={24} strokeWidth={2.6} />
            YES — I’M SAFE
          </button>

          <button
            onClick={() => setExposedHelpTriggered(true)}
            style={{
              height: 'var(--btn-secondary-height)',
              minHeight: 'var(--touch-target-min)',
              backgroundColor: exposedHelpTriggered ? 'var(--danger-red)' : 'var(--bg-secondary-surface)',
              color: exposedHelpTriggered ? '#FFFFFF' : 'var(--danger-red)',
              border: '2px solid var(--danger-red)',
              borderRadius: 'var(--radius-btn)',
              fontSize: '17px',
              fontWeight: 800,
              letterSpacing: '0.04em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <AlertOctagon size={22} strokeWidth={2.4} />
            NO — GET HELP
          </button>
        </div>
      </div>
    </div>
  );
};
