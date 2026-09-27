import React, { useEffect, useState } from 'react';
import { Wrench, Clock, MapPin, User, AlertCircle, CheckCircle2 } from 'lucide-react';

interface MaintenanceItem {
  id: string;
  equipment: string;
  location: string;
  issue_description: string;
  severity: string;
  created_at: string;
  worker_id: string;
}

export default function Maintenance() {
  const [entries, setEntries] = useState<MaintenanceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/maintenance', {
      headers: {
        'Authorization': 'Bearer dev-token-bypass'
      }
    })
      .then(res => res.json())
      .then(data => setEntries(data.maintenance_entries || []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, []);

  const getSeverityBadge = (severity: string) => {
    const s = severity.toLowerCase();
    let bg = 'var(--surface-container)';
    let text = 'var(--ink-700)';
    let border = 'var(--border-subtle)';

    if (s.includes('crit') || s.includes('high')) {
      bg = 'var(--danger-red-bg)';
      text = 'var(--danger-red-text)';
      border = 'var(--danger-red-border)';
    } else if (s.includes('med')) {
      bg = 'var(--warning-amber-bg)';
      text = 'var(--warning-amber-text)';
      border = 'var(--warning-amber-border)';
    } else if (s.includes('low')) {
      bg = 'var(--success-green-bg)';
      text = 'var(--success-green-text)';
      border = 'var(--success-green-border)';
    }

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '2px 8px',
          borderRadius: 'var(--radius-pill)',
          backgroundColor: bg,
          color: text,
          border: `1px solid ${border}`,
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase'
        }}
      >
        {severity}
      </span>
    );
  };

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
              color: 'var(--aura-teal)',
              textTransform: 'uppercase'
            }}
          >
            FIELD TELEMETRY LOGS
          </span>
          <span
            style={{
              backgroundColor: 'var(--surface-container)',
              color: 'var(--ink-700)',
              border: '1px solid var(--border-subtle)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-pill)',
              fontSize: '11px',
              fontWeight: 700
            }}
          >
            {entries.length} ENTRIES
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
          Maintenance Logs (Read-Only)
        </h2>
        <p style={{ color: 'var(--ink-700)', fontSize: '14px', marginTop: '4px' }}>
          Hands-free equipment work orders and field observations recorded via log_maintenance_entry.
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
          Loading maintenance records from field log database...
        </div>
      ) : entries.length === 0 ? (
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
            <CheckCircle2 size={24} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink-950)', marginBottom: '6px' }}>
            No Maintenance Entries Recorded
          </h3>
          <p style={{ color: 'var(--ink-700)', fontSize: '14px', maxWidth: '420px', margin: '0 auto' }}>
            No work logs or equipment faults have been filed by frontline field technicians during current operational shift.
          </p>
        </div>
      ) : (
        /* Instrument-grade Data Table Container (DESIGN.md Section 5) */
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-card)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-card)',
            overflow: 'hidden'
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr
                  style={{
                    backgroundColor: 'var(--bg-app)',
                    borderBottom: '1px solid var(--border-subtle)'
                  }}
                >
                  <th style={{ padding: '14px 20px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-500)' }}>
                    Timestamp
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-500)' }}>
                    Equipment Asset
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-500)' }}>
                    Location
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-500)' }}>
                    Issue Observation
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-500)' }}>
                    Severity
                  </th>
                  <th style={{ padding: '14px 20px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-500)' }}>
                    Technician
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.map((item) => (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background-color 0.1s'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-container-low)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td
                      style={{
                        padding: '16px 20px',
                        fontSize: '13px',
                        color: 'var(--ink-500)',
                        fontVariantNumeric: 'tabular-nums',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {new Date(item.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '14px', fontWeight: 700, color: 'var(--ink-950)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Wrench size={14} style={{ color: 'var(--aura-teal)' }} />
                        <span>{item.equipment}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--ink-700)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={13} style={{ color: 'var(--ink-500)' }} />
                        <span>{item.location}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '14px', color: 'var(--ink-950)', maxWidth: '380px' }}>
                      {item.issue_description}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      {getSeverityBadge(item.severity)}
                    </td>
                    <td
                      style={{
                        padding: '16px 20px',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: 'var(--ink-700)',
                        fontFamily: 'monospace'
                      }}
                    >
                      {item.worker_id}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
