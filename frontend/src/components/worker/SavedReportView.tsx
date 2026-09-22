import React from 'react';
import { CheckCircle2, ShieldCheck, GitBranch, ArrowRight, ClipboardList } from 'lucide-react';
import { PatternCheckResult } from '../../types/workerWorkflows';

interface SavedReportViewProps {
  reportId?: string;
  patternResult?: PatternCheckResult | null;
  onReturnHome: () => void;
  onViewInLogs: () => void;
}

export const SavedReportView: React.FC<SavedReportViewProps> = ({
  reportId = 'NMR-2026-4891',
  patternResult,
  onReturnHome,
  onViewInLogs
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      {/* Success Banner */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--border-subtle)',
          padding: '24px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '14px',
          boxShadow: 'var(--shadow-card)'
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--success-green-bg)',
            color: 'var(--success-green)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <CheckCircle2 size={38} strokeWidth={2.6} />
        </div>

        <div>
          <span
            style={{
              fontSize: '13px',
              fontWeight: 800,
              letterSpacing: '0.08em',
              color: 'var(--success-green)',
              textTransform: 'uppercase'
            }}
          >
            REPORT OFFICIALLY LOGGED
          </span>
          <h2
            style={{
              fontSize: '26px',
              fontWeight: 800,
              color: 'var(--ink-950)',
              lineHeight: 1.25,
              marginTop: '4px'
            }}
          >
            Submission Confirmed
          </h2>
        </div>

        {/* Report ID Tag */}
        <div
          style={{
            backgroundColor: 'var(--bg-app)',
            border: '1px solid var(--border-subtle)',
            padding: '8px 16px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '17px',
            fontWeight: 800,
            color: 'var(--ink-950)',
            letterSpacing: '0.04em'
          }}
        >
          REPORT ID: {reportId}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ink-700)', fontSize: '14px', fontWeight: 600 }}>
          <ShieldCheck size={18} color="var(--aura-teal)" />
          <span>Synchronized with Supervisor Safety Cockpit for review.</span>
        </div>
      </div>

      {/* Pattern Analysis Card (Cautious Language Rule) */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--border-subtle)',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          boxShadow: 'var(--shadow-card)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <GitBranch size={18} color="var(--aura-teal)" />
          <span
            style={{
              fontSize: '12px',
              fontWeight: 800,
              letterSpacing: '0.08em',
              color: 'var(--ink-500)',
              textTransform: 'uppercase'
            }}
          >
            HISTORICAL PATTERN SIGNAL
          </span>
        </div>

        <div
          style={{
            fontSize: '16px',
            fontWeight: 700,
            color: patternResult?.status === 'found' ? 'var(--warning-amber-text)' : 'var(--ink-950)',
            lineHeight: 1.4
          }}
        >
          {patternResult?.message || 'No related recurring reports found in the last 30 days.'}
        </div>

        <div style={{ fontSize: '13px', color: 'var(--ink-500)', lineHeight: 1.4 }}>
          Historical similarity indicates potential recurring patterns for supervisor triage, not certified root cause or certainty.
        </div>

        {patternResult?.similarReports && patternResult.similarReports.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
            {patternResult.similarReports.map((sim) => (
              <div
                key={sim.id}
                style={{
                  backgroundColor: 'var(--bg-app)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-950)' }}>
                    {sim.summary}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--ink-500)' }}>
                    {sim.id} · {sim.date}
                  </div>
                </div>
                <span
                  style={{
                    backgroundColor: 'var(--bg-secondary-surface)',
                    color: 'var(--aura-teal-dark)',
                    fontSize: '12px',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '9999px'
                  }}
                >
                  {Math.round(sim.similarity * 100)}% Match
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Primary Return Navigation */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button
          onClick={onReturnHome}
          style={{
            height: 'var(--btn-primary-height)',
            minHeight: 'var(--touch-target-preferred)',
            backgroundColor: 'var(--aura-teal)',
            color: '#FFFFFF',
            borderRadius: 'var(--radius-btn)',
            fontSize: '18px',
            fontWeight: 800,
            letterSpacing: '0.04em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(14, 119, 116, 0.25)'
          }}
        >
          <span>RETURN TO WORKER STANDBY</span>
          <ArrowRight size={20} />
        </button>

        <button
          onClick={onViewInLogs}
          style={{
            height: 'var(--btn-secondary-height)',
            minHeight: 'var(--touch-target-min)',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-btn)',
            fontSize: '16px',
            fontWeight: 700,
            color: 'var(--ink-700)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer'
          }}
        >
          <ClipboardList size={18} />
          <span>VIEW IN LOGS TAB</span>
        </button>
      </div>
    </div>
  );
};
