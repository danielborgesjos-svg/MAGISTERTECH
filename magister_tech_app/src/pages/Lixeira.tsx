import { useState, useEffect } from 'react';
import {
  Trash2, RotateCcw, X, AlertTriangle, Briefcase,
  Users, FileText, DollarSign, Target, KanbanSquare, RefreshCw
} from 'lucide-react';
import { apiFetch } from '../lib/api';

interface TrashItem {
  id: string;
  model: string;
  deletedAt: string;
  name?: string;
  title?: string;
  description?: string;
  company?: string;
  type?: string;
  status?: string;
  amount?: number;
  value?: number;
  target?: number;
  deletedByName?: string;
}

interface TrashData {
  clients: TrashItem[];
  projects: TrashItem[];
  tasks: TrashItem[];
  contracts: TrashItem[];
  transactions: TrashItem[];
  goals: TrashItem[];
}

const fmt = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

const MODEL_META: Record<string, { label: string; icon: React.ReactNode; color: string; glow: string }> = {
  client:      { label: 'Clientes',      icon: <Users size={16} />,       color: 'var(--primary)',  glow: 'var(--primary-glow)' },
  project:     { label: 'Projetos',      icon: <Briefcase size={16} />,   color: 'var(--indigo)',   glow: 'var(--indigo-glow)' },
  task:        { label: 'Tarefas',       icon: <KanbanSquare size={16} />, color: 'var(--success)', glow: 'var(--success-glow)' },
  contract:    { label: 'Contratos',     icon: <FileText size={16} />,    color: 'var(--purple)',   glow: 'var(--purple-glow)' },
  transaction: { label: 'Transações',   icon: <DollarSign size={16} />,  color: 'var(--warning)',  glow: 'var(--warning-glow)' },
  goal:        { label: 'Metas',         icon: <Target size={16} />,      color: 'var(--danger)',   glow: 'var(--danger-glow)' },
};

function getLabel(item: TrashItem) {
  return item.name || item.title || item.description || '—';
}
function getSub(item: TrashItem) {
  if (item.amount !== undefined) return `Valor: ${fmt(item.amount)}`;
  if (item.value !== undefined) return `Valor: ${fmt(item.value)}`;
  if (item.target !== undefined) return `Meta: ${fmt(item.target)}`;
  if (item.company) return item.company;
  if (item.type) return item.type;
  if (item.status) return item.status;
  return '';
}

function ConfirmModal({ item, action, onConfirm, onCancel }: {
  item: TrashItem; action: 'restore' | 'permanent'; onConfirm: () => void; onCancel: () => void;
}) {
  const isPermanent = action === 'permanent';
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440, padding: 32 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', margin: '0 auto 16px',
            background: isPermanent ? 'rgba(239,68,68,0.12)' : 'var(--success-glow)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {isPermanent ? <AlertTriangle size={26} color="var(--danger)" /> : <RotateCcw size={26} color="var(--success)" />}
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>
            {isPermanent ? 'Exclusão Permanente' : 'Restaurar Item'}
          </h3>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            {isPermanent
              ? `Tem certeza? "${getLabel(item)}" será excluído para sempre e não poderá ser recuperado.`
              : `Restaurar "${getLabel(item)}" para o sistema?`
            }
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onCancel}>Cancelar</button>
          <button
            className={isPermanent ? 'btn btn-danger' : 'btn btn-primary'}
            style={{ flex: 1 }}
            onClick={onConfirm}
          >
            {isPermanent ? <><Trash2 size={14} /> Excluir Sempre</> : <><RotateCcw size={14} /> Restaurar</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Lixeira() {
  const [data, setData] = useState<TrashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [confirm, setConfirm] = useState<{ item: TrashItem; action: 'restore' | 'permanent' } | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const d = await apiFetch<TrashData>('/api/trash');
      setData(d);
    } catch { } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRestore = async (item: TrashItem) => {
    setProcessing(item.id);
    try {
      await apiFetch(`/api/trash/restore/${item.model}/${item.id}`, { method: 'POST' });
      await load();
    } catch { } finally {
      setProcessing(null);
      setConfirm(null);
    }
  };

  const handlePermanent = async (item: TrashItem) => {
    setProcessing(item.id);
    try {
      await apiFetch(`/api/trash/permanent/${item.model}/${item.id}`, { method: 'DELETE' });
      await load();
    } catch { } finally {
      setProcessing(null);
      setConfirm(null);
    }
  };

  const allItems: TrashItem[] = data
    ? [
        ...data.clients,
        ...data.projects,
        ...data.tasks,
        ...data.contracts,
        ...data.transactions,
        ...data.goals,
      ].sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime())
    : [];

  const displayItems = activeCategory === 'all'
    ? allItems
    : allItems.filter(i => i.model === activeCategory);

  const counts = data ? {
    client: data.clients.length,
    project: data.projects.length,
    task: data.tasks.length,
    contract: data.contracts.length,
    transaction: data.transactions.length,
    goal: data.goals.length,
  } : {} as Record<string, number>;

  const totalCount = allItems.length;

  return (
    <div className="animate-in" style={{ paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px',
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 100, fontSize: 11, fontWeight: 700, color: 'var(--danger)',
          marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em'
        }}>
          <Trash2 size={12} /> Lixeira · Recuperação de Dados
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', margin: 0 }}>
              Lixeira do Sistema
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
              Itens excluídos ficam aqui por tempo indeterminado. Restaure ou apague definitivamente.
            </p>
          </div>
          <button className="btn btn-ghost" onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={14} /> Atualizar
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div style={{
        display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24,
        padding: '12px 16px', background: 'var(--bg-card)', borderRadius: 14,
        border: '1px solid var(--border)'
      }}>
        <button
          onClick={() => setActiveCategory('all')}
          style={{
            padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12,
            background: activeCategory === 'all' ? 'var(--danger)' : 'var(--bg-subtle)',
            color: activeCategory === 'all' ? '#fff' : 'var(--text-muted)',
          }}
        >
          Todos ({totalCount})
        </button>
        {Object.entries(MODEL_META).map(([key, meta]) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key)}
            style={{
              padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6,
              background: activeCategory === key ? meta.glow : 'var(--bg-subtle)',
              color: activeCategory === key ? meta.color : 'var(--text-muted)',
            }}
          >
            {meta.icon} {meta.label} ({counts[key] ?? 0})
          </button>
        ))}
      </div>

      {/* Items */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>
          <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
          <p>Carregando lixeira...</p>
        </div>
      ) : displayItems.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', background: 'var(--bg-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
          }}>
            <Trash2 size={32} color="var(--text-muted)" />
          </div>
          <h3 style={{ fontWeight: 800, fontSize: 17, marginBottom: 8 }}>Lixeira vazia</h3>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            Nenhum item encontrado nesta categoria.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {displayItems.map(item => {
            const meta = MODEL_META[item.model];
            const isProcessing = processing === item.id;
            const deletedDate = new Date(item.deletedAt).toLocaleDateString('pt-BR', {
              day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
            });

            return (
              <div key={`${item.model}-${item.id}`} className="card" style={{
                padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16,
                borderLeft: `4px solid ${meta?.color || 'var(--border)'}`,
                opacity: isProcessing ? 0.5 : 1, transition: 'all 0.2s',
              }}>
                {/* Icon */}
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: meta?.glow, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: meta?.color,
                }}>
                  {meta?.icon}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: meta?.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {meta?.label}
                    </span>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-main)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {getLabel(item)}
                  </p>
                  {getSub(item) && (
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>{getSub(item)}</p>
                  )}
                </div>

                {/* Deleted date & who */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>Excluído em</p>
                  <p style={{ fontSize: 11, fontWeight: 700, margin: '0 0 4px' }}>{deletedDate}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                     <Users size={10} color="var(--text-muted)" />
                     <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.deletedByName || 'Desconhecido'}>
                       {item.deletedByName || 'Desconhecido'}
                     </p>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button
                    className="btn btn-ghost"
                    title="Restaurar"
                    disabled={isProcessing}
                    onClick={() => setConfirm({ item, action: 'restore' })}
                    style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}
                  >
                    <RotateCcw size={13} /> Restaurar
                  </button>
                  <button
                    className="btn btn-danger"
                    title="Excluir Permanentemente"
                    disabled={isProcessing}
                    onClick={() => setConfirm({ item, action: 'permanent' })}
                    style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}
                  >
                    <X size={13} /> Excluir
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm Modal */}
      {confirm && (
        <ConfirmModal
          item={confirm.item}
          action={confirm.action}
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            if (confirm.action === 'restore') handleRestore(confirm.item);
            else handlePermanent(confirm.item);
          }}
        />
      )}
    </div>
  );
}
