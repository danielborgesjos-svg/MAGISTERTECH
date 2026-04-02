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
  // Novos campos expandidos
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
  status: 'ideia' | 'producao' | 'revisao' | 'aprovado' | 'publicado' | 'recusado';
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
  contracts?: string[]; // IDs dos contratos sob responsabilidade
  password?: string;
  accessLevel?: 'VIEWER' | 'EDITOR' | 'ADMIN';
  permissions?: string[];
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

const INITIAL_CLIENTS: Client[] = [];
const INITIAL_CONTRACTS: Contract[] = [];
const INITIAL_PROJECTS: Project[] = [];

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

const INITIAL_TRANSACTIONS: Transaction[] = [];
const INITIAL_EVENTS: CalendarEvent[] = [];
const INITIAL_CONTENT: ContentPost[] = [];
const INITIAL_FEED: FeedPost[] = [];

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
  addProjectMeeting: (projectId: string, meeting: Omit<Meeting, 'id'>) => void;

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

  addContent: (c: Omit<ContentPost, 'id' | 'createdAt'>) => void;
  updateContent: (id: string, data: Partial<ContentPost>) => void;
  updateContentStatus: (id: string, status: ContentPost['status'], reason?: string) => void;
  deleteContent: (id: string) => void;

  addTeamMember: (m: Omit<TeamMember, 'id' | 'performance' | 'tasksOpen' | 'ratings'>) => void;
  updateTeamMember: (id: string, data: Partial<TeamMember>) => void;
  deleteTeamMember: (id: string) => void;
  addTeamRating: (memberId: string, stars: number, feedback: string) => void;

  addMessage: (channelId: string, authorInitials: string, authorName: string, text: string) => void;

  addFeedPost: (post: Omit<FeedPost, 'id' | 'createdAt'>) => void;
  deleteFeedPost: (id: string) => void;
  pinFeedPost: (id: string) => void;

  getClientById: (id: string) => Client | undefined;
  getProjectById: (id: string) => Project | undefined;
  getContractById: (id: string) => Contract | undefined;
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
  const [feed, setFeed] = useState<FeedPost[]>(() => load('mstr_feed', INITIAL_FEED));
  const [alerts, setAlerts] = useState<Alert[]>([]);

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

  // ─── Alert Engine ──────────────────────────────────────────────────────────
  useEffect(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const newAlerts: Alert[] = [];

    kanban.flatMap(c => c.tasks).filter(t => t.dueDate && t.dueDate < todayStr && t.priority !== 'low').forEach(t => {
      newAlerts.push({ id: `ot-${t.id}`, type: 'danger', message: `Tarefa atrasada: "${t.title}"`, module: 'kanban', entityId: t.id, createdAt: todayStr });
    });
    projects.filter(p => p.status === 'atrasado').forEach(p => {
      newAlerts.push({ id: `rp-${p.id}`, type: 'warning', message: `Projeto em risco: "${p.name}"`, module: 'projetos', entityId: p.id, createdAt: todayStr });
    });
    const in30 = new Date(today); in30.setDate(in30.getDate() + 30);
    const in30Str = in30.toISOString().split('T')[0];
    contracts.filter(c => c.endDate >= todayStr && c.endDate <= in30Str && c.status !== 'encerrado').forEach(c => {
      newAlerts.push({ id: `ec-${c.id}`, type: 'warning', message: `Contrato vencendo: "${c.title}"`, module: 'contratos', entityId: c.id, createdAt: todayStr });
    });
    transactions.filter(t => t.status === 'atrasado').forEach(t => {
      newAlerts.push({ id: `op-${t.id}`, type: 'danger', message: `Pagamento atrasado: "${t.description}"`, module: 'financeiro', entityId: t.id, createdAt: todayStr });
    });
    const in7 = new Date(today); in7.setDate(in7.getDate() - 7);
    const in7Str = in7.toISOString().split('T')[0];
    clients.filter(c => c.status === 'ativo' && c.lastContact < in7Str).forEach(c => {
      newAlerts.push({ id: `ic-${c.id}`, type: 'purple', message: `Cliente sem contato há 7+ dias: ${c.company}`, module: 'crm', entityId: c.id, createdAt: todayStr });
    });
    setAlerts(newAlerts);
  }, [kanban, projects, contracts, transactions, clients]);

  // ─── Client Actions ────────────────────────────────────────────────────────
  const addClient = useCallback((c: Omit<Client, 'id' | 'createdAt' | 'lastContact' | 'notes'>) => {
    const today = new Date().toISOString().split('T')[0];
    setClients(prev => [{ ...c, id: `c${Date.now()}`, createdAt: today, lastContact: today, notes: [] }, ...prev]);
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

  // ─── Contract Actions ──────────────────────────────────────────────────────
  const addContract = useCallback((c: Omit<Contract, 'id' | 'createdAt' | 'status'>) => {
    const today = new Date().toISOString().split('T')[0];
    const newContract: Contract = { ...c, id: `ct${Date.now()}`, createdAt: today, status: 'ativo' };
    setContracts(prev => [newContract, ...prev]);
    const client = clients.find(cl => cl.id === c.clientId);
    const newTrans: Transaction = {
      id: `tr${Date.now()}`, description: `${c.title} — ${client?.company || 'Cliente'}`,
      amount: c.value, type: 'income', category: 'Contratos', date: c.startDate,
      status: 'pendente', recurrence: c.recurrence === 'mensal' ? 'mensal' : 'unico', contractId: newContract.id,
    };
    setTransactions(prev => [newTrans, ...prev]);
  }, [clients]);
  const updateContract = useCallback((id: string, data: Partial<Contract>) => {
    setContracts(prev => prev.map(c => c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString().split('T')[0] } : c));
  }, []);
  const updateContractStatus = useCallback((id: string, status: Contract['status']) => {
    setContracts(prev => prev.map(c => c.id === id ? { ...c, status } : c));
  }, []);
  const deleteContract = useCallback((id: string) => {
    setContracts(prev => prev.filter(c => c.id !== id));
  }, []);

  // ─── Project Actions ───────────────────────────────────────────────────────
  const addProject = useCallback((p: Omit<Project, 'id' | 'progress' | 'color'>) => {
    const colors = ['#7c3aed', '#4f46e5', '#f59e0b', '#10b981', '#ef4444', '#06b6d4'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const newProject: Project = { ...p, id: `proj${Date.now()}`, progress: 0, color, reunioes: [] };
    setProjects(prev => [newProject, ...prev]);
    const newCol: KanbanColumn = {
      id: `col-${newProject.id}`, title: `📁 ${newProject.name}`, color,
      tasks: [
        { id: `task-auto-1-${Date.now()}`, title: 'Kickoff e briefing inicial', columnId: `col-${newProject.id}`, projectId: newProject.id, assignee: p.team[0] || 'AD', priority: 'high', tag: 'Planejamento' },
        { id: `task-auto-2-${Date.now()}`, title: 'Definição de escopo e cronograma', columnId: `col-${newProject.id}`, projectId: newProject.id, assignee: p.team[0] || 'AD', priority: 'medium', tag: 'Planejamento' },
      ]
    };
    setKanbanState(prev => [...prev, newCol]);
    const newEvent: CalendarEvent = {
      id: `ev-proj-${Date.now()}`, title: `Início: ${newProject.name}`,
      date: p.startDate, time: '09:00', type: 'entrega', projectId: newProject.id, color,
    };
    setEvents(prev => [...prev, newEvent]);
  }, []);
  const updateProject = useCallback((id: string, data: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  }, []);
  const deleteProject = useCallback((id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  }, []);
  const addProjectMeeting = useCallback((projectId: string, meeting: Omit<Meeting, 'id'>) => {
    const newMeeting: Meeting = { ...meeting, id: `m${Date.now()}` };
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, reunioes: [...(p.reunioes || []), newMeeting] } : p));
  }, []);

  // ─── Kanban Actions ────────────────────────────────────────────────────────

  const addTask = useCallback((colId: string, taskData: Omit<Task, 'id' | 'columnId'>) => {
    const task: Task = { ...taskData, id: `task-${Date.now()}`, columnId: colId };
    setKanbanState(prev => prev.map(c => c.id === colId ? { ...c, tasks: [...c.tasks, task] } : c));
  }, []);
  const updateTask = useCallback((taskId: string, data: Partial<Task>) => {
    setKanbanState(prev => prev.map(col => ({
      ...col,
      tasks: col.tasks.map(t => t.id === taskId ? { ...t, ...data } : t)
    })));
  }, []);
  const deleteTask = useCallback((taskId: string) => {
    setKanbanState(prev => prev.map(col => ({
      ...col,
      tasks: col.tasks.filter(t => t.id !== taskId)
    })));
  }, []);

  // ─── Pipeline Actions ──────────────────────────────────────────────────────

  const addPipelineDeal = useCallback((colId: string, deal: Omit<Task, 'id' | 'columnId'>) => {
    const task: Task = { ...deal, id: `deal-${Date.now()}`, columnId: colId };
    setPipelineState(prev => prev.map(c => c.id === colId ? { ...c, tasks: [...c.tasks, task] } : c));
  }, []);
  const updatePipelineDeal = useCallback((dealId: string, data: Partial<Task>) => {
    setPipelineState(prev => prev.map(col => ({
      ...col,
      tasks: col.tasks.map(t => t.id === dealId ? { ...t, ...data } : t)
    })));
  }, []);

  // ─── Transaction Actions ───────────────────────────────────────────────────
  const addTransaction = useCallback((t: Omit<Transaction, 'id'>) => {
    setTransactions(prev => [{ ...t, id: `tr${Date.now()}` }, ...prev]);
  }, []);
  const updateTransactionStatus = useCallback((id: string, status: Transaction['status']) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  }, []);
  const updateTransaction = useCallback((id: string, data: Partial<Transaction>) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
  }, []);
  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  }, []);

  // ─── Event Actions ─────────────────────────────────────────────────────────
  const addEvent = useCallback((e: Omit<CalendarEvent, 'id'>) => {
    setEvents(prev => [...prev, { ...e, id: `ev${Date.now()}` }]);
  }, []);
  const updateEvent = useCallback((id: string, data: Partial<CalendarEvent>) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
  }, []);
  const deleteEvent = useCallback((id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  }, []);

  // ─── Content Actions ───────────────────────────────────────────────────────
  const addContent = useCallback((c: Omit<ContentPost, 'id' | 'createdAt'>) => {
    setContent(prev => [{ ...c, id: `cp${Date.now()}`, createdAt: new Date().toISOString().split('T')[0] }, ...prev]);
  }, []);
  const updateContent = useCallback((id: string, data: Partial<ContentPost>) => {
    setContent(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  }, []);
  const updateContentStatus = useCallback((id: string, status: ContentPost['status'], reason?: string) => {
    setContent(prev => prev.map(c => c.id === id ? { ...c, status, ...(reason ? { rejectionReason: reason } : {}) } : c));
    if (status === 'aprovado') {
      const post = content.find(c => c.id === id);
      if (post) {
        const newEvent: CalendarEvent = {
          id: `ev-content-${Date.now()}`, title: `Post ${post.platform}: ${post.caption.substring(0, 30)}...`,
          date: post.date, time: '09:00', type: 'conteúdo', color: '#7c3aed',
        };
        setEvents(prev => [...prev, newEvent]);
      }
    }
  }, [content]);
  const deleteContent = useCallback((id: string) => {
    setContent(prev => prev.filter(c => c.id !== id));
  }, []);

  // ─── Team Actions ──────────────────────────────────────────────────────────
  const addTeamMember = useCallback((m: Omit<TeamMember, 'id' | 'performance' | 'tasksOpen' | 'ratings'>) => {
    setTeam(prev => [...prev, { ...m, id: `tm${Date.now()}`, performance: 5.0, tasksOpen: 0, ratings: [], joinedAt: new Date().toISOString().split('T')[0] }]);
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

  // ─── Chat Actions ──────────────────────────────────────────────────────────
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

  // ─── Feed Actions ──────────────────────────────────────────────────────────
  const addFeedPost = useCallback((post: Omit<FeedPost, 'id' | 'createdAt'>) => {
    setFeed(prev => [{ ...post, id: `fp${Date.now()}`, createdAt: new Date().toISOString() }, ...prev]);
  }, []);
  const deleteFeedPost = useCallback((id: string) => {
    setFeed(prev => prev.filter(p => p.id !== id));
  }, []);
  const pinFeedPost = useCallback((id: string) => {
    setFeed(prev => prev.map(p => p.id === id ? { ...p, pinned: !p.pinned } : p));
  }, []);

  // ─── Computed ─────────────────────────────────────────────────────────────
  const getClientById = useCallback((id: string) => clients.find(c => c.id === id), [clients]);
  const getProjectById = useCallback((id: string) => projects.find(p => p.id === id), [projects]);
  const getContractById = useCallback((id: string) => contracts.find(c => c.id === id), [contracts]);

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
      clients, contracts, projects, kanban, pipeline, transactions, events, content, team, chat, feed, alerts,
      addClient, updateClient, deleteClient, addClientNote,
      addContract, updateContract, updateContractStatus, deleteContract,
      addProject, updateProject, deleteProject, addProjectMeeting,
      setKanban: setKanbanState, addTask, updateTask, deleteTask,
      setPipeline: setPipelineState, addPipelineDeal, updatePipelineDeal,
      addTransaction, updateTransactionStatus, updateTransaction, deleteTransaction,
      addEvent, updateEvent, deleteEvent,
      addContent, updateContent, updateContentStatus, deleteContent,
      addTeamMember, updateTeamMember, deleteTeamMember, addTeamRating,
      addMessage,
      addFeedPost, deleteFeedPost, pinFeedPost,
      getClientById, getProjectById, getContractById,
      getTodayEvents, getOverdueTasks, getAtRiskProjects, getExpiringContracts,
      getInactiveClients, getMonthRevenue, getMonthExpense, getBalance,
      getPendingReceivables, getPendingPayables,
    }}>
      {children}
    </DataContext.Provider>
  );
};
