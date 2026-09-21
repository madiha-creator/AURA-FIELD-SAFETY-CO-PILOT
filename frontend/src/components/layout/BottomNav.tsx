import React from 'react';
import { Mic, CheckSquare, ClipboardList, Radio } from 'lucide-react';

export type ShellTab = 'voice' | 'tasks' | 'logs' | 'status';

interface BottomNavProps {
  activeTab?: ShellTab;
  onTabChange?: (tab: ShellTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab = 'voice',
  onTabChange
}) => {
  const tabs = [
    { id: 'voice' as ShellTab, label: 'VOICE', icon: Mic },
    { id: 'tasks' as ShellTab, label: 'TASKS', icon: CheckSquare },
    { id: 'logs' as ShellTab, label: 'LOGS', icon: ClipboardList },
    { id: 'status' as ShellTab, label: 'STATUS', icon: Radio }
  ];

  return (
    <nav
      role="navigation"
      aria-label="Worker Shell Navigation"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid #D0DCE5',
        padding: '10px 12px 14px 12px',
        position: 'sticky',
        bottom: 0,
        zIndex: 50,
        boxShadow: '0 -2px 6px rgba(17, 28, 36, 0.04)'
      }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        const color = isActive ? '#0E7774' : '#6F7E85';

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange?.(tab.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '6px 16px',
              minWidth: '68px',
              minHeight: '56px',
              cursor: 'pointer',
              position: 'relative'
            }}
            aria-current={isActive ? 'page' : undefined}
          >
            {/* Top Indicator bar for active tab */}
            {isActive && (
              <div
                style={{
                  position: 'absolute',
                  top: '-10px',
                  width: '36px',
                  height: '3px',
                  borderRadius: '2px',
                  backgroundColor: '#0E7774'
                }}
              />
            )}

            <Icon size={24} color={color} strokeWidth={isActive ? 2.6 : 2} />
            <span
              style={{
                fontSize: '13px',
                fontWeight: isActive ? 800 : 700,
                letterSpacing: '0.06em',
                color: color,
                textTransform: 'uppercase'
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
