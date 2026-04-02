import { useSortable } from '@dnd-kit/sortable';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MoreHorizontal, Plus } from 'lucide-react';
import { TaskCard } from './TaskCard';

export function BoardColumn({ column, onAddTask }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: column.id,
    data: { type: 'Column', column }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const taskIds = column.tasks.map((t: any) => t.id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="board-column"
    >
      <div 
        {...attributes} 
        {...listeners} 
        style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'grab', borderBottom: '1px solid var(--border-light)' }}
      >
        <h3 style={{ fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          {column.title}
          <span className="badge">{column.tasks.length}</span>
        </h3>
        <button className="btn-icon-small"><MoreHorizontal size={16} /></button>
      </div>

      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {column.tasks.map((task: any) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </SortableContext>
        
        <button onClick={onAddTask} className="add-task-btn">
          <Plus size={16} /> Adicionar Tarefa
        </button>
      </div>

      <style>{`
        .board-column {
          min-width: 320px;
          width: 320px;
          background: var(--bg-surface);
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          border: 1px solid var(--border-light);
          box-shadow: var(--shadow-subtle);
        }
        .badge {
          background: var(--bg-subtle);
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
        }
        .add-task-btn {
          width: 100%; padding: 12px; background: transparent; border: 1px dashed var(--border-light);
          border-radius: 8px; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 500; font-size: 13px; transition: 0.2s;
        }
        .add-task-btn:hover { background: rgba(0,82,204,0.05); color: var(--primary); border-color: rgba(0,82,204,0.3); }
        .btn-icon-small { background: transparent; border: none; cursor: pointer; color: var(--text-muted); }
      `}</style>
    </div>
  );
}
