import React from 'react';

export type ProvenanceSource = 'said' | 'worker_said' | 'inferred' | 'ai_inferred' | 'verified' | 'out_of_spec';

interface ProvenanceBadgeProps {
  source?: ProvenanceSource | string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Standardized AURA Provenance Badge (DESIGN.md Section 4)
 * 24px height, 9999px radius, uppercase label-md with 0.08em tracking.
 * - WORKER SAID: #D6E8EA fill, var(--ink-900) text
 * - AI INFERRED: #FEF3C7 fill, var(--warning-amber-text) text
 * - VERIFIED: #DCFCE7 fill, var(--success-green-text) text
 * - OUT OF SPEC: #FEE2E2 fill, var(--danger-red-text) text
 */
export const ProvenanceBadge: React.FC<ProvenanceBadgeProps> = ({
  source = 'worker_said',
  className,
  style
}) => {
  const norm = String(source || '').toLowerCase();

  let label = 'WORKER SAID';
  let bg = 'var(--bg-secondary-surface)';
  let text = 'var(--ink-900)';
  let border = 'var(--outline-variant)';

  if (norm.includes('inferred')) {
    label = 'AI INFERRED';
    bg = 'var(--warning-amber-bg)';
    text = 'var(--warning-amber-text)';
    border = 'var(--warning-amber-border)';
  } else if (norm.includes('verified')) {
    label = 'VERIFIED';
    bg = 'var(--success-green-bg)';
    text = 'var(--success-green-text)';
    border = 'var(--success-green-border)';
  } else if (norm.includes('out_of_spec') || norm.includes('spec') || norm.includes('alert')) {
    label = 'OUT OF SPEC';
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
        padding: '0 8px',
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
