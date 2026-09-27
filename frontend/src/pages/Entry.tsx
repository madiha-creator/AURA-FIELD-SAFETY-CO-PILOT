import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuraLogoSvg } from '../components/voice/AuraLogoSvg';
import { Mic, ShieldCheck, ArrowRight } from 'lucide-react';

export const AURA_ENTRY_ROLE_KEY = 'aura_entry_role';

/**
 * AURA Root Entry & Role-Selection Screen
 *
 * Route: /
 * - WORKER: Field operations & safety reporting (persists choice in localStorage, navigates to /worker)
 * - SUPERVISOR: Review reports & safety intelligence (no persistence, navigates to /login)
 *
 * If a valid 'worker' choice is already stored, automatically routes to /worker.
 */
export default function Entry() {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [hoveredCard, setHoveredCard] = useState<'worker' | 'supervisor' | null>(null);

  // Detect stored Worker choice on initial mount
  useEffect(() => {
    try {
      const storedRole = localStorage.getItem(AURA_ENTRY_ROLE_KEY);
      if (storedRole === 'worker') {
        navigate('/worker', { replace: true });
        return;
      }
    } catch {
      // Gracefully handle private-mode / restricted localStorage environments
    }
    setIsChecking(false);
  }, [navigate]);

  if (isChecking) {
    // Avoid layout flash while checking for remembered Worker preference
    return null;
  }

  const handleSelectWorker = () => {
    try {
      localStorage.setItem(AURA_ENTRY_ROLE_KEY, 'worker');
    } catch {
      // Fallback if localStorage quota or security exception occurs
    }
    navigate('/worker');
  };

  const handleSelectSupervisor = () => {
    // Do NOT persist Supervisor selection per architecture constraints
    navigate('/login');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-app)',
        color: 'var(--ink-950)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
        boxSizing: 'border-box'
      }}
    >
      <main
        style={{
          width: '100%',
          maxWidth: '880px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '36px'
        }}
      >
        {/* Brand & Identity Header */}
        <header
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '12px'
          }}
        >
          {/* Authentic Production AURA Logo Mark */}
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--aura-teal)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-card)',
              flexShrink: 0
            }}
            aria-hidden="true"
          >
            <AuraLogoSvg style={{ width: '100%', height: '100%' }} />
          </div>

          <div>
            <h1
              style={{
                fontSize: '30px',
                fontWeight: 800,
                letterSpacing: '0.04em',
                color: 'var(--ink-950)',
                margin: 0,
                lineHeight: 1.2
              }}
            >
              AURA
            </h1>
            <p
              style={{
                fontSize: '14px',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--aura-teal)',
                marginTop: '4px',
                marginBottom: 0
              }}
            >
              Field Safety Co-Pilot
            </p>
          </div>

          <div style={{ marginTop: '8px' }}>
            <h2
              style={{
                fontSize: '22px',
                fontWeight: 700,
                color: 'var(--ink-950)',
                margin: 0,
                lineHeight: 1.3
              }}
            >
              How are you using AURA?
            </h2>
            <p
              style={{
                fontSize: '15px',
                fontWeight: 500,
                color: 'var(--ink-700)',
                margin: '6px 0 0 0'
              }}
            >
              Choose your workspace to continue.
            </p>
          </div>
        </header>

        {/* Role Cards Grid - Equal Prominence & Symmetrical Layout */}
        <section
          aria-label="Workspace Selection"
          style={{
            width: '100%',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px'
          }}
        >
          {/* Card 1: Worker Role */}
          <article
            onClick={handleSelectWorker}
            onMouseEnter={() => setHoveredCard('worker')}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: hoveredCard === 'worker' ? '1.5px solid var(--aura-teal)' : '1.5px solid var(--border-subtle)',
              borderRadius: 'var(--radius-card)',
              padding: '28px 24px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: hoveredCard === 'worker' ? 'var(--shadow-elevated)' : 'var(--shadow-card)',
              transition: 'border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease',
              transform: hoveredCard === 'worker' ? 'translateY(-2px)' : 'none',
              boxSizing: 'border-box',
              cursor: 'pointer'
            }}
          >
            {/* Header: Icon + Category Badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-secondary-surface)',
                  color: 'var(--aura-teal)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
                aria-hidden="true"
              >
                <Mic size={24} strokeWidth={2.4} />
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-500)',
                  backgroundColor: 'var(--bg-app)',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-pill)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                Field Operations
              </span>
            </div>

            {/* Title & Core Value Proposition */}
            <h3
              style={{
                fontSize: '22px',
                fontWeight: 800,
                letterSpacing: '0.04em',
                color: 'var(--ink-950)',
                margin: '0 0 6px 0',
                lineHeight: 1.25
              }}
            >
              WORKER
            </h3>
            <p
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--ink-700)',
                margin: '0 0 16px 0',
                lineHeight: 1.4
              }}
            >
              Field operations & safety reporting
            </p>

            {/* Feature Highlights */}
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: '0 0 24px 0',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                flex: 1
              }}
            >
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px', color: 'var(--ink-700)', lineHeight: 1.4 }}>
                <span style={{ color: 'var(--aura-teal)', marginTop: '2px' }} aria-hidden="true">✓</span>
                <span>Hands-free voice procedure guidance</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px', color: 'var(--ink-700)', lineHeight: 1.4 }}>
                <span style={{ color: 'var(--aura-teal)', marginTop: '2px' }} aria-hidden="true">✓</span>
                <span>Real-time safety threshold monitoring</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px', color: 'var(--ink-700)', lineHeight: 1.4 }}>
                <span style={{ color: 'var(--aura-teal)', marginTop: '2px' }} aria-hidden="true">✓</span>
                <span>Voice & text near-miss hazard capture</span>
              </li>
            </ul>

            {/* Primary Action Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSelectWorker();
              }}
              type="button"
              aria-label="Enter Worker App: Field operations and safety reporting"
              style={{
                width: '100%',
                minHeight: 'var(--touch-target-preferred, 64px)',
                height: '64px',
                backgroundColor: 'var(--aura-teal)',
                color: '#FFFFFF',
                borderRadius: 'var(--radius-btn)',
                fontSize: '15px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                cursor: 'pointer',
                border: 'none',
                boxShadow: 'var(--shadow-card)',
                transition: 'background-color 0.15s ease, transform 0.1s ease',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(14, 119, 116, 0.35)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = 'var(--shadow-card)';
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--aura-teal-dark)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--aura-teal)';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--aura-teal-dark)';
                e.currentTarget.style.transform = 'scale(0.99)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--aura-teal)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <span>Enter Worker App</span>
              <ArrowRight size={18} strokeWidth={2.4} />
            </button>
          </article>

          {/* Card 2: Supervisor Role */}
          <article
            onClick={handleSelectSupervisor}
            onMouseEnter={() => setHoveredCard('supervisor')}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: hoveredCard === 'supervisor' ? '1.5px solid var(--aura-teal)' : '1.5px solid var(--border-subtle)',
              borderRadius: 'var(--radius-card)',
              padding: '28px 24px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: hoveredCard === 'supervisor' ? 'var(--shadow-elevated)' : 'var(--shadow-card)',
              transition: 'border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease',
              transform: hoveredCard === 'supervisor' ? 'translateY(-2px)' : 'none',
              boxSizing: 'border-box',
              cursor: 'pointer'
            }}
          >
            {/* Header: Icon + Category Badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-secondary-surface)',
                  color: 'var(--aura-teal)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
                aria-hidden="true"
              >
                <ShieldCheck size={24} strokeWidth={2.4} />
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-500)',
                  backgroundColor: 'var(--bg-app)',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-pill)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                Safety Oversight
              </span>
            </div>

            {/* Title & Core Value Proposition */}
            <h3
              style={{
                fontSize: '22px',
                fontWeight: 800,
                letterSpacing: '0.04em',
                color: 'var(--ink-950)',
                margin: '0 0 6px 0',
                lineHeight: 1.25
              }}
            >
              SUPERVISOR
            </h3>
            <p
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--ink-700)',
                margin: '0 0 16px 0',
                lineHeight: 1.4
              }}
            >
              Review reports & safety intelligence
            </p>

            {/* Feature Highlights */}
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: '0 0 24px 0',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                flex: 1
              }}
            >
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px', color: 'var(--ink-700)', lineHeight: 1.4 }}>
                <span style={{ color: 'var(--aura-teal)', marginTop: '2px' }} aria-hidden="true">✓</span>
                <span>Review & verify near-miss incident queue</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px', color: 'var(--ink-700)', lineHeight: 1.4 }}>
                <span style={{ color: 'var(--aura-teal)', marginTop: '2px' }} aria-hidden="true">✓</span>
                <span>Facility-wide hazard pattern analysis</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px', color: 'var(--ink-700)', lineHeight: 1.4 }}>
                <span style={{ color: 'var(--aura-teal)', marginTop: '2px' }} aria-hidden="true">✓</span>
                <span>Equipment maintenance logs & audit history</span>
              </li>
            </ul>

            {/* Primary Action Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSelectSupervisor();
              }}
              type="button"
              aria-label="Enter Supervisor Cockpit: Review reports and safety intelligence"
              style={{
                width: '100%',
                minHeight: 'var(--touch-target-preferred, 64px)',
                height: '64px',
                backgroundColor: 'var(--aura-teal)',
                color: '#FFFFFF',
                borderRadius: 'var(--radius-btn)',
                fontSize: '15px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                cursor: 'pointer',
                border: 'none',
                boxShadow: 'var(--shadow-card)',
                transition: 'background-color 0.15s ease, transform 0.1s ease',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(14, 119, 116, 0.35)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = 'var(--shadow-card)';
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--aura-teal-dark)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--aura-teal)';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--aura-teal-dark)';
                e.currentTarget.style.transform = 'scale(0.99)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--aura-teal)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <span>Enter Supervisor Cockpit</span>
              <ArrowRight size={18} strokeWidth={2.4} />
            </button>
          </article>
        </section>

        {/* Trust & Architecture Metadata Footnote */}
        <footer
          style={{
            fontSize: '13px',
            color: 'var(--ink-500)',
            textAlign: 'center',
            letterSpacing: '0.02em',
            marginTop: '8px'
          }}
        >
          AURA Field Safety Co-Pilot · Certified Industrial Safety Architecture
        </footer>
      </main>
    </div>
  );
}

