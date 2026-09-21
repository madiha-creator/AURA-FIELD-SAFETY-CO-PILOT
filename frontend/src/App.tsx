import React from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Inbox from './pages/Inbox';
import ReviewDetail from './pages/ReviewDetail';
import Patterns from './pages/Patterns';
import Maintenance from './pages/Maintenance';
import AuditView from './pages/AuditView';
import Worker from './pages/Worker';

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const isLoginPage = location.pathname === '/login';
  const isWorkerRoute = location.pathname === '/' || location.pathname === '/worker';

  const handleLogout = () => {
    localStorage.removeItem('supervisor_auth');
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: isWorkerRoute ? 'var(--bg-app)' : '#0f172a' }}>
      {/* Supervisor Navigation Header (Rendered on supervisor desktop routes only) */}
      {!isLoginPage && !isWorkerRoute && (
        <header style={{
          backgroundColor: '#1e293b',
          borderBottom: '1px solid #334155',
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#38bdf8' }}>
              Aura Field Safety Co-Pilot
            </h1>
            <nav style={{ display: 'flex', gap: '16px' }}>
              <Link to="/worker" style={{ color: '#94a3b8', fontWeight: 500 }}>
                Worker Voice App
              </Link>
              <Link to="/inbox" style={{ color: location.pathname.startsWith('/inbox') ? '#38bdf8' : '#94a3b8', fontWeight: 500 }}>
                Review Inbox
              </Link>
              <Link to="/patterns" style={{ color: location.pathname === '/patterns' ? '#38bdf8' : '#94a3b8', fontWeight: 500 }}>
                Hazard Patterns
              </Link>
              <Link to="/maintenance" style={{ color: location.pathname === '/maintenance' ? '#38bdf8' : '#94a3b8', fontWeight: 500 }}>
                Maintenance Logs
              </Link>
            </nav>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '0.875rem', color: '#cbd5e1' }}>Role: <strong>Supervisor / Reviewer</strong></span>
            <button
              onClick={handleLogout}
              style={{
                backgroundColor: '#334155',
                color: '#f8fafc',
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '0.875rem'
              }}
            >
              Sign Out
            </button>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: (isLoginPage || isWorkerRoute) ? 0 : '24px' }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Worker />} />
          <Route path="/worker" element={<Worker />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/inbox/:id" element={<ReviewDetail />} />
          <Route path="/patterns" element={<Patterns />} />
          <Route path="/maintenance" element={<Maintenance />} />
          <Route path="/audit/:session_id" element={<AuditView />} />
        </Routes>
      </main>
    </div>
  );
}
