import React, { useState } from 'react';
import { WorkerShell } from '../components/layout/WorkerShell';
import { ShellTab } from '../components/layout/BottomNav';
import { AuraVoiceElement } from '../components/voice/AuraVoiceElement';
import { SuggestedCommands } from '../components/voice/SuggestedCommands';
import { DraftCard } from '../components/voice/DraftCard';
import { ActionButtons } from '../components/voice/ActionButtons';
import { DeviceStatusBar } from '../components/voice/DeviceStatusBar';
import { TranscriptDrawer } from '../components/voice/TranscriptDrawer';
import { useVoiceSession } from '../services/voiceSessionMachine';
import { MessageSquare } from 'lucide-react';

export default function Worker() {
  const [session, events] = useVoiceSession();
  const [activeTab, setActiveTab] = useState<ShellTab>('voice');
  const [isTranscriptOpen, setIsTranscriptOpen] = useState<boolean>(false);

  const handleVoiceOrbClick = () => {
    if (session.state === 'speaking' || session.state === 'replaying') {
      // Barge-in rule: Tap while Aura is speaking interrupts immediately
      events.interruptAgent();
    } else if (session.state === 'listening') {
      events.stopListening();
    } else {
      events.startListening();
    }
  };

  const handleSelectCommand = (cmdText: string) => {
    events.sendTextTurn(cmdText);
  };

  const handleResumeDraft = () => {
    events.sendTextTurn('Resume draft for Bay 7 Forklift Clearance check');
  };

  const handleHelp = () => {
    events.sendTextTurn('Help with available voice commands and safety procedures');
  };

  // Status title and helper description matching FE-001 Stitch Reference
  const getDisplayHeading = () => {
    switch (session.state) {
      case 'listening':
        return 'Listening...';
      case 'processing':
        return 'Understanding...';
      case 'speaking':
        return 'Aura is speaking';
      case 'replaying':
        return 'Replaying last response';
      case 'interrupted':
        return 'Paused — Your Turn';
      case 'offline':
        return 'Offline Voice Mode';
      case 'microphone_error':
        return 'Microphone Unavailable';
      case 'speaker_error':
        return 'Audio Output Error';
      case 'session_error':
        return 'Session Disconnected';
      case 'ready':
      default:
        return 'Ready when you are.';
    }
  };

  const getActionLabel = () => {
    switch (session.state) {
      case 'listening':
        return 'TAP TO FINISH';
      case 'processing':
        return 'PROCESSING...';
      case 'speaking':
      case 'replaying':
        return 'TAP TO INTERRUPT';
      case 'interrupted':
        return 'TAP TO SPEAK';
      case 'microphone_error':
        return 'TAP TO ENABLE MIC';
      default:
        return 'TAP TO SPEAK';
    }
  };

  const getActionSubtext = () => {
    if (session.state === 'speaking' || session.state === 'replaying') {
      return 'Tap anywhere or speak to interrupt Aura instantly.';
    }
    if (session.state === 'listening') {
      return 'Speak normally. Aura is listening to your command.';
    }
    if (session.state === 'interrupted') {
      return 'Playback stopped. You have the floor.';
    }
    return 'Tap and speak. You can interrupt me anytime.';
  };

  return (
    <WorkerShell
      activeTab={activeTab}
      onTabChange={setActiveTab}
      isConnected={session.isConnected}
      batteryLevel={session.batteryLevel}
      siteId={session.siteContext.siteId}
      siteTime={session.siteContext.timeString}
      offlineNotice={!session.isConnected ? 'OPERATING IN OFFLINE LOCAL MODE — ALL VOICE SENTINELS ACTIVE' : undefined}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

        {/* Site / Context Area */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '6px'
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--aura-teal)',
                display: 'inline-block'
              }}
            />
            <span
              style={{
                fontSize: '14px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: 'var(--ink-700)',
                textTransform: 'uppercase'
              }}
            >
              {session.siteContext.siteName} · {session.siteContext.bay}
            </span>
          </div>

          <h2
            style={{
              fontSize: '28px',
              fontWeight: 800,
              color: 'var(--ink-950)',
              letterSpacing: '-0.01em',
              lineHeight: 1.2
            }}
          >
            {getDisplayHeading()}
          </h2>
        </div>

        {/* Hero AURA Voice Element Section */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            padding: '12px 0 6px 0'
          }}
        >
          <AuraVoiceElement
            state={session.state}
            variant={session.variant}
            size={180}
            onClick={handleVoiceOrbClick}
          />

          <div
            style={{
              marginTop: '16px',
              fontSize: '20px',
              fontWeight: 800,
              letterSpacing: '0.08em',
              color: session.variant === 'danger' ? 'var(--danger-red)' : 'var(--ink-950)',
              textTransform: 'uppercase'
            }}
          >
            {getActionLabel()}
          </div>

          <div
            style={{
              marginTop: '4px',
              fontSize: '15px',
              fontWeight: 500,
              color: 'var(--ink-500)',
              maxWidth: '320px',
              lineHeight: 1.4
            }}
          >
            {getActionSubtext()}
          </div>

          {/* Active live caption / response banner */}
          {session.currentCaption && session.state !== 'ready' && (
            <div
              style={{
                marginTop: '12px',
                padding: '10px 16px',
                borderRadius: '12px',
                backgroundColor: session.variant === 'danger' ? 'var(--danger-red-bg)' : session.variant === 'success' ? 'var(--success-green-bg)' : 'var(--bg-surface)',
                border: session.variant === 'danger' ? '1px solid var(--danger-red-border)' : '1px solid var(--border-subtle)',
                color: session.variant === 'danger' ? 'var(--danger-red-text)' : 'var(--ink-950)',
                fontSize: '15px',
                fontWeight: 600,
                boxShadow: '0 2px 4px rgba(17, 28, 36, 0.04)',
                maxWidth: '420px',
                width: '100%',
                lineHeight: 1.35
              }}
            >
              {session.currentCaption}
            </div>
          )}
        </div>

        {/* Suggested Commands Card */}
        <SuggestedCommands onSelectCommand={handleSelectCommand} />

        {/* Draft in Progress Card */}
        <DraftCard draftTitle="Bay 7 Forklift Cle" onResume={handleResumeDraft} />

        {/* Action Buttons: REPLAY LAST and HELP */}
        <ActionButtons
          onReplay={events.replayLastResponse}
          onHelp={handleHelp}
          isReplaying={session.state === 'replaying'}
        />

        {/* Headset / PTT Device Status Bar */}
        <DeviceStatusBar
          isHeadsetConnected={session.hasHeadset}
          isPttActive={session.isPttActive}
        />

        {/* Caption Drawer & Text Fallback Toggle Pill */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '-4px' }}>
          <button
            onClick={() => setIsTranscriptOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              padding: '8px 16px',
              borderRadius: '9999px',
              fontSize: '13px',
              fontWeight: 700,
              color: 'var(--ink-700)',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(17, 28, 36, 0.04)'
            }}
          >
            <MessageSquare size={16} color="var(--aura-teal)" />
            View Live Transcript & Keyboard Fallback
          </button>
        </div>

      </div>

      {/* Accessible Live Transcript & Fallback Drawer */}
      <TranscriptDrawer
        isOpen={isTranscriptOpen}
        onClose={() => setIsTranscriptOpen(false)}
        transcripts={session.transcripts}
        onSendText={events.sendTextTurn}
        activeCaption={session.currentCaption}
      />
    </WorkerShell>
  );
}
