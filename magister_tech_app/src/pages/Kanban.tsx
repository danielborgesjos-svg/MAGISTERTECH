import { useState, useEffect, useContext } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
} from '@dnd-kit/core';
import type {
  DragStartEvent,
  DragOverEvent,
  DragEndEvent
} from '@dnd-kit/core';
import { 
  SortableContext, 
  arrayMove, 
  sortableKeyboardCoordinates, 
  horizontalListSortingStrategy 
} from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
// @ts-ignore
import { BoardColumn } from './kanban/BoardColumn';
// @ts-ignore
import { TaskCard } from './kanban/TaskCard';
// @ts-ignore
import { initialBoardData } from './kanban/mockData';

// Componente Wrapper para permitir o drag
export default function Kanban() {
  const { user } = useContext(AuthContext);
  const [boardData, setBoardData] = useState(() => {
    const saved = localStorage.getItem('magister_kanban');
    return saved ? JSON.parse(saved) : initialBoardData;
  });

  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<any>(null);

  useEffect(() => {
    localStorage.setItem('magister_kanban', JSON.stringify(boardData));
  }, [boardData]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const columns = boardData.columns;
  const columnIds = columns.map((c: any) => c.id);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    if (active.data.current?.type === 'Task') {
      setActiveTask(active.data.current.task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = active.id;
    const overId = over.id;
    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === 'Task';
    const isOverTask = over.data.current?.type === 'Task';
    const isOverColumn = over.data.current?.type === 'Column';

    if (!isActiveTask) return;

    // Moving tasks between columns
    if (isActiveTask && isOverTask) {
      setBoardData((prev: any) => {
        const activeColumnIndex = prev.columns.findIndex((col: any) => col.tasks.some((t: any) => t.id === activeId));
        const overColumnIndex = prev.columns.findIndex((col: any) => col.tasks.some((t: any) => t.id === overId));
        
        if (activeColumnIndex === -1 || overColumnIndex === -1) return prev;
        
        const newCols = [...prev.columns];
        const activeTasks = [...newCols[activeColumnIndex].tasks];
        const overTasks = [...newCols[overColumnIndex].tasks];
        
        const activeTaskIndex = activeTasks.findIndex((t: any) => t.id === activeId);
        const overTaskIndex = overTasks.findIndex((t: any) => t.id === overId);

        if (activeColumnIndex === overColumnIndex) {
          newCols[activeColumnIndex].tasks = arrayMove(activeTasks, activeTaskIndex, overTaskIndex);
        } else {
          const [movedTask] = activeTasks.splice(activeTaskIndex, 1);
          overTasks.splice(overTaskIndex, 0, movedTask);
          newCols[activeColumnIndex].tasks = activeTasks;
          newCols[overColumnIndex].tasks = overTasks;
        }

        return { ...prev, columns: newCols };
      });
    }

    if (isActiveTask && isOverColumn) {
      setBoardData((prev: any) => {
        const activeColumnIndex = prev.columns.findIndex((col: any) => col.tasks.some((t: any) => t.id === activeId));
        const overColumnIndex = prev.columns.findIndex((col: any) => col.id === overId);
        
        if (activeColumnIndex === -1 || overColumnIndex === -1) return prev;
        if (activeColumnIndex === overColumnIndex) return prev;

        const newCols = [...prev.columns];
        const activeTasks = [...newCols[activeColumnIndex].tasks];
        const overTasks = [...newCols[overColumnIndex].tasks];

        const activeTaskIndex = activeTasks.findIndex((t: any) => t.id === activeId);
        const [movedTask] = activeTasks.splice(activeTaskIndex, 1);
        overTasks.push(movedTask);

        newCols[activeColumnIndex].tasks = activeTasks;
        newCols[overColumnIndex].tasks = overTasks;

        return { ...prev, columns: newCols };
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) {
      setActiveId(null);
      setActiveTask(null);
      return;
    }

    // Reordenar Colunas
    if (active.data.current?.type === 'Column' && over.data.current?.type === 'Column') {
      if (active.id !== over.id) {
        setBoardData((prev: any) => {
          const oldIndex = prev.columns.findIndex((c: any) => c.id === active.id);
          const newIndex = prev.columns.findIndex((c: any) => c.id === over.id);
          const newCols = arrayMove(prev.columns, oldIndex, newIndex);
          return { ...prev, columns: newCols };
        });
      }
    }

    setActiveId(null);
    setActiveTask(null);
  };

  const addColumn = () => {
    const title = prompt('Nome do novo Quadro/Coluna:');
    if (!title) return;
    setBoardData((prev: any) => ({
      ...prev,
      columns: [...prev.columns, { id: `col-${Date.now()}`, title, tasks: [] }]
    }));
  };

  const addTask = (colId: string) => {
    const title = prompt('Título da Tarefa:');
    if (!title) return;
    const tag = prompt('Tag (Ex: Design, Dev, Admin):') || 'Task';
    setBoardData((prev: any) => {
      const newCols = [...prev.columns];
      const colIndex = newCols.findIndex((c: any) => c.id === colId);
      if (colIndex !== -1) {
        newCols[colIndex].tasks.push({
          id: `task-${Date.now()}`,
          title,
          tag,
          priority: 'medium',
          assignee: user?.name.substring(0, 2).toUpperCase() || 'ME'
        });
      }
      return { ...prev, columns: newCols };
    });
  };

  return (
    <div className="animate-fade-up kanban-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Projetos & Kanban</h1>
          <p className="text-muted" style={{ fontSize: '14px' }}>Trello Engine: Arraste cartões ou colunas.</p>
        </div>
        <button onClick={addColumn} className="btn-quick-action primary-glow" style={{ padding: '8px 16px', fontSize: '13px' }}>
          <Plus size={16} /> Adicionar Quadro
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div style={{ display: 'flex', overflowX: 'auto', gap: '24px', paddingBottom: '32px', minHeight: 'calc(100vh - 200px)' }}>
          <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
            {columns.map((col: any) => (
              <BoardColumn 
                key={col.id} 
                column={col} 
                onAddTask={() => addTask(col.id)}
              />
            ))}
          </SortableContext>
        </div>

        {/* Overlay do que está sendo arrastado */}
        <DragOverlay>
          {activeId && activeTask ? (
            <TaskCard task={activeTask} isOverlay />
          ) : activeId ? (
            <div style={{ width: '300px', height: '100px', background: 'var(--primary)', opacity: 0.8, borderRadius: '8px' }}></div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
