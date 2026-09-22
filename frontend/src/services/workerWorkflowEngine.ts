import { useState, useEffect, useCallback, useRef } from 'react';
import { useVoiceSession } from './voiceSessionMachine';
import {
  ReportDraft,
  WorkerWorkflowMode,
  ProcedureDefinition,
  ProcedureStep,
  SafetyAlertData,
  PatternCheckResult,
  TaskItem,
  LogItem,
  FieldWithProvenance,
  ReportCorrection,
  ProvenanceType
} from '../types/workerWorkflows';

// Approved Industrial Procedures
export const APPROVED_PROCEDURES: ProcedureDefinition[] = [
  {
    id: 'proc_coolant_flush',
    title: 'Secondary Coolant Line Flush',
    revision: 'PROC-CLNT-04 REV 3.2 — APPROVED',
    totalSteps: 5,
    steps: [
      {
        id: 1,
        instruction: 'Inspect secondary coolant reservoir line connections for physical leakage or pressure drop.',
        details: 'Examine flange gaskets and quick-disconnect fittings around manifold block B-7.',
        requiresConfirmation: true
      },
      {
        id: 2,
        instruction: 'Check coolant line pressure reading on gauge G-02.',
        details: 'Normal operating range is strictly 4.0 to 10.0 PSI. Out of range values require immediate isolation.',
        checkRequired: true,
        readingParam: 'coolant line pressure',
        expectedRange: { min: 4.0, max: 10.0, unit: 'PSI' },
        requiresConfirmation: true
      },
      {
        id: 3,
        instruction: 'Verify chemical additive concentration at inspection port P-3.',
        details: 'Check that glycol concentration reads 35% ± 5%.',
        requiresConfirmation: true
      },
      {
        id: 4,
        instruction: 'Open purge drain valve DV-01 slowly for 15 seconds into approved containment drum.',
        warning: 'Ensure splash goggles and chemical-resistant gloves are secured.',
        requiresConfirmation: true
      },
      {
        id: 5,
        instruction: 'Close purge valve DV-01, record final static pressure, and verify clearance.',
        details: 'Confirm no residual drops or aerosolization in bay area.',
        requiresConfirmation: true
      }
    ]
  },
  {
    id: 'proc_generator_check',
    title: 'Emergency Generator Pre-Start Check',
    revision: 'PROC-GEN-12 REV 2.1 — APPROVED',
    totalSteps: 4,
    steps: [
      {
        id: 1,
        instruction: 'Verify oil sump level is between ADD and FULL markers on dipstick.',
        requiresConfirmation: true
      },
      {
        id: 2,
        instruction: 'Inspect cooling fan belts for tension and absence of fraying or cracking.',
        requiresConfirmation: true
      },
      {
        id: 3,
        instruction: 'Check battery terminal voltage meter on control panel CP-1.',
        checkRequired: true,
        readingParam: 'battery voltage',
        expectedRange: { min: 24.0, max: 28.0, unit: 'V' },
        requiresConfirmation: true
      },
      {
        id: 4,
        instruction: 'Ensure exhaust louvers are unobstructed and clear for automatic damper operation.',
        requiresConfirmation: true
      }
    ]
  },
  {
    id: 'proc_hydraulic_pump',
    title: 'Hydraulic Pump Line Inspection',
    revision: 'PROC-HYD-07 REV 4.0 — APPROVED',
    totalSteps: 3,
    steps: [
      {
        id: 1,
        instruction: 'Check hydraulic oil reservoir sight glass level and fluid clarity.',
        requiresConfirmation: true
      },
      {
        id: 2,
        instruction: 'Inspect high-pressure hydraulic lines for sweating, abrasions, or coupling weeping.',
        checkRequired: true,
        readingParam: 'hydraulic pressure',
        expectedRange: { min: 1800, max: 2200, unit: 'PSI' },
        requiresConfirmation: true
      },
      {
        id: 3,
        instruction: 'Verify accumulator pre-charge indicator is in green nominal zone.',
        requiresConfirmation: true
      }
    ]
  }
];

const INITIAL_DRAFT: ReportDraft = {
  id: 'draft-bay7-forklift',
  worker_id: 'W-4882',
  site_id: 'SITE-03',
  location: { value: 'Bay 7 South Crossing', source: 'said' },
  equipment: { value: 'Forklift #4 (Toyota 8FGU25)', source: 'inferred' },
  hazard_type: { value: 'Blind Spot & Overhead Obstruction', source: 'inferred' },
  injury: { value: 'No injuries reported', source: 'said' },
  narrative: {
    value: 'Near miss at Bay 7 South Crossing. Forklift #4 entered high-rack aisle without audible horn warning due to low-hanging conduit.',
    source: 'said'
  },
  immediate_action: { value: 'Flagged crossing with magnetic red stanchions and notified shift lead.', source: 'said' },
  potential_consequence: 'Worker pedestrian collision with high-capacity forklift in high-traffic blind intersection.',
  corrections: [],
  createdAt: 'Today, 09:15',
  status: 'draft'
};

async function computeSha256(str: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(str);
      const hash = await window.crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    } catch {
      // Fallback below
    }
  }
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return 'offline-sha-' + Math.abs(hash).toString(16);
}

export function useWorkerWorkflowEngine() {
  const [session, events] = useVoiceSession();

  const [workflowMode, setWorkflowMode] = useState<WorkerWorkflowMode>('home');
  const [draft, setDraft] = useState<ReportDraft>(() => {
    try {
      const saved = localStorage.getItem('aura_active_draft');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_DRAFT;
  });

  const [hasSafeGatePassed, setHasSafeGatePassed] = useState<boolean>(false);
  const [activeQuestionKey, setActiveQuestionKey] = useState<string>('injury');

  // Procedure Guidance State
  const [activeProcedure, setActiveProcedure] = useState<ProcedureDefinition>(APPROVED_PROCEDURES[0]);
  const [procedureStepIndex, setProcedureStepIndex] = useState<number>(0); // 0-indexed
  const [isProcedurePaused, setIsProcedurePaused] = useState<boolean>(false);
  const [confirmedSteps, setConfirmedSteps] = useState<number[]>([]);

  // Safety Alert State
  const [safetyAlert, setSafetyAlert] = useState<SafetyAlertData | null>(null);

  // Pattern Check State
  const [patternResult, setPatternResult] = useState<PatternCheckResult | null>(null);

  // Tasks List
  const [tasks, setTasks] = useState<TaskItem[]>([
    {
      id: 'task-1',
      title: 'Secondary Coolant Line Flush',
      procedureId: 'proc_coolant_flush',
      status: 'in_progress',
      stepCurrent: 2,
      stepTotal: 5,
      location: 'Bay 7 Mechanical Annex',
      equipment: 'Manifold Block B-7',
      estimatedMinutes: 20
    },
    {
      id: 'task-2',
      title: 'Emergency Generator Pre-Start Check',
      procedureId: 'proc_generator_check',
      status: 'assigned',
      stepCurrent: 1,
      stepTotal: 4,
      location: 'South Utility Yard',
      equipment: 'Generator GEN-02',
      estimatedMinutes: 15
    },
    {
      id: 'task-3',
      title: 'Hydraulic Pump Line Inspection',
      procedureId: 'proc_hydraulic_pump',
      status: 'paused',
      stepCurrent: 2,
      stepTotal: 3,
      location: 'East Staging Bay',
      equipment: 'Press Station 3',
      estimatedMinutes: 10
    }
  ]);

  // Logs List
  const [logs, setLogs] = useState<LogItem[]>(() => {
    try {
      const saved = localStorage.getItem('aura_worker_logs');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'NMR-2026-0814',
        type: 'near_miss',
        title: 'Forklift Blind Crossing Near-Miss',
        subtitle: 'Bay 7 South Crossing · Forklift #4',
        timestamp: 'Today, 08:30',
        status: 'awaiting_review',
        location: 'Bay 7 South Crossing',
        equipment: 'Forklift #4'
      },
      {
        id: 'MNT-2026-0192',
        type: 'maintenance',
        title: 'Manifold Flange Re-torqued',
        subtitle: 'Bay 2 Chemical Sump · Flange B-2',
        timestamp: 'Yesterday, 14:15',
        status: 'approved',
        location: 'Bay 2 Chemical Sump',
        equipment: 'Flange B-2'
      }
    ];
  });

  // Persist draft and logs
  useEffect(() => {
    try {
      localStorage.setItem('aura_active_draft', JSON.stringify(draft));
    } catch {}
  }, [draft]);

  useEffect(() => {
    try {
      localStorage.setItem('aura_worker_logs', JSON.stringify(logs));
    } catch {}
  }, [logs]);

  // Threshold Sentinel Checker
  const checkReadingThreshold = useCallback((param: string, value: number): boolean => {
    const lowerParam = param.toLowerCase();
    // Default safe range for coolant pressure: 4.0 - 10.0 PSI
    let min = 4.0;
    let max = 10.0;
    let unit = 'PSI';

    if (lowerParam.includes('volt')) {
      min = 24.0;
      max = 28.0;
      unit = 'V';
    } else if (lowerParam.includes('hydraul')) {
      min = 1800;
      max = 2200;
      unit = 'PSI';
    }

    if (value < min || value > max) {
      const span = max - min;
      const deviation = value > max ? ((value - max) / span) * 100 : ((min - value) / span) * 100;
      const severity = deviation > 30 ? 'critical' : 'warn';

      // Halt audio playback immediately (Barge-in sentinel rule)
      events.interruptAgent();
      events.setSemanticVariant('danger');

      setSafetyAlert({
        title: 'STOP — SAFETY ALERT',
        parameter: param,
        measuredValue: value,
        unit,
        expectedRange: { min, max },
        deviationPct: Math.round(deviation * 10) / 10,
        severity,
        message: `Measured ${value} ${unit} exceeds safe operating range (${min} – ${max} ${unit}) by +${Math.round(deviation)}%.`,
        prescribedAction: '1. Immediately cease step advancement.\n2. Close isolation valve SV-2.\n3. Do not attempt adjustment until pressure relieves.\n4. Notify shift safety supervisor.',
        sourceContext: 'procedure'
      });

      setWorkflowMode('safety_alert');
      return false;
    }

    events.setSemanticVariant('success');
    return true;
  }, [events]);

  // Start Safety Reporting Flow
  const startReportingFlow = useCallback(() => {
    setHasSafeGatePassed(false);
    setWorkflowMode('safety_gate');
    events.setSemanticVariant('normal');
  }, [events]);

  // Start Procedure Flow
  const startProcedureFlow = useCallback((procedureId: string = 'proc_coolant_flush') => {
    const proc = APPROVED_PROCEDURES.find(p => p.id === procedureId) || APPROVED_PROCEDURES[0];
    setActiveProcedure(proc);
    setProcedureStepIndex(0);
    setIsProcedurePaused(false);
    setWorkflowMode('procedure');
    events.setSemanticVariant('normal');
  }, [events]);

  // Advance Procedure Step with explicit confirmation
  const confirmAndAdvanceStep = useCallback(() => {
    const currentStep = activeProcedure.steps[procedureStepIndex];
    if (!currentStep) return;

    setConfirmedSteps(prev => [...new Set([...prev, currentStep.id])]);

    if (procedureStepIndex < activeProcedure.steps.length - 1) {
      const nextIdx = procedureStepIndex + 1;
      setProcedureStepIndex(nextIdx);
      events.setSemanticVariant('normal');
    } else {
      // Completed all steps
      setWorkflowMode('home');
      events.setSemanticVariant('success');
    }
  }, [activeProcedure, procedureStepIndex, events]);

  // Repeat current procedure step
  const repeatCurrentStep = useCallback(() => {
    const step = activeProcedure.steps[procedureStepIndex];
    if (step) {
      events.replayLastResponse();
    }
  }, [activeProcedure, procedureStepIndex, events]);

  // Acknowledge Safety Alert
  const acknowledgeSafetyAlert = useCallback(() => {
    setSafetyAlert(null);
    events.setSemanticVariant('normal');
    // Return to procedure if we were in procedure, else home
    if (activeProcedure) {
      setWorkflowMode('procedure');
    } else {
      setWorkflowMode('home');
    }
  }, [activeProcedure, events]);

  // Update a field in report draft with provenance tracking
  const updateDraftField = useCallback((
    field: keyof Omit<ReportDraft, 'id' | 'worker_id' | 'site_id' | 'corrections' | 'createdAt' | 'status' | 'idempotency_key' | 'potential_consequence'>,
    value: string,
    source: ProvenanceType = 'said'
  ) => {
    setDraft(prev => {
      const current = prev[field] as FieldWithProvenance;
      const isCorrected = current && current.value && current.value !== value;
      const corrections: ReportCorrection[] = [...prev.corrections];

      if (isCorrected) {
        corrections.push({
          field: String(field),
          previousValue: current.value,
          newValue: value,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          source
        });
      }

      return {
        ...prev,
        [field]: {
          value,
          source,
          originalValue: current?.originalValue || current?.value || value,
          isCorrected: isCorrected || current?.isCorrected
        },
        corrections
      };
    });
  }, []);

  // Submit Final Report with Idempotency Key
  const submitReport = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    const rawKey = `${draft.worker_id}:${draft.site_id}:${draft.equipment.value}:${draft.narrative.value.trim().toLowerCase()}:${today}`;
    const idempotencyKey = await computeSha256(rawKey);

    const reportId = `NMR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newLog: LogItem = {
      id: reportId,
      type: 'near_miss',
      title: draft.hazard_type.value || 'Near-Miss Hazard Report',
      subtitle: `${draft.location.value} · ${draft.equipment.value}`,
      timestamp: 'Just now',
      status: 'awaiting_review',
      location: draft.location.value,
      equipment: draft.equipment.value,
      payload: { ...draft, idempotency_key: idempotencyKey }
    };

    setLogs(prev => [newLog, ...prev]);

    // Check pattern matching (cautious language)
    const mentionsForklift = draft.equipment.value.toLowerCase().includes('forklift');
    if (mentionsForklift) {
      setPatternResult({
        status: 'found',
        count: 3,
        message: 'Possible recurring pattern: 3 related reports found in the last 30 days.',
        similarReports: [
          {
            id: 'NMR-2026-0791',
            similarity: 0.88,
            summary: 'Forklift operator obstructed view at Bay 7 South corner aisle',
            date: '12 days ago'
          },
          {
            id: 'NMR-2026-0640',
            similarity: 0.82,
            summary: 'Pedestrian near-miss with Forklift #4 at Bay 7 dock entrance',
            date: '21 days ago'
          }
        ]
      });
    } else {
      setPatternResult({
        status: 'none',
        message: 'No related recurring reports found in the last 30 days.'
      });
    }

    setWorkflowMode('saved_report');
    events.setSemanticVariant('success');
  }, [draft, events]);

  // Intercept text/voice input from worker
  const handleWorkerInput = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const lower = trimmed.toLowerCase();

    // Global voice commands
    if (lower === 'stop' || lower === 'pause' || lower === 'hold') {
      events.interruptAgent();
      return;
    }

    // Context-dependent handling based on workflow mode
    switch (workflowMode) {
      case 'home':
        if (lower.includes('check') || lower.includes('procedure') || lower.includes('walk me')) {
          startProcedureFlow('proc_coolant_flush');
        } else if (lower.includes('hazard') || lower.includes('near miss') || lower.includes('report')) {
          startReportingFlow();
        } else if (lower.includes('resume')) {
          setWorkflowMode('draft_review');
        } else {
          events.sendTextTurn(trimmed);
        }
        break;

      case 'safety_gate':
        if (lower.includes('yes') || lower.includes('safe') || lower.includes('clear')) {
          setHasSafeGatePassed(true);
          setWorkflowMode('narrative_capture');
        } else if (lower.includes('no') || lower.includes('help') || lower.includes('not safe')) {
          setHasSafeGatePassed(false);
        }
        break;

      case 'narrative_capture':
        updateDraftField('narrative', trimmed, 'said');
        // Analyze narrative keywords
        if (lower.includes('bay 7')) updateDraftField('location', 'Bay 7 South Crossing', 'said');
        if (lower.includes('dock 3')) updateDraftField('location', 'Dock 3 Loading Bay', 'said');
        if (lower.includes('forklift')) updateDraftField('equipment', 'Forklift #4', 'inferred');
        if (lower.includes('pump')) updateDraftField('equipment', 'Coolant Pump B', 'inferred');
        if (lower.includes('no injury') || lower.includes('nobody hurt')) updateDraftField('injury', 'No injuries reported', 'said');
        
        setWorkflowMode('follow_up');
        setActiveQuestionKey('injury');
        break;

      case 'follow_up':
        if (activeQuestionKey === 'injury') {
          updateDraftField('injury', trimmed, 'said');
          setActiveQuestionKey('location');
        } else if (activeQuestionKey === 'location') {
          updateDraftField('location', trimmed, 'said');
          setActiveQuestionKey('equipment');
        } else if (activeQuestionKey === 'equipment') {
          updateDraftField('equipment', trimmed, 'said');
          setActiveQuestionKey('immediate_action');
        } else if (activeQuestionKey === 'immediate_action') {
          updateDraftField('immediate_action', trimmed, 'said');
          setWorkflowMode('read_back');
        }
        break;

      case 'read_back':
        if (lower.includes('confirm') || lower.includes('yes') || lower.includes('continue') || lower.includes('correct')) {
          setWorkflowMode('draft_review');
        } else if (lower.includes('no') || lower.includes('not') || lower.includes('valve') || lower.includes('dock') || lower.includes('bay')) {
          // Worker correction
          if (lower.includes('dock 4')) updateDraftField('location', 'Dock 4 Loading Bay', 'said');
          else if (lower.includes('valve 4')) updateDraftField('equipment', 'Secondary Valve 4', 'said');
          else updateDraftField('location', trimmed, 'said');
        }
        break;

      case 'draft_review':
        if (lower.includes('confirm') || lower.includes('submit') || lower.includes('continue')) {
          setWorkflowMode('confirm_report');
        } else {
          events.sendTextTurn(trimmed);
        }
        break;

      case 'confirm_report':
        if (lower.includes('confirm') || lower.includes('submit') || lower.includes('yes')) {
          submitReport();
        } else if (lower.includes('edit') || lower.includes('change') || lower.includes('correct')) {
          setWorkflowMode('draft_review');
        }
        break;

      case 'procedure': {
        // Check for numeric reading reports (e.g. "15 PSI" or "gauge reads 15")
        const numbers = trimmed.match(/[-+]?\d*\.?\d+/g);
        if (numbers && (lower.includes('psi') || lower.includes('reading') || lower.includes('gauge') || lower.includes('temp') || lower.includes('volt'))) {
          const val = parseFloat(numbers[0]);
          const currentStep = activeProcedure.steps[procedureStepIndex];
          const param = currentStep?.readingParam || 'gauge pressure';
          checkReadingThreshold(param, val);
          return;
        }

        // Consequential advancement command
        if (lower.includes('confirm') || lower.includes('done') || lower.includes('next') || lower.includes('verified')) {
          confirmAndAdvanceStep();
        } else if (lower.includes('repeat') || lower.includes('again')) {
          repeatCurrentStep();
        } else {
          // Contextual question (e.g. "Is 15 PSI safe?")
          events.sendTextTurn(trimmed);
        }
        break;
      }

      case 'safety_alert':
        if (lower.includes('acknowledge') || lower.includes('clear') || lower.includes('got it')) {
          acknowledgeSafetyAlert();
        }
        break;

      default:
        events.sendTextTurn(trimmed);
        break;
    }
  }, [
    workflowMode,
    activeQuestionKey,
    activeProcedure,
    procedureStepIndex,
    events,
    startProcedureFlow,
    startReportingFlow,
    updateDraftField,
    checkReadingThreshold,
    confirmAndAdvanceStep,
    repeatCurrentStep,
    submitReport,
    acknowledgeSafetyAlert
  ]);

  return {
    session,
    events,
    workflowMode,
    setWorkflowMode,
    draft,
    setDraft,
    updateDraftField,
    hasSafeGatePassed,
    setHasSafeGatePassed,
    activeQuestionKey,
    setActiveQuestionKey,
    activeProcedure,
    setActiveProcedure,
    procedureStepIndex,
    setProcedureStepIndex,
    isProcedurePaused,
    setIsProcedurePaused,
    confirmedSteps,
    confirmAndAdvanceStep,
    repeatCurrentStep,
    safetyAlert,
    checkReadingThreshold,
    acknowledgeSafetyAlert,
    patternResult,
    tasks,
    logs,
    submitReport,
    startReportingFlow,
    startProcedureFlow,
    handleWorkerInput
  };
}
