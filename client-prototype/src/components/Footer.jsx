import React from 'react';
import { Link } from 'react-router-dom';

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
      marginTop: '64px',
    }}>
      {/* Main footer grid */}
      <div style={{
        maxWidth: '1480px',
        margin: '0 auto',
        padding: '56px 40px 40px',
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr 1fr',
        gap: '48px',
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
          <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
            <div style={{
              padding: '8px 14px', borderRadius: '10px',
              background: 'var(--bg-raised)', border: '1px solid var(--bg-border)',
              fontSize: '11px', color: 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <span>📱</span> Application mobile
            </div>
            <div style={{
              padding: '8px 14px', borderRadius: '10px',
              background: 'var(--bg-raised)', border: '1px solid var(--bg-border)',
              fontSize: '11px', color: 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <span>🌐</span> Web
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
      <div style={{
        borderTop: '1px solid var(--bg-border)',
        padding: '18px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: '1480px',
        margin: '0 auto',
        fontSize: '12px',
        color: 'var(--text-muted)',
      }}>
        <span>© 2026 StreamMG — Licence 3 Génie Logiciel, Université d'Antananarivo</span>
        <span style={{ color: 'var(--primary-light)' }}>Construit pour le patrimoine malagasy ❤</span>
      </div>
    </footer>
  );
}
