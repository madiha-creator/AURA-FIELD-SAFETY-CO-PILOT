import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, History, ShieldCheck, AlertTriangle, User, Clock, Terminal, CheckCircle2, XCircle } from 'lucide-react';

interface AuditEvent {
  id: number;
  timestamp: string;
  user_id: string;
  session_id: string;
  action: string;
  metadata: string;
  provenance: string;
  confirmation_status: string;
  interrupted: boolean;
}

export default function AuditView() {
  const { session_id } = useParams<{ session_id: string }>();
  const navigate = useNavigate();
  const [timeline, setTimeline] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/audit/${session_id}`)
      .then(res => res.json())
      .then(data => setTimeline(data.timeline || []))
      .catch(() => setTimeline([]))
      .finally(() => setLoading(false));
  }, [session_id]);

  return (
    <div>
      {/* Header and Back navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button
          onClick={() => navigate(-1)}
          title="Return to previous screen"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            height: '40px',
            padding: '0 14px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--ink-950)',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: 'var(--shadow-card)'
          }}
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2
              style={{
                fontSize: '24px',
                fontWeight: 800,
                color: 'var(--ink-950)',
                lineHeight: 1.2
              }}
            >
              Session Audit Timeline
            </h2>
            <span
              style={{
                backgroundColor: 'var(--surface-container)',
                color: 'var(--aura-teal)',
                border: '1px solid var(--border-subtle)',
                padding: '2px 10px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '12px',
                fontWeight: 700,
                fontFamily: 'monospace'
              }}
            >
              {session_id}
            </span>
          </div>
          <p style={{ color: 'var(--ink-700)', fontSize: '14px', marginTop: '2px' }}>
            Immutable chronological trace of voice interactions, tool executions, and gate confirmations.
          </p>
        </div>
      </div>

      {loading ? (
        <div
          style={{
            padding: '48px',
            textAlign: 'center',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-card)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--ink-700)',
            fontSize: '14px',
            fontWeight: 600
          }}
        >
          Retrieving audit timeline from tamper-evident log database...
        </div>
      ) : timeline.length === 0 ? (
        <div
          style={{
            padding: '56px 24px',
            textAlign: 'center',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-card)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-card)'
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'var(--surface-container)',
              color: 'var(--ink-500)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}
          >
            <History size={24} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink-950)', marginBottom: '6px' }}>
            No Audit Records Found
          </h3>
          <p style={{ color: 'var(--ink-700)', fontSize: '14px', maxWidth: '420px', margin: '0 auto' }}>
            No logged events or safety gate operations have been recorded for session {session_id}.
          </p>
        </div>
      ) : (
        /* Timeline Container */
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-card)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-card)',
            padding: '32px 36px'
          }}
        >
          <div style={{ position: 'relative', paddingLeft: '28px' }}>
            {/* Timeline vertical rule line */}
            <div
              style={{
                position: 'absolute',
                top: '12px',
                bottom: '12px',
                left: '7px',
                width: '2px',
                backgroundColor: 'var(--border-subtle)'
              }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {timeline.map((event) => {
                const meta = typeof event.metadata === 'string' ? JSON.parse(event.metadata || '{}') : event.metadata || {};
                const isConfirmed = event.confirmation_status === 'confirmed';
                const isFailedGate = event.confirmation_status && !isConfirmed;

                let pinBg = 'var(--aura-teal)';
                if (isConfirmed) pinBg = 'var(--success-green)';
                if (isFailedGate) pinBg = 'var(--danger-red)';

                return (
                  <div key={event.id} style={{ position: 'relative' }}>
                    {/* Pin Circle */}
                    <div
                      style={{
                        position: 'absolute',
                        left: '-28px',
                        top: '16px',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        backgroundColor: pinBg,
                        border: '3px solid var(--bg-surface)',
                        boxShadow: '0 0 0 1px var(--border-subtle)'
                      }}
                    />

                    {/* Event Card */}
                    <div
                      style={{
                        backgroundColor: 'var(--bg-app)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        padding: '18px 20px',
                        boxShadow: 'var(--shadow-card)'
                      }}
                    >
                      {/* Event Header */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '10px',
                          flexWrap: 'wrap',
                          gap: '8px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span
                            style={{
                              fontSize: '15px',
                              fontWeight: 800,
                              color: 'var(--ink-950)'
                            }}
                          >
                            {event.action}
                          </span>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '12px',
                              fontWeight: 600,
                              color: 'var(--ink-700)',
                              backgroundColor: 'var(--bg-surface)',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border-subtle)'
                            }}
                          >
                            <User size={12} style={{ color: 'var(--aura-teal)' }} />
                            <span>{event.user_id}</span>
                          </span>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: 'var(--ink-500)',
                            fontSize: '12px',
                            fontWeight: 600,
                            fontVariantNumeric: 'tabular-nums'
                          }}
                        >
                          <Clock size={12} />
                          <span>{new Date(event.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}</span>
                        </div>
                      </div>

                      {/* Gate Status & Interruption Pills */}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
                        {event.confirmation_status && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-pill)',
                              fontSize: '11px',
                              fontWeight: 700,
                              letterSpacing: '0.06em',
                              textTransform: 'uppercase',
                              backgroundColor: isConfirmed ? 'var(--success-green-bg)' : 'var(--danger-red-bg)',
                              color: isConfirmed ? 'var(--success-green-text)' : 'var(--danger-red-text)',
                              border: `1px solid ${isConfirmed ? 'var(--success-green-border)' : 'var(--danger-red-border)'}`
                            }}
                          >
                            {isConfirmed ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                            <span>GATE: {event.confirmation_status}</span>
                          </span>
                        )}

                        {event.interrupted && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-pill)',
                              fontSize: '11px',
                              fontWeight: 700,
                              letterSpacing: '0.06em',
                              textTransform: 'uppercase',
                              backgroundColor: 'var(--warning-amber-bg)',
                              color: 'var(--warning-amber-text)',
                              border: '1px solid var(--warning-amber-border)'
                            }}
                          >
                            <AlertTriangle size={12} />
                            <span>INTERRUPTED MID-TURN</span>
                          </span>
                        )}
                      </div>

                      {/* Formatted JSON Metadata Box */}
                      {meta && Object.keys(meta).length > 0 && (
                        <div>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '11px',
                              fontWeight: 700,
                              letterSpacing: '0.08em',
                              textTransform: 'uppercase',
                              color: 'var(--ink-500)',
                              marginBottom: '6px'
                            }}
                          >
                            <Terminal size={12} />
                            <span>EVENT TELEMETRY METADATA</span>
                          </div>
                          <pre
                            style={{
                              backgroundColor: 'var(--surface-container)',
                              border: '1px solid var(--border-subtle)',
                              padding: '12px 14px',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '12px',
                              fontFamily: 'monospace',
                              color: 'var(--ink-900)',
                              overflowX: 'auto',
                              margin: 0
                            }}
                          >
                            {JSON.stringify(meta, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
