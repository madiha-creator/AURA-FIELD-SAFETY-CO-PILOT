import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CheckCircle2, ShieldCheck } from 'lucide-react';

interface HoldToConfirmButtonProps {
  onConfirm: () => void;
  disabled?: boolean;
  durationMs?: number;
  label?: string;
  confirmingLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * AURA High-Stakes Hold-to-Confirm Button (DESIGN.md Section 3)
 * Requires continuous ~1000ms press to trigger irreversible safety approvals.
 * A horizontal sweep in var(--success-green) fills the button background,
 * executing onConfirm only once full duration is achieved.
 */
export const HoldToConfirmButton: React.FC<HoldToConfirmButtonProps> = ({
  onConfirm,
  disabled = false,
  durationMs = 1000,
  label = 'Approve & Notify',
  confirmingLabel = 'Hold to Confirm...',
  className,
  style
}) => {
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isCompletedRef = useRef(false);

  const cancelHold = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setHolding(false);
    startTimeRef.current = null;
    setProgress(0);
  }, []);

  const step = useCallback((timestamp: number) => {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp;
    }
    const elapsed = timestamp - startTimeRef.current;
    const currentProgress = Math.min((elapsed / durationMs) * 100, 100);
    setProgress(currentProgress);

    if (elapsed >= durationMs) {
      isCompletedRef.current = true;
      setHolding(false);
      setProgress(100);
      onConfirm();
      setTimeout(() => {
        setProgress(0);
        isCompletedRef.current = false;
      }, 500);
    } else {
      animFrameRef.current = requestAnimationFrame(step);
    }
  }, [durationMs, onConfirm]);

  const startHold = useCallback((e: React.SyntheticEvent) => {
    if (disabled || isCompletedRef.current) return;
    // Don't trigger default context menus on long touch
    if (e.type === 'touchstart') {
      e.stopPropagation();
    }
    setHolding(true);
    setProgress(0);
    animFrameRef.current = requestAnimationFrame(step);
  }, [disabled, step]);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  // Keyboard accessibility: hold Space or Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === ' ' || e.key === 'Enter') {
      if (!holding) {
        e.preventDefault();
        startHold(e);
      }
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      cancelHold();
    }
  };

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label="Hold for 1 second to confirm approval and notify safety contact"
      aria-pressed={holding}
      onMouseDown={startHold}
      onMouseUp={cancelHold}
      onMouseLeave={cancelHold}
      onTouchStart={startHold}
      onTouchEnd={cancelHold}
      onTouchCancel={cancelHold}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      className={className}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '44px',
        minWidth: '200px',
        padding: '0 20px',
        backgroundColor: disabled ? 'var(--surface-container-high)' : 'var(--aura-teal)',
        color: disabled ? 'var(--ink-500)' : '#FFFFFF',
        border: 'none',
        borderRadius: 'var(--radius-sm)',
        fontSize: '14px',
        fontWeight: 700,
        letterSpacing: '0.04em',
        cursor: disabled ? 'not-allowed' : 'pointer',
        overflow: 'hidden',
        boxShadow: disabled ? 'none' : 'var(--shadow-card)',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'none',
        transition: 'background-color 0.2s, transform 0.1s',
        ...style
      }}
    >
      {/* Background sweep progress bar */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: `${progress}%`,
          backgroundColor: 'var(--success-green)',
          transition: holding ? 'none' : 'width 0.2s ease-out',
          zIndex: 1,
          opacity: 0.95
        }}
      />

      {/* Button content layer */}
      <span
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          whiteSpace: 'nowrap'
        }}
      >
        {holding ? (
          <>
            <CheckCircle2 size={16} />
            <span>{confirmingLabel} ({Math.round(progress)}%)</span>
          </>
        ) : (
          <>
            <ShieldCheck size={16} />
            <span>{label}</span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                opacity: 0.85,
                backgroundColor: 'rgba(0, 0, 0, 0.18)',
                padding: '2px 6px',
                borderRadius: 'var(--radius-pill)',
                marginLeft: '4px'
              }}
            >
              HOLD 1S
            </span>
          </>
        )}
      </span>
    </button>
  );
};
