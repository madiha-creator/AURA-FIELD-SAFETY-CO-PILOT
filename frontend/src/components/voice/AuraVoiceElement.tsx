import React from 'react';
import { VoiceState, SemanticVariant } from '../../types/voiceSession';
import { AuraLogoSvg } from './AuraLogoSvg';

interface AuraVoiceElementProps {
  state: VoiceState;
  variant?: SemanticVariant;
  size?: number;
  onClick?: () => void;
  ariaLabel?: string;
}

export const AuraVoiceElement: React.FC<AuraVoiceElementProps> = ({
  state,
  variant = 'normal',
  size = 200,
  onClick,
  ariaLabel
}) => {
  const isListening = state === 'listening';
  const isSpeaking = state === 'speaking' || state === 'replaying';
  const isProcessing = state === 'processing';
  const isOffline = state === 'offline';
  const isInterrupted = state === 'interrupted';

  // Semantic Glow styling:
  // - Normal: Teal glow
  // - Danger: Red glow
  // - Success: Green glow
  // The glow surrounds the element without altering the underlying AURA logo.
  const getGlowStyles = (): React.CSSProperties => {
    if (variant === 'danger') {
      return {
        boxShadow: isSpeaking
          ? '0 0 42px rgba(201, 54, 43, 0.75), 0 0 84px rgba(201, 54, 43, 0.4)'
          : isListening
          ? '0 0 32px rgba(201, 54, 43, 0.5)'
          : '0 0 20px rgba(201, 54, 43, 0.35)',
        border: '3px solid #C9362B',
        animation: isSpeaking ? 'glow-pulse-danger 1.4s ease-in-out infinite' : undefined
      };
    }

    if (variant === 'success') {
      return {
        boxShadow: isSpeaking
          ? '0 0 42px rgba(35, 122, 75, 0.75), 0 0 84px rgba(35, 122, 75, 0.4)'
          : isListening
          ? '0 0 32px rgba(35, 122, 75, 0.5)'
          : '0 0 20px rgba(35, 122, 75, 0.35)',
        border: '3px solid #237A4B',
        animation: isSpeaking ? 'glow-pulse-success 1.4s ease-in-out infinite' : undefined
      };
    }

    // Default / Normal: Aura Teal glow
    return {
      boxShadow: isSpeaking
        ? '0 0 38px rgba(14, 119, 116, 0.7), 0 0 76px rgba(14, 119, 116, 0.35)'
        : isListening
        ? '0 0 28px rgba(14, 119, 116, 0.5)'
        : '0 0 16px rgba(14, 119, 116, 0.25)',
      border: isListening ? '3px solid #0E7774' : '3px solid transparent',
      animation: isSpeaking
        ? 'glow-pulse-normal 1.6s ease-in-out infinite'
        : !isListening && !isProcessing
        ? 'idle-calm-presence 3s ease-in-out infinite'
        : undefined
    };
  };

  const defaultLabel = isListening
    ? 'Aura is listening. Ring 2 active. Tap to finish.'
    : isSpeaking
    ? 'Aura is speaking. Tap to interrupt.'
    : isProcessing
    ? 'Aura is processing request.'
    : isOffline
    ? 'Aura offline mode.'
    : 'Aura is ready. Tap to speak.';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      aria-label={ariaLabel || defaultLabel}
      style={{
        position: 'relative',
        width: `${size}px`,
        height: `${size}px`,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        userSelect: 'none',
        outline: 'none',
        borderRadius: '50%',
        padding: '6px',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        ...getGlowStyles()
      }}
    >
      {/* Outer concentric subtle glow pulse ring */}
      <div
        style={{
          position: 'absolute',
          top: '-10px',
          left: '-10px',
          right: '-10px',
          bottom: '-10px',
          borderRadius: '50%',
          border: variant === 'danger'
            ? '2px solid rgba(201, 54, 43, 0.35)'
            : variant === 'success'
            ? '2px solid rgba(35, 122, 75, 0.35)'
            : '2px solid rgba(14, 119, 116, 0.3)',
          opacity: isListening || isSpeaking ? 1 : 0.4,
          transition: 'opacity 0.3s ease',
          pointerEvents: 'none'
        }}
      />

      {/* Authoritative AURA Logo SVG:
          - Authentic production vector paths
          - Ring 2 rotates smoothly during listening around (1000, 1000)
          - Center core identity remains visually stable during listening
          - Center core gently pulses during speaking
          - NO microphone icon replacing the logo
      */}
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          overflow: 'hidden',
          backgroundColor: '#0E7774',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <AuraLogoSvg
          isListening={isListening || isProcessing}
          isSpeaking={isSpeaking}
        />
      </div>
    </div>
  );
};
