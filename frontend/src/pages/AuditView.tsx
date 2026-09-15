import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ backgroundColor: '#334155', color: '#fff', padding: '6px 14px', borderRadius: '4px' }}
        >
          ← Back
        </button>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Session Audit Timeline</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Session ID: {session_id}</p>
        </div>
      </div>

      {loading ? (
        <div style={{ color: '#94a3b8' }}>Loading timeline...</div>
      ) : timeline.length === 0 ? (
        <div style={{ padding: '32px', backgroundColor: '#1e293b', borderRadius: '8px', color: '#94a3b8' }}>
          No audit history recorded for this session.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', paddingLeft: '20px' }}>
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: '8px', width: '2px', backgroundColor: '#334155' }} />
          {timeline.map((event) => {
            const meta = typeof event.metadata === 'string' ? JSON.parse(event.metadata || '{}') : event.metadata || {};
            const prov = typeof event.provenance === 'string' ? JSON.parse(event.provenance || '{}') : event.provenance || {};

            return (
              <div
                key={event.id}
                style={{
                  backgroundColor: '#1e293b',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #334155',
                  position: 'relative'
                }}
              >
                <div style={{ position: 'absolute', left: '-18px', top: '20px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#38bdf8' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700, color: '#38bdf8' }}>{event.action}</span>
                  <span style={{ color: '#64748b', fontSize: '0.75rem' }}>{new Date(event.timestamp).toLocaleTimeString()}</span>
                </div>
                <div style={{ fontSize: '0.875rem', color: '#cbd5e1' }}>
                  <p><strong>User:</strong> {event.user_id}</p>
                  {event.confirmation_status && (
                    <p style={{ color: event.confirmation_status === 'confirmed' ? '#4ade80' : '#f87171' }}>
                      <strong>Gate Status:</strong> {event.confirmation_status}
                    </p>
                  )}
                  {event.interrupted && (
                    <p style={{ color: '#f59e0b', fontWeight: 600 }}>⚠️ Interrupted mid-turn</p>
                  )}
                  <pre style={{ backgroundColor: '#0f172a', padding: '8px', borderRadius: '4px', fontSize: '0.75rem', marginTop: '8px', overflowX: 'auto', color: '#94a3b8' }}>
                    {JSON.stringify(meta, null, 2)}
                  </pre>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
