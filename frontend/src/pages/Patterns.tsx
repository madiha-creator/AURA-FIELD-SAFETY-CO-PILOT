import React, { useEffect, useState } from 'react';

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

  useEffect(() => {
    fetch('/api/patterns')
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
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '8px' }}>Recurring Hazard Patterns</h2>
      <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '24px' }}>
        Identified pattern signals grouped by equipment and site location.
      </p>

      {loading ? (
        <div style={{ color: '#94a3b8' }}>Loading patterns...</div>
      ) : patterns.length === 0 ? (
        <div style={{ padding: '32px', backgroundColor: '#1e293b', borderRadius: '8px', color: '#94a3b8' }}>
          No recurring hazard patterns flagged.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {patterns.map((p, idx) => (
            <div key={idx} style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '1.1rem', color: '#38bdf8' }}>{p.equipment}</h3>
                <span className="badge-pattern">{p.count} Incidents</span>
              </div>
              <p style={{ color: '#cbd5e1', fontSize: '0.875rem' }}><strong>Location:</strong> {p.location}</p>
              <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '4px' }}>
                Last seen: {new Date(p.last_seen).toLocaleDateString()}
              </p>
              <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#f59e0b' }}>CA Draft: {p.draft_ca_status}</span>
                <button style={{ backgroundColor: '#0284c7', color: '#fff', fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px' }}>
                  Review CA
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
