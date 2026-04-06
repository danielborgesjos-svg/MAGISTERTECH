import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle, Clock, FileText, Landmark,
  TrendingDown, TrendingUp, AlertTriangle, ArrowRight, Activity, Bell
} from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { usePermission } from '../hooks/usePermission';

const fmt = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);


export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const { canViewSensitiveData } = usePermission();
  const nav = useNavigate();
  const {
    clients, projects, contracts, alerts, kanban,
    getMonthRevenue, getMonthExpense, getBalance, getPendingReceivables,
    getExpiringContracts, getInactiveClients, getTodayEvents, getOverdueTasks
  } = useData();

  const monthRevenue = getMonthRevenue();
  const monthExpense = getMonthExpense();
  const balance = getBalance();
  const pending = getPendingReceivables();
  const expiring = getExpiringContracts();
  const inactive = getInactiveClients();
  const todayEvts = getTodayEvents();
  const overdueTasks = getOverdueTasks();

  const activeClients = clients.filter((c: any) => c.status === 'ativo').length;
  const activeContracts = contracts.filter((c: any) => c.status === 'ativo').length;
  
  // Neutral metrics for non-admin users
  const totalTasks = kanban.flatMap((c: any) => c.tasks).length;
  const completedTasks = kanban.find((c: any) => c.id === 'done')?.tasks.length || 0;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const hasFinanceAccess = canViewSensitiveData();

  const kpis = hasFinanceAccess ? [
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
  ] : [
    {
      label: 'Projetos Ativos',
      value: projects.filter(p => p.status === 'ativo').length,
      trend: 'up',
      sub: 'Monitoramento em tempo real',
      accent: 'var(--primary)', glow: 'var(--primary-glow)'
    },
    {
      label: 'Tarefas Globais',
      value: totalTasks,
      trend: 'up',
      sub: `${completedTasks} tarefas concluídas`,
      accent: 'var(--success)', glow: 'var(--success-glow)'
    },
    {
      label: 'Taxa de Entrega',
      value: `${completionRate}%`,
      trend: completionRate > 80 ? 'up' : 'warn',
      sub: completionRate > 80 ? 'Alta eficiência' : 'Atenção ao prazo',
      accent: 'var(--purple)', glow: 'var(--purple-glow)'
    },
    {
      label: 'Membros Online',
      value: 1, // Simplified for now
      trend: 'up',
      sub: 'Time conectado',
      accent: 'var(--warning)', glow: 'var(--warning-glow)'
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
            Cockpit Estratégico {user?.name ? `· ${user.name}` : ''}
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
              {alerts.slice(0, 3).map((a: any) => (
                <span key={a.id} style={{ fontSize: 13, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--danger)' }} /> {a.message}
                </span>
              ))}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => nav('/admin/config')}>Ver Tudo</button>
        </div>
      )}

      {/* ─── KPI GRID ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24, marginBottom: 32 }}>
        {kpis.map((kpi, i) => (
          <div key={i} className="card animate-scale-in" style={{ padding: '24px 28px', borderBottom: `4px solid ${kpi.accent}`, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -10, right: -10, width: 80, height: 80, background: kpi.glow, borderRadius: '50%', filter: 'blur(40px)', opacity: 0.1 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>{kpi.label}</span>
              {kpi.trend === 'up' && <TrendingUp size={18} color="var(--success)" />}
              {kpi.trend === 'down' && <TrendingDown size={18} color="var(--danger)" />}
              {kpi.trend === 'warn' && <AlertTriangle size={18} color="var(--warning)" />}
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-1px', color: 'var(--text-main)', marginBottom: 8 }}>{kpi.value}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: kpi.trend === 'warn' ? 'var(--warning)' : 'var(--text-muted)' }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* ─── SECONDARY GRID ────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32 }}>
        {/* Left: Quick Actions & Recent Projects */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Quick Access */}
          <div className="card" style={{ padding: 28 }}>
            <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
               🚀 Canais Críticos
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {[
                { label: 'Pipeline Comercial', path: '/admin/pipeline', icon: <TrendingUp size={20} />, color: 'var(--primary)' },
                { label: 'Fluxo de Caixa', path: '/admin/financeiro', icon: <Landmark size={20} />, color: 'var(--success)' },
                { label: 'Controle de Projetos', path: '/admin/projetos', icon: <FileText size={20} />, color: 'var(--purple)' },
              ].map(link => (
                <div key={link.label} className="card-subtle" onClick={() => nav(link.path)} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12, cursor: 'pointer', transition: 'var(--transition)' }}>
                  <div style={{ color: link.color }}>{link.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>{link.label}</div>
                  <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 28 }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 900 }}>📊 Projetos Ativos</h3>
                <button className="btn-icon" onClick={() => nav('/admin/projetos')}><ArrowRight size={16} /></button>
             </div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {projects.slice(0, 4).map((p: any) => (
                   <div key={p.id} className="list-item" onClick={() => nav(`/admin/projetos`)} style={{ cursor: 'pointer', padding: '12px 16px', borderRadius: 12, background: 'var(--bg-subtle)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <div>
                            <p style={{ fontSize: 14, fontWeight: 800 }}>{p.name}</p>
                            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{clients.find((c: any) => c.id === p.clientId)?.company}</p>
                         </div>
                         <div style={{ textAlign: 'right' }}>
                            <div className="badge badge-primary">{p.progress}%</div>
                         </div>
                      </div>
                   </div>
                ))}
                {projects.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: 20 }}>Nenhum projeto em andamento.</p>}
             </div>
          </div>
        </div>

        {/* Right: Timeline & Calendar Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div className="card" style={{ padding: 28, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
               📅 Agenda de Hoje
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {todayEvts.map(ev => (
                <div key={ev.id} style={{ display: 'flex', gap: 12, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 12, height: 12, borderRadius: 4, background: ev.color, marginTop: 4 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800 }}>{ev.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ev.time}</div>
                  </div>
                </div>
              ))}
              {todayEvts.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                   <Clock size={32} style={{ opacity: 0.1, margin: '0 auto 12px' }} />
                   <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Sem eventos para hoje.</p>
                </div>
              )}
            </div>
          </div>

          <div className="card" style={{ padding: 28, borderLeft: '4px solid var(--warning)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
               ⚠️ Tarefas Atrasadas
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
               {overdueTasks.map(t => (
                 <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{t.title}</div>
                    <div className="badge badge-warning">{t.assignee}</div>
                 </div>
               ))}
               {overdueTasks.length === 0 && (
                 <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--success)' }}>
                    <CheckCircle size={18} />
                    <span style={{ fontSize: 13, fontWeight: 700 }}>Tudo em dia!</span>
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
