import React from 'react';

interface DeviceStatusBarProps {
  isHeadsetConnected?: boolean;
  isPttActive?: boolean;
}

export const DeviceStatusBar: React.FC<DeviceStatusBarProps> = ({
  isHeadsetConnected = true,
  isPttActive = true
}) => {
  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '14px',
        padding: '12px 18px',
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 4px rgba(17, 28, 36, 0.04)'
      }}
    >
      {/* Left Headset Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: isHeadsetConnected ? 'var(--success-green)' : 'var(--ink-500)',
            display: 'inline-block'
          }}
        />
        <span
          style={{
            fontSize: '15px',
            fontWeight: 700,
            color: 'var(--ink-950)',
            letterSpacing: '0.02em'
          }}
        >
          {isHeadsetConnected ? 'Headset Connected' : 'No Headset Detected'}
        </span>
      </div>

      {/* Right PTT Active Pill */}
      {isPttActive && (
        <span
          style={{
            backgroundColor: 'var(--bg-secondary-surface)',
            color: 'var(--aura-teal-dark)',
            fontSize: '13px',
            fontWeight: 800,
            letterSpacing: '0.08em',
            padding: '6px 12px',
            borderRadius: '9999px',
            textTransform: 'uppercase'
          }}
        >
          PTT ACTIVE
        </span>
      )}
    </div>
  );
};
