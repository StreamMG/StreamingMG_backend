import React from 'react';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';
import { AccessBadge } from './Badge';

/**
 * ContentCard — Carte de contenu fidèle à la maquette v2
 * 
 * Variants :
 *  - portrait (default) : 170px, aspect 2:3 (padding-top 143%)
 *  - wide : 256px, aspect 16:9 (padding-top 56.25%)
 *  - tutorial : 188px, avec progress bar
 */

const BASE_URL = import.meta.env.VITE_BASE_URL;

function getImageUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${BASE_URL}${path}`;
}

function formatDuration(seconds) {
  if (!seconds) return '--:--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}min` : `${m} min`;
}

export default function ContentCard({
  content,
  variant = 'portrait',
  progress = null,  // 0-100 pour tutoriels
  style: extraStyle,
}) {
  if (!content) return null;

  const isWide = variant === 'wide';
  const isTutorial = variant === 'tutorial';

  const cardWidth = isWide ? '256px' : isTutorial ? '188px' : '170px';
  const thumbPaddingTop = isWide ? '56.25%' : '143%';

  return (
    <Link
      to={`/watch/${content._id}`}
      style={{
        flex: `0 0 ${cardWidth}`,
        width: cardWidth,
        background: 'var(--bg-surface)',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.05)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 250ms ease-out, box-shadow 250ms ease-out, border-color 250ms ease-out',
        position: 'relative',
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
        ...extraStyle,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-6px)';
        e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(53,132,228,0.25)';
        e.currentTarget.style.borderColor = 'transparent';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
      }}
    >
      {/* Thumbnail */}
      <div style={{
        position: 'relative',
        width: '100%',
        paddingTop: thumbPaddingTop,
        overflow: 'hidden',
        background: 'var(--bg-raised)',
      }}>
        <img
          src={getImageUrl(content.thumbnail)}
          alt={content.title}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 450ms ease-out',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.07)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        />

        {/* Gradient overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(23,27,38,0.9) 0%, rgba(23,27,38,0) 50%)',
          pointerEvents: 'none',
          zIndex: 1,
        }} />

        {/* Badge */}
        <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 3 }}>
          <AccessBadge content={content} />
        </div>

        {/* Play overlay */}
        <div className="content-card-play-overlay" style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(13,16,24,0)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2,
          transition: 'background 250ms',
        }}>
          <div className="content-card-play-btn" style={{
            width: '44px',
            height: '44px',
            borderRadius: '9999px',
            background: 'rgba(53,132,228,0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0,
            transform: 'scale(0.7)',
            transition: 'opacity 250ms, transform 250ms',
            boxShadow: '0 4px 20px rgba(53,132,228,0.6)',
          }}>
            <Play size={14} fill="white" color="white" />
          </div>
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: '12px 12px 16px' }}>
        <div style={{
          fontFamily: "'Sora', sans-serif",
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          lineHeight: 1.3,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          marginBottom: '4px',
        }}>
          {content.title}
        </div>

        <div style={{
          fontSize: '11px',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          {content.category && <span>{content.category}</span>}
          {content.category && content.duration && <span>·</span>}
          {content.duration && <span>{formatDuration(content.duration)}</span>}
          {isTutorial && content.totalLessons && (
            <span>{content.totalLessons} leçons</span>
          )}
        </div>

        {/* Progress bar (tutorial) */}
        {progress !== null && (
          <div style={{
            marginTop: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <div style={{
              flex: 1,
              height: '3px',
              background: 'var(--bg-overlay)',
              borderRadius: '9999px',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${progress}%`,
                background: 'linear-gradient(90deg, var(--primary), var(--primary-light))',
                borderRadius: '9999px',
                transition: 'width 600ms ease',
              }} />
            </div>
            <span style={{
              fontSize: '10px',
              fontWeight: 600,
              color: 'var(--primary-light)',
              minWidth: '26px',
              textAlign: 'right',
            }}>
              {progress}%
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
