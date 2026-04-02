import { useState } from 'react';
import { Plus, X, Briefcase, Users, Calendar, Zap, ChevronRight } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import type { Project } from '../contexts/DataContext';

const fmt = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

const STATUS_COLORS: Record<string, string> = {
  ativo: 'var(--primary)', atrasado: 'var(--danger)', pausado: 'var(--warning)', concluido: 'var(--success)'
};

const TEAM_OPTIONS = ['DB', 'AD', 'JB', 'CR'];

export default function Projetos() {
  const { projects, clients, team, addProject, updateProject, getClientById } = useData();
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Project | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [form, setForm] = useState({
    name: '', clientId: '', type: 'Web', status: 'ativo' as Project['status'],
    startDate: new Date().toISOString().split('T')[0], endDate: '',
    team: ['DB'] as string[], budget: '',
  });
  const [isEditingForm, setIsEditingForm] = useState(false);

  const filtered = projects.filter(p => filterStatus === 'all' || p.status === filterStatus);

  const toggleTeamMember = (initials: string) => {
    setForm(prev => ({
      ...prev,
      team: prev.team.includes(initials) ? prev.team.filter(t => t !== initials) : [...prev.team, initials]
    }));
  };

  const handleAdd = () => {
    if (!form.name || !form.clientId || !form.endDate) return;
    
    if (isEditingForm && selected) {
      updateProject(selected.id, {
        name: form.name, clientId: form.clientId, type: form.type,
        status: form.status, startDate: form.startDate, endDate: form.endDate,
        team: form.team, budget: parseFloat(form.budget) || 0,
      });
      setSelected({ ...selected, ...form, budget: parseFloat(form.budget) || 0, color: selected.color, progress: selected.progress });
    } else {
      addProject({
        name: form.name, clientId: form.clientId, type: form.type,
        status: form.status, startDate: form.startDate, endDate: form.endDate,
        team: form.team, budget: parseFloat(form.budget) || 0,
      });
    }
    
    setShowForm(false);
    setIsEditingForm(false);
    setForm({ name: '', clientId: '', type: 'Web', status: 'ativo', startDate: new Date().toISOString().split('T')[0], endDate: '', team: ['DB'], budget: '' });
  };

  const handleProgressChange = (id: string, val: number) => {
    const status = val >= 100 ? 'concluido' : projects.find(p => p.id === id)?.status || 'ativo';
    updateProject(id, { progress: val, status });
  };

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestão de Projetos</h1>
          <p className="page-subtitle">Acompanhe execução, progresso e equipe de todos os projetos</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm({ name: '', clientId: '', type: 'Web', status: 'ativo', startDate: new Date().toISOString().split('T')[0], endDate: '', team: ['DB'], budget: '' }); setIsEditingForm(false); setShowForm(true); }}><Plus size={16} /> Novo Projeto</button>
      </div>

      {/* KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Ativos', count: projects.filter(p => p.status === 'ativo').length, color: 'var(--primary)' },
          { label: 'Atrasados', count: projects.filter(p => p.status === 'atrasado').length, color: 'var(--danger)' },
          { label: 'Pausados', count: projects.filter(p => p.status === 'pausado').length, color: 'var(--warning)' },
          { label: 'Concluídos', count: projects.filter(p => p.status === 'concluido').length, color: 'var(--success)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '16px 20px', borderLeft: `4px solid ${s.color}`, cursor: 'pointer' }}
            onClick={() => setFilterStatus(s.label.toLowerCase().replace('í', 'i').replace('é', 'e') === 'ativos' ? 'ativo' : s.label.toLowerCase().replace(/í/g, 'i').replace(/é/g, 'e').replace(/ados$/, 'ado'))}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>{s.label}</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.count}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div style={{ marginBottom: 20 }}>
        <div className="tab-list" style={{ width: 'auto', display: 'inline-flex' }}>
          {[['all', 'Todos'], ['ativo', 'Ativos'], ['atrasado', 'Atrasados'], ['pausado', 'Pausados'], ['concluido', 'Concluídos']].map(([val, label]) => (
            <button key={val} className={`tab-btn ${filterStatus === val ? 'active' : ''}`} onClick={() => setFilterStatus(val)} style={{ flex: 'unset', padding: '7px 16px' }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
        {filtered.length === 0 && (
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="empty-state"><Briefcase size={40} /><h3>Nenhum projeto encontrado</h3><button className="btn btn-primary btn-sm" onClick={() => { setIsEditingForm(false); setShowForm(true); }}><Plus size={14} /> Novo Projeto</button></div>
          </div>
        )}
        {filtered.map(project => {
          const client = getClientById(project.clientId);
          const daysLeft = Math.ceil((new Date(project.endDate).getTime() - Date.now()) / 86400000);
          const statusColor = STATUS_COLORS[project.status] || 'var(--primary)';
          return (
            <div key={project.id} className="card" style={{ borderTop: `3px solid ${project.color}`, cursor: 'pointer', transition: 'var(--transition)' }}
              onClick={() => setSelected(project)}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-hover)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ background: `${project.color}15`, borderRadius: 10, padding: '8px', display: 'flex' }}>
                  <Briefcase size={20} style={{ color: project.color }} />
                </div>
                <span className="badge" style={{ background: `${statusColor}15`, color: statusColor }}>{project.status}</span>
              </div>

              <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 4, letterSpacing: -0.3 }}>{project.name}</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
                {client?.company || 'Cliente'} · {project.type}
              </p>

              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Progresso</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: project.color }}>{project.progress}%</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${project.progress}%`, background: project.color }} />
                </div>
                <input type="range" min="0" max="100" value={project.progress}
                  onClick={e => e.stopPropagation()}
                  onChange={e => handleProgressChange(project.id, parseInt(e.target.value))}
                  style={{ width: '100%', marginTop: 8, cursor: 'pointer', accentColor: project.color }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {project.team.map((m, i) => (
                    <div key={i} className="avatar" style={{
                      width: 26, height: 26, fontSize: 9, fontWeight: 700,
                      background: `hsl(${m.charCodeAt(0) * 30}, 60%, 50%)`,
                      marginLeft: i > 0 ? -6 : 0, border: '2px solid var(--bg-card)', zIndex: project.team.length - i,
                      position: 'relative'
                    }}>{m}</div>
                  ))}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 11, color: daysLeft < 0 ? 'var(--danger)' : daysLeft < 7 ? 'var(--warning)' : 'var(--text-muted)', fontWeight: 600 }}>
                    {daysLeft < 0 ? `${Math.abs(daysLeft)}d atrasado` : `${daysLeft}d restante${daysLeft !== 1 ? 's' : ''}`}
                  </p>
                  {project.budget > 0 && <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmt(project.budget)}</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Automação info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 20, padding: '12px 16px', background: 'var(--purple-glow)', borderRadius: 8, border: '1px solid rgba(124,58,237,0.2)' }}>
        <Zap size={15} style={{ color: 'var(--purple)' }} />
        <p style={{ fontSize: 12, color: 'var(--purple)', fontWeight: 500 }}>
          <strong>Automação ativa:</strong> Criar um projeto gera automaticamente tarefas no Kanban e um evento de kickoff na Agenda.
        </p>
      </div>

      {/* ─── PROJECT DETAIL MODAL ─────────────────────────────── */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" style={{ maxWidth: 680 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ background: `${selected.color}15`, borderRadius: 10, padding: 10 }}>
                  <Briefcase size={22} style={{ color: selected.color }} />
                </div>
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 800 }}>{selected.name}</h2>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{getClientById(selected.clientId)?.company} · {selected.type}</p>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setSelected(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Cronograma</p>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Calendar size={14} style={{ color: 'var(--primary)' }} />
                    <span style={{ fontSize: 13 }}>{new Date(selected.startDate).toLocaleDateString('pt-BR')} → {new Date(selected.endDate).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Orçamento</p>
                  <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--success)' }}>{fmt(selected.budget)}</p>
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Progresso</p>
                  <div className="progress-track" style={{ height: 10, marginBottom: 6 }}>
                    <div className="progress-fill" style={{ width: `${selected.progress}%`, background: selected.color }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Execução atual</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: selected.color }}>{selected.progress}%</span>
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Status</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {(['ativo', 'atrasado', 'pausado', 'concluido'] as const).map(s => (
                      <button key={s} className={`badge ${selected.status === s ? 'badge-primary' : 'badge-muted'}`}
                        style={{ cursor: 'pointer', border: 'none' }}
                        onClick={() => { updateProject(selected.id, { status: s }); setSelected(p => p ? { ...p, status: s } : p); }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Equipe</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {selected.team.map(m => {
                      const member = team.find(tm => tm.initials === m);
                      return (
                        <div key={m} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--bg-subtle)', borderRadius: 20 }}>
                          <div className="avatar" style={{ width: 22, height: 22, fontSize: 9, background: `hsl(${m.charCodeAt(0) * 30}, 60%, 50%)` }}>{m}</div>
                          <span style={{ fontSize: 12, fontWeight: 600 }}>{member?.name.split(' ')[0] || m}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
              <button className="btn btn-outline btn-sm" onClick={() => {
                setForm({ name: selected.name, clientId: selected.clientId, type: selected.type, status: selected.status, startDate: selected.startDate, endDate: selected.endDate, team: selected.team, budget: selected.budget.toString() });
                setIsEditingForm(true);
                setShowForm(true);
              }}>Editar Projeto</button>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-ghost" onClick={() => setSelected(null)}>Fechar</button>
                <button className="btn btn-primary" onClick={() => { updateProject(selected.id, { progress: Math.min(selected.progress + 10, 100) }); setSelected(p => p ? { ...p, progress: Math.min(p.progress + 10, 100) } : p); }}>
                  <ChevronRight size={14} /> Avançar +10%
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── ADD PROJECT MODAL ────────────────────────────────── */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>{isEditingForm ? 'Editar Projeto' : 'Novo Projeto'}</h2>
              <button className="btn-icon" onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Nome do Projeto *</label>
                  <input className="input" placeholder="Ex: ERP Cloud CINEPASSE" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Cliente *</label>
                  <select className="input" value={form.clientId} onChange={e => setForm(p => ({ ...p, clientId: e.target.value }))}>
                    <option value="">Selecione...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.company}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Tipo</label>
                  <select className="input" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                    {['Web', 'Mobile', 'Software', 'Design', 'Marketing', 'Consultoria'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Data Início</label>
                  <input className="input" type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Data Fim *</label>
                  <input className="input" type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Orçamento (R$)</label>
                  <input className="input" type="number" placeholder="0.00" value={form.budget} onChange={e => setForm(p => ({ ...p, budget: e.target.value }))} />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, display: 'block' }}><Users size={13} style={{ display: 'inline', marginRight: 4 }} />Equipe</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {TEAM_OPTIONS.map(m => {
                      const member = team.find(tm => tm.initials === m);
                      return (
                        <button key={m} onClick={() => toggleTeamMember(m)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                            borderRadius: 20, border: `2px solid ${form.team.includes(m) ? 'var(--primary)' : 'var(--border)'}`,
                            background: form.team.includes(m) ? 'var(--primary-glow)' : 'var(--bg-subtle)',
                            cursor: 'pointer', transition: 'var(--transition)', fontWeight: 600, fontSize: 12,
                            color: form.team.includes(m) ? 'var(--primary)' : 'var(--text-muted)'
                          }}>
                          <div className="avatar" style={{ width: 20, height: 20, fontSize: 8, background: `hsl(${m.charCodeAt(0) * 30}, 60%, 50%)` }}>{m}</div>
                          {member?.name.split(' ')[0] || m}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleAdd} disabled={!form.name || !form.clientId || !form.endDate}>
                <Plus size={14} /> Criar Projeto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
