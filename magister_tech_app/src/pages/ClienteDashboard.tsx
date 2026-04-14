import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { apiFetch } from '../lib/api';
import {
  LayoutDashboard, TrendingUp, Calendar, FileText, LogOut,
  Users, Zap, CheckCircle2, Clock, ArrowUpRight,
  MessageCircle, Image, RefreshCw, ChevronRight,
  Star, AlertCircle, Briefcase, BarChart2, KanbanSquare,
  HelpCircle, X, Send, DollarSign, Eye, MousePointer2,
  Activity, ChevronLeft, CheckCircle, Plus, Edit2, Paperclip
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface DashData {
  empresa: any;
  kpis: { totalLeads: number; novosLeads: number; tarefasPendentes: number; projetosAtivos: number; healthScore: number };
  projetos: any[];
  tarefas: any[];
  proximosEventos: any[];
  waLeads: any[];
  conteudos: any[];
}

// ── Constantes ────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',    label: 'Visão Geral',     icon: LayoutDashboard },
  { id: 'ads',         label: 'Campanhas Ads',   icon: BarChart2 },
  { id: 'calendario',  label: 'Calendário',      icon: Calendar },
  { id: 'kanban',      label: 'Minhas Tarefas',  icon: KanbanSquare },
  { id: 'relatorios',  label: 'Relatórios',      icon: FileText },
];

const STAGE_COLORS: Record<string, string> = {
  NOVO_LEAD: '#6366f1', CONTATO_FEITO: '#f59e0b',
  PROPOSTA: '#3b82f6', FECHADO: '#10b981', PERDIDO: '#ef4444',
};
const STAGE_LABELS: Record<string, string> = {
  NOVO_LEAD: 'Novo Lead', CONTATO_FEITO: 'Contato Feito',
  PROPOSTA: 'Proposta', FECHADO: 'Fechado', PERDIDO: 'Perdido',
};

const KANBAN_COLS = [
  { id: 'BACKLOG',       label: 'Backlog',       color: '#64748b' },
  { id: 'EM_ANDAMENTO',  label: 'Em Andamento',  color: '#3b82f6' },
  { id: 'REVISAO',       label: 'Revisão',        color: '#f59e0b' },
  { id: 'CONCLUIDO',     label: 'Concluído',      color: '#10b981' },
];

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt   = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
const num   = (n: number) => new Intl.NumberFormat('pt-BR').format(n);
const pct   = (n: number) => `${n.toFixed(2)}%`;

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isMobile;
}

// ── Mock Ads Data (realista) ──────────────────────────────────────────────────
function getMockAds(empresa?: string) {
  return {
    meta: {
      status: 'ATIVA',
      campanha: `${empresa || 'Sua Empresa'} — Geração de Leads`,
      spend: 1240.50,
      impressions: 84320,
      reach: 52100,
      clicks: 1873,
      ctr: 2.22,
      cpc: 0.66,
      messages: 94,
      otimizador: { nome: 'Equipe Magister Tech', avatar: 'MT', setor: 'Tráfego Pago' },
      ultimaOtimizacao: '12/04/2026',
      periodo: 'Acumulado desde 01/04/2026',
    },
    google: {
      status: 'ATIVA',
      campanha: `${empresa || 'Sua Empresa'} — Google Search`,
      spend: 680.00,
      impressions: 22400,
      reach: 18900,
      clicks: 890,
      ctr: 3.97,
      cpc: 0.76,
      conversions: 38,
      otimizador: { nome: 'Equipe Magister Tech', avatar: 'MT', setor: 'Tráfego Pago' },
      ultimaOtimizacao: '11/04/2026',
      periodo: 'Acumulado desde 01/04/2026',
    }
  };
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function KpiCard({ label, value, icon: Icon, color, glow }: any) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16, padding: '20px 22px', position: 'relative', overflow: 'hidden',
      transition: 'transform 0.18s, box-shadow 0.18s',
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 40px ${glow}`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
    >
      <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, background: glow, filter: 'blur(22px)', borderRadius: '50%' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(148,163,184,0.7)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>{label}</p>
          <p style={{ fontSize: 32, fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.03em' }}>{value}</p>
        </div>
        <div style={{ width: 42, height: 42, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: glow, border: `1px solid ${color}30` }}>
          <Icon size={19} color={color} />
        </div>
      </div>
    </div>
  );
}

function AdsCard({ platform, data, logo }: { platform: 'Meta' | 'Google'; data: any; logo: string }) {
  const isMobile = useIsMobile();
  const isActive = data.status === 'ATIVA';
  const platColor = platform === 'Meta' ? '#1877f2' : '#ea4335';
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 18, overflow: 'hidden', flex: 1,
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: `linear-gradient(135deg, ${platColor}12, transparent)`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderTop: `3px solid ${platColor}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, background: `${platColor}20`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 900, color: platColor
          }}>{logo}</div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 800, color: '#f8fafc' }}>{platform} Ads</p>
            <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.6)', marginTop: 1 }}>{data.campanha}</p>
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
          background: isActive ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
          color: isActive ? '#10b981' : '#ef4444',
          border: `1px solid ${isActive ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: isActive ? '#10b981' : '#ef4444', display: 'inline-block', animation: isActive ? 'pulse 2s infinite' : 'none' }} />
          {isActive ? 'ATIVA' : 'PAUSADA'}
        </div>
      </div>

      <div style={{ padding: '20px' }}>
        {/* KPI Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isMobile ? 2 : 3},1fr)`, gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Investido', value: fmt(data.spend), icon: DollarSign, color: '#f59e0b' },
            { label: 'Impressões', value: num(data.impressions), icon: Eye, color: '#3b82f6' },
            { label: 'Cliques', value: num(data.clicks), icon: MousePointer2, color: '#06b6d4' },
            { label: 'CTR', value: pct(data.ctr), icon: TrendingUp, color: data.ctr >= 2 ? '#10b981' : '#f59e0b' },
            { label: 'CPC', value: fmt(data.cpc), icon: DollarSign, color: data.cpc <= 1.0 ? '#10b981' : '#ef4444' },
            { label: platform === 'Meta' ? 'Conversas' : 'Conversões', value: num(platform === 'Meta' ? data.messages : data.conversions), icon: MessageCircle, color: '#10b981' },
          ].map(k => (
            <div key={k.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '12px 14px' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(148,163,184,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{k.label}</p>
              <p style={{ fontSize: 18, fontWeight: 900, color: k.color }}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* CTR Bar */}
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(148,163,184,0.5)', textTransform: 'uppercase' }}>Eficiência CTR</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: data.ctr >= 2 ? '#10b981' : data.ctr >= 1.2 ? '#f59e0b' : '#ef4444' }}>
              {data.ctr >= 2 ? 'Excelente' : data.ctr >= 1.2 ? 'Bom' : 'Atenção'}
            </span>
          </div>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${Math.min((data.ctr / 3) * 100, 100)}%`, height: '100%', background: data.ctr >= 2 ? '#10b981' : data.ctr >= 1.2 ? '#f59e0b' : '#ef4444', borderRadius: 4, transition: 'width 1s ease' }} />
          </div>
        </div>

        {/* Otimizador */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
          background: 'rgba(99,102,241,0.08)', borderRadius: 10, border: '1px solid rgba(99,102,241,0.2)'
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #4f46e5, #2563eb)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 900, fontSize: 13
          }}>{data.otimizador.avatar}</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#f8fafc' }}>{data.otimizador.nome}</p>
            <p style={{ fontSize: 10, color: 'rgba(148,163,184,0.6)', marginTop: 2 }}>
              {data.otimizador.setor} · Última otimização: {data.ultimaOtimizacao}
            </p>
          </div>
          <div style={{ padding: '4px 10px', background: 'rgba(99,102,241,0.15)', borderRadius: 20, fontSize: 10, fontWeight: 700, color: '#818cf8' }}>
            Responsável
          </div>
        </div>

        <p style={{ fontSize: 10, color: 'rgba(148,163,184,0.4)', marginTop: 12, textAlign: 'center' }}>
          {data.periodo}
        </p>
      </div>
    </div>
  );
}

function CalendarioPostagens({ conteudos }: { conteudos: any[] }) {
  const isMobile = useIsMobile();
  const hoje = new Date();
  const [mes, setMes] = useState<number>(hoje.getMonth());
  const [ano, setAno] = useState<number>(hoje.getFullYear());

  const primeiroDia = new Date(ano, mes, 1).getDay();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();

  const conteudosPorDia: Record<number, any[]> = {};
  conteudos.forEach(c => {
    if (!c.publishAt) return;
    const d = new Date(c.publishAt);
    if (d.getMonth() === mes && d.getFullYear() === ano) {
      const dia = d.getDate();
      if (!conteudosPorDia[dia]) conteudosPorDia[dia] = [];
      conteudosPorDia[dia].push(c);
    }
  });

  const platformColor: Record<string, string> = {
    instagram: '#e1306c', facebook: '#1877f2', youtube: '#ff0000',
    tiktok: '#010101', linkedin: '#0077b5', google: '#ea4335'
  };

  const handlePrev = () => {
    if (mes === 0) { setMes(11); setAno((a: number) => a - 1); } else setMes((m: number) => m - 1);
  };
  const handleNext = () => {
    if (mes === 11) { setMes(0); setAno((a: number) => a + 1); } else setMes((m: number) => m + 1);
  };

  return (
    <div>
      {/* Nav */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', gap: isMobile ? 12 : 0, marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.02em' }}>Calendário de Postagens</h2>
          <p style={{ fontSize: 13, color: 'rgba(148,163,184,0.6)', marginTop: 4 }}>Programação editorial da sua empresa</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'space-between' : 'flex-start' }}>
          <button onClick={handlePrev} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#f8fafc', minWidth: 130, textAlign: 'center' }}>
            {MESES[mes]} {ano}
          </span>
          <button onClick={handleNext} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Grid Header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
        {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'rgba(148,163,184,0.5)', padding: '8px 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d}</div>
        ))}
      </div>

      {/* Grid Cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {Array.from({ length: primeiroDia }).map((_, i) => (
          <div key={`blank-${i}`} style={{ minHeight: 90, borderRadius: 10, background: 'rgba(255,255,255,0.01)' }} />
        ))}
        {Array.from({ length: diasNoMes }, (_, i) => i + 1).map(dia => {
          const isHoje = dia === hoje.getDate() && mes === hoje.getMonth() && ano === hoje.getFullYear();
          const posts = conteudosPorDia[dia] || [];
          return (
            <div key={dia} style={{
              minHeight: 90, borderRadius: 10, padding: '8px', position: 'relative',
              background: isHoje ? 'rgba(99,102,241,0.12)' : posts.length > 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
              border: isHoje ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.05)',
              transition: 'background 0.15s',
            }}>
              <span style={{
                fontSize: 12, fontWeight: isHoje ? 900 : 600,
                color: isHoje ? '#818cf8' : 'rgba(148,163,184,0.7)',
                display: 'block', marginBottom: 6
              }}>{dia}</span>
              {posts.slice(0, 3).map((p: any, idx: number) => (
                <div key={idx} style={{
                  marginBottom: 3, padding: '2px 6px', borderRadius: 4,
                  background: `${platformColor[p.platform] || '#6366f1'}20`,
                  borderLeft: `2px solid ${platformColor[p.platform] || '#6366f1'}`,
                  display: 'flex', alignItems: 'center', gap: 4
                }}>
                  <span style={{ fontSize: isMobile ? 10 : 9, fontWeight: 700, color: platformColor[p.platform] || '#6366f1', textTransform: 'capitalize' }}>{isMobile ? p.platform.substring(0,3) : p.platform}</span>
                </div>
              ))}
              {posts.length > 3 && (
                <span style={{ fontSize: 9, color: 'rgba(148,163,184,0.4)', fontWeight: 600 }}>+{posts.length - 3}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legenda */}
      <div style={{ marginTop: 20, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {Object.entries(platformColor).map(([plat, cor]) => (
          <div key={plat} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: cor }} />
            <span style={{ fontSize: 11, color: 'rgba(148,163,184,0.6)', textTransform: 'capitalize', fontWeight: 600 }}>{plat}</span>
          </div>
        ))}
      </div>

      {/* Lista de posts do mês */}
      {Object.keys(conteudosPorDia).length > 0 && (
        <div style={{ marginTop: 28 }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: '#f8fafc', marginBottom: 14 }}>Publicações do Mês</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(conteudosPorDia).sort(([a], [b]) => Number(a) - Number(b)).flatMap(([dia, posts]) =>
              posts.map((p: any, idx: number) => (
                <div key={`${dia}-${idx}`} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10
                }}>
                  <div style={{ width: 38, height: 38, borderRadius: 8, background: `${platformColor[p.platform] || '#6366f1'}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Image size={16} color={platformColor[p.platform] || '#6366f1'} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>{p.title}</p>
                    <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.5)', marginTop: 2 }}>
                      {p.platform} · Dia {dia}/{MESES[mes]}
                    </p>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20,
                    background: p.status === 'APROVADO' ? 'rgba(16,185,129,0.15)' : p.status === 'AGUARDANDO_APROVACAO' ? 'rgba(245,158,11,0.15)' : 'rgba(99,102,241,0.15)',
                    color: p.status === 'APROVADO' ? '#10b981' : p.status === 'AGUARDANDO_APROVACAO' ? '#f59e0b' : '#818cf8',
                  }}>
                    {p.status === 'AGUARDANDO_APROVACAO' ? 'Aguardando' : p.status === 'APROVADO' ? 'Aprovado' : p.status || 'Planejado'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {Object.keys(conteudosPorDia).length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(148,163,184,0.3)', marginTop: 20 }}>
          <Calendar size={48} style={{ marginBottom: 16 }} />
          <p style={{ fontSize: 15, fontWeight: 600 }}>Nenhuma postagem agendada para {MESES[mes]}/{ano}</p>
          <p style={{ fontSize: 13, marginTop: 8 }}>A equipe Magister irá programar publicações em breve.</p>
        </div>
      )}
    </div>
  );
}

function KanbanCliente({ tasks, columns, fetchTasks }: { tasks: any[], columns: any[], fetchTasks: () => void }) {
  const grouped: Record<string, any[]> = {};
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [form, setForm] = useState({ title: '', description: '', fileUrl: '' });
  const [saving, setSaving] = useState(false);

  // Consideramos coluna "Card Cliente" ou qualquer uma que contenha "cliente" no titulo
  const clientCol = columns.find(c => c.title?.toLowerCase().includes('cliente') || c.id === 'CARD_CLIENTE') || columns[0];

  columns.forEach(col => { grouped[col.id] = tasks.filter(t => t.status === col.id); });

  // tasks sem status mapeado caem na primeira coluna
  tasks.filter(t => !columns.find(c => c.id === t.status)).forEach(t => {
    const fallbackId = columns[0]?.id || 'BACKLOG';
    if (!grouped[fallbackId]) grouped[fallbackId] = [];
    grouped[fallbackId].push(t);
  });

  const priorityColor: Record<string, string> = { ALTA: '#ef4444', MEDIA: '#f59e0b', BAIXA: '#10b981' };

  const handleOpenNew = () => {
    setEditingTask(null);
    setForm({ title: '', description: '', fileUrl: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (task: any) => {
    setEditingTask(task);
    setForm({ title: task.title || '', description: task.description || '', fileUrl: task.fileUrl || '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if(!form.title.trim()) return;
    setSaving(true);
    try {
      if(editingTask) {
        await apiFetch(`/api/cliente/kanban/${editingTask.id}`, { method: 'PUT', body: JSON.stringify(form) });
      } else {
        await apiFetch('/api/cliente/kanban', { method: 'POST', body: JSON.stringify({ ...form, status: clientCol?.id }) });
      }
      setShowModal(false);
      fetchTasks();
    } catch(e) {
      alert("Houve um erro ao salvar o Card.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
           <h2 style={{ fontSize: 22, fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>Minhas Tarefas</h2>
           <p style={{ fontSize: 13, color: 'rgba(148,163,184,0.6)', marginTop: 4 }}>Acompanhe o andamento das demandas do seu projeto</p>
        </div>
        {clientCol && (
          <button className="btn btn-primary" onClick={handleOpenNew} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={16} /> Criar Novo Card
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16 }}>
        {columns.map(col => (
          <div key={col.id} style={{ minWidth: 260, width: 280, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, overflow: 'hidden', flexShrink: 0 }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', borderTop: `3px solid ${col.color || '#3b82f6'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#f8fafc' }}>{col.title || col.label}</span>
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: `${col.color || '#3b82f6'}25`, color: col.color || '#3b82f6', fontSize: 11, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {grouped[col.id]?.length || 0}
              </span>
            </div>
            
            <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8, minHeight: 120, maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}>
              {(grouped[col.id] || []).length === 0 ? (
                <p style={{ fontSize: 12, color: 'rgba(148,163,184,0.25)', textAlign: 'center', padding: '20px 0' }}>Vazio</p>
              ) : (grouped[col.id] || []).map((task: any) => (
                <div key={task.id} style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 10, padding: '12px 14px',
                  borderLeft: `3px solid ${priorityColor[task.priority] || '#6366f1'}`,
                  position: 'relative'
                }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', marginBottom: 8, lineHeight: 1.4 }}>{task.title}</p>
                  
                  {/* Se estiver na coluna do cliente, mostrar botão de Editar */}
                  {col.id === clientCol?.id && (
                    <button className="btn-icon" style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(255,255,255,0.1)', padding: 4, borderRadius: 6 }} onClick={() => handleOpenEdit(task)}>
                       <Edit2 size={12} color="#f8fafc" />
                    </button>
                  )}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                    {task.deadline && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={11} color="rgba(148,163,184,0.5)" />
                        <span style={{ fontSize: 10, color: 'rgba(148,163,184,0.5)', fontWeight: 600 }}>
                          {new Date(task.deadline).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    )}
                    {task.fileUrl && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} title="Contém Anexo">
                         <Paperclip size={11} color="rgba(148,163,184,0.5)" />
                      </div>
                    )}
                    {task.assignee && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: '#818cf8' }}>
                          {task.assignee.name?.[0] || '?'}
                        </div>
                        <span style={{ fontSize: 10, color: 'rgba(148,163,184,0.5)', fontWeight: 600 }}>{task.assignee.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {columns.length === 0 && (
          <div style={{ width: '100%', textAlign: 'center', padding: '40px 0', color: 'rgba(148,163,184,0.5)' }}>Nenhuma coluna configurada.</div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card modal animate-scale-in" style={{ width: 440, background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', padding: 32 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{editingTask ? 'Editar Card' : 'Novo Card'}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={18} color="#fff" /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="form-label" style={{ color: '#cbd5e1' }}>Título</label>
                <input className="input" style={{ width: '100%', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Do que você precisa?" />
              </div>
              
              <div>
                <label className="form-label" style={{ color: '#cbd5e1' }}>Detalhes Adicionais (opcional)</label>
                <textarea className="input" style={{ width: '100%', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', minHeight: 100 }} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Descreva tudo que achar relevante para a equipe..." />
              </div>

              <div>
                <label className="form-label" style={{ color: '#cbd5e1' }}>Link do Anexo (Google Drive, Imagem, etc)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Paperclip size={18} color="rgba(148,163,184,0.5)" />
                  <input className="input" style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }} value={form.fileUrl} onChange={e => setForm({...form, fileUrl: e.target.value})} placeholder="Cole a URL do arquivo" />
                </div>
              </div>

              <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} onClick={handleSave} disabled={saving || !form.title.trim()}>
                 {saving ? 'Aguarde...' : 'Salvar Card de Interação'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Ticket Modal ───────────────────────────────────────────────────────────────
function TicketModal({ onClose }: { onClose: () => void; empresa: any }) {
  const isMobile = useIsMobile();
  const [assunto, setAssunto]   = useState('');
  const [descricao, setDescricao] = useState('');
  const [prioridade, setPrioridade] = useState('MEDIA');
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assunto.trim() || !descricao.trim()) { setError('Preencha assunto e descrição.'); return; }
    setLoading(true); setError('');
    try {
      await apiFetch('/api/cliente/ticket', {
        method: 'POST',
        body: JSON.stringify({ subject: assunto, description: descricao, priority: prioridade }),
      });
      setSuccess(true);
    } catch (e: any) {
      setError(e.message || 'Erro ao abrir chamado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', pointerEvents: 'none' }}>
      {/* Overlay */}
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', pointerEvents: 'auto' }}
        onClick={onClose}
      />
      {/* Panel */}
      <div style={{
        position: 'relative', pointerEvents: 'auto',
        width: '100%', maxWidth: 440, margin: isMobile ? '0 16px 85px 16px' : '0 24px 108px 24px',
        background: 'linear-gradient(145deg, #13192e, #0f172a)',
        border: '1px solid rgba(99,102,241,0.3)',
        borderRadius: isMobile ? '20px 20px 0 0' : 20, overflow: 'hidden',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        animation: 'slideUp 0.25s ease',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(37,99,235,0.1))',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #4f46e5, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(79,70,229,0.4)' }}>
              <HelpCircle size={18} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 800, color: '#f8fafc' }}>Abrir Chamado</p>
              <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.6)' }}>Nossa equipe responde em até 2h</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
            <X size={16} />
          </button>
        </div>

        {success ? (
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CheckCircle size={28} color="#10b981" />
            </div>
            <p style={{ fontSize: 17, fontWeight: 800, color: '#f8fafc', marginBottom: 8 }}>Chamado aberto!</p>
            <p style={{ fontSize: 13, color: 'rgba(148,163,184,0.7)', lineHeight: 1.6 }}>
              Nossa equipe recebeu sua solicitação e entrará em contato em breve. Acompanhe pelo menu "Suporte" no site.
            </p>
            <button onClick={onClose} style={{ marginTop: 24, padding: '12px 32px', background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 10, color: '#818cf8', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              Fechar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {error && (
              <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                <AlertCircle size={14} color="#f87171" />
                <span style={{ fontSize: 12, color: '#f87171', fontWeight: 600 }}>{error}</span>
              </div>
            )}

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(148,163,184,0.7)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assunto</label>
              <input
                value={assunto} onChange={e => setAssunto(e.target.value)}
                placeholder="Ex: Problema com acesso ao painel..."
                maxLength={120}
                style={{
                  width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
                  color: '#f8fafc', fontSize: 13, outline: 'none', boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(148,163,184,0.7)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Descrição</label>
              <textarea
                value={descricao} onChange={e => setDescricao(e.target.value)}
                placeholder="Descreva em detalhes o que está acontecendo..."
                rows={4}
                style={{
                  width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
                  color: '#f8fafc', fontSize: 13, outline: 'none', resize: 'vertical',
                  boxSizing: 'border-box', fontFamily: 'inherit'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(148,163,184,0.7)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Prioridade</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['BAIXA', 'MEDIA', 'ALTA'].map(p => (
                  <button type="button" key={p} onClick={() => setPrioridade(p)} style={{
                    flex: 1, padding: '8px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    background: prioridade === p ? (p === 'ALTA' ? 'rgba(239,68,68,0.2)' : p === 'MEDIA' ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)') : 'rgba(255,255,255,0.04)',
                    color: prioridade === p ? (p === 'ALTA' ? '#f87171' : p === 'MEDIA' ? '#fbbf24' : '#34d399') : 'rgba(148,163,184,0.5)',
                    border: prioridade === p ? `1px solid ${p === 'ALTA' ? 'rgba(239,68,68,0.4)' : p === 'MEDIA' ? 'rgba(245,158,11,0.4)' : 'rgba(16,185,129,0.4)'}` : '1px solid rgba(255,255,255,0.06)',
                    transition: 'all 0.15s'
                  }}>{p === 'BAIXA' ? 'Baixa' : p === 'MEDIA' ? 'Média' : 'Alta'}</button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading} style={{
              padding: '13px', background: loading ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg, #4f46e5, #2563eb)',
              border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: loading ? 'none' : '0 4px 16px rgba(79,70,229,0.35)', transition: 'all 0.2s'
            }}>
              {loading ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
              {loading ? 'Enviando...' : 'Abrir Chamado'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function ClienteDashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [activeTab, setActiveTab]   = useState('overview');
  const [dashData, setDashData]     = useState<DashData | null>(null);
  const [_agenda, setAgenda]         = useState<any[]>([]);
  const [relatorios, setRelatorios] = useState<any>({ conteudos: [], projetos: [] });
  const [kanbanTasks, setKanbanTasks] = useState<any[]>([]);
  const [kanbanColumns, setKanbanColumns] = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ticketOpen, setTicketOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isMobile = useIsMobile();

  // Redirect se não for CLIENTE
  useEffect(() => {
    if (user && user.role !== 'CLIENTE') navigate('/admin/dashboard');
  }, [user, navigate]);

  const fetchDashboard = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const data = await apiFetch<DashData>('/api/cliente/dashboard');
      setDashData(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const fetchAgenda = async () => {
    try { const d = await apiFetch<any[]>('/api/cliente/agenda'); setAgenda(d); } catch { }
  };

  const fetchRelatorios = async () => {
    try { const d = await apiFetch<any>('/api/cliente/relatorios'); setRelatorios(d); } catch { }
  };

  const fetchKanban = async () => {
    try { 
      const [tasks, columns] = await Promise.all([
        apiFetch<any[]>('/api/cliente/kanban'),
        apiFetch<any[]>('/api/boards/columns')
      ]);
      // filter only kanban columns
      const kanbanCols = columns.filter((c: any) => c.boardType === 'KANBAN');
      setKanbanColumns(kanbanCols.length > 0 ? kanbanCols : KANBAN_COLS);
      setKanbanTasks(tasks); 
    } catch { }
  };

  useEffect(() => { fetchDashboard(); }, []);

  useEffect(() => {
    if (activeTab === 'agenda' || activeTab === 'calendario') fetchAgenda();
    if (activeTab === 'relatorios') fetchRelatorios();
    if (activeTab === 'kanban') fetchKanban();
  }, [activeTab]);

  const empresa = dashData?.empresa;
  const kpis    = dashData?.kpis;
  const ads     = getMockAds(empresa?.company);

  const companyInitials = empresa?.company
    ? empresa.company.substring(0, 2).toUpperCase()
    : user?.name?.substring(0, 2).toUpperCase() || 'MT';

  const avatarHue = companyInitials ? (companyInitials.charCodeAt(0) * 13) % 360 : 220;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0a0f1e 0%, #0f172a 60%, #0a0f1e 100%)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', border: '3px solid rgba(99,102,241,0.2)', borderTop: '3px solid #6366f1', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }} />
          <p style={{ color: 'rgba(148,163,184,0.7)', fontSize: 14, fontFamily: 'Inter, sans-serif' }}>Carregando seu painel...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #060b16 0%, #0a0f1e 60%, #060b16 100%)', fontFamily: "'Inter', 'Segoe UI', sans-serif", display: 'flex', flexDirection: 'column' }}>

      {/* ── HEADER ──────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(6,11,22,0.92)', backdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: isMobile ? '0 16px' : '0 24px', height: isMobile ? 60 : 68,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: isMobile ? 36 : 40, height: isMobile ? 36 : 40, borderRadius: 11,
            background: 'linear-gradient(135deg, #4f46e5, #2563eb)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(79,70,229,0.4)'
          }}>
            <Zap size={isMobile ? 17 : 19} color="#fff" />
          </div>
          {!isMobile && (
            <div>
              <p style={{ fontSize: 10, color: 'rgba(148,163,184,0.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Portal do Cliente · Magister Tech
              </p>
              <p style={{ fontSize: 15, fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.01em', marginTop: 1 }}>
                {empresa?.company || user?.name || 'Sua Empresa'}
              </p>
            </div>
          )}
          {isMobile && (
            <p style={{ fontSize: 15, fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.01em' }}>
              Portal do Cliente
            </p>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 10 }}>
          <button onClick={() => fetchDashboard(true)} style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8, padding: isMobile ? '7px' : '7px 12px', cursor: 'pointer', color: 'rgba(148,163,184,0.7)',
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600
          }}>
            <RefreshCw size={isMobile ? 16 : 13} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            {!isMobile && 'Atualizar'}
          </button>

          <a
            href={`https://wa.me/5541999999999?text=Olá, sou ${empresa?.company || 'cliente'} e preciso de suporte.`}
            target="_blank" rel="noreferrer"
            style={{
              background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.2)',
              borderRadius: 8, padding: isMobile ? '7px' : '7px 14px', color: '#25d366',
              display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, textDecoration: 'none'
            }}
          >
            <MessageCircle size={isMobile ? 16 : 14} />
            {!isMobile && 'WhatsApp'}
          </a>

          {!isMobile && (
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: `linear-gradient(135deg, hsl(${avatarHue},60%,45%), hsl(${avatarHue},60%,35%))`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 900, fontSize: 13, cursor: 'default',
              boxShadow: `0 4px 12px hsl(${avatarHue},60%,20%)`
            }}>
              {companyInitials}
            </div>
          )}

          <button onClick={logout} title="Sair" style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)',
            borderRadius: 8, padding: isMobile ? '7px' : '7px 12px', cursor: 'pointer', color: '#f87171',
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600
          }}>
            <LogOut size={isMobile ? 16 : 13} />
            {!isMobile && 'Sair'}
          </button>
        </div>
      </header>

      {/* ── BODY (sidebar + content) ─────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, flexDirection: isMobile ? 'column' : 'row', paddingBottom: isMobile ? 65 : 0 }}>

        {/* ── SIDEBAR ──────────────────────────────────────────── */}
        {!isMobile && (
          <aside style={{
            width: sidebarCollapsed ? 70 : 220,
            flexShrink: 0,
            background: 'rgba(6,11,22,0.8)',
            backdropFilter: 'blur(16px)',
            borderRight: '1px solid rgba(255,255,255,0.05)',
            padding: '20px 12px',
            transition: 'width 0.25s ease',
            display: 'flex', flexDirection: 'column',
            position: 'sticky', top: 68, height: 'calc(100vh - 68px)',
            overflow: 'hidden'
          }}>
            {/* Collapse toggle */}
            <button
              onClick={() => setSidebarCollapsed(s => !s)}
              style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 8, padding: '8px', cursor: 'pointer', color: 'rgba(148,163,184,0.6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 20, transition: 'all 0.2s', width: '100%'
              }}
            >
              {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>

            {/* Nav Items */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
              {TABS.map(tab => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    title={sidebarCollapsed ? tab.label : undefined}
                    style={{
                      display: 'flex', alignItems: 'center',
                      gap: sidebarCollapsed ? 0 : 12,
                      justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                      padding: sidebarCollapsed ? '12px' : '11px 14px',
                      borderRadius: 10, border: 'none', cursor: 'pointer',
                      background: active ? 'rgba(99,102,241,0.18)' : 'transparent',
                      color: active ? '#818cf8' : 'rgba(148,163,184,0.55)',
                      fontWeight: active ? 800 : 600, fontSize: 13,
                      transition: 'all 0.18s',
                      boxShadow: active ? 'inset 0 0 0 1px rgba(99,102,241,0.3)' : 'none',
                      whiteSpace: 'nowrap', overflow: 'hidden',
                    }}
                    onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
                    onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <Icon size={18} />
                    {!sidebarCollapsed && <span>{tab.label}</span>}
                  </button>
                );
              })}
            </nav>

            {/* Bottom — abrir chamado via sidebar */}
            <button
              onClick={() => setTicketOpen(true)}
              title={sidebarCollapsed ? 'Abrir Chamado' : undefined}
              style={{
                display: 'flex', alignItems: 'center',
                gap: sidebarCollapsed ? 0 : 10,
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                padding: sidebarCollapsed ? '12px' : '11px 14px',
                borderRadius: 10, border: '1px solid rgba(99,102,241,0.25)',
                cursor: 'pointer', background: 'rgba(99,102,241,0.1)',
                color: '#818cf8', fontWeight: 700, fontSize: 13,
                transition: 'all 0.18s', whiteSpace: 'nowrap', overflow: 'hidden',
                marginTop: 16
              }}
            >
              <HelpCircle size={18} />
              {!sidebarCollapsed && <span>Abrir Chamado</span>}
            </button>
          </aside>
        )}

        {/* ── MAIN CONTENT ─────────────────────────────────────── */}
        <main style={{ flex: 1, padding: isMobile ? '20px 16px' : '32px', maxWidth: 1300, minWidth: 0 }}>

          {/* === OVERVIEW === */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28, animation: 'fadeIn 0.3s ease' }}>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.02em' }}>Visão Geral</h1>
                <p style={{ fontSize: 13, color: 'rgba(148,163,184,0.6)', marginTop: 4 }}>Resumo do desempenho e atividades da sua empresa</p>
              </div>

              {/* KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 16 }}>
                <KpiCard label="Total de Leads"    value={kpis?.totalLeads ?? 0}                        icon={Users}        color="#6366f1" glow="rgba(99,102,241,0.15)" />
                <KpiCard label="Novos Leads"       value={kpis?.novosLeads ?? 0}                        icon={TrendingUp}   color="#f59e0b" glow="rgba(245,158,11,0.15)" />
                <KpiCard label="Tarefas Ativas"    value={kpis?.tarefasPendentes ?? 0}                  icon={CheckCircle2} color="#3b82f6" glow="rgba(59,130,246,0.15)" />
                <KpiCard label="Projetos"          value={kpis?.projetosAtivos ?? 0}                    icon={Briefcase}    color="#10b981" glow="rgba(16,185,129,0.15)" />
                <KpiCard label="Saúde do Projeto"  value={`${Math.round(kpis?.healthScore ?? 0)}%`}    icon={Star}         color="#ec4899" glow="rgba(236,72,153,0.15)" />
              </div>

              {/* Health Bar */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '22px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>Saúde do Projeto</p>
                    <p style={{ fontSize: 12, color: 'rgba(148,163,184,0.55)', marginTop: 3 }}>Performance e qualidade das entregas em tempo real</p>
                  </div>
                  <p style={{ fontSize: 30, fontWeight: 900, color: '#ec4899' }}>{Math.round(kpis?.healthScore ?? 0)}%</p>
                </div>
                <div style={{ height: 8, background: 'rgba(255,255,255,0.07)', borderRadius: 100, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${kpis?.healthScore ?? 0}%`, background: 'linear-gradient(90deg, #ec4899, #6366f1)', borderRadius: 100, transition: 'width 1.2s ease' }} />
                </div>
              </div>

              {/* 2 cols: Leads + Eventos */}
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 16 }}>
                {/* Leads */}
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 22 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(37,211,102,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <MessageCircle size={15} color="#25d366" />
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 800, color: '#f8fafc' }}>Últimos Leads</p>
                    </div>
                    <button onClick={() => setActiveTab('pipeline')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#25d366', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                      Ver todos <ChevronRight size={13} />
                    </button>
                  </div>
                  {(dashData?.waLeads || []).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(148,163,184,0.35)' }}>
                      <MessageCircle size={32} style={{ marginBottom: 12 }} />
                      <p style={{ fontSize: 13 }}>Nenhum lead ainda</p>
                    </div>
                  ) : (dashData?.waLeads || []).slice(0, 5).map((lead: any) => (
                    <div key={lead.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(37,211,102,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#25d366', fontWeight: 900, fontSize: 12 }}>
                        {(lead.name || '?')[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>{lead.name || 'Nome não informado'}</p>
                        <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.5)' }}>{lead.phone || lead.email}</p>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 20, background: `${STAGE_COLORS[lead.stage] || '#6366f1'}20`, color: STAGE_COLORS[lead.stage] || '#6366f1' }}>
                        {STAGE_LABELS[lead.stage] || lead.stage}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Próximas Entregas */}
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 22 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Calendar size={15} color="#3b82f6" />
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 800, color: '#f8fafc' }}>Próximas Entregas</p>
                  </div>
                  {(dashData?.proximosEventos || []).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(148,163,184,0.35)' }}>
                      <Calendar size={32} style={{ marginBottom: 12 }} />
                      <p style={{ fontSize: 13 }}>Nenhum evento agendado</p>
                    </div>
                  ) : (dashData?.proximosEventos || []).map((ev: any) => (
                    <div key={ev.id} style={{ display: 'flex', gap: 14, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 9, background: 'rgba(59,130,246,0.12)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 900, color: '#3b82f6', lineHeight: 1 }}>{new Date(ev.startDate).getDate()}</p>
                        <p style={{ fontSize: 9, color: 'rgba(59,130,246,0.7)', fontWeight: 700 }}>{new Date(ev.startDate).toLocaleString('pt-BR', { month: 'short' }).toUpperCase()}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>{ev.title}</p>
                        <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.5)', marginTop: 3 }}>
                          {new Date(ev.startDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick actions */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {[
                  { label: 'Ver Campanhas Ads', icon: BarChart2, tab: 'ads', color: '#3b82f6' },
                  { label: 'Calendário de Posts', icon: Calendar, tab: 'calendario', color: '#6366f1' },
                  { label: 'Minhas Tarefas', icon: KanbanSquare, tab: 'kanban', color: '#10b981' },
                  { label: 'Abrir Chamado', icon: HelpCircle, tab: 'ticket', color: '#f59e0b' },
                ].map(action => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.label}
                      onClick={() => action.tab === 'ticket' ? setTicketOpen(true) : setActiveTab(action.tab)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '10px 18px', borderRadius: 10, cursor: 'pointer',
                        background: `${action.color}12`, border: `1px solid ${action.color}30`,
                        color: action.color, fontSize: 13, fontWeight: 700, transition: 'all 0.18s'
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${action.color}22`; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `${action.color}12`; }}
                    >
                      <Icon size={15} />
                      {action.label}
                      <ArrowUpRight size={13} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* === ADS MONITOR === */}
          {activeTab === 'ads' && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: 24, fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.02em' }}>Campanhas Ads</h1>
                <p style={{ fontSize: 13, color: 'rgba(148,163,184,0.6)', marginTop: 4 }}>
                  Performance das suas campanhas em tempo real — gerenciado pela Magister Tech
                </p>
              </div>

              {/* Resumo geral */}
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? 130 : 160}px, 1fr))`, gap: 12, marginBottom: 28 }}>
                {[
                  { label: 'Total Investido', value: fmt(ads.meta.spend + ads.google.spend), color: '#f59e0b' },
                  { label: 'Impressões', value: num(ads.meta.impressions + ads.google.impressions), color: '#3b82f6' },
                  { label: 'Cliques', value: num(ads.meta.clicks + ads.google.clicks), color: '#06b6d4' },
                  { label: 'Conversas/Leads', value: num(ads.meta.messages + ads.google.conversions), color: '#10b981' },
                ].map(k => (
                  <div key={k.label} style={{
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 14, padding: '16px 18px'
                  }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(148,163,184,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{k.label}</p>
                    <p style={{ fontSize: 24, fontWeight: 900, color: k.color }}>{k.value}</p>
                  </div>
                ))}
              </div>

              {/* Cards Meta + Google */}
              <div style={{ display: 'flex', gap: 20, flexDirection: isMobile ? 'column' : 'row' }}>
                <AdsCard platform="Meta" data={ads.meta} logo="f" />
                <AdsCard platform="Google" data={ads.google} logo="G" />
              </div>

              {/* Nota */}
              <div style={{ marginTop: 20, padding: '12px 16px', background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
                <Activity size={14} color="#818cf8" />
                <p style={{ fontSize: 12, color: 'rgba(148,163,184,0.7)', lineHeight: 1.6 }}>
                  <strong style={{ color: '#f8fafc' }}>Dados atualizados automaticamente.</strong> Referências Meta Ads: CTR médio 1,2–2,0% | CPC ideal R$0,80–R$1,60. Para ver relatórios detalhados, fale com a equipe.
                </p>
              </div>
            </div>
          )}

          {/* === CALENDÁRIO === */}
          {activeTab === 'calendario' && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <CalendarioPostagens conteudos={dashData?.conteudos || []} />
            </div>
          )}

          {/* === KANBAN === */}
          {activeTab === 'kanban' && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <KanbanCliente tasks={kanbanTasks} columns={kanbanColumns} fetchTasks={fetchKanban} />
            </div>
          )}

          {/* === RELATÓRIOS === */}
          {activeTab === 'relatorios' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeIn 0.3s ease' }}>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.02em' }}>Relatórios</h1>
                <p style={{ fontSize: 13, color: 'rgba(148,163,184,0.6)', marginTop: 4 }}>Conteúdos produzidos, projetos ativos e status de entregas</p>
              </div>

              {relatorios.projetos.length > 0 && (
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 24 }}>
                  <p style={{ fontSize: 15, fontWeight: 800, color: '#f8fafc', marginBottom: 18 }}>Projetos em Execução</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                    {relatorios.projetos.map((p: any) => (
                      <div key={p.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 18 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                          <p style={{ fontSize: 14, fontWeight: 800, color: '#f8fafc' }}>{p.name}</p>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: p.status === 'EM_ANDAMENTO' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: p.status === 'EM_ANDAMENTO' ? '#10b981' : '#f59e0b' }}>
                            {p.status === 'EM_ANDAMENTO' ? 'Em Andamento' : p.status}
                          </span>
                        </div>
                        <p style={{ fontSize: 12, color: 'rgba(148,163,184,0.55)', marginBottom: 10 }}>{p.type}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(148,163,184,0.45)', fontWeight: 600 }}>
                          <span>Início: {new Date(p.startDate).toLocaleDateString('pt-BR')}</span>
                          {p.endDate && <span>Fim: {new Date(p.endDate).toLocaleDateString('pt-BR')}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 24 }}>
                <p style={{ fontSize: 15, fontWeight: 800, color: '#f8fafc', marginBottom: 18 }}>Conteúdos Produzidos</p>
                {relatorios.conteudos.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(148,163,184,0.35)' }}>
                    <FileText size={40} style={{ marginBottom: 12 }} />
                    <p style={{ fontSize: 14 }}>Nenhum conteúdo produzido ainda</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {relatorios.conteudos.map((c: any) => (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 8, background: c.platform === 'instagram' ? 'rgba(225,48,108,0.15)' : 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Image size={15} color={c.platform === 'instagram' ? '#e1306c' : '#3b82f6'} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>{c.title}</p>
                          <p style={{ fontSize: 11, color: 'rgba(148,163,184,0.5)', marginTop: 2 }}>{c.platform} · {c.publishAt ? new Date(c.publishAt).toLocaleDateString('pt-BR') : 'Sem data'}</p>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: c.status === 'APROVADO' ? 'rgba(16,185,129,0.15)' : c.status === 'AGUARDANDO_APROVACAO' ? 'rgba(245,158,11,0.15)' : 'rgba(99,102,241,0.15)', color: c.status === 'APROVADO' ? '#10b981' : c.status === 'AGUARDANDO_APROVACAO' ? '#f59e0b' : '#6366f1' }}>
                          {c.status === 'AGUARDANDO_APROVACAO' ? 'Aguardando' : c.status === 'APROVADO' ? 'Aprovado' : c.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

        {/* ── MOBILE BOTTOM NAVBAR ───────────────────────────── */}
        {isMobile && (
          <nav style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, height: 65,
            background: 'rgba(6,11,22,0.95)', backdropFilter: 'blur(16px)',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-around', zIndex: 100,
            paddingBottom: 'env(safe-area-inset-bottom)',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.5)'
          }}>
            {TABS.map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    background: 'transparent', border: 'none',
                    color: active ? '#818cf8' : 'rgba(148,163,184,0.45)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    fontSize: 9, fontWeight: active ? 800 : 600, padding: 8, flex: 1,
                    position: 'relative', cursor: 'pointer'
                  }}
                >
                  <Icon size={active ? 22 : 20} />
                  <span>{tab.label.split(' ')[0]}</span>
                  {active && <span style={{ position: 'absolute', top: -12, width: 40, height: 4, borderRadius: '0 0 4px 4px', background: '#6366f1' }} />}
                </button>
              );
            })}
          </nav>
        )}
      </div>

      {/* ── FLOATING TICKET BUTTON ─────────────────────────── */}
      {!ticketOpen && (
        <button
          onClick={() => setTicketOpen(true)}
          style={{
            position: 'fixed', bottom: isMobile ? 85 : 28, right: isMobile ? 20 : 28, zIndex: 150,
            width: 58, height: 58, borderRadius: '50%',
            background: 'linear-gradient(135deg, #4f46e5, #2563eb)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(79,70,229,0.5)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            animation: 'float 3s ease-in-out infinite',
          }}
          title="Abrir Chamado"
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(79,70,229,0.7)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(79,70,229,0.5)'; }}
        >
          <HelpCircle size={24} color="#fff" />
        </button>
      )}

      {/* ── TICKET MODAL ──────────────────────────────────── */}
      {ticketOpen && <TicketModal onClose={() => setTicketOpen(false)} empresa={empresa} />}

      <style>{`
        @keyframes spin    { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse   { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes fadeIn  { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes float   { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.15); border-radius: 4px; }
      `}</style>
    </div>
  );
}
