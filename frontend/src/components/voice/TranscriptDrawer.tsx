import React, { useState, useRef, useEffect } from 'react';
import { TranscriptEntry } from '../../types/voiceSession';
import { X, Send, MessageSquare } from 'lucide-react';

interface TranscriptDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  transcripts: TranscriptEntry[];
  onSendText: (text: string) => void;
  activeCaption?: string;
  partialUserText?: string;
}

export const TranscriptDrawer: React.FC<TranscriptDrawerProps> = ({
  isOpen,
  onClose,
  transcripts,
  onSendText,
  activeCaption,
  partialUserText
}) => {
  const [inputText, setInputText] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  // Auto-focus input when drawer opens, restore focus on close, and handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedElementRef.current = document.activeElement as HTMLElement | null;

    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      previouslyFocusedElementRef.current?.focus?.();
    };
  }, [isOpen, onClose]);

  // Keep transcript view scrolled to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts, partialUserText, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendText(inputText.trim());
      setInputText('');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Session Transcript & Text Fallback"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(17, 28, 36, 0.65)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        backdropFilter: 'blur(2px)'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          maxHeight: '80vh',
          height: '540px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 -4px 24px rgba(17, 28, 36, 0.2)',
          maxWidth: '600px',
          width: '100%',
          margin: '0 auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MessageSquare size={22} color="var(--aura-teal)" />
            <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ink-950)' }}>
              Live Transcript & Fallback
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Transcript"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-app)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--ink-700)',
              cursor: 'pointer'
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Live Active Caption Banner */}
        {activeCaption && (
          <div
            style={{
              padding: '10px 20px',
              backgroundColor: 'var(--bg-secondary-surface)',
              borderBottom: '1px solid var(--outline-variant)',
              fontSize: '14px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              color: 'var(--aura-teal-dark)'
            }}
            aria-live="polite"
          >
            ACTIVE: {activeCaption}
          </div>
        )}

        {/* Transcript Message List */}
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          {transcripts.map((t) => {
            const isWorker = t.sender === 'worker';
            const isSystem = t.sender === 'system';
            const isCriticalSystem = isSystem && (t.text.includes('CRITICAL') || t.text.includes('SAFETY') || t.text.includes('ALERT'));

            return (
              <div
                key={t.id}
                style={{
                  alignSelf: isWorker ? 'flex-end' : isSystem ? 'center' : 'flex-start',
                  maxWidth: isSystem ? '92%' : '82%',
                  backgroundColor: isWorker
                    ? 'var(--aura-teal)'
                    : isCriticalSystem
                    ? 'var(--danger-red-bg)'
                    : isSystem
                    ? 'var(--surface-neutral)'
                    : 'var(--bg-app)',
                  color: isWorker
                    ? 'var(--bg-surface)'
                    : isCriticalSystem
                    ? 'var(--danger-red-text)'
                    : isSystem
                    ? 'var(--ink-700)'
                    : 'var(--ink-950)',
                  padding: '12px 16px',
                  borderRadius: '14px',
                  fontSize: '15px',
                  lineHeight: '1.45',
                  border: isCriticalSystem
                    ? '2px solid var(--danger-red-border)'
                    : isSystem
                    ? '1px dashed var(--border-subtle)'
                    : '1px solid var(--border-subtle)',
                  boxShadow: isCriticalSystem ? '0 2px 6px rgba(201, 54, 43, 0.15)' : 'none'
                }}
              >
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    marginBottom: '4px',
                    opacity: isWorker ? 0.9 : 0.8
                  }}
                >
                  {isWorker ? 'YOU' : isCriticalSystem ? 'SENTINEL ALERT' : isSystem ? 'SYSTEM' : 'AURA'} · {t.timestamp}
                </div>
                <div style={{ fontWeight: isWorker || isCriticalSystem ? 700 : 500 }}>
                  {t.text}
                </div>
              </div>
            );
          })}

          {/* In-flight streaming partial user turn indicator (rendered only when active speech provides partial text) */}
          {partialUserText && (
            <div
              style={{
                alignSelf: 'flex-end',
                maxWidth: '85%',
                backgroundColor: 'var(--aura-teal)',
                color: 'var(--bg-surface)',
                padding: '12px 16px',
                borderRadius: '14px',
                fontSize: '15px',
                lineHeight: '1.45',
                border: '1.5px dashed rgba(255, 255, 255, 0.6)',
                opacity: 0.95
              }}
            >
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: '4px',
                  opacity: 0.9,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>YOU · SPEAKING</span>
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#FFFFFF',
                    display: 'inline-block'
                  }}
                />
              </div>
              <div style={{ fontWeight: 600, fontStyle: 'italic' }}>
                {partialUserText} ...
              </div>
            </div>
          )}
        </div>

        {/* Keyboard Input Fallback Bar */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            gap: '10px',
            padding: '14px 20px',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface)'
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            placeholder="Type a voice command or report field..."
            style={{
              flex: 1,
              height: '56px',
              minHeight: 'var(--touch-target-min)',
              padding: '0 16px',
              borderRadius: 'var(--radius-btn)',
              border: isInputFocused ? '2px solid var(--aura-teal)' : '1.5px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-app)',
              fontSize: '16px',
              color: 'var(--ink-950)',
              outline: 'none',
              boxShadow: isInputFocused ? '0 0 0 2px rgba(14, 119, 116, 0.2)' : 'none',
              transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
            }}
          />
          <button
            type="submit"
            aria-label="Send Text Turn"
            style={{
              width: '56px',
              height: '56px',
              minHeight: 'var(--touch-target-min)',
              borderRadius: 'var(--radius-btn)',
              backgroundColor: 'var(--aura-teal)',
              color: 'var(--bg-surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              boxShadow: '0 2px 4px rgba(14, 119, 116, 0.25)'
            }}
          >
            <Send size={22} />
          </button>
        </form>
      </div>
    </div>
  );
};
