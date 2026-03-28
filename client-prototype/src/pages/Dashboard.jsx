import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { Play } from 'lucide-react';

export default function Dashboard() {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContents = async () => {
      try {
        const res = await api.get('/contents?limit=50');
        setContents(res.data.contents);
      } catch (err) {
        console.error("Erreur de chargement du catalogue", err);
      } finally {
        setLoading(false);
      }
    };
    fetchContents();
  }, []);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>Chargement du catalogue...</div>;
  }

  return (
    <div className="animate-fade-in">
      <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Catalogue</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Explorez les contenus disponibles sur la plateforme.</p>

      {contents.length === 0 ? (
        <div style={{ background: 'var(--bg-secondary)', padding: '40px', borderRadius: '12px', textAlign: 'center' }}>
          <p>Aucun contenu disponible. Lancez le script de transcodage.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3">
          {contents.map(content => (
            <Link to={`/watch/${content._id}`} key={content._id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', overflow: 'hidden', background: '#000' }}>
                <img 
                  src={`${import.meta.env.VITE_BASE_URL}${content.thumbnail}`} 
                  alt={content.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8, transition: 'var(--transition)' }}
                />
                <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 8 }}>
                  {content.accessType === 'premium' && <span className="badge badge-premium">Premium</span>}
                  {content.accessType === 'paid' && <span className="badge badge-paid">Achat</span>}
                  {content.accessType === 'free' && <span className="badge badge-free">Gratuit</span>}
                  
                  <span className="badge" style={{ background: 'rgba(0,0,0,0.6)', color: 'white', backdropFilter: 'blur(4px)' }}>
                    {content.type.toUpperCase()}
                  </span>
                </div>
                
                <div style={{ 
                  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(0,0,0,0.4)', opacity: 0, transition: 'var(--transition)'
                }} className="hover-play">
                  <Play size={48} color="white" fill="white" />
                </div>
              </div>
              <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '8px', color: 'white' }}>{content.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px', flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {content.description || 'Contenu test sans description'}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <span>{content.category}</span>
                  {content.duration && <span>{Math.floor(content.duration / 60)}:{String(content.duration % 60).padStart(2, '0')}</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
