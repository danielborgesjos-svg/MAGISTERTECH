import { useState } from 'react';
import {
  DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import type { DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus, X, GripVertical, TrendingUp, Trash2, CheckCircle, Flame, Building2, User, DollarSign, AlignLeft, Tags, ArrowRight
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import type { Task, KanbanColumn } from '../contexts/DataContext';

const fmt = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

const PRIORITY_CONFIG = {
  low: { label: 'Frio (Cold)', color: 'var(--text-muted)', bg: 'var(--bg-card)' },
  medium: { label: 'Em Aquecimento', color: 'var(--warning)', bg: 'var(--warning-glow)' },
  high: { label: 'Quente (Hot)', color: 'var(--danger)', bg: 'var(--danger-glow)' },
  urgent: { label: 'Fechamento Imediato', color: 'var(--success)', bg: 'var(--success-glow)' },
};

// ─── DEAL CARD ─────────────────────────────────────────────────────────────
function DealCard({ task, isOverlay, onEdit }: { task: Task; isOverlay?: boolean; onEdit: (t: Task) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'Task', task },
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const pCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  return (
    <div ref={setNodeRef} style={style}>
      <div className="card" style={{ padding: '16px', opacity: isOverlay ? 0.85 : 1, cursor: 'pointer', borderLeft: `4px solid ${pCfg.color}`, marginBottom: 12 }} onClick={() => onEdit(task)}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 16 }}>
          <div {...attributes} {...listeners} style={{ cursor: 'grab', color: 'var(--text-light)', paddingTop: 2, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
            <GripVertical size={16} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 800, fontSize: 13, color: 'var(--text-main)', marginBottom: 6, lineHeight: 1.4 }}>{task.title}</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span className="badge" style={{ fontSize: 10, background: 'var(--bg-subtle)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>{task.tag}</span>
              <span className="badge" style={{ fontSize: 10, background: pCfg.bg, color: pCfg.color, fontWeight: 700 }}><Flame size={10}/> {pCfg.label}</span>
            </div>
          </div>
        </div>
        
        {task.description && (
          <p style={{ fontSize: 12, color: 'var(--text-sec)', marginBottom: 16, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{task.description}</p>
        )}

        <div style={{ paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
             <div className="avatar" title={task.assignee} style={{ width: 24, height: 24, fontSize: 10, fontWeight: 800, background: `hsl(${(task.assignee || 'X').charCodeAt(0) * 30}, 60%, 50%)`, color: '#fff' }}>
                {task.assignee}
             </div>
             <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Proprietário</span>
          </div>
          {(task.value || 0) > 0 && (
             <span style={{ fontSize: 15, fontWeight: 900, color: 'var(--success)' }}>{fmt(task.value || 0)}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PIPELINE COLUMN ────────────────────────────────────────────────────────
function PipelineColumn({ col, total, onAddDeal, onEdit }: {
  col: { id: string; title: string; tasks: Task[]; color?: string };
  total: number;
  onAddDeal: () => void;
  onEdit: (t: Task) => void;
}) {
  const { attributes, listeners, setNodeRef: setColumnRef, transform, transition, isDragging } = useSortable({
    id: col.id,
    data: { type: 'Column' },
  });
  const colStyle = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  const taskIds = col.tasks.map(t => t.id);

  return (
    <div ref={setColumnRef} style={{ ...colStyle, minWidth: 320, width: 320, display: 'flex', flexDirection: 'column' }}>
      
      {/* HEADER DE VALOR */}
      <div style={{ background: `linear-gradient(135deg, ${col.color || 'var(--primary)'} 0%, ${col.color || 'var(--indigo)'}cc 100%)`, borderRadius: '16px 16px 0 0', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: `0 4px 20px ${col.color || 'var(--primary)'}40`, position: 'relative', zIndex: 2 }}>
        <div {...attributes} {...listeners} style={{ cursor: 'grab', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center' }}>
          <GripVertical size={18} />
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>{fmt(total)}</p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>Volume Projetado</p>
        </div>
      </div>

      {/* CORPO DA COLUNA */}
      <div style={{ background: 'var(--bg-subtle)', borderRadius: '0 0 16px 16px', border: '1px solid var(--border)', borderTop: 'none', display: 'flex', flexDirection: 'column', flex: 1, maxHeight: 'calc(100vh - 270px)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
           <div>
             <h4 style={{ fontSize: 14, fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-main)', letterSpacing: '0.05em' }}>{col.title}</h4>
             <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{col.tasks.length} negócios listados</p>
           </div>
           <button className="btn-icon" style={{ width: 32, height: 32, background: 'var(--bg-subtle)' }} onClick={onAddDeal}>
             <Plus size={16} />
           </button>
        </div>

        <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
          <SortableContext items={taskIds}>
            {col.tasks.map(task => (
              <DealCard key={task.id} task={task} onEdit={onEdit} />
            ))}
          </SortableContext>
          {col.tasks.length === 0 && (
            <div style={{ textAlign: 'center', padding: '30px 0', border: '2px dashed var(--border)', borderRadius: 12 }}>
              <TrendingUp size={24} style={{ color: 'var(--text-light)', marginBottom: 8, opacity: 0.5 }}/>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>Pipeline Vazio</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ─── MAIN PIPELINE ──────────────────────────────────────────────────────────
export default function Pipeline() {
  const { pipeline, setPipeline, addPipelineDeal, updatePipelineDeal } = useData();
  const [activeDeal, setActiveDeal] = useState<Task | null>(null);
  const [modalDeal, setModalDeal] = useState<Task | null>(null);
  const [showAddForm, setShowAddForm] = useState<string | null>(null); // column id
  const [form, setForm] = useState({ title: '', value: '', tag: 'Lead', priority: 'medium' as Task['priority'], description: '', assignee: 'DB' });
  const [isEdit, setIsEdit] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const totalPipeline = pipeline.reduce((a, c) => a + c.tasks.reduce((sa, t) => sa + (t.value || 0), 0), 0);

  const handleDragStart = (e: DragStartEvent) => {
    if (e.active.data.current?.type === 'Task') setActiveDeal(e.active.data.current.task);
  };

  const moveTask = (activeId: string, overId: string, active: any, over: any) => {
    const isActiveTask = active.data.current?.type === 'Task';
    const isOverTask = over.data.current?.type === 'Task';
    const isOverColumn = over.data.current?.type === 'Column';
    if (!isActiveTask) return;

    setPipeline((prev: KanbanColumn[]) => {
      const cols = prev.map(c => ({ ...c, tasks: [...c.tasks] }));
      const activeColIdx = cols.findIndex(c => c.tasks.some(t => t.id === activeId));
      let overColIdx = -1;
      if (isOverTask) overColIdx = cols.findIndex(c => c.tasks.some(t => t.id === overId));
      else if (isOverColumn) overColIdx = cols.findIndex(c => c.id === overId);
      if (activeColIdx === -1 || overColIdx === -1) return prev;
      const activeIdx = cols[activeColIdx].tasks.findIndex(t => t.id === activeId);
      const [item] = cols[activeColIdx].tasks.splice(activeIdx, 1);
      if (isOverTask) {
        const overIdx = cols[overColIdx].tasks.findIndex(t => t.id === overId);
        cols[overColIdx].tasks.splice(overIdx, 0, item);
      } else {
        cols[overColIdx].tasks.push(item);
      }
      return cols;
    });
  };

  const handleDragOver = (e: DragOverEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    moveTask(active.id as string, over.id as string, active, over);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (over && active.data.current?.type === 'Column') {
      const oldIdx = pipeline.findIndex(c => c.id === active.id);
      const newIdx = pipeline.findIndex(c => c.id === over.id);
      if (oldIdx !== newIdx) setPipeline(arrayMove(pipeline, oldIdx, newIdx));
    }
    setActiveDeal(null);
  };

  const openEdit = (task: Task) => {
    setModalDeal(task);
    setForm({ title: task.title, value: String(task.value || ''), tag: task.tag, priority: task.priority, description: task.description || '', assignee: task.assignee });
    setIsEdit(true);
    setShowAddForm(null);
  };

  const openAdd = (colId: string) => {
    setShowAddForm(colId);
    setModalDeal(null);
    setIsEdit(false);
    setForm({ title: '', value: '', tag: 'Lead', priority: 'medium', description: '', assignee: 'DB' });
  };

  const handleSave = () => {
    if (!form.title) return;
    if (isEdit && modalDeal) {
      updatePipelineDeal(modalDeal.id, { title: form.title, value: parseFloat(form.value) || 0, tag: form.tag, priority: form.priority, description: form.description, assignee: form.assignee });
      setModalDeal(null);
    } else if (showAddForm) {
      addPipelineDeal(showAddForm, { title: form.title, value: parseFloat(form.value) || 0, tag: form.tag, priority: form.priority, description: form.description, assignee: form.assignee });
      setShowAddForm(null);
    }
  };

  const handleDeleteDeal = () => {
    if (!modalDeal) return;
    if (confirm('Deseja realmente remover esta oportunidade e perder o tracking?')) {
      setPipeline((prev: KanbanColumn[]) => prev.map(c => ({ ...c, tasks: c.tasks.filter(t => t.id !== modalDeal.id) })));
      setModalDeal(null);
    }
  };

  return (
    <div className="animate-fade-up" style={{ paddingBottom: 40 }}>
      {/* ─── HEADER COCKPIT ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 100, fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <TrendingUp size={12} color="var(--success)" /> Pipeline · Máquina de Fechamento
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-main)', margin: 0, lineHeight: 1.1 }}>
            Funil Comercial
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8 }}>
             Acompanhe leads, qualificação, propostas em aberto e fechamentos.
          </p>
        </div>
        <div className="card" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16, borderTop: '3px solid var(--success)' }}>
           <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--success-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={24} color="var(--success)" />
           </div>
           <div>
             <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Forecast & Pipeline Oportunidades</p>
             <p style={{ fontSize: 24, fontWeight: 900, color: 'var(--success)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{fmt(totalPipeline)}</p>
           </div>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div style={{ display: 'flex', gap: 24, overflowX: 'auto', paddingBottom: 32, minHeight: 'calc(100vh - 220px)', alignItems: 'flex-start' }}>
          <SortableContext items={pipeline.map(c => c.id)} strategy={horizontalListSortingStrategy}>
            {pipeline.map(col => (
              <PipelineColumn
                key={col.id}
                col={col}
                total={col.tasks.reduce((a, t) => a + (t.value || 0), 0)}
                onAddDeal={() => openAdd(col.id)}
                onEdit={openEdit}
              />
            ))}
          </SortableContext>
        </div>
        <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } }) }}>
          {activeDeal ? <div style={{ transform: 'rotate(2deg)' }}><DealCard task={activeDeal} isOverlay onEdit={() => { }} /></div> : null}
        </DragOverlay>
      </DndContext>

      {/* ─── ADD / EDIT DEAL MODAL PREMIUM ────────────────────────── */}
      {(showAddForm || (isEdit && modalDeal)) && (
        <div className="modal-overlay" onClick={() => { setShowAddForm(null); setModalDeal(null); }}>
          <div className="modal modal-xl" style={{ maxWidth: 640, padding: 0 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ padding: '24px 32px', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                 <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--success-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <DollarSign size={24} color="var(--success)"/>
                 </div>
                 <div>
                    <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>{isEdit ? 'Atualizar Negociação' : 'Nova Oportunidade no Funil'}</h2>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Cadastre o lead, classifique o valor e monitore o negócio.</p>
                 </div>
              </div>
              <button className="btn-icon" style={{ background: 'var(--bg-card)' }} onClick={() => { setShowAddForm(null); setModalDeal(null); }}><X size={18} /></button>
            </div>
            
            <div className="modal-body" style={{ padding: 32, maxHeight: '60vh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label className="form-label" style={{ fontWeight: 800 }}>Mapeamento / Nome da Oportunidade (Empresa) *</label>
                  <input className="input" style={{ fontSize: 16, fontWeight: 700 }} placeholder="Ex: Projeto Sistema Clínico Holozonic" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
                </div>
                
                <div>
                  <label className="form-label" style={{ fontWeight: 800, color: 'var(--success)' }}>Valor Total Estimado / Forecast (R$)</label>
                  <div style={{ position: 'relative' }}>
                     <DollarSign size={16} color="var(--success)" style={{ position: 'absolute', top: 12, left: 12 }}/>
                     <input className="input" type="number" style={{ paddingLeft: 36, fontSize: 16, fontWeight: 700, color: 'var(--success)' }} placeholder="0,00" value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} />
                  </div>
                </div>

                <div>
                  <label className="form-label"><ArrowRight size={13} style={{ display: 'inline', marginBottom: -2 }}/> Proprietário da Conta (Closer)</label>
                  <div style={{ position: 'relative' }}>
                     <User size={16} color="var(--text-muted)" style={{ position: 'absolute', top: 12, left: 12 }}/>
                     <input className="input" style={{ paddingLeft: 36 }} placeholder="Iniciais (ex: DB)" value={form.assignee} onChange={e => setForm(p => ({ ...p, assignee: e.target.value }))} />
                  </div>
                </div>

                <div style={{ gridColumn: '1/-1' }}>
                   <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: 0.5, borderBottom: '1px solid var(--border)', paddingBottom: 8, marginTop: 8 }}>Métricas e Status da Venda</p>
                </div>

                <div>
                  <label className="form-label"><Tags size={13} style={{ display: 'inline', marginBottom: -2 }}/> Serviço Requerido / Tag</label>
                  <select className="input" value={form.tag} onChange={e => setForm(p => ({ ...p, tag: e.target.value }))}>
                    {['Lead Cru', 'Site Institucional', 'Software / SaaS', 'Design UI/UX', 'Marketing B2B', 'Tráfego Pago', 'E-commerce', 'MVP', 'Consultoria Tech'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label"><Flame size={13} style={{ display: 'inline', marginBottom: -2 }}/> Temperatura do Lead (Qualidade)</label>
                  <select className="input" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value as Task['priority'] }))}>
                    <option value="low">Frio (Apenas curiosidade)</option>
                    <option value="medium">Em Aquecimento (MQL)</option>
                    <option value="high">Quente (Hot / SQL)</option>
                    <option value="urgent">Fechamento Imediato</option>
                  </select>
                </div>

                <div style={{ gridColumn: '1/-1', marginTop: 8 }}>
                  <label className="form-label"><AlignLeft size={13} style={{ display: 'inline', marginBottom: -2 }}/> Notas Estratégicas / Reunião</label>
                  <textarea className="input" rows={4} style={{ resize: 'vertical' }} placeholder="Descreva as dores, orçamentos limitantes do cliente, próximos passos..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ justifyContent: isEdit ? 'space-between' : 'flex-end', padding: '24px 32px', background: 'var(--bg-card)' }}>
              {isEdit && (
                <button className="btn btn-ghost" style={{ color: 'var(--danger)', fontWeight: 800 }} onClick={handleDeleteDeal}>
                  <Trash2 size={16} /> Excluir Oportunidade (Lost)
                </button>
              )}
              <div style={{ display: 'flex', gap: 12, marginLeft: !isEdit ? 'auto' : 0 }}>
                <button className="btn btn-ghost" onClick={() => { setShowAddForm(null); setModalDeal(null); }}>Cancelar</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={!form.title} style={{ padding: '10px 24px' }}>
                  {isEdit ? <><CheckCircle size={16} /> Salvar Ficha Comercial</> : <><CheckCircle size={16} /> Injetar no Pipeline</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
