import React from 'react';
import { Volume2, Quote } from 'lucide-react';

interface SuggestedCommandsProps {
  onSelectCommand: (commandText: string) => void;
}

export const SuggestedCommands: React.FC<SuggestedCommandsProps> = ({ onSelectCommand }) => {
  const commands = [
    { id: 'check', text: 'Walk me through the check' },
    { id: 'hazard', text: 'I need to report a hazard' }
  ];

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '16px',
        padding: '18px 20px',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 2px 4px rgba(17, 28, 36, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}
    >
      {/* Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span
          style={{
            fontSize: '14px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: 'var(--ink-500)',
            textTransform: 'uppercase'
          }}
        >
          SUGGESTED COMMANDS
        </span>
        <Volume2 size={18} color="var(--ink-500)" />
      </div>

      {/* Commands List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {commands.map((cmd) => (
          <button
            key={cmd.id}
            onClick={() => onSelectCommand(cmd.text)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              backgroundColor: 'var(--bg-app)',
              padding: '12px 16px',
              borderRadius: '12px',
              border: '1px solid transparent',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease-out'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--aura-teal)';
              e.currentTarget.style.backgroundColor = 'var(--surface-container)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'transparent';
              e.currentTarget.style.backgroundColor = 'var(--bg-app)';
            }}
          >
            {/* Quote badge icon */}
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-secondary-surface)',
                color: 'var(--aura-teal)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontWeight: 800,
                fontSize: '14px'
              }}
            >
              <Quote size={16} strokeWidth={2.5} />
            </div>

            <span
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: 'var(--ink-950)',
                lineHeight: 1.3
              }}
            >
              “{cmd.text}”
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
