import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle, Clock, FileText, Landmark,
  TrendingDown, TrendingUp, AlertTriangle, ArrowRight, Activity, Bell,
  Users, Briefcase, KanbanSquare, Target, PenTool, Wifi, DollarSign
} from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { usePermission } from '../hooks/usePermission';

const fmt = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const { canViewSensitiveData, role } = usePermission();
  const nav = useNavigate();
  const {
    clients, projects, contracts, alerts, kanban, pipeline, content, team,
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
  const isAdmin = ['ADMIN', 'CEO'].includes(role);

  const activeClients = clients.filter(c => c.status === 'ativo').length;
  const activeContracts = contracts.filter(c => c.status === 'ativo').length;
  const totalTasks = kanban.flatMap(c => c.tasks).length;
  const completedTasks = kanban.find(c => c.id === 'done')?.tasks.length || 0;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const pipelineTotal = pipeline.reduce((a, c) => a + c.tasks.reduce((sa, t) => sa + (t.value || 0), 0), 0);
  const approvalsPending = content.filter(p => p.status === 'revisao').length;
  const hasFinanceAccess = canViewSensitiveData();

  const kpis = hasFinanceAccess ? [
    {
      label: 'Receita Operacional', value: fmt(monthRevenue),
      trend: balance >= 0 ? 'up' : 'down',
      sub: balance >= 0 ? `+ Saldo ${fmt(balance)}` : `- Déficit ${fmt(Math.abs(balance))}`,
      accent: 'var(--success)', glow: 'var(--success-glow)', icon: <DollarSign size={20} color="var(--success)" />, onClick: () => nav('/admin/financeiro')
    },
    {
      label: 'Saídas / Despesas', value: fmt(monthExpense),
      trend: 'down', sub: pending > 0 ? `Receber: ${fmt(pending)}` : 'Liquidez OK',
      accent: 'var(--danger)', glow: 'var(--danger-glow)', icon: <TrendingDown size={20} color="var(--danger)" />, onClick: () => nav('/admin/financeiro')
    },
    {
      label: 'Base Ativa (Clientes)', value: activeClients,
      trend: inactive.length > 0 ? 'warn' : 'up',
      sub: inactive.length > 0 ? `${inactive.length} em risco (Churn)` : 'Base Saudável',
      accent: 'var(--primary)', glow: 'var(--primary-glow)', icon: <Users size={20} color="var(--primary)" />, onClick: () => nav('/admin/crm')
    },
    {
      label: 'Volume Contratos', value: activeContracts,
      trend: expiring.length > 0 ? 'warn' : 'up',
      sub: expiring.length > 0 ? `${expiring.length} renovar em 30d` : 'MRR Assegurado',
      accent: 'var(--purple)', glow: 'var(--purple-glow)', icon: <FileText size={20} color="var(--purple)" />, onClick: () => nav('/admin/contratos')
    },
    {
      label: 'Pipeline Comercial', value: fmt(pipelineTotal),
      trend: pipelineTotal > 0 ? 'up' : 'down',
      sub: `${pipeline.reduce((a, c) => a + c.tasks.length, 0)} oportunidades ativas`,
      accent: 'var(--warning)', glow: 'var(--warning-glow)', icon: <Target size={20} color="var(--warning)" />, onClick: () => nav('/admin/pipeline')
    },
    {
      label: 'Aprovações Pendentes', value: approvalsPending,
      trend: approvalsPending > 0 ? 'warn' : 'up',
      sub: approvalsPending > 0 ? 'Conteúdos aguardando revisão' : 'Tudo aprovado',
      accent: 'var(--indigo)', glow: 'var(--indigo-glow)', icon: <PenTool size={20} color="var(--indigo)" />, onClick: () => nav('/admin/conteudo')
    },
  ] : [
    {
      label: 'Projetos Ativos', value: projects.filter(p => p.status === 'ativo').length,
      trend: 'up', sub: 'Monitoramento em tempo real',
      accent: 'var(--primary)', glow: 'var(--primary-glow)', icon: <Briefcase size={20} color="var(--primary)" />, onClick: () => nav('/admin/projetos')
    },
    {
      label: 'Tarefas no Board', value: totalTasks,
      trend: 'up', sub: `${completedTasks} concluídas · ${completionRate}% eficiência`,
      accent: 'var(--success)', glow: 'var(--success-glow)', icon: <KanbanSquare size={20} color="var(--success)" />, onClick: () => nav('/admin/kanban')
    },
    {
      label: 'Aprovações Pendentes', value: approvalsPending,
      trend: approvalsPending > 0 ? 'warn' : 'up',
      sub: approvalsPending > 0 ? 'Revisão necessária' : 'Tudo em dia',
      accent: 'var(--warning)', glow: 'var(--warning-glow)', icon: <PenTool size={20} color="var(--warning)" />, onClick: () => nav('/admin/conteudo')
    },
    {
      label: 'Membros Ativos', value: team.length,
      trend: 'up', sub: 'Time conectado ao sistema',
      accent: 'var(--purple)', glow: 'var(--purple-glow)', icon: <Users size={20} color="var(--purple)" />, onClick: () => nav('/admin/equipe')
    },
  ];

  return (
    <div className="animate-in" style={{ paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 100, fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Activity size={12} color="var(--primary)" /> {isAdmin ? 'VISÃO 360° · ADMIN MASTER' : 'COCKPIT OPERACIONAL'}
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-main)', margin: 0, lineHeight: 1.1 }}>
            Cockpit {isAdmin ? 'Estratégico' : ''} · {user?.name?.split(' ')[0] || ''}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8 }}>
            Magister Tech ERP · {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {isAdmin && <button className="btn btn-secondary" onClick={() => nav('/admin/conectividade')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Wifi size={14} /> WhatsApp</button>}
          <button className="btn btn-secondary" onClick={() => nav('/admin/pipeline')}>Comercial</button>
          <button className="btn btn-primary" onClick={() => nav('/admin/kanban')}>Produção</button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div style={{ padding: '16px 20px', background: 'var(--danger-glow)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--danger)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => nav('/admin/kanban')}>Ver Tudo</button>
        </div>
      )}

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 32 }}>
        {kpis.map((kpi, i) => (
          <div key={i} className="card animate-scale-in" onClick={kpi.onClick} style={{ padding: '22px 24px', borderBottom: `4px solid ${kpi.accent}`, position: 'relative', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-lg)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}>
            <div style={{ position: 'absolute', top: -10, right: -10, width: 80, height: 80, background: kpi.glow, borderRadius: '50%', filter: 'blur(40px)', opacity: 0.15 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{kpi.label}</span>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: kpi.glow, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {kpi.icon}
              </div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-1px', color: 'var(--text-main)', marginBottom: 6 }}>{kpi.value}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: kpi.trend === 'warn' ? 'var(--warning)' : kpi.trend === 'down' ? 'var(--danger)' : 'var(--text-muted)' }}>
              {kpi.trend === 'up' && <TrendingUp size={12} color="var(--success)" />}
              {kpi.trend === 'down' && <TrendingDown size={12} color="var(--danger)" />}
              {kpi.trend === 'warn' && <AlertTriangle size={12} color="var(--warning)" />}
              {kpi.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Secondary Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 28 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {/* Quick channels */}
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 900, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>🚀 Canais Críticos</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {[
                { label: 'Pipeline Comercial', path: '/admin/pipeline', icon: <Target size={18} />, color: 'var(--primary)' },
                { label: 'Fluxo de Caixa', path: '/admin/financeiro', icon: <Landmark size={18} />, color: 'var(--success)' },
                { label: 'Gestão de Projetos', path: '/admin/projetos', icon: <FileText size={18} />, color: 'var(--purple)' },
              ].map(link => (
                <div key={link.label} className="card-subtle" onClick={() => nav(link.path)} style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10, cursor: 'pointer' }}>
                  <div style={{ color: link.color }}>{link.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 800 }}>{link.label}</div>
                  <ArrowRight size={13} style={{ color: 'var(--text-muted)' }} />
                </div>
              ))}
            </div>
          </div>

          {/* Projects */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ fontSize: 15, fontWeight: 900 }}>📊 Projetos Ativos</h3>
              <button className="btn-icon" onClick={() => nav('/admin/projetos')}><ArrowRight size={16} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {projects.filter(p => p.status === 'ativo').slice(0, 5).map(p => (
                <div key={p.id} onClick={() => nav('/admin/projetos')} style={{ cursor: 'pointer', padding: '12px 14px', borderRadius: 10, background: 'var(--bg-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 800, marginBottom: 2 }}>{p.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{clients.find(c => c.id === p.clientId)?.company || '—'}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 60, height: 4, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ width: `${p.progress}%`, height: '100%', background: 'var(--primary)', borderRadius: 99 }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-main)', minWidth: 30 }}>{p.progress}%</span>
                  </div>
                </div>
              ))}
              {projects.filter(p => p.status === 'ativo').length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '16px 0' }}>Nenhum projeto ativo.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 900, marginBottom: 18 }}>📅 Agenda de Hoje</h3>
            {todayEvts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <Clock size={28} style={{ opacity: 0.15, margin: '0 auto 10px' }} />
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Sem eventos para hoje.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {todayEvts.map(ev => (
                  <div key={ev.id} style={{ display: 'flex', gap: 10, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: ev.color, marginTop: 4, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{ev.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ev.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 24, borderLeft: '4px solid var(--warning)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 900, marginBottom: 18 }}>⚠️ Tarefas Atrasadas</h3>
            {overdueTasks.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--success)' }}>
                <CheckCircle size={16} />
                <span style={{ fontSize: 13, fontWeight: 700 }}>Tudo em dia!</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {overdueTasks.slice(0, 5).map(t => (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                    <div className="badge" style={{ background: 'var(--danger-glow)', color: 'var(--danger)', fontSize: 10, marginLeft: 8 }}>{t.assignee}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
