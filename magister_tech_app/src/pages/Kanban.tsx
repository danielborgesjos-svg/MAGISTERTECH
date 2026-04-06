import { useState, useContext } from 'react';
import {
  DndContext, DragOverlay, closestCorners, PointerSensor, KeyboardSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import type { DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, X, GripVertical, Calendar, Flag, User, CheckSquare, Square, Trash2, CheckCircle, Activity } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { AuthContext } from '../contexts/AuthContext';
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
      <div style={{ width: 300, background: 'var(--bg-subtle)', borderRadius: 16, display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 240px)', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div {...attributes} {...listeners} style={{ cursor: 'grab', color: 'var(--text-light)' }}>
              <GripVertical size={16} />
            </div>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: col.color || 'var(--primary)', flexShrink: 0, boxShadow: `0 0 10px ${col.color || 'var(--primary)'}` }} />
            <h4 style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{col.title}</h4>
            <span className="badge" style={{ fontSize: 10, background: 'var(--bg-subtle)', color: 'var(--text-main)', border: '1px solid var(--border)', marginLeft: 4 }}>{col.tasks.filter(t => !t.isArchived).length}</span>
          </div>
          <button className="btn-icon" style={{ width: 28, height: 28, background: 'var(--bg-subtle)' }} onClick={onAddTask}><Plus size={14} /></button>
        </div>

        <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
          <SortableContext items={taskIds}>
            {col.tasks.filter(t => !t.isArchived).map(task => (
              <TaskCard key={task.id} task={task} onClick={() => onEditTask(task)} />
            ))}
          </SortableContext>
          {col.tasks.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-light)', border: '2px dashed var(--border)', borderRadius: 12 }}>
               <CheckSquare size={24} style={{ opacity: 0.3, marginBottom: 8 }}/>
               <p style={{ fontSize: 13, fontWeight: 600 }}>Nenhum ticket</p>
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
        <div className="modal-overlay" onClick={() => { setModalTask(null); setTargetColId(null); }}>
          <div className="modal modal-xl" style={{ maxWidth: 640, padding: 0 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ padding: '24px 32px', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                 <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckSquare size={24} color="var(--primary)"/>
                 </div>
                 <div>
                    <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>{isNew ? 'Emissão de Novo Ticket' : 'Detalhamento do Ticket'}</h2>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Crie ou edite subtarefas associadas à produção.</p>
                 </div>
              </div>
              <button className="btn-icon" style={{ background: 'var(--bg-card)' }} onClick={() => { setModalTask(null); setTargetColId(null); }}><X size={18} /></button>
            </div>

            <div className="modal-body" style={{ padding: 32, maxHeight: '60vh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label className="form-label" style={{ fontWeight: 800 }}>Título / Resumo da Tarefa *</label>
                  <input className="input" style={{ fontSize: 16, fontWeight: 700 }} placeholder="Ex: Desenvolver fluxo de checkout" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
                </div>
                
                <div>
                  <label className="form-label">Departamento (Tag)</label>
                  <select className="input" value={form.tag} onChange={e => setForm(p => ({ ...p, tag: e.target.value }))}>
                    {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Nível de Severidade</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {(Object.keys(PRIORITY_CONFIG) as Task['priority'][]).map(k => {
                      const cfg = PRIORITY_CONFIG[k];
                      return (
                        <button key={k} onClick={() => setForm(p => ({ ...p, priority: k }))}
                          style={{ flex: 1, padding: '10px 4px', fontSize: 11, fontWeight: 800, borderRadius: 8, border: `1.5px solid ${form.priority === k ? cfg.color : 'var(--border)'}`, background: form.priority === k ? cfg.bg : 'var(--bg-card)', color: form.priority === k ? cfg.color : 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s' }}>
                          <Flag size={12} style={{ display: 'inline', marginRight: 4, marginBottom: -2 }}/> {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="form-label"><User size={13} style={{ display: 'inline', marginBottom: -2 }} /> Responsável (Owner)</label>
                  <select className="input" value={form.assignee} onChange={e => setForm(p => ({ ...p, assignee: e.target.value }))}>
                    {team.map(m => <option key={m.id} value={m.initials}>{m.name}</option>)}
                    <option value={user?.name?.substring(0, 2).toUpperCase() || 'ME'}>Atribuir a mim</option>
                  </select>
                </div>
                <div>
                  <label className="form-label"><Calendar size={13} style={{ display: 'inline', marginBottom: -2 }} /> Prazo Limite (SLA)</label>
                  <input className="input" type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} />
                </div>

                <div style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Descrição Técnica e Contexto</label>
                  <textarea className="input" rows={4} style={{ resize: 'vertical' }} placeholder="Insira links, credenciais, briefings ou notas adicionais..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                </div>

                {/* Checklist */}
                <div style={{ gridColumn: '1/-1', background: 'var(--bg-subtle)', padding: 20, borderRadius: 12, border: '1px solid var(--border)' }}>
                  <label className="form-label" style={{ fontWeight: 800 }}><CheckSquare size={14} style={{ display: 'inline', marginBottom: -2 }}/> Passos de Execução (Checklist)</label>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                    <input className="input" placeholder="Novo passo executável..." value={checklistInput} onChange={e => setChecklistInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addChecklistItem()} />
                    <button className="btn btn-primary" onClick={addChecklistItem}><Plus size={16} /> Incluir</button>
                  </div>
                  {form.checklist.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {form.checklist.map(item => (
                        <div key={item.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--bg-card)' }}>
                          <button onClick={() => toggleChecklistItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: item.done ? 'var(--success)' : 'var(--text-muted)', flexShrink: 0, display: 'flex' }}>
                            {item.done ? <CheckSquare size={20} /> : <Square size={20} />}
                          </button>
                          <span style={{ fontSize: 14, fontWeight: item.done ? 600 : 700, textDecoration: item.done ? 'line-through' : 'none', color: item.done ? 'var(--text-muted)' : 'var(--text-main)', flex: 1 }}>{item.text}</span>
                          <button className="btn-icon" onClick={() => setForm(p => ({ ...p, checklist: p.checklist.filter(c => c.id !== item.id) }))} style={{ width: 28, height: 28, color: 'var(--danger)' }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Histórico/Log */}
                {!isNew && modalTask?.logs && (
                  <div style={{ gridColumn: '1/-1', borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                    <label className="form-label" style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Activity size={14} /> Histórico de Atividades
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                      {modalTask.logs.slice().reverse().map((log, i) => (
                        <div key={i} style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-sec)' }}>
                          <span style={{ fontWeight: 700, color: 'var(--primary)', minWidth: 40 }}>{new Date(log.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                          <span style={{ fontWeight: 800 }}>{log.user}:</span>
                          <span>{log.action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer" style={{ justifyContent: 'space-between', padding: '24px 32px', background: 'var(--bg-card)' }}>
              <div style={{ display: 'flex', gap: 10 }}>
                {!isNew && (
                  <>
                    <button className="btn btn-ghost" style={{ color: 'var(--danger)', fontWeight: 800 }} onClick={handleDelete}>
                      <Trash2 size={16} /> Excluir
                    </button>
                    <button className="btn btn-ghost" style={{ color: 'var(--warning)', fontWeight: 800 }} onClick={handleArchive}>
                      {modalTask?.isArchived ? 'Desarquivar' : 'Arquivar'}
                    </button>
                  </>
                )}
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-ghost" onClick={() => { setModalTask(null); setTargetColId(null); }}>Cancelar</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={!form.title} style={{ padding: '10px 24px' }}>
                   {isNew ? <><CheckCircle size={16} /> Emitir Ticket</> : <><CheckCircle size={16} /> Salvar Alterações</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
