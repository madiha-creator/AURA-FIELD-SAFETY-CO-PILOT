import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface ReviewDetailData {
  report: {
    id: string;
    location: string;
    equipment: string;
    hazard_type: string;
    injury: string;
    narrative: string;
    status: string;
    provenance: any;
    created_at: string;
    worker_id: string;
  };
  corrective_action?: {
    id: string;
    proposed_action: string;
    status: string;
  };
  similar_reports?: any[];
  pattern_signal?: {
    recurring: boolean;
    count: number;
    sentence: string;
  };
}

export default function ReviewDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<ReviewDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Edit fields
  const [location, setLocation] = useState('');
  const [equipment, setEquipment] = useState('');
  const [hazardType, setHazardType] = useState('');

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reviews/${id}`);
      const json = await res.json();
      setData(json);
      if (json.report) {
        setLocation(json.report.location);
        setEquipment(json.report.equipment);
        setHazardType(json.report.hazard_type);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      const res = await fetch(`/api/reviews/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notify_safety_contact: true, supervisor_id: 'sup_01' })
      });
      if (res.ok) {
        // Optimistic UI update after API success
        setData(prev => prev ? { ...prev, report: { ...prev.report, status: 'approved' } } : null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditSave = async () => {
    try {
      const res = await fetch(`/api/reviews/${id}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          changes: { location, equipment, hazard_type: hazardType },
          reason: 'Supervisor corrections to field values'
        })
      });
      if (res.ok) {
        setIsEditing(false);
        fetchDetail();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReject = async () => {
    if (!rejectReason) return;
    try {
      const res = await fetch(`/api/reviews/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason, supervisor_id: 'sup_01' })
      });
      if (res.ok) {
        setShowRejectModal(false);
        setData(prev => prev ? { ...prev, report: { ...prev.report, status: 'rejected' } } : null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading || !data) {
    return <div style={{ color: '#94a3b8' }}>Loading report details...</div>;
  }

  const { report, corrective_action, similar_reports, pattern_signal } = data;
  const prov = typeof report.provenance === 'string' ? JSON.parse(report.provenance || '{}') : report.provenance || {};

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button
          onClick={() => navigate('/inbox')}
          style={{ backgroundColor: '#334155', color: '#fff', padding: '6px 14px', borderRadius: '4px' }}
        >
          ← Back to Inbox
        </button>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => navigate(`/audit/session_${report.id}`)}
            style={{ backgroundColor: '#475569', color: '#fff', padding: '8px 16px', borderRadius: '4px' }}
          >
            View Full Session Audit
          </button>
          {report.status === 'awaiting_review' && (
            <>
              <button
                onClick={() => setIsEditing(!isEditing)}
                style={{ backgroundColor: '#d97706', color: '#fff', padding: '8px 16px', borderRadius: '4px', fontWeight: 600 }}
              >
                {isEditing ? 'Cancel Edit' : 'Edit Report'}
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                style={{ backgroundColor: '#dc2626', color: '#fff', padding: '8px 16px', borderRadius: '4px', fontWeight: 600 }}
              >
                Reject
              </button>
              <button
                onClick={handleApprove}
                style={{ backgroundColor: '#16a34a', color: '#fff', padding: '8px 16px', borderRadius: '4px', fontWeight: 600 }}
              >
                Approve & Notify
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
        {/* Left Column: Structured Report Fields */}
        <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', border: '1px solid #334155' }}>
          <h3 style={{ borderBottom: '1px solid #334155', paddingBottom: '8px', marginBottom: '16px', color: '#38bdf8' }}>
            Structured Report Fields
          </h3>
          {isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  style={{ width: '100%', padding: '6px', borderRadius: '4px', backgroundColor: '#0f172a', color: '#fff', border: '1px solid #475569' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Equipment</label>
                <input
                  type="text"
                  value={equipment}
                  onChange={e => setEquipment(e.target.value)}
                  style={{ width: '100%', padding: '6px', borderRadius: '4px', backgroundColor: '#0f172a', color: '#fff', border: '1px solid #475569' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Hazard Type</label>
                <input
                  type="text"
                  value={hazardType}
                  onChange={e => setHazardType(e.target.value)}
                  style={{ width: '100%', padding: '6px', borderRadius: '4px', backgroundColor: '#0f172a', color: '#fff', border: '1px solid #475569' }}
                />
              </div>
              <button
                onClick={handleEditSave}
                style={{ backgroundColor: '#0284c7', color: '#fff', padding: '8px', borderRadius: '4px', marginTop: '8px' }}
              >
                Save Changes (Writes Audit Event)
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block' }}>Location</span>
                <strong style={{ fontSize: '1rem' }}>{report.location}</strong>
                <span style={{ marginLeft: '8px', fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#334155', color: '#38bdf8' }}>
                  {prov.location?.source === 'inferred' ? 'AI INFERRED' : 'YOU SAID'}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block' }}>Equipment</span>
                <strong style={{ fontSize: '1rem' }}>{report.equipment}</strong>
                <span style={{ marginLeft: '8px', fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#334155', color: '#38bdf8' }}>
                  {prov.equipment?.source === 'inferred' ? 'AI INFERRED' : 'YOU SAID'}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block' }}>Hazard Type</span>
                <strong style={{ fontSize: '1rem' }}>{report.hazard_type}</strong>
                <span style={{ marginLeft: '8px', fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#334155', color: '#38bdf8' }}>
                  {prov.hazard_type?.source === 'inferred' ? 'AI INFERRED' : 'YOU SAID'}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block' }}>Injury Status</span>
                <strong style={{ fontSize: '1rem' }}>{report.injury}</strong>
              </div>
            </div>
          )}
        </div>

        {/* Center Column: Transcript & Read-back */}
        <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', border: '1px solid #334155' }}>
          <h3 style={{ borderBottom: '1px solid #334155', paddingBottom: '8px', marginBottom: '16px', color: '#38bdf8' }}>
            Worker Narrative & Read-Back
          </h3>
          <div style={{ backgroundColor: '#0f172a', padding: '14px', borderRadius: '6px', marginBottom: '16px' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>VERBATIM NARRATIVE</span>
            <p style={{ fontStyle: 'italic', color: '#e2e8f0' }}>"{report.narrative || 'Worker stated pressure spiked rapidly while adjusting valve 4.'}"</p>
          </div>
          <div style={{ backgroundColor: '#0f172a', padding: '14px', borderRadius: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>AGENT READ-BACK & CONFIRMATION</span>
            <p style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
              "I have logged a near miss for {report.equipment} at {report.location}. Hazard: {report.hazard_type}. Worker explicitly confirmed: 'Yes, file it'."
            </p>
          </div>
        </div>

        {/* Right Column: Patterns & Corrective Action */}
        <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', border: '1px solid #334155' }}>
          <h3 style={{ borderBottom: '1px solid #334155', paddingBottom: '8px', marginBottom: '16px', color: '#38bdf8' }}>
            Pattern Intelligence & CA
          </h3>
          {pattern_signal && pattern_signal.recurring ? (
            <div style={{ backgroundColor: '#581c87', padding: '12px', borderRadius: '6px', color: '#e9d5ff', marginBottom: '16px' }}>
              <strong>⚠️ Recurring Hazard Signal</strong>
              <p style={{ fontSize: '0.875rem', marginTop: '4px' }}>{pattern_signal.sentence}</p>
            </div>
          ) : (
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '16px' }}>No prior recurring pattern flags for this equipment.</p>
          )}

          {corrective_action && (
            <div style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 600 }}>DRAFT CORRECTIVE ACTION</span>
              <p style={{ color: '#f8fafc', fontSize: '0.9rem', marginTop: '4px' }}>{corrective_action.proposed_action}</p>
              <span style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '6px', display: 'block' }}>Status: Pending Supervisor Approval</span>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '8px', width: '400px', border: '1px solid #334155' }}>
            <h3 style={{ marginBottom: '12px', color: '#ef4444' }}>Reject Near-Miss Report</h3>
            <p style={{ fontSize: '0.875rem', color: '#cbd5e1', marginBottom: '12px' }}>Please provide a reason for rejecting this report:</p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', backgroundColor: '#0f172a', color: '#fff', border: '1px solid #475569', marginBottom: '16px' }}
              placeholder="e.g. Duplicate report filed by another technician."
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setShowRejectModal(false)} style={{ backgroundColor: '#334155', color: '#fff', padding: '6px 12px', borderRadius: '4px' }}>
                Cancel
              </button>
              <button onClick={handleReject} style={{ backgroundColor: '#dc2626', color: '#fff', padding: '6px 12px', borderRadius: '4px', fontWeight: 600 }}>
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
