import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';

/* ── Pages (Lazy Loaded) ── */
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Catalogue = lazy(() => import('./pages/Catalogue'));
const VideoPlayerEnhanced = lazy(() => import('./pages/VideoPlayerEnhanced'));
const Profile = lazy(() => import('./pages/Profile'));
const Provider = lazy(() => import('./pages/Provider'));
const Admin = lazy(() => import('./pages/Admin'));
const Payment = lazy(() => import('./pages/Payment'));
const Tutoriels = lazy(() => import('./pages/Tutoriels'));

/**
 * PrivateRoute — redirige vers /login si non authentifié
 */
const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

/**
 * Loader de secours (Suspense fallback)
 */
const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-base)' }}>
    <div className="loading-spinner" />
  </div>
);

function App() {
  const { user } = useAuth();

  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Auth — public */}
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />

          {/* App — private */}
          <Route path="/" element={<PrivateRoute><Catalogue /></PrivateRoute>} />
          <Route path="/watch/:id" element={<PrivateRoute><VideoPlayerEnhanced /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/provider" element={<PrivateRoute><Provider /></PrivateRoute>} />
          <Route path="/admin" element={<PrivateRoute><Admin /></PrivateRoute>} />
          <Route path="/tutoriels" element={<PrivateRoute><Tutoriels /></PrivateRoute>} />
          <Route path="/subscribe" element={<PrivateRoute><Payment /></PrivateRoute>} />
          <Route path="/purchase" element={<PrivateRoute><Payment /></PrivateRoute>} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

export default App;
