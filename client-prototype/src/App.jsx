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
const NotFound = lazy(() => import('./pages/NotFound'));

/**
 * PrivateRoute — redirige vers /login si non authentifié
 */
const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

/**
 * RoleRoute — redirige vers /404 si le rôle n'est pas autorisé
 */
const RoleRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/404" />;
  return children;
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
          
          {/* Protected par Rôles */}
          <Route path="/provider" element={<RoleRoute allowedRoles={['provider', 'admin']}><Provider /></RoleRoute>} />
          <Route path="/admin" element={<RoleRoute allowedRoles={['admin']}><Admin /></RoleRoute>} />
          
          <Route path="/tutoriels" element={<PrivateRoute><Tutoriels /></PrivateRoute>} />
          <Route path="/subscribe" element={<PrivateRoute><Payment /></PrivateRoute>} />
          <Route path="/purchase" element={<PrivateRoute><Payment /></PrivateRoute>} />
          
          {/* 404 Catch-all */}
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

export default App;
