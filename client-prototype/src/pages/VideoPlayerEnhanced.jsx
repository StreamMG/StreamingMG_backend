import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import Hls from 'hls.js';
import {
  ArrowLeft, Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  AlertCircle, Star, ShoppingCart, Clock, Share2,
  ChevronRight
} from 'lucide-react';
import api from '../api';

export default function VideoPlayerEnhanced() {
  const { id } = useParams();
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hlsRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const indicatorTimeoutRef = useRef(null);

  const [content, setContent] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [accessError, setAccessError] = useState(null);
  const [buffered, setBuffered] = useState(0);
  const [showIndicator, setShowIndicator] = useState(null); // { type: string, value: string, IconComponent: Component }
  const [isHoveringProgress, setIsHoveringProgress] = useState(false);

  /* ─── Helpers ─── */
  const formatTime = useCallback((s) => {
    if (!s || isNaN(s)) return '0:00';
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`;
  }, []);

  const getImageUrl = useCallback((path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${import.meta.env.VITE_BASE_URL}${path}`;
  }, []);

  /* ─── Handlers ─── */
  const triggerIndicator = useCallback((type, value, IconComponent) => {
    setShowIndicator({ type, value, IconComponent });
    clearTimeout(indicatorTimeoutRef.current);
    indicatorTimeoutRef.current = setTimeout(() => setShowIndicator(null), 800);
  }, []);

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  }, [isPlaying]);

  const togglePlay = useCallback(async () => {
    if (!videoRef.current) return;
    try {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
        triggerIndicator('play', 'Pause', Pause);
      } else {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          await playPromise;
        }
        setIsPlaying(true);
        triggerIndicator('play', 'Lecture', Play);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Playback error:', err);
      }
    }
    showControlsTemporarily();
  }, [isPlaying, triggerIndicator, showControlsTemporarily]);

  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;
    setCurrentTime(time);
    if (videoRef.current.buffered.length > 0)
      setBuffered(videoRef.current.buffered.end(videoRef.current.buffered.length - 1));
  }, []);

  const handleSeek = useCallback((e) => {
    const val = Number(e.target.value);
    setCurrentTime(val);
    if (videoRef.current) videoRef.current.currentTime = val;
  }, []);

  const handleVolumeChange = useCallback((val) => {
    const v = Number(val);
    setVolume(v);
    setIsMuted(v === 0);
    if (videoRef.current) {
      videoRef.current.volume = v;
      videoRef.current.muted = v === 0;
    }
  }, []);

  const handleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen?.();
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen?.();
      }
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  const loadContent = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/contents/${id}`);
      setContent(res.data.content);
      api.post(`/contents/${id}/view`).catch(() => { });
    } catch (err) {
      if (err.response?.status === 403) setAccessError(err.response.data);
      else setError('Impossible de charger le contenu');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const initPlayer = useCallback(async () => {
    try {
      if (content.type === 'video') {
        const tokenRes = await api.get(`/hls/${id}/token`);
        const { hlsUrl } = tokenRes.data;
        const fullUrl = `${import.meta.env.VITE_BASE_URL}${hlsUrl}`;
        if (Hls.isSupported()) {
          const hls = new Hls({
            xhrSetup: function (xhr) {
              xhr.withCredentials = true;
            },
            startLevel: -1,
            capLevelToPlayerSize: true,
            lowLatencyMode: true,
            maxBufferLength: 30,
            maxMaxBufferLength: 60,
            maxBufferSize: 50 * 1000 * 1000,
            enableWorker: true,
          });
          hlsRef.current = hls;
          hls.loadSource(fullUrl);
          hls.attachMedia(videoRef.current);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            // Reprise de la position si nécessaire (non implémenté ici car MiniPlayer supprimé)
          });
        } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
          videoRef.current.src = fullUrl;
        }
      } else {
        // AUDIO WEB TOKEN FLOW (Doc API § Audio 2 & 3)
        // Sécurité maximale : Le token est transmis via un cookie httpOnly 'audioToken_{id}'
        // Ce cookie est positionné par le backend lors de l'appel à /web-token.
        try {
          const webRes = await api.get(`/audio/${id}/web-token?_t=${Date.now()}`);
          const { streamUrl } = webRes.data;
          const fullUrl = `${import.meta.env.VITE_BASE_URL}${streamUrl}`;

          if (videoRef.current) {
            videoRef.current.crossOrigin = 'use-credentials'; // REQUIS pour envoyer les cookies httpOnly
            videoRef.current.src = fullUrl;
            videoRef.current.load();
          }
        } catch (err) {
          console.error('Audio stream initialization failed:', err);
          setError('Impossible d\'initialiser le flux audio sécurisé');
        }
      }
    } catch {
      setError('Impossible de charger le lecteur');
    }
  }, [content, id]);

  /* ─── Effects ─── */
  useEffect(() => {
    loadContent();
    return () => { hlsRef.current?.destroy(); };
  }, [loadContent]);

  useEffect(() => {
    if (!content || !videoRef.current) return;
    initPlayer();
  }, [content, initPlayer]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k': {
          e.preventDefault();
          togglePlay();
          break;
        }
        case 'f': {
          e.preventDefault();
          handleFullscreen();
          break;
        }
        case 'm': {
          e.preventDefault();
          const newMuted = !isMuted;
          setIsMuted(newMuted);
          if (videoRef.current) videoRef.current.muted = newMuted;
          triggerIndicator('volume', newMuted ? 'Muet' : 'Activé', newMuted ? VolumeX : Volume2);
          break;
        }
        case 'arrowleft':
        case 'j': {
          e.preventDefault();
          const seekBack = Math.max(0, videoRef.current.currentTime - 10);
          videoRef.current.currentTime = seekBack;
          setCurrentTime(seekBack);
          triggerIndicator('seek', '-10s', ArrowLeft);
          break;
        }
        case 'arrowright':
        case 'l': {
          e.preventDefault();
          const seekForward = Math.min(duration, videoRef.current.currentTime + 10);
          videoRef.current.currentTime = seekForward;
          setCurrentTime(seekForward);
          triggerIndicator('seek', '+10s', ChevronRight);
          break;
        }
        case 'arrowup': {
          e.preventDefault();
          const volUp = Math.min(1, volume + 0.1);
          handleVolumeChange(volUp);
          triggerIndicator('volume', `${Math.round(volUp * 100)}%`, Volume2);
          break;
        }
        case 'arrowdown': {
          e.preventDefault();
          const volDown = Math.max(0, volume - 0.1);
          handleVolumeChange(volDown);
          triggerIndicator('volume', `${Math.round(volDown * 100)}%`, volDown === 0 ? VolumeX : Volume2);
          break;
        }
        default: {
          if (e.key >= '0' && e.key <= '9') {
            const percent = parseInt(e.key) * 10;
            const seekPos = (duration * percent) / 100;
            if (videoRef.current) videoRef.current.currentTime = seekPos;
            setCurrentTime(seekPos);
            triggerIndicator('seek', `${percent}%`, Clock);
          }
          break;
        }
      }
      showControlsTemporarily();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isMuted, volume, duration, isFullscreen, togglePlay, handleFullscreen, triggerIndicator, handleVolumeChange, showControlsTemporarily]);

  /* ─── Render Logic ─── */
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', flexDirection: 'column', gap: '16px' }}>
      <div className="loading-spinner" />
      <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Chargement du contenu...</p>
    </div>
  );

  if (accessError) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', padding: '24px' }}>
      <div style={{ textAlign: 'center', maxWidth: '440px', background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: '24px', padding: '48px 40px' }}>
        <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: 'rgba(237,51,59,0.1)', border: '1px solid rgba(237,51,59,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: '32px' }}>🔒</div>
        <h2 style={{ fontFamily: 'Sora', fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>Contenu protégé</h2>
        {accessError.reason === 'subscription_required' && (
          <>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '28px', lineHeight: '1.6' }}>Ce contenu nécessite un abonnement Premium.</p>
            <Link to="/subscribe" className="btn btn-primary" style={{ width: '100%', height: '48px', borderRadius: '12px', justifyContent: 'center' }}><Star size={18} /> Souscrire au Premium</Link>
          </>
        )}
        {accessError.reason === 'purchase_required' && (
          <>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '8px', lineHeight: '1.6' }}>Ce contenu est disponible à l'achat.</p>
            <p style={{ fontFamily: 'Sora', fontSize: '28px', fontWeight: 800, color: 'var(--teal)', marginBottom: '28px' }}>{accessError.price / 1000}k Ar</p>
            <Link to={`/purchase?contentId=${id}&type=purchase`} className="btn btn-teal" style={{ width: '100%', height: '48px', borderRadius: '12px', justifyContent: 'center' }}><ShoppingCart size={18} /> Acheter ce contenu</Link>
          </>
        )}
        {accessError.reason === 'login_required' && (
          <>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '28px' }}>Connectez-vous pour accéder.</p>
            <Link to="/login" className="btn btn-primary" style={{ width: '100%', height: '48px', borderRadius: '12px', justifyContent: 'center' }}>Se connecter</Link>
          </>
        )}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '16px', fontSize: '13px', color: 'var(--text-muted)' }}><ArrowLeft size={14} /> Retour au catalogue</Link>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '70vh' }}>
      <div style={{ textAlign: 'center', color: 'var(--error)' }}>
        <AlertCircle size={48} style={{ margin: '0 auto 16px' }} />
        <p>{error}</p>
        <Link to="/" className="btn btn-secondary" style={{ marginTop: '16px' }}><ArrowLeft size={16} /> Retour</Link>
      </div>
    </div>
  );

  return (
    <div className="player-wrapper" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 32px' }}>
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}><ArrowLeft size={16} /> Retour au catalogue</Link>

      <div
        ref={containerRef}
        className="player-container"
        style={{
          position: 'relative', background: '#000', borderRadius: '16px',
          overflow: 'hidden', aspectRatio: content?.type === 'audio' ? '21/4' : '16/9',
          cursor: showControls ? 'default' : 'none'
        }}
        onMouseMove={showControlsTemporarily}
        onMouseLeave={() => isPlaying && setShowControls(false)}
      >
        {/* Main Video/Audio element */}
        {content?.type === 'audio' ? (
          <div className="audio-player-overlay" style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: '24px', padding: '24px',
            background: 'linear-gradient(135deg, var(--bg-surface), var(--bg-raised))'
          }}>
            <img src={getImageUrl(content.thumbnail)} alt="" className={`audio-player-thumb ${isPlaying ? 'animate-pulse' : 'opacity-80'}`} style={{ width: '100px', height: '100px', borderRadius: '16px', objectFit: 'cover', flexShrink: 0, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }} />
            <div style={{ flex: 1 }}>
              <div className="audio-player-title" style={{ fontFamily: 'Sora', fontSize: '22px', fontWeight: 800, marginBottom: '4px' }}>{content.title}</div>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{content.category} • {content.artist}</div>
            </div>
          </div>
        ) : (
          <video
            ref={videoRef}
            style={{ width: '100%', height: '100%', display: 'block', cursor: 'pointer' }}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            onClick={togglePlay}
            onDoubleClick={handleFullscreen}
          />
        )}

        {/* Visual Indicator Overlay */}
        {showIndicator && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            background: 'rgba(0,0,0,0.6)', padding: '20px', borderRadius: '50%',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
            color: 'white', pointerEvents: 'none', zIndex: 10,
            animation: 'fadeInOut 0.8s ease-in-out'
          }}>
            <showIndicator.IconComponent size={32} />
            <span style={{ fontSize: '14px', fontWeight: 700 }}>{showIndicator.value}</span>
          </div>
        )}

        {/* Big play button overlay */}
        {!isPlaying && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', pointerEvents: 'none' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(53,132,228,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 40px rgba(53,132,228,0.4)', transition: 'transform 0.2s' }}>
              <Play size={36} fill="white" color="white" style={{ marginLeft: '4px' }} />
            </div>
          </div>
        )}

        {/* Controls overlay */}
        <div className="controls-overlay" style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
          padding: '40px 24px 20px',
          opacity: showControls ? 1 : 0,
          transition: 'opacity 300ms, transform 300ms',
          transform: showControls ? 'translateY(0)' : 'translateY(10px)',
          display: 'flex', flexDirection: 'column', gap: '16px'
        }} onClick={e => e.stopPropagation()}>

          {/* Progress bar enhanced */}
          <div
            style={{ position: 'relative', height: isHoveringProgress ? '6px' : '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '9999px', cursor: 'pointer', transition: 'height 0.1s' }}
            onMouseEnter={() => setIsHoveringProgress(true)}
            onMouseLeave={() => setIsHoveringProgress(false)}
          >
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(buffered / duration) * 100}%`, background: 'rgba(255,255,255,0.15)', borderRadius: '9999px' }} />
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(currentTime / duration) * 100}%`, background: 'var(--primary)', borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              {isHoveringProgress && <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'white', marginRight: '-6px', boxShadow: '0 0 10px rgba(0,0,0,0.5)' }} />}
            </div>
            <input type="range" min={0} max={duration || 100} value={currentTime} onChange={handleSeek} style={{ position: 'absolute', inset: 0, width: '100%', opacity: 0, cursor: 'pointer', height: '100%' }} />
          </div>

          <div className="controls-row" style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <button onClick={togglePlay} className="control-btn" style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px', transition: 'transform 0.1s' }} onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'} onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>
              {isPlaying ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" />}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '120px' }}>
              <button onClick={() => handleVolumeChange(isMuted ? (volume || 0.5) : 0)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}>
                {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <input type="range" min={0} max={1} step={0.05} value={isMuted ? 0 : volume} onChange={e => handleVolumeChange(e.target.value)} style={{ width: '70px', accentColor: 'var(--primary)', cursor: 'pointer' }} />
            </div>

            <span style={{ fontSize: '13px', color: 'white', fontWeight: 500, fontFamily: 'DM Sans, sans-serif' }}>
              {formatTime(currentTime)} <span style={{ opacity: 0.5 }}>/</span> {formatTime(duration)}
            </span>

            <div style={{ flex: 1 }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 600, textTransform: 'uppercase' }}>Vitesse</span>
              <select value={playbackRate} onChange={e => { const v = Number(e.target.value); setPlaybackRate(v); if (videoRef.current) videoRef.current.playbackRate = v; }} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '12px', fontWeight: 700, cursor: 'pointer', outline: 'none' }}>
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map(r => <option key={r} value={r} style={{ background: 'var(--bg-surface)' }}>{r}x</option>)}
              </select>
            </div>

            <button onClick={handleFullscreen} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}>{isFullscreen ? <Minimize size={22} /> : <Maximize size={22} />}</button>
          </div>
        </div>

        <audio ref={content?.type === 'audio' ? videoRef : undefined} preload="auto" onTimeUpdate={handleTimeUpdate} onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} />
      </div>

      {content && (
        <div className="player-info-grid" style={{ marginTop: '40px', display: 'grid', gridTemplateColumns: '1fr auto', gap: '48px', alignItems: 'start' }}>
          <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              {content.accessType === 'premium' && <span className="badge badge-premium" style={{ padding: '4px 10px', fontSize: '11px' }}>★ Premium</span>}
              {content.accessType === 'paid' && <span className="badge badge-paid" style={{ padding: '4px 10px', fontSize: '11px' }}>{content.price / 1000}k Ar</span>}
              <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>{content.category}</span>
              <span style={{ fontSize: '14px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={14} /> {formatTime(content.duration)}</span>
            </div>
            <h1 style={{ fontFamily: 'Sora', fontSize: '32px', fontWeight: 800, marginBottom: '16px', lineHeight: 1.2, letterSpacing: '-0.02em' }}>{content.title}</h1>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8', fontSize: '16px', maxWidth: '800px' }}>{content.description}</p>
            {content.artist && (
              <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white' }}>{content.artist.substring(0, 1)}</div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{content.artist}</div>
                  {content.album && <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{content.album}</div>}
                </div>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '180px' }}>
            <button onClick={() => navigator.share?.({ title: content.title, url: window.location.href }).catch(() => navigator.clipboard?.writeText(window.location.href))} className="btn btn-secondary" style={{ borderRadius: '12px', height: '46px', justifyContent: 'center', gap: '10px', fontSize: '14px' }}><Share2 size={18} /> Partager</button>
          </div>
        </div>
      )}
    </div>
  );
}
