import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '../components/supervisor/StatusBadge';
import { Search, Filter, AlertTriangle, ArrowRight, CheckCircle2, Clock, MapPin, Wrench } from 'lucide-react';

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

  const pendingCount = reviews.filter(r => r.status === 'awaiting_review').length;

  return (
    <div>
      {/* Page Title & Status Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '24px',
          gap: '16px',
          flexWrap: 'wrap'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.08em',
                color: 'var(--aura-teal)',
                textTransform: 'uppercase'
              }}
            >
              OPERATIONAL ROSTER
            </span>
            <span
              style={{
                backgroundColor: pendingCount > 0 ? 'var(--warning-amber-bg)' : 'var(--success-green-bg)',
                color: pendingCount > 0 ? 'var(--warning-amber-text)' : 'var(--success-green-text)',
                border: `1px solid ${pendingCount > 0 ? 'var(--warning-amber-border)' : 'var(--success-green-border)'}`,
                padding: '2px 8px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.04em'
              }}
            >
              {pendingCount} AWAITING REVIEW
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
            Supervisor Review Inbox
          </h2>
          <p style={{ color: 'var(--ink-700)', fontSize: '14px', marginTop: '4px' }}>
            Review confirmed frontline near-miss reports, threshold deviations, and pattern alerts.
          </p>
        </div>

        {/* Filter Toolbar */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            backgroundColor: 'var(--bg-surface)',
            padding: '6px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-card)'
          }}
        >
          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '8px' }}>
            <Filter size={15} style={{ color: 'var(--aura-teal)' }} />
            <select
              aria-label="Filter reports by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                height: '38px',
                padding: '0 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--ink-950)',
                border: '1px solid var(--border-subtle)',
                fontSize: '13px',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="">All Review Statuses</option>
              <option value="awaiting_review">Awaiting Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Site Filter */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', color: 'var(--ink-500)' }} />
            <input
              type="text"
              aria-label="Filter by site or location"
              placeholder="Filter by Site / Location..."
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
              style={{
                height: '38px',
                padding: '0 12px 0 32px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--ink-950)',
                border: '1px solid var(--border-subtle)',
                fontSize: '13px',
                fontWeight: 500,
                outline: 'none',
                width: '220px'
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--aura-teal)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border-subtle)')}
            />
          </div>
        </div>
      </div>

      {/* Content Area */}
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
          Loading report roster from field telemetry database...
        </div>
      ) : reviews.length === 0 ? (
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
            <CheckCircle2 size={24} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink-950)', marginBottom: '6px' }}>
            Review Queue Clear
          </h3>
          <p style={{ color: 'var(--ink-700)', fontSize: '14px', maxWidth: '420px', margin: '0 auto' }}>
            No near-miss reports match the active filter criteria. All pending safety items have been processed.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {reviews.map((item) => {
            const isHighDeviation = item.hazard_type.toLowerCase().includes('high') || item.hazard_type.toLowerCase().includes('leak');
            const isPending = item.status === 'awaiting_review';

            // Visual left border color
            let leftAccentColor = 'var(--aura-teal)';
            if (isHighDeviation) {
              leftAccentColor = 'var(--danger-red)';
            } else if (isPending) {
              leftAccentColor = 'var(--warning-amber)';
            } else if (item.status === 'approved') {
              leftAccentColor = 'var(--success-green)';
            }

            return (
              <div
                key={item.id}
                onClick={() => navigate(`/inbox/${item.id}`)}
                tabIndex={0}
                role="button"
                aria-label={`Review near miss for ${item.equipment} at ${item.location}`}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/inbox/${item.id}`)}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  padding: '20px 24px',
                  borderRadius: 'var(--radius-card)',
                  border: '1px solid var(--border-subtle)',
                  borderLeft: `5px solid ${leftAccentColor}`,
                  boxShadow: 'var(--shadow-card)',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '20px',
                  transition: 'all 0.15s ease-in-out',
                  outline: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--shadow-elevated)';
                  e.currentTarget.style.borderColor = 'var(--outline-variant)';
                  e.currentTarget.style.borderLeftColor = leftAccentColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--shadow-card)';
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.borderLeftColor = leftAccentColor;
                }}
                onFocus={(e) => {
                  e.currentTarget.style.outline = '2px solid var(--aura-teal)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.outline = 'none';
                }}
              >
                {/* Left Cluster: Equipment, Location, Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Wrench size={16} style={{ color: 'var(--aura-teal)' }} />
                      <span style={{ fontWeight: 800, fontSize: '18px', color: 'var(--ink-950)' }}>
                        {item.equipment}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--ink-700)', fontSize: '14px', fontWeight: 500 }}>
                      <MapPin size={14} style={{ color: 'var(--ink-500)' }} />
                      <span>{item.location}</span>
                    </div>

                    {item.pattern_detected && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          backgroundColor: 'var(--warning-amber-bg)',
                          color: 'var(--warning-amber-text)',
                          border: '1px solid var(--warning-amber-border)',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-pill)',
                          fontSize: '11px',
                          fontWeight: 700,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase'
                        }}
                      >
                        <AlertTriangle size={12} />
                        RECURRING HAZARD
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: 'var(--ink-700)', flexWrap: 'wrap' }}>
                    <span>
                      <strong style={{ color: 'var(--ink-950)' }}>Hazard:</strong> {item.hazard_type}
                    </span>
                    <span style={{ color: 'var(--border-subtle)' }}>•</span>
                    <span>
                      <strong style={{ color: 'var(--ink-950)' }}>Injury:</strong> {item.injury}
                    </span>
                  </div>

                  {item.recurrence_sentence && (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: 'var(--warning-amber-bg)',
                        color: 'var(--warning-amber-text)',
                        border: '1px solid var(--warning-amber-border)',
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '12px',
                        fontWeight: 600,
                        marginTop: '8px'
                      }}
                    >
                      <AlertTriangle size={13} />
                      <span>{item.recurrence_sentence}</span>
                    </div>
                  )}
                </div>

                {/* Right Cluster: Status, Timestamp, Review Affordance */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}>
                  <StatusBadge status={item.status} />

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
                    <span>{new Date(item.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                  </div>

                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: 'var(--aura-teal)',
                      fontSize: '13px',
                      fontWeight: 700,
                      marginTop: '4px'
                    }}
                  >
                    <span>Review Dossier</span>
                    <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
