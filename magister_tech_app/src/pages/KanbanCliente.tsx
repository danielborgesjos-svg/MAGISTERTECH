import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext, DragOverlay, closestCorners, PointerSensor, KeyboardSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import axios from 'axios';
import {
  ArrowLeft, GripVertical, Calendar, Flag, User, AlertTriangle,
  Clock, Filter, Plus, Activity, X, RefreshCw
} from 'lucide-react';

// ─── CONSTANTES ───────────────────────────────────────────────────────────────
const COLUMNS = [
  { id: 'A_PRODUZIR',          label: 'A Produzir',           color: '#64748b' },
  { id: 'EM_PRODUCAO',         label: 'Em Produção',          color: 'var(--primary)' },
  { id: 'QA',                  label: 'QA',                   color: 'var(--indigo)' },
  { id: 'AGUARDANDO_APROVACAO',label: 'Aguardando Aprovação', color: 'var(--warning)' },
  { id: 'AGENDADO',            label: 'Agendado',             color: 'var(--secondary)' },
  { id: 'PUBLICADO',           label: 'Publicado',            color: 'var(--success)' },
] as const;

type ColumnId = typeof COLUMNS[number]['id'];

const TIPO_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  post:     { label: 'Post',    color: '#7c3aed', bg: 'rgba(124,58,237,0.12)' },
  stories:  { label: 'Stories', color: '#0ea5e9', bg: 'rgba(14,165,233,0.12)' },
  video:    { label: 'Vídeo',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  trafego:  { label: 'Tráfego', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  tarefa:   { label: 'Tarefa',  color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  ALTA:   { label: 'Alta',   color: 'var(--danger)' },
  MEDIA:  { label: 'Média',  color: 'var(--warning)' },
  BAIXA:  { label: 'Baixa',  color: 'var(--success)' },
};

const TIPOS = Object.keys(TIPO_CONFIG);
const PRIORIDADES = ['ALTA', 'MEDIA', 'BAIXA'];

// ─── TIPOS ────────────────────────────────────────────────────────────────────
interface KanbanTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  deadline?: string;
  tipo: string;
  assignee?: { id: string; name: string; avatar?: string };
  project?: { name: string };
  clientId?: string;
}

interface NewTaskForm {
  title: string;
  tipo: string;
  priority: string;
  deadline: string;
  assigneeId: string;
  status: ColumnId;
}

// ─── SLA HELPER ───────────────────────────────────────────────────────────────
function getSlaStatus(deadline?: string): 'overdue' | 'warning' | 'ok' | 'none' {
  if (!deadline) return 'none';
  const now = new Date();
  const due = new Date(deadline);
  const diffMs = due.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return 'overdue';
  if (diffDays <= 2) return 'warning';
  return 'ok';
}

// ─── TASK CARD ────────────────────────────────────────────────────────────────
function KanbanCard({ task, isOverlay }: { task: KanbanTask; isOverlay?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'KanbanTask', task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const sla = getSlaStatus(task.deadline);
  const tipoCfg = TIPO_CONFIG[task.tipo] || TIPO_CONFIG.tarefa;
  const prioCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MEDIA;

  const slaBorder = sla === 'overdue'
    ? '2px solid var(--danger)'
    : sla === 'warning'
    ? '2px solid var(--warning)'
    : '1px solid var(--border)';

  const slaBg = sla === 'overdue'
    ? 'rgba(239,68,68,0.04)'
    : sla === 'warning'
    ? 'rgba(245,158,11,0.04)'
    : 'var(--bg-card)';

  return (
    <div ref={setNodeRef} style={style}>
      <div
        style={{
          background: slaBg,
          border: slaBorder,
          borderRadius: 12,
          padding: '12px 14px',
          marginBottom: 8,
          boxShadow: isOverlay ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
          cursor: isOverlay ? 'grabbing' : 'default',
        }}
      >
        {/* Drag handle + title */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: 8 }}>
          <div
            {...attributes}
            {...listeners}
            style={{ cursor: 'grab', color: 'var(--text-light)', marginTop: 2, flexShrink: 0 }}
          >
            <GripVertical size={13} />
          </div>
          <p style={{ fontWeight: 700, fontSize: 13, flex: 1, lineHeight: 1.4 }}>{task.title}</p>
          {sla !== 'none' && sla !== 'ok' && (
            <AlertTriangle
              size={14}
              color={sla === 'overdue' ? 'var(--danger)' : 'var(--warning)'}
              style={{ flexShrink: 0 }}
            />
          )}
        </div>

        {/* Badges */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
          <span
            className="badge"
            style={{ fontSize: 10, background: tipoCfg.bg, color: tipoCfg.color, fontWeight: 700 }}
          >
            {tipoCfg.label}
          </span>
          <span
            className="badge"
            style={{ fontSize: 10, color: prioCfg.color, background: 'transparent', border: `1px solid ${prioCfg.color}`, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}
          >
            <Flag size={9} /> {prioCfg.label}
          </span>
        </div>

        {/* Footer: responsável + prazo */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          {task.assignee ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div
                className="avatar"
                style={{
                  width: 22, height: 22, fontSize: 9, fontWeight: 800,
                  background: `hsl(${(task.assignee.name.charCodeAt(0) * 37) % 360}, 55%, 48%)`,
                  color: '#fff', borderRadius: '50%',
                }}
              >
                {task.assignee.name.substring(0, 2).toUpperCase()}
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{task.assignee.name.split(' ')[0]}</span>
            </div>
          ) : (
            <span style={{ fontSize: 11, color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <User size={10} /> Sem responsável
            </span>
          )}

          {task.deadline && (
            <span
              style={{
                fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3,
                color: sla === 'overdue' ? 'var(--danger)' : sla === 'warning' ? 'var(--warning)' : 'var(--text-muted)',
              }}
            >
              <Calendar size={10} />
              {new Date(task.deadline).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── COLUNA ───────────────────────────────────────────────────────────────────
function KanbanColumn({
  column,
  tasks,
  onAddCard,
}: {
  column: typeof COLUMNS[number];
  tasks: KanbanTask[];
  onAddCard: (colId: ColumnId) => void;
}) {
  const taskIds = useMemo(() => tasks.map(t => t.id), [tasks]);

  return (
    <div
      style={{
        minWidth: 260,
        width: 280,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-subtle)',
        borderRadius: 14,
        border: '1px solid var(--border)',
        maxHeight: 'calc(100vh - 200px)',
      }}
    >
      {/* Column header */}
      <div
        style={{
          padding: '12px 14px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexShrink: 0,
        }}
      >
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: column.color, flexShrink: 0 }} />
        <span style={{ fontWeight: 700, fontSize: 13, flex: 1 }}>{column.label}</span>
        <span
          className="badge"
          style={{ fontSize: 11, fontWeight: 800, background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          {tasks.length}
        </span>
      </div>

      {/* Cards area */}
      <div style={{ padding: '12px 10px', flex: 1, overflowY: 'auto' }}>
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <KanbanCard key={task.id} task={task} />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <p style={{ fontSize: 12, color: 'var(--text-light)', textAlign: 'center', padding: '20px 0', fontStyle: 'italic' }}>
            Sem itens
          </p>
        )}
      </div>

      {/* Add card button */}
      <div style={{ padding: '8px 10px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        <button
          className="btn btn-secondary btn-sm"
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 12 }}
          onClick={() => onAddCard(column.id)}
        >
          <Plus size={13} /> Adicionar
        </button>
      </div>
    </div>
  );
}

// ─── MODAL NOVA TAREFA ─────────────────────────────────────────────────────────
function NewTaskModal({
  defaultStatus,
  clienteId,
  users,
  onClose,
  onCreated,
}: {
  defaultStatus: ColumnId;
  clienteId: string;
  users: { id: string; name: string }[];
  onClose: () => void;
  onCreated: (task: KanbanTask) => void;
}) {
  const [form, setForm] = useState<NewTaskForm>({
    title: '',
    tipo: 'post',
    priority: 'MEDIA',
    deadline: '',
    assigneeId: '',
    status: defaultStatus,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async () => {
    if (!form.title.trim()) { setErr('Título é obrigatório.'); return; }
    setSaving(true);
    setErr('');
    try {
      const token = localStorage.getItem('magister_token');
      const { data } = await axios.post(
        '/api/tasks',
        {
          title: form.title,
          tipo: form.tipo,
          priority: form.priority,
          deadline: form.deadline || undefined,
          assigneeId: form.assigneeId || undefined,
          status: form.status,
          clientId: clienteId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onCreated(data);
      onClose();
    } catch {
      setErr('Erro ao criar tarefa. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{ width: 440, padding: 24, maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, flex: 1 }}>Nova Tarefa</h3>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="label">Título *</label>
            <input
              className="input"
              placeholder="Ex: Post para Instagram semana 1"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="label">Tipo</label>
              <select className="input" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                {TIPOS.map(t => <option key={t} value={t}>{TIPO_CONFIG[t].label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Prioridade</label>
              <select className="input" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                {PRIORIDADES.map(p => <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="label">Coluna</label>
              <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ColumnId }))}>
                {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Data de Entrega</label>
              <input type="date" className="input" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="label">Responsável</label>
            <select className="input" value={form.assigneeId} onChange={e => setForm(f => ({ ...f, assigneeId: e.target.value }))}>
              <option value="">Sem responsável</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>

          {err && <p style={{ fontSize: 12, color: 'var(--danger)' }}>{err}</p>}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Salvando...' : 'Criar Tarefa'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function KanbanCliente() {
  const { clienteId } = useParams<{ clienteId: string }>();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [clienteName, setClienteName] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [addModal, setAddModal] = useState<ColumnId | null>(null);

  const token = localStorage.getItem('magister_token');
  const headers = { Authorization: `Bearer ${token}` };

  const loadData = async () => {
    if (!clienteId) return;
    setLoading(true);
    try {
      const [tasksRes, usersRes, clienteRes] = await Promise.all([
        axios.get(`/api/clients/${clienteId}/kanban`, { headers }),
        axios.get('/api/users', { headers }),
        axios.get(`/api/clients/${clienteId}`, { headers }),
      ]);
      setTasks(tasksRes.data);
      setUsers(usersRes.data);
      setClienteName(clienteRes.data.name || '');
    } catch (e) {
      console.error('Erro ao carregar kanban:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [clienteId]);

  // ─── Filtros ───────────────────────────────────────────────────────────────
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (filterAssignee && t.assignee?.id !== filterAssignee) return false;
      if (filterTipo && t.tipo !== filterTipo) return false;
      return true;
    });
  }, [tasks, filterAssignee, filterTipo]);

  const tasksByColumn = useMemo(() => {
    const map: Record<string, KanbanTask[]> = {};
    COLUMNS.forEach(c => { map[c.id] = []; });
    filteredTasks.forEach(t => {
      if (map[t.status]) map[t.status].push(t);
      else map['A_PRODUZIR'].push(t);
    });
    return map;
  }, [filteredTasks]);

  // ─── Drag & Drop ──────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragStart = (e: DragStartEvent) => {
    const task = tasks.find(t => t.id === e.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // Determine target column
    const targetCol = COLUMNS.find(c => c.id === overId);
    const overTask = tasks.find(t => t.id === overId);
    const newStatus = targetCol?.id || overTask?.status;
    if (!newStatus) return;

    const prevTasks = [...tasks];
    setTasks(prev =>
      prev.map(t => t.id === activeId ? { ...t, status: newStatus } : t)
    );

    try {
      await axios.put(`/api/tasks/${activeId}/status`, { status: newStatus }, { headers });
    } catch {
      setTasks(prevTasks);
    }
  };

  // ─── Add task from modal ───────────────────────────────────────────────────
  const handleTaskCreated = (task: KanbanTask) => {
    setTasks(prev => [...prev, task]);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <Activity size={28} color="var(--primary)" />
      </div>
    );
  }

  const activeAssigneeOptions = users.filter(u => tasks.some(t => t.assignee?.id === u.id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
      {/* ─── HEADER ─── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <button
          className="btn btn-secondary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: 5 }}
          onClick={() => navigate(`/admin/clientes/${clienteId}/hub`)}
        >
          <ArrowLeft size={14} /> Hub
        </button>

        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 2 }}>
            Kanban Interno — {clienteName || 'Cliente'}
          </h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Visível apenas para a equipe interna
          </p>
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={14} color="var(--text-muted)" />
          <select
            className="input"
            style={{ width: 160, fontSize: 13 }}
            value={filterAssignee}
            onChange={e => setFilterAssignee(e.target.value)}
          >
            <option value="">Todos responsáveis</option>
            {activeAssigneeOptions.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>

          <select
            className="input"
            style={{ width: 140, fontSize: 13 }}
            value={filterTipo}
            onChange={e => setFilterTipo(e.target.value)}
          >
            <option value="">Todos tipos</option>
            {TIPOS.map(t => <option key={t} value={t}>{TIPO_CONFIG[t].label}</option>)}
          </select>

          {(filterAssignee || filterTipo) && (
            <button
              className="btn-icon btn-sm"
              onClick={() => { setFilterAssignee(''); setFilterTipo(''); }}
              title="Limpar filtros"
            >
              <X size={14} />
            </button>
          )}

          <button className="btn-icon btn-sm" onClick={loadData} title="Atualizar">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* ─── SLA LEGENDA ─── */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)' }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--danger)', opacity: 0.8 }} />
          SLA vencido
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)' }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--warning)', opacity: 0.8 }} />
          Vence em até 2 dias
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)' }}>
          <Clock size={10} />
          {filteredTasks.length} tarefa{filteredTasks.length !== 1 ? 's' : ''} exibida{filteredTasks.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* ─── BOARD ─── */}
      <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden' }}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div style={{ display: 'flex', gap: 14, paddingBottom: 16, minHeight: '100%', alignItems: 'flex-start' }}>
            {COLUMNS.map(col => (
              <KanbanColumn
                key={col.id}
                column={col}
                tasks={tasksByColumn[col.id] || []}
                onAddCard={(colId) => setAddModal(colId)}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask ? <KanbanCard task={activeTask} isOverlay /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* ─── MODAL NOVA TAREFA ─── */}
      {addModal && clienteId && (
        <NewTaskModal
          defaultStatus={addModal}
          clienteId={clienteId}
          users={users}
          onClose={() => setAddModal(null)}
          onCreated={handleTaskCreated}
        />
      )}
    </div>
  );
}
