import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProvenanceBadge } from '../components/supervisor/ProvenanceBadge';
import { StatusBadge } from '../components/supervisor/StatusBadge';
import { HoldToConfirmButton } from '../components/supervisor/HoldToConfirmButton';
import {
  ArrowLeft,
  FileText,
  AlertTriangle,
  History,
  CheckCircle2,
  XCircle,
  Edit3,
  Quote,
  ShieldAlert,
  User,
  Clock,
  Sparkles,
  Layers,
  Wrench,
  MapPin
} from 'lucide-react';

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
  const [editReason, setEditReason] = useState('Supervisor corrections to field values');

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
      const res = await fetch(`/api/reviews/${id}`, {
        headers: {
          'Authorization': 'Bearer dev-token-bypass'
        }
      });
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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer dev-token-bypass'
        },
        body: JSON.stringify({ supervisor_id: 'sup_01' })
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
    const finalReason = editReason.trim() || 'Supervisor corrections to field values';
    try {
      const res = await fetch(`/api/reviews/${id}/edit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer dev-token-bypass'
        },
        body: JSON.stringify({
          changes: { location, equipment, hazard_type: hazardType },
          reason: finalReason
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
    if (!rejectReason.trim()) return;
    try {
      const res = await fetch(`/api/reviews/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer dev-token-bypass'
        },
        body: JSON.stringify({ reason: rejectReason.trim(), supervisor_id: 'sup_01' })
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
    return (
      <div
        style={{
          padding: '64px',
          textAlign: 'center',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--border-subtle)',
          color: 'var(--ink-700)',
          fontSize: '15px',
          fontWeight: 600
        }}
      >
        Loading review dossier from field database...
      </div>
    );
  }

  const { report, corrective_action, similar_reports, pattern_signal } = data;
  const prov = typeof report.provenance === 'string' ? JSON.parse(report.provenance || '{}') : report.provenance || {};
  const isAwaitingReview = report.status === 'awaiting_review';

  return (
    <div>
      {/* Top Action Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '24px',
          flexWrap: 'wrap'
        }}
      >
        {/* Left: Back button & Report Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={() => navigate('/inbox')}
            title="Return to review roster"
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
              boxShadow: 'var(--shadow-card)',
              transition: 'background-color 0.15s'
            }}
          >
            <ArrowLeft size={16} />
            <span>Roster</span>
          </button>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2
                style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  color: 'var(--ink-950)',
                  lineHeight: 1.2
                }}
              >
                Dossier #{report.id}
              </h2>
              <StatusBadge status={report.status} />
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--ink-500)',
                fontSize: '12px',
                fontWeight: 600,
                marginTop: '2px'
              }}
            >
              <span>FILED BY: {report.worker_id}</span>
              <span>•</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                {new Date(report.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions Cluster */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Full Session Audit Trail Link */}
          <button
            onClick={() => navigate(`/audit/session_${report.id}`)}
            title="View complete session interaction timeline and gate verification log"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              height: '44px',
              padding: '0 16px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--ink-700)',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <History size={16} style={{ color: 'var(--aura-teal)' }} />
            <span>Session Audit</span>
          </button>

          {/* Conditional Workflow Actions: Only if awaiting_review */}
          {isAwaitingReview && (
            <>
              {/* Edit Report Toggle */}
              <button
                onClick={() => setIsEditing(!isEditing)}
                title="Edit report fields with audit logging"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  height: '44px',
                  padding: '0 16px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isEditing ? 'var(--warning-amber-bg)' : 'var(--bg-surface)',
                  color: isEditing ? 'var(--warning-amber-text)' : 'var(--ink-950)',
                  border: `1px solid ${isEditing ? 'var(--warning-amber-border)' : 'var(--border-subtle)'}`,
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-card)'
                }}
              >
                <Edit3 size={15} />
                <span>{isEditing ? 'Cancel Edit' : 'Edit Report'}</span>
              </button>

              {/* Reject Action */}
              <button
                onClick={() => setShowRejectModal(true)}
                title="Reject near-miss report with mandatory reason"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  height: '44px',
                  padding: '0 16px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--danger-red-bg)',
                  color: 'var(--danger-red-text)',
                  border: '1px solid var(--danger-red-border)',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-card)'
                }}
              >
                <XCircle size={16} />
                <span>Reject</span>
              </button>

              {/* Hold-to-Confirm Approve & Notify (DESIGN.md 1000ms Hold) */}
              <HoldToConfirmButton
                onConfirm={handleApprove}
                label="Approve & Notify"
                confirmingLabel="Confirming Approval..."
              />
            </>
          )}
        </div>
      </div>

      {/* Primary Supervisor Cockpit Grid (Desktop 12-col: 7 cols Stage / 5 cols Intelligence Rail) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '24px',
          alignItems: 'start'
        }}
      >
        {/* Left Stage (Structured Dossier & Verbatim Narrative) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Card 1: Structured Report Dossier */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              padding: '24px',
              borderRadius: 'var(--radius-card)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '12px',
                marginBottom: '18px',
                borderBottom: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} style={{ color: 'var(--aura-teal)' }} />
                <h3
                  style={{
                    fontSize: '13px',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--aura-teal)'
                  }}
                >
                  Structured Report Dossier
                </h3>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-500)' }}>
                TELEMETRY MAPPING
              </span>
            </div>

            {isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--ink-700)',
                      marginBottom: '6px'
                    }}
                  >
                    Location / Bay
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    style={{
                      width: '100%',
                      height: '42px',
                      padding: '0 12px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-app)',
                      color: 'var(--ink-950)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '14px',
                      fontWeight: 600,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--ink-700)',
                      marginBottom: '6px'
                    }}
                  >
                    Equipment / Asset Tag
                  </label>
                  <input
                    type="text"
                    value={equipment}
                    onChange={e => setEquipment(e.target.value)}
                    style={{
                      width: '100%',
                      height: '42px',
                      padding: '0 12px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-app)',
                      color: 'var(--ink-950)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '14px',
                      fontWeight: 600,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--ink-700)',
                      marginBottom: '6px'
                    }}
                  >
                    Hazard Classification
                  </label>
                  <input
                    type="text"
                    value={hazardType}
                    onChange={e => setHazardType(e.target.value)}
                    style={{
                      width: '100%',
                      height: '42px',
                      padding: '0 12px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-app)',
                      color: 'var(--ink-950)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '14px',
                      fontWeight: 600,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--ink-700)',
                      marginBottom: '6px'
                    }}
                  >
                    Mandatory Audit Justification
                  </label>
                  <input
                    type="text"
                    value={editReason}
                    onChange={e => setEditReason(e.target.value)}
                    placeholder="Provide reason for field modification..."
                    style={{
                      width: '100%',
                      height: '42px',
                      padding: '0 12px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-app)',
                      color: 'var(--ink-950)',
                      border: '1px solid var(--warning-amber-border)',
                      fontSize: '14px',
                      fontWeight: 500,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  <button
                    onClick={handleEditSave}
                    disabled={!editReason.trim()}
                    style={{
                      height: '42px',
                      padding: '0 20px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--aura-teal)',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: editReason.trim() ? 'pointer' : 'not-allowed',
                      opacity: editReason.trim() ? 1 : 0.6
                    }}
                  >
                    Save Changes & Write Audit Event
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    style={{
                      height: '42px',
                      padding: '0 16px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-app)',
                      color: 'var(--ink-700)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '13px',
                      fontWeight: 600
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '16px'
                }}
              >
                {/* Location */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-app)',
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink-500)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Location
                    </span>
                    <ProvenanceBadge source={prov.location?.source || 'worker_said'} />
                  </div>
                  <strong style={{ fontSize: '16px', color: 'var(--ink-950)' }}>{report.location}</strong>
                </div>

                {/* Equipment */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-app)',
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink-500)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Equipment Asset
                    </span>
                    <ProvenanceBadge source={prov.equipment?.source || 'worker_said'} />
                  </div>
                  <strong style={{ fontSize: '16px', color: 'var(--ink-950)' }}>{report.equipment}</strong>
                </div>

                {/* Hazard Type */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-app)',
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink-500)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Hazard Classification
                    </span>
                    <ProvenanceBadge source={prov.hazard_type?.source || 'worker_said'} />
                  </div>
                  <strong style={{ fontSize: '16px', color: 'var(--ink-950)' }}>{report.hazard_type}</strong>
                </div>

                {/* Injury Status */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-app)',
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink-500)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Injury Status
                    </span>
                    <ProvenanceBadge source="verified" />
                  </div>
                  <strong style={{ fontSize: '16px', color: 'var(--ink-950)' }}>{report.injury}</strong>
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Worker Narrative & Agent Read-Back */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              padding: '24px',
              borderRadius: 'var(--radius-card)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                paddingBottom: '12px',
                marginBottom: '18px',
                borderBottom: '1px solid var(--border-subtle)'
              }}
            >
              <Quote size={18} style={{ color: 'var(--aura-teal)' }} />
              <h3
                style={{
                  fontSize: '13px',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--aura-teal)'
                }}
              >
                Frontline Audio Transcript & Read-Back
              </h3>
            </div>

            {/* Verbatim Worker Quote */}
            <div
              style={{
                backgroundColor: 'var(--surface-container)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '16px',
                marginBottom: '16px'
              }}
            >
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-700)',
                  marginBottom: '8px'
                }}
              >
                <User size={13} style={{ color: 'var(--aura-teal)' }} />
                <span>VERBATIM WORKER NARRATIVE</span>
              </span>
              <p
                style={{
                  fontStyle: 'italic',
                  color: 'var(--ink-950)',
                  fontSize: '15px',
                  lineHeight: 1.5
                }}
              >
                "{report.narrative || 'Worker stated pressure spiked rapidly while adjusting valve 4.'}"
              </p>
            </div>

            {/* Agent Read-Back and Confirmation */}
            <div
              style={{
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '16px'
              }}
            >
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-700)',
                  marginBottom: '8px'
                }}
              >
                <CheckCircle2 size={13} style={{ color: 'var(--success-green)' }} />
                <span>AGENT READ-BACK & EXPLICIT CONFIRMATION GATE</span>
              </span>
              <p
                style={{
                  color: 'var(--ink-700)',
                  fontSize: '14px',
                  lineHeight: 1.5
                }}
              >
                "I have logged a near miss for <strong>{report.equipment}</strong> at <strong>{report.location}</strong>. Hazard: <strong>{report.hazard_type}</strong>. Worker explicitly confirmed: 'Yes, file it'."
              </p>
            </div>
          </div>
        </div>

        {/* Right Intelligence Rail (Contextual Signals, CA, Similar Incidents) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Card 3: Pattern Intelligence Signal */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              padding: '24px',
              borderRadius: 'var(--radius-card)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                paddingBottom: '12px',
                marginBottom: '16px',
                borderBottom: '1px solid var(--border-subtle)'
              }}
            >
              <AlertTriangle size={18} style={{ color: 'var(--warning-amber)' }} />
              <h3
                style={{
                  fontSize: '13px',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--warning-amber-text)'
                }}
              >
                Pattern Intelligence
              </h3>
            </div>

            {pattern_signal && pattern_signal.recurring ? (
              <div
                style={{
                  backgroundColor: 'var(--warning-amber-bg)',
                  border: '1px solid var(--warning-amber-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '16px',
                  color: 'var(--warning-amber-text)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <AlertTriangle size={16} />
                  <strong style={{ fontSize: '14px' }}>RECURRING HAZARD DETECTED</strong>
                </div>
                <p style={{ fontSize: '13px', lineHeight: 1.4 }}>
                  {pattern_signal.sentence}
                </p>
                <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: 700 }}>
                  Signal Frequency: {pattern_signal.count} occurrences
                </div>
              </div>
            ) : (
              <div
                style={{
                  backgroundColor: 'var(--bg-app)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '16px',
                  color: 'var(--ink-700)',
                  fontSize: '13px'
                }}
              >
                No prior recurring pattern alerts flagged for {report.equipment}.
              </div>
            )}
          </div>

          {/* Card 4: Draft Corrective Action */}
          {corrective_action && (
            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                padding: '24px',
                borderRadius: 'var(--radius-card)',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-card)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  paddingBottom: '12px',
                  marginBottom: '16px',
                  borderBottom: '1px solid var(--border-subtle)'
                }}
              >
                <Sparkles size={18} style={{ color: 'var(--aura-teal)' }} />
                <h3
                  style={{
                    fontSize: '13px',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--aura-teal)'
                  }}
                >
                  Proposed Corrective Action
                </h3>
              </div>

              <div
                style={{
                  backgroundColor: 'var(--surface-container)',
                  border: '1px solid var(--border-subtle)',
                  borderLeft: '4px solid var(--aura-teal)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '16px'
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--aura-teal)',
                    display: 'block',
                    marginBottom: '6px'
                  }}
                >
                  DRAFT ACTION ITEM
                </span>
                <p style={{ color: 'var(--ink-950)', fontSize: '14px', lineHeight: 1.4 }}>
                  {corrective_action.proposed_action}
                </p>
                <div style={{ marginTop: '10px' }}>
                  <StatusBadge status={corrective_action.status || 'awaiting_review'} />
                </div>
              </div>
            </div>
          )}

          {/* Card 5: Similar Historical Incidents */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              padding: '24px',
              borderRadius: 'var(--radius-card)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                paddingBottom: '12px',
                marginBottom: '16px',
                borderBottom: '1px solid var(--border-subtle)'
              }}
            >
              <Layers size={18} style={{ color: 'var(--ink-700)' }} />
              <h3
                style={{
                  fontSize: '13px',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-700)'
                }}
              >
                Similar Historical Records
              </h3>
            </div>

            {similar_reports && similar_reports.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {similar_reports.map((sim: any, idx: number) => (
                  <div
                    key={idx}
                    style={{
                      padding: '12px',
                      backgroundColor: 'var(--bg-app)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '13px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <strong style={{ color: 'var(--ink-950)' }}>{sim.equipment || sim.title || 'Similar Report'}</strong>
                      <span style={{ color: 'var(--aura-teal)', fontWeight: 700 }}>
                        {sim.similarity_score ? `${Math.round(sim.similarity_score * 100)}% match` : ''}
                      </span>
                    </div>
                    <p style={{ color: 'var(--ink-700)' }}>{sim.narrative || sim.summary}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  backgroundColor: 'var(--bg-app)',
                  padding: '16px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--ink-700)',
                  fontSize: '13px'
                }}
              >
                No previous similar incidents identified within threshold.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reject Modal with AURA Safety Scrim */}
      {showRejectModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reject-dialog-title"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(17, 28, 36, 0.65)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px'
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              padding: '28px',
              borderRadius: 'var(--radius-card)',
              width: '100%',
              maxWidth: '460px',
              border: '1px solid var(--danger-red-border)',
              boxShadow: 'var(--shadow-elevated)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <ShieldAlert size={22} style={{ color: 'var(--danger-red)' }} />
              <h3
                id="reject-dialog-title"
                style={{
                  fontSize: '18px',
                  fontWeight: 800,
                  color: 'var(--danger-red)',
                  margin: 0
                }}
              >
                Reject Near-Miss Report
              </h3>
            </div>

            <p style={{ fontSize: '14px', color: 'var(--ink-700)', marginBottom: '14px', lineHeight: 1.4 }}>
              A permanent audit justification is required to reject this filed near miss. This action cannot be undone.
            </p>

            <textarea
              rows={4}
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. Duplicate report filed by another technician; asset already decommissioned."
              aria-label="Rejection justification reason"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--ink-950)',
                border: '1px solid var(--border-subtle)',
                fontSize: '14px',
                fontFamily: 'inherit',
                marginBottom: '20px',
                boxSizing: 'border-box',
                outline: 'none'
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--danger-red)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border-subtle)')}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setShowRejectModal(false)}
                style={{
                  height: '42px',
                  padding: '0 16px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--ink-950)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                style={{
                  height: '42px',
                  padding: '0 20px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--danger-red)',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: rejectReason.trim() ? 'pointer' : 'not-allowed',
                  opacity: rejectReason.trim() ? 1 : 0.6,
                  boxShadow: 'var(--shadow-card)'
                }}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}