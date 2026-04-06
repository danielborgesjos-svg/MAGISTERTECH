import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, FileText, Briefcase, Receipt,
  CheckSquare, PenTool, AlertCircle, Calendar, User,
  TrendingUp, CheckCircle2, Clock, XCircle, Activity,
  KanbanSquare
} from 'lucide-react';

// ─── TIPOS ────────────────────────────────────────────────────────────────────
interface ClienteHubData {
  cliente: {
    id: string;
    name: string;
    company?: string;
    email?: string;
    phone?: string;
    segment?: string;
    status: string;
    healthScore: number;
    responsible?: string;
  };
  contratoAtivo: {
    id: string;
    title: string;
    value: number;
    recurrence?: string;
    startDate: string;
    endDate?: string;
    status: string;
  } | null;
  projetos: {
    id: string;
    name: string;
    status: string;
    startDate: string;
    endDate?: string;
  }[];
  faturas: {
    id: string;
    valor: number;
    vencimento: string;
    status: string;
    paidAt?: string;
    descricao?: string;
  }[];
  tarefas: {
    id: string;
    title: string;
    status: string;
    priority: string;
    deadline?: string;
    tipo: string;
    assignee?: { name: string; avatar?: string };
  }[];
  conteudos: {
    id: string;
    title: string;
    platform: string;
    status: string;
    versao: number;
    publishAt?: string;
    author: { name: string };
  }[];
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const PRIORITY_COLOR: Record<string, string> = {
  ALTA: 'var(--danger)',
  MEDIA: 'var(--warning)',
  BAIXA: 'var(--success)',
};

const STATUS_FATURA: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PAGO: { label: 'Pago', color: 'var(--success)', icon: <CheckCircle2 size={13} /> },
  PENDENTE: { label: 'Pendente', color: 'var(--warning)', icon: <Clock size={13} /> },
  VENCIDO: { label: 'Vencido', color: 'var(--danger)', icon: <XCircle size={13} /> },
};

function fmt(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function fmtDate(dateStr?: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function HealthBar({ score }: { score: number }) {
  const color = score >= 70 ? 'var(--success)' : score >= 40 ? 'var(--warning)' : 'var(--danger)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 8, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.6s ease' }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color, minWidth: 36 }}>{score}%</span>
    </div>
  );
}

function SectionHeader({ icon, title, count }: { icon: React.ReactNode; title: string; count?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
        {icon}
      </div>
      <h3 style={{ fontSize: 15, fontWeight: 700, flex: 1 }}>{title}</h3>
      {count !== undefined && (
        <span className="badge" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', fontSize: 11, fontWeight: 700 }}>
          {count}
        </span>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p style={{ color: 'var(--text-light)', fontSize: 13, textAlign: 'center', padding: '20px 0', fontStyle: 'italic' }}>
      {message}
    </p>
  );
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function ClienteHub() {
  const { clienteId } = useParams<{ clienteId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<ClienteHubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!clienteId) return;
    const token = localStorage.getItem('magister_token');
    setLoading(true);
    axios
      .get(`/api/clients/${clienteId}/hub`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setData(r.data))
      .catch(() => setError('Não foi possível carregar os dados do cliente.'))
      .finally(() => setLoading(false));
  }, [clienteId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <div style={{ textAlign: 'center' }}>
          <Activity size={28} color="var(--primary)" style={{ marginBottom: 12 }} />
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Carregando hub do cliente...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <div style={{ textAlign: 'center' }}>
          <AlertCircle size={28} color="var(--danger)" style={{ marginBottom: 12 }} />
          <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error || 'Cliente não encontrado.'}</p>
          <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={() => navigate('/admin/crm')}>
            Voltar ao CRM
          </button>
        </div>
      </div>
    );
  }

  const { cliente, contratoAtivo, projetos, faturas, tarefas, conteudos } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ─── HEADER ─── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/admin/crm')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ArrowLeft size={14} /> Voltar
        </button>

        <div className="card" style={{ flex: 1, padding: '20px 24px', minWidth: 300 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div className="avatar" style={{ width: 52, height: 52, fontSize: 18, fontWeight: 800, background: 'var(--primary)', color: '#fff', borderRadius: 14, flexShrink: 0 }}>
              {cliente.name.substring(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 2 }}>{cliente.name}</h1>
              {cliente.company && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{cliente.company}</p>}
              <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                <span className="badge" style={{ background: cliente.status === 'ATIVO' ? 'var(--success-glow)' : 'var(--bg-subtle)', color: cliente.status === 'ATIVO' ? 'var(--success)' : 'var(--text-muted)', fontWeight: 700 }}>
                  {cliente.status}
                </span>
                {cliente.segment && <span className="badge" style={{ background: 'var(--indigo-glow)', color: 'var(--indigo)' }}>{cliente.segment}</span>}
              </div>
            </div>
            <button
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={() => navigate(`/admin/clientes/${clienteId}/kanban`)}
            >
              <KanbanSquare size={14} /> Kanban Interno
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            {cliente.email && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                <span style={{ display: 'block', fontWeight: 700, color: 'var(--text-main)', marginBottom: 2 }}>E-mail</span>
                {cliente.email}
              </div>
            )}
            {cliente.phone && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                <span style={{ display: 'block', fontWeight: 700, color: 'var(--text-main)', marginBottom: 2 }}>Telefone</span>
                {cliente.phone}
              </div>
            )}
            {cliente.responsible && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                <span style={{ display: 'block', fontWeight: 700, color: 'var(--text-main)', marginBottom: 2 }}>Responsável</span>
                {cliente.responsible}
              </div>
            )}
            <div style={{ fontSize: 12 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, color: 'var(--text-main)', marginBottom: 6 }}>
                <TrendingUp size={12} /> Health Score
              </span>
              <HealthBar score={cliente.healthScore} />
            </div>
          </div>
        </div>
      </div>

      {/* ─── GRID PRINCIPAL ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>

        {/* CONTRATO ATIVO */}
        <div className="card" style={{ padding: 20 }}>
          <SectionHeader icon={<FileText size={16} />} title="Contrato Ativo" />
          {!contratoAtivo ? (
            <EmptyState message="Nenhum contrato vigente" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-main)' }}>{contratoAtivo.title}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)' }}>{fmt(contratoAtivo.value)}</span>
                <span className="badge" style={{ background: 'var(--success-glow)', color: 'var(--success)', fontWeight: 700 }}>{contratoAtivo.status}</span>
              </div>
              {contratoAtivo.recurrence && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Recorrência: <strong>{contratoAtivo.recurrence}</strong></p>
              )}
              <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                <div>
                  <p style={{ fontSize: 11, color: 'var(--text-light)', fontWeight: 600 }}>INÍCIO</p>
                  <p style={{ fontSize: 13, fontWeight: 600 }}>{fmtDate(contratoAtivo.startDate)}</p>
                </div>
                {contratoAtivo.endDate && (
                  <div>
                    <p style={{ fontSize: 11, color: 'var(--text-light)', fontWeight: 600 }}>ENCERRAMENTO</p>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>{fmtDate(contratoAtivo.endDate)}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* PROJETOS EM ANDAMENTO */}
        <div className="card" style={{ padding: 20 }}>
          <SectionHeader icon={<Briefcase size={16} />} title="Projetos em Andamento" count={projetos.length} />
          {projetos.length === 0 ? (
            <EmptyState message="Nenhum projeto ativo" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {projetos.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--bg-subtle)', borderRadius: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.status === 'EM_ANDAMENTO' ? 'var(--primary)' : 'var(--warning)', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</p>
                    {p.endDate && (
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <Calendar size={10} /> Entrega: {fmtDate(p.endDate)}
                      </p>
                    )}
                  </div>
                  <span className="badge" style={{ fontSize: 10, background: 'var(--primary-glow)', color: 'var(--primary)' }}>{p.status.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ÚLTIMAS FATURAS */}
        <div className="card" style={{ padding: 20 }}>
          <SectionHeader icon={<Receipt size={16} />} title="Últimas Faturas" count={faturas.length} />
          {faturas.length === 0 ? (
            <EmptyState message="Nenhuma fatura encontrada" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {faturas.map(f => {
                const cfg = STATUS_FATURA[f.status] || STATUS_FATURA['PENDENTE'];
                return (
                  <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--bg-subtle)', borderRadius: 10 }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>{f.descricao || 'Fatura mensal'}</p>
                      <p style={{ fontSize: 14, fontWeight: 700 }}>{fmt(f.valor)}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: cfg.color, fontWeight: 700, fontSize: 12, justifyContent: 'flex-end' }}>
                        {cfg.icon} {cfg.label}
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 2 }}>
                        {f.status === 'PAGO' && f.paidAt ? `Pago em ${fmtDate(f.paidAt)}` : `Vence ${fmtDate(f.vencimento)}`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* TAREFAS ABERTAS */}
        <div className="card" style={{ padding: 20 }}>
          <SectionHeader icon={<CheckSquare size={16} />} title="Tarefas Abertas" count={tarefas.length} />
          {tarefas.length === 0 ? (
            <EmptyState message="Nenhuma tarefa aberta" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tarefas.map(t => {
                const isOverdue = t.deadline && new Date(t.deadline) < new Date();
                const prioColor = PRIORITY_COLOR[t.priority] || 'var(--text-muted)';
                return (
                  <div key={t.id} style={{ padding: '10px 12px', background: 'var(--bg-subtle)', borderRadius: 10, borderLeft: `3px solid ${prioColor}` }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{t.title}</p>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <span className="badge" style={{ fontSize: 10, background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>{t.tipo}</span>
                          <span className="badge" style={{ fontSize: 10, color: prioColor, background: 'transparent', border: `1px solid ${prioColor}` }}>{t.priority}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        {t.assignee && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, justifyContent: 'flex-end' }}>
                            <User size={10} /> {t.assignee.name}
                          </div>
                        )}
                        {t.deadline && (
                          <p style={{ fontSize: 11, color: isOverdue ? 'var(--danger)' : 'var(--text-light)', fontWeight: isOverdue ? 700 : 400, display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end' }}>
                            <Calendar size={10} /> {fmtDate(t.deadline)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CONTEÚDOS AGUARDANDO APROVAÇÃO */}
        <div className="card" style={{ padding: 20, gridColumn: 'span 2' }}>
          <SectionHeader icon={<PenTool size={16} />} title="Conteúdos Aguardando Aprovação" count={conteudos.length} />
          {conteudos.length === 0 ? (
            <EmptyState message="Nenhum conteúdo aguardando aprovação" />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
              {conteudos.map(c => (
                <div key={c.id} style={{ padding: '12px 14px', background: 'var(--bg-subtle)', borderRadius: 10, borderTop: '3px solid var(--warning)' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{c.title}</p>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                    <span className="badge" style={{ fontSize: 10, background: 'var(--indigo-glow)', color: 'var(--indigo)' }}>{c.platform}</span>
                    <span className="badge" style={{ fontSize: 10, background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>v{c.versao}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <User size={10} /> {c.author.name}
                    </p>
                    {c.publishAt && (
                      <p style={{ fontSize: 11, color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Calendar size={10} /> {fmtDate(c.publishAt)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
