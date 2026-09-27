import React from 'react';
import { SafetyAlertData } from '../../types/workerWorkflows';
import { AlertOctagon, ShieldAlert, ArrowRight, Check } from 'lucide-react';

interface SafetyAlertBannerProps {
  alert: SafetyAlertData;
  onViewProtocol: () => void;
  onAcknowledge: () => void;
}

/**
 * FE-002: Persistent Frontline Safety Alert Banner
 * - Full-bleed danger red mantle pinning operator focus to the imminent hazard.
 * - Conforms to DESIGN.md Layer 2 override and Color Isolation Rule (Icon 28px+ paired with verbal text).
 * - No text below 14px; touch targets meet 56px+ criteria.
 */
export const SafetyAlertBanner: React.FC<SafetyAlertBannerProps> = ({
  alert,
  onViewProtocol,
  onAcknowledge
}) => {
  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        backgroundColor: 'var(--danger-red)',
        color: '#FFFFFF',
        borderRadius: 'var(--radius-card)',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        boxShadow: '0 4px 16px rgba(201, 54, 43, 0.4)',
        border: '2px solid rgba(255, 255, 255, 0.3)',
        animation: 'glow-pulse-danger 2s infinite',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* Top Banner Row: Icon + State Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.22)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <AlertOctagon size={28} strokeWidth={2.6} color="#FFFFFF" />
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              opacity: 0.95
            }}
          >
            {alert.severity === 'critical' ? 'CRITICAL SENTINEL TRIP' : 'SAFETY THRESHOLD EXCEEDED'}
          </div>
          <div
            style={{
              fontSize: '18px',
              fontWeight: 800,
              lineHeight: 1.3,
              marginTop: '2px'
            }}
          >
            {alert.parameter.toUpperCase()}: {alert.measuredValue} {alert.unit}
          </div>
        </div>
      </div>

      {/* Structured Reading Context */}
      <div
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.15)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 14px',
          fontSize: '14px',
          lineHeight: 1.4,
          fontWeight: 600
        }}
      >
        <span>Allowable Safe Range: {alert.expectedRange.min} – {alert.expectedRange.max} {alert.unit}</span>
        {alert.deviationPct !== 0 && (
          <span style={{ marginLeft: '6px', opacity: 0.9 }}>
            ({alert.deviationPct > 0 ? `+${alert.deviationPct}%` : `${alert.deviationPct}%`} deviation)
          </span>
        )}
      </div>

      {/* Verbal Message */}
      <div style={{ fontSize: '15px', fontWeight: 600, lineHeight: 1.45, opacity: 0.98 }}>
        {alert.message}
      </div>

      {/* Consequential Touch Actions */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '2px' }}>
        <button
          onClick={onViewProtocol}
          style={{
            flex: 1,
            minWidth: '150px',
            minHeight: 'var(--touch-target-min)',
            height: '56px',
            backgroundColor: '#FFFFFF',
            color: 'var(--danger-red)',
            borderRadius: 'var(--radius-btn)',
            fontSize: '15px',
            fontWeight: 800,
            letterSpacing: '0.04em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            border: 'none',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          <ShieldAlert size={20} />
          VIEW PROTOCOL
          <ArrowRight size={18} />
        </button>

        <button
          onClick={onAcknowledge}
          style={{
            minHeight: 'var(--touch-target-min)',
            height: '56px',
            padding: '0 18px',
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
            color: '#FFFFFF',
            border: '1.5px solid rgba(255, 255, 255, 0.4)',
            borderRadius: 'var(--radius-btn)',
            fontSize: '15px',
            fontWeight: 700,
            letterSpacing: '0.04em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer'
          }}
        >
          <Check size={20} />
          ACKNOWLEDGE
        </button>
      </div>
    </div>
  );
};
