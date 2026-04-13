import { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle, Clock, FileText, Landmark,
  TrendingDown, TrendingUp, AlertTriangle, ArrowRight, Activity,
  Users, Briefcase, KanbanSquare, Target, PenTool, Wifi,
  DollarSign, BarChart2, MessageSquare, Zap, Shield
} from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { usePermission } from '../hooks/usePermission';
import { apiFetch } from '../lib/api';

const fmt = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);
  return (
    <span style={{ fontVariantNumeric: 'tabular-nums' }}>
      {now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  );
}

function KpiCard({ label, value, sub, trend, accent, glow, icon, onClick }: any) {
  return (
    <div
      className="card animate-scale-in"
      onClick={onClick}
      style={{
        padding: '20px 22px',
        borderLeft: `4px solid ${accent}`,
        position: 'relative', overflow: 'hidden', cursor: 'pointer',
        transition: 'transform 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-lg)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
    >
      <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, background: glow, borderRadius: '50%', filter: 'blur(50px)', opacity: 0.2 }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: glow, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.9 }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.5px', color: 'var(--text-main)', marginBottom: 4 }}>{value}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: trend === 'warn' ? 'var(--warning)' : trend === 'down' ? 'var(--danger)' : 'var(--success)' }}>
        {trend === 'up' && <TrendingUp size={11} />}
        {trend === 'down' && <TrendingDown size={11} />}
        {trend === 'warn' && <AlertTriangle size={11} />}
        <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{sub}</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const { canViewSensitiveData, role, sector } = usePermission();
  const nav = useNavigate();
  const {
    clients, projects, contracts, alerts, kanban, pipeline, content, team, logs,
    getMonthRevenue, getMonthExpense, getBalance, getPendingReceivables,
    getExpiringContracts, getInactiveClients, getTodayEvents, getOverdueTasks
  } = useData();

  const [waStatus, setWaStatus] = useState<string>('disconnected');

  useEffect(() => {
    apiFetch<any>('/api/whatsapp/status').then(d => setWaStatus(d.status)).catch(() => {});
  }, []);

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
  const doneTasks = kanban.find(c => c.id === 'done' || c.title === 'Entregue')?.tasks.length || 0;
  const inProgressTasks = kanban.find(c => c.id === 'doing' || c.title === 'Em Andamento')?.tasks.length || 0;
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const pipelineTotal = pipeline.reduce((a, c) => a + c.tasks.reduce((sa, t) => sa + (t.value || 0), 0), 0);
  const pipelineCount = pipeline.reduce((a, c) => a + c.tasks.length, 0);
  const approvalsPending = content.filter(p => p.status === 'revisao').length;
  const hasFinanceAccess = canViewSensitiveData();

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const recentActivity = logs?.slice(0, 6) || [];

  const kpis = hasFinanceAccess ? [
    {
      label: 'MRR — Receita Mensal', value: fmt(monthRevenue),
      trend: balance >= 0 ? 'up' : 'down',
      sub: balance >= 0 ? `Saldo: ${fmt(balance)}` : `Déficit: ${fmt(Math.abs(balance))}`,
      accent: 'var(--success)', glow: 'var(--success-glow)', icon: <DollarSign size={18} color="var(--success)" />, onClick: () => nav('/admin/financeiro')
    },
    {
      label: 'Saídas & Despesas', value: fmt(monthExpense),
      trend: 'down', sub: pending > 0 ? `A Receber: ${fmt(pending)}` : 'Liquidez OK',
      accent: 'var(--danger)', glow: 'var(--danger-glow)', icon: <TrendingDown size={18} color="var(--danger)" />, onClick: () => nav('/admin/financeiro')
    },
    {
      label: 'Base Ativa (Clientes)', value: activeClients,
      trend: inactive.length > 0 ? 'warn' : 'up',
      sub: inactive.length > 0 ? `${inactive.length} em risco de churn` : 'Base saudável',
      accent: 'var(--primary)', glow: 'var(--primary-glow)', icon: <Users size={18} color="var(--primary)" />, onClick: () => nav('/admin/crm')
    },
    {
      label: 'Contratos Vigentes', value: activeContracts,
      trend: expiring.length > 0 ? 'warn' : 'up',
      sub: expiring.length > 0 ? `${expiring.length} renovar em 30d` : 'MRR Estável',
      accent: 'var(--purple)', glow: 'var(--purple-glow)', icon: <FileText size={18} color="var(--purple)" />, onClick: () => nav('/admin/contratos')
    },
    {
      label: 'Pipeline Comercial', value: fmt(pipelineTotal),
      trend: pipelineCount > 0 ? 'up' : 'down',
      sub: `${pipelineCount} oportunidades em aberto`,
      accent: 'var(--warning)', glow: 'var(--warning-glow)', icon: <Target size={18} color="var(--warning)" />, onClick: () => nav('/admin/pipeline')
    },
    {
      label: 'Eficiência de Produção', value: `${completionRate}%`,
      trend: completionRate >= 70 ? 'up' : completionRate >= 40 ? 'warn' : 'down',
      sub: `${inProgressTasks} tarefas em andamento · ${doneTasks} entregues`,
      accent: 'var(--indigo)', glow: 'var(--indigo-glow)', icon: <BarChart2 size={18} color="var(--indigo)" />, onClick: () => nav('/admin/kanban')
    },
  ] : [
    {
      label: 'Projetos Ativos', value: projects.filter(p => p.status === 'ativo').length,
      trend: 'up', sub: 'Monitoramento em tempo real',
      accent: 'var(--primary)', glow: 'var(--primary-glow)', icon: <Briefcase size={18} color="var(--primary)" />, onClick: () => nav('/admin/projetos')
    },
    {
      label: 'Tarefas no Board', value: totalTasks,
      trend: 'up', sub: `${doneTasks} concluídas · ${completionRate}% eficiência`,
      accent: 'var(--success)', glow: 'var(--success-glow)', icon: <KanbanSquare size={18} color="var(--success)" />, onClick: () => nav('/admin/kanban')
    },
    {
      label: 'Aprovações Pendentes', value: approvalsPending,
      trend: approvalsPending > 0 ? 'warn' : 'up',
      sub: approvalsPending > 0 ? 'Revisão necessária' : 'Tudo aprovado',
      accent: 'var(--warning)', glow: 'var(--warning-glow)', icon: <PenTool size={18} color="var(--warning)" />, onClick: () => nav('/admin/conteudo')
    },
    {
      label: 'Time Conectado', value: team.length,
      trend: 'up', sub: 'Membros com acesso ao sistema',
      accent: 'var(--purple)', glow: 'var(--purple-glow)', icon: <Users size={18} color="var(--purple)" />, onClick: () => nav('/admin/equipe')
    },
  ];

  const waIcon = waStatus === 'connected' ? '🟢' : waStatus === 'connecting' ? '🟡' : '🔴';
  const waLabel = waStatus === 'connected' ? 'Conectado' : waStatus === 'connecting' ? 'Conectando...' : 'Desconectado';

  return (
    <div className="animate-in" style={{ paddingBottom: 48 }}>

      {/* Header — Cockpit */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* Avatar */}
          <div style={{
            width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
            background: user?.avatar ? `url(${user.avatar}) center/cover` : 'linear-gradient(135deg, var(--primary), #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(124,58,237,0.3)', border: '2px solid var(--border)',
          }}>
            {!user?.avatar && <span style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{user?.name?.substring(0, 2).toUpperCase()}</span>}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4 }}>
              {isAdmin ? '⚡ Visão 360° · Admin Master' : '💼 Cockpit Operacional'}
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.03em', margin: 0, lineHeight: 1.1 }}>
              {greeting()}, {user?.name?.split(' ')[0]}!
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              <span style={{ opacity: 0.4 }}>·</span>
              <LiveClock />
            </p>
          </div>
        </div>

        {/* Status Bar */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* WA Status */}
          <div
            onClick={() => nav('/admin/conectividade')}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12, fontWeight: 700 }}
          >
            <Wifi size={14} /> WhatsApp {waIcon} {waLabel}
          </div>
          {alerts.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'var(--danger-glow)', border: '1px solid var(--danger)', borderRadius: 10, fontSize: 12, fontWeight: 700, color: 'var(--danger)' }}>
              <AlertTriangle size={14} /> {alerts.length} Alerta(s)
            </div>
          )}
          <button className="btn btn-primary" onClick={() => nav('/admin/kanban')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Zap size={14} /> Produção
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
        {kpis.map((kpi, i) => <KpiCa      {/* Cockpit Grid */}
      {['CRIATIVO', 'CONTEÚDO', 'PRODUÇÃO'].includes(sector) ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24, marginBottom: 24 }}>
          {/* Creative / Content Cockpit */}
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 14, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 8 }}>
               <PenTool size={18} color="var(--primary)" /> Cockpit Criativo
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>Visão focada nas suas entregas, quadro Kanban e conteúdos aguardando aprovação.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
               <div className="card" style={{ padding: 16, background: 'var(--bg-subtle)' }} onClick={() => nav('/admin/kanban')}>
                  <h4 style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}><KanbanSquare size={14} style={{ display:'inline', marginRight: 6 }}/> Andamento do Board</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {kanban.slice(0, 4).map(col => (
                      <div key={col.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color, flexShrink: 0 }} />
                        <span style={{ flex: 1, fontSize: 12, fontWeight: 700 }}>{col.title}</span>
                        <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)' }}>{col.tasks.length}</span>
                      </div>
                    ))}
                  </div>
               </div>
               <div className="card" style={{ padding: 16, background: 'var(--bg-subtle)' }} onClick={() => nav('/admin/aprovacoes')}>
                  <h4 style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}><CheckCircle size={14} style={{ display:'inline', marginRight: 6 }}/> Aprovações de Clientes</h4>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0 0', borderTop: '1px solid var(--border)' }}>
                     <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Pendentes de revisão</span>
                     <span className="badge badge-warning" style={{ fontSize: 14 }}>{approvalsPending}</span>
                  </div>
               </div>
               <div className="card" style={{ padding: 16, background: 'var(--bg-subtle)' }} onClick={() => nav('/admin/conteudo')}>
                  <h4 style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}><Target size={14} style={{ display:'inline', marginRight: 6 }}/> Entregas em Atraso</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                     {overdueTasks.length === 0 ? <span style={{ fontSize: 12, color: 'var(--success)' }}>Tudo em dia! 🎉</span> : overdueTasks.slice(0,3).map((t,i) => <span key={i} style={{ fontSize: 12, color: 'var(--danger)' }}>• {t.title}</span>)}
                  </div>
               </div>
            </div>
          </div>
        </div>
      ) : sector === 'COMERCIAL' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 24, marginBottom: 24 }}>
          {/* Commercial Cockpit */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
             <div className="card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 14, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 8 }}>
                   <MessageSquare size={18} color="var(--success)" /> Funil de Leads & WhatsApp
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
                   <button className="btn btn-primary" onClick={() => nav('/admin/inbox')}><MessageSquare size={14} /> Inbox N1</button>
                   <button className="btn btn-secondary" onClick={() => nav('/admin/pipeline')}><Target size={14} /> Pipeline</button>
                   <button className="btn btn-secondary" onClick={() => nav('/admin/crm')}><Users size={14} /> CRM</button>
                   {hasFinanceAccess && <button className="btn btn-outline" onClick={() => nav('/admin/contratos')}><FileText size={14} /> Contratos</button>}
                </div>
                <div>
                   <h4 style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>Visão do Pipeline</h4>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                     {pipeline.map(col => col.tasks.length > 0 && (
                       <div key={col.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, background: 'var(--bg-subtle)' }}>
                         <div style={{ width: 10, height: 10, borderRadius: '50%', background: col.color, flexShrink: 0 }} />
                         <span style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>{col.title}</span>
                         <span className="badge" style={{ background: col.color + '22', color: col.color, fontSize: 12 }}>{col.tasks.length} Leads</span>
                         {hasFinanceAccess && <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-main)' }}>{fmt(col.tasks.reduce((sum, t) => sum + (t.value || 0), 0))}</span>}
                       </div>
                     ))}
                   </div>
                </div>
             </div>
          </div>
          <div>
            <div className="card" style={{ padding: 20, marginBottom: 20 }}>
               <h3 style={{ fontSize: 14, fontWeight: 900, marginBottom: 14 }}><Clock size={14} style={{ display: 'inline', marginRight: 6 }}/> Agenda e Follow-ups</h3>
               {todayEvts.length === 0 ? <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Nenhum followup hoje.</p> : todayEvts.map(ev => <div key={ev.id} style={{ fontSize: 12, marginBottom: 6 }}>• {ev.title}</div>)}
            </div>
          </div>
        </div>
      ) : sector === 'TECNOLOGIA' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, marginBottom: 24 }}>
          {/* Tech Cockpit */}
          <div className="card" style={{ padding: 24 }}>
             <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 14, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Wifi size={18} color="var(--indigo)" /> Tecnologia & Infraestrutura
             </h3>
             <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Monitoramento de serviços, logs de erro e chamados N1.</p>
             <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1, padding: 16, background: 'var(--bg-subtle)', borderRadius: 12 }}>
                   <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 4 }}>Uptime Hostinger VPS</p>
                   <p style={{ fontSize: 24, fontWeight: 900, color: 'var(--success)' }}>99.98%</p>
                </div>
                <div style={{ flex: 1, padding: 16, background: 'var(--bg-subtle)', borderRadius: 12 }}>
                   <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 4 }}>Conexão API WhatsApp</p>
                   <p style={{ fontSize: 24, fontWeight: 900, color: waStatus === 'connected' ? 'var(--success)' : 'var(--warning)' }}>{waStatus.toUpperCase()}</p>
                </div>
             </div>
          </div>
          <div className="card" style={{ padding: 24 }}>
             <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 14, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Shield size={18} color="var(--danger)" /> Chamados & Tickets
             </h3>
             <button className="btn btn-outline" style={{ display: 'block', width: '100%' }} onClick={() => nav('/admin/tickets')}>Central de Tickets N2</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 2fr)', gap: 24, marginBottom: 24 }}>
          {/* Admin/Default Master Cockpit */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Quick Actions */}
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 900, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>🚀 Acesso Rápido</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {[
                  { label: 'Pipeline', path: '/admin/pipeline', icon: Target, color: 'var(--primary)' },
                  { label: 'Financeiro', path: '/admin/financeiro', icon: Landmark, color: 'var(--success)' },
                  { label: 'Projetos', path: '/admin/projetos', icon: Briefcase, color: 'var(--purple)' },
                  { label: 'Conteúdo', path: '/admin/conteudo', icon: PenTool, color: 'var(--warning)' },
                  { label: 'CRM', path: '/admin/crm', icon: Users, color: 'var(--indigo)' },
                  { label: 'Kanban', path: '/admin/kanban', icon: KanbanSquare, color: 'var(--primary)' },
                  { label: 'WhatsApp', path: '/admin/conectividade', icon: MessageSquare, color: 'var(--success)' },
                  { label: 'Tickets', path: '/admin/tickets', icon: Shield, color: 'var(--danger)' },
                ].map(link => (
                  <div
                    key={link.label}
                    onClick={() => nav(link.path)}
                    style={{
                      padding: '14px 10px', borderRadius: 12, border: '1px solid var(--border)',
                      cursor: 'pointer', textAlign: 'center', transition: '0.15s',
                      background: 'var(--bg-subtle)',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = link.color; (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.background = 'var(--bg-subtle)'; }}
                  >
                    <link.icon size={20} color={link.color} style={{ marginBottom: 6 }} />
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-main)' }}>{link.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Projects */}
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Briefcase size={16} color="var(--primary)" /> Projetos Ativos
                </h3>
                <button className="btn-icon" onClick={() => nav('/admin/projetos')}><ArrowRight size={16} /></button>
              </div>
              {projects.filter(p => p.status === 'ativo').length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '16px 0' }}>Nenhum projeto ativo.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {projects.filter(p => p.status === 'ativo').slice(0, 6).map(p => {
                    const client = clients.find(c => c.id === p.clientId);
                    return (
                      <div
                        key={p.id} onClick={() => nav('/admin/projetos')}
                        style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--bg-subtle)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
                      >
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 800, marginBottom: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{client?.company || 'Cliente não vinculado'}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          <div style={{ width: 60, height: 4, background: 'var(--border)', borderRadius: 99 }}>
                            <div style={{ width: `${p.progress}%`, height: '100%', background: p.progress >= 75 ? 'var(--success)' : p.progress >= 40 ? 'var(--warning)' : 'var(--primary)', borderRadius: 99 }} />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 900, minWidth: 30, textAlign: 'right' }}>{p.progress}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Pipeline Snapshot */}
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Target size={16} color="var(--warning)" /> Pipeline Comercial
                </h3>
                <button className="btn-icon" onClick={() => nav('/admin/pipeline')}><ArrowRight size={16} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {pipeline.map(col => col.tasks.length > 0 && (
                  <div key={col.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, background: 'var(--bg-subtle)' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: col.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>{col.title}</span>
                    <span className="badge" style={{ background: col.color + '22', color: col.color, fontSize: 11 }}>{col.tasks.length}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
                      {fmt(col.tasks.reduce((sum, t) => sum + (t.value || 0), 0))}
                    </span>
                  </div>
                ))}
                {pipelineCount === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '8px 0' }}>Nenhum lead ativo.</p>}
              </div>
            </div>
          </div>

          {/* Right Area */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Today's Agenda */}
            <div className="card" style={{ padding: 22 }}>
              <h3 style={{ fontSize: 14, fontWeight: 900, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={15} color="var(--primary)" /> Agenda de Hoje
              </h3>
              {todayEvts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-muted)' }}>
                  <Clock size={24} style={{ opacity: 0.15, margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 12 }}>Nenhum evento hoje.</p>
                  <button className="btn btn-ghost btn-sm" style={{ marginTop: 8, fontSize: 11 }} onClick={() => nav('/admin/agenda')}>Criar evento</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {todayEvts.slice(0, 5).map(ev => (
                    <div key={ev.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                      <div style={{ width: 12, height: 12, borderRadius: 3, background: ev.color || 'var(--primary)', marginTop: 3, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{ev.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ev.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Overdue Tasks */}
            <div className="card" style={{ padding: 22, borderTop: `3px solid var(--warning)` }}>
              <h3 style={{ fontSize: 14, fontWeight: 900, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={15} color="var(--warning)" /> Tarefas Atrasadas
              </h3>
              {overdueTasks.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--success)' }}>
                  <CheckCircle size={15} />
                  <span style={{ fontSize: 13, fontWeight: 700 }}>Tudo em dia! 🎉</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {overdueTasks.slice(0, 5).map(t => (
                    <div key={t.id} style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                      <div className="badge" style={{ background: 'var(--danger-glow)', color: 'var(--danger)', fontSize: 10, flexShrink: 0 }}>{t.assignee}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Kanban Overview */}
            <div className="card" style={{ padding: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ fontSize: 14, fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <KanbanSquare size={15} color="var(--success)" /> Status do Board
                </h3>
                <button className="btn-icon" onClick={() => nav('/admin/kanban')}><ArrowRight size={14} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {kanban.slice(0, 5).map(col => (
                  <div key={col.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: col.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 12, fontWeight: 700 }}>{col.title}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 48, height: 4, background: 'var(--border)', borderRadius: 99 }}>
                        <div style={{ width: totalTasks > 0 ? `${(col.tasks.length / totalTasks) * 100}%` : '0%', height: '100%', background: col.color, borderRadius: 99 }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', minWidth: 16, textAlign: 'right' }}>{col.tasks.length}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            {isAdmin && recentActivity.length > 0 && (
              <div className="card" style={{ padding: 22 }}>
                <h3 style={{ fontSize: 14, fontWeight: 900, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Activity size={15} color="var(--indigo)" /> Atividade Recente
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {recentActivity.map((log: any) => (
                    <div key={log.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)', marginTop: 5, flexShrink: 0 }} />
                      <div>
                        <span style={{ fontSize: 12, fontWeight: 700 }}>{log.userName || '—'}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}> · {log.action?.replace(/_/g, ' ')}</span>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                          {new Date(log.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
