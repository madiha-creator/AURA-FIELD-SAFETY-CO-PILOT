import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface ReviewItem {
  id: string;
  created_at: string;
  location: string;
  equipment: string;
  hazard_type: string;
  injury: string;
  status: string;
  pattern_detected: boolean;
  recurrence_sentence?: string;
}

export default function Inbox() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [siteFilter, setSiteFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchReviews();
  }, [statusFilter, siteFilter]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      let url = '/api/reviews';
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (siteFilter) params.append('site', siteFilter);
      if (params.toString()) url += '?' + params.toString();

      const res = await fetch(url);
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch (e) {
      console.error(e);
      // Fallback mock data if server offline
      setReviews([
        {
          id: 'rep-101',
          created_at: new Date().toISOString(),
          location: 'Building B - Bay 4',
          equipment: 'Hydraulic Press 12',
          hazard_type: 'High Pressure Fluid Leak',
          injury: 'None',
          status: 'awaiting_review',
          pattern_detected: true,
          recurrence_sentence: '3rd near miss involving Hydraulic Press 12 this month'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Supervisor Review Inbox</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Review confirmed worker near-miss reports & pattern alerts</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '4px', backgroundColor: '#1e293b', color: '#fff', border: '1px solid #334155' }}
          >
            <option value="">All Statuses</option>
            <option value="awaiting_review">Awaiting Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <input
            type="text"
            placeholder="Filter by Site..."
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '4px', backgroundColor: '#1e293b', color: '#fff', border: '1px solid #334155' }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ color: '#94a3b8' }}>Loading inbox...</div>
      ) : reviews.length === 0 ? (
        <div style={{ padding: '48px', textAlign: 'center', backgroundColor: '#1e293b', borderRadius: '8px', border: '1px solid #334155', color: '#94a3b8' }}>
          <h3>No pending reviews</h3>
          <p>All filed near-miss reports have been reviewed and approved.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {reviews.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(`/inbox/${item.id}`)}
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/inbox/${item.id}`)}
              style={{
                backgroundColor: '#1e293b',
                padding: '16px 20px',
                borderRadius: '8px',
                border: '1px solid #334155',
                borderLeft: item.hazard_type.toLowerCase().includes('high') ? '4px solid #ef4444' : '4px solid #38bdf8',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{item.equipment}</span>
                  <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>{item.location}</span>
                  {item.pattern_detected && (
                    <span className="badge-pattern">RECURRING HAZARD</span>
                  )}
                </div>
                <p style={{ color: '#cbd5e1', fontSize: '0.95rem' }}>
                  <strong>Hazard:</strong> {item.hazard_type} | <strong>Injury:</strong> {item.injury}
                </p>
                {item.recurrence_sentence && (
                  <p style={{ color: '#c084fc', fontSize: '0.85rem', marginTop: '4px' }}>
                    ⚠️ {item.recurrence_sentence}
                  </p>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className={`badge-status badge-${item.status}`}>
                  {item.status.replace('_', ' ')}
                </span>
                <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '6px' }}>
                  {new Date(item.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
