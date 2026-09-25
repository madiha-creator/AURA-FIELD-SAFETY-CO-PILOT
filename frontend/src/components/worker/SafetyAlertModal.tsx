import React from 'react';
import { SafetyAlertData } from '../../types/workerWorkflows';
import { AlertOctagon, PhoneCall, ShieldAlert, Check } from 'lucide-react';

interface SafetyAlertModalProps {
  alert: SafetyAlertData;
  onAcknowledge: () => void;
}

export const SafetyAlertModal: React.FC<SafetyAlertModalProps> = ({
  alert,
  onAcknowledge
}) => {
  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="safety-alert-title"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(17, 28, 36, 0.85)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        backdropFilter: 'blur(3px)'
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          border: '3px solid var(--danger-red)',
          boxShadow: '0 8px 32px rgba(201, 54, 43, 0.35)',
          maxWidth: '480px',
          width: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Full-bleed Danger Red Header */}
        <div
          style={{
            backgroundColor: 'var(--danger-red)',
            color: '#FFFFFF',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <AlertOctagon size={32} strokeWidth={2.6} />
          </div>
          <div>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 800,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                opacity: 0.9
              }}
            >
              CRITICAL SENTINEL TRIP
            </div>
            <h2
              id="safety-alert-title"
              style={{
                fontSize: '24px',
                fontWeight: 800,
                lineHeight: 1.2,
                marginTop: '2px'
              }}
            >
              {alert.title}
            </h2>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px 22px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Measured Reading Details */}
          <div
            style={{
              backgroundColor: 'var(--danger-red-bg)',
              border: '1px solid var(--danger-red-border)',
              borderRadius: '12px',
              padding: '16px'
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--danger-red-text)', textTransform: 'uppercase' }}>
              PARAMETER DEVIATION DETECTED
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--danger-red)', marginTop: '4px' }}>
              {alert.measuredValue} {alert.unit}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--danger-red-text)', marginTop: '4px' }}>
              Allowable range: {alert.expectedRange.min} – {alert.expectedRange.max} {alert.unit} ({alert.deviationPct > 0 ? `+${alert.deviationPct}%` : `${alert.deviationPct}%`} deviation)
            </div>
          </div>

          {/* Reason explanation */}
          <p style={{ fontSize: '16px', color: 'var(--ink-950)', lineHeight: 1.45, fontWeight: 600 }}>
            {alert.message}
          </p>

          {/* Prescribed Safe Actions */}
          <div
            style={{
              backgroundColor: 'var(--surface-container-low)',
              borderRadius: '12px',
              padding: '14px 16px',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--aura-teal-dark)', fontSize: '13px', fontWeight: 800, marginBottom: '6px' }}>
              <ShieldAlert size={18} />
              PRESCRIBED IMMEDIATE SAFE ACTION
            </div>
            <div style={{ fontSize: '14px', color: 'var(--ink-950)', lineHeight: 1.5, whiteSpace: 'pre-line', fontWeight: 600 }}>
              {alert.prescribedAction}
            </div>
          </div>

          {/* Action Buttons: Acknowledge & Call Dispatch */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
            <button
              onClick={onAcknowledge}
              style={{
                height: 'var(--btn-primary-height)',
                minHeight: 'var(--touch-target-preferred)',
                backgroundColor: 'var(--danger-red)',
                color: '#FFFFFF',
                borderRadius: 'var(--radius-btn)',
                fontSize: '18px',
                fontWeight: 800,
                letterSpacing: '0.04em',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(201, 54, 43, 0.3)'
              }}
            >
              <Check size={22} strokeWidth={3} />
              ACKNOWLEDGE HAZARD & ISOLATE
            </button>

            <a
              href="tel:911"
              style={{
                height: 'var(--btn-secondary-height)',
                minHeight: 'var(--touch-target-min)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--danger-red)',
                border: '2px solid var(--danger-red)',
                borderRadius: 'var(--radius-btn)',
                fontSize: '16px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                textDecoration: 'none'
              }}
            >
              <PhoneCall size={20} />
              CALL SAFETY DISPATCH (EXT 222)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
