import React from 'react';
import { WorkerHeader } from './WorkerHeader';
import { BottomNav, ShellTab } from './BottomNav';

interface WorkerShellProps {
  children: React.ReactNode;
  activeTab?: ShellTab;
  onTabChange?: (tab: ShellTab) => void;
  isConnected?: boolean;
  batteryLevel?: number;
  siteId?: string;
  siteTime?: string;
  onProfileClick?: () => void;
  offlineNotice?: string;
}

export const WorkerShell: React.FC<WorkerShellProps> = ({
  children,
  activeTab = 'voice',
  onTabChange,
  isConnected = true,
  batteryLevel = 98,
  siteId = '03',
  siteTime = '09:41',
  onProfileClick,
  offlineNotice
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
      {/* Top Header */}
      <WorkerHeader
        isConnected={isConnected}
        batteryLevel={batteryLevel}
        siteId={siteId}
        siteTime={siteTime}
        onProfileClick={onProfileClick}
      />

      {/* Offline Notice Banner if disconnected */}
      {offlineNotice && (
        <div
          role="alert"
          style={{
            backgroundColor: 'var(--warning-amber-bg)',
            color: 'var(--warning-amber-text)',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 700,
            textAlign: 'center',
            borderBottom: '1px solid var(--warning-amber-border)'
          }}
        >
          {offlineNotice}
        </div>
      )}

      {/* Main Responsive Content Container */}
      <main
        style={{
          flex: 1,
          width: '100%',
          maxWidth: '520px',
          margin: '0 auto',
          padding: '20px 20px 28px 20px',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box'
        }}
      >
        {children}
      </main>

      {/* Shell Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
};
