import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Hls from 'hls.js';
import { useRef } from 'react';
import {
  ArrowLeft, Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  AlertCircle, Lock, Star, ShoppingCart, Clock, Share2,
  Download, ChevronRight, ChevronDown
} from 'lucide-react';
import api from '../api';
import { usePlayer } from '../context/PlayerContext';

export default function VideoPlayerEnhanced() {
  const { id } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hlsRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  const { playTrack } = usePlayer();

  const [content, setContent] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [playerReady, setPlayerReady] = useState(false);
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

  useEffect(() => { loadContent(); return () => { hlsRef.current?.destroy(); }; }, [id]);

  const loadContent = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/contents/${id}`);
      setContent(res.data.content);
      api.post(`/contents/${id}/view`).catch(() => {});
    } catch (err) {
      if (err.response?.status === 403) setAccessError(err.response.data);
      else setError('Impossible de charger le contenu');
      setLoading(false);
      return;
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!content || !videoRef.current) return;
    initPlayer();
  }, [content]);

  const initPlayer = async () => {
    try {
      if (content.type === 'video') {
        const tokenRes = await api.get(`/hls/${id}/token`);
        const { hlsUrl } = tokenRes.data;
        const fullUrl = `${import.meta.env.VITE_BASE_URL}${hlsUrl}`;
        if (Hls.isSupported()) {
          const hls = new Hls({
            xhrSetup: function (xhr, url) {
              xhr.withCredentials = true;
            },
            // 🚀 Optimisation Vidéo (HLS) - TTFF (Time To First Frame)
            startLevel: -1,            // Démarre sur la résolution la plus basse pour lancer la lecture instantanément
            capLevelToPlayerSize: true,// Ne télécharge jamais du 4K si le lecteur fait 800px de large (économie massive)
            lowLatencyMode: true,      // Réduit la latence de démarrage
            maxBufferLength: 30,       // Garde max 30s de vidéo en avance (évite le gâchis de data)
            maxMaxBufferLength: 60,    // Hard limite à 60s
            maxBufferSize: 50 * 1000 * 1000, // Limite la RAM à 50MB
            enableWorker: true,        // Utilise un Web Worker pour libérer le thread principal
          });
          hlsRef.current = hls;
          hls.loadSource(fullUrl);
          hls.attachMedia(videoRef.current);
          hls.on(Hls.Events.MANIFEST_PARSED, () => setPlayerReady(true));
        } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
          videoRef.current.src = fullUrl;
          setPlayerReady(true);
        }
      } else {
        // L'élément <audio> gérera les cookies si on utilise crossOrigin="use-credentials"
        // Cela permet de streamer le fichier directement (indispensable car le backend limite la vitesse à 150KB/s)
        const audioRes = await api.get(`/audio/${id}/web-token?_t=${Date.now()}`);
        const { streamUrl } = audioRes.data;
        const fullUrl = `${import.meta.env.VITE_BASE_URL}${streamUrl}`;

        // Libère le précédent blob (si existant)
        if (videoRef.current._blobUrl) {
          URL.revokeObjectURL(videoRef.current._blobUrl);
          videoRef.current._blobUrl = null;
        }
        
        // 🚀 Optimisation Audio : Stream direct avec cookies
        videoRef.current.crossOrigin = 'use-credentials';
        videoRef.current.preload = 'auto'; // Lance le buffer en arrière-plan dès l'assignation de l'URL
        videoRef.current.src = fullUrl;
        setPlayerReady(true);
      }
    } catch (err) {
      setError('Impossible de charger le lecteur');
    }
  };

  const showControlsTemporarily = () => {
    setShowControls(true);
    clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) { videoRef.current.pause(); setIsPlaying(false); }
    else { videoRef.current.play(); setIsPlaying(true); }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
    if (videoRef.current.buffered.length > 0)
      setBuffered(videoRef.current.buffered.end(videoRef.current.buffered.length - 1));
  };

  const handleSeek = (e) => {
    const val = Number(e.target.value);
    setCurrentTime(val);
    if (videoRef.current) videoRef.current.currentTime = val;
  };

  const handleVolumeChange = (val) => {
    const v = Number(val);
    setVolume(v);
    setIsMuted(v === 0);
    if (videoRef.current) videoRef.current.volume = v;
  };

  const handleFullscreen = () => {
    if (!isFullscreen) containerRef.current?.requestFullscreen();
    else document.exitFullscreen();
    setIsFullscreen(!isFullscreen);
  };

  const formatTime = (s) => {
    if (!s || isNaN(s)) return '0:00';
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`;
  };

  const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${import.meta.env.VITE_BASE_URL}${path}`;
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', flexDirection: 'column', gap: '16px' }}>
      <div className="loading-spinner" />
      <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Chargement du contenu...</p>
    </div>
  );

  if (accessError) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', padding: '24px' }}>
      <div style={{ textAlign: 'center', maxWidth: '440px', background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: '24px', padding: '48px 40px' }}>
        <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: 'rgba(237,51,59,0.1)', border: '1px solid rgba(237,51,59,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: '32px' }}>
          🔒
        </div>
        <h2 style={{ fontFamily: 'Sora', fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>Contenu protégé</h2>

        {accessError.reason === 'subscription_required' && (
          <>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '28px', lineHeight: '1.6' }}>Ce contenu nécessite un abonnement Premium.</p>
            <Link to="/subscribe" className="btn btn-primary" style={{ width: '100%', height: '48px', borderRadius: '12px', justifyContent: 'center' }}>
              <Star size={18} /> Souscrire au Premium
            </Link>
          </>
        )}
        {accessError.reason === 'purchase_required' && (
          <>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '8px', lineHeight: '1.6' }}>Ce contenu est disponible à l'achat.</p>
            <p style={{ fontFamily: 'Sora', fontSize: '28px', fontWeight: 800, color: 'var(--teal)', marginBottom: '28px' }}>{accessError.price / 1000}k Ar</p>
            <Link to={`/purchase?contentId=${id}&type=purchase`} className="btn btn-teal" style={{ width: '100%', height: '48px', borderRadius: '12px', justifyContent: 'center' }}>
              <ShoppingCart size={18} /> Acheter ce contenu
            </Link>
          </>
        )}
        {accessError.reason === 'login_required' && (
          <>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '28px' }}>Connectez-vous pour accéder.</p>
            <Link to="/login" className="btn btn-primary" style={{ width: '100%', height: '48px', borderRadius: '12px', justifyContent: 'center' }}>
              Se connecter
            </Link>
          </>
        )}

        <Link to="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
          <ArrowLeft size={14} /> Retour au catalogue
        </Link>
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
      {/* Back */}
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
        <ArrowLeft size={16} /> Retour au catalogue
      </Link>

      {/* Player */}
      <div
        ref={containerRef}
        style={{
          position: 'relative', background: '#000', borderRadius: '16px',
          overflow: 'hidden', aspectRatio: content?.type === 'audio' ? '21/4' : '16/9',
          cursor: 'none'
        }}
        onMouseMove={showControlsTemporarily}
        onMouseLeave={() => isPlaying && setShowControls(false)}
        onClick={togglePlay}
      >
        {content?.type === 'audio' ? (
          <div className="audio-overlay" style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: '24px', padding: '24px',
            background: 'linear-gradient(135deg, var(--bg-surface), var(--bg-raised))'
          }}>
            <img src={getImageUrl(content.thumbnail)} alt="" className={isPlaying ? '' : 'paused'} style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Sora', fontSize: '18px', fontWeight: 700 }}>{content.title}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{content.category}</div>
            </div>
          </div>
        ) : (
          <video
            ref={videoRef}
            style={{ width: '100%', height: '100%', display: 'block' }}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
          />
        )}

        {/* Thumbnail overlay si pas encore lancé */}
        {!isPlaying && !playerReady && content?.thumbnail && (
          <div style={{ position: 'absolute', inset: 0 }}>
            <img src={getImageUrl(content.thumbnail)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} />
          </div>
        )}

        {/* Big play button overlay */}
        {!isPlaying && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.3)'
          }}
            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
          >
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: 'rgba(53,132,228,0.9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 32px rgba(53,132,228,0.6)',
              transition: 'transform 150ms'
            }}>
              <Play size={32} fill="white" color="white" style={{ marginLeft: '4px' }} />
            </div>
          </div>
        )}

        {/* Controls overlay */}
        <div className="controls-overlay" style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)',
          padding: '32px 20px 16px',
          opacity: showControls ? 1 : 0,
          transition: 'opacity 300ms',
          display: 'flex', flexDirection: 'column', gap: '12px'
        }}
          onClick={e => e.stopPropagation()}
        >
          {/* Progress bar */}
          <div style={{ position: 'relative', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '9999px', cursor: 'pointer' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(buffered / duration) * 100}%`, background: 'rgba(255,255,255,0.3)', borderRadius: '9999px' }} />
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(currentTime / duration) * 100}%`, background: 'linear-gradient(90deg, var(--primary), var(--primary-light))', borderRadius: '9999px' }} />
            <input type="range" min={0} max={duration || 100} value={currentTime} onChange={handleSeek}
              style={{ position: 'absolute', inset: 0, width: '100%', opacity: 0, cursor: 'pointer', height: '100%' }} />
          </div>

          {/* Controls row */}
          <div className="controls-row" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Play/Pause */}
            <button onClick={togglePlay} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', padding: '4px' }}>
              {isPlaying ? <Pause size={22} /> : <Play size={22} fill="white" />}
            </button>

            {/* Volume */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button onClick={() => handleVolumeChange(isMuted ? volume : 0)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', padding: '4px' }}>
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <input type="range" min={0} max={1} step={0.05} value={isMuted ? 0 : volume} onChange={e => handleVolumeChange(e.target.value)}
                style={{ width: '64px', accentColor: 'var(--primary)' }} />
            </div>

            {/* Time */}
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', fontFamily: 'monospace' }}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <div style={{ flex: 1 }} />

            {/* Playback rate */}
            <select value={playbackRate} onChange={e => { const v = Number(e.target.value); setPlaybackRate(v); if (videoRef.current) videoRef.current.playbackRate = v; }}
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '6px', padding: '2px 6px', fontSize: '12px', cursor: 'pointer' }}>
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map(r => <option key={r} value={r}>{r}x</option>)}
            </select>

            {/* Minimize to MiniPlayer */}
            <button 
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.pause();
                }
                playTrack(content);
                navigate('/');
              }} 
              title="Réduire"
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', padding: '4px', marginLeft: '8px' }}
            >
              <ChevronDown size={20} />
            </button>

            {/* Fullscreen */}
            <button onClick={handleFullscreen} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', padding: '4px' }}>
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          </div>
        </div>

        <audio ref={content?.type === 'audio' ? videoRef : undefined} preload="auto" onTimeUpdate={handleTimeUpdate} onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} />
      </div>

      {/* Info section */}
      {content && (
        <div style={{ marginTop: '32px', display: 'grid', gridTemplateColumns: '1fr auto', gap: '32px', alignItems: 'start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              {content.accessType === 'premium' && <span className="badge badge-premium">★ Premium</span>}
              {content.accessType === 'paid' && <span className="badge badge-paid">{content.price / 1000}k Ar</span>}
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{content.category}</span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={13} /> {formatTime(content.duration)}
              </span>
            </div>
            <h1 style={{ fontFamily: 'Sora', fontSize: '26px', fontWeight: 700, marginBottom: '12px', lineHeight: 1.2 }}>{content.title}</h1>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', fontSize: '15px' }}>{content.description}</p>
            {content.artist && (
              <div style={{ marginTop: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>{content.artist}</strong>
                {content.album && <span> · {content.album}</span>}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '160px' }}>
            <button onClick={() => navigator.share?.({ title: content.title, url: window.location.href }).catch(() => navigator.clipboard?.writeText(window.location.href))} className="btn btn-secondary" style={{ borderRadius: '10px' }}>
              <Share2 size={16} /> Partager
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
