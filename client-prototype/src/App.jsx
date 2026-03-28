import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import VideoPlayer from './pages/VideoPlayer';
import { LogOut } from 'lucide-react';

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

function App() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen">
      {user && (
        <header style={{ 
          padding: '16px 24px', 
          background: 'var(--bg-secondary)',
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.05)'
        }}>
          <Link to="/" style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white' }}>
            StreamMG<span style={{ color: 'var(--accent-color)' }}>.prototype</span>
          </Link>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              {user.username} <span className="badge" style={{background: user.role === 'premium' ? '#f59e0b' : 'var(--bg-tertiary)', marginLeft: 8}}>{user.role}</span>
            </span>
            <button onClick={logout} className="btn" style={{ background: 'transparent', color: 'var(--text-secondary)' }}>
              <LogOut size={18} /> Quitter
            </button>
          </div>
        </header>
      )}

      <main className="container" style={{ paddingTop: user ? '40px' : '0', paddingBottom: '60px' }}>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/watch/:id" element={<PrivateRoute><VideoPlayer /></PrivateRoute>} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
