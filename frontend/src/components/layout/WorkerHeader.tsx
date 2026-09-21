import React from 'react';
import { User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

  const handleAvatarClick = () => {
    if (onProfileClick) {
      onProfileClick();
    } else {
      // Direct navigation to supervisor inbox or menu if desired
      navigate('/inbox');
    }
  };

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #D0DCE5',
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
            backgroundColor: '#0E7774',
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
            color: '#111C24'
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
              backgroundColor: isConnected ? '#237A4B' : '#C9362B',
              display: 'inline-block'
            }}
          />
          <span
            style={{
              fontSize: '14px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              color: '#111C24',
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
            color: '#40515A',
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
        aria-label="User Profile and Supervisor Navigation"
        style={{
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          backgroundColor: '#0E7774',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          cursor: 'pointer',
          border: 'none',
          boxShadow: '0 2px 4px rgba(17, 28, 36, 0.1)',
          flexShrink: 0
        }}
        title="Supervisor Dashboard / Account"
      >
        <User size={22} strokeWidth={2.2} />
      </button>
    </header>
  );
};
