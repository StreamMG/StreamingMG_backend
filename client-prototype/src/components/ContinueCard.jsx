import React from 'react';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';

/**
 * ContinueCard — Carte "Continuer à regarder" fidèle à la maquette v2
 * Layout horizontal : thumbnail 78x78 + info + progress bar
 */

const BASE_URL = import.meta.env.VITE_BASE_URL;

function getImageUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${BASE_URL}${path}`;
}

export default function ContinueCard({ item }) {
  if (!item || !item.content) return null;

  const { content } = item;
  const progressPct = content.duration
    ? Math.round((item.progress / content.duration) * 100)
    : 0;
  const remaining = content.duration ? content.duration - item.progress : 0;
  const remainingMin = Math.max(1, Math.round(remaining / 60));

  return (
    <Link
      to={`/watch/${content._id}`}
      style={{
        flex: '0 0 300px',
        width: '300px',
        background: 'var(--bg-surface)',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.05)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'border-color 200ms, transform 200ms, box-shadow 200ms',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        textDecoration: 'none',
        color: 'inherit',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(53,132,228,0.3)';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Thumbnail */}
      <div style={{
        flex: '0 0 78px',
        width: '78px',
        height: '78px',
        borderRadius: '10px',
        overflow: 'hidden',
        background: 'var(--bg-raised)',
        position: 'relative',
      }}>
        <img
          src={getImageUrl(content.thumbnail)}
          alt={content.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 300ms ease',
          }}
        />
        {/* Play icon overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(13,16,24,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0,
          transition: 'opacity 200ms',
        }}
          className="continue-play-icon"
        >
          <Play size={16} fill="white" color="white" />
        </div>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: "'Sora', sans-serif",
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          marginBottom: '3px',
        }}>
          {content.title}
        </div>

        <div style={{
          fontSize: '12px',
          color: 'var(--text-muted)',
          marginBottom: '8px',
        }}>
          {content.type === 'video' ? 'Vidéo' : 'Audio'} · {remainingMin} min restants
        </div>

        {/* Progress bar */}
        <div style={{
          height: '3px',
          background: 'var(--bg-overlay)',
          borderRadius: '9999px',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${Math.min(progressPct, 100)}%`,
            background: 'linear-gradient(90deg, var(--primary), var(--primary-light))',
            borderRadius: '9999px',
          }} />
        </div>
      </div>
    </Link>
  );
}
