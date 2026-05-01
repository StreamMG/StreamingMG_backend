import React from 'react';
import { usePlayer } from '../context/PlayerContext';
import { Play, Pause, SkipBack, SkipForward, Volume2, X, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

const BASE_URL = import.meta.env.VITE_BASE_URL;

function getImageUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${BASE_URL}${path}`;
}

export default function MiniPlayer() {
  const { currentTrack, isPlaying, togglePlay, closePlayer, progress, volume, setVolume } = usePlayer();

  if (!currentTrack) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 48px)',
      maxWidth: '1200px',
      height: '72px',
      background: 'rgba(23, 27, 38, 0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid var(--bg-border)',
      borderRadius: '16px',
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      gap: '24px',
      zIndex: 1000,
      boxShadow: '0 20px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset',
      animation: 'fadeUp 0.3s ease-out',
    }}>
      {/* Progress Bar (Top edge) */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '16px',
        right: '16px',
        height: '2px',
        background: 'rgba(255,255,255,0.1)',
        cursor: 'pointer',
      }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: 'var(--primary)',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute',
            right: '-4px',
            top: '-3px',
            width: '8px',
            height: '8px',
            background: 'white',
            borderRadius: '50%',
            boxShadow: '0 0 10px rgba(53,132,228,0.8)',
          }} />
        </div>
      </div>

      {/* Info: Thumb + Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
        <img
          src={getImageUrl(currentTrack.thumbnail)}
          alt={currentTrack.title}
          style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }}
        />
        <div style={{ minWidth: 0 }}>
          <Link to={`/watch/${currentTrack._id}`} style={{
            fontFamily: "'Sora', sans-serif",
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            textDecoration: 'none',
            display: 'block',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {currentTrack.title}
          </Link>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {currentTrack.category} {currentTrack.provider ? `· ${currentTrack.provider.username}` : ''}
          </div>
        </div>
        <button style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: '4px',
          marginLeft: '8px',
        }}>
          <Heart size={16} />
        </button>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '4px' }}>
          <SkipBack size={20} fill="currentColor" />
        </button>
        <button
          onClick={togglePlay}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'var(--text-primary)',
            color: 'var(--bg-base)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'transform 100ms',
          }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" style={{ marginLeft: '2px' }} />}
        </button>
        <button style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '4px' }}>
          <SkipForward size={20} fill="currentColor" />
        </button>
      </div>

      {/* Extras: Volume + Close */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, justifyContent: 'flex-end' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Volume2 size={16} color="var(--text-muted)" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            style={{ width: '80px', accentColor: 'var(--text-primary)' }}
          />
        </div>
        <button
          onClick={closePlayer}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
            marginLeft: '8px',
          }}
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
