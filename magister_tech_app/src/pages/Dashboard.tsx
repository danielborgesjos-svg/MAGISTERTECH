import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Briefcase, Landmark, FileText, CheckCircle, Clock,
  TrendingDown, TrendingUp, AlertTriangle, ArrowRight, Activity, Bell
} from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';

const fmt = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const nav = useNavigate();
  const {
    clients, projects, contracts, kanban, alerts,
    getMonthRevenue, getMonthExpense, getBalance, getPendingReceivables,
    getAtRiskProjects, getExpiringContracts, getInactiveClients, getTodayEvents, getOverdueTasks
  } = useData();

  const monthRevenue = getMonthRevenue();
  const monthExpense = getMonthExpense();
  const balance = getBalance();
  const pending = getPendingReceivables();
  const atRisk = getAtRiskProjects();
  const expiring = getExpiringContracts();
  const inactive = getInactiveClients();
  const todayEvts = getTodayEvents();
  const overdueTasks = getOverdueTasks();

  const activeClients = clients.filter(c => c.status === 'ativo').length;
  const activeProjects = projects.filter(p => p.status === 'ativo').length;
  const activeContracts = contracts.filter(c => c.status === 'ativo').length;
  const totalTasks = kanban.flatMap(c => c.tasks).length;

  const kpis = [
    {
      label: 'Receita Operacional',
      value: fmt(monthRevenue),
      trend: balance >= 0 ? 'up' : 'down',
      sub: balance >= 0 ? `+ Saldo ${fmt(balance)}` : `- Débito ${fmt(Math.abs(balance))}`,
      accent: 'var(--success)', glow: 'var(--success-glow)'
    },
    {
      label: 'Saídas / Despesas',
      value: fmt(monthExpense),
      trend: 'down',
      sub: pending > 0 ? `Resgate Prev: ${fmt(pending)}` : 'Liquidez OK',
      accent: 'var(--danger)', glow: 'var(--danger-glow)'
    },
    {
      label: 'Base Ativa (Clientes)',
      value: activeClients,
      trend: inactive.length > 0 ? 'warn' : 'up',
      sub: inactive.length > 0 ? `${inactive.length} em risco (Churn)` : 'Base Saudável',
      accent: 'var(--primary)', glow: 'var(--primary-glow)'
    },
    {
      label: 'Volume de Contratos',
      value: activeContracts,
      trend: expiring.length > 0 ? 'warn' : 'up',
      sub: expiring.length > 0 ? `${expiring.length} a renovar (30d)` : 'MRR Assegurado',
      accent: 'var(--purple)', glow: 'var(--purple-glow)'
    },
  ];

  return (
    <div className="animate-in" style={{ paddingBottom: 40 }}>
      {/* ─── HEADER COCKPIT ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 100, fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Activity size={12} color="var(--primary)" /> VISÃO GERAL DO SISTEMA
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-main)', margin: 0, lineHeight: 1.1 }}>
            Cockpit Estratégico
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8 }}>
            Magister Tech ERP — {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary" onClick={() => nav('/admin/pipeline')}>Módulo Comercial</button>
          <button className="btn btn-primary" onClick={() => nav('/admin/kanban')}>Centro de Produção</button>
        </div>
      </div>

      {/* ─── ALERTS / SYSTEM STATUS ────────────────────────────────────────── */}
      {alerts.length > 0 && (
        <div style={{ padding: '16px 20px', background: 'var(--danger-glow)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--danger)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 8px 24px rgba(239, 68, 68, 0.3)' }}>
            <Bell size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--danger)', marginBottom: 2 }}>Atenção Requerida ({alerts.length})</h4>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {alerts.slice(0, 3).map(a => (
                <span key={a.id} style={{ fontSize: 13, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--danger)' }} /> {a.message}
                </span>
              ))}
              {alerts.length > 3 && <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>+{alerts.length - 3} alertas</span>}
            </div>
          </div>
        </div>
      )}

      {/* ─── PRIMARY KPIS ──────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 28 }}>
        {kpis.map((kpi, i) => (
          <div key={i} className="card" style={{ padding: '24px', position: 'relative', overflow: 'hidden', borderTop: `3px solid ${kpi.accent}` }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, background: kpi.glow, filter: 'blur(30px)', borderRadius: '50%', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, position: 'relative', zIndex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-sec)' }}>{kpi.label}</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%', background: kpi.trend === 'up' ? 'var(--success-glow)' : kpi.trend === 'warn' ? 'var(--warning-glow)' : 'var(--danger-glow)', color: kpi.trend === 'up' ? 'var(--success)' : kpi.trend === 'warn' ? 'var(--warning)' : 'var(--danger)' }}>
                {kpi.trend === 'up' ? <TrendingUp size={12} strokeWidth={3} /> : kpi.trend === 'warn' ? <AlertTriangle size={12} strokeWidth={3} /> : <TrendingDown size={12} strokeWidth={3} />}
              </div>
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-main)', marginBottom: 8, letterSpacing: '-0.02em', position: 'relative', zIndex: 1 }}>
              {kpi.value}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: kpi.trend === 'warn' ? 'var(--warning)' : 'var(--text-muted)', position: 'relative', zIndex: 1 }}>
              {kpi.sub}
            </div>
          </div>
        ))}
      </div>

      {/* ─── OPERATIONAL DASHBOARD (3 COLUMNS) ─────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr) minmax(0, 1fr)', gap: 20 }}>
        
        {/* COL 1: Projetos & Produção */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card" style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800 }}>Radar de Projetos</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{activeProjects} em andamento ativo</p>
              </div>
              <button className="btn-icon btn-sm" onClick={() => nav('/admin/projetos')}><ArrowRight size={14} /></button>
            </div>
            
            {projects.length === 0 ? (
              <div className="empty-state">Nenhum projeto rodando</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {projects.slice(0, 4).map(p => {
                  const daysLeft = Math.ceil((new Date(p.endDate).getTime() - Date.now()) / 86400000);
                  const isLate = p.status === 'atrasado' || daysLeft < 0;
                  return (
                    <div key={p.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
                          <span style={{ fontSize: 13, fontWeight: 700 }}>{p.name}</span>
                          {isLate && <span className="badge badge-danger" style={{ fontSize: 9 }}>ATRASADO</span>}
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--primary)' }}>{p.progress}%</span>
                      </div>
                      <div className="progress-track" style={{ height: 6, marginBottom: 6 }}>
                        <div className="progress-fill" style={{ width: `${p.progress}%`, background: p.color }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                        <span>Cliente: {clients.find(c => c.id === p.clientId)?.company || 'N/A'}</span>
                        <span style={{ color: isLate ? 'var(--danger)' : undefined }}>
                          {daysLeft < 0 ? `${Math.abs(daysLeft)} dias de atraso` : `${daysLeft} dias restantes`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* COL 2: Agenda & Tarefas Críticas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Agenda */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={14} color="var(--primary)"/> Hoje</h3>
              <span className="badge" style={{ background: 'var(--bg-subtle)', color: 'var(--text-main)' }}>{todayEvts.length} eventos</span>
            </div>
            {todayEvts.length === 0 ? (
               <div className="empty-state" style={{ padding: '20px 0' }}>Sem agenda para hoje</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {todayEvts.slice(0, 4).map(e => (
                  <div key={e.id} style={{ padding: '10px 12px', background: 'var(--bg-alt)', borderRadius: 8, borderLeft: `3px solid ${e.color}` }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-main)' }}>{e.title}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{e.time} • {e.type}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Task Status */}
          <div className="card" style={{ flex: 1 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 16 }}>Fluxo de Trabalho</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ padding: 16, background: 'var(--bg-subtle)', borderRadius: 10, textAlign: 'center' }}>
                <p style={{ fontSize: 24, fontWeight: 900, color: 'var(--primary)', marginBottom: 2 }}>{totalTasks}</p>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>TOTAL TASKS</p>
              </div>
              <div style={{ padding: 16, background: 'var(--danger-glow)', borderRadius: 10, textAlign: 'center' }}>
                <p style={{ fontSize: 24, fontWeight: 900, color: 'var(--danger)', marginBottom: 2 }}>{overdueTasks.length}</p>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>ATRASADAS</p>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" style={{ width: '100%', marginTop: 16, justifyContent: 'center' }} onClick={() => nav('/admin/kanban')}>
              Acessar Kanban <ArrowRight size={14}/>
            </button>
          </div>
        </div>

        {/* COL 3: Insights Rápidos (Ações) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 20 }}>Foco Prioritário</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
              {/* Item: Inactive Clients */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--bg-subtle)', borderRadius: 10, border: '1px solid var(--border)' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--purple-glow)', color: 'var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={14}/></div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 700 }}>Clientes Inativos</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Ação sugerida de reativação</p>
                </div>
                <span style={{ fontSize: 16, fontWeight: 900 }}>{inactive.length}</span>
              </div>

              {/* Item: Expiring Contracts */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--bg-subtle)', borderRadius: 10, border: '1px solid var(--border)' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--warning-glow)', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={14}/></div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 700 }}>Contratos Vencendo</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Renovação em -30d</p>
                </div>
                <span style={{ fontSize: 16, fontWeight: 900 }}>{expiring.length}</span>
              </div>

               {/* Item: Pending Revenue */}
               <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--bg-subtle)', borderRadius: 10, border: '1px solid var(--border)' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--success-glow)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Landmark size={14}/></div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 700 }}>Receita Pendente</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Faturas a receber</p>
                </div>
                <span style={{ fontSize: 14, fontWeight: 900 }}>{fmt(pending)}</span>
              </div>
            </div>
            
            <div style={{ marginTop: 24 }}>
               <h4 style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Acesso Direto</h4>
               <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => nav('/admin/crm')}>CRM</button>
                  <button className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => nav('/admin/financeiro')}>Financeiro</button>
               </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
