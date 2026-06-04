import React from 'react';
import Topbar from './Topbar';
import Footer from './Footer';
import { useLocation } from 'react-router-dom';

const AUTH_PATHS = ['/login', '/register'];

export default function Layout({ children }) {
  const location = useLocation();

  const isAuthPage = AUTH_PATHS.some(p => location.pathname.startsWith(p));

  // Les pages d'auth gardent leur layout centré.
  if (isAuthPage) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    );
  }

  // Layout principal de l'app, visible aussi aux visiteurs pour garder l'appel à connexion.
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      background: 'var(--bg-base)'
    }}>
      <Topbar />
      
      <div className="main-content" style={{ 
        flex: 1, 
        paddingTop: '64px',
        paddingBottom: '40px' 
      }}>
        {children}
      </div>

      <Footer />
    </div>
  );
}
