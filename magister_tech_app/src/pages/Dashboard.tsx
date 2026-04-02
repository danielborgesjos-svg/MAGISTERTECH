import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, Users, Briefcase, DollarSign, Clock,
  AlertTriangle, CheckCircle, Calendar, Plus, ArrowRight,
  Flame, Target, FileText, PenTool, Bell, Zap
} from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';

const fmt = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

const statusColor: Record<string, string> = {
  ativo: 'var(--success)', atrasado: 'var(--danger)',
  pausado: 'var(--warning)', concluido: 'var(--primary)',
};

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const nav = useNavigate();
  const {
    clients, projects, contracts, transactions, content,
    alerts, getTodayEvents, getOverdueTasks, getAtRiskProjects,
    getExpiringContracts, getInactiveClients,
    getMonthRevenue, getMonthExpense, getBalance,
    getPendingReceivables, getPendingPayables,
    getClientById,
  } = useData();

  const isCLevel = ['admin', 'ceo', 'financeiro'].includes(user?.role || '');
  const todayEvents = getTodayEvents();
  const overdue = getOverdueTasks();
  const atRisk = getAtRiskProjects();
  const expiring = getExpiringContracts();
  const inactive = getInactiveClients();
  const revenue = getMonthRevenue();
  const expense = getMonthExpense();
  const balance = getBalance();
  const receivables = getPendingReceivables();
  const payables = getPendingPayables();

  const activeClients = clients.filter(c => c.status === 'ativo').length;
  const activeProjects = projects.filter(p => p.status === 'ativo').length;

  const todayStr = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  // Upcoming content
  const upcomingPosts = content.filter(c => ['aprovado', 'revisao'].includes(c.status)).slice(0, 3);

  return (
    <div className="animate-in">
      {/* ─── HEADER ──────────────────────────────────────────── */}
      <div className="page-header" style={{ marginBottom: 32 }}>
        <div>
          <h1 className="page-title" style={{ fontSize: 26 }}>
            {user?.role === 'admin' ? '🚀 Painel Executivo' : `Olá, ${user?.name.split(' ')[0]}`}
          </h1>
          <p className="page-subtitle">
            {todayStr.charAt(0).toUpperCase() + todayStr.slice(1)} · {alerts.length > 0
              ? <><span style={{ color: 'var(--danger)', fontWeight: 700 }}>{alerts.length} alertas ativos</span> requerem atenção</>
              : 'Tudo operacional'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => nav('/admin/agenda')}><Calendar size={14} /> Agenda</button>
          <button className="btn btn-ghost btn-sm" onClick={() => nav('/admin/kanban')}><CheckCircle size={14} /> Tarefa</button>
          <button className="btn btn-primary btn-sm" onClick={() => nav('/admin/projetos')}><Plus size={14} /> Novo Projeto</button>
        </div>
      </div>

      {/* ─── C-LEVEL PREMIUM DASHBOARD ────────────────────── */}
      {isCLevel && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
          {/* Faturamento (Premium) */}
          <div className="card" onClick={() => nav('/admin/financeiro')} style={{ cursor: 'pointer', background: 'linear-gradient(135deg, var(--primary) 0%, #003d99 100%)', color: '#fff', border: 'none', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: -20, top: -20, opacity: 0.1, transform: 'scale(2)' }}><DollarSign size={80} /></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 600, opacity: 0.8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Faturamento Mês</p>
              <div style={{ background: 'rgba(255,255,255,0.2)', padding: 6, borderRadius: 8 }}><TrendingUp size={16} /></div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, marginBottom: 8, letterSpacing: -1 }}>{fmt(revenue)}</div>
            <div style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, opacity: 0.9 }}>
              <Zap size={14} fill="#fff" /> Margem saudável projetada
            </div>
          </div>

          {/* Lucro / Saldo */}
          <div className="card" onClick={() => nav('/admin/financeiro')} style={{ cursor: 'pointer', background: 'linear-gradient(135deg, var(--success) 0%, #208e5c 100%)', color: '#fff', border: 'none', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: -20, top: -20, opacity: 0.1, transform: 'scale(2)' }}><TrendingUp size={80} /></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 600, opacity: 0.8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Lucro / Saldo Líquido</p>
              <div style={{ background: 'rgba(255,255,255,0.2)', padding: 6, borderRadius: 8 }}><DollarSign size={16} /></div>
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, marginBottom: 8, letterSpacing: -1 }}>{fmt(balance)}</div>
            <div style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, opacity: 0.9 }}>
              <CheckCircle size={14} /> Fluxo de caixa positivo
            </div>
          </div>

          {/* Contas a Pagar/Receber */}
          <div className="card" style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', border: '1px solid var(--border)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Fluxo Financeiro Futuro</p>
            </div>
            <div style={{ display: 'flex', flex: 1 }}>
              <div style={{ flex: 1, padding: '20px', borderRight: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => nav('/admin/financeiro')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ background: 'var(--warning-glow)', padding: 6, borderRadius: 6 }}><Clock size={14} style={{ color: 'var(--warning)' }} /></div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>A Receber (Previsão)</span>
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--warning)' }}>{fmt(receivables)}</div>
              </div>
              <div style={{ flex: 1, padding: '20px', cursor: 'pointer' }} onClick={() => nav('/admin/financeiro')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ background: 'var(--danger-glow)', padding: 6, borderRadius: 6 }}><TrendingDown size={14} style={{ color: 'var(--danger)' }} /></div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>A Pagar (Custos fixos)</span>
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--danger)' }}>{fmt(payables)}</div>
              </div>
            </div>
          </div>

          {/* KPI Operacional */}
          <div className="card" onClick={() => nav('/admin/crm')} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px' }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Clientes Ativos</p>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary)' }}>{activeClients}</div>
            </div>
            <div style={{ background: 'var(--primary-glow)', padding: 12, borderRadius: 12 }}><Users size={24} style={{ color: 'var(--primary)' }} /></div>
          </div>

          <div className="card" onClick={() => nav('/admin/projetos')} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px' }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Projetos Ativos</p>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--purple)' }}>{activeProjects}</div>
            </div>
            <div style={{ background: 'var(--purple-glow)', padding: 12, borderRadius: 12 }}><Briefcase size={24} style={{ color: 'var(--purple)' }} /></div>
          </div>

          <div className="card" onClick={() => nav('/admin/equipe')} style={{ cursor: 'pointer', gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: 20, padding: '20px', background: 'var(--bg-subtle)' }}>
             <Flame size={32} style={{ color: 'var(--warning)', flexShrink: 0 }} />
             <div>
               <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)' }}>Eficiência Operacional: {overdue.length === 0 ? 'Excelente' : 'Requer Atenção'}</p>
               <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Você tem {projects.filter(p => p.status === 'atrasado').length} projetos atrasados e {overdue.length} tarefas pendentes. A capacidade do time {overdue.length > 5 ? 'está no limite' : 'está regular'}.</p>
             </div>
          </div>
        </div>
      )}

      {/* ─── ROW 2: ALERTAS + HOJE ────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
        
        {/* Alertas Inteligentes */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ background: 'var(--danger-glow)', borderRadius: 8, padding: 6, display: 'flex' }}><Bell size={16} style={{ color: 'var(--danger)' }} /></div>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700 }}>Alertas Inteligentes</h3>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Gerado automaticamente pelo sistema</p>
              </div>
            </div>
            {alerts.length > 0 && <span className="badge badge-danger">{alerts.length}</span>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {alerts.length === 0 && (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <CheckCircle size={32} style={{ color: 'var(--success)' }} />
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Nenhum alerta ativo. Tudo em ordem!</p>
              </div>
            )}
            {overdue.length > 0 && (
              <div className="alert-item danger" onClick={() => nav('/admin/kanban')} style={{ cursor: 'pointer' }}>
                <div className="status-dot danger" style={{ marginTop: 3 }} />
                <p style={{ fontSize: 13 }}><strong>{overdue.length} tarefa{overdue.length > 1 ? 's' : ''}</strong> atrasada{overdue.length > 1 ? 's' : ''} no Kanban</p>
              </div>
            )}
            {atRisk.map(p => (
              <div key={p.id} className="alert-item warning" onClick={() => nav('/admin/projetos')} style={{ cursor: 'pointer' }}>
                <div className="status-dot warning" style={{ marginTop: 3 }} />
                <p style={{ fontSize: 13 }}>Projeto <strong>"{p.name}"</strong> está em risco</p>
              </div>
            ))}
            {expiring.map(c => (
              <div key={c.id} className="alert-item warning" onClick={() => nav('/admin/contratos')} style={{ cursor: 'pointer' }}>
                <div className="status-dot warning" style={{ marginTop: 3 }} />
                <p style={{ fontSize: 13 }}>Contrato vencendo: <strong>"{c.title}"</strong></p>
              </div>
            ))}
            {inactive.slice(0, 2).map(c => (
              <div key={c.id} className="alert-item purple" onClick={() => nav('/admin/crm')} style={{ cursor: 'pointer' }}>
                <div className="status-dot" style={{ marginTop: 3, background: 'var(--purple)' }} />
                <p style={{ fontSize: 13 }}>Sem contato há 7+ dias: <strong>{c.company}</strong></p>
              </div>
            ))}
          </div>
        </div>

        {/* Foco Hoje */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ background: 'var(--primary-glow)', borderRadius: 8, padding: 6, display: 'flex' }}><Flame size={16} style={{ color: 'var(--primary)' }} /></div>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700 }}>Foco de Hoje</h3>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{todayEvents.length} compromisso{todayEvents.length !== 1 ? 's' : ''} agendado{todayEvents.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => nav('/admin/agenda')}>Ver tudo <ArrowRight size={12} /></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {todayEvents.length === 0 && (
              <div className="empty-state" style={{ padding: '20px 0' }}>
                <Calendar size={28} style={{ color: 'var(--text-light)' }} />
                <p style={{ fontSize: 13 }}>Sem compromissos hoje</p>
                <button className="btn btn-ghost btn-sm" onClick={() => nav('/admin/agenda')}>Agendar evento</button>
              </div>
            )}
            {todayEvents.slice(0, 4).map(ev => (
              <div key={ev.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                background: 'var(--bg-subtle)', borderRadius: 8, cursor: 'pointer',
                border: `1px solid ${ev.color}20`, transition: 'var(--transition)'
              }} onClick={() => nav('/admin/agenda')}>
                <div style={{ background: ev.color, color: '#fff', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
                  {ev.time}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600 }}>{ev.title}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ev.location || ev.type}</p>
                </div>
                <span className={`badge badge-${ev.type === 'reunião' ? 'primary' : ev.type === 'entrega' ? 'danger' : ev.type === 'financeiro' ? 'success' : 'purple'}`}>
                  {ev.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── ROW 3: PROJETOS + PIPELINE MINI ─────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 28 }}>

        {/* Projetos */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Briefcase size={16} style={{ color: 'var(--purple)' }} />
              <h3 style={{ fontSize: 14, fontWeight: 700 }}>Projetos em Andamento</h3>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => nav('/admin/projetos')}>Ver todos <ArrowRight size={12} /></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {projects.filter(p => p.status !== 'concluido').slice(0, 4).map(p => {
              const client = getClientById(p.clientId);
              const daysLeft = Math.ceil((new Date(p.endDate).getTime() - Date.now()) / 86400000);
              return (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px',
                  borderRadius: 8, background: 'var(--bg-subtle)', cursor: 'pointer',
                  border: '1px solid var(--border)', transition: 'var(--transition)'
                }} onClick={() => nav('/admin/projetos')} onMouseEnter={e => (e.currentTarget.style.borderColor = p.color)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                  <div style={{ width: 4, height: 44, borderRadius: 4, background: p.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</p>
                      <span style={{ fontSize: 12, fontWeight: 700, color: p.color, flexShrink: 0, marginLeft: 8 }}>{p.progress}%</span>
                    </div>
                    <div className="progress-track" style={{ marginBottom: 4 }}>
                      <div className="progress-fill" style={{ width: `${p.progress}%`, background: p.color }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{client?.company || 'Cliente'}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 11, color: daysLeft < 0 ? 'var(--danger)' : daysLeft < 7 ? 'var(--warning)' : 'var(--text-muted)', fontWeight: 600 }}>
                          {daysLeft < 0 ? `${Math.abs(daysLeft)}d atrasado` : `${daysLeft}d restantes`}
                        </span>
                        <span className="badge" style={{ background: `${statusColor[p.status] || 'var(--primary)'}20`, color: statusColor[p.status] || 'var(--primary)' }}>
                          {p.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pipeline + Conteúdo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Financeiro Rápido */}
          {isCLevel && (
            <div className="card" style={{ cursor: 'pointer' }} onClick={() => nav('/admin/financeiro')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <DollarSign size={15} style={{ color: 'var(--success)' }} />
                <h3 style={{ fontSize: 14, fontWeight: 700 }}>Financeiro Rápido</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ background: 'var(--success-glow)', padding: '10px 12px', borderRadius: 8, borderLeft: '3px solid var(--success)' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', marginBottom: 4 }}>Receitas</p>
                  <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--success)' }}>{fmt(revenue)}</p>
                </div>
                <div style={{ background: 'var(--danger-glow)', padding: '10px 12px', borderRadius: 8, borderLeft: '3px solid var(--danger)' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--danger)', textTransform: 'uppercase', marginBottom: 4 }}>Despesas</p>
                  <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--danger)' }}>{fmt(expense)}</p>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, padding: '8px 12px', background: 'var(--primary-glow)', borderRadius: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)' }}>Saldo do Mês</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: balance >= 0 ? 'var(--success)' : 'var(--danger)' }}>{fmt(balance)}</span>
              </div>
            </div>
          )}

          {/* Conteúdo Próximo */}
          <div className="card" style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <PenTool size={15} style={{ color: 'var(--purple)' }} />
                <h3 style={{ fontSize: 14, fontWeight: 700 }}>Conteúdo</h3>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => nav('/admin/conteudo')}>Ver <ArrowRight size={11} /></button>
            </div>
            {upcomingPosts.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Sem posts em produção</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {upcomingPosts.map(post => {
                  const client = getClientById(post.clientId);
                  return (
                    <div key={post.id} style={{
                      display: 'flex', gap: 10, alignItems: 'flex-start',
                      padding: '8px 10px', borderRadius: 8, background: 'var(--bg-subtle)', cursor: 'pointer'
                    }} onClick={() => nav('/admin/conteudo')}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>
                        {post.platform === 'Instagram' ? '📸' : post.platform === 'LinkedIn' ? '💼' : post.platform === 'YouTube' ? '▶️' : '📣'}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{post.caption}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{client?.company} · {post.date}</p>
                      </div>
                      <span className={`badge ${post.status === 'aprovado' ? 'badge-success' : 'badge-warning'}`}>{post.status}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── ROW 4: CONTRATOS + QUICK ACTIONS ─────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        {/* Contratos ativos */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={15} style={{ color: 'var(--primary)' }} />
              <h3 style={{ fontSize: 14, fontWeight: 700 }}>Contratos Ativos</h3>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => nav('/admin/contratos')}>Ver todos <ArrowRight size={12} /></button>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Contrato</th>
                  <th>Valor</th>
                  <th>Vencimento</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {contracts.slice(0, 4).map(c => {
                  const client = getClientById(c.clientId);
                  const daysLeft = Math.ceil((new Date(c.endDate).getTime() - Date.now()) / 86400000);
                  return (
                    <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => nav('/admin/contratos')}>
                      <td>
                        <p style={{ fontWeight: 600, fontSize: 13 }}>{c.title}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{client?.company}</p>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--success)' }}>{fmt(c.value)}</td>
                      <td>
                        <p style={{ fontSize: 12, color: daysLeft < 30 ? 'var(--warning)' : 'var(--text-muted)' }}>
                          {new Date(c.endDate).toLocaleDateString('pt-BR')}
                        </p>
                        {daysLeft < 30 && <p style={{ fontSize: 10, color: 'var(--warning)', fontWeight: 600 }}>Vence em {daysLeft}d</p>}
                      </td>
                      <td>
                        <span className={`badge ${c.status === 'ativo' ? 'badge-success' : c.status === 'vencendo' ? 'badge-warning' : 'badge-muted'}`}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Zap size={15} style={{ color: 'var(--warning)' }} />
            <h3 style={{ fontSize: 14, fontWeight: 700 }}>Ações Rápidas</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Novo Cliente', icon: Users, to: '/admin/crm', color: 'var(--primary)' },
              { label: 'Novo Projeto', icon: Briefcase, to: '/admin/projetos', color: 'var(--purple)' },
              { label: 'Nova Tarefa', icon: CheckCircle, to: '/admin/kanban', color: 'var(--success)' },
              { label: 'Novo Contrato', icon: FileText, to: '/admin/contratos', color: 'var(--warning)' },
              { label: 'Agendar Reunião', icon: Calendar, to: '/admin/agenda', color: 'var(--secondary)' },
              { label: 'Pipeline Comercial', icon: Target, to: '/admin/pipeline', color: 'var(--danger)' },
            ].map(action => (
              <button key={action.label} className="btn btn-ghost" onClick={() => nav(action.to)}
                style={{ justifyContent: 'flex-start', borderColor: 'transparent' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = action.color; (e.currentTarget as HTMLElement).style.color = action.color; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = ''; }}>
                <action.icon size={15} />
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
