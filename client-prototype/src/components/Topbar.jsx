import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SearchPill from './SearchPill';
import { Bell, LogIn, Menu, X } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'Accueil' },
  { path: '/musique', label: 'Musique' },
  { path: '/tutoriels', label: 'Tutoriels' },
  { path: '/provider', label: 'Fournisseurs', roles: ['provider', 'admin'] },
  { path: '/admin', label: 'Admin', roles: ['admin'] },
];

export default function Topbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const topbarRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);
  const [search, setSearch] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const visibleNav = NAV_ITEMS.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes(user?.role);
  });

  const handleNavClick = () => setMobileMenuOpen(false);
  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    navigate('/', { replace: true });
  };

  return (
    <>
      {/* ── Header Fixed ── */}
      <header
        ref={topbarRef}
        className="topbar-shell"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 200,
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          padding: '0 clamp(14px, 4vw, 40px)',
          gap: 'clamp(10px, 2vw, 24px)',
          transition: 'background 300ms ease, border-color 300ms ease, backdrop-filter 300ms ease',
          background: scrolled ? 'rgba(13,16,24,0.92)' : 'rgba(13,16,24,0.0)',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid var(--bg-border)' : '1px solid transparent',
        }}
      >
        {/* ── Logo ── */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          <img
            src="https://i.ibb.co/BKzdqmBw/streammg-logo-mada-1777321847119-trasparent.png"
            alt="StreamMG Logo"
            style={{ width: '32px', height: '32px', objectFit: 'contain' }}
          />
          <span className="topbar-logo-text">
            Stream<span style={{ color: 'var(--primary-light)' }}>MG</span>
          </span>
        </Link>

        {/* ── Nav links (Desktop only) ── */}
        <nav className="topbar-nav topbar-desktop-only">
          <ul style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            listStyle: 'none',
            margin: 0,
            padding: 0,
          }}>
            {visibleNav.map(item => {
              const active = isActive(item.path);
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    style={{
                      fontSize: '14px',
                      fontWeight: active ? 600 : 400,
                      color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      background: active ? 'rgba(53,132,228,0.12)' : 'transparent',
                      transition: 'color 150ms, background 150ms',
                      textDecoration: 'none',
                      display: 'block',
                    }}
                    onMouseEnter={e => {
                      if (!active) {
                        e.currentTarget.style.color = 'var(--text-primary)';
                        e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!active) {
                        e.currentTarget.style.color = 'var(--text-secondary)';
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* ── Right section ── */}
        <div className="topbar-actions" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          {/* Search (Desktop only) */}
          <div className="topbar-search-container topbar-desktop-only">
            <SearchPill value={search} onChange={setSearch} />
          </div>

          {/* Notifications (Desktop only) */}
          <button
            className="topbar-notifications-btn topbar-desktop-only"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '9999px',
              background: 'transparent',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 150ms, background 150ms',
              position: 'relative',
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.background = 'var(--bg-raised)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.background = 'transparent';
            }}
            aria-label="Notifications"
          >
            <div style={{
              position: 'absolute',
              top: '7px',
              right: '7px',
              width: '7px',
              height: '7px',
              background: 'var(--primary)',
              borderRadius: '9999px',
              border: '1.5px solid var(--bg-base)',
            }} />
            <Bell size={18} />
          </button>

          {/* Premium button (Desktop) */}
          {user && (user?.isPremium || user?.role === 'premium') ? (
            <span className="topbar-premium-badge" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: 800,
              padding: '4px 10px',
              borderRadius: '6px',
              background: 'rgba(26,61,110,0.95)',
              color: '#ffd700',
              border: '1px solid rgba(232,197,71,0.5)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              boxShadow: '0 0 15px rgba(232,197,71,0.1)',
            }}>
              ★ PREMIUM
            </span>
          ) : user ? (
            <Link
              to="/subscribe?type=subscription"
              className="topbar-premium-btn"
              style={{
                display: 'inline-flex',
                height: '38px',
                padding: '0 20px',
                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%)',
                color: '#000',
                fontSize: '13px',
                fontWeight: 800,
                borderRadius: '9999px',
                letterSpacing: '0.02em',
                textTransform: 'uppercase',
                boxShadow: '0 4px 15px rgba(255, 165, 0, 0.4)',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 200ms ease',
                whiteSpace: 'nowrap',
                textDecoration: 'none',
                border: 'none',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 165, 0, 0.5)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 165, 0, 0.4)';
              }}
            >
              ★ Passer au Premium
            </Link>
          ) : null}

          {/* User Section - Login/Logout */}
          {user ? (
            <>
              {/* Avatar */}
              <Link
                to="/profile"
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '9999px',
                  background: 'linear-gradient(135deg, var(--primary-muted), var(--primary))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: "'Sora', sans-serif",
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'white',
                  border: `2px solid ${isActive('/profile') ? 'var(--primary)' : 'rgba(53,132,228,0.4)'}`,
                  transition: 'border-color 150ms',
                  textDecoration: 'none',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                onMouseLeave={e => {
                  if (!isActive('/profile')) {
                    e.currentTarget.style.borderColor = 'rgba(53,132,228,0.4)';
                  }
                }}
                title={user?.username}
              >
                {user?.username?.substring(0, 2).toUpperCase() || 'U'}
              </Link>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                title="Se déconnecter"
                style={{
                  background: 'transparent',
                  border: '1px solid var(--bg-border)',
                  color: 'var(--text-muted)',
                  borderRadius: '9999px',
                  width: '34px',
                  height: '34px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  transition: 'all 150ms',
                  padding: 0,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.color = 'var(--primary-light)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--bg-border)';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }}
              >
                ⏻
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="topbar-login-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                height: '36px',
                padding: '0 14px',
                background: 'linear-gradient(135deg, var(--primary-dark), var(--primary), var(--primary-light))',
                color: 'white',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: '9999px',
                border: '1px solid rgba(53,132,228,0.5)',
                boxShadow: '0 2px 12px rgba(53,132,228,0.3)',
                textDecoration: 'none',
                transition: 'all 150ms',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.opacity = '0.9';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(53,132,228,0.5)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.boxShadow = '0 2px 12px rgba(53,132,228,0.3)';
              }}
            >
              <LogIn size={16} />
              <span>Se connecter</span>
            </Link>
          )}

          {/* Hamburger Menu (Mobile) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="topbar-menu-btn"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              width: '36px',
              height: '36px',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 150ms'
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

      </header>

      {/* ── Mobile Menu ── */}
      {mobileMenuOpen && (
        <div
          className="mobile-menu-backdrop"
          style={{
            position: 'fixed',
            top: '64px',
            left: 0,
            right: 0,
            background: 'var(--bg-surface)',
            borderBottom: '1px solid var(--bg-border)',
            zIndex: 199,
            maxHeight: 'calc(100vh - 64px)',
            overflowY: 'auto',
            animation: 'slideDown 200ms ease-out forwards'
          }}
        >
          <nav className="topbar-mobile-nav" style={{ padding: '16px' }}>
            <ul style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              listStyle: 'none',
              margin: 0,
              padding: 0,
            }}>
              {visibleNav.map(item => {
                const active = isActive(item.path);
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={handleNavClick}
                      style={{
                        fontSize: '14px',
                        fontWeight: active ? 600 : 400,
                        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        background: active ? 'rgba(53,132,228,0.12)' : 'transparent',
                        transition: 'color 150ms, background 150ms',
                        textDecoration: 'none',
                        display: 'block',
                      }}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div style={{ padding: '16px', borderTop: '1px solid var(--bg-border)' }}>
            <SearchPill value={search} onChange={setSearch} />

            {user && (
              <div style={{ marginTop: '14px' }}>
                {user.isPremium || user.role === 'premium' ? (
                  <div style={{
                    padding: '12px',
                    borderRadius: '12px',
                    background: 'rgba(26,61,110,0.8)',
                    color: 'var(--gold)',
                    border: '1px solid rgba(232,197,71,0.3)',
                    fontSize: '13px',
                    fontWeight: 700,
                    textAlign: 'center',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    ★ Compte Premium
                  </div>
                ) : (
                  <Link
                    to="/subscribe?type=subscription"
                    onClick={handleNavClick}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      width: '100%',
                      height: '44px',
                      background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%)',
                      color: '#000',
                      fontSize: '14px',
                      fontWeight: 700,
                      borderRadius: '12px',
                      textDecoration: 'none',
                      textTransform: 'uppercase',
                      boxShadow: '0 4px 12px rgba(255, 165, 0, 0.3)',
                    }}
                  >
                    ★ Passer au Premium
                  </Link>
                )}
              </div>
            )}

            {!user && (
              <Link
                to="/login"
                onClick={handleNavClick}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  height: '44px',
                  marginTop: '14px',
                  borderRadius: '12px',
                  textDecoration: 'none',
                }}
              >
                <LogIn size={17} /> Se connecter
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
