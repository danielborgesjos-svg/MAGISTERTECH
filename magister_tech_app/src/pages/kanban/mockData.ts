export const initialBoardData = {
  columns: [
    {
      id: 'backlog',
      title: 'Backlog / Fila',
      tasks: [
        { id: 'task-1', title: 'Layout UI Home', tag: 'Design', priority: 'medium', assignee: 'DB' },
        { id: 'task-2', title: 'Migrar BD pra Postgres', tag: 'Backend', priority: 'high', assignee: 'DB' }
      ]
    },
    {
      id: 'doing',
      title: 'Em Andamento',
      tasks: [
        { id: 'task-3', title: 'API de Usuarios', tag: 'Backend', priority: 'high', assignee: 'DB' }
      ]
    },
    {
      id: 'done',
      title: 'Concluído',
      tasks: [
        { id: 'task-4', title: 'Setup do Repositório', tag: 'DevOps', priority: 'low', assignee: 'DB' }
      ]
    }
  ]
};
