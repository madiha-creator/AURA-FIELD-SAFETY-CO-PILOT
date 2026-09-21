import React from 'react';
import { User } from 'lucide-react';
import { AuraLogoSvg } from '../voice/AuraLogoSvg';

interface WorkerHeaderProps {
  isConnected?: boolean;
  batteryLevel?: number;
  siteId?: string;
  siteTime?: string;
  onProfileClick?: () => void;
}

export const WorkerHeader: React.FC<WorkerHeaderProps> = ({
  isConnected = true,
  batteryLevel = 98,
  siteId = '03',
  siteTime = '09:41',
  onProfileClick
}) => {
  const handleAvatarClick = () => {
    if (onProfileClick) {
      onProfileClick();
    }
  };

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}
    >
      {/* Brand Identity: Authentic AURA Logo Icon + Bold Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            backgroundColor: 'var(--aura-teal)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0
          }}
        >
          {/* Authentic production AURA logo mark */}
          <AuraLogoSvg style={{ width: '100%', height: '100%' }} />
        </div>
        <span
          style={{
            fontSize: '22px',
            fontWeight: 800,
            letterSpacing: '0.04em',
            color: 'var(--ink-950)'
          }}
        >
          AURA
        </span>
      </div>

      {/* Center Status Indicators */}
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isConnected ? 'var(--success-green)' : 'var(--danger-red)',
              display: 'inline-block'
            }}
          />
          <span
            style={{
              fontSize: '14px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              color: 'var(--ink-950)',
              textTransform: 'uppercase'
            }}
          >
            {isConnected ? 'CONNECTED' : 'OFFLINE'} · {batteryLevel}%
          </span>
        </div>
        <div
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--ink-700)',
            letterSpacing: '0.02em',
            marginTop: '2px'
          }}
        >
          SITE {siteId} · {siteTime}
        </div>
      </div>

      {/* Right User / Profile Button */}
      <button
        onClick={handleAvatarClick}
        aria-label="Worker Profile"
        style={{
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          backgroundColor: 'var(--aura-teal)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--bg-surface)',
          cursor: 'pointer',
          border: 'none',
          boxShadow: '0 2px 4px rgba(17, 28, 36, 0.1)',
          flexShrink: 0
        }}
        title="Worker Profile"
      >
        <User size={22} strokeWidth={2.2} />
      </button>
    </header>
  );
};
