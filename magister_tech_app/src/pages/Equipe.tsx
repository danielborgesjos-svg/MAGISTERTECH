import { useState, useContext } from 'react';
import {
  Star, CheckCircle, Plus, X, Users, Pin, Trash2,
  Megaphone, BookOpen, Briefcase, Info, Bell, Send,
  Phone, Mail, Edit, Camera, Activity
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
  const { team, kanban, feed, addTeamRating, addTeamMember, updateTeamMember, deleteTeamMember, addFeedPost, deleteFeedPost, pinFeedPost } = useData();
  const { user } = useContext(AuthContext);

  const [selected, setSelected] = useState(team[0] || null);
  const [activeTab, setActiveTab] = useState<'team' | 'feed'>('team');
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [saved, setSaved] = useState(false);
  const [hoverStar, setHoverStar] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const initialForm = { name: '', initials: '', role: 'USER', sector: 'Operacional', email: '', phone: '', whatsapp: '', instagram: '', linkedin: '', bio: '', profileColor: '#7c3aed', photoUrl: '' };
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
      setIsEditing(false);
      setSelected({ ...selected, ...formData });
    } else {
      const parts = formData.name.split(' ');
      const authInitials = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : formData.name.substring(0, 2);
      addTeamMember({ ...formData, initials: authInitials.toUpperCase().substring(0, 2) });
      setIsAdding(false);
    }
  };

  const handleDeleteMember = () => {
    if (!selected) return;
    if (confirm(`Remover ${selected.name} do sistema? O acesso será revogado.`)) {
      deleteTeamMember(selected.id);
      setSelected(team.filter(m => m.id !== selected.id)[0] || null);
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
          <button className="btn btn-primary" onClick={() => { setIsAdding(true); setIsEditing(false); setFormData(initialForm); }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: 24 }}>
          {/* Team List */}
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {team.map(member => {
                const tasksCount = getTaskCount(member.initials);
                const isSelected = selected?.id === member.id;
                const hue = (member.initials.charCodeAt(0) * 37 + (member.initials[1]?.charCodeAt(0) || 20) * 19) % 360;
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

                    <div style={{ marginTop: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Carga de Trabalho</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: tasksCount > 6 ? 'var(--danger)' : tasksCount > 3 ? 'var(--warning)' : 'var(--success)' }}>
                          {tasksCount > 6 ? 'Alta' : tasksCount > 3 ? 'Média' : 'Normal'}
                        </span>
                      </div>
                      <div className="progress-track" style={{ height: 5 }}>
                        <div className="progress-fill" style={{ width: `${Math.min(tasksCount * 15, 100)}%`, background: tasksCount > 6 ? 'var(--danger)' : tasksCount > 3 ? 'var(--warning)' : 'var(--success)' }} />
                      </div>
                    </div>
                  </div>
                );
              })}
              {team.length === 0 && (
                <div className="empty-state card"><Users size={32} /><p>Nenhum membro criado</p></div>
              )}
            </div>
          </div>

          {/* Right Panel - Profile / Add */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {(isAdding || isEditing) ? (
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
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
                    <label className="form-label">Permissão (Role)</label>
                    <select className="input" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                      <option value="admin">Gestor / Admin</option>
                      <option value="ceo">CEO</option>
                      <option value="comercial">Comercial</option>
                      <option value="projeto">Projeto</option>
                      <option value="financeiro">Financeiro</option>
                      <option value="USER">Usuário Padrão</option>
                    </select>
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
                    <label className="form-label">Instagram</label>
                    <input className="input" placeholder="@usuario" value={formData.instagram || ''} onChange={e => setFormData({ ...formData, instagram: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">LinkedIn URL</label>
                    <input className="input" placeholder="linkedin.com/in/..." value={formData.linkedin || ''} onChange={e => setFormData({ ...formData, linkedin: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">Cor do Perfil</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input type="color" value={formData.profileColor || '#7c3aed'} onChange={e => setFormData({ ...formData, profileColor: e.target.value })} style={{ width: 48, height: 36, borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer' }} />
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Cor do avatar</span>
                    </div>
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label className="form-label">URL da Foto (opcional)</label>
                    <input className="input" placeholder="https://..." value={formData.photoUrl || ''} onChange={e => setFormData({ ...formData, photoUrl: e.target.value })} />
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label className="form-label">Bio / Apresentação</label>
                    <textarea className="input" rows={2} placeholder="Breve apresentação profissional..." value={formData.bio || ''} onChange={e => setFormData({ ...formData, bio: e.target.value })} />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                  {isEditing ? (
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={handleDeleteMember}>
                      <Trash2 size={14} /> Remover Acesso
                    </button>
                  ) : <div />}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-ghost" onClick={() => { setIsAdding(false); setIsEditing(false); }}>Cancelar</button>
                    <button className="btn btn-primary" onClick={handleSaveMember} disabled={!formData.name || !formData.email}>
                      <CheckCircle size={16} /> {isEditing ? 'Atualizar' : 'Criar Colaborador'}
                    </button>
                  </div>
                </div>
              </div>
            ) : selected ? (
              <>
                {/* Profile Card */}
                <div className="profile-card">
                  <div className="profile-card-cover" style={{ background: `linear-gradient(135deg, ${selected.profileColor || 'var(--primary)'} 0%, var(--indigo) 100%)` }}>
                    <div style={{ position: 'absolute', right: 20, top: 20, display: 'flex', gap: 8 }}>
                      <button className="btn-icon" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff' }}
                        onClick={() => {
                          setFormData({
                            name: selected.name, initials: selected.initials, role: selected.role, sector: selected.sector,
                            email: selected.email, phone: selected.phone || '', whatsapp: selected.whatsapp || '',
                            instagram: selected.instagram || '', linkedin: selected.linkedin || '',
                            bio: selected.bio || '', profileColor: selected.profileColor || '#7c3aed',
                            photoUrl: selected.photoUrl || ''
                          } as any);
                          setIsEditing(true);
                        }}>
                        <Edit size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="profile-card-body">
                    <div className="avatar avatar-xl" style={{ background: selected.profileColor || `hsl(${selected.initials.charCodeAt(0) * 40}, 60%, 50%)`, border: '4px solid var(--bg-card)', boxShadow: 'var(--shadow)' }}>
                      {selected.photoUrl ? <img src={selected.photoUrl} alt={selected.name} /> : selected.initials}
                    </div>

                    <h2 style={{ fontSize: 20, fontWeight: 900, marginTop: 12, letterSpacing: -0.5 }}>{selected.name}</h2>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{selected.sector} · {selected.role}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{selected.email}</p>

                    {selected.bio && (
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 12, lineHeight: 1.65, maxWidth: 480 }}>{selected.bio}</p>
                    )}

                    <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                      {selected.whatsapp && (
                        <a href={`https://wa.me/${selected.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                          className="btn btn-ghost btn-sm">
                          <Phone size={13} /> WhatsApp
                        </a>
                      )}
                      {selected.email && (
                        <a href={`mailto:${selected.email}`} className="btn btn-ghost btn-sm">
                          <Mail size={13} /> E-mail
                        </a>
                      )}
                      {selected.instagram && (
                        <a href={`https://instagram.com/${selected.instagram.replace('@', '')}`} target="_blank" rel="noreferrer"
                          className="btn btn-ghost btn-sm">
                          <Camera size={13} /> Instagram
                        </a>
                      )}
                    </div>

                    {selected.joinedAt && (
                      <p style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 12 }}>
                        Na equipe desde {new Date(selected.joinedAt).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {[
                    { label: 'Tarefas Abertas', value: getTaskCount(selected.initials), color: 'var(--primary)' },
                    { label: 'Avaliações', value: selected.ratings.length, color: 'var(--warning)' },
                    { label: 'Performance', value: `${selected.performance}/5`, color: 'var(--success)' },
                  ].map(s => (
                    <div key={s.label} className="card" style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <p style={{ fontSize: 20, fontWeight: 900, color: s.color, fontFamily: 'Outfit, sans-serif' }}>{s.value}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Avaliações recentes */}
                {selected.ratings.length > 0 && (
                  <div className="card">
                    <h4 style={{ fontSize: 13, fontWeight: 800, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)' }}>Últimas Avaliações</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {selected.ratings.slice(0, 3).map((r, i) => (
                        <div key={i} style={{ padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: 10, borderLeft: '3px solid var(--warning)' }}>
                          <div style={{ display: 'flex', gap: 2, marginBottom: 6 }}>
                            {[1,2,3,4,5].map(s => <Star key={s} size={12} fill={r.stars >= s ? 'var(--warning)' : 'transparent'} color={r.stars >= s ? 'var(--warning)' : 'var(--text-muted)'} />)}
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>{r.date}</span>
                          </div>
                          <p style={{ fontSize: 13 }}>{r.feedback}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nova Avaliação */}
                <div className="card">
                  <h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 16 }}>Nova Avaliação de Desempenho</h4>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star key={star} size={28} onMouseEnter={() => setHoverStar(star)} onMouseLeave={() => setHoverStar(0)}
                        onClick={() => setRating(star)}
                        fill={(hoverStar || rating) >= star ? 'var(--warning)' : 'transparent'}
                        color={(hoverStar || rating) >= star ? 'var(--warning)' : 'var(--text-muted)'}
                        style={{ cursor: 'pointer', transition: '0.15s transform', transform: (hoverStar || rating) >= star ? 'scale(1.15)' : 'scale(1)' }} />
                    ))}
                    {rating > 0 && <span style={{ marginLeft: 8, fontSize: 14, fontWeight: 700, color: 'var(--warning)', alignSelf: 'center' }}>
                      {['', 'Insuficiente', 'Regular', 'Bom', 'Ótimo', 'Excelente'][rating]}
                    </span>}
                  </div>
                  <textarea className="input" style={{ minHeight: 80, resize: 'none', marginBottom: 12 }}
                    placeholder={`Feedback para ${selected.name.split(' ')[0]}...`}
                    value={feedback} onChange={e => setFeedback(e.target.value)} />
                  <button className="btn btn-primary" onClick={handleSubmit} disabled={rating === 0 || !feedback.trim() || saved} style={{ width: '100%' }}>
                    {saved ? <><CheckCircle size={16} /> Avaliação Salva!</> : `Gravar Avaliação`}
                  </button>
                </div>
              </>
            ) : (
              <div className="card"><div className="empty-state"><Users size={36} /><p>Selecione um colaborador</p></div></div>
            )}
          </div>
        </div>
      )}

      {/* ─── FEED TAB ──────────────────────────────────────────────────────── */}
      {activeTab === 'feed' && (
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          {/* New Post Form */}
          {showFeedForm && (
            <div className="card" style={{ marginBottom: 24, border: '1px solid var(--primary-glow)', background: 'var(--bg-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18, alignItems: 'center' }}>
                <h3 style={{ fontSize: 15, fontWeight: 800 }}>Novo Comunicado</h3>
                <button className="btn-icon" onClick={() => setShowFeedForm(false)}><X size={16} /></button>
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                {(Object.keys(FEED_TYPE_CONFIG) as FeedPost['type'][]).map(type => {
                  const cfg = FEED_TYPE_CONFIG[type];
                  return (
                    <button key={type} onClick={() => setFeedType(type)}
                      style={{ padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: `1.5px solid ${feedType === type ? cfg.color : 'var(--border)'}`, background: feedType === type ? `${cfg.color}12` : 'transparent', color: feedType === type ? cfg.color : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <cfg.icon size={12} />{cfg.label}
                    </button>
                  );
                })}
              </div>
              <input className="input" placeholder="Título do comunicado..." value={feedTitle} onChange={e => setFeedTitle(e.target.value)} style={{ marginBottom: 10 }} />
              <textarea className="input" rows={4} placeholder="Escreva o conteúdo do comunicado..." value={feedContent} onChange={e => setFeedContent(e.target.value)} style={{ marginBottom: 14 }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button className="btn btn-ghost" onClick={() => setShowFeedForm(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={handlePostFeed} disabled={!feedTitle.trim() || !feedContent.trim()}>
                  <Send size={14} /> Publicar
                </button>
              </div>
            </div>
          )}

          {/* Pinned Posts */}
          {pinnedPosts.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 12 }}>📌 Fixados</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {pinnedPosts.map(post => <FeedPostCard key={post.id} post={post} onDelete={deleteFeedPost} onPin={pinFeedPost} />)}
              </div>
            </div>
          )}

          {/* All Posts */}
          {feed.length === 0 ? (
            <div className="card"><div className="empty-state">
              <Megaphone size={40} />
              <h3>Canal Interno Silencioso</h3>
              <p>Nenhum comunicado publicado ainda. Comece criando o primeiro!</p>
              <button className="btn btn-primary btn-sm" onClick={() => setShowFeedForm(true)}><Plus size={14} /> Publicar Comunicado</button>
            </div></div>
          ) : regularPosts.length === 0 && pinnedPosts.length > 0 ? null : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {regularPosts.map(post => <FeedPostCard key={post.id} post={post} onDelete={deleteFeedPost} onPin={pinFeedPost} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Sub-component: FeedPostCard
function FeedPostCard({ post, onDelete, onPin }: {
  post: FeedPost;
  onDelete: (id: string) => void;
  onPin: (id: string) => void;
}) {
  const cfg = FEED_TYPE_CONFIG[post.type];
  const Icon = cfg.icon;

  return (
    <div className="feed-post">
      <div className="feed-post-header">
        <div className="avatar avatar-sm" style={{ background: `hsl(${post.authorInitials.charCodeAt(0) * 40}, 60%, 45%)` }}>
          {post.authorInitials}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>{post.authorName}</span>
            <span className="feed-badge" style={{ background: `${cfg.color}12`, color: cfg.color, border: `1px solid ${cfg.color}25` }}>
              <Icon size={11} /> {cfg.label}
            </span>
            {post.pinned && <Pin size={12} style={{ color: 'var(--warning)' }} />}
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {new Date(post.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn-icon" style={{ width: 30, height: 30 }} title={post.pinned ? 'Desafixar' : 'Fixar'} onClick={() => onPin(post.id)}>
            <Pin size={13} style={{ color: post.pinned ? 'var(--warning)' : 'var(--text-muted)' }} />
          </button>
          <button className="btn-icon" style={{ width: 30, height: 30 }} title="Excluir" onClick={() => {
            if (confirm('Excluir este post?')) onDelete(post.id);
          }}>
            <Trash2 size={13} style={{ color: 'var(--danger)' }} />
          </button>
        </div>
      </div>
      <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>{post.title}</h3>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{post.content}</p>
    </div>
  );
}
