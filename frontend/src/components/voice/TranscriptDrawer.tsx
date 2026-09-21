import React, { useState, useRef, useEffect } from 'react';
import { TranscriptEntry } from '../../types/voiceSession';
import { X, Send, MessageSquare } from 'lucide-react';

interface TranscriptDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  transcripts: TranscriptEntry[];
  onSendText: (text: string) => void;
  activeCaption?: string;
}

export const TranscriptDrawer: React.FC<TranscriptDrawerProps> = ({
  isOpen,
  onClose,
  transcripts,
  onSendText,
  activeCaption
}) => {
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts, isOpen]);

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
          height: '520px',
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
            <MessageSquare size={20} color="var(--aura-teal)" />
            <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink-950)' }}>
              Live Transcript & Fallback
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Transcript"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-app)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--ink-700)',
              cursor: 'pointer'
            }}
          >
            <X size={20} />
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
              fontWeight: 600,
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

            return (
              <div
                key={t.id}
                style={{
                  alignSelf: isWorker ? 'flex-end' : isSystem ? 'center' : 'flex-start',
                  maxWidth: isSystem ? '90%' : '80%',
                  backgroundColor: isWorker ? 'var(--aura-teal)' : isSystem ? 'var(--surface-neutral)' : 'var(--bg-app)',
                  color: isWorker ? 'var(--bg-surface)' : isSystem ? 'var(--ink-500)' : 'var(--ink-950)',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  fontSize: '15px',
                  lineHeight: '1.4',
                  border: isSystem ? '1px dashed #CBD5E1' : 'none'
                }}
              >
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    marginBottom: '4px',
                    opacity: 0.8
                  }}
                >
                  {t.sender} · {t.timestamp}
                </div>
                <div style={{ fontWeight: isWorker ? 600 : 500 }}>{t.text}</div>
              </div>
            );
          })}
        </div>

        {/* Keyboard Input Fallback Bar (FE-003) */}
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
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a voice command or report field..."
            style={{
              flex: 1,
              height: '48px',
              padding: '0 14px',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-app)',
              fontSize: '16px',
              color: 'var(--ink-950)',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            aria-label="Send Text Turn"
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '10px',
              backgroundColor: 'var(--aura-teal)',
              color: 'var(--bg-surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};
