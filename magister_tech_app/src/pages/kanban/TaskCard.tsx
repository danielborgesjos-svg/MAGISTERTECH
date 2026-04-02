import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Clock } from 'lucide-react';

export function TaskCard({ task, isOverlay = false }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: task.id,
    data: { type: 'Task', task }
  });

  const getPriorityColor = (p: string) => {
    if (p === 'high') return 'var(--danger)';
    if (p === 'medium') return 'var(--warning)';
    return 'var(--success)';
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  if (isOverlay) {
    style.opacity = 1;
    style.transform = undefined; // Overlay handles its own positioning
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`task-card ${isOverlay ? 'is-overlay' : ''}`}
    >
      <div 
        style={{ 
          width: '32px', height: '4px', borderRadius: '4px', 
          background: getPriorityColor(task.priority), 
          position: 'absolute', top: '16px', right: '16px' 
        }}
      />
      
      <span className="task-tag">{task.tag}</span>
      
      <h4 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '16px', lineHeight: 1.4, paddingRight: '24px' }}>
        {task.title}
      </h4>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> Hoje</span>
        </div>
        <div className="task-avatar">{task.assignee}</div>
      </div>

      <style>{`
        .task-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-light);
          border-radius: 8px;
          padding: 16px;
          position: relative;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .task-card:hover { border-color: var(--primary-light); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .is-overlay { box-shadow: 0 12px 24px rgba(0,0,0,0.15); transform: scale(1.05) !important; cursor: grabbing; border-color: var(--primary) }
        .task-tag {
          display: inline-block; padding: 2px 8px; background: rgba(0, 82, 204, 0.1); 
          color: var(--primary); border-radius: 4px; font-size: 11px; font-weight: 600; margin-bottom: 12px;
        }
        .task-avatar {
          width: 24px; height: 24px; border-radius: 50%; background: var(--accent); color: #fff; 
          font-size: 10px; display: flex; alignItems: center; justify-content: center; font-weight: 700;
        }
        .dark-mode .task-card { background: var(--bg-color); }
      `}</style>
    </div>
  );
}
