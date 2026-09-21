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
        backgroundColor: '#FFFFFF',
        borderRadius: '14px',
        padding: '12px 18px',
        border: '1px solid #D0DCE5',
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
            backgroundColor: isHeadsetConnected ? '#237A4B' : '#6F7E85',
            display: 'inline-block'
          }}
        />
        <span
          style={{
            fontSize: '15px',
            fontWeight: 700,
            color: '#111C24',
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
            backgroundColor: '#D6E8EA',
            color: '#075B5A',
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
