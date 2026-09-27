import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuraLogoSvg } from '../components/voice/AuraLogoSvg';
import { ShieldCheck, ArrowRight, Lock, User } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('supervisor@aura.safety');
  const [password, setPassword] = useState('password');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('supervisor_auth', JSON.stringify({ user: username, role: 'supervisor' }));
    navigate('/inbox');
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-app)',
        padding: '24px'
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          padding: '40px 36px',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
          width: '100%',
          maxWidth: '420px',
          boxSizing: 'border-box'
        }}
      >
        {/* Brand Cluster */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              backgroundColor: 'var(--aura-teal)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              marginBottom: '16px',
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <AuraLogoSvg style={{ width: '100%', height: '100%' }} />
          </div>

          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.08em',
              color: 'var(--aura-teal)',
              textTransform: 'uppercase',
              marginBottom: '4px'
            }}
          >
            AURA FIELD SAFETY CO-PILOT
          </span>

          <h2
            style={{
              fontSize: '22px',
              fontWeight: 800,
              color: 'var(--ink-950)',
              letterSpacing: '-0.01em',
              marginBottom: '6px'
            }}
          >
            Supervisor Cockpit
          </h2>
          <p
            style={{
              color: 'var(--ink-700)',
              fontSize: '14px',
              lineHeight: 1.4,
              maxWidth: '320px'
            }}
          >
            Access frontline near-miss reviews, recurrence patterns, and telemetry audit trails.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label
              htmlFor="supervisor-username"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '6px',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--ink-700)'
              }}
            >
              <User size={14} style={{ color: 'var(--aura-teal)' }} />
              <span>Username / Operator ID</span>
            </label>
            <input
              id="supervisor-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{
                width: '100%',
                height: '44px',
                padding: '0 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--ink-950)',
                fontSize: '15px',
                fontWeight: 500,
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s'
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--aura-teal)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border-subtle)')}
            />
          </div>

          <div>
            <label
              htmlFor="supervisor-password"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '6px',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--ink-700)'
              }}
            >
              <Lock size={14} style={{ color: 'var(--aura-teal)' }} />
              <span>Security Key / Password</span>
            </label>
            <input
              id="supervisor-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                height: '44px',
                padding: '0 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--ink-950)',
                fontSize: '15px',
                fontWeight: 500,
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s'
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--aura-teal)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border-subtle)')}
            />
          </div>

          <button
            type="submit"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              height: '48px',
              backgroundColor: 'var(--aura-teal)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontSize: '14px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              cursor: 'pointer',
              marginTop: '8px',
              boxShadow: 'var(--shadow-card)',
              transition: 'background-color 0.15s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--aura-teal-dark)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--aura-teal)')}
          >
            <ShieldCheck size={18} />
            <span>Sign In to Cockpit</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div
          style={{
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-subtle)',
            textAlign: 'center',
            fontSize: '12px',
            color: 'var(--ink-500)'
          }}
        >
          Station verified · Sector 4 Shift Console · Encrypted Session
        </div>
      </div>
    </div>
  );
}
