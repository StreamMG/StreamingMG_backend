import React from 'react';
import Topbar from './Topbar';
import Footer from './Footer';
import MiniPlayer from './MiniPlayer';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';

const AUTH_PATHS = ['/login', '/register'];

export default function Layout({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  const isAuthPage = AUTH_PATHS.some(p => location.pathname.startsWith(p));

  // Si on est sur une page d'auth ou déconnecté, on n'affiche que le contenu
  if (isAuthPage || !user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    );
  }

  // Layout principal de l'app (connecté)
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', paddingBottom: '96px' }}>
      <Topbar />
      
      <div style={{ flex: 1, paddingTop: '64px' }}>
        {children}
      </div>

      <Footer />
      <MiniPlayer />
    </div>
  );
}
