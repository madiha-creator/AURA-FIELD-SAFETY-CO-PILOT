import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuraLogoSvg } from '../voice/AuraLogoSvg';
import { LogOut, Radio, Clock, MapPin, ExternalLink } from 'lucide-react';

interface SupervisorHeaderProps {
  siteId?: string;
  onLogout?: () => void;
}

export const SupervisorHeader: React.FC<SupervisorHeaderProps> = ({
  siteId = 'SITE 03 · BAY 4',
  onLogout
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSignOut = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('supervisor_auth');
      navigate('/login');
    }
  };

  const navLinks = [
    { path: '/inbox', label: 'Review Inbox' },
    { path: '/patterns', label: 'Hazard Patterns' },
    { path: '/maintenance', label: 'Maintenance Logs' }
  ];

  return (
    <header
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: 'var(--shadow-card)'
      }}
    >
      <div
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          padding: '0 24px',
          height: '64px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        {/* Left: Brand Identity & Supervisor Cockpit Mark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <Link
            to="/inbox"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textDecoration: 'none'
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'var(--aura-teal)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                flexShrink: 0
              }}
            >
              <AuraLogoSvg style={{ width: '100%', height: '100%' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontSize: '18px',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  color: 'var(--ink-950)',
                  lineHeight: 1.1
                }}
              >
                AURA
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: 'var(--aura-teal)',
                  textTransform: 'uppercase',
                  lineHeight: 1
                }}
              >
                SUPERVISOR COCKPIT
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links with Active Underlines */}
          <nav
            style={{
              display: 'flex',
              gap: '4px',
              height: '64px',
              alignItems: 'center'
            }}
          >
            {navLinks.map((link) => {
              const isActive = location.pathname.startsWith(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: '100%',
                    padding: '0 16px',
                    fontSize: '14px',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? 'var(--ink-950)' : 'var(--ink-700)',
                    borderBottom: isActive ? '3px solid var(--aura-teal)' : '3px solid transparent',
                    boxSizing: 'border-box',
                    transition: 'all 0.15s ease-in-out'
                  }}
                >
                  {link.label}
                </Link>
              );
            })}

            {/* Quick Switch to Frontline Voice App */}
            <Link
              to="/worker"
              title="Switch to Frontline Worker Voice App"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                marginLeft: '8px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--surface-container)',
                border: '1px solid var(--border-subtle)',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--aura-teal)',
                textDecoration: 'none',
                transition: 'background-color 0.15s'
              }}
            >
              <Radio size={14} />
              <span>Worker App</span>
              <ExternalLink size={12} style={{ opacity: 0.7 }} />
            </Link>
          </nav>
        </div>

        {/* Right: Station Telemetry, Role, Sign Out */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Site Telemetry Tag */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-app)',
              border: '1px solid var(--border-subtle)',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--ink-700)'
            }}
          >
            <MapPin size={13} style={{ color: 'var(--aura-teal)' }} />
            <span>{siteId}</span>
            <span style={{ color: 'var(--border-subtle)' }}>|</span>
            <Clock size={13} style={{ color: 'var(--ink-500)' }} />
            <span>{timeStr || 'LIVE'}</span>
          </div>

          {/* Role Pill */}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              height: '24px',
              padding: '0 10px',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'var(--bg-secondary-surface)',
              color: 'var(--aura-teal-dark)',
              border: '1px solid var(--outline-variant)',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase'
            }}
          >
            SUPERVISOR
          </span>

          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            title="Sign out of supervisor cockpit"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              height: '36px',
              padding: '0 12px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--ink-700)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
