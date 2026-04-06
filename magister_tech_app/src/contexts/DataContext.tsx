import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { ReactNode } from 'react';

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  whatsapp?: string;
  segment: string;
  status: 'ativo' | 'inativo' | 'prospect';
  origin: string;
  createdAt: string;
  lastContact: string;
  notes: Note[];
  logoUrl?: string;
  contentPlan?: string;
  contentSchedule?: { days: string[]; defaultAssigneeId?: string };
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
  plano?: string;
  descricao?: string;
  signatureStatus?: 'assinado' | 'aguardando';
  fileUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Meeting {
  id: string;
  date: string;
  time: string;
  title: string;
  participants: string[];
  notes: string;
  status: 'agendada' | 'realizada' | 'cancelada';
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
  responsavelInterno?: string;
  responsavelCliente?: string;
  emailCliente?: string;
  whatsappCliente?: string;
  plano?: string;
  objetivos?: string;
  metas?: string;
  resumo?: string;
  reunioes?: Meeting[];
  postagens?: string;
  atribuicoes?: string;
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
  description?: string;
  checklist?: { id: string; text: string; done: boolean }[];
  value?: number;
  isArchived?: boolean;
  logs?: { timestamp: string; user: string; action: string }[];
}

export interface KanbanColumn {
  id: string;
  title: string;
  tasks: Task[];
  color?: string;
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
  clientId?: string;
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
  participants?: string[];
  description?: string;
}

export interface ContentPost {
  id: string;
  clientId: string;
  platform: string;
  date: string;
  caption: string;
  media?: string;
  mediaType?: 'image' | 'video';
  status: 'planejamento' | 'pendencias' | 'ideia' | 'producao' | 'revisao' | 'aprovado' | 'publicado' | 'recusado' | 'anotacao';
  assignedTo?: string;
  comments?: { id: string; author: string; text: string; date: string }[];
  createdAt: string;
  rejectionReason?: string;
}

export interface FeedPost {
  id: string;
  authorId: string;
  authorName: string;
  authorInitials: string;
  type: 'aviso' | 'anuncio' | 'curso' | 'vaga' | 'comunicado' | 'informacao';
  title: string;
  content: string;
  createdAt: string;
  pinned?: boolean;
  reactions?: { emoji: string; users: string[] }[];
  comments?: { id: string; authorName: string; authorInitials: string; text: string; date: string }[];
}

export interface TeamMember {
  id: string;
  name: string;
  initials: string;
  role: string;
  sector: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  instagram?: string;
  linkedin?: string;
  photoUrl?: string;
  bio?: string;
  profileColor?: string;
  joinedAt?: string;
  performance: number;
  tasksOpen: number;
  ratings: { stars: number; feedback: string; date: string }[];
  contracts?: string[];
  password?: string;
  accessLevel?: 'VIEWER' | 'EDITOR' | 'ADMIN';
  permissions?: string[]; 
}

export interface Goal {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  deadline: string;
  category: 'faturamento' | 'conteudo' | 'leads' | 'projetos';
}

export interface Alert {
  id: string;
  type: 'danger' | 'warning' | 'info' | 'purple';
  message: string;
  module: string;
  entityId?: string;
  createdAt: string;
}

export interface ChatChannel {
  id: string;
  name: string;
  icon: string;
  messages: { id: string; author: string; authorName: string; text: string; time: string; date: string }[];
}

// ─── INITIAL DATA ─────────────────────────────────────────────────────────────

const INITIAL_KANBAN: KanbanColumn[] = [
  { id: 'backlog', title: 'Backlog', tasks: [], color: '#94a3b8' },
  { id: 'todo', title: 'A Fazer', tasks: [], color: '#3b82f6' },
  { id: 'doing', title: 'Em Andamento', tasks: [], color: '#f59e0b' },
  { id: 'review', title: 'Revisão', tasks: [], color: '#8b5cf6' },
  { id: 'approved', title: 'Aprovado', tasks: [], color: '#10b981' },
  { id: 'done', title: 'Entregue', tasks: [], color: '#059669' },
];

const INITIAL_PIPELINE: KanbanColumn[] = [
  { id: 'lead', title: 'Novos Leads', tasks: [], color: '#60a5fa' },
  { id: 'meeting', title: 'Reunião', tasks: [], color: '#a78bfa' },
  { id: 'negotiation', title: 'Em Negociação', tasks: [], color: '#f59e0b' },
  { id: 'closed', title: 'Contrato Fechado', tasks: [], color: '#10b981' },
  { id: 'adjust', title: 'Ajustes', tasks: [], color: '#ef4444' },
];

const INITIAL_TEAM: TeamMember[] = [
  { 
    id: 'tm1', name: 'Admin Master', initials: 'AM', role: 'CEO', sector: 'Diretoria', 
    email: 'admin@magistertech.com.br', performance: 5.0, tasksOpen: 0, ratings: [],
    profileColor: '#7c3aed', joinedAt: new Date().toISOString().split('T')[0],
    password: 'admin123', accessLevel: 'ADMIN',
    permissions: ['dashboard', 'crm', 'pipeline', 'contratos', 'projetos', 'financeiro', 'agenda', 'conteudo', 'equipe', 'chat', 'config']
  }
];

const INITIAL_CHAT: { channels: ChatChannel[] } = {
  channels: [
    { id: 'geral', name: 'geral', icon: '#', messages: [] },
    { id: 'projetos', name: 'projetos', icon: '📁', messages: [] },
    { id: 'design', name: 'design', icon: '🎨', messages: [] },
    { id: 'financeiro', name: 'financeiro', icon: '💰', messages: [] },
  ]
};

const INITIAL_GOALS: Goal[] = [
  { id: 'g1', title: 'Faturamento Mensal', target: 50000, current: 32000, unit: 'R$', deadline: '2024-04-30', category: 'faturamento' },
  { id: 'g2', title: 'Posts Aprovados', target: 20, current: 12, unit: 'un', deadline: '2024-04-30', category: 'conteudo' },
  { id: 'g3', title: 'Novos Projetos', target: 5, current: 2, unit: 'un', deadline: '2024-04-30', category: 'projetos' },
];

// ─── CONTEXT ──────────────────────────────────────────────────────────────────

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
  feed: FeedPost[];
  alerts: Alert[];
  goals: Goal[];

  addClient: (c: Omit<Client, 'id' | 'createdAt' | 'lastContact' | 'notes'>) => void;
  updateClient: (id: string, data: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  addClientNote: (clientId: string, text: string, author: string) => void;

  addContract: (c: Omit<Contract, 'id' | 'createdAt' | 'status'>) => void;
  updateContract: (id: string, data: Partial<Contract>) => void;
  updateContractStatus: (id: string, status: Contract['status']) => void;
  deleteContract: (id: string) => void;

  addProject: (p: Omit<Project, 'id' | 'progress' | 'color'>) => void;
  updateProject: (id: string, data: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addProjectMeeting: (projectId: string, meeting: any) => void;

  setKanban: Dispatch<SetStateAction<KanbanColumn[]>>;
  addTask: (colId: string, task: Omit<Task, 'id' | 'columnId'>) => void;
  updateTask: (taskId: string, data: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;

  setPipeline: Dispatch<SetStateAction<KanbanColumn[]>>;
  addPipelineDeal: (colId: string, deal: Omit<Task, 'id' | 'columnId'>) => void;
  updatePipelineDeal: (dealId: string, data: Partial<Task>) => void;

  addTransaction: (t: Omit<Transaction, 'id'>) => void;
  updateTransactionStatus: (id: string, status: Transaction['status']) => void;
  updateTransaction: (id: string, data: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  addEvent: (e: Omit<CalendarEvent, 'id'>) => void;
  updateEvent: (id: string, data: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  updateClientContentPlan: (clientId: string, plan: string) => void;
  updateClientSchedule: (clientId: string, schedule: { days: string[], defaultAssigneeId?: string }) => void;
  updateContentComments: (postId: string, comment: { author: string; text: string }) => void;

  addContent: (c: Omit<ContentPost, 'id' | 'createdAt'>) => void;
  updateContent: (id: string, data: Partial<ContentPost>) => void;
  updateContentStatus: (id: string, status: ContentPost['status'], reason?: string) => void;
  deleteContent: (id: string) => void;

  addTeamMember: (m: Omit<TeamMember, 'id' | 'performance' | 'tasksOpen' | 'ratings'>) => void;
  updateTeamMember: (id: string, data: Partial<TeamMember>) => void;
  deleteTeamMember: (id: string) => void;
  addTeamRating: (memberId: string, stars: number, feedback: string) => void;
  updateMemberPassword: (memberId: string, newPassword: string) => void;
  updateMemberPermissions: (memberId: string, permissions: string[], accessLevel: TeamMember['accessLevel']) => void;

  addMessage: (channelId: string, authorInitials: string, authorName: string, text: string) => void;

  addFeedPost: (post: Omit<FeedPost, 'id' | 'createdAt'>) => void;
  deleteFeedPost: (id: string) => void;
  pinFeedPost: (id: string) => void;
  addFeedComment: (postId: string, comment: { authorName: string; authorInitials: string; text: string }) => void;

  archiveTask: (taskId: string, isArchived: boolean) => void;
  addTaskLog: (taskId: string, action: string, user: string) => void;
  updateGoal: (id: string, current: number) => void;

  getClientById: (id: string) => Client | undefined;
  getProjectById: (id: string) => Project | undefined;
  getContractById: (id: string) => Contract | undefined;
  getTodayEvents: () => CalendarEvent[];
  getOverdueTasks: () => Task[];
  getBalance: () => number;
  getMonthRevenue: () => number;
  getMonthExpense: () => number;
  getPendingReceivables: () => number;
  getAtRiskProjects: () => Project[];
  getExpiringContracts: () => Contract[];
  getInactiveClients: () => Client[];
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
  const [clients, setClients] = useState<Client[]>(() => load('mstr_clients', []));
  const [contracts, setContracts] = useState<Contract[]>(() => load('mstr_contracts', []));
  const [projects, setProjects] = useState<Project[]>(() => load('mstr_projects', []));
  const [kanban, setKanbanState] = useState<KanbanColumn[]>(() => load('mstr_kanban', INITIAL_KANBAN));
  const [pipeline, setPipelineState] = useState<KanbanColumn[]>(() => load('mstr_pipeline', INITIAL_PIPELINE));
  const [transactions, setTransactions] = useState<Transaction[]>(() => load('mstr_transactions', []));
  const [events, setEvents] = useState<CalendarEvent[]>(() => load('mstr_events', []));
  const [content, setContent] = useState<ContentPost[]>(() => load('mstr_content', []));
  const [team, setTeam] = useState<TeamMember[]>(() => load('mstr_team', INITIAL_TEAM));
  const [chat, setChat] = useState<typeof INITIAL_CHAT>(() => load('mstr_chat', INITIAL_CHAT));
  const [feed, setFeed] = useState<FeedPost[]>(() => load('mstr_feed', []));
  const [goals, setGoals] = useState<Goal[]>(() => load('mstr_goals', INITIAL_GOALS));
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // Alert Engine (Re-added)
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const newAlerts: Alert[] = [];
    kanban.flatMap(c => c.tasks).filter(t => t.dueDate && t.dueDate < today && !t.isArchived).forEach(t => {
      newAlerts.push({ id: `at-${t.id}`, message: `Atrasada: ${t.title}`, type: 'danger', module: 'kanban', createdAt: today });
    });
    setAlerts(newAlerts);
  }, [kanban]);

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
  useEffect(() => { save('mstr_feed', feed); }, [feed]);
  useEffect(() => { save('mstr_goals', goals); }, [goals]);

  // ─── Actions ──────────────────────────────────────────────────────────────

  const addClient = useCallback((c: any) => {
    const today = new Date().toISOString().split('T')[0];
    setClients(prev => [{ ...c, id: `c${Date.now()}`, createdAt: today, lastContact: today, notes: [] }, ...prev]);
  }, []);
  const updateClient = useCallback((id: string, data: any) => setClients(prev => prev.map(c => c.id === id ? { ...c, ...data } : c)), []);
  const updateClientContentPlan = useCallback((clientId: string, plan: string) => {
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, contentPlan: plan } : c));
  }, []);
  const updateClientSchedule = useCallback((clientId: string, schedule: { days: string[], defaultAssigneeId?: string }) => {
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, contentSchedule: schedule } : c));
  }, []);
  const deleteClient = useCallback((id: string) => setClients(prev => prev.filter(c => c.id !== id)), []);
  const addClientNote = useCallback((clientId: string, text: string, author: string) => {
    const note = { id: `n${Date.now()}`, text, createdAt: new Date().toISOString(), author };
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, notes: [note, ...c.notes], lastContact: new Date().toISOString().split('T')[0] } : c));
  }, []);

  const addContract = useCallback((c: any) => setContracts(prev => [{ ...c, id: `ct${Date.now()}`, createdAt: new Date().toISOString().split('T')[0], status: 'ativo' }, ...prev]), []);
  const updateContract = useCallback((id: string, data: any) => setContracts(prev => prev.map(c => c.id === id ? { ...c, ...data } : c)), []);
  const updateContractStatus = useCallback((id: string, status: any) => setContracts(prev => prev.map(c => c.id === id ? { ...c, status } : c)), []);
  const deleteContract = useCallback((id: string) => setContracts(prev => prev.filter(c => c.id !== id)), []);

  const addProject = useCallback((p: any) => setProjects(prev => [{ ...p, id: `proj${Date.now()}`, progress: 0, color: '#7c3aed' }, ...prev]), []);
  const updateProject = useCallback((id: string, data: any) => setProjects(prev => prev.map(p => p.id === id ? { ...p, ...data } : p)), []);
  const deleteProject = useCallback((id: string) => setProjects(prev => prev.filter(p => p.id !== id)), []);
  const addProjectMeeting = useCallback((projectId: string, meeting: any) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, reunioes: [...(p.reunioes || []), { ...meeting, id: `m${Date.now()}` }] } : p));
  }, []);

  const addTask = useCallback((colId: string, taskData: any) => {
    const task = { ...taskData, id: `task-${Date.now()}`, columnId: colId, isArchived: false, logs: [] };
    setKanbanState(prev => prev.map(c => c.id === colId ? { ...c, tasks: [...c.tasks, task] } : c));
  }, []);
  const updateTask = useCallback((taskId: string, data: any) => setKanbanState(prev => prev.map(c => ({ ...c, tasks: c.tasks.map(t => t.id === taskId ? { ...t, ...data } : t) }))), []);
  const deleteTask = useCallback((taskId: string) => setKanbanState(prev => prev.map(c => ({ ...c, tasks: c.tasks.filter(t => t.id !== taskId) }))), []);

  const addTransaction = useCallback((t: any) => setTransactions(prev => [{ ...t, id: `tr${Date.now()}` }, ...prev]), []);
  const updateTransaction = useCallback((id: string, data: any) => setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...data } : t)), []);
  const updateTransactionStatus = useCallback((id: string, status: any) => setTransactions(prev => prev.map(t => t.id === id ? { ...t, status } : t)), []);
  const deleteTransaction = useCallback((id: string) => setTransactions(prev => prev.filter(t => t.id !== id)), []);

  const addEvent = useCallback((e: any) => setEvents(prev => [...prev, { ...e, id: `ev${Date.now()}` }]), []);
  const updateEvent = useCallback((id: string, data: any) => setEvents(prev => prev.map(e => e.id === id ? { ...e, ...data } : e)), []);
  const deleteEvent = useCallback((id: string) => setEvents(prev => prev.filter(e => e.id !== id)), []);

  const addContent = useCallback((c: any) => setContent(prev => [{ ...c, id: `cp${Date.now()}`, createdAt: new Date().toISOString().split('T')[0] }, ...prev]), []);
  const updateContent = useCallback((id: string, data: any) => setContent(prev => prev.map(c => c.id === id ? { ...c, ...data } : c)), []);
  const updateContentStatus = useCallback((id: string, status: any) => setContent(prev => prev.map(c => c.id === id ? { ...c, status } : c)), []);
  const updateContentComments = useCallback((postId: string, comment: { author: string; text: string }) => {
    const newComment = { ...comment, id: `msg-${Date.now()}`, date: new Date().toISOString() };
    setContent(prev => prev.map(c => c.id === postId ? { ...c, comments: [...(c.comments || []), newComment] } : c));
  }, []);
  const deleteContent = useCallback((id: string) => setContent(prev => prev.filter(c => c.id !== id)), []);

  const addTeamMember = useCallback((m: any) => setTeam(prev => [...prev, { ...m, id: `tm${Date.now()}`, performance: 5, tasksOpen: 0, ratings: [] }]), []);
  const updateTeamMember = useCallback((id: string, data: any) => setTeam(prev => prev.map(m => m.id === id ? { ...m, ...data } : m)), []);
  const deleteTeamMember = useCallback((id: string) => setTeam(prev => prev.filter(m => m.id !== id)), []);
  const addTeamRating = useCallback((memberId: string, stars: number, feedback: string) => {
    setTeam(prev => prev.map(m => m.id === memberId ? { ...m, ratings: [...m.ratings, { stars, feedback, date: new Date().toISOString() }] } : m));
  }, []);
  const updateMemberPassword = useCallback((id: string, password: string) => setTeam(prev => prev.map(m => m.id === id ? { ...m, password } : m)), []);
  const updateMemberPermissions = useCallback((id: string, permissions: string[], accessLevel: any) => setTeam(prev => prev.map(m => m.id === id ? { ...m, permissions, accessLevel } : m)), []);

  const updateGoal = useCallback((id: string, current: number) => setGoals(prev => prev.map(g => g.id === id ? { ...g, current } : g)), []);
  const addTaskLog = useCallback((taskId: string, action: string, user: string) => {
     setKanbanState(prev => prev.map(c => ({ 
       ...c, tasks: c.tasks.map(t => t.id === taskId ? { ...t, logs: [...(t.logs || []), { timestamp: new Date().toISOString(), action, user }] } : t) 
     })));
  }, []);
  const archiveTask = useCallback((taskId: string, isArchived: boolean) => {
    setKanbanState(prev => prev.map(c => ({ ...c, tasks: c.tasks.map(t => t.id === taskId ? { ...t, isArchived } : t) })));
  }, []);

  const addMessage = useCallback((channelId: string, authorInitials: string, authorName: string, text: string) => {
    const msg = { id: `m-${Date.now()}`, author: authorInitials, authorName, text, time: new Date().toLocaleTimeString(), date: new Date().toISOString() };
    setChat(prev => ({ ...prev, channels: prev.channels.map(ch => ch.id === channelId ? { ...ch, messages: [...ch.messages, msg] } : ch) }));
  }, []);

  const addFeedPost = useCallback((p: any) => setFeed(prev => [{ ...p, id: `fp${Date.now()}`, createdAt: new Date().toISOString() }, ...prev]), []);
  const deleteFeedPost = useCallback((id: string) => setFeed(prev => prev.filter(f => f.id !== id)), []);
  const pinFeedPost = useCallback((id: string) => setFeed(prev => prev.map(f => f.id === id ? { ...f, pinned: !f.pinned } : f)), []);
  const addFeedComment = useCallback((postId: string, comment: any) => {
    setFeed(prev => prev.map(f => f.id === postId ? { ...f, comments: [...(f.comments || []), { ...comment, id: Date.now().toString(), date: new Date().toISOString() }] } : f));
  }, []);

  const getMonthRevenue = () => transactions.filter(t => t.type === 'income' && t.status === 'pago').reduce((a, b) => a + b.amount, 0);
  const getMonthExpense = () => transactions.filter(t => t.type === 'expense' && t.status === 'pago').reduce((a, b) => a + b.amount, 0);
  const getBalance = () => getMonthRevenue() - getMonthExpense();

  return (
    <DataContext.Provider value={{
      clients, contracts, projects, kanban, pipeline, transactions, events, content, team, chat, feed, alerts, goals,
      addClient, updateClient, deleteClient, addClientNote,
      addContract, updateContract, updateContractStatus, deleteContract,
      addProject, updateProject, deleteProject, addProjectMeeting,
      setKanban: setKanbanState, addTask, updateTask, deleteTask,
      setPipeline: setPipelineState, addPipelineDeal: () => {}, updatePipelineDeal: () => {},
      addTransaction, updateTransactionStatus, updateTransaction, deleteTransaction,
      addEvent, updateEvent, deleteEvent, updateClientContentPlan, updateClientSchedule, updateContentComments,
      addContent, updateContent, updateContentStatus, deleteContent,
      addTeamMember, updateTeamMember, deleteTeamMember, addTeamRating,
      updateMemberPassword, updateMemberPermissions,
      addMessage, addFeedPost, deleteFeedPost, pinFeedPost, addFeedComment,
      archiveTask, addTaskLog, updateGoal,
      getClientById: (id) => clients.find(c => c.id === id),
      getProjectById: (id) => projects.find(p => p.id === id),
      getContractById: (id) => contracts.find(c => c.id === id),
      getTodayEvents: () => [], 
      getOverdueTasks: () => [], 
      getBalance, getMonthRevenue, getMonthExpense,
      getPendingReceivables: () => transactions.filter(t => t.type === 'income' && t.status === 'pendente').reduce((a, b) => a + b.amount, 0),
      getAtRiskProjects: () => projects.filter(p => p.status === 'atrasado'),
      getExpiringContracts: () => contracts.filter(c => c.status === 'vencendo'),
      getInactiveClients: () => clients.filter(c => c.status === 'inativo')
    }}>
      {children}
    </DataContext.Provider>
  );
};
