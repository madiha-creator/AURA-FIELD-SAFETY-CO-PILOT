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
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '14px',
          border: isReplaying ? '2px solid var(--aura-teal)' : '1px solid var(--border-subtle)',
          boxShadow: '0 2px 4px rgba(17, 28, 36, 0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          color: isReplaying ? 'var(--aura-teal)' : 'var(--ink-950)',
          fontSize: '16px',
          fontWeight: 700,
          letterSpacing: '0.04em',
          cursor: 'pointer',
          transition: 'all 0.15s ease-out'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--bg-surface-bright)';
          e.currentTarget.style.borderColor = 'var(--aura-teal)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
          e.currentTarget.style.borderColor = isReplaying ? 'var(--aura-teal)' : 'var(--border-subtle)';
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
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '14px',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 2px 4px rgba(17, 28, 36, 0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          color: 'var(--ink-950)',
          fontSize: '16px',
          fontWeight: 700,
          letterSpacing: '0.04em',
          cursor: 'pointer',
          transition: 'all 0.15s ease-out'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--bg-surface-bright)';
          e.currentTarget.style.borderColor = 'var(--aura-teal)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
          e.currentTarget.style.borderColor = 'var(--border-subtle)';
        }}
      >
        <HelpCircle size={20} strokeWidth={2.4} />
        HELP
      </button>
    </div>
  );
};
