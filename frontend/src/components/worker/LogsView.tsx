import React, { useState } from 'react';
import { LogItem } from '../../types/workerWorkflows';
import { ClipboardList, ShieldAlert, Wrench, FileText, ChevronRight, ArrowRight } from 'lucide-react';

interface LogsViewProps {
  logs: LogItem[];
  activeDraftTitle?: string;
  onResumeDraft: () => void;
}

export const LogsView: React.FC<LogsViewProps> = ({
  logs,
  activeDraftTitle,
  onResumeDraft
}) => {
  const [filter, setFilter] = useState<'all' | 'near_miss' | 'maintenance'>('all');
  const [selectedLog, setSelectedLog] = useState<LogItem | null>(null);

  const filteredLogs = logs.filter(item => {
    if (filter === 'all') return true;
    return item.type === filter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span
            style={{
              backgroundColor: 'var(--success-green-bg)',
              color: 'var(--success-green)',
              fontSize: '11px',
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: 'var(--radius-pill)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase'
            }}
          >
            APPROVED
          </span>
        );
      case 'rejected':
        return (
          <span
            style={{
              backgroundColor: 'var(--danger-red-bg)',
              color: 'var(--danger-red-text)',
              fontSize: '11px',
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: 'var(--radius-pill)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase'
            }}
          >
            FLAGGED
          </span>
        );
      case 'awaiting_review':
      default:
        return (
          <span
            style={{
              backgroundColor: 'var(--warning-amber-bg)',
              color: 'var(--warning-amber-text)',
              fontSize: '11px',
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: 'var(--radius-pill)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase'
            }}
          >
            AWAITING REVIEW
          </span>
        );
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div>
        <span
          style={{
            fontSize: '13px',
            fontWeight: 800,
            letterSpacing: '0.08em',
            color: 'var(--aura-teal)',
            textTransform: 'uppercase'
          }}
        >
          FIELD RECORDS & AUDIT
        </span>
        <h2
          style={{
            fontSize: '26px',
            fontWeight: 800,
            color: 'var(--ink-950)',
            lineHeight: 1.25,
            marginTop: '2px'
          }}
        >
          Incident & Action Logs
        </h2>
      </div>

      {/* Active Draft Banner if present */}
      {activeDraftTitle && (
        <div
          style={{
            backgroundColor: 'var(--bg-secondary-surface)',
            border: '1px solid var(--outline-variant)',
            borderRadius: 'var(--radius-card)',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-card)'
          }}
        >
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--ink-700)', textTransform: 'uppercase' }}>
              UNSUBMITTED LOCAL DRAFT
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ink-950)', marginTop: '2px' }}>
              {activeDraftTitle}
            </div>
          </div>
          <button
            onClick={onResumeDraft}
            style={{
              backgroundColor: 'var(--ink-950)',
              color: '#FFFFFF',
              padding: '8px 16px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            RESUME <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {[
          { id: 'all', label: 'ALL LOGS' },
          { id: 'near_miss', label: 'NEAR-MISS' },
          { id: 'maintenance', label: 'MAINTENANCE' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id as any)}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-pill)',
              fontSize: '13px',
              fontWeight: 800,
              letterSpacing: '0.04em',
              backgroundColor: filter === t.id ? 'var(--aura-teal)' : 'var(--bg-surface)',
              color: filter === t.id ? '#FFFFFF' : 'var(--ink-700)',
              border: filter === t.id ? 'none' : '1px solid var(--border-subtle)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Logs List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredLogs.map((item) => (
          <div
            key={item.id}
            onClick={() => setSelectedLog(item)}
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-card)',
              border: '1px solid var(--border-subtle)',
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-card)',
              transition: 'transform 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  backgroundColor: item.type === 'near_miss' ? 'var(--bg-secondary-surface)' : 'var(--surface-container)',
                  color: 'var(--aura-teal-dark)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {item.type === 'near_miss' ? <ShieldAlert size={22} /> : <Wrench size={22} />}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ink-500)' }}>
                    {item.id}
                  </span>
                  {getStatusBadge(item.status)}
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--ink-950)', marginTop: '2px' }}>
                  {item.title}
                </h3>
                <div style={{ fontSize: '13px', color: 'var(--ink-500)', marginTop: '2px' }}>
                  {item.subtitle} · {item.timestamp}
                </div>
              </div>
            </div>

            <ChevronRight size={20} color="var(--ink-500)" />
          </div>
        ))}
      </div>

      {/* Detailed Inspection Modal if an item is selected */}
      {selectedLog && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(17, 28, 36, 0.65)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setSelectedLog(null)}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '20px',
              padding: '24px',
              maxWidth: '480px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              boxShadow: '0 8px 32px rgba(17, 28, 36, 0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--aura-teal)', textTransform: 'uppercase' }}>
                RECORD AUDIT · {selectedLog.id}
              </span>
              {getStatusBadge(selectedLog.status)}
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ink-950)' }}>
              {selectedLog.title}
            </h3>

            <div style={{ backgroundColor: 'var(--bg-app)', padding: '12px 14px', borderRadius: '10px', fontSize: '14px', lineHeight: 1.4 }}>
              <strong>Location:</strong> {selectedLog.location}<br />
              <strong>Equipment:</strong> {selectedLog.equipment}<br />
              <strong>Timestamp:</strong> {selectedLog.timestamp}
            </div>

            {selectedLog.payload?.narrative && (
              <div style={{ fontSize: '14px', color: 'var(--ink-900)', fontStyle: 'italic', lineHeight: 1.45 }}>
                “{selectedLog.payload.narrative.value}”
              </div>
            )}

            <button
              onClick={() => setSelectedLog(null)}
              style={{
                height: '48px',
                backgroundColor: 'var(--ink-950)',
                color: '#FFFFFF',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '15px',
                marginTop: '8px',
                cursor: 'pointer'
              }}
            >
              Close Record
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
