import { useState } from 'react';
import { Star, CheckCircle, Plus, X, Briefcase, Users } from 'lucide-react';
import { useData } from '../contexts/DataContext';

export default function Equipe() {
  const { team, kanban, addTeamRating, addTeamMember, updateTeamMember, deleteTeamMember } = useData();
  const [selected, setSelected] = useState(team[0]);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [saved, setSaved] = useState(false);
  const [hoverStar, setHoverStar] = useState(0);
  
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const initialForm = { name: '', initials: '', role: 'USER', sector: 'Operacional', email: '' };
  const [formData, setFormData] = useState(initialForm);

  const handleSubmit = () => {
    if (rating === 0 || !feedback.trim()) return;
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
      // Automate initials computation
      const parts = formData.name.split(' ');
      const authInitials = parts.length > 1 ? parts[0][0] + parts[parts.length-1][0] : formData.name.substring(0, 2);
      addTeamMember({ ...formData, initials: authInitials.toUpperCase().substring(0, 2) });
      setIsAdding(false);
    }
  };

  const handleDeleteMember = () => {
    if (confirm(`Remover ${selected.name} do sistema? O acesso será revogado.`)) {
      deleteTeamMember(selected.id);
      setSelected(team[0] !== selected ? team[0] : team[1]);
    }
  };

  // Count tasks per person from kanban
  const getTaskCount = (initials: string) =>
    kanban.flatMap(c => c.tasks).filter(t => t.assignee === initials).length;

  const sectorColors: Record<string, string> = {
    Diretoria: 'var(--primary)', Design: 'var(--purple)', Dev: 'var(--success)', Comercial: 'var(--warning)'
  };

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Equipe & Usuários</h1>
          <p className="page-subtitle">Gerenciamento de colaboradores, permissões e acessos ao sistema</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span className="badge badge-primary" style={{ fontSize: 13, padding: '6px 14px', alignItems: 'center', display: 'flex' }}>
            <Users size={14} style={{ marginRight: 6 }} /> {team.length} usuários 
          </span>
          <button className="btn btn-primary" onClick={() => { setIsAdding(true); setIsEditing(false); setFormData(initialForm); }}>
            <Plus size={16} /> Novo Usuário
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: 24 }}>
        {/* Team List */}
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {team.map(member => {
              const tasksCount = getTaskCount(member.initials);
              const isSelected = selected.id === member.id;
              return (
                <div key={member.id} className="card" onClick={() => setSelected(member)} style={{
                  cursor: 'pointer', padding: '16px 18px',
                  borderLeft: isSelected ? `4px solid ${sectorColors[member.sector] || 'var(--primary)'}` : '4px solid transparent',
                  background: isSelected ? `${sectorColors[member.sector] || 'var(--primary)'}08` : undefined,
                  transition: 'var(--transition)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div className="avatar avatar-md" style={{ background: `hsl(${member.initials.charCodeAt(0) * 40}, 60%, 50%)` }}>
                      {member.initials}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, fontSize: 14 }}>{member.name}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{member.role}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                        <Star size={13} fill="var(--warning)" color="var(--warning)" />
                        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--warning)' }}>{member.performance}</span>
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{tasksCount} tarefas</p>
                    </div>
                  </div>

                  {/* Carga de trabalho bar */}
                  <div style={{ marginTop: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Carga de Trabalho</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: tasksCount > 6 ? 'var(--danger)' : tasksCount > 3 ? 'var(--warning)' : 'var(--success)' }}>
                        {tasksCount > 6 ? 'Alta' : tasksCount > 3 ? 'Média' : 'Normal'}
                      </span>
                    </div>
                    <div className="progress-track" style={{ height: 5 }}>
                      <div className="progress-fill" style={{
                        width: `${Math.min(tasksCount * 15, 100)}%`,
                        background: tasksCount > 6 ? 'var(--danger)' : tasksCount > 3 ? 'var(--warning)' : 'var(--success)'
                      }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                    <span className="badge badge-muted" style={{ fontSize: 10 }}>{member.sector}</span>
                    <span className="badge badge-muted" style={{ fontSize: 10 }}>{member.ratings.length} avaliações</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {isAdding || isEditing ? (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>{isEditing ? 'Editar Usuário' : 'Novo Usuário de Sistema'}</h2>
                <button className="btn-icon" onClick={() => { setIsAdding(false); setIsEditing(false); }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Nome Completo</label>
                  <input className="input" placeholder="Ex: João Silva" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>E-mail (Login)</label>
                  <input type="email" className="input" placeholder="joao@empresa.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Senha</label>
                  <input className="input" disabled value="Acesso inicial: magister123" style={{ opacity: 0.7 }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Nível de Permissão (Role)</label>
                  <select className="input" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                    <option value="admin">Gestor / Admin (Acesso Total)</option>
                    <option value="ceo">CEO (Dashboard Premium)</option>
                    <option value="comercial">Comercial (CRM/Pipeline)</option>
                    <option value="projeto">Projeto (Kanban/Conteúdo)</option>
                    <option value="financeiro">Financeiro</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Setor</label>
                  <input className="input" placeholder="Ex: Diretoria, Comercial, Dev..." value={formData.sector} onChange={e => setFormData({...formData, sector: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                {isEditing ? (
                  <button className="btn btn-outline" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={handleDeleteMember}>
                    Remover Acesso
                  </button>
                ) : <div />}
                <div style={{ display: 'flex', gap: 12 }}>
                  <button className="btn btn-ghost" onClick={() => { setIsAdding(false); setIsEditing(false); }}>Cancelar</button>
                  <button className="btn btn-primary" onClick={handleSaveMember} disabled={!formData.name || !formData.email}>
                    <CheckCircle size={16} /> {isEditing ? 'Atualizar Usuário' : 'Criar Colaborador'}
                  </button>
                </div>
              </div>
            </div>
          ) : selected ? (
            <>
              {/* Member Detail */}
              <div className="card">
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', marginBottom: 20 }}>
              <div className="avatar avatar-lg" style={{ background: `hsl(${selected.initials.charCodeAt(0) * 40}, 60%, 50%)` }}>
                {selected.initials}
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800 }}>{selected.name}</h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{selected.role}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{selected.email}</p>
                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  <span className="badge" style={{ background: `${sectorColors[selected.sector] || 'var(--primary)'}15`, color: sectorColors[selected.sector] || 'var(--primary)' }}>{selected.sector}</span>
                </div>
              </div>
              <div style={{ textAlign: 'center', padding: '14px 20px', background: 'var(--warning-glow)', borderRadius: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  <Star size={20} fill="var(--warning)" color="var(--warning)" />
                  <span style={{ fontSize: 28, fontWeight: 900, color: 'var(--warning)' }}>{selected.performance.toFixed(1)}</span>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Média Geral</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
               <button className="btn btn-outline btn-sm" onClick={() => { 
                 setFormData({ name: selected.name, initials: selected.initials, role: selected.role, sector: selected.sector, email: selected.email }); 
                 setIsEditing(true); 
               }}>
                 Editar Dados e Acessos
               </button>
            </div>

            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
              {[
                { label: 'Tarefas Abertas', value: getTaskCount(selected.initials), color: 'var(--primary)' },
                { label: 'Avaliações', value: selected.ratings.length, color: 'var(--warning)' },
                { label: 'Performance', value: `${selected.performance}/5`, color: 'var(--success)' },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--bg-subtle)', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
                  <p style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Recent Ratings */}
            {selected.ratings.length > 0 && (
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: 0.5, marginBottom: 10 }}>Últimas Avaliações</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selected.ratings.slice(0, 3).map((r, i) => (
                    <div key={i} style={{ padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: 8, borderLeft: '3px solid var(--warning)' }}>
                      <div style={{ display: 'flex', gap: 2, marginBottom: 4 }}>
                        {[1,2,3,4,5].map(s => <Star key={s} size={12} fill={r.stars >= s ? 'var(--warning)' : 'transparent'} color={r.stars >= s ? 'var(--warning)' : 'var(--text-muted)'} />)}
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>{r.date}</span>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-main)' }}>{r.feedback}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Avaliar */}
          <div className="card">
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Nova Avaliação de Desempenho</h3>

            {/* Stars */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
              {[1, 2, 3, 4, 5].map(star => (
                <Star key={star} size={30} onMouseEnter={() => setHoverStar(star)} onMouseLeave={() => setHoverStar(0)}
                  onClick={() => setRating(star)}
                  fill={(hoverStar || rating) >= star ? 'var(--warning)' : 'transparent'}
                  color={(hoverStar || rating) >= star ? 'var(--warning)' : 'var(--text-muted)'}
                  style={{ cursor: 'pointer', transition: '0.15s transform', transform: (hoverStar || rating) >= star ? 'scale(1.15)' : 'scale(1)' }} />
              ))}
              {rating > 0 && (
                <span style={{ marginLeft: 8, fontSize: 14, fontWeight: 700, color: 'var(--warning)', alignSelf: 'center' }}>
                  {['', 'Insuficiente', 'Regular', 'Bom', 'Ótimo', 'Excelente'][rating]}
                </span>
              )}
            </div>

            <textarea className="input" style={{ minHeight: 100, resize: 'none', marginBottom: 14 }}
              placeholder={`Feedback formal para ${selected.name.split(' ')[0]}...`}
              value={feedback} onChange={e => setFeedback(e.target.value)} />

            <button className="btn btn-primary" onClick={handleSubmit} disabled={rating === 0 || !feedback.trim() || saved} style={{ width: '100%' }}>
              {saved ? <><CheckCircle size={16} /> Avaliação Salva com Sucesso!</> : `Gravar Avaliação de ${selected.name.split(' ')[0]}`}
            </button>
          </div>
          </>
        ) : null}
        </div>
      </div>
    </div>
  );
}
