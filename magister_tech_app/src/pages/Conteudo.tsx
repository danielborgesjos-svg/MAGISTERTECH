import { useState } from 'react';
import { Plus, Target, ChevronLeft, ChevronRight, Settings, Send } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import type { ContentPost } from '../contexts/DataContext';

const STATUS_ORDER: ContentPost['status'][] = ['anotacao', 'planejamento', 'pendencias', 'ideia', 'producao', 'revisao', 'aprovado', 'publicado'];

const STATUS_CONFIG: Record<string, { label: string; color: string; badge: string }> = {
  anotacao: { label: '📝 Anotações', color: 'var(--text-muted)', badge: 'badge-muted' },
  planejamento: { label: '📂 Planejamento', color: 'var(--indigo)', badge: 'badge-primary' },
  pendencias: { label: '⚠️ Pendências', color: 'var(--warning)', badge: 'badge-warning' },
  ideia: { label: '💡 Ideia', color: 'var(--text-muted)', badge: 'badge-muted' },
  producao: { label: '⚙️ Produção', color: 'var(--warning)', badge: 'badge-warning' },
  revisao: { label: '👁️ Revisão', color: 'var(--primary)', badge: 'badge-primary' },
  aprovado: { label: '✅ Aprovado', color: 'var(--success)', badge: 'badge-success' },
  publicado: { label: '🚀 Publicado', color: 'var(--purple)', badge: 'badge-purple' },
};

const PLATFORM_ICON: Record<string, string> = {
  Instagram: '📸', LinkedIn: '💼', Facebook: '👥', YouTube: '▶️',
  TikTok: '🎵', 'Twitter/X': '🐦', 'Site/Blog': '📝'
};

const PLATFORMS = ['Instagram', 'LinkedIn', 'Facebook', 'YouTube', 'TikTok', 'Twitter/X', 'Site/Blog'];

export default function Conteudo() {
  const { 
    content, clients, goals, team,
    addContent, updateContent, updateContentStatus, updateGoal, 
    updateClientContentPlan, updateClientSchedule, updateContentComments 
  } = useData();
  
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [viewPost, setViewPost] = useState<ContentPost | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'board' | 'strategy'>('board');
  const [draggedPost, setDraggedPost] = useState<string | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState<{ days: string[], defaultAssigneeId: string }>({ days: [], defaultAssigneeId: '' });
  const [newComment, setNewComment] = useState('');
  
  const selectedClient = clients.find(c => c.id === selectedClientId);
  const [editingPlan, setEditingPlan] = useState('');
  
  const [form, setForm] = useState({
    clientId: '', platform: 'Instagram', date: new Date().toISOString().split('T')[0],
    caption: '', status: 'ideia' as ContentPost['status']
  });

  const handleAdd = () => {
    if (!form.caption && !form.clientId) return;
    addContent({ 
      clientId: form.clientId, 
      platform: form.platform, 
      date: form.date, 
      caption: form.caption, 
      status: form.status,
      assignedTo: clients.find(c => c.id === form.clientId)?.contentSchedule?.defaultAssigneeId
    });
    setForm({ clientId: '', platform: 'Instagram', date: new Date().toISOString().split('T')[0], caption: '', status: 'ideia' });
    setShowForm(false);
  };

  const handleDragStart = (id: string) => setDraggedPost(id);
  const handleDrop = (status: ContentPost['status']) => {
    if (draggedPost) {
      updateContentStatus(draggedPost, status);
      setDraggedPost(null);
    }
  };

  const handleSavePlan = () => {
    if (selectedClientId && editingPlan) {
      updateClientContentPlan(selectedClientId, editingPlan);
      alert('Cronograma Salvo!');
    }
  };

  const _handleApprove = (post: ContentPost) => {
    updateContentStatus(post.id, 'aprovado');
    const contentGoal = goals.find(g => g.category === 'conteudo');
    if (contentGoal) {
      updateGoal(contentGoal.id, contentGoal.current + 1);
    }
  }; void _handleApprove;

  const filteredContent = selectedClientId 
    ? content.filter(c => c.clientId === selectedClientId)
    : content;

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  return (
    <div className="animate-in">
      <div className="page-header" style={{ marginBottom: 32 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 100, fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Target size={12} color="var(--primary)" /> Editorial & Estratégia
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-main)', margin: 0, lineHeight: 1.1 }}>
            Gestão de Conteúdo {selectedClient ? `· ${selectedClient.company}` : ''}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <select className="input" style={{ width: 'auto', minWidth: 200 }} value={selectedClientId} onChange={e => {
            const id = e.target.value;
            setSelectedClientId(id);
            const client = clients.find(c => c.id === id);
            if (client) setEditingPlan(client.contentPlan || '');
          }}>
            <option value="">🎯 Selecione o Cliente</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.company}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Novo Post</button>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 32, borderBottom: '1px solid var(--border)' }}>
        <button 
          onClick={() => setActiveTab('board')}
          style={{ padding: '12px 4px', fontSize: 14, fontWeight: 800, color: activeTab === 'board' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: `2px solid ${activeTab === 'board' ? 'var(--primary)' : 'transparent'}`, background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer' }}
        >
          🗂️ Board Editorial
        </button>
        <button 
          onClick={() => setActiveTab('strategy')}
          disabled={!selectedClientId}
          style={{ padding: '12px 4px', fontSize: 14, fontWeight: 800, color: activeTab === 'strategy' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: `2px solid ${activeTab === 'strategy' ? 'var(--primary)' : 'transparent'}`, background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer', opacity: selectedClientId ? 1 : 0.5 }}
        >
          📝 Estratégia & Cronograma
        </button>
      </div>

      {activeTab === 'board' ? (
        <>
          {/* BOARD */}
          <div className="kanban-wrapper" style={{ marginBottom: 48 }}>
            <div className="kanban-container" style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16 }}>
              {STATUS_ORDER.map(status => {
                const cfg = STATUS_CONFIG[status];
                const columnPosts = filteredContent.filter(c => c.status === status);
                return (
                  <div 
                    key={status} 
                    className="kanban-column" 
                    style={{ minWidth: 280, flex: 1 }}
                    onDragOver={e => e.preventDefault()}
                    onDrop={() => handleDrop(status)}
                  >
                    <div className="kanban-col-header" style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, marginBottom:16, borderBottom: `3px solid ${cfg.color}` }}>
                      <span style={{ fontWeight: 800, fontSize: 13, color: 'var(--text-main)' }}>{cfg.label}</span>
                      <span className="badge badge-muted" style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11 }}>{columnPosts.length}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 200 }}>
                      {columnPosts.map(post => (
                        <div 
                          key={post.id} 
                          className="card" 
                          draggable
                          onDragStart={() => handleDragStart(post.id)}
                          style={{ padding: 16, borderLeft: `4px solid ${cfg.color}`, cursor: 'grab', opacity: draggedPost === post.id ? 0.4 : 1 }} 
                          onClick={() => setViewPost(post)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                             <span style={{ fontSize: 18 }}>{PLATFORM_ICON[post.platform]}</span>
                             <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>{post.platform}</span>
                          </div>
                          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)', marginBottom: 12 }}>{post.caption.substring(0, 50)}...</p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>📅 {new Date(post.date).toLocaleDateString()}</div>
                            {post.assignedTo && (
                              <div 
                                title={`Responsável: ${team.find(t => t.id === post.assignedTo)?.name}`}
                                style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, border: '2px solid var(--card-bg)' }}
                              >
                                {team.find(t => t.id === post.assignedTo)?.initials}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-main)' }}>📅 Calendário de Entregas</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <button className="btn-icon" title="Configurar Cronograma Fixo" onClick={() => {
                    if (selectedClient) {
                      setScheduleForm({
                        days: selectedClient.contentSchedule?.days || [],
                        defaultAssigneeId: selectedClient.contentSchedule?.defaultAssigneeId || ''
                      });
                      setShowScheduleModal(true);
                    }
                  }} disabled={!selectedClientId}><Settings size={18} /></button>
                  <button className="btn-icon" onClick={() => setCurrentMonth(new Date(year, month - 1))}><ChevronLeft size={18} /></button>
                  <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-main)', minWidth: 120, textAlign: 'center' }}>{monthNames[month]} {year}</span>
                  <button className="btn-icon" onClick={() => setCurrentMonth(new Date(year, month + 1))}><ChevronRight size={18} /></button>
                </div>
              </div>
              <div className="card" style={{ padding: 24 }}>
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
                    {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 8 }}>{d}</div>)}
                    {Array.from({ length: totalDays }).map((_, i) => {
                      const dayPosts = filteredContent.filter(p => new Date(p.date + 'T00:00:00').getDate() === i + 1);
                      const dayOfWeek = new Date(year, month, i + 1).toLocaleDateString('pt-BR', { weekday: 'long' }).toLowerCase();
                      const isScheduledDay = selectedClient?.contentSchedule?.days.some(d => dayOfWeek.includes(d.toLowerCase()));
                      
                      return (
                        <div key={i} style={{ 
                          minHeight: 80, 
                          border: isScheduledDay ? '2px solid var(--primary)' : '1px solid var(--border)', 
                          borderRadius: 12, 
                          padding: 8, 
                          background: dayPosts.length > 0 ? 'var(--primary-glow)' : 'var(--bg-subtle)', 
                          position: 'relative' 
                        }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: isScheduledDay ? 'var(--primary)' : 'var(--text-muted)' }}>{i+1}</span>
                          {isScheduledDay && dayPosts.length === 0 && (
                            <div style={{ position: 'absolute', top: 8, right: 8, fontSize: 10, color: 'var(--primary)', fontWeight: 800 }}>⚡ FIXO</div>
                          )}
                          <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', marginTop: 4 }}>
                            {dayPosts.map(p => <div key={p.id} title={p.caption} style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_CONFIG[p.status].color }} />)}
                          </div>
                        </div>
                      );
                    })}
                 </div>
              </div>
            </div>
            <div>
               <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 20, color: 'var(--text-main)' }}>🚀 Histórico & Performance</h3>
               <div className="card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {filteredContent.filter(p => p.status === 'publicado').slice(0, 10).map(p => (
                      <div key={p.id} className="list-item" style={{ padding: 12, background: 'var(--bg-subtle)', borderRadius: 12, cursor: 'pointer' }} onClick={() => setViewPost(p)}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <span style={{ fontSize: 20 }}>{PLATFORM_ICON[p.platform]}</span>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>{p.caption.substring(0, 40)}...</p>
                            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Publicado em {new Date(p.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          </div>
        </>
      ) : (
        <div className="card animate-scale-in" style={{ padding: 40 }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 900 }}>Estratégia & Cronograma Base</h2>
                <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Defina como será a frequência e os pilares de conteúdo para {selectedClient?.company}.</p>
              </div>
              <button className="btn btn-primary" onClick={handleSavePlan}>Salvar Alterações</button>
           </div>
           <textarea 
            className="input"
            value={editingPlan}
            onChange={e => setEditingPlan(e.target.value)}
            style={{ width: '100%', minHeight: 400, padding: 24, fontSize: 15, lineHeight: 1.6, borderRadius: 16, background: 'var(--bg-subtle)' }}
           />
        </div>
      )}

      {/* MODALS */}
      {viewPost && (
        <div className="modal-overlay" onMouseDown={() => setViewPost(null)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
           <div className="card" style={{ width: '100%', maxWidth: 800, padding: 32 }} onMouseDown={e => e.stopPropagation()}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 32 }}>
                <div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                      <span style={{ fontSize: 32 }}>{PLATFORM_ICON[viewPost.platform]}</span>
                      <div>
                         <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>Editar Publicação</h2>
                         <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{viewPost.platform} · {new Date(viewPost.date).toLocaleDateString()}</span>
                      </div>
                   </div>
                   
                   <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                           <label className="form-label">Status</label>
                           <select className="input" style={{ width: '100%' }} value={viewPost.status} onChange={e => setViewPost({ ...viewPost, status: e.target.value as any })}>
                              {STATUS_ORDER.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                           </select>
                        </div>
                        <div>
                           <label className="form-label">Responsável</label>
                           <select className="input" style={{ width: '100%' }} value={viewPost.assignedTo || ''} onChange={e => setViewPost({ ...viewPost, assignedTo: e.target.value })}>
                              <option value="">Sem responsável</option>
                              {team.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                           </select>
                        </div>
                      </div>
                      
                      <div>
                         <label className="form-label">Texto / Legenda</label>
                         <textarea className="input" style={{ width: '100%', minHeight: 200 }} value={viewPost.caption} onChange={e => setViewPost({ ...viewPost, caption: e.target.value })} />
                      </div>

                      <div style={{ display: 'flex', gap: 10 }}>
                        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setViewPost(null)}>Cancelar</button>
                        <button className="btn btn-primary" style={{ flex: 2 }} onClick={() => { 
                          updateContent(viewPost.id, { caption: viewPost.caption, status: viewPost.status, assignedTo: viewPost.assignedTo }); 
                          setViewPost(null); 
                        }}>Salvar Alterações</button>
                      </div>
                   </div>
                </div>

                <div style={{ background: 'var(--bg-subtle)', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column' }}>
                   <h4 style={{ fontSize: 13, fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                     <Send size={14} /> Mensagens Internas
                   </h4>
                   <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16, maxHeight: 350 }}>
                      {viewPost.comments?.map(c => (
                        <div key={c.id} style={{ background: 'var(--card-bg)', padding: 10, borderRadius: 10, border: '1px solid var(--border)' }}>
                           <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ fontSize: 11, fontWeight: 800 }}>{c.author}</span>
                              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{new Date(c.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                           </div>
                           <p style={{ fontSize: 12, margin: 0, color: 'var(--text-sec)' }}>{c.text}</p>
                        </div>
                      ))}
                   </div>
                   <div style={{ display: 'flex', gap: 8 }}>
                      <input className="input" placeholder="Escrever..." value={newComment} onChange={e => setNewComment(e.target.value)} onKeyPress={e => e.key === 'Enter' && newComment && (updateContentComments(viewPost.id, { author: 'Admin', text: newComment }), setNewComment(''))} />
                      <button className="btn btn-primary" style={{ width: 40, padding: 0 }} onClick={() => newComment && (updateContentComments(viewPost.id, { author: 'Admin', text: newComment }), setNewComment(''))}><Plus size={16} /></button>
                   </div>
                </div>
              </div>
           </div>
        </div>
      )}

      {showScheduleModal && selectedClient && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: '100%', maxWidth: 450, padding: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 8 }}>Cronograma Fixo</h2>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>Defina os dias de publicação de {selectedClient.company}.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label className="form-label">Dias da Semana</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 8 }}>
                  {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map(day => (
                    <button 
                      key={day}
                      onClick={() => setScheduleForm(prev => ({
                        ...prev,
                        days: prev.days.includes(day) ? prev.days.filter(d => d !== day) : [...prev.days, day]
                      }))}
                      style={{ 
                        padding: '8px 4px', fontSize: 10, fontWeight: 800, borderRadius: 8, border: '1px solid var(--border)',
                        background: scheduleForm.days.includes(day) ? 'var(--primary)' : 'var(--bg-subtle)',
                        color: scheduleForm.days.includes(day) ? 'white' : 'var(--text-muted)', cursor: 'pointer'
                      }}
                    >
                      {day.substring(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="form-label">Responsável Padrão</label>
                <select className="input" style={{ width: '100%' }} value={scheduleForm.defaultAssigneeId} onChange={e => setScheduleForm(prev => ({ ...prev, defaultAssigneeId: e.target.value }))}>
                  <option value="">Selecione um responsável</option>
                  {team.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowScheduleModal(false)}>Cancelar</button>
                <button className="btn btn-primary" style={{ flex: 2 }} onClick={() => { updateClientSchedule(selectedClientId, scheduleForm); setShowScheduleModal(false); }}>Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onMouseDown={() => setShowForm(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
           <div className="card" style={{ width: '100%', maxWidth: 500, padding: 32 }} onMouseDown={e => e.stopPropagation()}>
              <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 24 }}>Novo Post Editorial</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                   <label className="form-label">Empresa / Cliente</label>
                   <select className="input" style={{ width: '100%' }} value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value })}>
                      <option value="">Selecione um cliente</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.company}</option>)}
                   </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap:12 }}>
                   <div>
                      <label className="form-label">Plataforma</label>
                      <select className="input" style={{ width: '100%' }} value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })}>
                         {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                   </div>
                   <div>
                      <label className="form-label">Data</label>
                      <input type="date" className="input" style={{ width: '100%' }} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                   </div>
                   <div>
                      <label className="form-label">Status</label>
                      <select className="input" style={{ width: '100%' }} value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })}>
                        {STATUS_ORDER.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                      </select>
                   </div>
                </div>
                <div>
                   <label className="form-label">Texto / Legenda</label>
                   <textarea className="input" style={{ width: '100%', minHeight: 100 }} placeholder="Digite aqui o conteúdo do post..." value={form.caption} onChange={e => setForm({ ...form, caption: e.target.value })} />
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                   <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowForm(false)}>Cancelar</button>
                   <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleAdd} disabled={!form.caption || !form.clientId}>Criar Rascunho</button>
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
