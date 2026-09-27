import React from 'react';

interface StatusBadgeProps {
  status: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Standardized AURA Review Status Badge
 * Capsule pill indicating report review workflow state.
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className,
  style
}) => {
  const norm = String(status || '').toLowerCase().replace(/[\s-]/g, '_');

  let label = status.replace(/_/g, ' ');
  let bg = 'var(--surface-container)';
  let text = 'var(--ink-700)';
  let border = 'var(--border-subtle)';

  if (norm === 'awaiting_review' || norm === 'awaiting' || norm === 'pending') {
    label = 'AWAITING REVIEW';
    bg = 'var(--warning-amber-bg)';
    text = 'var(--warning-amber-text)';
    border = 'var(--warning-amber-border)';
  } else if (norm === 'approved') {
    label = 'APPROVED';
    bg = 'var(--success-green-bg)';
    text = 'var(--success-green-text)';
    border = 'var(--success-green-border)';
  } else if (norm === 'rejected') {
    label = 'REJECTED';
    bg = 'var(--danger-red-bg)';
    text = 'var(--danger-red-text)';
    border = 'var(--danger-red-border)';
  }

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: '24px',
        padding: '0 10px',
        borderRadius: 'var(--radius-pill)',
        backgroundColor: bg,
        color: text,
        border: `1px solid ${border}`,
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        lineHeight: 1,
        whiteSpace: 'nowrap',
        userSelect: 'none',
        ...style
      }}
    >
      {label}
    </span>
  );
};
