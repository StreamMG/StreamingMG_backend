import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SearchPill from './SearchPill';
import { Bell } from 'lucide-react';

/**
 * Topbar — Fidèle à la maquette v2
 * - Fixed top, transparent → blur au scroll
 * - Logo + Nav (5 links) + Search + Notifications + Premium + Avatar + Logout
 */

const NAV_ITEMS = [
  { path: '/', label: 'Accueil' },
  { path: '/explorer', label: 'Explorer' },
  { path: '/musique', label: 'Musique' },
  { path: '/tutoriels', label: 'Tutoriels' },
  { path: '/provider', label: 'Fournisseurs', roles: ['provider', 'admin'] },
  { path: '/admin', label: 'Admin', roles: ['admin'] },
];

export default function Topbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const topbarRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);
  const [search, setSearch] = useState('');

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

  return (
    <header
      ref={topbarRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 40px',
        gap: '32px',
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
        <div style={{
          width: '30px',
          height: '30px',
          background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 12px rgba(53,132,228,0.4)',
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <polygon points="1,1 11,6 1,11" fill="white" />
          </svg>
        </div>
        <span style={{
          fontFamily: "'Sora', sans-serif",
          fontSize: '18px',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          color: 'var(--text-primary)',
          whiteSpace: 'nowrap',
        }}>
          Stream<span style={{ color: 'var(--primary-light)' }}>MG</span>
        </span>
      </Link>

      {/* ── Nav links ── */}
      <nav>
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
                    color: active ? 'var(--text-primary)' : 'rgba(238,240,246,0.65)',
                    padding: '6px 12px',
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
                      e.currentTarget.style.color = 'rgba(238,240,246,0.65)';
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
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Search */}
        <SearchPill value={search} onChange={setSearch} />

        {/* Notifications */}
        <button
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

        {/* Premium button */}
        {user?.isPremium || user?.role === 'premium' ? (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '10px',
            fontWeight: 700,
            padding: '3px 7px',
            borderRadius: '5px',
            background: 'rgba(26,61,110,0.9)',
            color: 'var(--gold)',
            border: '1px solid rgba(232,197,71,0.3)',
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
          }}>
            ★ PREMIUM
          </span>
        ) : (
          <Link
            to="/subscribe?type=subscription"
            style={{
              height: '36px',
              padding: '0 16px',
              background: 'linear-gradient(135deg, var(--gold-dark), var(--gold), var(--gold-light))',
              color: '#1a1000',
              fontSize: '12px',
              fontWeight: 700,
              borderRadius: '9999px',
              letterSpacing: '0.03em',
              textTransform: 'uppercase',
              boxShadow: '0 2px 14px rgba(232,197,71,0.35)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'opacity 180ms, transform 150ms',
              whiteSpace: 'nowrap',
              textDecoration: 'none',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            ★ Premium
          </Link>
        )}

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

        {/* Logout */}
        <button
          onClick={logout}
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
      </div>
    </header>
  );
}
