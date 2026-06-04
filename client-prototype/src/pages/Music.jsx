import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Music as MusicIcon, Play, Clock, Search, Filter } from 'lucide-react';
import ContentCard from '../components/ContentCard';
import api from '../api';

const Music = () => {
  const { user } = useAuth();
  const [contents, setContents] = useState([]);
  const [filteredContents, setFilteredContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = ['all', 'salegy', 'hira_gasy', 'tsapiky', 'beko', 'podcast', 'autre'];

  useEffect(() => {
    loadContents();
  }, []);

  useEffect(() => {
    filterContents();
  }, [contents, searchQuery, selectedCategory]);

  const loadContents = async () => {
    try {
      const response = await api.get('/contents');
      const audioContents = response.data.contents?.filter(c => c.type === 'audio') || [];
      setContents(audioContents);
    } catch (err) {
      console.error('Erreur chargement musique:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterContents = () => {
    let filtered = contents;

    // Filtrer par catégorie
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(c => c.category === selectedCategory);
    }

    // Filtrer par recherche
    if (searchQuery) {
      filtered = filtered.filter(c => 
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.artist?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredContents(filtered);
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 32px 80px' }}>
      {/* Header */}
      <section style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <div style={{ 
            width: '64px', 
            height: '64px', 
            borderRadius: '16px', 
            background: 'linear-gradient(135deg, var(--primary), var(--primary-light))', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(53,132,228,0.3)'
          }}>
            <MusicIcon size={32} color="white" />
          </div>
          <div>
            <h1 style={{ fontFamily: 'Sora', fontSize: '32px', fontWeight: 800, marginBottom: '8px' }}>
              Musique Malagasy
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
              Découvrez Salegy, Hira Gasy, Tsapiky et plus encore
            </p>
          </div>
        </div>

        {/* Search & Filter */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input-field"
              style={{ paddingLeft: '48px' }}
              placeholder="Rechercher un titre, artiste..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: '1px solid var(--bg-border)',
                  background: selectedCategory === cat ? 'var(--primary)' : 'var(--bg-surface)',
                  color: selectedCategory === cat ? 'white' : 'var(--text-secondary)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 150ms',
                  textTransform: 'capitalize'
                }}
                onMouseEnter={e => {
                  if (selectedCategory !== cat) {
                    e.currentTarget.style.background = 'var(--bg-raised)';
                  }
                }}
                onMouseLeave={e => {
                  if (selectedCategory !== cat) {
                    e.currentTarget.style.background = 'var(--bg-surface)';
                  }
                }}
              >
                {cat === 'all' ? 'Tous' : cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ marginBottom: '32px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        <div style={{ 
          padding: '16px 24px', 
          borderRadius: '12px', 
          background: 'var(--bg-surface)', 
          border: '1px solid var(--bg-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <MusicIcon size={20} color="var(--primary)" />
          <div>
            <div style={{ fontFamily: 'Sora', fontSize: '20px', fontWeight: 700 }}>{filteredContents.length}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Pistes</div>
          </div>
        </div>
        <div style={{ 
          padding: '16px 24px', 
          borderRadius: '12px', 
          background: 'var(--bg-surface)', 
          border: '1px solid var(--bg-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Clock size={20} color="var(--gold)" />
          <div>
            <div style={{ fontFamily: 'Sora', fontSize: '20px', fontWeight: 700 }}>
              {filteredContents.reduce((acc, c) => acc + (c.duration || 0), 0) > 0 
                ? formatDuration(filteredContents.reduce((acc, c) => acc + (c.duration || 0), 0))
                : '--:--'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Durée totale</div>
          </div>
        </div>
      </section>

      {/* Content Grid */}
      {filteredContents.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '80px 32px', 
          background: 'var(--bg-surface)', 
          border: '1px dashed var(--bg-border)', 
          borderRadius: '24px' 
        }}>
          <MusicIcon size={64} style={{ color: 'var(--text-muted)', opacity: 0.5, margin: '0 auto 24px' }} />
          <h3 style={{ fontFamily: 'Sora', fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
            {searchQuery || selectedCategory !== 'all' ? 'Aucun résultat' : 'Aucune musique'}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
            {searchQuery || selectedCategory !== 'all' 
              ? 'Essayez d\'autres termes de recherche ou catégories' 
              : 'La bibliothèque musicale sera bientôt enrichie'}
          </p>
          {(searchQuery || selectedCategory !== 'all') && (
            <button 
              onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
              className="btn btn-secondary"
              style={{ borderRadius: '12px' }}
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px' }}>
          {filteredContents.map(content => (
            <Link 
              key={content._id} 
              to={`/watch/${content._id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--bg-border)',
                borderRadius: '16px',
                overflow: 'hidden',
                transition: 'all 250ms ease-out',
                cursor: 'pointer'
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.3)';
                  e.currentTarget.style.borderColor = 'rgba(53,132,228,0.3)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = 'var(--bg-border)';
                }}
              >
                {/* Thumbnail */}
                <div style={{ position: 'relative', aspectRatio: '1/1' }}>
                  <img 
                    src={content.thumbnail ? (content.thumbnail.startsWith('http') ? content.thumbnail : `${import.meta.env.VITE_BASE_URL}${content.thumbnail}`) : '/placeholder-music.jpg'} 
                    alt={content.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{ 
                    position: 'absolute', 
                    inset: 0, 
                    background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%)' 
                  }} />
                  <div style={{ 
                    position: 'absolute', 
                    bottom: '12px', 
                    right: '12px',
                    background: 'rgba(0,0,0,0.7)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'white'
                  }}>
                    {formatDuration(content.duration)}
                  </div>
                  <div style={{ 
                    position: 'absolute', 
                    inset: 0, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    opacity: 0,
                    transition: 'opacity 250ms'
                  }}
                    onMouseEnter={e => e.currentTarget.parentElement.style.opacity = '1'}
                    onMouseLeave={e => e.currentTarget.parentElement.style.opacity = '0'}
                  >
                    <div style={{ 
                      width: '56px', 
                      height: '56px', 
                      borderRadius: '50%', 
                      background: 'var(--primary)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      boxShadow: '0 8px 24px rgba(53,132,228,0.4)'
                    }}>
                      <Play size={24} color="white" fill="white" />
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div style={{ padding: '16px' }}>
                  <h3 style={{ 
                    fontFamily: 'Sora', 
                    fontSize: '15px', 
                    fontWeight: 600, 
                    marginBottom: '6px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {content.title}
                  </h3>
                  {content.artist && (
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      {content.artist}
                    </p>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ 
                      fontSize: '11px', 
                      textTransform: 'uppercase', 
                      fontWeight: 600, 
                      color: 'var(--text-muted)',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      background: 'var(--bg-raised)'
                    }}>
                      {content.category}
                    </span>
                    {content.accessType === 'premium' && (
                      <span className="badge badge-premium" style={{ fontSize: '9px' }}>★ Premium</span>
                    )}
                    {content.accessType === 'paid' && (
                      <span className="badge badge-paid" style={{ fontSize: '9px' }}>{(content.price / 1000).toFixed(0)}k Ar</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Music;
