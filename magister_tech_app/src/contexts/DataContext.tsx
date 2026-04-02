import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  segment: string;
  status: 'ativo' | 'inativo' | 'prospect';
  origin: string;
  createdAt: string;
  lastContact: string;
  notes: Note[];
}

export interface Note {
  id: string;
  text: string;
  createdAt: string;
  author: string;
}

export interface Contract {
  id: string;
  title: string;
  clientId: string;
  value: number;
  startDate: string;
  endDate: string;
  recurrence: 'mensal' | 'anual' | 'unico';
  status: 'ativo' | 'vencendo' | 'encerrado';
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  clientId: string;
  type: string;
  status: 'ativo' | 'atrasado' | 'concluido' | 'pausado';
  progress: number;
  startDate: string;
  endDate: string;
  team: string[];
  budget: number;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  columnId: string;
  projectId?: string;
  assignee: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tag: string;
  dueDate?: string;
  checklist?: { id: string; text: string; done: boolean }[];
  value?: number;
}

export interface KanbanColumn {
  id: string;
  title: string;
  tasks: Task[];
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  status: 'pago' | 'pendente' | 'atrasado';
  recurrence?: 'mensal' | 'unico';
  contractId?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'reunião' | 'tarefa' | 'entrega' | 'conteúdo' | 'financeiro';
  location?: string;
  clientId?: string;
  projectId?: string;
  color: string;
}

export interface ContentPost {
  id: string;
  clientId: string;
  platform: string;
  date: string;
  caption: string;
  media?: string;
  status: 'ideia' | 'producao' | 'revisao' | 'aprovado' | 'publicado';
  createdAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  initials: string;
  role: string;
  sector: string;
  email: string;
  performance: number;
  tasksOpen: number;
  ratings: { stars: number; feedback: string; date: string }[];
}

export interface Alert {
  id: string;
  type: 'danger' | 'warning' | 'info' | 'purple';
  message: string;
  module: string;
  entityId?: string;
  createdAt: string;
}

// ─── INITIAL DATA ─────────────────────────────────────────────────────────────

const INITIAL_CLIENTS: Client[] = [];
const INITIAL_CONTRACTS: Contract[] = [];
const INITIAL_PROJECTS: Project[] = [];

const INITIAL_KANBAN: KanbanColumn[] = [
  { id: 'backlog', title: 'Backlog', tasks: [] },
  { id: 'todo', title: 'A Fazer', tasks: [] },
  { id: 'doing', title: 'Em Andamento', tasks: [] },
  { id: 'review', title: 'Revisão', tasks: [] },
  { id: 'approved', title: 'Aprovado', tasks: [] },
  { id: 'done', title: 'Entregue', tasks: [] },
];

const INITIAL_PIPELINE: KanbanColumn[] = [
  { id: 'lead', title: 'Novos Leads', tasks: [] },
  { id: 'contact', title: 'Contato Feito', tasks: [] },
  { id: 'proposal', title: 'Proposta Enviada', tasks: [] },
  { id: 'negotiation', title: 'Em Negociação', tasks: [] },
  { id: 'closed', title: 'Contrato Fechado', tasks: [] },
];

const INITIAL_TRANSACTIONS: Transaction[] = [];
const INITIAL_EVENTS: CalendarEvent[] = [];
const INITIAL_CONTENT: ContentPost[] = [];
const INITIAL_TEAM: TeamMember[] = [
  { id: 'tm1', name: 'Admin (Master)', initials: 'AD', role: 'admin', sector: 'Diretoria', email: 'admin@magistertech.com.br', performance: 5.0, tasksOpen: 0, ratings: [] }
];

export interface ChatChannel {
  id: string;
  name: string;
  icon: string;
  messages: { id: string; author: string; authorName: string; text: string; time: string; date: string }[];
}

const INITIAL_CHAT: { channels: ChatChannel[] } = {
  channels: [
    { id: 'geral', name: 'geral', icon: '#', messages: [] },
    { id: 'projetos', name: 'projetos', icon: '📁', messages: [] },
    { id: 'design', name: 'design', icon: '🎨', messages: [] },
    { id: 'financeiro', name: 'financeiro', icon: '💰', messages: [] },
  ]
};

// ─── CONTEXT DEFINITION ───────────────────────────────────────────────────────

interface DataContextType {
  clients: Client[];
  contracts: Contract[];
  projects: Project[];
  kanban: KanbanColumn[];
  pipeline: KanbanColumn[];
  transactions: Transaction[];
  events: CalendarEvent[];
  content: ContentPost[];
  team: TeamMember[];
  chat: typeof INITIAL_CHAT;
  alerts: Alert[];

  // Client actions
  addClient: (c: Omit<Client, 'id' | 'createdAt' | 'lastContact' | 'notes'>) => void;
  updateClient: (id: string, data: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  addClientNote: (clientId: string, text: string, author: string) => void;

  // Contract actions
  addContract: (c: Omit<Contract, 'id' | 'createdAt' | 'status'>) => void;
  updateContractStatus: (id: string, status: Contract['status']) => void;
  deleteContract: (id: string) => void;

  // Project actions
  addProject: (p: Omit<Project, 'id' | 'progress' | 'color'>) => void;
  updateProject: (id: string, data: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  // Kanban actions
  setKanban: (cols: KanbanColumn[]) => void;
  addTask: (colId: string, task: Omit<Task, 'id' | 'columnId'>) => void;

  // Pipeline actions
  setPipeline: (cols: KanbanColumn[]) => void;

  // Transaction actions
  addTransaction: (t: Omit<Transaction, 'id'>) => void;
  updateTransactionStatus: (id: string, status: Transaction['status']) => void;
  deleteTransaction: (id: string) => void;

  // Event actions
  addEvent: (e: Omit<CalendarEvent, 'id'>) => void;
  deleteEvent: (id: string) => void;

  // Content actions
  addContent: (c: Omit<ContentPost, 'id' | 'createdAt'>) => void;
  updateContentStatus: (id: string, status: ContentPost['status']) => void;
  deleteContent: (id: string) => void;

  // Team actions
  addTeamMember: (m: Omit<TeamMember, 'id' | 'performance' | 'tasksOpen' | 'ratings'>) => void;
  updateTeamMember: (id: string, data: Partial<TeamMember>) => void;
  deleteTeamMember: (id: string) => void;
  addTeamRating: (memberId: string, stars: number, feedback: string) => void;

  // Chat actions
  addMessage: (channelId: string, authorInitials: string, authorName: string, text: string) => void;

  // Computed helpers
  getClientById: (id: string) => Client | undefined;
  getProjectById: (id: string) => Project | undefined;
  getTodayEvents: () => CalendarEvent[];
  getOverdueTasks: () => Task[];
  getAtRiskProjects: () => Project[];
  getExpiringContracts: () => Contract[];
  getInactiveClients: () => Client[];
  getMonthRevenue: () => number;
  getMonthExpense: () => number;
  getBalance: () => number;
  getPendingReceivables: () => number;
  getPendingPayables: () => number;
}

export const DataContext = createContext<DataContextType>({} as DataContextType);
export const useData = () => useContext(DataContext);

// ─── PROVIDER ─────────────────────────────────────────────────────────────────

function load<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}

const save = (key: string, data: unknown) => {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* noop */ }
};

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [clients, setClients] = useState<Client[]>(() => load('mstr_clients', INITIAL_CLIENTS));
  const [contracts, setContracts] = useState<Contract[]>(() => load('mstr_contracts', INITIAL_CONTRACTS));
  const [projects, setProjects] = useState<Project[]>(() => load('mstr_projects', INITIAL_PROJECTS));
  const [kanban, setKanbanState] = useState<KanbanColumn[]>(() => load('mstr_kanban', INITIAL_KANBAN));
  const [pipeline, setPipelineState] = useState<KanbanColumn[]>(() => load('mstr_pipeline', INITIAL_PIPELINE));
  const [transactions, setTransactions] = useState<Transaction[]>(() => load('mstr_transactions', INITIAL_TRANSACTIONS));
  const [events, setEvents] = useState<CalendarEvent[]>(() => load('mstr_events', INITIAL_EVENTS));
  const [content, setContent] = useState<ContentPost[]>(() => load('mstr_content', INITIAL_CONTENT));
  const [team, setTeam] = useState<TeamMember[]>(() => load('mstr_team', INITIAL_TEAM));
  const [chat, setChat] = useState<typeof INITIAL_CHAT>(() => load('mstr_chat', INITIAL_CHAT));
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // Persist all state
  useEffect(() => { save('mstr_clients', clients); }, [clients]);
  useEffect(() => { save('mstr_contracts', contracts); }, [contracts]);
  useEffect(() => { save('mstr_projects', projects); }, [projects]);
  useEffect(() => { save('mstr_kanban', kanban); }, [kanban]);
  useEffect(() => { save('mstr_pipeline', pipeline); }, [pipeline]);
  useEffect(() => { save('mstr_transactions', transactions); }, [transactions]);
  useEffect(() => { save('mstr_events', events); }, [events]);
  useEffect(() => { save('mstr_content', content); }, [content]);
  useEffect(() => { save('mstr_team', team); }, [team]);
  useEffect(() => { save('mstr_chat', chat); }, [chat]);

  // ─── Alert Engine ─────────────────────────────────────────────────────────
  useEffect(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const newAlerts: Alert[] = [];

    // Overdue tasks
    const allTasks = kanban.flatMap(c => c.tasks);
    allTasks.filter(t => t.dueDate && t.dueDate < todayStr && t.priority !== 'low').forEach(t => {
      newAlerts.push({ id: `ot-${t.id}`, type: 'danger', message: `Tarefa atrasada: "${t.title}"`, module: 'kanban', entityId: t.id, createdAt: todayStr });
    });

    // At-risk projects
    projects.filter(p => p.status === 'atrasado').forEach(p => {
      newAlerts.push({ id: `rp-${p.id}`, type: 'warning', message: `Projeto em risco: "${p.name}"`, module: 'projetos', entityId: p.id, createdAt: todayStr });
    });

    // Expiring contracts (within 30 days)
    const in30 = new Date(today); in30.setDate(in30.getDate() + 30);
    const in30Str = in30.toISOString().split('T')[0];
    contracts.filter(c => c.endDate >= todayStr && c.endDate <= in30Str && c.status !== 'encerrado').forEach(c => {
      newAlerts.push({ id: `ec-${c.id}`, type: 'warning', message: `Contrato vencendo: "${c.title}"`, module: 'contratos', entityId: c.id, createdAt: todayStr });
    });

    // Overdue payments
    transactions.filter(t => t.status === 'atrasado').forEach(t => {
      newAlerts.push({ id: `op-${t.id}`, type: 'danger', message: `Pagamento atrasado: "${t.description}"`, module: 'financeiro', entityId: t.id, createdAt: todayStr });
    });

    // Inactive clients (7+ days)
    const in7 = new Date(today); in7.setDate(in7.getDate() - 7);
    const in7Str = in7.toISOString().split('T')[0];
    clients.filter(c => c.status === 'ativo' && c.lastContact < in7Str).forEach(c => {
      newAlerts.push({ id: `ic-${c.id}`, type: 'purple', message: `Cliente sem contato há 7+ dias: ${c.company}`, module: 'crm', entityId: c.id, createdAt: todayStr });
    });

    setAlerts(newAlerts);
  }, [kanban, projects, contracts, transactions, clients]);

  // ─── Client Actions ───────────────────────────────────────────────────────
  const addClient = useCallback((c: Omit<Client, 'id' | 'createdAt' | 'lastContact' | 'notes'>) => {
    const today = new Date().toISOString().split('T')[0];
    const newClient: Client = { ...c, id: `c${Date.now()}`, createdAt: today, lastContact: today, notes: [] };
    setClients(prev => [newClient, ...prev]);
  }, []);

  const updateClient = useCallback((id: string, data: Partial<Client>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  }, []);

  const deleteClient = useCallback((id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
  }, []);

  const addClientNote = useCallback((clientId: string, text: string, author: string) => {
    const note: Note = { id: `n${Date.now()}`, text, createdAt: new Date().toISOString(), author };
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, notes: [note, ...c.notes], lastContact: new Date().toISOString().split('T')[0] } : c));
  }, []);

  // ─── Contract Actions ─────────────────────────────────────────────────────
  const addContract = useCallback((c: Omit<Contract, 'id' | 'createdAt' | 'status'>) => {
    const today = new Date().toISOString().split('T')[0];
    const newContract: Contract = { ...c, id: `ct${Date.now()}`, createdAt: today, status: 'ativo' };
    setContracts(prev => [newContract, ...prev]);

    // AUTOMATION: Contract → Financial entry
    const client = clients.find(cl => cl.id === c.clientId);
    const newTrans: Transaction = {
      id: `tr${Date.now()}`,
      description: `${c.title} — ${client?.company || 'Cliente'}`,
      amount: c.value,
      type: 'income',
      category: 'Contratos',
      date: c.startDate,
      status: 'pendente',
      recurrence: c.recurrence === 'mensal' ? 'mensal' : 'unico',
      contractId: newContract.id,
    };
    setTransactions(prev => [newTrans, ...prev]);
  }, [clients]);

  const updateContractStatus = useCallback((id: string, status: Contract['status']) => {
    setContracts(prev => prev.map(c => c.id === id ? { ...c, status } : c));
  }, []);

  const deleteContract = useCallback((id: string) => {
    setContracts(prev => prev.filter(c => c.id !== id));
  }, []);

  // ─── Project Actions ──────────────────────────────────────────────────────
  const addProject = useCallback((p: Omit<Project, 'id' | 'progress' | 'color'>) => {
    const colors = ['#0052cc', '#ffab00', '#36b37e', '#7c3aed', '#ff5630', '#00b8d9'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const newProject: Project = { ...p, id: `proj${Date.now()}`, progress: 0, color };
    setProjects(prev => [newProject, ...prev]);

    // AUTOMATION: Project → Kanban column
    const newCol: KanbanColumn = {
      id: `col-${newProject.id}`,
      title: `📁 ${newProject.name}`,
      tasks: [
        { id: `task-auto-1-${Date.now()}`, title: 'Kickoff e briefing inicial', columnId: `col-${newProject.id}`, projectId: newProject.id, assignee: p.team[0] || 'DB', priority: 'high', tag: 'Planejamento' },
        { id: `task-auto-2-${Date.now()}`, title: 'Definição de escopo e cronograma', columnId: `col-${newProject.id}`, projectId: newProject.id, assignee: p.team[0] || 'DB', priority: 'medium', tag: 'Planejamento' },
      ]
    };
    setKanbanState(prev => [...prev, newCol]);

    // AUTOMATION: Project → Calendar event
    const newEvent: CalendarEvent = {
      id: `ev-proj-${Date.now()}`,
      title: `Início: ${newProject.name}`,
      date: p.startDate,
      time: '09:00',
      type: 'entrega',
      projectId: newProject.id,
      color: color,
    };
    setEvents(prev => [...prev, newEvent]);
  }, []);

  const updateProject = useCallback((id: string, data: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  }, []);

  const deleteProject = useCallback((id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  }, []);

  // ─── Kanban Actions ───────────────────────────────────────────────────────
  const setKanban = useCallback((cols: KanbanColumn[]) => setKanbanState(cols), []);
  const addTask = useCallback((colId: string, taskData: Omit<Task, 'id' | 'columnId'>) => {
    const task: Task = { ...taskData, id: `task-${Date.now()}`, columnId: colId };
    setKanbanState(prev => prev.map(c => c.id === colId ? { ...c, tasks: [...c.tasks, task] } : c));
  }, []);

  const setPipeline = useCallback((cols: KanbanColumn[]) => setPipelineState(cols), []);

  // ─── Transaction Actions ──────────────────────────────────────────────────
  const addTransaction = useCallback((t: Omit<Transaction, 'id'>) => {
    setTransactions(prev => [{ ...t, id: `tr${Date.now()}` }, ...prev]);
  }, []);

  const updateTransactionStatus = useCallback((id: string, status: Transaction['status']) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  }, []);

  // ─── Event Actions ────────────────────────────────────────────────────────
  const addEvent = useCallback((e: Omit<CalendarEvent, 'id'>) => {
    setEvents(prev => [...prev, { ...e, id: `ev${Date.now()}` }]);
  }, []);

  const deleteEvent = useCallback((id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  }, []);

  // ─── Content Actions ──────────────────────────────────────────────────────
  const addContent = useCallback((c: Omit<ContentPost, 'id' | 'createdAt'>) => {
    const newPost: ContentPost = { ...c, id: `cp${Date.now()}`, createdAt: new Date().toISOString().split('T')[0] };
    setContent(prev => [newPost, ...prev]);
  }, []);

  const updateContentStatus = useCallback((id: string, status: ContentPost['status']) => {
    setContent(prev => prev.map(c => c.id === id ? { ...c, status } : c));
    // AUTOMATION: approved post → calendar event
    if (status === 'aprovado') {
      const post = content.find(c => c.id === id);
      if (post) {
        const newEvent: CalendarEvent = {
          id: `ev-content-${Date.now()}`,
          title: `Post ${post.platform}: ${post.caption.substring(0, 30)}...`,
          date: post.date,
          time: '09:00',
          type: 'conteúdo',
          color: '#7c3aed',
        };
        setEvents(prev => [...prev, newEvent]);
      }
    }
  }, [content]);

  const deleteContent = useCallback((id: string) => {
    setContent(prev => prev.filter(c => c.id !== id));
  }, []);

  // ─── Team Actions ─────────────────────────────────────────────────────────
  const addTeamMember = useCallback((m: Omit<TeamMember, 'id' | 'performance' | 'tasksOpen' | 'ratings'>) => {
    const newMember: TeamMember = { ...m, id: `tm${Date.now()}`, performance: 5.0, tasksOpen: 0, ratings: [] };
    setTeam(prev => [...prev, newMember]);
  }, []);

  const updateTeamMember = useCallback((id: string, data: Partial<TeamMember>) => {
    setTeam(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
  }, []);

  const deleteTeamMember = useCallback((id: string) => {
    setTeam(prev => prev.filter(m => m.id !== id));
  }, []);

  const addTeamRating = useCallback((memberId: string, stars: number, feedback: string) => {
    setTeam(prev => prev.map(m => {
      if (m.id !== memberId) return m;
      const newRatings = [{ stars, feedback, date: new Date().toISOString().split('T')[0] }, ...m.ratings];
      const avg = newRatings.reduce((acc, r) => acc + r.stars, 0) / newRatings.length;
      return { ...m, ratings: newRatings, performance: Math.round(avg * 10) / 10 };
    }));
  }, []);

  // ─── Chat Actions ─────────────────────────────────────────────────────────
  const addMessage = useCallback((channelId: string, authorInitials: string, authorName: string, text: string) => {
    const now = new Date();
    const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const date = now.toISOString().split('T')[0];
    const msg = { id: `msg-${Date.now()}`, author: authorInitials, authorName, text, time, date };
    setChat(prev => ({
      ...prev,
      channels: prev.channels.map(ch => ch.id === channelId ? { ...ch, messages: [...ch.messages, msg] } : ch)
    }));
  }, []);

  // ─── Computed Helpers ─────────────────────────────────────────────────────
  const getClientById = useCallback((id: string) => clients.find(c => c.id === id), [clients]);
  const getProjectById = useCallback((id: string) => projects.find(p => p.id === id), [projects]);

  const getTodayEvents = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return events.filter(e => e.date === today);
  }, [events]);

  const getOverdueTasks = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return kanban.flatMap(c => c.tasks).filter(t => t.dueDate && t.dueDate < today);
  }, [kanban]);

  const getAtRiskProjects = useCallback(() => projects.filter(p => p.status === 'atrasado'), [projects]);

  const getExpiringContracts = useCallback(() => {
    const today = new Date();
    const in30 = new Date(today); in30.setDate(in30.getDate() + 30);
    const todayStr = today.toISOString().split('T')[0];
    const in30Str = in30.toISOString().split('T')[0];
    return contracts.filter(c => c.endDate >= todayStr && c.endDate <= in30Str);
  }, [contracts]);

  const getInactiveClients = useCallback(() => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    return clients.filter(c => c.status === 'ativo' && c.lastContact < cutoffStr);
  }, [clients]);

  const getMonthRevenue = useCallback(() => {
    const month = new Date().toISOString().slice(0, 7);
    return transactions.filter(t => t.type === 'income' && t.date.startsWith(month) && t.status === 'pago').reduce((a, t) => a + t.amount, 0);
  }, [transactions]);

  const getMonthExpense = useCallback(() => {
    const month = new Date().toISOString().slice(0, 7);
    return transactions.filter(t => t.type === 'expense' && t.date.startsWith(month) && t.status === 'pago').reduce((a, t) => a + t.amount, 0);
  }, [transactions]);

  const getBalance = useCallback(() => getMonthRevenue() - getMonthExpense(), [getMonthRevenue, getMonthExpense]);

  const getPendingReceivables = useCallback(() =>
    transactions.filter(t => t.type === 'income' && t.status === 'pendente').reduce((a, t) => a + t.amount, 0),
  [transactions]);

  const getPendingPayables = useCallback(() =>
    transactions.filter(t => t.type === 'expense' && t.status === 'pendente').reduce((a, t) => a + t.amount, 0),
  [transactions]);

  return (
    <DataContext.Provider value={{
      clients, contracts, projects, kanban, pipeline, transactions, events, content, team, chat, alerts,
      addClient, updateClient, deleteClient, addClientNote,
      addContract, updateContractStatus, deleteContract,
      addProject, updateProject, deleteProject,
      setKanban, addTask,
      setPipeline,
      addTransaction, updateTransactionStatus, deleteTransaction,
      addEvent, deleteEvent,
      addContent, updateContentStatus, deleteContent,
      addTeamMember, updateTeamMember, deleteTeamMember, addTeamRating,
      addMessage,
      getClientById, getProjectById, getTodayEvents, getOverdueTasks,
      getAtRiskProjects, getExpiringContracts, getInactiveClients,
      getMonthRevenue, getMonthExpense, getBalance, getPendingReceivables, getPendingPayables,
    }}>
      {children}
    </DataContext.Provider>
  );
};
