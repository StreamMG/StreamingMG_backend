import React from 'react';
import { Link } from 'react-router-dom';
import { Smartphone, Globe, Mail } from 'lucide-react';

const FOOTER_COLS = [
  {
    title: 'Catalogue',
    links: [
      { label: 'Films & Séries', to: '/' },
      { label: 'Musique Traditionnelle', to: '/' },
      { label: 'Documentaires', to: '/' },
      { label: 'Podcasts', to: '/' },
      { label: 'Tutoriels', to: '/tutoriels' },
    ],
  },
  {
    title: 'Compte',
    links: [
      { label: 'Mon profil', to: '/profile' },
      { label: 'Abonnement Premium', to: '/subscribe?type=subscription' },
      { label: 'Espace Fournisseur', to: '/provider' },
      { label: 'Administration', to: '/admin' },
    ],
  },
  {
    title: 'Plateforme',
    links: [
      { label: 'Application mobile', to: '/' },
      { label: 'À propos', to: '/' },
      { label: 'Contact', to: '/' },
      { label: "Conditions d'utilisation", to: '/' },
      { label: 'Confidentialité', to: '/' },
    ],
  },
];

export default function Footer() {
  return (
    <footer style={{
      background: 'var(--bg-surface)',
      borderTop: '1px solid var(--bg-border)',
      marginTop: 'auto',
    }}>
      {/* Main footer grid */}
      <div style={{
        maxWidth: '1480px',
        margin: '0 auto',
        padding: 'clamp(32px, 5vw, 56px) clamp(16px, 5vw, 40px)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 'clamp(32px, 5vw, 48px)',
      }}>

        {/* Brand column */}
        <div>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none', marginBottom: '16px' }}>
            <img
              src="https://i.ibb.co/BKzdqmBw/streammg-logo-mada-1777321847119-trasparent.png"
              alt="StreamMG Logo"
              style={{ width: '30px', height: '30px', objectFit: 'contain' }}
            />
            <span style={{ fontFamily: 'Sora', fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Stream<span style={{ color: 'var(--primary)' }}>MG</span>
            </span>
          </Link>
          <p style={{
            fontSize: '13px',
            lineHeight: '1.7',
            color: 'var(--text-muted)',
            maxWidth: '280px',
          }}>
            La première plateforme de streaming audiovisuel et éducatif dédiée au
            patrimoine culturel malgache. Découvrez, apprenez, partagez.
          </p>

          {/* Platform badges */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '24px', flexWrap: 'wrap' }}>
            <div style={{
              padding: '8px 14px', borderRadius: '10px',
              background: 'var(--bg-raised)', border: '1px solid var(--bg-border)',
              fontSize: '11px', color: 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <Smartphone size={14} /> Mobile
            </div>
            <div style={{
              padding: '8px 14px', borderRadius: '10px',
              background: 'var(--bg-raised)', border: '1px solid var(--bg-border)',
              fontSize: '11px', color: 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <Globe size={14} /> Web
            </div>
          </div>
        </div>

        {/* Link columns */}
        {FOOTER_COLS.map((col) => (
          <div key={col.title}>
            <div style={{
              fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: 'var(--text-muted)',
              fontFamily: 'DM Sans', marginBottom: '16px',
            }}>
              {col.title}
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '11px' }}>
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    style={{
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                      transition: 'color 150ms',
                      textDecoration: 'none',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom-bar" style={{
        borderTop: '1px solid var(--bg-border)',
        padding: 'clamp(12px, 3vw, 24px) clamp(16px, 5vw, 40px)',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '24px',
        maxWidth: '1480px',
        margin: '0 auto',
        fontSize: '12px',
        color: 'var(--text-muted)',
      }}>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <span>© 2026 StreamMG — Licence 3</span>
          <span style={{ color: 'rgba(53,132,228,0.5)', fontWeight: 600 }}>Patrimoine malagasy</span>
        </div>

        {/* Social Links */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <a href="#" style={{ color: 'var(--text-muted)', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#1877F2'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'} title="Facebook">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
          </a>
          <a href="#" style={{ color: 'var(--text-muted)', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#1DA1F2'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'} title="Twitter">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
          </a>
          <a href="#" style={{ color: 'var(--text-muted)', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#E4405F'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'} title="Instagram">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
            </svg>
          </a>
          <a href="#" style={{ color: 'var(--text-muted)', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#FF0000'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'} title="YouTube">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.42a2.78 2.78 0 0 0-1.94 2C1 8.14 1 12 1 12s0 3.86.42 5.58a2.78 2.78 0 0 0 1.94 2c1.72.42 8.6.42 8.6.42s6.88 0 8.6-.42a2.78 2.78 0 0 0 1.94-2C23 15.86 23 12 23 12s0-3.86-.42-5.58z"></path><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"></polygon></svg>
          </a>
          <a href="#" style={{ color: 'var(--text-muted)', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--primary-light)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'} title="Contact"><Mail size={18} /></a>
        </div>
      </div>
    </footer>
  );
}
