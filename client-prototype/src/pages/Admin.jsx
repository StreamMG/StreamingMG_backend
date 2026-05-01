import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, Users, Film, Music, DollarSign, TrendingUp, 
  Check, X, Eye, Edit, Trash2, Settings, Crown, Star,
  Package, Clock, AlertCircle 
} from 'lucide-react';
import api from '../api';

const Admin = () => {
  const [stats, setStats] = useState({
    totalUsers: 0, premiumUsers: 0, totalContents: 0, publishedContents: 0,
    pendingContents: 0, totalViews: 0, recentPurchases30d: 0, revenueSimulated30d: 0
  });
  const [contents, setContents] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [filter, setFilter] = useState({ isPublished: null, role: '' });
  const [selectedContent, setSelectedContent] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadStats();
    if (activeTab === 'contents') loadContents();
    if (activeTab === 'users') loadUsers();
  }, [activeTab, filter]);

  const loadStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      setStats(response.data);
    } catch (err) {
      console.error('Erreur stats:', err);
    }
  };

  const loadContents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.isPublished !== null) params.append('isPublished', filter.isPublished);
      const response = await api.get(`/admin/contents?${params}`);
      setContents(response.data.contents || []);
    } catch (err) {
      console.error('Erreur contenus:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.role) params.append('role', filter.role);
      const response = await api.get(`/admin/users?${params}`);
      setUsers(response.data.users || []);
    } catch (err) {
      console.error('Erreur users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveContent = async (contentId) => {
    try {
      await api.put(`/admin/contents/${contentId}`, { isPublished: true });
      loadContents(); loadStats();
    } catch (err) {
      console.error('Erreur approbation:', err);
    }
  };

  const handleRejectContent = async (contentId) => {
    if (!rejectionReason.trim()) { alert('Veuillez fournir une raison de rejet'); return; }
    try {
      await api.put(`/admin/contents/${contentId}`, { isPublished: false, rejectionReason });
      setSelectedContent(null); setRejectionReason('');
      loadContents(); loadStats();
    } catch (err) {
      console.error('Erreur rejet:', err);
    }
  };

  const handleDeleteContent = async (contentId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce contenu ?')) return;
    try {
      await api.delete(`/admin/contents/${contentId}`);
      loadContents(); loadStats();
    } catch (err) {
      console.error('Erreur suppression:', err);
    }
  };

  const handleToggleUser = async (userId, isActive) => {
    try {
      await api.put(`/admin/users/${userId}`, { isActive: !isActive });
      loadUsers();
    } catch (err) {
      console.error('Erreur toggle user:', err);
    }
  };

  const formatPrice = (amount) => `${(amount / 1000).toFixed(0)}k Ar`;
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  const imgUrl = (p) => (!p ? '' : p.startsWith('http') ? p : `${import.meta.env.VITE_BASE_URL}${p}`);

  const getRoleBadge = (role) => {
    const r = role === 'admin' ? { icon: <Settings size={12} />, color: 'var(--error)' } :
              role === 'premium' ? { icon: <Crown size={12} />, color: 'var(--gold)' } :
              role === 'provider' ? { icon: <Package size={12} />, color: 'var(--teal)' } :
              { icon: <Users size={12} />, color: 'var(--text-secondary)' };
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '6px', background: 'var(--bg-raised)', border: '1px solid var(--bg-border)', fontSize: '11px', color: r.color, fontWeight: 600, textTransform: 'uppercase' }}>
        {r.icon} {role}
      </span>
    );
  };

  const getAccessBadge = (c) => {
    if (c.accessType === 'premium') return <span className="badge badge-premium">★ Premium</span>;
    if (c.accessType === 'paid') return <span className="badge badge-paid">{formatPrice(c.price)}</span>;
    return <span className="badge badge-free">Gratuit</span>;
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 32px 80px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
      
      {/* ── En-tête ── */}
      <section style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontFamily: 'Sora', fontSize: '32px', fontWeight: 800, marginBottom: '8px' }}>Admin Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Supervisez la plateforme StreamMG</p>
        </div>
      </section>

      {/* ── Onglets ── */}
      <section style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--bg-border)', paddingBottom: '4px' }}>
        {[
          { id: 'dashboard', icon: <BarChart3 size={16} />, label: 'Tableau de bord' },
          { id: 'contents', icon: <Film size={16} />, label: 'Contenus' },
          { id: 'users', icon: <Users size={16} />, label: 'Utilisateurs' }
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px 12px 0 0',
            background: activeTab === t.id ? 'var(--bg-surface)' : 'transparent', border: 'none',
            borderBottom: activeTab === t.id ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === t.id ? 'var(--primary-light)' : 'var(--text-secondary)',
            fontSize: '14px', fontWeight: activeTab === t.id ? 600 : 400, cursor: 'pointer', transition: 'all 0.2s'
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </section>

      {/* ── Contenu des onglets ── */}
      <section>
        
        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
              {[
                { icon: <Users size={28} color="var(--primary)" />, label: 'Utilisateurs', value: stats.totalUsers, sub: `${stats.premiumUsers} Premium` },
                { icon: <Film size={28} color="var(--teal)" />, label: 'Contenus', value: stats.totalContents, sub: `${stats.publishedContents} publiés` },
                { icon: <TrendingUp size={28} color="var(--gold)" />, label: 'Vues totales', value: stats.totalViews.toLocaleString(), sub: `${stats.pendingContents} en attente` },
                { icon: <DollarSign size={28} color="#2ecc71" />, label: 'Revenus (30j)', value: formatPrice(stats.revenueSimulated30d), sub: `${stats.recentPurchases30d} achats` },
              ].map((s, i) => (
                <div key={i} style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.icon}</div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'Sora', fontSize: '28px', fontWeight: 800, lineHeight: 1 }}>{s.value}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>{s.label}</div>
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid var(--bg-border)', paddingTop: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>{s.sub}</div>
                </div>
              ))}
            </div>
            
            {stats.topPurchasedContents?.length > 0 && (
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: '24px', padding: '32px' }}>
                <h2 style={{ fontFamily: 'Sora', fontSize: '20px', fontWeight: 700, marginBottom: '24px' }}>Contenus les plus vendus</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {stats.topPurchasedContents.map((c, i) => (
                    <div key={c._id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', background: 'var(--bg-raised)', borderRadius: '12px', border: '1px solid var(--bg-border)' }}>
                      <span style={{ fontSize: '18px', fontWeight: 800, color: i === 0 ? 'var(--gold)' : 'var(--text-muted)', width: '32px', textAlign: 'center' }}>#{i + 1}</span>
                      <img src={imgUrl(c.thumbnail)} alt={c.title} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{ fontFamily: 'Sora', fontSize: '15px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</h4>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{c.totalSales} ventes</p>
                      </div>
                      <div style={{ fontFamily: 'Sora', fontSize: '16px', fontWeight: 700, color: 'var(--teal)' }}>{formatPrice(c.totalRevenue)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* CONTENTS */}
        {activeTab === 'contents' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontFamily: 'Sora', fontSize: '20px', fontWeight: 700 }}>Gestion des contenus</h2>
              <select className="input-field" style={{ width: '200px' }} value={filter.isPublished === null ? '' : filter.isPublished} onChange={e => setFilter({ ...filter, isPublished: e.target.value === '' ? null : e.target.value === 'true' })}>
                <option value="">Tous les statuts</option>
                <option value="true">Publiés</option>
                <option value="false">En attente</option>
              </select>
            </div>
            
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="loading-spinner" /></div>
            ) : contents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', background: 'var(--bg-surface)', borderRadius: '24px', border: '1px dashed var(--bg-border)' }}>
                <Film size={48} style={{ margin: '0 auto 16px', color: 'var(--text-muted)' }} />
                <h3>Aucun contenu</h3>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                {contents.map(c => (
                  <div key={c._id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ position: 'relative', aspectRatio: '16/9' }}>
                      <img src={imgUrl(c.thumbnail)} alt={c.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', top: '8px', right: '8px' }}>{getAccessBadge(c)}</div>
                      <div style={{ position: 'absolute', top: '8px', left: '8px', background: c.isPublished ? 'var(--teal)' : 'var(--gold)', color: '#1a1000', fontSize: '10px', fontWeight: 800, padding: '4px 8px', borderRadius: '6px', textTransform: 'uppercase' }}>
                        {c.isPublished ? 'Publié' : 'En attente'}
                      </div>
                    </div>
                    <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <h3 style={{ fontFamily: 'Sora', fontSize: '15px', fontWeight: 600, marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</h3>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>Par <strong>{c.provider?.username}</strong></div>
                      
                      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--bg-border)', paddingTop: '16px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{c.viewCount} vues</div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <Link to={`/watch/${c._id}`} className="btn btn-icon" style={{ background: 'var(--bg-raised)', border: '1px solid var(--bg-border)', color: 'var(--text-secondary)' }}><Eye size={16} /></Link>
                          {!c.isPublished && (
                            <button onClick={() => handleApproveContent(c._id)} className="btn btn-icon" style={{ background: 'rgba(46,194,126,0.1)', border: '1px solid rgba(46,194,126,0.2)', color: 'var(--teal)' }}><Check size={16} /></button>
                          )}
                          <button onClick={() => setSelectedContent(c)} className="btn btn-icon" style={{ background: 'rgba(232,197,71,0.1)', border: '1px solid rgba(232,197,71,0.2)', color: 'var(--gold)' }}><X size={16} /></button>
                          <button onClick={() => handleDeleteContent(c._id)} className="btn btn-icon" style={{ background: 'rgba(237,51,59,0.1)', border: '1px solid rgba(237,51,59,0.2)', color: 'var(--error)' }}><Trash2 size={16} /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* USERS */}
        {activeTab === 'users' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontFamily: 'Sora', fontSize: '20px', fontWeight: 700 }}>Gestion des utilisateurs</h2>
              <select className="input-field" style={{ width: '200px' }} value={filter.role} onChange={e => setFilter({ ...filter, role: e.target.value })}>
                <option value="">Tous les rôles</option>
                <option value="user">Utilisateurs</option>
                <option value="premium">Premium</option>
                <option value="provider">Fournisseurs</option>
                <option value="admin">Admins</option>
              </select>
            </div>
            
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="loading-spinner" /></div>
            ) : users.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', background: 'var(--bg-surface)', borderRadius: '24px', border: '1px dashed var(--bg-border)' }}>
                <Users size={48} style={{ margin: '0 auto 16px', color: 'var(--text-muted)' }} />
                <h3>Aucun utilisateur</h3>
              </div>
            ) : (
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: '24px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-raised)', borderBottom: '1px solid var(--bg-border)', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '16px 24px', fontWeight: 600 }}>Utilisateur</th>
                      <th style={{ padding: '16px 24px', fontWeight: 600 }}>Rôle</th>
                      <th style={{ padding: '16px 24px', fontWeight: 600 }}>Statut</th>
                      <th style={{ padding: '16px 24px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u._id} style={{ borderBottom: '1px solid var(--bg-border)' }}>
                        <td style={{ padding: '16px 24px' }}>
                          <div style={{ fontFamily: 'Sora', fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>{u.username}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{u.email}</div>
                        </td>
                        <td style={{ padding: '16px 24px' }}>{getRoleBadge(u.role)}</td>
                        <td style={{ padding: '16px 24px' }}>
                          <span style={{ display: 'inline-block', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: u.isActive ? 'rgba(46,194,126,0.1)' : 'rgba(237,51,59,0.1)', color: u.isActive ? 'var(--teal)' : 'var(--error)' }}>
                            {u.isActive ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                          <button onClick={() => handleToggleUser(u._id, u.isActive)} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer', background: u.isActive ? 'rgba(237,51,59,0.1)' : 'rgba(46,194,126,0.1)', color: u.isActive ? 'var(--error)' : 'var(--teal)' }}>
                            {u.isActive ? 'Désactiver' : 'Activer'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </section>

      {/* ── Modal Rejet ── */}
      {selectedContent && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--primary)', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '500px', boxShadow: '0 0 40px rgba(53,132,228,0.1)' }}>
            <h3 style={{ fontFamily: 'Sora', fontSize: '20px', fontWeight: 700, marginBottom: '24px' }}>Rejeter le contenu</h3>
            
            <div style={{ display: 'flex', gap: '16px', background: 'var(--bg-raised)', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
              <img src={imgUrl(selectedContent.thumbnail)} alt="" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
              <div>
                <h4 style={{ fontFamily: 'Sora', fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>{selectedContent.title}</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{selectedContent.description}</p>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Raison du rejet *</label>
              <textarea className="input-field" value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} rows={4} placeholder="Expliquez pourquoi..." required />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedContent(null)}>Annuler</button>
              <button className="btn btn-primary" style={{ background: 'var(--error)', borderColor: 'var(--error)', color: 'white' }} onClick={() => handleRejectContent(selectedContent._id)}>Rejeter</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Admin;
