import React from 'react';
import { RotateCcw, HelpCircle } from 'lucide-react';

interface ActionButtonsProps {
  onReplay: () => void;
  onHelp?: () => void;
  isReplaying?: boolean;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onReplay,
  onHelp,
  isReplaying = false
}) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
      {/* Replay Last Button */}
      <button
        onClick={onReplay}
        style={{
          height: '60px',
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          border: isReplaying ? '2px solid #0E7774' : '1px solid #D0DCE5',
          boxShadow: '0 2px 4px rgba(17, 28, 36, 0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          color: isReplaying ? '#0E7774' : '#111C24',
          fontSize: '16px',
          fontWeight: 700,
          letterSpacing: '0.04em',
          cursor: 'pointer',
          transition: 'all 0.15s ease-out'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#F6FAFF';
          e.currentTarget.style.borderColor = '#0E7774';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#FFFFFF';
          e.currentTarget.style.borderColor = isReplaying ? '#0E7774' : '#D0DCE5';
        }}
      >
        <RotateCcw
          size={20}
          strokeWidth={2.4}
          style={{
            animation: isReplaying ? 'ring2-listening-spin 2s linear infinite' : 'none'
          }}
        />
        {isReplaying ? 'REPLAYING...' : 'REPLAY LAST'}
      </button>

      {/* Help Button */}
      <button
        onClick={onHelp}
        style={{
          height: '60px',
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          border: '1px solid #D0DCE5',
          boxShadow: '0 2px 4px rgba(17, 28, 36, 0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          color: '#111C24',
          fontSize: '16px',
          fontWeight: 700,
          letterSpacing: '0.04em',
          cursor: 'pointer',
          transition: 'all 0.15s ease-out'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#F6FAFF';
          e.currentTarget.style.borderColor = '#0E7774';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#FFFFFF';
          e.currentTarget.style.borderColor = '#D0DCE5';
        }}
      >
        <HelpCircle size={20} strokeWidth={2.4} />
        HELP
      </button>
    </div>
  );
};
