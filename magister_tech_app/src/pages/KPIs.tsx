import { useState, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, BarChart2, PieChart, Zap, Cpu,
  Users, FileText, Target, Activity, ArrowUpRight, ArrowDownRight,
  ShieldCheck, Globe, Server, GitBranch, CheckCircle, AlertTriangle,
  ChevronDown, ChevronUp, Briefcase, Clock, Award,
  RefreshCw, Database, Wifi, Code2, Box, Plus, X
} from 'lucide-react';
import { useData } from '../contexts/DataContext';

const fmt = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
const pct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;
const num = (n: number) => new Intl.NumberFormat('pt-BR').format(n);

// ─── Alíquota Simples Nacional (estimativa conservadora) ─────────────────────
const ALIQUOTA_SIMPLES = 0.06;         // 6% Simples Nacional (Anexo III)
const ALIQUOTA_ISS     = 0.02;         // 2% ISS médio
const ALIQUOTA_COFINS  = 0.03;         // 3% COFINS estimado
const ALIQUOTA_PIS     = 0.0065;       // 0,65% PIS estimado

type TabId = 'visaogeral' | 'lucros' | 'mercado' | 'impostos' | 'processos' | 'tecnologia';

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  color?: string;
  icon?: React.ReactNode;
  trend?: number;
  glow?: boolean;
}

function KpiCard({ label, value, sub, color = 'var(--primary)', icon, trend, glow }: KpiCardProps) {
  return (
    <div
      className="card"
      style={{
        padding: 24,
        borderTop: `3px solid ${color}`,
        position: 'relative',
        overflow: 'hidden',
        background: glow ? `color-mix(in srgb, ${color} 6%, var(--bg-card))` : 'var(--bg-card)',
      }}
    >
      {glow && (
        <div style={{
          position: 'absolute', right: -30, top: -30,
          width: 120, height: 120, borderRadius: '50%',
          background: color, filter: 'blur(60px)', opacity: 0.18,
        }} />
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
          {label}
        </p>
        {icon && <div style={{ color, opacity: 0.8 }}>{icon}</div>}
      </div>
      <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: -1, color: 'var(--text-main)', margin: 0, lineHeight: 1 }}>
        {value}
      </h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
        {trend !== undefined && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 11, fontWeight: 800,
            color: trend >= 0 ? 'var(--success)' : 'var(--danger)',
            background: trend >= 0 ? 'var(--success-glow)' : 'var(--danger-glow)',
            padding: '2px 6px', borderRadius: 20,
          }}>
            {trend >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
            {pct(trend)}
          </span>
        )}
        {sub && <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>{sub}</p>}
      </div>
    </div>
  );
}

interface ProgressRowProps {
  label: string;
  value: number;
  max: number;
  color?: string;
  suffix?: string;
}

function ProgressRow({ label, value, max, color = 'var(--primary)', suffix = '' }: ProgressRowProps) {
  const pctVal = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-sec)' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 900, color }}>{typeof value === 'number' && suffix === 'R$' ? fmt(value) : `${num(value)}${suffix}`}</span>
      </div>
      <div className="progress-track" style={{ height: 6 }}>
        <div className="progress-fill" style={{ background: color, width: `${pctVal}%`, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

// Mocks removidos — dados provêm exclusivamente da API via Context.

export default function KPIs() {
  const { transactions, contracts, projects, clients, team, pipeline, kanban, techStack, processos, createTechService, createAgencyProcess } = useData();
  const [tab, setTab] = useState<TabId>('visaogeral');
  const [expandedProcess, setExpandedProcess] = useState<string | null>(null);
  const [periodoFiltro, setPeriodoFiltro] = useState<'mensal' | 'anual'>('mensal');
  const [modalTechOpen, setModalTechOpen] = useState(false);
  const [modalProcOpen, setModalProcOpen] = useState(false);

  // ─── MÉTRICAS FINANCEIRAS ─────────────────────────────────────────────────

  const receitaBruta = useMemo(() => {
    const base = transactions.filter(t => t.type === 'income').reduce((a, c) => a + c.amount, 0);
    return base;
  }, [transactions]);

  const despesasTotal = useMemo(() =>
    transactions.filter(t => t.type === 'expense').reduce((a, c) => a + c.amount, 0),
    [transactions]);

  const mrr = useMemo(() =>
    contracts.filter(c => c.status === 'ativo' && c.recurrence !== 'unico').reduce((a, c) => a + c.value, 0),
    [contracts]);

  const arr = mrr * 12;

  // ─── IMPOSTOS ─────────────────────────────────────────────────────────────
  const impostosSimples    = receitaBruta * ALIQUOTA_SIMPLES;
  const impostosISS        = receitaBruta * ALIQUOTA_ISS;
  const impostosCOFINS     = receitaBruta * ALIQUOTA_COFINS;
  const impostosPIS        = receitaBruta * ALIQUOTA_PIS;
  const totalImpostos      = impostosSimples + impostosISS + impostosCOFINS + impostosPIS;
  const aliquotaEfetiva    = receitaBruta > 0 ? (totalImpostos / receitaBruta) * 100 : 0;

  // ─── LUCRO ────────────────────────────────────────────────────────────────
  const lucroBruto         = receitaBruta - despesasTotal;
  const lucroLiquido       = lucroBruto - totalImpostos;
  const margemBruta        = receitaBruta > 0 ? (lucroBruto / receitaBruta) * 100 : 0;
  const margemLiquida      = receitaBruta > 0 ? (lucroLiquido / receitaBruta) * 100 : 0;

  // ─── MERCADO (Pipeline) ───────────────────────────────────────────────────
  const leadsTotal         = pipeline.flatMap(c => c.tasks).length;
  const contratosFechados  = pipeline.find(c => c.id === 'closed')?.tasks.length ?? 0;
  const valorPipelineTotal = pipeline.flatMap(c => c.tasks).reduce((a, t) => a + (t.value || 0), 0);
  const taxaConversao      = leadsTotal > 0 ? (contratosFechados / leadsTotal) * 100 : 0;
  const ticketMedio        = contratosFechados > 0 ? valorPipelineTotal / contratosFechados : mrr / Math.max(contracts.filter(c => c.status === 'ativo').length, 1);
  const clientesAtivos     = clients.filter(c => c.status === 'ativo').length;
  const clientesInativos   = clients.filter(c => c.status === 'inativo').length;
  const churnRate          = clients.length > 0 ? (clientesInativos / clients.length) * 100 : 0;
  const ltv                = ticketMedio * 12 * (1 / Math.max(churnRate / 100, 0.01));

  // ─── PROCESSOS ────────────────────────────────────────────────────────────
  const tarefasAbertas  = kanban.flatMap(c => c.tasks).filter(t => !t.isArchived).length;
  const tarefasConcluidas = kanban.find(c => c.id === 'done')?.tasks.length ?? 0;
  const projetosAtivos  = projects.filter(p => p.status === 'ativo').length;
  const projetosAtrasados = projects.filter(p => p.status === 'atrasado').length;

  // ─── TECNOLOGIA E PROCESSOS (REAIS BD) ────────────────────────────────────
  const custoTechTotal  = techStack.reduce((a, t) => a + t.custo_mes, 0);
  const uptimeMedio     = techStack.length > 0 ? (techStack.reduce((a, t) => a + t.uptime, 0) / techStack.length) : 0;

  const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'visaogeral',  label: 'Visão Geral',   icon: <BarChart2 size={14} /> },
    { id: 'lucros',      label: 'Lucros',         icon: <DollarSign size={14} /> },
    { id: 'mercado',     label: 'Mercado',        icon: <Globe size={14} /> },
    { id: 'impostos',    label: 'Impostos',       icon: <ShieldCheck size={14} /> },
    { id: 'processos',   label: 'Processos',      icon: <GitBranch size={14} /> },
    { id: 'tecnologia',  label: 'Tecnologia',     icon: <Cpu size={14} /> },
  ];

  const statusColor = (s: string) => {
    if (s === 'ok' || s === 'operacional') return 'var(--success)';
    if (s === 'atraso' || s === 'standby') return 'var(--warning)';
    if (s === 'critico') return 'var(--danger)';
    return 'var(--text-muted)';
  };

  return (
    <div className="animate-in" style={{ paddingBottom: 60 }}>

      {/* ─── HEADER ──────────────────────────────────────────────────────── */}
      <div className="page-header" style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px',
            background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 100,
            fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12,
            textTransform: 'uppercase', letterSpacing: '0.05em'
          }}>
            <Activity size={12} color="var(--primary)" /> Central de Performance
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text-main)', margin: 0, lineHeight: 1.1 }}>
            KPIs Estratégicos
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, margin: '6px 0 0 0' }}>
            Lucros · Mercado · Impostos · Processos · Tecnologia — visão unificada em tempo real
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{
            display: 'flex', background: 'var(--bg-subtle)', border: '1px solid var(--border)',
            borderRadius: 10, overflow: 'hidden', fontSize: 12, fontWeight: 700
          }}>
            {(['mensal', 'anual'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriodoFiltro(p)}
                style={{
                  padding: '8px 18px', border: 'none', cursor: 'pointer',
                  background: periodoFiltro === p ? 'var(--primary)' : 'transparent',
                  color: periodoFiltro === p ? '#fff' : 'var(--text-muted)',
                  fontWeight: 700, fontSize: 12, textTransform: 'capitalize',
                  transition: 'all 0.2s ease'
                }}
              >
                {p === 'mensal' ? 'Mensal' : 'Anual (×12)'}
              </button>
            ))}
          </div>
          <button className="btn btn-outline" style={{ fontSize: 12, gap: 6 }}>
            <RefreshCw size={14} /> Atualizar
          </button>
        </div>
      </div>

      {/* ─── TABS ─────────────────────────────────────────────────────────── */}
      <div className="tab-list" style={{ marginBottom: 28 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            className={`tab-btn ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ─── VISÃO GERAL ─────────────────────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {tab === 'visaogeral' && (
        <>
          {/* KPIs primários — 4 colunas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
            <KpiCard
              label="MRR Recorrente"
              value={fmt(periodoFiltro === 'anual' ? arr : mrr)}
              sub={periodoFiltro === 'anual' ? 'ARR (12 meses)' : 'Receita recorrente mensal'}
              color="var(--primary)" icon={<Briefcase size={20} />} glow
              trend={mrr > 0 ? 12.4 : 0}
            />
            <KpiCard
              label="Lucro Bruto"
              value={fmt(periodoFiltro === 'anual' ? lucroBruto * 12 : lucroBruto)}
              sub={`Margem: ${margemBruta.toFixed(1)}%`}
              color="var(--success)" icon={<TrendingUp size={20} />}
              trend={margemBruta - 60}
            />
            <KpiCard
              label="Lucro Líquido"
              value={fmt(periodoFiltro === 'anual' ? lucroLiquido * 12 : lucroLiquido)}
              sub={`Após impostos: ${fmt(totalImpostos)}`}
              color={lucroLiquido >= 0 ? 'var(--info)' : 'var(--danger)'}
              icon={<DollarSign size={20} />} glow
              trend={margemLiquida}
            />
            <KpiCard
              label="Total de Impostos"
              value={fmt(periodoFiltro === 'anual' ? totalImpostos * 12 : totalImpostos)}
              sub={`Alíquota efetiva: ${aliquotaEfetiva.toFixed(2)}%`}
              color="var(--warning)" icon={<ShieldCheck size={20} />}
              trend={-(aliquotaEfetiva)}
            />
          </div>

          {/* KPIs secundários — 4 colunas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
            <KpiCard label="Clientes Ativos" value={num(clientesAtivos)} sub={`${churnRate.toFixed(1)}% churn rate`} color="var(--purple)" icon={<Users size={18} />} trend={-churnRate} />
            <KpiCard label="Conversão Pipeline" value={`${taxaConversao.toFixed(1)}%`} sub={`${contratosFechados} de ${leadsTotal} leads`} color="var(--primary)" icon={<Target size={18} />} trend={taxaConversao - 20} />
            <KpiCard label="Tarefas em Aberto" value={num(tarefasAbertas)} sub={`${tarefasConcluidas} concluídas`} color="var(--warning)" icon={<Activity size={18} />} />
            <KpiCard label="Uptime Médio Tech" value={`${uptimeMedio.toFixed(2)}%`} sub={`Custo infra: ${fmt(custoTechTotal)}/mês`} color="var(--success)" icon={<Server size={18} />} trend={uptimeMedio - 99} />
          </div>

          {/* Painel de desempenho composto */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <PieChart size={16} color="var(--primary)" /> Composição da Receita Bruta
              </h3>
              <ProgressRow label="Contratos Recorrentes (MRR)" value={mrr} max={receitaBruta} color="var(--primary)" suffix="R$" />
              <ProgressRow label="Projetos Únicos" value={Math.max(receitaBruta - mrr, 0)} max={receitaBruta} color="var(--info)" suffix="R$" />
              <ProgressRow label="Despesas Operacionais" value={despesasTotal} max={receitaBruta} color="var(--danger)" suffix="R$" />
              <ProgressRow label="Carga Tributária" value={totalImpostos} max={receitaBruta} color="var(--warning)" suffix="R$" />
            </div>

            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp size={16} color="var(--success)" /> Projeção Anual (Base MRR)
              </h3>
              {[
                { label: 'Receita Bruta Anual (ARR)', value: fmt(arr), color: 'var(--primary)' },
                { label: 'Impostos Estimados (Ano)', value: fmt(totalImpostos * 12), color: 'var(--warning)' },
                { label: 'Despesas Fixas (Ano)', value: fmt(despesasTotal * 12), color: 'var(--danger)' },
                { label: 'Lucro Líquido Anual', value: fmt(lucroLiquido * 12), color: lucroLiquido >= 0 ? 'var(--success)' : 'var(--danger)' },
              ].map(row => (
                <div key={row.label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 0', borderBottom: '1px solid var(--border)'
                }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-sec)' }}>{row.label}</span>
                  <span style={{ fontWeight: 900, color: row.color, fontSize: 15 }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ─── LUCROS ──────────────────────────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {tab === 'lucros' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
            <KpiCard label="Receita Bruta" value={fmt(periodoFiltro === 'anual' ? receitaBruta * 12 : receitaBruta)} sub="Total lançamentos entrada" color="var(--primary)" icon={<ArrowUpRight size={20} />} glow trend={8.3} />
            <KpiCard label="Custo de Operação" value={fmt(periodoFiltro === 'anual' ? despesasTotal * 12 : despesasTotal)} sub="Todas as saídas registradas" color="var(--danger)" icon={<ArrowDownRight size={20} />} trend={-despesasTotal / Math.max(receitaBruta, 1) * 100} />
            <KpiCard label="Margem Bruta" value={`${margemBruta.toFixed(1)}%`} sub={`${fmt(lucroBruto)} de sobra antes de IR`} color={margemBruta >= 30 ? 'var(--success)' : 'var(--warning)'} icon={<TrendingUp size={20} />} trend={margemBruta - 40} glow />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
            <KpiCard label="Lucro Bruto" value={fmt(periodoFiltro === 'anual' ? lucroBruto * 12 : lucroBruto)} sub="Receita menos despesas operacionais" color="var(--success)" icon={<DollarSign size={20} />} />
            <KpiCard label="Impostos (-)" value={fmt(periodoFiltro === 'anual' ? totalImpostos * 12 : totalImpostos)} sub={`Carga: ${aliquotaEfetiva.toFixed(2)}% sobre bruto`} color="var(--warning)" icon={<ShieldCheck size={20} />} />
            <KpiCard label="Lucro Líquido Final" value={fmt(periodoFiltro === 'anual' ? lucroLiquido * 12 : lucroLiquido)} sub={`Margem líquida: ${margemLiquida.toFixed(1)}%`} color={lucroLiquido >= 0 ? 'var(--info)' : 'var(--danger)'} icon={<Award size={20} />} glow />
          </div>

          {/* DRE Simplificado */}
          <div className="card" style={{ padding: 32, marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={16} color="var(--primary)" /> DRE Gerencial — Demonstração do Resultado
              <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                Período: {periodoFiltro === 'mensal' ? 'Mensal' : 'Projeção Anual'}
              </span>
            </h3>
            {[
              { label: '(+) Receita Operacional Bruta', val: periodoFiltro === 'anual' ? receitaBruta * 12 : receitaBruta, color: 'var(--success)', bold: true },
              { label: '(-) Tributos sobre Receita', val: -(periodoFiltro === 'anual' ? totalImpostos * 12 : totalImpostos), color: 'var(--warning)', bold: false },
              { label: '(=) Receita Líquida', val: (periodoFiltro === 'anual' ? receitaBruta * 12 : receitaBruta) - (periodoFiltro === 'anual' ? totalImpostos * 12 : totalImpostos), color: 'var(--primary)', bold: true },
              { label: '(-) Custo dos Serviços (COGS)', val: -(periodoFiltro === 'anual' ? despesasTotal * 12 : despesasTotal), color: 'var(--danger)', bold: false },
              { label: '(=) Lucro Bruto', val: periodoFiltro === 'anual' ? lucroBruto * 12 : lucroBruto, color: 'var(--success)', bold: true },
              { label: '(-) Despesas Administrativas (inc. pessoal)', val: 0, color: 'var(--danger)', bold: false },
              { label: '(=) EBITDA Estimado', val: periodoFiltro === 'anual' ? lucroLiquido * 12 : lucroLiquido, color: lucroLiquido >= 0 ? 'var(--info)' : 'var(--danger)', bold: true },
            ].map((row, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 16px',
                background: row.bold ? 'var(--bg-subtle)' : 'transparent',
                borderRadius: row.bold ? 8 : 0,
                marginBottom: 4,
                borderBottom: '1px solid var(--border)',
              }}>
                <span style={{ fontSize: 14, fontWeight: row.bold ? 800 : 600, color: row.bold ? 'var(--text-main)' : 'var(--text-sec)' }}>
                  {row.label}
                </span>
                <span style={{ fontWeight: 900, fontSize: 15, color: row.color }}>
                  {fmt(row.val)}
                </span>
              </div>
            ))}
          </div>

          {/* Margens visuais */}
          <div className="card" style={{ padding: 28 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 20 }}>Mapa de Margens</h3>
            <ProgressRow label="Margem Bruta" value={margemBruta} max={100} color="var(--success)" suffix="%" />
            <ProgressRow label="Margem Líquida" value={margemLiquida} max={100} color="var(--info)" suffix="%" />
            <ProgressRow label="Carga Tributária (% da Receita)" value={aliquotaEfetiva} max={100} color="var(--warning)" suffix="%" />
            <ProgressRow label="Custo Operacional (% da Receita)" value={receitaBruta > 0 ? (despesasTotal / receitaBruta) * 100 : 0} max={100} color="var(--danger)" suffix="%" />
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ─── MERCADO ─────────────────────────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {tab === 'mercado' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
            <KpiCard label="Clientes Ativos" value={num(clientesAtivos)} sub={`${clients.length} total cadastrados`} color="var(--primary)" icon={<Users size={20} />} glow trend={clientesAtivos - clientesInativos} />
            <KpiCard label="Ticket Médio" value={fmt(ticketMedio)} sub="Por contrato ativo" color="var(--info)" icon={<DollarSign size={18} />} trend={5.2} />
            <KpiCard label="LTV Estimado" value={fmt(ltv)} sub="Valor vitalício do cliente" color="var(--success)" icon={<TrendingUp size={18} />} glow />
            <KpiCard label="Churn Rate" value={`${churnRate.toFixed(1)}%`} sub={`${clientesInativos} inativos`} color={churnRate > 10 ? 'var(--danger)' : 'var(--warning)'} icon={<TrendingDown size={18} />} trend={-churnRate} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
            <KpiCard label="Leads no Pipeline" value={num(leadsTotal)} sub="Total de oportunidades abertas" color="var(--purple)" icon={<Target size={18} />} />
            <KpiCard label="Taxa de Conversão" value={`${taxaConversao.toFixed(1)}%`} sub={`${contratosFechados} contratos fechados`} color={taxaConversao >= 20 ? 'var(--success)' : 'var(--warning)'} icon={<CheckCircle size={18} />} trend={taxaConversao - 20} />
            <KpiCard label="CAC (Estimado)" value={fmt(despesasTotal > 0 && contratosFechados > 0 ? despesasTotal / Math.max(contratosFechados, 1) : 0)} sub="Custo de Aquisição de Cliente" color="var(--warning)" icon={<Activity size={18} />} />
          </div>

          {/* Segmentação por Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Users size={16} color="var(--primary)" /> Distribuição de Clientes
              </h3>
              {[
                { label: 'Ativos', count: clientesAtivos, color: 'var(--success)' },
                { label: 'Inativos', count: clientesInativos, color: 'var(--danger)' },
                { label: 'Prospects', count: clients.filter(c => c.status === 'prospect').length, color: 'var(--warning)' },
              ].map(item => (
                <div key={item.label} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</span>
                    <span style={{ fontWeight: 800, color: item.color }}>{item.count}</span>
                  </div>
                  <div className="progress-track" style={{ height: 6 }}>
                    <div className="progress-fill" style={{
                      background: item.color,
                      width: `${clients.length > 0 ? (item.count / clients.length) * 100 : 0}%`,
                    }} />
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 20, padding: '12px 16px', background: 'var(--bg-subtle)', borderRadius: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>NRR estimado</span>
                  <span style={{ fontWeight: 900, color: churnRate < 5 ? 'var(--success)' : 'var(--warning)' }}>
                    {(100 - churnRate).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Target size={16} color="var(--purple)" /> Funil de Pipeline
              </h3>
              {pipeline.map(col => (
                <div key={col.id} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{col.title}</span>
                    <span style={{ fontWeight: 800, color: col.color || 'var(--primary)', fontSize: 13 }}>
                      {col.tasks.length} deals · {fmt(col.tasks.reduce((a, t) => a + (t.value || 0), 0))}
                    </span>
                  </div>
                  <div className="progress-track" style={{ height: 5 }}>
                    <div className="progress-fill" style={{
                      background: col.color || 'var(--primary)',
                      width: `${leadsTotal > 0 ? (col.tasks.length / leadsTotal) * 100 : 0}%`
                    }} />
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--bg-subtle)', borderRadius: 10, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Valor Total no Pipeline</span>
                <span style={{ fontWeight: 900, color: 'var(--primary)', fontSize: 15 }}>{fmt(valorPipelineTotal)}</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ─── IMPOSTOS ────────────────────────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {tab === 'impostos' && (
        <>
          {/* Banner alíquota */}
          <div className="card" style={{
            padding: 28, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 24,
            borderLeft: '4px solid var(--warning)', background: 'color-mix(in srgb, var(--warning) 5%, var(--bg-card))'
          }}>
            <ShieldCheck size={40} color="var(--warning)" />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Regime Tributário Estimado
              </p>
              <h2 style={{ fontSize: 26, fontWeight: 900, margin: '4px 0' }}>
                Simples Nacional — Prestação de Serviços (Estimativa)
              </h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                Cálculos baseados em alíquotas médias. Consulte seu contador para valores exatos. Alíquota efetiva atual: <strong>{aliquotaEfetiva.toFixed(2)}%</strong>
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Total estimado {periodoFiltro}</p>
              <h2 style={{ fontSize: 30, fontWeight: 900, color: 'var(--warning)', margin: 0 }}>
                {fmt(periodoFiltro === 'anual' ? totalImpostos * 12 : totalImpostos)}
              </h2>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            <KpiCard
              label="DAS / Simples Nacional"
              value={fmt(periodoFiltro === 'anual' ? impostosSimples * 12 : impostosSimples)}
              sub={`${(ALIQUOTA_SIMPLES * 100).toFixed(1)}% sobre receita bruta`}
              color="var(--warning)" icon={<ShieldCheck size={18} />}
            />
            <KpiCard
              label="ISS (Serviços)"
              value={fmt(periodoFiltro === 'anual' ? impostosISS * 12 : impostosISS)}
              sub={`${(ALIQUOTA_ISS * 100).toFixed(1)}% — Imposto Municipal`}
              color="var(--purple)" icon={<Globe size={18} />}
            />
            <KpiCard
              label="COFINS"
              value={fmt(periodoFiltro === 'anual' ? impostosCOFINS * 12 : impostosCOFINS)}
              sub={`${(ALIQUOTA_COFINS * 100).toFixed(1)}% — Federal`}
              color="var(--danger)" icon={<FileText size={18} />}
            />
            <KpiCard
              label="PIS"
              value={fmt(periodoFiltro === 'anual' ? impostosPIS * 12 : impostosPIS)}
              sub={`${(ALIQUOTA_PIS * 100).toFixed(1)}% — Federal`}
              color="var(--info)" icon={<FileText size={18} />}
            />
          </div>

          {/* Tabela detalhada */}
          <div className="card" style={{ overflow: 'hidden', marginBottom: 24 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Imposto / Contribuição</th>
                  <th>Base de Cálculo</th>
                  <th>Alíquota (Est.)</th>
                  <th style={{ textAlign: 'right' }}>Valor Mensal</th>
                  <th style={{ textAlign: 'right' }}>Valor Anual</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { nome: 'DAS — Simples Nacional (Anexo III)', aliq: ALIQUOTA_SIMPLES, val: impostosSimples },
                  { nome: 'ISS — Imposto Sobre Serviços (Municipal)', aliq: ALIQUOTA_ISS, val: impostosISS },
                  { nome: 'COFINS — Contrib. p/ Financ. da Seguridade', aliq: ALIQUOTA_COFINS, val: impostosCOFINS },
                  { nome: 'PIS — Prog. de Integração Social', aliq: ALIQUOTA_PIS, val: impostosPIS },
                ].map((imp, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 700 }}>{imp.nome}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{fmt(receitaBruta)}</td>
                    <td><span className="badge badge-warning">{(imp.aliq * 100).toFixed(2)}%</span></td>
                    <td style={{ textAlign: 'right', fontWeight: 900, color: 'var(--warning)' }}>{fmt(imp.val)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 900, color: 'var(--danger)' }}>{fmt(imp.val * 12)}</td>
                  </tr>
                ))}
                <tr style={{ background: 'var(--bg-subtle)', fontWeight: 900 }}>
                  <td><strong>TOTAL IMPOSTO ESTIMADO</strong></td>
                  <td></td>
                  <td><span className="badge badge-danger">{aliquotaEfetiva.toFixed(2)}%</span></td>
                  <td style={{ textAlign: 'right', color: 'var(--danger)', fontSize: 16 }}><strong>{fmt(totalImpostos)}</strong></td>
                  <td style={{ textAlign: 'right', color: 'var(--danger)', fontSize: 16 }}><strong>{fmt(totalImpostos * 12)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="card" style={{ padding: 24, borderLeft: '3px solid var(--info)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <AlertTriangle size={20} color="var(--info)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <p style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>Disclaimer Tributário</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
                  Os valores exibidos são <strong>estimativas gerenciais</strong> baseadas em alíquotas médias do Simples Nacional para prestação de serviços (Anexo III).
                  O cálculo real depende do faturamento acumulado nos 12 meses anteriores, atividade cadastrada no CNPJ e legislação municipal do ISS.
                  <strong> Sempre consulte um contador habilitado</strong> antes de tomar decisões fiscais.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ─── PROCESSOS ───────────────────────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {tab === 'processos' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            <KpiCard label="Projetos em Andamento" value={num(projetosAtivos)} sub="Status: ativo" color="var(--primary)" icon={<Briefcase size={18} />} />
            <KpiCard label="Projetos Atrasados" value={num(projetosAtrasados)} sub="Requer atenção" color={projetosAtrasados > 0 ? 'var(--danger)' : 'var(--success)'} icon={<AlertTriangle size={18} />} />
            <KpiCard label="Tarefas em Aberto" value={num(tarefasAbertas)} sub="Backlog + Em andamento" color="var(--warning)" icon={<Activity size={18} />} />
            <KpiCard label="Processos Mapeados" value={num(processos.length)} sub={`${processos.filter(p => p.status === 'ok').length} dentro do SLA`} color="var(--info)" icon={<GitBranch size={18} />} />
          </div>

          {/* Lista de Processos com SLA */}
          <div className="card" style={{ overflow: 'hidden', marginBottom: 24 }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>Mapeamento de Processos & SLA</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['ok', 'atraso', 'critico'].map(s => (
                    <span key={s} className={`badge badge-${s === 'ok' ? 'success' : s === 'atraso' ? 'warning' : 'danger'}`}>
                      {processos.filter(p => p.status === s).length} {s}
                    </span>
                  ))}
                </div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => setModalProcOpen(true)}><Plus size={14}/> Novo Processo</button>
            </div>
            {processos.map(proc => (
              <div key={proc.id}>
                <div
                  style={{
                    padding: '16px 24px', borderBottom: '1px solid var(--border)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 16,
                    background: expandedProcess === proc.id ? 'var(--bg-subtle)' : 'transparent',
                    transition: 'background 0.15s ease',
                  }}
                  onClick={() => setExpandedProcess(expandedProcess === proc.id ? null : proc.id)}
                >
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: statusColor(proc.status), flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>{proc.nome}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>Área: {proc.area} · Resp: {proc.responsavel}</p>
                  </div>
                  <div style={{ textAlign: 'center', minWidth: 80 }}>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>SLA</p>
                    <p style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>{proc.slaHoras}h</p>
                  </div>
                  <div style={{ textAlign: 'center', minWidth: 80 }}>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>Realizado</p>
                    <p style={{ fontSize: 14, fontWeight: 800, margin: 0, color: proc.realizado > proc.slaHoras ? 'var(--danger)' : 'var(--success)' }}>{proc.realizado}h</p>
                  </div>
                  <div style={{ textAlign: 'center', minWidth: 80 }}>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>Automação</p>
                    <p style={{ fontSize: 14, fontWeight: 800, margin: 0, color: 'var(--info)' }}>{proc.automacao}%</p>
                  </div>
                  <span className={`badge badge-${proc.status === 'ok' ? 'success' : proc.status === 'atraso' ? 'warning' : 'danger'}`} style={{ textTransform: 'capitalize' }}>
                    {proc.status}
                  </span>
                  {expandedProcess === proc.id ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                </div>

                {expandedProcess === proc.id && (
                  <div style={{ padding: '16px 24px 20px', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Performance vs SLA</p>
                        <div className="progress-track" style={{ height: 10, marginBottom: 8 }}>
                          <div className="progress-fill" style={{
                            background: proc.realizado > proc.slaHoras ? 'var(--danger)' : 'var(--success)',
                            width: `${Math.min((proc.realizado / proc.slaHoras) * 100, 100)}%`
                          }} />
                        </div>
                        <p style={{ fontSize: 12, color: proc.realizado > proc.slaHoras ? 'var(--danger)' : 'var(--success)', fontWeight: 700 }}>
                          {proc.realizado > proc.slaHoras ? `${proc.realizado - proc.slaHoras}h acima do SLA` : `${proc.slaHoras - proc.realizado}h dentro do prazo`}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Nível de Automação</p>
                        <div className="progress-track" style={{ height: 10, marginBottom: 8 }}>
                          <div className="progress-fill" style={{ background: 'var(--info)', width: `${proc.automacao}%` }} />
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--info)', fontWeight: 700 }}>
                          {proc.automacao < 50 ? 'Automação baixa — candidato a otimização' : proc.automacao >= 80 ? 'Processo altamente automatizado' : 'Automação parcial'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Métricas de projetos */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 16 }}>Status de Projetos</h3>
              {['ativo', 'atrasado', 'concluido', 'pausado'].map(status => {
                const count = projects.filter(p => p.status === status).length;
                return (
                  <ProgressRow
                    key={status}
                    label={status.charAt(0).toUpperCase() + status.slice(1)}
                    value={count} max={Math.max(projects.length, 1)}
                    color={status === 'ativo' ? 'var(--primary)' : status === 'atrasado' ? 'var(--danger)' : status === 'concluido' ? 'var(--success)' : 'var(--text-muted)'}
                    suffix=" proj."
                  />
                );
              })}
            </div>
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 16 }}>Eficiência da Equipe</h3>
              {team.slice(0, 5).map(member => (
                <ProgressRow
                  key={member.id}
                  label={member.name.split(' ')[0]}
                  value={member.performance}
                  max={10}
                  color="var(--primary)"
                  suffix="/10"
                />
              ))}
              {team.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>Nenhum membro cadastrado.</p>}
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ─── TECNOLOGIA ──────────────────────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {tab === 'tecnologia' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            <KpiCard label="Custo Infra/Mês" value={fmt(custoTechTotal)} sub={`${fmt(custoTechTotal * 12)}/ano projetado`} color="var(--primary)" icon={<Server size={18} />} glow />
            <KpiCard label="Uptime Médio" value={`${uptimeMedio.toFixed(2)}%`} sub="Média de todos os serviços" color={uptimeMedio >= 99.5 ? 'var(--success)' : 'var(--warning)'} icon={<Wifi size={18} />} trend={uptimeMedio - 99} />
            <KpiCard label="Serviços Ativos" value={num(techStack.filter(t => t.status === 'operacional').length)} sub={`de ${techStack.length} rastreados`} color="var(--success)" icon={<CheckCircle size={18} />} />
            <KpiCard label="Custo % da Receita" value={receitaBruta > 0 ? `${((custoTechTotal / receitaBruta) * 100).toFixed(1)}%` : '-'} sub="Eficiência de infraestrutura" color="var(--info)" icon={<PieChart size={18} />} />
          </div>

          {/* Stack de serviços */}
          <div className="card" style={{ overflow: 'hidden', marginBottom: 24 }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Cpu size={16} color="var(--primary)" /> Stack de Tecnologia & Status Operacional
              </h3>
              <button className="btn btn-primary btn-sm" onClick={() => setModalTechOpen(true)}><Plus size={14} /> Nova Ferramenta</button>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Serviço / Sistema</th>
                  <th>Categoria</th>
                  <th>Versão</th>
                  <th style={{ textAlign: 'center' }}>Uptime</th>
                  <th style={{ textAlign: 'right' }}>Custo/Mês</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {techStack.map((svc, i) => {
                  const catIcon: Record<string, React.ReactNode> = {
                    infra: <Server size={13} />,
                    dev: <Code2 size={13} />,
                    dados: <Database size={13} />,
                    integ: <Wifi size={13} />,
                    ia: <Zap size={13} />,
                  };
                  return (
                    <tr key={i}>
                      <td style={{ fontWeight: 700 }}>{svc.nome}</td>
                      <td>
                        <span className="badge badge-muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {catIcon[svc.tipo]} {svc.tipo}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{svc.versao}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          fontWeight: 800,
                          color: svc.uptime >= 99.5 ? 'var(--success)' : svc.uptime >= 99 ? 'var(--warning)' : 'var(--danger)' }}>
                          {svc.uptime.toFixed(2)}%
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>
                        {svc.custo_mes === 0 ? <span style={{ color: 'var(--success)' }}>Gratuito</span> : fmt(svc.custo_mes)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge badge-${svc.status === 'operacional' ? 'success' : 'warning'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor(svc.status), animation: svc.status === 'operacional' ? 'pulse 2s infinite' : 'none' }} />
                          {svc.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Análise de custo por categoria */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Box size={16} color="var(--primary)" /> Custo por Categoria
              </h3>
              {Object.entries(
                techStack.reduce((acc, svc) => {
                  acc[svc.tipo] = (acc[svc.tipo] || 0) + svc.custo_mes;
                  return acc;
                }, {} as Record<string, number>)
              ).map(([cat, val]) => (
                <ProgressRow
                  key={cat}
                  label={cat.toUpperCase()}
                  value={val}
                  max={custoTechTotal}
                  color={cat === 'infra' ? 'var(--primary)' : cat === 'ia' ? 'var(--purple)' : cat === 'dados' ? 'var(--info)' : 'var(--success)'}
                  suffix="R$"
                />
              ))}
            </div>

            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={16} color="var(--info)" /> Roadmap Técnico
              </h3>
              {[
                { item: 'Integração Mercado Pago / Stripe', status: 'planejado', prioridade: 'alta' },
                { item: 'Dashboard de relatórios IA (Gemini)', status: 'planejado', prioridade: 'media' },
                { item: 'App mobile (React Native)', status: 'backlog', prioridade: 'baixa' },
                { item: 'CI/CD automatizado (GitHub Actions)', status: 'em andamento', prioridade: 'alta' },
                { item: 'Multi-tenant (múltiplas agências)', status: 'backlog', prioridade: 'media' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{item.item}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span className={`badge badge-${item.prioridade === 'alta' ? 'danger' : item.prioridade === 'media' ? 'warning' : 'muted'}`}>{item.prioridade}</span>
                    <span className={`badge badge-${item.status === 'em andamento' ? 'success' : item.status === 'planejado' ? 'warning' : 'muted'}`}>{item.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* MODAL TECH */}
      {modalTechOpen && (
        <div className="modal-overlay" onClick={() => setModalTechOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <h2>Adicionar Ferramenta Tech</h2>
              <button className="btn-icon" onClick={() => setModalTechOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              await createTechService({
                nome: fd.get('nome') as string,
                tipo: fd.get('tipo') as string,
                versao: fd.get('versao') as string || '-',
                status: fd.get('status') as string,
                uptime: Number(fd.get('uptime')),
                custo_mes: Number(fd.get('custo_mes'))
              });
              setModalTechOpen(false);
            }}>
              <div className="modal-body" style={{ display: 'grid', gap: 16 }}>
                <div><label>Nome do Serviço</label><input required name="nome" className="input" placeholder="Ex: AWS S3" /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div><label>Categoria</label>
                    <select required name="tipo" className="input">
                      <option value="infra">Infraestrutura</option>
                      <option value="dev">Desenvolvimento</option>
                      <option value="dados">Dados/Armazenamento</option>
                      <option value="integ">Integração/API</option>
                      <option value="ia">Inteligência Artificial</option>
                    </select>
                  </div>
                  <div><label>Status Operacional</label>
                    <select required name="status" className="input">
                      <option value="operacional">Operacional (100%)</option>
                      <option value="standby">Em Standby / Pausado</option>
                      <option value="critico">Crítico / Fallback</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                  <div><label>Custo/Mês (R$)</label><input required type="number" step="0.01" name="custo_mes" className="input" placeholder="0.00" defaultValue="0" /></div>
                  <div><label>Uptime Esperado (%)</label><input required type="number" step="0.01" name="uptime" className="input" placeholder="99.9" defaultValue="99.9" /></div>
                  <div><label>Versão</label><input name="versao" className="input" placeholder="v2.0" /></div>
                </div>
              </div>
              <div className="modal-footer" style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" className="btn btn-outline" onClick={() => setModalTechOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar Ferramenta</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PROCESSO */}
      {modalProcOpen && (
        <div className="modal-overlay" onClick={() => setModalProcOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <h2>Mapear Novo Processo</h2>
              <button className="btn-icon" onClick={() => setModalProcOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              await createAgencyProcess({
                nome: fd.get('nome') as string,
                area: fd.get('area') as string,
                responsavel: fd.get('responsavel') as string,
                status: 'ok',
                slaHoras: Number(fd.get('slaHoras')),
                realizado: Number(fd.get('realizado')),
                automacao: Number(fd.get('automacao')),
              });
              setModalProcOpen(false);
            }}>
              <div className="modal-body" style={{ display: 'grid', gap: 16 }}>
                <div><label>Nome do Processo (POP)</label><input required name="nome" className="input" placeholder="Ex: Handover Criativo" /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div><label>Área</label><input required name="area" className="input" placeholder="Ex: Criação" /></div>
                  <div><label>Reponsável (Cargo/N1)</label><input required name="responsavel" className="input" placeholder="Ex: QA Lead" /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                  <div><label>SLA (Horas úteis)</label><input required type="number" name="slaHoras" className="input" defaultValue="24" /></div>
                  <div><label>Realizado (Média)</label><input required type="number" name="realizado" className="input" defaultValue="12" /></div>
                  <div><label>Automação (%)</label><input required type="number" name="automacao" className="input" defaultValue="0" max="100" /></div>
                </div>
              </div>
              <div className="modal-footer" style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" className="btn btn-outline" onClick={() => setModalProcOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Mapear Processo</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
