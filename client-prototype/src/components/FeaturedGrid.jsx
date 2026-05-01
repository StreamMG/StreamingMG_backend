import React from 'react';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';
import { AccessBadge } from './Badge';

/**
 * FeaturedGrid — Grille documentaires à la une, fidèle maquette v2
 * Layout : grid 2 cols (1.8fr 1fr), main-feat spans 2 rows, height 380px
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

function FeaturedCard({ content, isMain }) {
  return (
    <Link
      to={`/watch/${content._id}`}
      style={{
        position: 'relative',
        borderRadius: '32px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 220ms ease-out, box-shadow 220ms ease-out',
        border: '1px solid rgba(255,255,255,0.05)',
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
        ...(isMain ? { gridRow: '1 / 3' } : {}),
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 20px 50px rgba(0,0,0,0.65)';
        e.currentTarget.style.borderColor = 'rgba(53,132,228,0.2)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
      }}
    >
      {/* Background image */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <img
          src={getImageUrl(content.thumbnail)}
          alt={content.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 400ms ease',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        />
      </div>

      {/* Overlay gradient */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to top, rgba(13,16,24,0.94) 0%, rgba(13,16,24,0.4) 50%, transparent 100%)',
      }} />

      {/* Content */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 2,
        padding: '20px',
      }}>
        <div style={{
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--primary-light)',
          marginBottom: '8px',
        }}>
          {content.category || 'Documentaire'}
        </div>

        <div style={{
          fontFamily: "'Sora', sans-serif",
          fontSize: isMain ? '21px' : '15px',
          fontWeight: 700,
          letterSpacing: '-0.025em',
          color: 'var(--text-primary)',
          lineHeight: 1.18,
          marginBottom: isMain ? '12px' : '8px',
        }}>
          {content.title}
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <AccessBadge content={content} />
          <span style={{ fontSize: isMain ? '12px' : '11px', color: 'var(--text-secondary)' }}>
            {formatDuration(content.duration)}
          </span>

          {isMain && (
            <button
              style={{
                height: '32px',
                padding: '0 16px',
                background: 'var(--primary)',
                color: 'white',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'background 150ms',
                marginLeft: 'auto',
                boxShadow: '0 2px 12px rgba(53,132,228,0.5)',
                border: 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-light)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--primary)'}
            >
              <Play size={10} fill="white" color="white" />
              Regarder
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function FeaturedGrid({ items = [] }) {
  if (items.length === 0) return null;

  const main = items[0];
  const subs = items.slice(1, 3);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1.8fr 1fr',
      gridTemplateRows: '1fr 1fr',
      gap: '16px',
      height: '380px',
    }}>
      <FeaturedCard content={main} isMain />
      {subs.map(item => (
        <FeaturedCard key={item._id} content={item} isMain={false} />
      ))}
    </div>
  );
}
