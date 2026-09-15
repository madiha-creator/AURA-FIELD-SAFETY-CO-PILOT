import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: '#0f172a'
    }}>
      <div style={{
        backgroundColor: '#1e293b',
        padding: '32px',
        borderRadius: '8px',
        border: '1px solid #334155',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h2 style={{ marginBottom: '8px', color: '#38bdf8' }}>Supervisor Login</h2>
        <p style={{ marginBottom: '24px', color: '#94a3b8', fontSize: '0.875rem' }}>
          Access near-miss reviews, hazard patterns, and audit logs.
        </p>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.875rem', color: '#cbd5e1' }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid #475569',
                backgroundColor: '#0f172a',
                color: '#fff'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.875rem', color: '#cbd5e1' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid #475569',
                backgroundColor: '#0f172a',
                color: '#fff'
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              backgroundColor: '#0284c7',
              color: '#fff',
              padding: '10px',
              borderRadius: '4px',
              fontWeight: 600,
              marginTop: '8px'
            }}
          >
            Sign In as Supervisor
          </button>
        </form>
      </div>
    </div>
  );
}
