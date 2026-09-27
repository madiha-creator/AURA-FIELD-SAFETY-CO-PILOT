import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Inbox from './pages/Inbox';
import ReviewDetail from './pages/ReviewDetail';
import Patterns from './pages/Patterns';
import Maintenance from './pages/Maintenance';
import AuditView from './pages/AuditView';
import Worker from './pages/Worker';
import Entry from './pages/Entry';
import { SupervisorShell } from './components/layout/SupervisorShell';

export default function App() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('supervisor_auth');
    navigate('/login');
  };

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
      <Routes>
        {/* Root Role Entry & Navigation */}
        <Route path="/" element={<Entry />} />

        {/* Supervisor Authentication (FE-004 Daylight UI) */}
        <Route path="/login" element={<Login />} />

        {/* Frontline Worker Voice Routes */}
        <Route path="/worker" element={<Worker />} />

        {/* Supervisor Cockpit Operational Routes (Wrapped in SupervisorShell) */}
        <Route
          path="/inbox"
          element={
            <SupervisorShell onLogout={handleLogout}>
              <Inbox />
            </SupervisorShell>
          }
        />
        <Route
          path="/inbox/:id"
          element={
            <SupervisorShell onLogout={handleLogout}>
              <ReviewDetail />
            </SupervisorShell>
          }
        />
        <Route
          path="/patterns"
          element={
            <SupervisorShell onLogout={handleLogout}>
              <Patterns />
            </SupervisorShell>
          }
        />
        <Route
          path="/maintenance"
          element={
            <SupervisorShell onLogout={handleLogout}>
              <Maintenance />
            </SupervisorShell>
          }
        />
        <Route
          path="/audit/:session_id"
          element={
            <SupervisorShell onLogout={handleLogout}>
              <AuditView />
            </SupervisorShell>
          }
        />
      </Routes>
    </div>
  );
}
