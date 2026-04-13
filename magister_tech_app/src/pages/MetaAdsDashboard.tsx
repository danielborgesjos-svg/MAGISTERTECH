import { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw, Activity, Eye, MousePointer2,
  DollarSign, MessageCircle, Users, TrendingUp,
  Zap, BarChart2, Clock, CheckCircle2, AlertCircle, Car
} from 'lucide-react';

// ── Config ───────────────────────────────────────────────────────────────────
const TOKEN =
  'EAA8GIW4ZCd4sBRHKMcrkfPdZCAlKACWEEtIZAwVR51norHOBiQlCyyLAcmPrsfjDYNuR72a2W39iEbUbw0MlsCSYKuMJIx1bAiWbQYWac3LGcNLFHAhVpOATDGrSrjZAnNgC68VPsjhgWbzY1Y32aj2subWEN24IzwV3LKQkwVaVTYuZA8i2E5vZCoH0ITpRa12qJgpZBgyVwiIZBUUzkhhlojRGv6SjC7jM31sT3pBXc6sU';
const ACCOUNT_ID = 'act_109215846150888';
const CAMPAIGN_IDS = ['52513044197023', '52513046741823'];
const CAMPAIGN_LABELS: Record<string, string> = {
  '52513044197023': 'Campanha Geral',
  '52513046741823': 'Campanha Shineray',
};
const CAMPAIGN_COLORS: Record<string, string> = {
  '52513044197023': '#3b82f6',
  '52513046741823': '#f59e0b',
};

// ── Types ────────────────────────────────────────────────────────────────────
interface CampaignInsight {
  campaign_id: string;
  campaign_name: string;
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number;
  cpc: number;
  frequency: number;
  messages: number;
  videoViews: number;
  postEngagements: number;
}

interface CampaignStatus {
  id: string;
  status: string;
  start_time: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
const num = (n: number) => new Intl.NumberFormat('pt-BR').format(n);
const pct = (n: number) => `${n.toFixed(2)}%`;

function getAction(actions: any[], type: string): number {
  if (!actions) return 0;
  const a = actions.find((x: any) => x.action_type === type);
  return a ? Number(a.value) : 0;
}

// ── API Calls ────────────────────────────────────────────────────────────────
async function fetchInsights(): Promise<CampaignInsight[]> {
  const filter = encodeURIComponent(
    JSON.stringify([{ field: 'campaign.id', operator: 'IN', value: CAMPAIGN_IDS }])
  );
  const fields =
    'campaign_name,campaign_id,impressions,reach,clicks,ctr,cpc,spend,frequency,actions';
  const url =
    `https://graph.facebook.com/v20.0/${ACCOUNT_ID}/insights` +
    `?fields=${fields}&level=campaign&date_preset=maximum&filtering=${filter}&access_token=${TOKEN}`;

  const res = await fetch(url);
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);

  return (json.data || []).map((d: any) => ({
    campaign_id: d.campaign_id,
    campaign_name: d.campaign_name,
    spend: Number(d.spend),
    impressions: Number(d.impressions),
    reach: Number(d.reach),
    clicks: Number(d.clicks),
    ctr: Number(d.ctr),
    cpc: Number(d.cpc),
    frequency: Number(d.frequency),
    messages:
      getAction(d.actions, 'onsite_conversion.messaging_conversation_started_7d') +
      getAction(d.actions, 'onsite_conversion.total_messaging_connection') +
      getAction(d.actions, 'link_click'),
    videoViews: getAction(d.actions, 'video_view'),
    postEngagements: getAction(d.actions, 'post_engagement'),
  }));
}

async function fetchStatuses(): Promise<CampaignStatus[]> {
  const ids = CAMPAIGN_IDS.join(',');
  const url =
    `https://graph.facebook.com/v20.0/?ids=${ids}&fields=id,status,start_time&access_token=${TOKEN}`;
  const res = await fetch(url);
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return Object.values(json).map((d: any) => ({
    id: d.id,
    status: d.status,
    start_time: d.start_time,
  }));
}

// ── Sub-components ───────────────────────────────────────────────────────────
function KpiCell({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: color || '#94a3b8' }}>{icon}</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 900, color: '#f8fafc', letterSpacing: -0.5 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: '#64748b' }}>{sub}</div>}
    </div>
  );
}

function Bar({ label, a, b, colorA, colorB }: { label: string; a: number; b: number; colorA: string; colorB: string }) {
  const max = Math.max(a, b, 1);
  const pctA = (a / max) * 100;
  const pctB = (b / max) * 100;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: colorA, flexShrink: 0 }} />
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 4, height: 10, overflow: 'hidden' }}>
            <div style={{ width: `${pctA}%`, height: '100%', background: colorA, borderRadius: 4, transition: 'width 0.8s ease' }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#f8fafc', minWidth: 60, textAlign: 'right' }}>
            {num(a)}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: colorB, flexShrink: 0 }} />
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 4, height: 10, overflow: 'hidden' }}>
            <div style={{ width: `${pctB}%`, height: '100%', background: colorB, borderRadius: 4, transition: 'width 0.8s ease' }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#f8fafc', minWidth: 60, textAlign: 'right' }}>
            {num(b)}
          </span>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isActive = status === 'ACTIVE';
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 700,
        background: isActive ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
        color: isActive ? '#10b981' : '#ef4444',
        border: `1px solid ${isActive ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: isActive ? '#10b981' : '#ef4444',
          animation: isActive ? 'pulse 2s infinite' : 'none',
        }}
      />
      {isActive ? 'ATIVA' : status}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function MetaAdsDashboard() {
  const [insights, setInsights] = useState<CampaignInsight[]>([]);
  const [statuses, setStatuses] = useState<CampaignStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [ins, sts] = await Promise.all([fetchInsights(), fetchStatuses()]);
      setInsights(ins);
      setStatuses(sts);
      setLastUpdated(new Date());
    } catch (e: any) {
      setError(e.message || 'Erro ao buscar dados da Meta Ads API');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(() => load(true), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [load]);

  const getStatus = (id: string) => statuses.find(s => s.id === id);
  const getInsight = (id: string) => insights.find(i => i.campaign_id === id);

  const totalSpend = insights.reduce((s, i) => s + i.spend, 0);
  const totalImpressions = insights.reduce((s, i) => s + i.impressions, 0);
  const totalReach = insights.reduce((s, i) => s + i.reach, 0);
  const totalClicks = insights.reduce((s, i) => s + i.clicks, 0);
  const totalMessages = insights.reduce((s, i) => s + i.messages, 0);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1527 50%, #070b16 100%)',
      fontFamily: "'Inter', -apple-system, sans-serif",
      color: '#f8fafc',
    }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @media (max-width: 768px) {
          .campaigns-grid { flex-direction: column !important; }
          .summary-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .kpi-inner-grid { grid-template-columns: 1fr 1fr !important; }
          .header-right { gap: 8px !important; }
          .header-right .last-updated { display: none !important; }
          .compare-cpc { grid-template-columns: 1fr !important; gap: 8px !important; }
        }
        @media (max-width: 420px) {
          .summary-grid { grid-template-columns: 1fr 1fr !important; }
          .kpi-inner-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.02)',
        backdropFilter: 'blur(20px)',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Car size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.3 }}>
              Baragão Veículos
            </div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
              Monitor de Campanhas Meta Ads
            </div>
          </div>
        </div>

        <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {lastUpdated && (
            <div className="last-updated" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748b' }}>
              <Clock size={12} />
              Atualizado às {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(59,130,246,0.15)',
              border: '1px solid rgba(59,130,246,0.3)',
              borderRadius: 8, padding: '8px 14px',
              color: '#3b82f6', fontSize: 12, fontWeight: 700,
              cursor: refreshing ? 'not-allowed' : 'pointer',
              opacity: refreshing ? 0.6 : 1,
              transition: 'all 0.2s',
            }}
          >
            <RefreshCw size={13} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            {refreshing ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>

        {/* ── Error ──────────────────────────────────────────── */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 12, padding: 16, marginBottom: 24,
            display: 'flex', alignItems: 'center', gap: 10, color: '#f87171',
          }}>
            <AlertCircle size={16} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>{error}</span>
          </div>
        )}

        {/* ── Loading ─────────────────────────────────────────── */}
        {loading ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 20, minHeight: 400,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              border: '3px solid rgba(59,130,246,0.2)',
              borderTop: '3px solid #3b82f6',
              animation: 'spin 1s linear infinite',
            }} />
            <div style={{ fontSize: 14, color: '#64748b', fontWeight: 600 }}>
              Buscando dados da Meta Ads API...
            </div>
          </div>
        ) : (
          <>
            {/* ── Período Info ────────────────────────────────── */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 24, flexWrap: 'wrap', gap: 12,
            }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.5, marginBottom: 4 }}>
                  Campanhas Ativas
                </h1>
                <div style={{ fontSize: 13, color: '#64748b' }}>
                  Dados acumulados desde o início das campanhas (10/04/2026)
                </div>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
                borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, color: '#10b981',
              }}>
                <Activity size={13} />
                2 Campanhas ao vivo
              </div>
            </div>

            {/* ── Resumo Geral ────────────────────────────────── */}
            <div className="summary-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: 10,
              marginBottom: 28,
            }}>
              <KpiCell icon={<DollarSign size={14} />} label="Total Investido" value={fmt(totalSpend)} color="#f59e0b" />
              <KpiCell icon={<Eye size={14} />} label="Impressões" value={num(totalImpressions)} sub="Total das 2 campanhas" color="#3b82f6" />
              <KpiCell icon={<Users size={14} />} label="Alcance" value={num(totalReach)} sub="Pessoas únicas" color="#8b5cf6" />
              <KpiCell icon={<MousePointer2 size={14} />} label="Cliques" value={num(totalClicks)} color="#06b6d4" />
              <KpiCell icon={<MessageCircle size={14} />} label="Conversas" value={num(totalMessages)} sub="Contatos gerados" color="#10b981" />
            </div>

            {/* ── Campanhas ────────────────────────────────────── */}
            <div className="campaigns-grid" style={{ display: 'flex', gap: 16, marginBottom: 28 }}>
              {CAMPAIGN_IDS.map(id => {
                const insight = getInsight(id);
                const status = getStatus(id);
                const color = CAMPAIGN_COLORS[id];
                const label = CAMPAIGN_LABELS[id];

                return (
                  <div
                    key={id}
                    style={{
                      flex: 1,
                      background: 'rgba(255,255,255,0.03)',
                      border: `1px solid ${color}30`,
                      borderTop: `3px solid ${color}`,
                      borderRadius: 16,
                      padding: 20,
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Glow */}
                    <div style={{
                      position: 'absolute', top: -60, right: -60,
                      width: 180, height: 180, borderRadius: '50%',
                      background: color, filter: 'blur(80px)', opacity: 0.08,
                      pointerEvents: 'none',
                    }} />

                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                      <div>
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          background: `${color}20`, borderRadius: 6, padding: '3px 8px',
                          fontSize: 10, fontWeight: 800, color: color, marginBottom: 6,
                          textTransform: 'uppercase', letterSpacing: '0.06em',
                        }}>
                          <Zap size={10} />
                          MagisterTech
                        </div>
                        <h2 style={{ fontSize: 17, fontWeight: 900, letterSpacing: -0.3, lineHeight: 1.2 }}>
                          {label}
                        </h2>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, fontFamily: 'monospace' }}>
                          ID: {id}
                        </div>
                      </div>
                      {status && <StatusBadge status={status.status} />}
                    </div>

                    {insight ? (
                      <div className="kpi-inner-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <KpiCell
                          icon={<DollarSign size={13} />}
                          label="Investido"
                          value={fmt(insight.spend)}
                          color={color}
                        />
                        <KpiCell
                          icon={<Eye size={13} />}
                          label="Impressões"
                          value={num(insight.impressions)}
                          sub={`Freq: ${insight.frequency.toFixed(2)}x`}
                          color="#3b82f6"
                        />
                        <KpiCell
                          icon={<Users size={13} />}
                          label="Alcance"
                          value={num(insight.reach)}
                          sub="Pessoas únicas"
                          color="#8b5cf6"
                        />
                        <KpiCell
                          icon={<MousePointer2 size={13} />}
                          label="Cliques"
                          value={num(insight.clicks)}
                          sub={`CTR: ${pct(insight.ctr)}`}
                          color="#06b6d4"
                        />
                        <KpiCell
                          icon={<TrendingUp size={13} />}
                          label="CTR"
                          value={pct(insight.ctr)}
                          sub="Taxa de clique"
                          color={insight.ctr >= 1.5 ? '#10b981' : '#f59e0b'}
                        />
                        <KpiCell
                          icon={<DollarSign size={13} />}
                          label="CPC"
                          value={fmt(insight.cpc)}
                          sub="Custo por clique"
                          color={insight.cpc <= 1.5 ? '#10b981' : '#ef4444'}
                        />
                        <KpiCell
                          icon={<MessageCircle size={13} />}
                          label="Conversas"
                          value={num(insight.messages)}
                          sub="Contatos gerados"
                          color="#10b981"
                        />
                        <KpiCell
                          icon={<BarChart2 size={13} />}
                          label="Engajamento"
                          value={num(insight.postEngagements)}
                          sub="Interações no post"
                          color="#f59e0b"
                        />
                      </div>
                    ) : (
                      <div style={{
                        textAlign: 'center', padding: '40px 0',
                        fontSize: 13, color: '#64748b',
                      }}>
                        Sem dados disponíveis ainda
                      </div>
                    )}

                    {/* CPC indicator bar */}
                    {insight && (
                      <div style={{ marginTop: 14, padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Eficiência (CTR)
                          </span>
                          <span style={{
                            fontSize: 11, fontWeight: 700,
                            color: insight.ctr >= 2 ? '#10b981' : insight.ctr >= 1.2 ? '#f59e0b' : '#ef4444',
                          }}>
                            {insight.ctr >= 2 ? 'Excelente' : insight.ctr >= 1.2 ? 'Bom' : 'Atenção'}
                          </span>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                          <div style={{
                            width: `${Math.min((insight.ctr / 3) * 100, 100)}%`,
                            height: '100%',
                            background: insight.ctr >= 2 ? '#10b981' : insight.ctr >= 1.2 ? '#f59e0b' : '#ef4444',
                            borderRadius: 4,
                            transition: 'width 1s ease',
                          }} />
                        </div>
                        <div style={{ fontSize: 10, color: '#475569', marginTop: 4 }}>
                          Referência: &lt;1.2% baixo | 1.2–2% bom | &gt;2% excelente
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── Comparativo ─────────────────────────────────── */}
            {insights.length === 2 && (
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 16,
                padding: 24,
                marginBottom: 28,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <BarChart2 size={16} color="#64748b" />
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Comparativo entre Campanhas
                  </h3>
                </div>

                {/* Legend */}
                <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                  {CAMPAIGN_IDS.map(id => (
                    <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 12, height: 12, borderRadius: 3, background: CAMPAIGN_COLORS[id] }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>{CAMPAIGN_LABELS[id]}</span>
                    </div>
                  ))}
                </div>

                {(() => {
                  const a = insights.find(i => i.campaign_id === CAMPAIGN_IDS[0])!;
                  const b = insights.find(i => i.campaign_id === CAMPAIGN_IDS[1])!;
                  const colA = CAMPAIGN_COLORS[CAMPAIGN_IDS[0]];
                  const colB = CAMPAIGN_COLORS[CAMPAIGN_IDS[1]];
                  return (
                    <div>
                      <Bar label="Impressões" a={a.impressions} b={b.impressions} colorA={colA} colorB={colB} />
                      <Bar label="Alcance (pessoas únicas)" a={a.reach} b={b.reach} colorA={colA} colorB={colB} />
                      <Bar label="Cliques" a={a.clicks} b={b.clicks} colorA={colA} colorB={colB} />
                      <Bar label="Conversas iniciadas" a={a.messages} b={b.messages} colorA={colA} colorB={colB} />
                      <Bar label="Engajamento (post)" a={a.postEngagements} b={b.postEngagements} colorA={colA} colorB={colB} />
                    </div>
                  );
                })()}

                {/* CPC comparison */}
                <div className="compare-cpc" style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8,
                  padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: 12,
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>CPC — Campanha Geral</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: CAMPAIGN_COLORS[CAMPAIGN_IDS[0]] }}>
                      {fmt(insights.find(i => i.campaign_id === CAMPAIGN_IDS[0])?.cpc || 0)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>CPC — Campanha Shineray</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: CAMPAIGN_COLORS[CAMPAIGN_IDS[1]] }}>
                      {fmt(insights.find(i => i.campaign_id === CAMPAIGN_IDS[1])?.cpc || 0)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Dicas ───────────────────────────────────────── */}
            <div style={{
              background: 'rgba(59,130,246,0.05)',
              border: '1px solid rgba(59,130,246,0.15)',
              borderRadius: 12,
              padding: '14px 18px',
              marginBottom: 24,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
            }}>
              <CheckCircle2 size={16} color="#3b82f6" style={{ marginTop: 1, flexShrink: 0 }} />
              <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>
                <strong style={{ color: '#f8fafc' }}>Referências Meta Ads — Setor Automotivo:</strong>{' '}
                CTR médio: 1,2% – 2,0% | CPC ideal: R$ 0,80 – R$ 1,60 | Frequência saudável: até 3,0x.
                Dashboard atualiza automaticamente a cada 5 minutos.
              </div>
            </div>

          </>
        )}
      </div>

      {/* ── Footer ─────────────────────────────────────────── */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: '14px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: 11,
        color: '#475569',
      }}>
        <div>
          Dados via{' '}
          <span style={{ color: '#3b82f6', fontWeight: 700 }}>Meta Ads API</span>
          {' '}— Conta{' '}
          <span style={{ fontFamily: 'monospace' }}>{ACCOUNT_ID}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#3b82f6' }}>
          <Zap size={11} />
          Powered by MagisterTech
        </div>
      </div>
    </div>
  );
}
