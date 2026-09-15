import React, { useEffect, useState } from 'react';

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
    fetch('/api/maintenance')
      .then(res => res.json())
      .then(data => setEntries(data.maintenance_entries || []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '8px' }}>Maintenance Logs (Read-Only)</h2>
      <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '24px' }}>
        Recent log_maintenance_entry records filed hands-free during field ops.
      </p>

      {loading ? (
        <div style={{ color: '#94a3b8' }}>Loading maintenance logs...</div>
      ) : entries.length === 0 ? (
        <div style={{ padding: '32px', backgroundColor: '#1e293b', borderRadius: '8px', color: '#94a3b8' }}>
          No maintenance entries recorded.
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#1e293b', borderRadius: '8px', overflow: 'hidden' }}>
          <thead>
            <tr style={{ backgroundColor: '#0f172a', textAlign: 'left', color: '#94a3b8', fontSize: '0.85rem' }}>
              <th style={{ padding: '12px 16px' }}>Time</th>
              <th style={{ padding: '12px 16px' }}>Equipment</th>
              <th style={{ padding: '12px 16px' }}>Location</th>
              <th style={{ padding: '12px 16px' }}>Issue Description</th>
              <th style={{ padding: '12px 16px' }}>Severity</th>
              <th style={{ padding: '12px 16px' }}>Technician</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #334155', fontSize: '0.9rem' }}>
                <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{new Date(item.created_at).toLocaleString()}</td>
                <td style={{ padding: '12px 16px', fontWeight: 600 }}>{item.equipment}</td>
                <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>{item.location}</td>
                <td style={{ padding: '12px 16px', color: '#e2e8f0' }}>{item.issue_description}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', backgroundColor: '#334155', color: '#38bdf8' }}>
                    {item.severity}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{item.worker_id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
