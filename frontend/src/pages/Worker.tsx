import React, { useState } from 'react';
import { WorkerShell } from '../components/layout/WorkerShell';
import { ShellTab } from '../components/layout/BottomNav';
import { AuraVoiceElement } from '../components/voice/AuraVoiceElement';
import { SuggestedCommands } from '../components/voice/SuggestedCommands';
import { DraftCard } from '../components/voice/DraftCard';
import { ActionButtons } from '../components/voice/ActionButtons';
import { DeviceStatusBar } from '../components/voice/DeviceStatusBar';
import { TranscriptDrawer } from '../components/voice/TranscriptDrawer';
import { useWorkerWorkflowEngine } from '../services/workerWorkflowEngine';
import { SafetyGateView } from '../components/worker/SafetyGateView';
import { NarrativeCaptureView } from '../components/worker/NarrativeCaptureView';
import { AdaptiveQuestionsView } from '../components/worker/AdaptiveQuestionsView';
import { DraftReviewView } from '../components/worker/DraftReviewView';
import { ReportConfirmView } from '../components/worker/ReportConfirmView';
import { SavedReportView } from '../components/worker/SavedReportView';
import { ProcedureGuideView } from '../components/worker/ProcedureGuideView';
import { SafetyAlertModal } from '../components/worker/SafetyAlertModal';
import { TasksView } from '../components/worker/TasksView';
import { LogsView } from '../components/worker/LogsView';
import { StatusView } from '../components/worker/StatusView';
import { WorkerProfileModal } from '../components/worker/WorkerProfileModal';
import { MessageSquare } from 'lucide-react';

export default function Worker() {
  const engine = useWorkerWorkflowEngine();
  const { session, events } = engine;

  const [activeTab, setActiveTab] = useState<ShellTab>('voice');
  const [isTranscriptOpen, setIsTranscriptOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);

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
    engine.handleWorkerInput(cmdText);
  };

  const handleResumeDraft = () => {
    engine.setWorkflowMode('draft_review');
  };

  const handleHelp = () => {
    setIsProfileOpen(true);
  };

  const handleAudioTest = () => {
    events.agentStartedSpeaking('Audio output nominal. Low-latency PCM16 24 kilohertz buffer verified.');
  };

  // Status title and helper description matching FE-001 Frontline Voice Instrument
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

  // Render content based on activeTab and active workflow mode
  const renderTabContent = () => {
    if (activeTab === 'tasks') {
      return (
        <TasksView
          tasks={engine.tasks}
          onStartProcedure={(procId) => {
            setActiveTab('voice');
            engine.startProcedureFlow(procId);
          }}
        />
      );
    }

    if (activeTab === 'logs') {
      return (
        <LogsView
          logs={engine.logs}
          activeDraftTitle={engine.draft.status === 'draft' ? engine.draft.hazard_type.value || 'Near-Miss Draft' : undefined}
          onResumeDraft={() => {
            setActiveTab('voice');
            engine.setWorkflowMode('draft_review');
          }}
        />
      );
    }

    if (activeTab === 'status') {
      return <StatusView session={session} />;
    }

    // activeTab === 'voice'
    switch (engine.workflowMode) {
      case 'safety_gate':
        return (
          <SafetyGateView
            onSafeConfirmed={() => {
              engine.setHasSafeGatePassed(true);
              engine.setWorkflowMode('narrative_capture');
            }}
            onCancel={() => engine.setWorkflowMode('home')}
          />
        );

      case 'narrative_capture':
        return (
          <NarrativeCaptureView
            voiceState={session.state}
            variant={session.variant}
            currentCaption={session.currentCaption}
            partialUserText={session.partialUserText}
            onOrbClick={handleVoiceOrbClick}
            onFinishCapture={() => {
              engine.setWorkflowMode('follow_up');
              engine.setActiveQuestionKey('injury');
            }}
            onCancel={() => engine.setWorkflowMode('home')}
          />
        );

      case 'follow_up':
        return (
          <AdaptiveQuestionsView
            draft={engine.draft}
            activeKey={engine.activeQuestionKey}
            onAnswer={(key, val) => {
              engine.updateDraftField(key, val, 'said');
              if (key === 'injury') engine.setActiveQuestionKey('location');
              else if (key === 'location') engine.setActiveQuestionKey('equipment');
              else if (key === 'equipment') engine.setActiveQuestionKey('immediate_action');
              else engine.setWorkflowMode('draft_review');
            }}
            onProceedToReview={() => engine.setWorkflowMode('draft_review')}
          />
        );

      case 'read_back':
      case 'draft_review':
        return (
          <DraftReviewView
            draft={engine.draft}
            onUpdateField={engine.updateDraftField}
            onReadBack={() => {
              events.agentStartedSpeaking(
                `Recorded report: ${engine.draft.hazard_type.value} at ${engine.draft.location.value} involving ${engine.draft.equipment.value}. ${engine.draft.injury.value}. Say confirmed or make changes.`
              );
            }}
            onContinueToConfirm={() => engine.setWorkflowMode('confirm_report')}
            onBack={() => engine.setWorkflowMode('narrative_capture')}
            isReadingBack={session.state === 'speaking'}
          />
        );

      case 'confirm_report':
        return (
          <ReportConfirmView
            draft={engine.draft}
            onConfirm={engine.submitReport}
            onEdit={() => engine.setWorkflowMode('draft_review')}
          />
        );

      case 'saved_report':
        return (
          <SavedReportView
            reportId={engine.logs[0]?.id || 'NMR-2026-0815'}
            patternResult={engine.patternResult}
            onReturnHome={() => engine.setWorkflowMode('home')}
            onViewInLogs={() => setActiveTab('logs')}
          />
        );

      case 'procedure':
        return (
          <ProcedureGuideView
            procedure={engine.activeProcedure}
            currentStepIndex={engine.procedureStepIndex}
            isPaused={engine.isProcedurePaused}
            onConfirmStep={engine.confirmAndAdvanceStep}
            onRepeatStep={engine.repeatCurrentStep}
            onTogglePause={() => engine.setIsProcedurePaused(p => !p)}
            onExit={() => engine.setWorkflowMode('home')}
            onReportReading={(val) => {
              const currentStep = engine.activeProcedure.steps[engine.procedureStepIndex];
              const param = currentStep?.readingParam || 'gauge reading';
              engine.checkReadingThreshold(param, val);
            }}
          />
        );

      case 'home':
      default:
        return (
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
                    backgroundColor:
                      session.variant === 'danger'
                        ? 'var(--danger-red-bg)'
                        : session.variant === 'success'
                        ? 'var(--success-green-bg)'
                        : 'var(--bg-surface)',
                    border:
                      session.variant === 'danger'
                        ? '1px solid var(--danger-red-border)'
                        : '1px solid var(--border-subtle)',
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
            <DraftCard
              draftTitle={engine.draft.hazard_type.value || 'Bay 7 Forklift Cle'}
              onResume={handleResumeDraft}
            />

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
        );
    }
  };

  return (
    <WorkerShell
      activeTab={activeTab}
      onTabChange={setActiveTab}
      isConnected={session.isConnected}
      batteryLevel={session.batteryLevel}
      siteId={session.siteContext.siteId}
      siteTime={session.siteContext.timeString}
      onProfileClick={() => setIsProfileOpen(true)}
      offlineNotice={!session.isConnected ? 'OPERATING IN OFFLINE LOCAL MODE — ALL VOICE SENTINELS ACTIVE' : undefined}
    >
      {renderTabContent()}

      {/* Critical Safety Alert Modal (Sentinel Trip Override) */}
      {engine.safetyAlert && (
        <SafetyAlertModal
          alert={engine.safetyAlert}
          onAcknowledge={engine.acknowledgeSafetyAlert}
        />
      )}

      {/* Accessible Live Transcript & Fallback Drawer */}
      <TranscriptDrawer
        isOpen={isTranscriptOpen}
        onClose={() => setIsTranscriptOpen(false)}
        transcripts={session.transcripts}
        onSendText={(text) => engine.handleWorkerInput(text)}
        activeCaption={session.currentCaption}
      />

      {/* Worker Profile, Cheatsheet & Accessibility Settings Modal */}
      <WorkerProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onAudioTest={handleAudioTest}
        workerId={engine.draft.worker_id}
        siteName={`${session.siteContext.siteName} · ${session.siteContext.bay}`}
      />
    </WorkerShell>
  );
}
