import { useState, useContext } from 'react';
import {
  Star, CheckCircle, Plus, X, Users, Mail, Phone, Trash2, Edit2, 
  Pin, Activity, MessageSquare, Shield,
  Bell, Megaphone, BookOpen, Briefcase, Info, Send
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { AuthContext } from '../contexts/AuthContext';
import type { FeedPost } from '../contexts/DataContext';

const FEED_TYPE_CONFIG: Record<FeedPost['type'], { label: string; color: string; icon: React.ElementType }> = {
  aviso: { label: 'Aviso', color: 'var(--danger)', icon: Bell },
  anuncio: { label: 'Anúncio', color: 'var(--primary)', icon: Megaphone },
  curso: { label: 'Curso', color: 'var(--indigo)', icon: BookOpen },
  vaga: { label: 'Vaga', color: 'var(--success)', icon: Briefcase },
  comunicado: { label: 'Comunicado', color: 'var(--warning)', icon: Info },
  informacao: { label: 'Informação', color: 'var(--secondary)', icon: Info },
};

export default function Equipe() {
  const { team, kanban, feed, addTeamRating, addTeamMember, updateTeamMember, addFeedPost, deleteFeedPost, pinFeedPost, addFeedComment, updateMemberPassword, updateMemberPermissions } = useData();
  const { user } = useContext(AuthContext);

  const [selected, setSelected] = useState(team[0] || null);
  const [activeTab, setActiveTab] = useState<'team' | 'feed'>('team');
  const [profileTab, setProfileTab] = useState<'perfil' | 'contrato'>('perfil');
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [saved, setSaved] = useState(false);
  const [hoverStar, setHoverStar] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isManagingAccess, setIsManagingAccess] = useState(false);
  const initialForm = { name: '', initials: '', role: 'USER', sector: 'Operacional', email: '', phone: '', whatsapp: '', instagram: '', linkedin: '', bio: '', profileColor: '#7c3aed', photoUrl: '', password: '', accessLevel: 'VIEWER' as const, permissions: ['dashboard', 'chat'] };
  const [formData, setFormData] = useState(initialForm);

  const [feedTitle, setFeedTitle] = useState('');
  const [feedContent, setFeedContent] = useState('');
  const [feedType, setFeedType] = useState<FeedPost['type']>('informacao');
  const [showFeedForm, setShowFeedForm] = useState(false);

  const handleSubmit = () => {
    if (rating === 0 || !feedback.trim() || !selected) return;
    addTeamRating(selected.id, rating, feedback);
    setSaved(true);
    setFeedback('');
    setRating(0);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleSaveMember = () => {
    if (!formData.name || !formData.email) return;
    if (isEditing && selected) {
      updateTeamMember(selected.id, formData);
      if (formData.password) {
        updateMemberPassword(selected.id, formData.password);
      }
      setIsEditing(false);
      setSelected({ ...selected, ...formData } as any);
    } else {
      const parts = formData.name.split(' ');
      const authInitials = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : formData.name.substring(0, 2);
      addTeamMember({ ...formData, initials: authInitials.toUpperCase().substring(0, 2) } as any);
      setIsAdding(false);
    }
  };

  const handlePostFeed = () => {
    if (!feedTitle.trim() || !feedContent.trim()) return;
    const currentMember = team.find(m => m.email === user?.email) || team[0];
    addFeedPost({
      authorId: currentMember?.id || 'system',
      authorName: currentMember?.name || user?.name || 'Sistema',
      authorInitials: currentMember?.initials || (user?.name?.substring(0, 2).toUpperCase()) || 'SI',
      type: feedType,
      title: feedTitle,
      content: feedContent,
    });
    setFeedTitle('');
    setFeedContent('');
    setShowFeedForm(false);
  };

  const getTaskCount = (initials: string) =>
    kanban.flatMap(c => c.tasks).filter(t => t.assignee === initials).length;

  const sectorColors: Record<string, string> = {
    Diretoria: 'var(--primary)', Design: 'var(--purple)', Dev: 'var(--success)', Comercial: 'var(--warning)', Operacional: 'var(--secondary)'
  };

  const pinnedPosts = feed.filter(p => p.pinned).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const regularPosts = feed.filter(p => !p.pinned).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="animate-in">
      {/* ─── HEADER COCKPIT ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 100, fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Activity size={12} color="var(--primary)" /> Operações · Gestão de Colaboradores
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-main)', margin: 0, lineHeight: 1.1 }}>
            Equipe & Canal Interno
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8 }}>
            Gestão de colaboradores, perfis, carga de trabalho e comunicados internos.
          </p>
        </div>
      </div>

      {/* ─── TABS & CONTROLS ───────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div className="tab-list" style={{ width: 'auto' }}>
          <button className={`tab-btn ${activeTab === 'team' ? 'active' : ''}`} onClick={() => setActiveTab('team')} style={{ flex: 'unset', padding: '8px 18px' }}>
            <Users size={14} style={{ display: 'inline', marginRight: 6 }} /> Equipe
          </button>
          <button className={`tab-btn ${activeTab === 'feed' ? 'active' : ''}`} onClick={() => setActiveTab('feed')} style={{ flex: 'unset', padding: '8px 18px' }}>
            <Megaphone size={14} style={{ display: 'inline', marginRight: 6 }} /> Feed Interno
          </button>
        </div>
        {activeTab === 'team' ? (
          <button className="btn btn-primary" onClick={() => { setIsAdding(true); setIsEditing(false); setFormData(initialForm as any); }}>
            <Plus size={16} /> Novo Usuário
          </button>
        ) : (
          <button className="btn btn-primary" onClick={() => setShowFeedForm(!showFeedForm)}>
            <Plus size={16} /> Novo Post
          </button>
        )}
      </div>

      {/* ─── TEAM TAB ──────────────────────────────────────────────────────── */}
      {activeTab === 'team' && (
        <div className="equipe-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: 24 }}>
          {/* Team List */}
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {team.map(member => {
                const tasksCount = getTaskCount(member.initials);
                const isSelected = selected?.id === member.id;
                const hue = (member.initials.charCodeAt(0) * 37 + (member.initials[1]?.charCodeAt(0) || 20) * 360) % 360;
                const avatarBg = member.profileColor || `hsl(${hue}, 60%, 45%)`;
                return (
                  <div key={member.id} className="card" onClick={() => { setSelected(member); setIsAdding(false); setIsEditing(false); }}
                    style={{ cursor: 'pointer', padding: '16px 18px', borderLeft: isSelected ? `4px solid ${sectorColors[member.sector] || 'var(--primary)'}` : '4px solid transparent', background: isSelected ? `${sectorColors[member.sector] || 'var(--primary)'}06` : undefined, transition: 'var(--transition)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className="avatar avatar-md" style={{ background: avatarBg }}>
                        {member.photoUrl ? <img src={member.photoUrl} alt={member.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : member.initials}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 700, fontSize: 14 }}>{member.name}</p>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{member.sector}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                          <Star size={12} fill="var(--warning)" color="var(--warning)" />
                          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--warning)' }}>{member.performance}</span>
                        </div>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{tasksCount} tarefas</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel - Profile / Add */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {(isAdding || isEditing) ? (
              <div className="card" style={{ padding: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h2 style={{ fontSize: 17, fontWeight: 800 }}>{isEditing ? 'Editar Perfil' : 'Novo Colaborador'}</h2>
                  <button className="btn-icon" onClick={() => { setIsAdding(false); setIsEditing(false); }}><X size={18} /></button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label className="form-label">Nome Completo *</label>
                    <input className="input" placeholder="João Silva" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">E-mail (Login) *</label>
                    <input type="email" className="input" placeholder="joao@empresa.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">Setor</label>
                    <input className="input" placeholder="Ex: Design, Dev, Comercial..." value={formData.sector} onChange={e => setFormData({ ...formData, sector: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">WhatsApp</label>
                    <input className="input" placeholder="(41) 99999-9999" value={formData.whatsapp || ''} onChange={e => setFormData({ ...formData, whatsapp: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">Cor do Perfil</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input type="color" value={formData.profileColor || '#7c3aed'} onChange={e => setFormData({ ...formData, profileColor: e.target.value })} style={{ width: 48, height: 36, borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer' }} />
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Senha</label>
                    <input type="password" className="input" placeholder="••••••••" value={formData.password || ''} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                  <button className="btn btn-ghost" onClick={() => { setIsAdding(false); setIsEditing(false); }}>Cancelar</button>
                  <button className="btn btn-primary" onClick={handleSaveMember} disabled={!formData.name || !formData.email}>
                    <CheckCircle size={16} /> Salvar
                  </button>
                </div>
              </div>
            ) : selected ? (
              <>
                <div className="profile-card" style={{ overflow: 'hidden' }}>
                  <div className="profile-card-cover" style={{ height: 100, background: `linear-gradient(135deg, ${selected.profileColor || 'var(--primary)'} 0%, var(--indigo) 100%)`, position: 'relative' }}>
                    <div style={{ position: 'absolute', right: 20, top: 20, display: 'flex', gap: 8 }}>
                      {(user?.accessLevel === 'ADMIN' || user?.role?.toUpperCase() === 'CEO' || user?.role?.toUpperCase() === 'ADMIN') && (
                        <button className="btn-icon" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff' }} title="Gerenciar Permissões" onClick={() => setIsManagingAccess(true)}><Shield size={14} /></button>
                      )}
                      <button className="btn-icon" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff' }}
                        onClick={() => {
                          setFormData({ ...selected, password: '' } as any);
                          setIsEditing(true);
                        }}><Edit2 size={14} /></button>
                    </div>
                  </div>
                  <div className="profile-card-body" style={{ padding: '0 24px 24px', textAlign: 'center' }}>
                    <div className="avatar avatar-xl" style={{ margin: '-40px auto 16px', background: selected.profileColor || `hsl(${selected.initials.charCodeAt(0) * 40}, 60%, 50%)`, border: '4px solid var(--bg-card)', boxShadow: 'var(--shadow)', width: 80, height: 80 }}>
                      {selected.photoUrl ? <img src={selected.photoUrl} alt={selected.name} style={{ width: '100%', height: '100%', borderRadius: '50%' }} /> : selected.initials}
                    </div>
                    <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 4 }}>{selected.name}</h2>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{selected.sector} · {selected.role}</p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 14 }}>
                      {selected.whatsapp && <a href={`https://wa.me/${selected.whatsapp.replace(/\D/g, '')}`} className="btn btn-ghost btn-sm"><Phone size={13} /> WhatsApp</a>}
                      {selected.email && <a href={`mailto:${selected.email}`} className="btn btn-ghost btn-sm"><Mail size={13} /> E-mail</a>}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 24, marginTop: 16, marginBottom: 16, padding: '0 8px', borderBottom: '1px solid var(--border)' }}>
                  <button onClick={() => setProfileTab('perfil')} style={{ background: 'none', border: 'none', color: profileTab === 'perfil' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 800, borderBottom: profileTab === 'perfil' ? '2px solid var(--primary)' : '2px solid transparent', paddingBottom: 8, cursor: 'pointer' }}>Avaliações</button>
                  <button onClick={() => setProfileTab('contrato')} style={{ background: 'none', border: 'none', color: profileTab === 'contrato' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 800, borderBottom: profileTab === 'contrato' ? '2px solid var(--primary)' : '2px solid transparent', paddingBottom: 8, cursor: 'pointer' }}>Contrato de Trabalho</button>
                </div>

                {profileTab === 'perfil' ? (
                  <div className="card" style={{ padding: 24 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 16 }}>Avaliação de Desempenho</h4>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star key={star} size={28} onMouseEnter={() => setHoverStar(star)} onMouseLeave={() => setHoverStar(0)} onClick={() => setRating(star)} fill={(hoverStar || rating) >= star ? 'var(--warning)' : 'transparent'} color={(hoverStar || rating) >= star ? 'var(--warning)' : 'var(--text-muted)'} style={{ cursor: 'pointer' }} />
                      ))}
                    </div>
                    <textarea className="input" style={{ width: '100%', minHeight: 80 }} placeholder="Feedback..." value={feedback} onChange={e => setFeedback(e.target.value)} />
                    <button className="btn btn-primary" onClick={handleSubmit} disabled={rating === 0 || !feedback.trim() || saved} style={{ width: '100%', marginTop: 12 }}>
                      {saved ? 'Avaliação Salva!' : 'Gravar Avaliação'}
                    </button>
                  </div>
                ) : (
                  <div className="card" style={{ padding: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 800 }}>Contrato & Vínculo</h4>
                      <span className="badge badge-success">Ativo</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <label className="form-label" style={{ fontSize: 11 }}>Tipo de Vínculo</label>
                        <select className="input" style={{ width: '100%' }}>
                          <option>PJ (Prestação de Serviços)</option>
                          <option>CLT</option>
                          <option>Estágio</option>
                          <option>Freelancer (Demanda)</option>
                        </select>
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: 11 }}>Carga Horária / Escopo</label>
                        <input className="input" placeholder="Ex: 40h semanais" style={{ width: '100%' }} />
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: 11 }}>Remuneração Base</label>
                        <input className="input" placeholder="R$ 0,00" style={{ width: '100%' }} />
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: 11 }}>Data de Início</label>
                        <input type="date" className="input" style={{ width: '100%' }} />
                      </div>
                    </div>
                    <div style={{ marginTop: 24 }}>
                      <label className="form-label" style={{ fontSize: 11 }}>Acordos Específicos & Bônus</label>
                      <textarea className="input" rows={3} style={{ width: '100%' }} placeholder="Regras de comissão, metas, equipamentos cedidos..."></textarea>
                    </div>
                    <button className="btn btn-primary" style={{ width: '100%', marginTop: 20 }}>Atualizar Contrato</button>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* ─── FEED TAB ──────────────────────────────────────────────────────── */}
      {activeTab === 'feed' && (
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          {showFeedForm && (
            <div className="card" style={{ marginBottom: 24, padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800 }}>Novo Comunicado</h3>
                <button className="btn-icon" onClick={() => setShowFeedForm(false)}><X size={16} /></button>
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                {(Object.keys(FEED_TYPE_CONFIG) as Array<keyof typeof FEED_TYPE_CONFIG>).map(type => {
                  const cfg = FEED_TYPE_CONFIG[type];
                  return (
                    <button key={type} onClick={() => setFeedType(type)} style={{ padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: `1.5px solid ${feedType === type ? cfg.color : 'var(--border)'}`, background: feedType === type ? `${cfg.color}12` : 'transparent', color: feedType === type ? cfg.color : 'var(--text-muted)' }}>{cfg.label}</button>
                  );
                })}
              </div>
              <input className="input" placeholder="Título..." value={feedTitle} onChange={e => setFeedTitle(e.target.value)} style={{ width: '100%', marginBottom: 10 }} />
              <textarea className="input" rows={4} placeholder="Conteúdo..." value={feedContent} onChange={e => setFeedContent(e.target.value)} style={{ width: '100%', marginBottom: 14 }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-primary" onClick={handlePostFeed}><Send size={14} /> Publicar</button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {pinnedPosts.map(post => <FeedPostCard key={post.id} post={post} onDelete={deleteFeedPost} onPin={pinFeedPost} onAddComment={(text: string) => addFeedComment(post.id, { authorName: user?.name || 'Membro', authorInitials: user?.name?.substring(0,2).toUpperCase() || 'ME', text })} />)}
            {regularPosts.map(post => <FeedPostCard key={post.id} post={post} onDelete={deleteFeedPost} onPin={pinFeedPost} onAddComment={(text: string) => addFeedComment(post.id, { authorName: user?.name || 'Membro', authorInitials: user?.name?.substring(0,2).toUpperCase() || 'ME', text })} />)}
            {feed.length === 0 && <div className="card" style={{ padding: 40, textAlign: 'center' }}><Megaphone size={40} style={{ margin: '0 auto 12px' }} /><p>Nenhum post.</p></div>}
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {isManagingAccess && selected && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card animate-scale-in" style={{ width: '100%', maxWidth: 500, padding: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
              <div><h2 style={{ fontSize: 18, fontWeight: 900 }}>Acessos & Permissões</h2></div>
              <button className="btn-icon" onClick={() => setIsManagingAccess(false)}><X size={18} /></button>
            </div>
            <div style={{ marginBottom: 24 }}>
              <label className="form-label">Nível</label>
              <select className="input" style={{ width: '100%' }} value={selected.accessLevel || 'VIEWER'} onChange={(e) => updateMemberPermissions(selected.id, selected.permissions || [], e.target.value as any)}>
                <option value="VIEWER">Visualizador</option>
                <option value="EDITOR">Editor</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {['dashboard', 'kanban', 'crm', 'pipeline', 'financeiro', 'projetos', 'conteudo', 'equipe', 'agenda', 'chat', 'feed', 'config'].map(mod => {
                const isEnabled = (selected.permissions || []).includes(mod);
                return (
                  <label key={mod} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: isEnabled ? 'var(--bg-subtle)' : 'transparent', border: '1px solid var(--border)', borderRadius: 12, cursor: 'pointer', transition: 'var(--transition)' }}>
                    <input type="checkbox" checked={isEnabled} onChange={() => {
                      const next = isEnabled ? (selected.permissions || []).filter(p => p !== mod) : [...(selected.permissions || []), mod];
                      updateMemberPermissions(selected.id, next, selected.accessLevel || 'VIEWER');
                      setSelected({ ...selected, permissions: next } as any);
                    }} style={{ width: 16, height: 16, accentColor: 'var(--primary)' }} />
                    <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'capitalize' }}>{mod === 'crm' ? 'CRM' : mod}</span>
                  </label>
                );
              })}
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: 24 }} onClick={() => setIsManagingAccess(false)}>Salvar</button>
          </div>
        </div>
      )}
    </div>
  );
}

function FeedPostCard({ post, onDelete, onPin, onAddComment }: { post: FeedPost; onDelete: (id: string) => void; onPin: (id: string) => void; onAddComment: (text: string) => void }) {
  const cfg = FEED_TYPE_CONFIG[post.type];
  const [comment, setComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const Icon = cfg.icon;
  return (
    <div className="card" style={{ padding: '24px', border: post.pinned ? '1px solid var(--warning-glow)' : '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <div className="avatar avatar-md" style={{ background: `hsl(${post.authorInitials.charCodeAt(0) * 40}, 60%, 45%)`, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', color: '#fff', fontWeight: 700 }}>{post.authorInitials}</div>
          <div><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontWeight: 800, fontSize: 15 }}>{post.authorName}</span><span className="badge" style={{ background: `${cfg.color}15`, color: cfg.color, padding: '4px 8px', borderRadius: 6, fontSize: 11 }}><Icon size={10} /> {cfg.label}</span></div></div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn-icon" onClick={() => onPin(post.id)}><Pin size={14} style={{ color: post.pinned ? 'var(--warning)' : 'var(--text-muted)' }} /></button>
          <button className="btn-icon" onClick={() => (confirm('Excluir?') && onDelete(post.id))}><Trash2 size={14} /></button>
        </div>
      </div>
      <h3 style={{ fontSize: 17, fontWeight: 900, marginBottom: 10 }}>{post.title}</h3>
      <p style={{ fontSize: 15, color: 'var(--text-sec)', lineHeight: 1.7, marginBottom: 20 }}>{post.content}</p>
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}><button className="btn btn-ghost btn-sm" onClick={() => setShowComments(!showComments)}><MessageSquare size={14} /> {post.comments?.length || 0} Comentários</button></div>
      {showComments && (
        <div style={{ marginTop: 16 }}>
          {post.comments?.map((c) => (
            <div key={c.id} style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <div className="avatar avatar-xs" style={{ background: 'var(--bg-subtle)', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: 11 }}>{c.authorInitials}</div>
              <div style={{ flex: 1, background: 'var(--bg-subtle)', padding: '10px 14px', borderRadius: 12 }}><p style={{ fontWeight: 800, fontSize: 12 }}>{c.authorName}</p><p style={{ fontSize: 13 }}>{c.text}</p></div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}><input className="input" style={{ flex: 1 }} placeholder="Comentar..." value={comment} onChange={e => setComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && comment.trim() && (onAddComment(comment), setComment(''))} /><button className="btn btn-primary" onClick={() => { if(comment.trim()){onAddComment(comment); setComment('');} }} disabled={!comment.trim()}>Postar</button></div>
        </div>
      )}
    </div>
  );
}
