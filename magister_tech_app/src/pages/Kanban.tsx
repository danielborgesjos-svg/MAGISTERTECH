import { useState, useContext } from 'react';
import {
  DndContext, DragOverlay, closestCorners, PointerSensor, KeyboardSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import type { DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, X, GripVertical, Calendar, Flag, User, CheckSquare, Square, Trash2, CheckCircle, Activity, Send } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { AuthContext } from '../contexts/AuthContext';
import { apiFetch } from '../lib/api';
import type { Task, KanbanColumn } from '../contexts/DataContext';

const PRIORITY_CONFIG = {
  low: { label: 'Baixa', color: 'var(--success)', bg: 'var(--success-glow)' },
  medium: { label: 'Média', color: 'var(--warning)', bg: 'var(--warning-glow)' },
  high: { label: 'Alta', color: 'var(--danger)', bg: 'var(--danger-glow)' },
  urgent: { label: 'Crítico', color: 'var(--primary)', bg: 'var(--primary-glow)' },
};

const TAGS = ['Dev', 'Design', 'Marketing', 'Comercial', 'Conteúdo', 'Financeiro', 'Reunião', 'UX', 'Admin', 'Outro'];

// ─── TASK CARD COMPONENT ─────────────────────────────────────────────────────
function TaskCard({ task, isOverlay, onClick }: { task: Task; isOverlay?: boolean; onClick?: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'Task', task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const pCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const doneItems = (task.checklist || []).filter(c => c.done).length;
  const totalItems = (task.checklist || []).length;

  return (
    <div ref={setNodeRef} style={style}>
      <div className="card" style={{ padding: '14px 16px', opacity: isOverlay ? 0.85 : 1, cursor: 'pointer', borderTop: `3px solid ${pCfg.color}`, marginBottom: 12 }} onClick={onClick}>
        {/* Drag handle */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 10 }}>
          <div {...attributes} {...listeners} style={{ cursor: 'grab', color: 'var(--text-light)', marginTop: 2, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
            <GripVertical size={14} />
          </div>
          <p style={{ fontWeight: 800, fontSize: 13, flex: 1, lineHeight: 1.4, color: 'var(--text-main)' }}>{task.title}</p>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: task.description || totalItems > 0 ? 12 : 8 }}>
           <span className="badge" style={{ fontSize: 10, background: 'var(--bg-subtle)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>{task.tag}</span>
           <span className="badge" style={{ fontSize: 10, background: pCfg.bg, color: pCfg.color, fontWeight: 700 }}>
            <Flag size={10} />{pCfg.label}
          </span>
        </div>

        {task.description && (
          <p style={{ fontSize: 12, color: 'var(--text-sec)', lineHeight: 1.6, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{task.description}</p>
        )}

        {totalItems > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Checklist</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: doneItems === totalItems ? 'var(--success)' : 'var(--text-main)' }}>{doneItems}/{totalItems}</span>
            </div>
            <div className="progress-track" style={{ height: 6 }}>
              <div className="progress-fill" style={{ width: `${totalItems > 0 ? (doneItems / totalItems) * 100 : 0}%`, background: doneItems === totalItems ? 'var(--success)' : 'var(--primary)' }} />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <div className="avatar" style={{ width: 24, height: 24, fontSize: 10, fontWeight: 800, background: `hsl(${(task.assignee || 'X').charCodeAt(0) * 30}, 60%, 50%)`, color: '#fff' }}>
            {task.assignee}
          </div>
          {task.dueDate && (
            <span style={{ fontSize: 11, fontWeight: 700, color: task.dueDate < new Date().toISOString().split('T')[0] ? 'var(--danger)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Calendar size={12} />{new Date(task.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── COLUMN COMPONENT ────────────────────────────────────────────────────────
function BoardColumn({ col, onAddTask, onEditTask }: {
  col: KanbanColumn;
  onAddTask: () => void;
  onEditTask: (t: Task) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: col.id,
    data: { type: 'Column' },
  });

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const taskIds = col.tasks.map(t => t.id);

  return (
    <div ref={setNodeRef} style={{ ...style }}>
      <div style={{ width: 320, background: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)', display: 'flex', flexDirection: 'column', border: '1px solid var(--border-strong)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ padding: '20px 20px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(180deg, var(--bg-card) 0%, var(--bg-surface) 100%)', borderBottom: '1px solid var(--border)', borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div {...attributes} {...listeners} style={{ cursor: 'grab', color: 'var(--text-light)', opacity: 0.5 }}>
              <GripVertical size={16} />
            </div>
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: col.color || 'var(--primary)', flexShrink: 0, boxShadow: `0 0 14px ${col.color || 'var(--primary)'}` }} />
            <h4 style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-main)' }}>{col.title}</h4>
            <span className="badge" style={{ fontSize: 10, background: 'var(--bg-subtle)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>{col.tasks.filter(t => !t.isArchived).length}</span>
          </div>
          <button className="btn-icon" style={{ width: 30, height: 30, background: 'var(--bg-card)', borderColor: 'var(--border)' }} onClick={onAddTask}><Plus size={14} /></button>
        </div>

        <div style={{ padding: '16px 20px' }}>
          <SortableContext items={taskIds}>
            {col.tasks.filter(t => !t.isArchived).map(task => (
              <TaskCard key={task.id} task={task} onClick={() => onEditTask(task)} />
            ))}
          </SortableContext>
          {col.tasks.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-light)', border: '2px dashed var(--border-strong)', borderRadius: 16, background: 'var(--bg-subtle)' }}>
               <CheckSquare size={32} style={{ opacity: 0.15, marginBottom: 12 }}/>
               <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.5px' }}>Sem tarefas aqui</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN KANBAN ──────────────────────────────────────────────────────────────
export default function Kanban() {
  const { user } = useContext(AuthContext);
  const { kanban, setKanban, addTask, updateTask, deleteTask, archiveTask, addTaskLog, team } = useData();
  const [showArchived, setShowArchived] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [modalTask, setModalTask] = useState<Task | null>(null);
  const [targetColId, setTargetColId] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState({
    title: '', tag: 'Dev', priority: 'medium' as Task['priority'],
    assignee: '', dueDate: '', description: '', checklist: [] as { id: string; text: string; done: boolean }[]
  });
  const [checklistInput, setChecklistInput] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const columnIds = kanban.map(c => c.id);

  const handleDragStart = (e: DragStartEvent) => {
    setActiveId(e.active.id as string);
    if (e.active.data.current?.type === 'Task') setActiveTask(e.active.data.current.task);
  };

  const handleDragOver = (e: DragOverEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const isActiveTask = active.data.current?.type === 'Task';
    const isOverTask = over.data.current?.type === 'Task';
    const isOverColumn = over.data.current?.type === 'Column';
    if (!isActiveTask) return;

    setKanban((prev: KanbanColumn[]) => {
      const newCols = prev.map(c => ({ ...c, tasks: [...c.tasks] }));
      const activeColIdx = newCols.findIndex(c => c.tasks.some(t => t.id === active.id));
      let overColIdx = -1;
      if (isOverTask) overColIdx = newCols.findIndex(c => c.tasks.some(t => t.id === over.id));
      else if (isOverColumn) overColIdx = newCols.findIndex(c => c.id === over.id);
      
      if (activeColIdx === -1 || overColIdx === -1) return prev;
      
      const activeCol = newCols[activeColIdx];
      const overCol = newCols[overColIdx];

      if (activeColIdx !== overColIdx) {
         const task = activeCol.tasks.find(t => t.id === active.id);
         if (task) {
            addTaskLog(task.id, `Moveu de ${activeCol.title} para ${overCol.title}`, user?.name || 'Membro');
         }
      }

      const activeIdx = activeCol.tasks.findIndex(t => t.id === active.id);
      const [moved] = activeCol.tasks.splice(activeIdx, 1);
      if (isOverTask) {
        const overIdx = overCol.tasks.findIndex(t => t.id === over.id);
        overCol.tasks.splice(overIdx, 0, moved);
      } else {
        overCol.tasks.push(moved);
      }
      return newCols;
    });
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) {
      setActiveId(null);
      setActiveTask(null);
      return;
    }

    if (active.data.current?.type === 'Column' && over.data.current?.type === 'Column' && active.id !== over.id) {
      const oldIdx = kanban.findIndex(c => c.id === active.id);
      const newIdx = kanban.findIndex(c => c.id === over.id);
      setKanban(arrayMove(kanban, oldIdx, newIdx));
    }
    setActiveId(null);
    setActiveTask(null);
  };

  const openNew = (colId: string) => {
    setTargetColId(colId);
    setIsNew(true);
    setModalTask(null);
    setForm({ title: '', tag: 'Dev', priority: 'medium', assignee: user?.name?.substring(0, 2).toUpperCase() || 'ME', dueDate: '', description: '', checklist: [] });
    setChecklistInput('');
  };

  const openEdit = (task: Task) => {
    setModalTask(task);
    setIsNew(false);
    setForm({ title: task.title, tag: task.tag, priority: task.priority, assignee: task.assignee, dueDate: task.dueDate || '', description: task.description || '', checklist: task.checklist || [] });
    setChecklistInput('');
  };

  const addChecklistItem = () => {
    if (!checklistInput.trim()) return;
    setForm(p => ({ ...p, checklist: [...p.checklist, { id: `ci-${Date.now()}`, text: checklistInput.trim(), done: false }] }));
    setChecklistInput('');
  };

  const toggleChecklistItem = (id: string) => {
    setForm(p => ({ ...p, checklist: p.checklist.map(c => c.id === id ? { ...c, done: !c.done } : c) }));
  };

  const handleSave = () => {
    if (!form.title) return;
    if (isNew && targetColId) {
      addTask(targetColId, { ...form });
    } else if (modalTask) {
      updateTask(modalTask.id, { ...form });
    }
    setModalTask(null);
    setTargetColId(null);
  };

  const handleDelete = () => {
    if (!modalTask) return;
    if (confirm('Excluir esta tarefa permanentemente?')) {
      deleteTask(modalTask.id);
      setModalTask(null);
    }
  };

  const handleArchive = () => {
     if (!modalTask) return;
     const newArchivedState = !modalTask.isArchived;
     archiveTask(modalTask.id, newArchivedState);
     addTaskLog(modalTask.id, newArchivedState ? 'Arquivou a tarefa' : 'Desarquivou a tarefa', user?.name || 'Membro');
     setModalTask(null);
  };

  const addColumn = () => {
    const title = prompt('Nome da nova coluna:');
    if (!title) return;
    const newCol: KanbanColumn = { id: `col-${Date.now()}`, title, tasks: [], color: 'var(--primary)' };
    setKanban([...kanban, newCol]);
  };

  const showModal = isNew || !!modalTask;

  return (
    <div className="animate-fade-up kanban-wrapper" style={{ paddingBottom: 80 }}>
      {/* ─── HEADER COCKPIT ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 100, fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Activity size={12} color="var(--primary)" /> Produção · Workflow
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-main)', margin: 0, lineHeight: 1.1 }}>
            Kanban Cockpit
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8 }}>
            Sistema ágil de produção Magister. Arraste tickets entre as colunas para atualizar status.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="card" style={{ padding: '8px 16px', display: 'flex', gap: 16 }}>
            {kanban.map(col => (
              <div key={col.id} style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 16, fontWeight: 900, color: col.color || 'var(--primary)' }}>{col.tasks.length}</p>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>{col.title}</p>
              </div>
            ))}
          </div>
          <button className="btn btn-primary" onClick={addColumn}><Plus size={16} /> Add Coluna</button>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        <div className="kanban-container">
          <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
            {kanban.map(col => (
              <BoardColumn key={col.id} col={col} onAddTask={() => openNew(col.id)} onEditTask={openEdit} />
            ))}
          </SortableContext>
        </div>

        <DragOverlay>
          {activeId && activeTask ? (
             <div style={{ transform: 'rotate(2deg)' }}><TaskCard task={activeTask} isOverlay /></div>
          ) : activeId ? (
            <div style={{ width: 300, height: 80, background: 'var(--primary)', opacity: 0.6, borderRadius: 'var(--radius)' }} />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* ─── ARCHIVED DRAWER ─────────────────────────────────────────── */}
      <div style={{ 
        position: 'fixed', bottom: 0, left: 280, right: 0, zIndex: 100,
        transform: showArchived ? 'translateY(0)' : 'translateY(calc(100% - 40px))',
        transition: '0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        background: 'var(--bg-card)', borderTop: '1px solid var(--border)',
        boxShadow: '0 -10px 30px rgba(0,0,0,0.2)', paddingBottom: 20
      }}>
         <div 
          onClick={() => setShowArchived(!showArchived)}
          style={{ 
            height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', 
            cursor: 'pointer', background: 'var(--bg-subtle)', color: 'var(--text-muted)',
            fontSize: 12, fontWeight: 800, gap: 10
          }}>
            <Trash2 size={14} /> GAVETA DE ARQUIVADOS ({kanban.flatMap(c => c.tasks).filter(t => t.isArchived).length})
         </div>
         <div style={{ padding: 20, maxHeight: 300, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {kanban.flatMap(c => c.tasks).filter(t => t.isArchived).map(task => (
              <TaskCard key={task.id} task={task} onClick={() => openEdit(task)} />
            ))}
            {kanban.flatMap(c => c.tasks).filter(t => t.isArchived).length === 0 && (
              <div style={{ textAlign: 'center', gridColumn: '1/-1', padding: 40, color: 'var(--text-muted)' }}>Nenhum item arquivado</div>
            )}
         </div>
      </div>

      {/* ─── TASK MODAL PREMIUM ────────────────────────────────────── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => { setModalTask(null); setTargetColId(null); }} style={{ background: 'rgba(15, 14, 26, 0.45)', backdropFilter: 'blur(4px)', alignItems: 'flex-start', overflowY: 'auto', padding: '60px 20px' }}>
          <div className="modal modal-xl" style={{ maxWidth: 640, padding: 0, display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.2)', margin: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ padding: '24px 32px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                 <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckSquare size={22} color="var(--primary)"/>
                 </div>
                 <div>
                    <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em', marginBottom: 2 }}>{isNew ? 'Emissão de Novo Ticket' : 'Detalhamento do Ticket'}</h2>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Produção e execução de demandas</p>
                 </div>
              </div>
              <button className="btn-icon" style={{ background: 'var(--bg-subtle)' }} onClick={() => { setModalTask(null); setTargetColId(null); }}><X size={18} /></button>
            </div>

            <div className="modal-body" style={{ padding: 32 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label className="form-label" style={{ fontWeight: 800, marginBottom: 8 }}>Título / Resumo da Tarefa *</label>
                  <input className="input" style={{ fontSize: 16, fontWeight: 700, height: 44 }} placeholder="Ex: Desenvolver fluxo de checkout" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
                </div>
                
                <div>
                  <label className="form-label" style={{ marginBottom: 8 }}>Departamento (Tag)</label>
                  <select className="input" value={form.tag} onChange={e => setForm(p => ({ ...p, tag: e.target.value }))} style={{ height: 40 }}>
                    {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ marginBottom: 8 }}>Nível de Severidade</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {(Object.keys(PRIORITY_CONFIG) as Task['priority'][]).map(k => {
                      const cfg = PRIORITY_CONFIG[k];
                      return (
                        <button key={k} onClick={() => setForm(p => ({ ...p, priority: k }))}
                          style={{ flex: 1, padding: '8px 4px', fontSize: 11, fontWeight: 800, borderRadius: 8, border: `1.5px solid ${form.priority === k ? cfg.color : 'var(--border)'}`, background: form.priority === k ? cfg.bg : 'var(--bg-subtle)', color: form.priority === k ? cfg.color : 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s' }}>
                          <Flag size={12} style={{ display: 'inline', marginRight: 2, marginBottom: -2 }}/> {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ marginBottom: 8 }}><User size={13} style={{ display: 'inline', marginBottom: -2 }} /> Responsável (Owner)</label>
                  <select className="input" value={form.assignee} onChange={e => setForm(p => ({ ...p, assignee: e.target.value }))} style={{ height: 40 }}>
                    {team.map(m => <option key={m.id} value={m.initials}>{m.name}</option>)}
                    <option value={user?.name?.substring(0, 2).toUpperCase() || 'ME'}>Atribuir a mim</option>
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ marginBottom: 8 }}><Calendar size={13} style={{ display: 'inline', marginBottom: -2 }} /> Prazo Limite (SLA)</label>
                  <input className="input" type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} style={{ height: 40 }} />
                </div>

                <div style={{ gridColumn: '1/-1' }}>
                  <label className="form-label" style={{ marginBottom: 8 }}>Descrição Técnica e Contexto</label>
                  <textarea className="input" rows={4} style={{ resize: 'vertical', fontSize: 14, lineHeight: 1.6 }} placeholder="Insira links, credenciais, briefings ou notas adicionais..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                </div>

                {/* Checklist */}
                <div style={{ gridColumn: '1/-1', background: 'var(--bg-subtle)', padding: 24, borderRadius: 16, border: '1px solid var(--border)' }}>
                  <label className="form-label" style={{ fontWeight: 800, fontSize: 13, marginBottom: 16, color: 'var(--text-main)' }}>
                     <CheckSquare size={16} color="var(--primary)" style={{ display: 'inline', marginRight: 6, marginBottom: -4 }}/> 
                     Checklist
                  </label>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                    <input className="input" placeholder="Novo item..." value={checklistInput} onChange={e => setChecklistInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addChecklistItem()} style={{ height: 40, background: 'var(--bg-card)' }} />
                    <button className="btn btn-primary" onClick={addChecklistItem} style={{ height: 40, whiteSpace: 'nowrap' }}><Plus size={16} /> Incluir</button>
                  </div>
                  {form.checklist.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {form.checklist.map(item => (
                        <div key={item.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12 }}>
                          <button onClick={() => toggleChecklistItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: item.done ? 'var(--success)' : 'var(--text-light)', flexShrink: 0, padding: 0 }}>
                            {item.done ? <CheckSquare size={20} /> : <Square size={20} />}
                          </button>
                          <span style={{ fontSize: 14, fontWeight: item.done ? 500 : 600, textDecoration: item.done ? 'line-through' : 'none', color: item.done ? 'var(--text-light)' : 'var(--text-main)', flex: 1, opacity: item.done ? 0.7 : 1 }}>{item.text}</span>
                          <button className="btn-icon" onClick={() => setForm(p => ({ ...p, checklist: p.checklist.filter(c => c.id !== item.id) }))} style={{ width: 32, height: 32, color: 'var(--danger)', background: 'transparent', border: 'none' }} title="Excluir">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Histórico/Log */}
                {!isNew && modalTask?.logs && modalTask.logs.length > 0 && (
                  <div style={{ gridColumn: '1/-1', borderTop: '1px dashed var(--border)', paddingTop: 24 }}>
                    <label className="form-label" style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <Activity size={14} color="var(--primary)" /> Histórico de Alterações
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {modalTask.logs.slice().reverse().map((log, i) => (
                        <div key={i} style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-sec)', background: 'var(--bg-subtle)', padding: '8px 12px', borderRadius: 8 }}>
                          <span style={{ fontWeight: 700, color: 'var(--primary)', flexShrink: 0 }}>{new Date(log.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                          <span style={{ fontWeight: 800 }}>{log.user}:</span>
                          <span>{log.action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer" style={{ justifyContent: 'space-between', padding: '20px 32px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', gap: 10 }}>
                {!isNew && (
                  <>
                    <button className="btn" style={{ color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.08)' }} onClick={handleDelete}>
                      <Trash2 size={16} /> Excluir
                    </button>
                    <button className="btn" style={{ color: 'var(--warning)', background: 'rgba(245, 158, 11, 0.08)' }} onClick={handleArchive}>
                      {modalTask?.isArchived ? 'Desarquivar' : 'Arquivar'}
                    </button>
                    
                    <button className="btn" style={{ background: 'rgba(37, 211, 102, 0.1)', color: '#25D366', fontWeight: 700 }} onClick={async () => {
                       const phone = prompt('Qual o WhatsApp do Cliente com DDD? (Ex: 5511999999999)');
                       if(!phone) return;
                       try {
                          await apiFetch('/api/whatsapp/send', {
                             method: 'POST',
                             body: JSON.stringify({
                                to: phone,
                                text: `Atenção: O ticket *${modalTask?.title}* necessita de sua avaliação ou aprovação para prosseguir no fluxo.\n\n_Mensagem Automática: Magister Hub_`
                             })
                          });
                          alert('Notificação de aprovação enviada com sucesso no WhatsApp!');
                       } catch(err) {
                          alert('Falha ao enviar notificação. Confirme se o bot remoto do WhatsApp está ativo.');
                       }
                    }}>
                       <Send size={16} /> Enviar Aprovação Whats
                    </button>
                  </>
                )}
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-ghost" onClick={() => { setModalTask(null); setTargetColId(null); }}>Cancelar</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={!form.title} style={{ padding: '0 24px', height: 42 }}>
                   {isNew ? <><CheckCircle size={16} /> Emitir Ticket</> : <><CheckCircle size={16} /> Salvar Ticket</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
