import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Wrench, MapPin, Clock, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';

interface PatternItem {
  equipment: string;
  location: string;
  count: number;
  last_seen: string;
  draft_ca_status: string;
}

export default function Patterns() {
  const [patterns, setPatterns] = useState<PatternItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/patterns', {
      headers: {
        'Authorization': 'Bearer dev-token-bypass'
      }
    })
      .then(res => res.json())
      .then(data => setPatterns(data.patterns || []))
      .catch(() => setPatterns([
        {
          equipment: 'Forklift 12',
          location: 'Main Warehouse',
          count: 3,
          last_seen: new Date().toISOString(),
          draft_ca_status: 'pending_supervisor'
        }
      ]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.08em',
              color: 'var(--warning-amber-text)',
              textTransform: 'uppercase'
            }}
          >
            INTELLIGENCE TELEMETRY
          </span>
          <span
            style={{
              backgroundColor: 'var(--warning-amber-bg)',
              color: 'var(--warning-amber-text)',
              border: '1px solid var(--warning-amber-border)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-pill)',
              fontSize: '11px',
              fontWeight: 700
            }}
          >
            {patterns.length} ACTIVE PATTERNS
          </span>
        </div>
        <h2
          style={{
            fontSize: '26px',
            fontWeight: 800,
            color: 'var(--ink-950)',
            letterSpacing: '-0.01em',
            lineHeight: 1.2
          }}
        >
          Recurring Hazard Patterns
        </h2>
        <p style={{ color: 'var(--ink-700)', fontSize: '14px', marginTop: '4px' }}>
          Autonomous pattern recognition correlating multi-shift incident spikes and recurring field deviations.
        </p>
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
          Analyzing recurrence telemetry from historical database...
        </div>
      ) : patterns.length === 0 ? (
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
              backgroundColor: 'var(--success-green-bg)',
              color: 'var(--success-green-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}
          >
            <ShieldAlert size={24} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink-950)', marginBottom: '6px' }}>
            Zero Recurring Hazard Signals
          </h3>
          <p style={{ color: 'var(--ink-700)', fontSize: '14px', maxWidth: '420px', margin: '0 auto' }}>
            All field equipment assets are operating within nominal recurrence thresholds.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '20px'
          }}
        >
          {patterns.map((p, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderTop: '4px solid var(--warning-amber)',
                borderRadius: 'var(--radius-card)',
                padding: '22px',
                boxShadow: 'var(--shadow-card)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'box-shadow 0.15s, border-color 0.15s'
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '10px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Wrench size={18} style={{ color: 'var(--aura-teal)' }} />
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ink-950)' }}>
                      {p.equipment}
                    </h3>
                  </div>

                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      backgroundColor: 'var(--warning-amber-bg)',
                      color: 'var(--warning-amber-text)',
                      border: '1px solid var(--warning-amber-border)',
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-pill)',
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase'
                    }}
                  >
                    <AlertTriangle size={12} />
                    {p.count} Incidents
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--ink-700)', fontSize: '14px', marginBottom: '8px' }}>
                  <MapPin size={14} style={{ color: 'var(--ink-500)' }} />
                  <span>{p.location}</span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: 'var(--ink-500)',
                    fontSize: '12px',
                    fontWeight: 600,
                    fontVariantNumeric: 'tabular-nums',
                    marginBottom: '16px'
                  }}
                >
                  <Clock size={12} />
                  <span>Last incident recorded: {new Date(p.last_seen).toLocaleDateString([], { dateStyle: 'medium' })}</span>
                </div>
              </div>

              <div
                style={{
                  paddingTop: '14px',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} style={{ color: 'var(--aura-teal)' }} />
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--ink-700)'
                    }}
                  >
                    CA: <strong style={{ color: 'var(--ink-950)' }}>{p.draft_ca_status.replace(/_/g, ' ')}</strong>
                  </span>
                </div>

                <button
                  onClick={() => navigate(`/inbox?site=${encodeURIComponent(p.location)}`)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    backgroundColor: 'var(--surface-container)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--aura-teal)',
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s'
                  }}
                >
                  <span>Filter Inbox</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
