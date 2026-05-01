import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Info } from 'lucide-react';
import { AccessBadge } from './Badge';

/**
 * Hero — Section hero full viewport fidèle à la maquette v2
 * - Full viewport avec background image + triple gradient overlay
 * - Eyebrow animé + titre 56px + description + boutons CTA
 * - 3 poster cards à droite (slideRight animation)
 * - Scroll indicator animé en bas
 */

const BASE_URL = import.meta.env.VITE_BASE_URL;

function getImageUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${BASE_URL}${path}`;
}

function formatDuration(seconds) {
  if (!seconds) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}min` : `${m} min`;
}

export default function Hero({ mainContent, sideContents = [] }) {
  if (!mainContent) return null;

  return (
    <section style={{
      position: 'relative',
      height: '100vh',
      minHeight: '600px',
      maxHeight: '900px',
      overflow: 'hidden',
    }}>
      {/* ── Background image ── */}
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
      }}>
        <img
          src={getImageUrl(mainContent.thumbnail)}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'brightness(0.5) saturate(1.2)',
          }}
        />
      </div>

      {/* ── Triple gradient overlays ── */}
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 1,
        background: 'linear-gradient(to top, var(--bg-base) 0%, rgba(13,16,24,0.7) 40%, rgba(13,16,24,0.3) 100%)',
      }} />
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 1,
        background: 'linear-gradient(to right, var(--bg-base) 0%, transparent 60%)',
      }} />

      {/* ── Ambient glow ── */}
      <div style={{
        position: 'absolute',
        top: '-15%',
        left: '-5%',
        width: '50%',
        height: '60%',
        borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(53,132,228,0.15) 0%, transparent 70%)',
        filter: 'blur(80px)',
        zIndex: 1,
        pointerEvents: 'none',
      }} />

      {/* ── Main content (left side) ── */}
      <div style={{
        position: 'absolute',
        bottom: '14%',
        left: '48px',
        zIndex: 5,
        maxWidth: '560px',
      }}>
        {/* Eyebrow */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '18px',
          animation: 'fadeUp 600ms ease-out',
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'var(--primary)',
            animation: 'pulse 2s infinite',
          }} />
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--primary-light)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}>
            À la une aujourd'hui
          </span>
        </div>

        {/* Title */}
        <h1 style={{
          fontFamily: "'Sora', sans-serif",
          fontSize: 'clamp(32px, 4vw, 56px)',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          lineHeight: 1.05,
          color: 'var(--text-primary)',
          marginBottom: '16px',
          animation: 'fadeUp 600ms ease-out 100ms backwards',
        }}>
          {mainContent.title}
        </h1>

        {/* Description */}
        <p style={{
          fontSize: '15px',
          lineHeight: 1.65,
          color: 'var(--text-secondary)',
          maxWidth: '480px',
          marginBottom: '20px',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          animation: 'fadeUp 600ms ease-out 200ms backwards',
        }}>
          {mainContent.description}
        </p>

        {/* Meta */}
        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          marginBottom: '28px',
          animation: 'fadeUp 600ms ease-out 250ms backwards',
        }}>
          <AccessBadge content={mainContent} />
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {formatDuration(mainContent.duration)}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {mainContent.category}
          </span>
        </div>

        {/* CTA buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          animation: 'fadeUp 600ms ease-out 300ms backwards',
        }}>
          <Link
            to={`/watch/${mainContent._id}`}
            style={{
              height: '50px',
              padding: '0 32px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))',
              color: 'white',
              fontSize: '15px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              textDecoration: 'none',
              boxShadow: '0 4px 24px rgba(53,132,228,0.5)',
              transition: 'transform 150ms, box-shadow 150ms',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(53,132,228,0.6)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 24px rgba(53,132,228,0.5)';
            }}
          >
            <Play size={18} fill="currentColor" /> Regarder
          </Link>

          <Link
            to={`/watch/${mainContent._id}`}
            style={{
              height: '50px',
              padding: '0 24px',
              borderRadius: '16px',
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              fontWeight: 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              textDecoration: 'none',
              transition: 'background 150ms, border-color 150ms',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
            }}
          >
            <Info size={18} /> Plus d'infos
          </Link>
        </div>
      </div>

      {/* ── Poster cards (right side) ── */}
      {sideContents.length > 0 && (
        <div style={{
          position: 'absolute',
          right: '48px',
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          gap: '16px',
          zIndex: 4,
          alignItems: 'flex-end',
        }}>
          {sideContents.slice(0, 3).map((item, index) => {
            const widths = ['160px', '190px', '160px'];
            const offsets = ['10px', '0px', '20px'];
            return (
              <Link
                key={item._id}
                to={`/watch/${item._id}`}
                style={{
                  width: widths[index] || '160px',
                  borderRadius: '24px',
                  overflow: 'hidden',
                  position: 'relative',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'var(--bg-surface)',
                  transition: 'transform 300ms ease, box-shadow 300ms ease',
                  textDecoration: 'none',
                  color: 'inherit',
                  marginTop: offsets[index] || '0px',
                  animation: `fadeUp 500ms ease-out ${400 + index * 120}ms backwards`,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.6)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  aspectRatio: '2/3',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  <img
                    src={getImageUrl(item.thumbnail)}
                    alt={item.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 400ms ease',
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  />
                  {/* Badge */}
                  <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 3 }}>
                    <AccessBadge content={item} />
                  </div>
                  {/* Bottom gradient */}
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(to top, rgba(23,27,38,0.95) 0%, transparent 100%)',
                    padding: '16px 12px 12px',
                  }}>
                    <div style={{
                      fontFamily: "'Sora', sans-serif",
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {item.title}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                    }}>
                      {formatDuration(item.duration)}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* ── Scroll indicator ── */}
      <div style={{
        position: 'absolute',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 5,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        animation: 'fadeUp 600ms ease-out 800ms backwards',
      }}>
        <span style={{
          fontSize: '10px',
          fontWeight: 500,
          color: 'var(--text-muted)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>
          Découvrir
        </span>
        <div style={{
          width: '20px',
          height: '32px',
          border: '1.5px solid var(--text-muted)',
          borderRadius: '9999px',
          display: 'flex',
          justifyContent: 'center',
          paddingTop: '6px',
        }}>
          <div style={{
            width: '3px',
            height: '8px',
            background: 'var(--text-muted)',
            borderRadius: '9999px',
            animation: 'scrollIndicator 1.5s ease-in-out infinite',
          }} />
        </div>
      </div>
    </section>
  );
}
