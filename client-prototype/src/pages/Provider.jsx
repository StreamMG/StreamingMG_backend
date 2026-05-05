import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Upload, Plus, Edit, Trash2, Eye, EyeOff, Film, Music, 
  Image, DollarSign, Star, Clock, BarChart3, Settings 
} from 'lucide-react';
import api from '../api';

const Provider = () => {
  const [contents, setContents] = useState([]);
  const [stats, setStats] = useState({ total: 0, published: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [editingContent, setEditingContent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'video',
    category: 'autre',
    language: 'mg',
    accessType: 'free',
    price: '',
    isTutorial: false
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);

  const categories = ['salegy', 'hira_gasy', 'tsapiky', 'beko', 'film', 'documentaire', 'podcast', 'tutoriel', 'autre'];
  const types = ['video', 'audio'];
  const languages = ['mg', 'fr', 'en'];

  useEffect(() => {
    loadContents();
  }, []);

  const loadContents = async () => {
    try {
      const response = await api.get('/provider/contents');
      setContents(response.data.contents || []);
      
      // Calculer les statistiques
      const total = response.data.contents?.length || 0;
      const published = response.data.contents?.filter(c => c.isPublished).length || 0;
      const pending = total - published;
      
      setStats({ total, published, pending });
    } catch (err) {
      console.error('Erreur chargement contenus:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    
    try {
      const formDataToSend = new FormData();
      
      // Ajouter les champs texte
      Object.keys(formData).forEach(key => {
        if (key !== 'thumbnail' && key !== 'media') {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Ajouter les fichiers
      if (formData.thumbnail) {
        formDataToSend.append('thumbnail', formData.thumbnail);
      }
      if (formData.media) {
        formDataToSend.append('media', formData.media);
      }

      const config = {
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        }
      };

      if (editingContent) {
        await api.put(`/provider/contents/${editingContent._id}`, formDataToSend, config);
      } else {
        await api.post('/provider/contents', formDataToSend, config);
      }

      // Réinitialiser le formulaire
      resetForm();
      setShowUploadForm(false);
      loadContents();
    } catch (err) {
      console.error('Erreur upload:', err);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (contentId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce contenu ?')) return;
    
    try {
      await api.delete(`/provider/contents/${contentId}`);
      loadContents();
    } catch (err) {
      console.error('Erreur suppression:', err);
    }
  };

  const handleEdit = (content) => {
    setEditingContent(content);
    setFormData({
      title: content.title,
      description: content.description,
      type: content.type,
      category: content.category,
      language: content.language,
      accessType: content.accessType,
      price: content.price || '',
      isTutorial: content.isTutorial
    });
    setThumbnailPreview(content.thumbnail ? imgUrl(content.thumbnail) : null);
    setShowUploadForm(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'video',
      category: 'autre',
      language: 'mg',
      accessType: 'free',
      price: '',
      isTutorial: false
    });
    setEditingContent(null);
    setThumbnailPreview(null);
  };

  const formatPrice = (amount) => {
    return amount ? `${amount / 1000}k Ar` : 'Gratuit';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getAccessBadge = (content) => {
    if (content.accessType === 'premium') {
      return <span className="badge badge-premium">★ Premium</span>;
    }
    if (content.accessType === 'paid') {
      return <span className="badge badge-paid">{formatPrice(content.price)}</span>;
    }
    return <span className="badge badge-free">Gratuit</span>;
  };

  const getTypeIcon = (type) => {
    return type === 'video' ? <Film size={16} /> : <Music size={16} />;
  };

  const imgUrl = (p) => (!p ? '' : p.startsWith('http') ? p : `${import.meta.env.VITE_BASE_URL}${p}`);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 32px 80px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
      
      {/* ── En-tête avec statistiques ── */}
      <section style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontFamily: 'Sora', fontSize: '32px', fontWeight: 800, marginBottom: '8px' }}>Espace Fournisseur</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Gérez vos contenus et suivez vos performances</p>
        </div>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {[
            { icon: <BarChart3 size={20} color="var(--primary)" />, label: 'Total', value: stats.total },
            { icon: <Eye size={20} color="var(--teal)" />, label: 'Publiés', value: stats.published },
            { icon: <Clock size={20} color="var(--gold)" />, label: 'En attente', value: stats.pending },
          ].map((s, i) => (
            <div key={i} style={{
              background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: '16px',
              padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px'
            }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontFamily: 'Sora', fontSize: '24px', fontWeight: 800, lineHeight: 1, marginBottom: '4px' }}>{s.value}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Actions ── */}
      <section style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowUploadForm(true); }} style={{ borderRadius: '12px' }}>
          <Plus size={18} /> Nouveau contenu
        </button>
      </section>

      {/* ── Formulaire d'upload ── */}
      {showUploadForm && (
        <section style={{ background: 'var(--bg-surface)', border: '1px solid var(--primary)', borderRadius: '24px', padding: '32px', position: 'relative', boxShadow: '0 0 40px rgba(53,132,228,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontFamily: 'Sora', fontSize: '20px', fontWeight: 700 }}>{editingContent ? 'Modifier' : 'Ajouter'} un contenu</h2>
            <button onClick={() => setShowUploadForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px' }}>✕</button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
              
              {/* Infos */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', borderBottom: '1px solid var(--bg-border)', paddingBottom: '8px' }}>Informations</h3>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', color: 'var(--text-secondary)' }}>Titre *</label>
                  <input type="text" className="input-field" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', color: 'var(--text-secondary)' }}>Description</label>
                  <textarea className="input-field" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} />
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', color: 'var(--text-secondary)' }}>Type *</label>
                    <select className="input-field" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                      {types.map(t => <option key={t} value={t}>{t === 'video' ? 'Vidéo' : 'Audio'}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', color: 'var(--text-secondary)' }}>Catégorie *</label>
                    <select className="input-field" value={formData.category} onChange={e => {
                      const cat = e.target.value;
                      let newType = formData.type;
                      // Détection automatique du type selon catégorie
                      if (['podcast', 'salegy', 'hira_gasy', 'tsapiky', 'beko'].includes(cat)) newType = 'audio';
                      if (['film', 'documentaire', 'tutoriel'].includes(cat)) newType = 'video';
                      setFormData({...formData, category: cat, type: newType});
                    }}>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', color: 'var(--text-secondary)' }}>Langue</label>
                    <select className="input-field" value={formData.language} onChange={e => setFormData({...formData, language: e.target.value})}>
                      {languages.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '24px' }}>
                    <input type="checkbox" checked={formData.isTutorial} onChange={e => setFormData({...formData, isTutorial: e.target.checked})} style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }} />
                    <span style={{ fontSize: '14px' }}>Est un tutoriel</span>
                  </label>
                </div>
              </div>

              {/* Accès & Fichiers */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', borderBottom: '1px solid var(--bg-border)', paddingBottom: '8px' }}>Accès & Fichiers</h3>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', color: 'var(--text-secondary)' }}>Niveau d'accès *</label>
                    <select className="input-field" value={formData.accessType} onChange={e => setFormData({...formData, accessType: e.target.value})}>
                      <option value="free">Gratuit</option>
                      <option value="premium">Premium</option>
                      <option value="paid">Payant (Unité)</option>
                    </select>
                  </div>
                  {formData.accessType === 'paid' && (
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', color: 'var(--text-secondary)' }}>Prix (Ar) *</label>
                      <input type="number" className="input-field" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} min="100" step="100" required />
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '8px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', color: 'var(--text-secondary)' }}>Vignette (Image) {editingContent ? '' : '*'}</label>
                    <div style={{ position: 'relative' }}>
                      <input type="file" accept="image/jpeg,image/png,image/jpg,image/webp" onChange={e => {
                        const file = e.target.files[0];
                        if (file) {
                          setFormData({...formData, thumbnail: file});
                          setThumbnailPreview(URL.createObjectURL(file));
                        }
                      }} required={!editingContent} style={{ width: '100%', padding: '10px', background: 'var(--bg-raised)', border: '1px dashed var(--bg-border)', borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer' }} />
                    </div>
                  </div>
                  {thumbnailPreview && (
                    <div style={{ width: '100px', aspectRatio: '5/7', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--bg-border)', flexShrink: 0 }}>
                      <img src={thumbnailPreview} alt="Aperçu" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', color: 'var(--text-secondary)' }}>Fichier Média {editingContent ? '' : '*'}</label>
                  <input type="file" accept={formData.type === 'video' ? 'video/mp4,video/mkv,video/avi' : 'audio/mpeg,audio/aac,audio/wav,audio/mp3'} onChange={e => setFormData({...formData, media: e.target.files[0]})} required={!editingContent} style={{ width: '100%', padding: '10px', background: 'var(--bg-raised)', border: '1px dashed var(--bg-border)', borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer' }} />
                </div>
              </div>
            </div>

            {isUploading && (
              <div>
                <div style={{ width: '100%', height: '6px', background: 'var(--bg-raised)', borderRadius: '9999px', overflow: 'hidden', marginBottom: '8px' }}>
                  <div style={{ height: '100%', width: `${uploadProgress}%`, background: 'var(--primary)', transition: 'width 0.3s' }} />
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'right' }}>{uploadProgress}%</div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid var(--bg-border)' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowUploadForm(false)}>Annuler</button>
              <button type="submit" className="btn btn-primary" disabled={isUploading}>{isUploading ? 'Upload...' : (editingContent ? 'Mettre à jour' : 'Uploader')}</button>
            </div>
          </form>
        </section>
      )}

      {/* ── Liste des contenus ── */}
      <section>
        <h2 style={{ fontFamily: 'Sora', fontSize: '20px', fontWeight: 700, marginBottom: '24px' }}>Mes contenus ({contents.length})</h2>
        {contents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px', background: 'var(--bg-surface)', border: '1px dashed var(--bg-border)', borderRadius: '24px' }}>
            <Upload size={48} style={{ color: 'var(--text-muted)', opacity: 0.5, margin: '0 auto 16px' }} />
            <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Aucun contenu</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>Vous n'avez pas encore uploadé de contenu.</p>
            <button className="btn btn-primary" onClick={() => setShowUploadForm(true)} style={{ borderRadius: '12px', margin: '0 auto' }}>Ajouter un contenu</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '24px' }}>
            {contents.map(c => (
              <div key={c._id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ position: 'relative', aspectRatio: '5/7' }}>
                  <img src={imgUrl(c.thumbnail)} alt={c.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', top: '8px', right: '8px' }}>{getAccessBadge(c)}</div>
                  <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {getTypeIcon(c.type)} {c.type === 'video' ? 'Vidéo' : 'Audio'}
                  </div>
                  {c.isPublished ? (
                    <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'var(--teal)', color: '#1a1000', fontSize: '10px', fontWeight: 800, padding: '4px 8px', borderRadius: '6px', textTransform: 'uppercase' }}>Publié</div>
                  ) : (
                    <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'var(--gold)', color: '#1a1000', fontSize: '10px', fontWeight: 800, padding: '4px 8px', borderRadius: '6px', textTransform: 'uppercase' }}>En attente</div>
                  )}
                </div>
                <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontFamily: 'Sora', fontSize: '15px', fontWeight: 600, marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.description}</p>
                  
                  <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--bg-border)', paddingTop: '16px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Eye size={12} /> {c.viewCount} vues</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {formatDate(c.createdAt)}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Link to={`/watch/${c._id}`} style={{ background: 'var(--bg-raised)', border: '1px solid var(--bg-border)', color: 'var(--text-secondary)', padding: '6px', borderRadius: '8px' }}><Eye size={16} /></Link>
                      <button onClick={() => handleEdit(c)} style={{ background: 'rgba(53,132,228,0.1)', border: '1px solid rgba(53,132,228,0.2)', color: 'var(--primary)', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}><Edit size={16} /></button>
                      <button onClick={() => handleDelete(c._id)} style={{ background: 'rgba(237,51,59,0.1)', border: '1px solid rgba(237,51,59,0.2)', color: 'var(--error)', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}><Trash2 size={16} /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Provider;
