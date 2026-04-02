import { useState, useEffect } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  PointerSensor, 
  useSensor, 
  useSensors,
} from '@dnd-kit/core';
import type {
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { 
  defaultDropAnimationSideEffects 
} from '@dnd-kit/core';
import { 
  SortableContext, 
  arrayMove, 
  horizontalListSortingStrategy 
} from '@dnd-kit/sortable';
// @ts-ignore
import { BoardColumn } from './kanban/BoardColumn';
// @ts-ignore
import { TaskCard } from './kanban/TaskCard';

const initialPipelineData = {
  columns: [
    {
      id: 'lead',
      title: 'Novos Leads',
      tasks: [
        { id: 'deal-1', title: 'Consultoria Luxon', value: 15000, tag: 'Serviços', priority: 'high', assignee: 'DB' }
      ]
    },
    {
      id: 'negotiation',
      title: 'Em Negociação',
      tasks: [
        { id: 'deal-2', title: 'Projeto Eletroc v2', value: 45000, tag: 'Software', priority: 'medium', assignee: 'DB' }
      ]
    },
    {
      id: 'closed',
      title: 'Contrato Fechado',
      tasks: [
        { id: 'deal-3', title: 'Landing Page Cinepasse', value: 5000, tag: 'Design', priority: 'low', assignee: 'DB' }
      ]
    }
  ]
};

export default function Pipeline() {
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem('magister_pipeline');
    return saved ? JSON.parse(saved) : initialPipelineData;
  });

  const [activeDeal, setActiveDeal] = useState<any>(null);

  useEffect(() => {
    localStorage.setItem('magister_pipeline', JSON.stringify(data));
  }, [data]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const calculateColumnTotal = (column: any) => {
    return column.tasks.reduce((acc: number, curr: any) => acc + (curr.value || 0), 0);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'Task') {
      setActiveDeal(active.data.current.task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = active.id;
    const overId = over.id;
    if (activeId === overId) return;

    setBoardDataAction(activeId, overId, active, over);
  };

  const setBoardDataAction = (activeId: any, overId: any, active: any, over: any) => {
    const isActiveTask = active.data.current?.type === 'Task';
    const isOverTask = over.data.current?.type === 'Task';
    const isOverColumn = over.data.current?.type === 'Column';

    if (!isActiveTask) return;

    setData((prev: any) => {
      const activeColIdx = prev.columns.findIndex((c: any) => c.tasks.some((t: any) => t.id === activeId));
      let overColIdx = -1;

      if (isOverTask) {
        overColIdx = prev.columns.findIndex((c: any) => c.tasks.some((t: any) => t.id === overId));
      } else if (isOverColumn) {
        overColIdx = prev.columns.findIndex((c: any) => c.id === overId);
      }

      if (activeColIdx === -1 || overColIdx === -1) return prev;

      const newCols = [...prev.columns];
      const activeTasks = [...newCols[activeColIdx].tasks];
      const overTasks = [...newCols[overColIdx].tasks];
      
      const activeIdx = activeTasks.findIndex((t: any) => t.id === activeId);

      if (activeColIdx === overColIdx) {
        const overIdx = overTasks.findIndex((t: any) => t.id === overId);
        newCols[activeColIdx].tasks = arrayMove(activeTasks, activeIdx, overIdx);
      } else {
        const [item] = activeTasks.splice(activeIdx, 1);
        if (isOverTask) {
          const overIdx = overTasks.findIndex((t: any) => t.id === overId);
          overTasks.splice(overIdx, 0, item);
        } else {
          overTasks.push(item);
        }
        newCols[activeColIdx].tasks = activeTasks;
        newCols[overColIdx].tasks = overTasks;
      }

      return { ...prev, columns: newCols };
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.data.current?.type === 'Column') {
      const oldIdx = data.columns.findIndex((c: any) => c.id === active.id);
      const newIdx = data.columns.findIndex((c: any) => c.id === over.id);
      setData((prev: any) => ({ ...prev, columns: arrayMove(prev.columns, oldIdx, newIdx) }));
    }
    setActiveDeal(null);
  };

  const addDeal = (colId: string) => {
    const title = prompt('Nome da Oportunidade:');
    const value = Number(prompt('Valor (R$):') || 0);
    if (!title) return;
    setData((prev: any) => {
      const newCols = [...prev.columns];
      const idx = newCols.findIndex(c => c.id === colId);
      newCols[idx].tasks.push({ id: `deal-${Date.now()}`, title, value, tag: 'Lead', priority: 'medium', assignee: 'DB' });
      return { ...prev, columns: newCols };
    });
  };

  return (
    <div className="animate-fade-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Funil de Vendas (Pipeline)</h1>
          <p className="text-muted" style={{ fontSize: '14px' }}>Acompanhe o ROI e a conversão de leads em tempo real.</p>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        <div style={{ display: 'flex', gap: '24px', overflowX: 'auto', paddingBottom: '32px' }}>
          <SortableContext items={data.columns.map((c: any) => c.id)} strategy={horizontalListSortingStrategy}>
            {data.columns.map((col: any) => (
              <div key={col.id}>
                <div style={{ marginBottom: '12px', background: 'var(--primary)', color: 'white', padding: '12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
                   <span style={{fontWeight: 700}}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateColumnTotal(col))}</span>
                   <span style={{fontSize: '11px', opacity: 0.8}}>TOTAL</span>
                </div>
                <BoardColumn column={col} onAddTask={() => addDeal(col.id)} />
              </div>
            ))}
          </SortableContext>
        </div>
        <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } }) }}>
           {activeDeal ? <TaskCard task={activeDeal} isOverlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
