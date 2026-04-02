import { useState } from 'react';
import {
  Plus, X, Briefcase, Users, Calendar, ChevronRight, Zap, Building2,
  Mail, Phone, Target, FileText, Edit, Trash2, Activity, TrendingUp, StopCircle,
  CheckCircle, PauseCircle
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import type { Project, Meeting } from '../contexts/DataContext';

const fmt = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

const STATUS_COLORS: Record<string, string> = {
  ativo: 'var(--primary)', atrasado: 'var(--danger)', pausado: 'var(--warning)', concluido: 'var(--success)'
};
const STATUS_LABELS: Record<string, string> = {
  ativo: 'Em Andamento', atrasado: 'Atrasado', pausado: 'Pausado', concluido: 'Concluído'
};

const PROJECT_TYPES = ['Web', 'Mobile', 'Software', 'Design', 'Marketing Digital', 'Tráfego Pago', 'E-commerce', 'Consultoria', 'MVP', 'Sistema ERP'];

const EMPTY_FORM = {
  name: '', clientId: '', type: 'Web', status: 'ativo' as Project['status'],
  startDate: new Date().toISOString().split('T')[0], endDate: '',
  team: [] as string[], budget: '',
  responsavelInterno: '', responsavelCliente: '', emailCliente: '',
  whatsappCliente: '', plano: '', objetivos: '', metas: '', resumo: '', postagens: '', atribuicoes: '',
};

const EMPTY_MEETING: Omit<Meeting, 'id'> = {
  date: new Date().toISOString().split('T')[0], time: '09:00', title: '', participants: [], notes: '', status: 'agendada'
};

type ActiveView = 'overview' | 'details' | 'meetings';

export default function Projetos() {
  const { projects, clients, team, addProject, updateProject, deleteProject, addProjectMeeting, getClientById } = useData();
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Project | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>('overview');
  const [filterStatus, setFilterStatus] = useState('all');
  const [form, setForm] = useState(EMPTY_FORM);
  const [isEditingForm, setIsEditingForm] = useState(false);
  const [meetingForm, setMeetingForm] = useState<Omit<Meeting, 'id'>>(EMPTY_MEETING);
  const [showMeetingForm, setShowMeetingForm] = useState(false);

  const filtered = projects.filter(p => filterStatus === 'all' || p.status === filterStatus);

  const toggleTeamMember = (initials: string) => {
    setForm(prev => ({
      ...prev,
      team: prev.team.includes(initials) ? prev.team.filter(t => t !== initials) : [...prev.team, initials]
    }));
  };

  const handleAdd = () => {
    if (!form.name || !form.clientId || !form.endDate) return;
    const payload = {
      name: form.name, clientId: form.clientId, type: form.type,
      status: form.status, startDate: form.startDate, endDate: form.endDate,
      team: form.team, budget: parseFloat(form.budget) || 0,
      responsavelInterno: form.responsavelInterno, responsavelCliente: form.responsavelCliente,
      emailCliente: form.emailCliente, whatsappCliente: form.whatsappCliente,
      plano: form.plano, objetivos: form.objetivos, metas: form.metas,
      resumo: form.resumo, postagens: form.postagens, atribuicoes: form.atribuicoes,
    };
    if (isEditingForm && selected) {
      updateProject(selected.id, payload);
      setSelected(prev => prev ? { ...prev, ...payload } : prev);
    } else {
      addProject(payload);
    }
    setShowForm(false);
    setIsEditingForm(false);
    setForm(EMPTY_FORM);
  };

  const handleProgressChange = (id: string, val: number) => {
    const status = val >= 100 ? 'concluido' : projects.find(p => p.id === id)?.status || 'ativo';
    updateProject(id, { progress: val, status });
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, progress: val, status } : prev);
  };

  const handleAddMeeting = () => {
    if (!meetingForm.title || !selected) return;
    addProjectMeeting(selected.id, meetingForm);
    const updatedProject = projects.find(p => p.id === selected.id);
    if (updatedProject) setSelected(updatedProject);
    setMeetingForm(EMPTY_MEETING);
    setShowMeetingForm(false);
  };

  const openProject = (project: Project) => {
    setSelected(project);
    setActiveView('overview');
  };

  return (
    <div className="animate-in" style={{ paddingBottom: 40 }}>
      {/* ─── HEADER COCKPIT ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 100, fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Activity size={12} color="var(--primary)" /> VISÃO GENERALIZADA DA PRODUÇÃO
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-main)', margin: 0, lineHeight: 1.1 }}>
            Gestão de Projetos
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8 }}>
            Acompanhe a execução, metas, cronograma e reuniões de todas as entregas.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(EMPTY_FORM); setIsEditingForm(false); setShowForm(true); }}>
          <Plus size={16} /> Nova Produção
        </button>
      </div>

      {/* ─── KPI STRIP ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Em Andamento', count: projects.filter(p => p.status === 'ativo').length, color: 'var(--primary)', bg: 'var(--primary-glow)', status: 'ativo' },
          { label: 'Atrasados / Critico', count: projects.filter(p => p.status === 'atrasado').length, color: 'var(--danger)', bg: 'var(--danger-glow)', status: 'atrasado' },
          { label: 'Standby / Pausados', count: projects.filter(p => p.status === 'pausado').length, color: 'var(--warning)', bg: 'var(--warning-glow)', status: 'pausado' },
          { label: 'Concluídos', count: projects.filter(p => p.status === 'concluido').length, color: 'var(--success)', bg: 'var(--success-glow)', status: 'concluido' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '24px', cursor: 'pointer', borderTop: `3px solid ${s.color}`, position: 'relative', overflow: 'hidden', background: filterStatus === s.status ? s.bg : undefined }}
            onClick={() => setFilterStatus(filterStatus === s.status ? 'all' : s.status)}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, background: s.bg, filter: 'blur(30px)', borderRadius: '50%', pointerEvents: 'none', transition: 'all 0.3s', opacity: filterStatus === s.status ? 1 : 0.5 }} />
            <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-sec)', marginBottom: 10, letterSpacing: '0.05em', position: 'relative', zIndex: 1 }}>{s.label}</p>
            <p style={{ fontSize: 32, fontWeight: 900, color: s.color, letterSpacing: '-0.02em', position: 'relative', zIndex: 1 }}>{s.count}</p>
          </div>
        ))}
      </div>

      {/* ─── FILTROS ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
         <div className="tab-list">
            {[['all', 'Tudo'], ['ativo', 'Ativos'], ['atrasado', 'Atrasados'], ['pausado', 'Pausados'], ['concluido', 'Finalizados']].map(([val, label]) => (
              <button key={val} className={`tab-btn ${filterStatus === val ? 'active' : ''}`} onClick={() => setFilterStatus(val)}>{label}</button>
            ))}
         </div>
         <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{filtered.length} produção(ões) encontrada(s)</span>
      </div>

      {/* ─── CARDS DE PROJETOS ────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
        {filtered.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: '60px 0', textAlign: 'center' }}>
             <div style={{ width: 64, height: 64, margin: '0 auto 16px', background: 'var(--bg-subtle)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
                <Briefcase size={28} color="var(--text-muted)"/>
             </div>
             <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-main)', marginBottom: 8 }}>Nenhum projeto registrado</p>
             <button className="btn btn-primary" onClick={() => { setIsEditingForm(false); setShowForm(true); }}><Plus size={14} /> Iniciar primeiro projeto</button>
          </div>
        )}
        {filtered.map(project => {
          const client = getClientById(project.clientId);
          const daysLeft = Math.ceil((new Date(project.endDate).getTime() - Date.now()) / 86400000);
          const statusColor = STATUS_COLORS[project.status] || 'var(--primary)';
          return (
            <div key={project.id} className="card" style={{ borderTop: `3px solid ${project.color}`, cursor: 'pointer', padding: 24 }}
              onClick={() => openProject(project)}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = 'var(--shadow-lg)'; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = ''; el.style.boxShadow = 'var(--shadow)'; }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, background: `${project.color}15`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Briefcase size={20} style={{ color: project.color }} />
                </div>
                <span className="badge" style={{ background: `${statusColor}15`, color: statusColor, border: `1px solid ${statusColor}30`, fontWeight: 800 }}>{STATUS_LABELS[project.status].toUpperCase()}</span>
              </div>

              <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 6, letterSpacing: -0.02, color: 'var(--text-main)' }}>{project.name}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-sec)', marginBottom: 20, fontWeight: 600 }}>
                {client?.company || 'Cliente'} · <span style={{ color: 'var(--text-main)' }}>{project.type}</span>
              </p>

              <div style={{ marginBottom: 20, background: 'var(--bg-subtle)', padding: 12, borderRadius: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Progresso</span>
                  <span style={{ fontSize: 14, fontWeight: 900, color: project.color }}>{project.progress}%</span>
                </div>
                <div className="progress-track" style={{ height: 8 }}>
                  <div className="progress-fill" style={{ width: `${project.progress}%`, background: project.color }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                <div style={{ display: 'flex' }}>
                  {project.team.slice(0, 4).map((m, i) => (
                    <div key={i} className="avatar" title={m} style={{
                      width: 28, height: 28, fontSize: 10, fontWeight: 800,
                      background: `hsl(${m.charCodeAt(0) * 30}, 60%, 50%)`,
                      marginLeft: i > 0 ? -8 : 0, border: '2px solid var(--bg-card)', zIndex: 4 - i,
                      position: 'relative'
                    }}>{m}</div>
                  ))}
                  {project.team.length === 0 && <div className="avatar" style={{width:28, height: 28, background:'var(--bg-subtle)', color: 'var(--text-muted)'}}>?</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 12, color: daysLeft < 0 ? 'var(--danger)' : daysLeft < 7 ? 'var(--warning)' : 'var(--text-main)', fontWeight: 800 }}>
                    {daysLeft < 0 ? `${Math.abs(daysLeft)}d atrasado` : `${daysLeft}d restantes`}
                  </p>
                  {project.budget > 0 && <p style={{ fontSize: 12, color: 'var(--success)', fontWeight: 800, marginTop: 4 }}>{fmt(project.budget)}</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 24, padding: '16px 20px', background: 'linear-gradient(135deg, var(--primary-glow), var(--purple-glow))', borderRadius: 'var(--radius)', border: '1px solid rgba(124,58,237,0.15)' }}>
        <Zap size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
        <p style={{ fontSize: 13, color: 'var(--text-main)', fontWeight: 600 }}>
          <strong style={{ color: 'var(--primary)' }}>Hub de Automação:</strong> Ao criar esse projeto, os tickets são enviados automaticamente para a área de Kanban com prazo inicial calculado.
        </p>
      </div>

      {/* ─── PROJECT DETAIL MODAL ─────────────────────────────── */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal modal-xl" style={{ padding: 0, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ background: 'var(--bg-subtle)', padding: '32px 32px 0 32px', borderBottom: '1px solid var(--border)' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                     <div style={{ width: 72, height: 72, borderRadius: 20, background: `${selected.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Briefcase size={32} style={{ color: selected.color }} />
                     </div>
                     <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                           <h2 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>{selected.name}</h2>
                           <span className="badge" style={{ background: `${STATUS_COLORS[selected.status]}15`, color: STATUS_COLORS[selected.status], border: `1px solid ${STATUS_COLORS[selected.status]}30`, fontWeight: 800 }}>
                              {STATUS_LABELS[selected.status].toUpperCase()}
                           </span>
                        </div>
                        <p style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 600 }}>
                           Cliente: <span style={{ color: 'var(--text-main)' }}>{getClientById(selected.clientId)?.company || 'N/A'}</span>
                           {selected.plano && <span style={{ color: 'var(--primary)', marginLeft: 8 }}>· Plano: {selected.plano}</span>}
                        </p>
                     </div>
                  </div>
                  <button className="btn-icon" onClick={() => setSelected(null)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}><X size={18}/></button>
               </div>

               {/* Tabs */}
               <div style={{ display: 'flex', gap: 24 }}>
                {([['overview', '📌 Visão Geral & Escopo'], ['details', '🏢 Stakeholders & Equipe'], ['meetings', '📅 Painel de Reuniões']] as [ActiveView, string][]).map(([tab, label]) => (
                  <button key={tab} onClick={() => setActiveView(tab)} style={{
                    padding: '12px 0', border: 'none', background: 'transparent', cursor: 'pointer',
                    fontSize: 14, fontWeight: 800, color: activeView === tab ? 'var(--primary)' : 'var(--text-muted)',
                    borderBottom: activeView === tab ? '3px solid var(--primary)' : '3px solid transparent',
                    transition: 'var(--transition)'
                  }}>{label}</button>
                ))}
              </div>
            </div>

            <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto', padding: 32 }}>
               
               {/* TAB OVERVIEW */}
               {activeView === 'overview' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 300px)', gap: 32 }}>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        {selected.resumo && (
                           <div>
                              <h4 style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: 12 }}>Resumo Executivo</h4>
                              <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-sec)', padding: 16, background: 'var(--bg-subtle)', borderRadius: 12, border: '1px solid var(--border)' }}>{selected.resumo}</p>
                           </div>
                        )}
                        {(selected.objetivos || selected.metas) && (
                           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                              {selected.objetivos && (
                                 <div className="card" style={{ padding: 20, background: 'var(--primary-glow)', border: '1px solid rgba(124,58,237,0.15)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                                       <Target size={20} color="var(--primary)"/>
                                       <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--primary)' }}>Objetivos e Escopo</h4>
                                    </div>
                                    <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-sec)', whiteSpace: 'pre-wrap' }}>{selected.objetivos}</p>
                                 </div>
                              )}
                              {selected.metas && (
                                 <div className="card" style={{ padding: 20, background: 'var(--success-glow)', border: '1px solid rgba(16,185,129,0.15)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                                       <TrendingUp size={20} color="var(--success)"/>
                                       <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--success)' }}>Metas & KPIs (SLA)</h4>
                                    </div>
                                    <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-sec)', whiteSpace: 'pre-wrap' }}>{selected.metas}</p>
                                 </div>
                              )}
                           </div>
                        )}
                        <hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: 0 }}/>
                        <div>
                           <h4 style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: 12 }}>Controle de Status</h4>
                           <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                              {(['ativo', 'atrasado', 'pausado', 'concluido'] as const).map(s => (
                                 <button key={s} onClick={() => { updateProject(selected.id, { status: s }); setSelected(p => p ? { ...p, status: s } : p); }}
                                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 100, border: `1.5px solid ${selected.status === s ? STATUS_COLORS[s] : 'var(--border)'}`, background: selected.status === s ? `${STATUS_COLORS[s]}15` : 'transparent', color: selected.status === s ? STATUS_COLORS[s] : 'var(--text-main)', fontWeight: 800, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s' }}>
                                    {s === 'ativo' ? <Activity size={16}/> : s === 'atrasado' ? <TrendingDown size={16}/> : s === 'pausado' ? <StopCircle size={16}/> : <CheckCircle size={16}/>}
                                    {STATUS_LABELS[s]}
                                 </button>
                              ))}
                           </div>
                        </div>
                     </div>

                     <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div className="card" style={{ padding: 20 }}>
                           <h4 style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: 16 }}>Taxa de Entrega</h4>
                           <h2 style={{ fontSize: 40, fontWeight: 900, color: selected.color, marginBottom: 8, lineHeight: 1 }}>{selected.progress}%</h2>
                           <div className="progress-track" style={{ height: 12, marginBottom: 16 }}>
                              <div className="progress-fill" style={{ width: `${selected.progress}%`, background: selected.color }} />
                           </div>
                           <input type="range" min="0" max="100" value={selected.progress}
                              onChange={e => handleProgressChange(selected.id, parseInt(e.target.value))}
                              style={{ width: '100%', accentColor: selected.color, cursor: 'pointer' }} />
                        </div>
                        <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                           <div>
                              <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: 0.5, marginBottom: 6 }}>Cronograma Sprint</p>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 700 }}>
                                 <Calendar size={16} color="var(--primary)"/> {new Date(selected.startDate).toLocaleDateString('pt-BR')} <ArrowRight size={14} color="var(--text-muted)"/> {new Date(selected.endDate).toLocaleDateString('pt-BR')} 
                              </div>
                           </div>
                           <hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: 0 }}/>
                           <div>
                              <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: 0.5, marginBottom: 6 }}>Orçamento da Conta</p>
                              <p style={{ fontSize: 24, fontWeight: 900, color: 'var(--success)' }}>{fmt(selected.budget)}</p>
                           </div>
                        </div>
                     </div>
                  </div>
               )}

               {/* TAB DETAILS */}
               {activeView === 'details' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: 32 }}>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-main)', borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>Ponto de Contato B2B</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                           <div className="card" style={{ padding: 16, background: 'var(--bg-subtle)' }}>
                              <Building2 size={20} color="var(--primary)" style={{ marginBottom: 12 }}/>
                              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>RESPONSÁVEL (MAGISTER)</p>
                              <p style={{ fontSize: 15, fontWeight: 800 }}>{selected.responsavelInterno || 'Não definido'}</p>
                           </div>
                           <div className="card" style={{ padding: 16, background: 'var(--bg-subtle)' }}>
                              <Users size={20} color="var(--primary)" style={{ marginBottom: 12 }}/>
                              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>CONTATO (CLIENTE)</p>
                              <p style={{ fontSize: 15, fontWeight: 800 }}>{selected.responsavelCliente || 'Não definido'}</p>
                           </div>
                           <div className="card" style={{ padding: 16, background: 'var(--bg-subtle)' }}>
                              <Mail size={20} color="var(--primary)" style={{ marginBottom: 12 }}/>
                              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>E-MAIL CLIENTE</p>
                              <p style={{ fontSize: 15, fontWeight: 800 }}>{selected.emailCliente || 'Não definido'}</p>
                           </div>
                           <div className="card" style={{ padding: 16, background: 'var(--bg-subtle)' }}>
                              <Phone size={20} color="var(--primary)" style={{ marginBottom: 12 }}/>
                              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>WHATSAPP</p>
                              <p style={{ fontSize: 15, fontWeight: 800 }}>{selected.whatsappCliente || 'Não definido'}</p>
                           </div>
                        </div>

                        {selected.atribuicoes && (
                           <div className="card" style={{ padding: 20 }}>
                              <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-main)', marginBottom: 12 }}>Atribuições da Entidade</h4>
                              <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-sec)', whiteSpace: 'pre-wrap' }}>{selected.atribuicoes}</p>
                           </div>
                        )}
                        {selected.postagens && (
                           <div className="card" style={{ padding: 20 }}>
                              <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-main)', marginBottom: 12 }}>Cronograma de Mídia / Postagens</h4>
                              <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-sec)', whiteSpace: 'pre-wrap' }}>{selected.postagens}</p>
                           </div>
                        )}
                     </div>

                     <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-main)', borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>Squad Destacada</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                           {selected.team.length === 0 ? <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Sem equipe atrelada.</p> : selected.team.map(m => {
                              const member = team.find(tm => tm.initials === m);
                              return (
                                 <div key={m} className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 16 }}>
                                    <div className="avatar" style={{ width: 36, height: 36, fontSize: 14, borderRadius: 12, background: `hsl(${m.charCodeAt(0) * 30}, 60%, 50%)`, color: '#fff', fontWeight: 900 }}>{m}</div>
                                    <div>
                                       <p style={{ fontSize: 15, fontWeight: 800 }}>{member?.name || m}</p>
                                       {member?.sector && <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{member.sector}</p>}
                                    </div>
                                 </div>
                              );
                           })}
                        </div>
                     </div>
                  </div>
               )}

               {/* TAB MEETINGS */}
               {activeView === 'meetings' && (
                  <div>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <div>
                           <h4 style={{ fontSize: 16, fontWeight: 800 }}>Reuniões Agendadas / Histórico</h4>
                           <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Registre reuniões importantes alinhadas a este projeto.</p>
                        </div>
                        <button className="btn btn-primary" onClick={() => setShowMeetingForm(!showMeetingForm)}><Plus size={16}/> Adicionar Log/Reunião</button>
                     </div>

                     {showMeetingForm && (
                        <div className="card" style={{ padding: 24, border: '2px solid var(--primary)', background: 'var(--primary-glow)', marginBottom: 32 }}>
                           <h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 16, color: 'var(--primary)' }}>Agendar Reunião</h4>
                           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                              <div style={{ gridColumn: '1/-1' }}>
                                 <label className="form-label">Qual a pauta ou título? *</label>
                                 <input className="input" placeholder="Ex: Demonstração MVP" value={meetingForm.title} onChange={e => setMeetingForm(p => ({ ...p, title: e.target.value }))} />
                              </div>
                              <div>
                                 <label className="form-label">Data</label>
                                 <input className="input" type="date" value={meetingForm.date} onChange={e => setMeetingForm(p => ({ ...p, date: e.target.value }))} />
                              </div>
                              <div>
                                 <label className="form-label">Horário (Fuso de Brasília)</label>
                                 <input className="input" type="time" value={meetingForm.time} onChange={e => setMeetingForm(p => ({ ...p, time: e.target.value }))} />
                              </div>
                              <div style={{ gridColumn: '1/-1' }}>
                                 <label className="form-label">Ata da Reunião / Pautas</label>
                                 <textarea className="input" placeholder="Tópicos que serão ou foram discutidos..." rows={3} value={meetingForm.notes} onChange={e => setMeetingForm(p => ({ ...p, notes: e.target.value }))} />
                              </div>
                           </div>
                           <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                              <button className="btn btn-ghost" onClick={() => setShowMeetingForm(false)}>Cancelar</button>
                              <button className="btn btn-primary" onClick={handleAddMeeting} disabled={!meetingForm.title}><CheckCircle size={16}/> Salvar Reunião</button>
                           </div>
                        </div>
                     )}

                     {(!selected.reunioes || selected.reunioes.length === 0) ? (
                        <div className="empty-state" style={{ padding: '60px 0' }}><Calendar size={48} color="var(--text-muted)" style={{ marginBottom: 16 }}/><p>Nenhum compromisso marcado.</p></div>
                     ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                           {[...selected.reunioes].reverse().map(m => (
                              <div key={m.id} className="card" style={{ padding: 20, borderLeft: `4px solid ${m.status === 'realizada' ? 'var(--success)' : m.status === 'cancelada' ? 'var(--danger)' : 'var(--primary)'}` }}>
                                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <h4 style={{ fontSize: 16, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 10 }}>
                                       <Calendar size={18} color="var(--primary)"/> {m.title}
                                    </h4>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                       <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{new Date(m.date).toLocaleDateString('pt-BR')} às <span style={{ color: 'var(--text-main)' }}>{m.time}</span></span>
                                       <span className={`badge ${m.status === 'realizada' ? 'badge-success' : m.status === 'cancelada' ? 'badge-danger' : 'badge-primary'}`}>{m.status.toUpperCase()}</span>
                                    </div>
                                 </div>
                                 {m.notes && <p style={{ fontSize: 14, color: 'var(--text-sec)', lineHeight: 1.6, background: 'var(--bg-subtle)', padding: 16, borderRadius: 12 }}>{m.notes}</p>}
                                 
                                 {m.status === 'agendada' && (
                                    <div style={{ display: 'flex', gap: 12, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                                       <button className="btn btn-ghost btn-sm" style={{ color: 'var(--success)', borderColor: 'var(--success)' }} onClick={() => {
                                          const updated = (selected.reunioes || []).map(r => r.id === m.id ? { ...r, status: 'realizada' as const } : r);
                                          updateProject(selected.id, { reunioes: updated });
                                          setSelected(p => p ? { ...p, reunioes: updated } : p);
                                       }}><CheckCircle size={14}/> Marcar Realizada</button>
                                       <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => {
                                          const updated = (selected.reunioes || []).map(r => r.id === m.id ? { ...r, status: 'cancelada' as const } : r);
                                          updateProject(selected.id, { reunioes: updated });
                                          setSelected(p => p ? { ...p, reunioes: updated } : p);
                                       }}><PauseCircle size={14}/> Cancelar Call</button>
                                    </div>
                                 )}
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
               )}
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-card)', padding: '20px 32px' }}>
               <div style={{ display: 'flex', gap: 12 }}>
                 <button className="btn btn-secondary" onClick={() => {
                   setForm({
                     name: selected.name, clientId: selected.clientId, type: selected.type,
                     status: selected.status, startDate: selected.startDate, endDate: selected.endDate,
                     team: selected.team, budget: selected.budget.toString(),
                     responsavelInterno: selected.responsavelInterno || '', responsavelCliente: selected.responsavelCliente || '',
                     emailCliente: selected.emailCliente || '', whatsappCliente: selected.whatsappCliente || '',
                     plano: selected.plano || '', objetivos: selected.objetivos || '', metas: selected.metas || '',
                     resumo: selected.resumo || '', postagens: selected.postagens || '', atribuicoes: selected.atribuicoes || '',
                   });
                   setIsEditingForm(true);
                   setShowForm(true);
                 }}><Edit size={14}/> Editar Entregável</button>
                 <button className="btn btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => { if (confirm('Deletar esse projeto? Essa ação é vitalícias.')) { deleteProject(selected.id); setSelected(null); } }}>
                     <Trash2 size={14}/> Excluir
                 </button>
               </div>
               <div style={{ display: 'flex', gap: 12 }}>
                  <button className="btn btn-outline" onClick={() => setSelected(null)}>Fechar Visualização</button>
                  <button className="btn btn-primary" onClick={() => {
                   updateProject(selected.id, { progress: Math.min(selected.progress + 10, 100) });
                   setSelected(p => p ? { ...p, progress: Math.min(p.progress + 10, 100) } : p);
                  }}><ChevronRight size={16}/> Adiantar 10% do Escopo</button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── ADD / EDIT PROJECT MODAL ─────────────────────────────── */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal modal-xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: 18, fontWeight: 900 }}>{isEditingForm ? 'Editar Projeto' : 'Registrar Nova Produção'}</h2>
              <button className="btn-icon" onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Nome de Identificação (Escopo) *</label>
                  <input className="input" placeholder="Ex: Criação da Landing Page Institucional" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Cliente Requisitante *</label>
                  <select className="input" value={form.clientId} onChange={e => setForm(p => ({ ...p, clientId: e.target.value }))}>
                    <option value="">Selecione o cliente base...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.company}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Tipo de Trabalho</label>
                  <select className="input" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                    {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Sprint Start</label>
                  <input className="input" type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Prazo Final (SLA) *</label>
                  <input className="input" type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Reserva Financeira / Budget (R$)</label>
                  <input className="input" type="number" placeholder="Budget base da produção" value={form.budget} onChange={e => setForm(p => ({ ...p, budget: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Plano Atrelado (Opcional)</label>
                  <input className="input" placeholder="Ex: Scale 10K Mensal, Starter MKT" value={form.plano} onChange={e => setForm(p => ({ ...p, plano: e.target.value }))} />
                </div>

                <div style={{ gridColumn: '1/-1' }}>
                   <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: 0.5, margin: '16px 0 8px' }}>Pontos de Referência</p>
                </div>

                <div>
                  <label className="form-label">Account Manager / P.O (Interno)</label>
                  <input className="input" placeholder="Ex: Roberto Dev" value={form.responsavelInterno} onChange={e => setForm(p => ({ ...p, responsavelInterno: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Aprovador no Cliente</label>
                  <input className="input" placeholder="Nome de quem aprova as demandas" value={form.responsavelCliente} onChange={e => setForm(p => ({ ...p, responsavelCliente: e.target.value }))} />
                </div>

                <div style={{ gridColumn: '1/-1' }}>
                   <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: 0.5, margin: '16px 0 8px' }}>Estratégia</p>
                </div>

                <div style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Escopo / Resumo Executivo</label>
                  <textarea className="input" rows={2} placeholder="Quais os fundamentos para a equipe base desse projeto?" value={form.resumo} onChange={e => setForm(p => ({ ...p, resumo: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Objetivos do Projeto</label>
                  <textarea className="input" rows={2} placeholder="Sair do ponto A e ir para C" value={form.objetivos} onChange={e => setForm(p => ({ ...p, objetivos: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Metas de Conclusão (O.K.Rs)</label>
                  <textarea className="input" rows={2} placeholder="Ex: Conversão crescer 20%" value={form.metas} onChange={e => setForm(p => ({ ...p, metas: e.target.value }))} />
                </div>

                <div style={{ gridColumn: '1/-1' }}>
                   <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: 0.5, margin: '16px 0 8px' }}>Squad Allocations</p>
                </div>

                <div style={{ gridColumn: '1/-1', background: 'var(--bg-subtle)', padding: 16, borderRadius: 12 }}>
                  <label className="form-label">Selecionar Time Engajado</label>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {team.map(member => (
                      <button key={member.id} onClick={() => toggleTeamMember(member.initials)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
                          borderRadius: 100, border: `2px solid ${form.team.includes(member.initials) ? 'var(--primary)' : 'var(--border)'}`,
                          background: form.team.includes(member.initials) ? 'var(--primary-glow)' : 'var(--bg-card)',
                          cursor: 'pointer', fontWeight: 700, fontSize: 13, transition: 'all 0.2s',
                          color: form.team.includes(member.initials) ? 'var(--primary)' : 'var(--text-main)'
                        }}>
                        <div className="avatar" style={{ width: 24, height: 24, fontSize: 10,  color: '#fff', background: `hsl(${member.initials.charCodeAt(0) * 30}, 60%, 50%)` }}>{member.initials}</div>
                        {member.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Descartar e Cancelar</button>
              <button className="btn btn-primary" onClick={handleAdd} disabled={!form.name || !form.clientId || !form.endDate}>
                {isEditingForm ? <><CheckCircle size={16} /> Salvar Modificações do Projeto</> : <><Plus size={16} /> Inicializar Escopo de Projeto</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
