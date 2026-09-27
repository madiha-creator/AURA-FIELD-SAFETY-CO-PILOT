import React from 'react';
import { SupervisorHeader } from './SupervisorHeader';

interface SupervisorShellProps {
  children: React.ReactNode;
  siteId?: string;
  onLogout?: () => void;
}

/**
 * AURA Supervisor Operational Cockpit Shell
 * Desktop-first daylight layout system (DESIGN.md).
 * - Canvas: var(--bg-app) (#EFF3F6)
 * - Level 1 Container: max-width 1440px with 32px canvas margins and 24px gutters
 */
export const SupervisorShell: React.FC<SupervisorShellProps> = ({
  children,
  siteId = 'SITE 03 · BAY 4',
  onLogout
}) => {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-app)',
        color: 'var(--ink-950)'
      }}
    >
      {/* Persistent Supervisor Cockpit Navigation Header */}
      <SupervisorHeader siteId={siteId} onLogout={onLogout} />

      {/* Main 12-Column Responsive Operational Stage */}
      <main
        style={{
          flex: 1,
          width: '100%',
          maxWidth: '1440px',
          margin: '0 auto',
          padding: '24px 32px 48px 32px',
          boxSizing: 'border-box'
        }}
      >
        {children}
      </main>
    </div>
  );
};
