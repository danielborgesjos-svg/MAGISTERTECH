import { useState } from 'react';
import { Plus, X, CheckCircle, Eye, Copy } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import type { ContentPost } from '../contexts/DataContext';

const STATUS_ORDER: ContentPost['status'][] = ['ideia', 'producao', 'revisao', 'aprovado', 'publicado'];

const STATUS_CONFIG: Record<string, { label: string; color: string; badge: string }> = {
  ideia: { label: '💡 Ideia', color: 'var(--text-muted)', badge: 'badge-muted' },
  producao: { label: '⚙️ Produção', color: 'var(--warning)', badge: 'badge-warning' },
  revisao: { label: '👁️ Revisão', color: 'var(--primary)', badge: 'badge-primary' },
  aprovado: { label: '✅ Aprovado', color: 'var(--success)', badge: 'badge-success' },
  publicado: { label: '🚀 Publicado', color: 'var(--purple)', badge: 'badge-purple' },
};

const PLATFORMS = ['Instagram', 'LinkedIn', 'Facebook', 'YouTube', 'TikTok', 'Twitter/X', 'Site/Blog'];

const PLATFORM_ICON: Record<string, string> = {
  Instagram: '📸', LinkedIn: '💼', Facebook: '👥', YouTube: '▶️',
  TikTok: '🎵', 'Twitter/X': '🐦', 'Site/Blog': '📝'
};

export default function Conteudo() {
  const { content, clients, addContent, updateContentStatus } = useData();
  const [showForm, setShowForm] = useState(false);
  const [viewPost, setViewPost] = useState<ContentPost | null>(null);
  const [form, setForm] = useState({
    clientId: '', platform: 'Instagram', date: new Date().toISOString().split('T')[0],
    caption: '', status: 'ideia' as ContentPost['status']
  });

  const handleAdd = () => {
    if (!form.caption && !form.clientId) return;
    addContent({ clientId: form.clientId, platform: form.platform, date: form.date, caption: form.caption, status: form.status });
    setForm({ clientId: '', platform: 'Instagram', date: new Date().toISOString().split('T')[0], caption: '', status: 'ideia' });
    setShowForm(false);
  };

  const handleApprove = (post: ContentPost) => {
    updateContentStatus(post.id, 'aprovado');
  };

  const getClient = (id: string) => clients.find(c => c.id === id);

  const upcomingPosts = [...content].sort((a, b) => a.date.localeCompare(b.date));
  const totalApproved = content.filter(c => c.status === 'aprovado' || c.status === 'publicado').length;

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Conteúdo Editorial</h1>
          <p className="page-subtitle">Pipeline de posts, aprovações e calendário de publicação</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Novo Conteúdo</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 28 }}>
        {STATUS_ORDER.map(s => {
          const count = content.filter(c => c.status === s).length;
          const cfg = STATUS_CONFIG[s];
          return (
            <div key={s} className="card" style={{ padding: '14px 18px', borderTop: `3px solid ${cfg.color}` }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>{cfg.label}</p>
              <p style={{ fontSize: 24, fontWeight: 800, color: cfg.color }}>{count}</p>
            </div>
          );
        })}
      </div>

      {/* Kanban Editorial */}
      <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16 }}>
        {STATUS_ORDER.map(status => {
          const cfg = STATUS_CONFIG[status];
          const columnPosts = content.filter(c => c.status === status);
          return (
            <div key={status} style={{ minWidth: 260, flex: '0 0 260px' }}>
              {/* Column Header */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', background: 'var(--bg-card)', borderRadius: '10px 10px 0 0',
                borderBottom: `3px solid ${cfg.color}`, border: '1px solid var(--border)'
              }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{cfg.label}</span>
                <span className={`badge ${cfg.badge}`}>{columnPosts.length}</span>
              </div>

              {/* Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '10px 0', minHeight: 200 }}>
                {columnPosts.map(post => {
                  const client = getClient(post.clientId);
                  return (
                    <div key={post.id} className="card" style={{
                      padding: '14px', cursor: 'pointer', borderLeft: `3px solid ${cfg.color}`,
                      transition: 'var(--transition)'
                    }} onClick={() => setViewPost(post)}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateX(3px)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 18 }}>{PLATFORM_ICON[post.platform] || '📣'}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{post.platform}</span>
                      </div>
                      <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {post.caption || 'Sem legenda'}
                      </p>
                      {client && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>👤 {client.company}</p>}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>📅 {new Date(post.date).toLocaleDateString('pt-BR')}</p>
                        {status === 'revisao' && (
                          <button className="btn btn-success btn-sm" style={{ fontSize: 11, padding: '3px 10px' }} onClick={e => { e.stopPropagation(); handleApprove(post); }}>
                            <CheckCircle size={11} /> Aprovar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {columnPosts.length === 0 && (
                  <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                    Nenhum post aqui
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 20, padding: '14px 20px', background: 'var(--purple-glow)', borderRadius: 10, border: '1px solid rgba(124,58,237,0.2)' }}>
        <div style={{ width: 36, height: 36, background: 'var(--purple)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <CheckCircle size={18} color="#fff" />
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--purple)' }}>
            {totalApproved} posts aprovados ou publicados no total
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Ao aprovar um post, ele é automaticamente adicionado à Agenda com a data de publicação.
          </p>
        </div>
      </div>

      {/* ─── POST DETAIL MODAL ───────────────────────────────── */}
      {viewPost && (
        <div className="modal-overlay" onClick={() => setViewPost(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 28 }}>{PLATFORM_ICON[viewPost.platform]}</span>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700 }}>{viewPost.platform} · {getClient(viewPost.clientId)?.company}</h2>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Publicação: {new Date(viewPost.date).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setViewPost(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div style={{ background: 'var(--bg-subtle)', borderRadius: 10, padding: 20, marginBottom: 16 }}>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-main)' }}>{viewPost.caption}</p>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <span className={`badge ${STATUS_CONFIG[viewPost.status].badge}`}>{STATUS_CONFIG[viewPost.status].label}</span>
                <span className="badge badge-muted">{viewPost.platform}</span>
                <span className="badge badge-muted">📅 {new Date(viewPost.date).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setViewPost(null)}>Fechar</button>
              {viewPost.status === 'revisao' && (
                <button className="btn btn-success" onClick={() => { handleApprove(viewPost); setViewPost(null); }}><CheckCircle size={14} /> Aprovar Post</button>
              )}
              {STATUS_ORDER.indexOf(viewPost.status) < STATUS_ORDER.length - 1 && viewPost.status !== 'revisao' && (
                <button className="btn btn-primary" onClick={() => {
                  const nextStatus = STATUS_ORDER[STATUS_ORDER.indexOf(viewPost.status) + 1];
                  updateContentStatus(viewPost.id, nextStatus);
                  setViewPost(null);
                }}>
                  <Eye size={14} /> Avançar para: {STATUS_CONFIG[STATUS_ORDER[STATUS_ORDER.indexOf(viewPost.status) + 1]]?.label}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── ADD CONTENT MODAL ───────────────────────────────── */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Novo Conteúdo</h2>
              <button className="btn-icon" onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Cliente</label>
                  <select className="input" value={form.clientId} onChange={e => setForm(p => ({ ...p, clientId: e.target.value }))}>
                    <option value="">Sem cliente</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.company}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Plataforma</label>
                  <select className="input" value={form.platform} onChange={e => setForm(p => ({ ...p, platform: e.target.value }))}>
                    {PLATFORMS.map(p => <option key={p} value={p}>{PLATFORM_ICON[p]} {p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Data de Publicação</label>
                  <input className="input" type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Status Inicial</label>
                  <select className="input" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as ContentPost['status'] }))}>
                    {STATUS_ORDER.slice(0, 3).map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Legenda / Texto *</label>
                  <textarea className="input" style={{ minHeight: 100 }} placeholder="Escreva a legenda do post..." value={form.caption} onChange={e => setForm(p => ({ ...p, caption: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleAdd} disabled={!form.caption}><Plus size={14} /> Criar Post</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
