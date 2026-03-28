import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Hls from 'hls.js';
import api from '../api';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export default function VideoPlayer() {
  const { id } = useParams();
  const videoRef = useRef(null);
  
  const [content, setContent] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let hls;

    const loadPlayer = async () => {
      try {
        // 1. Charger les métadonnées (optionnel mais utile pour l'UI)
        const contentRes = await api.get(`/contents/${id}`);
        setContent(contentRes.data.content);

        // 2. Demander le Token HLS sécurisé
        const tokenRes = await api.get(`/hls/${id}/token`);
        const { hlsUrl } = tokenRes.data;

        const fullManifestUrl = `${import.meta.env.VITE_BASE_URL}${hlsUrl}`;
        // Extraire le token final pour les segments
        const tokenMatch = hlsUrl.match(/token=([^&]+)/);
        const tokenStr = tokenMatch ? tokenMatch[1] : '';

        // 3. Initialiser le lecteur avec le manifest URL (qui contient ?token=...)
        if (Hls.isSupported()) {
          hls = new Hls({
            xhrSetup: (xhr, url) => {
              // hls.js a déjà fait un xhr.open(). On le refait avec le token pour les segments (.ts)
              if (url.includes('.ts') && !url.includes('token=')) {
                xhr.open('GET', `${url}?token=${tokenStr}`, true);
              }
              xhr.withCredentials = true; // Pour transférer cookie sessionId (fingerprint)
            }
          });
          
          hls.loadSource(fullManifestUrl);
          hls.attachMedia(videoRef.current);
          
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            console.log("🎬 HLS Manifest parsed, player ready!");
          });

          hls.on(Hls.Events.ERROR, (event, data) => {
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  console.error("fatal network error encountered, try to recover");
                  hls.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  console.error("fatal media error encountered, try to recover");
                  hls.recoverMediaError();
                  break;
                default:
                  hls.destroy();
                  break;
              }
            }
          });
        } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
          // Fallback pour Safari natif
          videoRef.current.src = fullManifestUrl;
        }

      } catch (err) {
        console.error("Erreur de lecteur", err);
        setError(err.response?.data?.message || err.message || "Impossible de lire la vidéo");
      } finally {
        setLoading(false);
      }
    };

    loadPlayer();

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [id]);

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', marginBottom: 24 }}>
        <ArrowLeft size={18} /> Retour au catalogue
      </Link>

      <div style={{ background: 'black', borderRadius: '12px', overflow: 'hidden', aspectRatio: '16/9', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
        {loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', zIndex: 10 }}>
            Chargement du flux sécurisé...
          </div>
        )}
        
        {error ? (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', zIndex: 10, padding: 32, textAlign: 'center' }}>
            <AlertCircle size={48} color="var(--danger-color)" style={{ marginBottom: 16 }} />
            <h2 style={{ fontSize: '1.5rem', marginBottom: 8, color: 'white' }}>Accès Refusé / Erreur</h2>
            <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
          </div>
        ) : (
          <video 
            ref={videoRef}
            controls 
            autoPlay 
            style={{ width: '100%', height: '100%' }}
            poster={content && `${import.meta.env.VITE_BASE_URL}${content.thumbnail}`}
          />
        )}
      </div>

      {content && !error && (
        <div style={{ marginTop: 24, padding: 24, background: 'var(--bg-secondary)', borderRadius: 12 }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
             {content.accessType === 'premium' && <span className="badge badge-premium">Premium</span>}
             <span className="badge" style={{ background: 'var(--bg-tertiary)' }}>{content.category}</span>
          </div>
          <h1 style={{ fontSize: '2rem', marginBottom: 12, color: 'white' }}>{content.title}</h1>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{content.description}</p>
        </div>
      )}
    </div>
  );
}
