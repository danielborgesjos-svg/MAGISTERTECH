import { useState, useContext, useRef } from 'react';
import {
  Plus, Pin, Trash2, Megaphone, BookOpen, Briefcase, Bell, Info,
  MessageCircle, Image as ImageIcon, Calendar, X, Heart, ThumbsUp, Send
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { AuthContext } from '../contexts/AuthContext';
import type { FeedPost } from '../contexts/DataContext';

const TYPE_CONFIG: Record<FeedPost['type'], { label: string; color: string; bg: string; icon: React.ElementType }> = {
  aviso:       { label: 'Aviso',       color: '#EF4444', bg: 'rgba(239,68,68,0.1)',   icon: Bell },
  anuncio:     { label: 'Anúncio',     color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)', icon: Megaphone },
  comunicado:  { label: 'Comunicado',  color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', icon: MessageCircle },
  curso:       { label: 'Curso',       color: '#10B981', bg: 'rgba(16,185,129,0.1)', icon: BookOpen },
  vaga:        { label: 'Vaga',        color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', icon: Briefcase },
  informacao:  { label: 'Informação',  color: '#64748B', bg: 'rgba(100,116,139,0.1)',icon: Info },
};

const fmt = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) + ' • ' +
    d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

function FeedCard({ post, onDelete, onPin, onReact, currUser }: {
  post: FeedPost;
  onDelete: (id: string) => void;
  onPin: (id: string) => void;
  onReact: (id: string, emoji: string) => void;
  currUser: string;
}) {
  const cfg = TYPE_CONFIG[post.type];
  const Icon = cfg.icon;
  const liked = post.reactions?.find(r => r.emoji === '👍')?.users.includes(currUser);
  const likeCount = post.reactions?.find(r => r.emoji === '👍')?.users.length ?? 0;

  return (
    <div className="card" style={{ marginBottom: 16, borderLeft: `3px solid ${cfg.color}`, transition: 'all 0.2s' }}>
      {post.pinned && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, fontSize: 11, fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <Pin size={12} /> Fixado
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div className="avatar" style={{ width: 40, height: 40, fontSize: 14, fontWeight: 800, background: cfg.color, flexShrink: 0 }}>
          {post.authorInitials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>{post.authorName}</span>
            <span className="badge" style={{ background: cfg.bg, color: cfg.color, fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icon size={10} /> {cfg.label}
            </span>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{fmt(post.createdAt)}</p>
        </div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <button className="btn-icon btn-sm" title="Fixar/Desafixar" onClick={() => onPin(post.id)}
            style={{ color: post.pinned ? '#F59E0B' : undefined }}>
            <Pin size={13} />
          </button>
          <button className="btn-icon btn-sm" title="Excluir" onClick={() => onDelete(post.id)} style={{ color: 'var(--danger)' }}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Content */}
      <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8, lineHeight: 1.4 }}>{post.title}</h3>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{post.content}</p>

      {/* Image preview */}
      {(post as any).imageUrl && (
        <div style={{ marginTop: 14, borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)' }}>
          <img src={(post as any).imageUrl} alt="Anexo" style={{ width: '100%', maxHeight: 400, objectFit: 'cover', display: 'block' }}
            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
        </div>
      )}

      {/* Invite / Event Card */}
      {(post as any).eventDate && (
        <div style={{ marginTop: 14, padding: '12px 16px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', gap: 12, border: '1px dashed var(--border)' }}>
          <Calendar size={20} color="var(--primary)" />
          <div>
            <p style={{ fontWeight: 700, fontSize: 13 }}>{(post as any).eventTitle || 'Evento'}</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{(post as any).eventDate} {(post as any).eventTime ? `às ${(post as any).eventTime}` : ''}</p>
          </div>
        </div>
      )}

      {/* Reactions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
        <button
          onClick={() => onReact(post.id, '👍')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px',
            borderRadius: 100, border: `1.5px solid ${liked ? 'var(--primary)' : 'var(--border)'}`,
            background: liked ? 'var(--primary-glow)' : 'transparent', cursor: 'pointer',
            fontSize: 12, fontWeight: 700, color: liked ? 'var(--primary)' : 'var(--text-muted)',
            transition: 'all 0.2s'
          }}>
          <ThumbsUp size={13} /> {likeCount > 0 ? likeCount : ''} Curtir
        </button>
        <button onClick={() => onReact(post.id, '❤️')}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 100, border: '1.5px solid var(--border)', background: 'transparent', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)' }}>
          <Heart size={13} />
          {post.reactions?.find(r => r.emoji === '❤️')?.users.length ?? 0}
        </button>
      </div>
    </div>
  );
}

export default function Feed() {
  const { feed, addFeedPost, deleteFeedPost, pinFeedPost } = useData();
  const { user } = useContext(AuthContext);
  const [compose, setCompose] = useState(false);
  const [filter, setFilter] = useState<FeedPost['type'] | 'all'>('all');
  const [form, setForm] = useState({
    type: 'comunicado' as FeedPost['type'],
    title: '',
    content: '',
    imageUrl: '',
    hasEvent: false,
    eventTitle: '',
    eventDate: '',
    eventTime: '',
  });
  const fileRef = useRef<HTMLInputElement>(null);

  const authorInitials = user?.name?.substring(0, 2).toUpperCase() || 'AD';
  const authorName = user?.name || 'Admin';

  const handlePost = () => {
    if (!form.title || !form.content) return;
    const postData: any = {
      authorId: user?.id || 'admin',
      authorName,
      authorInitials,
      type: form.type,
      title: form.title,
      content: form.content,
      pinned: false,
      reactions: [{ emoji: '👍', users: [] }, { emoji: '❤️', users: [] }],
      ...(form.imageUrl ? { imageUrl: form.imageUrl } : {}),
      ...(form.hasEvent ? { eventTitle: form.eventTitle, eventDate: form.eventDate, eventTime: form.eventTime } : {}),
    };
    addFeedPost(postData);
    setForm({ type: 'comunicado', title: '', content: '', imageUrl: '', hasEvent: false, eventTitle: '', eventDate: '', eventTime: '' });
    setCompose(false);
  };

  const handleReact = (postId: string, emoji: string) => {
    const userId = user?.id || 'admin';
    // We update feed via context — use DataContext's updateFeedPost if it exists, otherwise local reaction toggle approach
    // Since DataContext has feed state, we read and trigger re-render by forcing a deleteFeedPost+addFeedPost cycle
    const post = feed.find(p => p.id === postId);
    if (!post) return;
    const reactions = post.reactions ? [...post.reactions] : [{ emoji: '👍', users: [] }, { emoji: '❤️', users: [] }];
    const reactionIdx = reactions.findIndex(r => r.emoji === emoji);
    if (reactionIdx >= 0) {
      const existing = reactions[reactionIdx];
      const alreadyReacted = existing.users.includes(userId);
      reactions[reactionIdx] = {
        ...existing,
        users: alreadyReacted ? existing.users.filter(u => u !== userId) : [...existing.users, userId],
      };
    } else {
      reactions.push({ emoji, users: [userId] });
    }
    // Rebuild post — delete + re-add with same id is not ideal but works offline-first
    deleteFeedPost(postId);
    addFeedPost({ ...post, reactions });
  };

  const filtered = feed
    .filter(p => filter === 'all' || p.type === filter)
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const count = (t: FeedPost['type']) => feed.filter(p => p.type === t).length;

  return (
    <div className="animate-fade-up" style={{ maxWidth: 780, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 className="page-title">Mural Corporativo</h1>
          <p className="page-subtitle">Feed interno da equipe — avisos, cursos, vagas e comunicados.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setCompose(true)} style={{ gap: 8, flexShrink: 0 }}>
          <Plus size={15} /> Nova Publicação
        </button>
      </div>

      {/* Type filter chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {(['all', ...Object.keys(TYPE_CONFIG)] as const).map(t => {
          const isActive = filter === t;
          const cfg = t !== 'all' ? TYPE_CONFIG[t as FeedPost['type']] : null;
          return (
            <button key={t} onClick={() => setFilter(t as any)}
              style={{
                padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: '1.5px solid',
                borderColor: isActive ? (cfg?.color || 'var(--primary)') : 'var(--border)',
                background: isActive ? (cfg?.bg || 'var(--primary-glow)') : 'transparent',
                color: isActive ? (cfg?.color || 'var(--primary)') : 'var(--text-muted)',
                transition: 'all 0.2s',
              }}>
              {t === 'all' ? `Todos (${feed.length})` : `${cfg!.label} (${count(t as FeedPost['type'])})`}
            </button>
          );
        })}
      </div>

      {/* Feed list */}
      {filtered.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <Megaphone size={40} style={{ marginBottom: 16, opacity: 0.3 }} />
          <p style={{ fontWeight: 600, marginBottom: 6 }}>Nenhuma publicação encontrada</p>
          <p style={{ fontSize: 13 }}>Clique em "Nova Publicação" para começar.</p>
        </div>
      )}
      {filtered.map(post => (
        <FeedCard
          key={post.id}
          post={post}
          currUser={user?.id || 'admin'}
          onDelete={(id) => { if (confirm('Excluir publicação?')) deleteFeedPost(id); }}
          onPin={pinFeedPost}
          onReact={handleReact}
        />
      ))}

      {/* Compose Modal */}
      {compose && (
        <div className="modal-overlay" onClick={() => setCompose(false)}>
          <div className="modal" style={{ maxWidth: 600, width: '95vw' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: 16, fontWeight: 800 }}>Nova Publicação</h2>
              <button className="btn-icon" onClick={() => setCompose(false)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Type selector */}
              <div>
                <label className="form-label">Tipo de Publicação</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(Object.keys(TYPE_CONFIG) as FeedPost['type'][]).map(t => {
                    const cfg = TYPE_CONFIG[t];
                    const Icon = cfg.icon;
                    const isActive = form.type === t;
                    return (
                      <button key={t} onClick={() => setForm(p => ({ ...p, type: t }))}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px',
                          borderRadius: 100, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: '1.5px solid',
                          borderColor: isActive ? cfg.color : 'var(--border)',
                          background: isActive ? cfg.bg : 'transparent',
                          color: isActive ? cfg.color : 'var(--text-muted)',
                          transition: 'all 0.2s',
                        }}>
                        <Icon size={12} /> {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="form-label">Título *</label>
                <input className="input" placeholder="Ex: Reunião semanal cancelada" value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
              </div>

              <div>
                <label className="form-label">Conteúdo *</label>
                <textarea className="input" rows={4} placeholder="Escreva a mensagem completa aqui..."
                  value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} />
              </div>

              {/* Image URL */}
              <div>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ImageIcon size={13} /> Imagem (URL ou cole link direto)
                </label>
                <input className="input" placeholder="https://exemplo.com/imagem.jpg" value={form.imageUrl}
                  onChange={e => setForm(p => ({ ...p, imageUrl: e.target.value }))} />
                {form.imageUrl && (
                  <img src={form.imageUrl} alt="Preview" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', marginTop: 8, borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                )}
              </div>

              {/* Event Invite */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>
                  <input type="checkbox" checked={form.hasEvent} onChange={e => setForm(p => ({ ...p, hasEvent: e.target.checked }))}
                    style={{ width: 16, height: 16 }} />
                  <Calendar size={13} /> Adicionar convite / evento
                </label>
                {form.hasEvent && (
                  <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    <div style={{ gridColumn: '1/-1' }}>
                      <label className="form-label">Título do Evento</label>
                      <input className="input" placeholder="Ex: Stand-up Daily" value={form.eventTitle}
                        onChange={e => setForm(p => ({ ...p, eventTitle: e.target.value }))} />
                    </div>
                    <div>
                      <label className="form-label">Data</label>
                      <input className="input" type="date" value={form.eventDate}
                        onChange={e => setForm(p => ({ ...p, eventDate: e.target.value }))} />
                    </div>
                    <div>
                      <label className="form-label">Horário</label>
                      <input className="input" type="time" value={form.eventTime}
                        onChange={e => setForm(p => ({ ...p, eventTime: e.target.value }))} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setCompose(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handlePost} disabled={!form.title || !form.content} style={{ gap: 8 }}>
                <Send size={14} /> Publicar
              </button>
            </div>
          </div>
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} />
    </div>
  );
}
