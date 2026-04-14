import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { ReactNode } from 'react';
import { apiFetch } from '../lib/api';

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
  coreColors?: string;
  fontFamily?: string;
  mandatoryRules?: string;
  organogramData?: string;
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
  phone?: string;
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
  isFixedExpense?: boolean;
  employeeId?: string;
  recurringType?: string;
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
  preferences?: any;
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

export interface TicketMessage {
  id: string;
  authorName: string;
  text: string;
  createdAt: string;
  isInternal: boolean;
}

export interface Ticket {
  id: string;
  clientId?: string;
  clientName: string;
  clientWhastapp: string;
  subject: string;
  description: string;
  status: 'novo' | 'aberto' | 'pendente' | 'resolvido' | 'fechado';
  priority: 'baixa' | 'media' | 'alta' | 'urgente';
  category: 'bug' | 'suporte' | 'alteracao' | 'financeiro' | 'outro';
  assigneeId?: string;
  projectId?: string;
  messages: TicketMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface Alert {
  id: string;
  type: 'danger' | 'warning' | 'info' | 'purple';
  message: string;
  module: string;
  entityId?: string;
  createdAt: string;
}

// ─── WHATSAPP TYPES ────────────────────────────────────────────────────────
export type WAStatus = 'disconnected' | 'qr_ready' | 'connecting' | 'connected' | 'auth_failure';

export interface WAMessage {
  id: string;
  author: string;
  text: string;
  time: string;
  timestamp: number;
  fromMe: boolean;
}

export interface TechService {
  id: string;
  nome: string;
  tipo: string;
  versao?: string;
  status: string;
  uptime: number;
  custo_mes: number;
}

export interface AgencyProcess {
  id: string;
  nome: string;
  area: string;
  responsavel: string;
  slaHoras: number;
  realizado: number;
  status: string;
  automacao: number;
}

export interface WAState {
  status: WAStatus;
  qrDataUrl: string | null;
  phone: string | null;
  contacts: { id: string; name: string; phone: string }[];
  recentMessages: { [chatId: string]: WAMessage[] };
}

export interface ChatChannel {
  id: string;
  name: string;
  icon: string;
  messages: { id: string; author: string; authorName: string; text: string; time: string; date: string }[];
}

// ─── DEFAULTS (apenas estrutura, sem dados hardcoded) ─────────────────────────

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

const INITIAL_CHAT: { channels: ChatChannel[] } = {
  channels: [
    { id: 'geral', name: 'geral', icon: '#', messages: [] },
    { id: 'projetos', name: 'projetos', icon: '📁', messages: [] },
    { id: 'design', name: 'design', icon: '🎨', messages: [] },
    { id: 'financeiro', name: 'financeiro', icon: '💰', messages: [] },
  ]
};

const INITIAL_GOALS: Goal[] = [
  { id: 'g1', title: 'Faturamento Mensal', target: 50000, current: 0, unit: 'R$', deadline: new Date().toISOString().split('T')[0], category: 'faturamento' },
  { id: 'g2', title: 'Posts Aprovados', target: 20, current: 0, unit: 'un', deadline: new Date().toISOString().split('T')[0], category: 'conteudo' },
  { id: 'g3', title: 'Novos Projetos', target: 5, current: 0, unit: 'un', deadline: new Date().toISOString().split('T')[0], category: 'projetos' },
];


// apiFetch importado de '../lib/api' — usa credentials: 'include' (httpOnly cookie automático)

// ─── CONTEXT TYPE ─────────────────────────────────────────────────────────────

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
  logs: any[];
  apiReady: boolean;

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
  refreshTeam: () => Promise<void>;
  updateMemberPassword: (memberId: string, newPassword: string) => void;
  updateMemberPermissions: (memberId: string, permissions: string[], accessLevel: TeamMember['accessLevel']) => void;
  updateMemberPreferences: (memberId: string, preferences: any) => void;

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
  
  // Tickets System
  tickets: Ticket[];
  addTicket: (t: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'messages' | 'status'>) => void;
  updateTicket: (id: string, data: Partial<Ticket>) => void;
  addTicketMessage: (ticketId: string, message: Omit<TicketMessage, 'id' | 'createdAt'>) => void;
  deleteTicket: (id: string) => void;

  waState: WAState;
  sendWAMessage: (phone: string, message: string) => Promise<boolean>;
  syncWAContacts: () => Promise<void>;
  startWA: () => Promise<void>;
  disconnectWA: () => Promise<void>;
  techStack: TechService[];
  createTechService: (t: Omit<TechService, 'id'>) => Promise<void>;
  
  processos: AgencyProcess[];
  createAgencyProcess: (p: Omit<AgencyProcess, 'id'>) => Promise<void>;
}

export const DataContext = createContext<DataContextType>({} as DataContextType);
export const useData = () => useContext(DataContext);

// ─── PROVIDER ─────────────────────────────────────────────────────────────────

// Chave única para dados que NÃO têm API (Kanban interno, Chat, Feed, Pipeline, Conteúdo, Agenda)
// Esses serão persistidos via backend quando os endpoints forem criados.
// Por enquanto usam um fallback em memória.
// const MEM: Record<string, any> = {}; 



export const DataProvider = ({ children }: { children: ReactNode }) => {
  // — Estados com API (fonte de verdade = Banco de Dados) —
  const [clients, setClients] = useState<Client[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [apiReady, setApiReady] = useState(false);

  // — Estados com persistência híbrida (persistem localmente, migram para API na Fase 3) —
  const [kanban, setKanbanState] = useState<KanbanColumn[]>(INITIAL_KANBAN);
  const [pipeline, setPipelineState] = useState<KanbanColumn[]>(INITIAL_PIPELINE);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [content, setContent] = useState<ContentPost[]>([]);
  const [techStack, setTechStack] = useState<TechService[]>([]);
  const [processos, setProcessos] = useState<AgencyProcess[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [chat, setChat] = useState<typeof INITIAL_CHAT>(INITIAL_CHAT);
  const [feed, setFeed] = useState<FeedPost[]>([]);
  const [goals, setGoals] = useState<Goal[]>(INITIAL_GOALS);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [waState, setWaState] = useState<WAState>({ status: 'disconnected', qrDataUrl: null, phone: null, contacts: [], recentMessages: {} });

  // — Carregamento inicial da API —
  // Sessão autenticada via httpOnly cookie (enviado automaticamente sem verificação explícita)
  useEffect(() => {
    const loadAll = async () => {
      try {
        const [cls, cts, projs, fts, tks, fdp, cht, gls, users, evs, trs, lgs, boardCols, tch, proc] = await Promise.all([
          apiFetch<any[]>('/api/clients'),
          apiFetch<any[]>('/api/contracts'),
          apiFetch<any[]>('/api/projects'),
          apiFetch<any[]>('/api/faturas').catch(() => []),
          apiFetch<any[]>('/api/tickets').catch(() => []),
          apiFetch<any[]>('/api/feed').catch(() => []),
          apiFetch<any[]>('/api/chat').catch(() => []),
          apiFetch<any[]>('/api/goals').catch(() => []),
          apiFetch<any[]>('/api/users').catch(() => []),
          apiFetch<any[]>('/api/events').catch(() => []),
          apiFetch<any[]>('/api/transactions').catch(() => []),
          apiFetch<any[]>('/api/logs').catch(() => []),
          apiFetch<any[]>('/api/boards/columns').catch(() => []),
          apiFetch<any[]>('/api/tech').catch(() => []),
          apiFetch<any[]>('/api/processos').catch(() => []),
        ]);

        // 1. Mapear Clientes
        setClients(cls.map(c => ({
          id: c.id, name: c.name, company: c.company || '', email: c.email || '',
          phone: c.phone || '', segment: c.segment || '', status: (c.status || 'ativo').toLowerCase() as any,
          origin: c.responsible || '', createdAt: c.createdAt?.split('T')[0] || '',
          lastContact: c.updatedAt?.split('T')[0] || '', notes: [], contentPlan: c.briefing,
        })));

        // 2. Mapear Contratos
        setContracts(cts.map(c => ({
          id: c.id, title: c.title, clientId: c.clientId, value: c.value,
          startDate: c.startDate?.split('T')[0] || '', endDate: c.endDate?.split('T')[0] || '',
          recurrence: (c.recurrence || 'mensal') as any,
          status: c.status === 'VIGENTE' ? 'ativo' : c.status === 'ENCERRADO' ? 'encerrado' : 'vencendo',
          createdAt: c.createdAt?.split('T')[0] || '',
        })));

        // 3. Mapear Projetos
        setProjects(projs.map(p => ({
          id: p.id, name: p.name, clientId: p.clientId, type: p.type || 'marketing',
          status: (p.status === 'EM_ANDAMENTO' ? 'ativo' : p.status === 'CONCLUIDO' ? 'concluido' : 'pausado') as any,
          progress: 0, startDate: p.startDate?.split('T')[0] || '', endDate: p.endDate?.split('T')[0] || '',
          team: [], budget: 0, color: '#7c3aed',
        })));

        // 4. Mapear Tickets
        setTickets(tks.map(t => ({
          id: t.id,
          protocol: t.protocol,
          clientName: t.clientName,
          clientWhastapp: t.clientWhatsapp,
          subject: t.subject,
          description: t.description || '',
          status: (t.status || 'novo').toLowerCase() as any,
          priority: (t.priority || 'media').toLowerCase() as any,
          category: 'suporte',
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
          messages: t.messages.map((m: any) => ({
            id: m.id, authorName: m.authorName, text: m.text, createdAt: m.createdAt, isInternal: m.isInternal
          }))
        })));

        // 5. Mapear Feed
        setFeed(fdp.map(p => ({
          id: p.id, authorName: p.authorName, authorId: p.authorId || '',
          authorInitials: p.authorName.substring(0, 2).toUpperCase(),
          type: (p.type || 'aviso') as any, title: 'Comunicado', content: p.text, createdAt: p.createdAt,
          comments: p.comments.map((c: any) => ({ id: c.id, authorName: c.authorName, text: c.text, date: c.createdAt })),
        })));

        // 6. Mapear Chat
        if (cht.length > 0) {
          setChat({
            channels: cht.map(ch => ({
              id: ch.id, name: ch.name, icon: ch.icon || '#',
              messages: ch.messages.map((m: any) => ({
                id: m.id, author: m.senderName.substring(0, 2).toUpperCase(), authorName: m.senderName,
                text: m.text, time: new Date(m.timestamp).toLocaleTimeString(), date: m.timestamp
              }))
            }))
          });
        }

        // 7. Mapear Metas
        setGoals(gls.map(g => ({
          id: g.id, title: g.title, target: g.target, current: g.current,
          unit: g.unit, deadline: g.deadline?.split('T')[0] || '',
          category: 'faturamento'
        })));

        // 8. Equipe do Banco
        setTeam(users.map((u: any) => {
          let prefs: any = {};
          try { prefs = typeof u.preferences === 'string' ? JSON.parse(u.preferences) : (u.preferences || {}); } catch {}
          return {
            id: u.id, name: u.name, initials: u.name.substring(0, 2).toUpperCase(),
            role: u.role, sector: u.sector || '', email: u.email, avatar: u.avatar,
            bio: u.bio || '',
            contracts: prefs.contracts || [],
            preferences: prefs,
            performance: 5, tasksOpen: 0, ratings: []
          };
        }));

        // 9. Agenda
        setEvents(evs.map((e: any) => ({
          id: e.id, title: e.title,
          date: e.startDate?.split('T')[0] || '',
          time: e.startDate ? new Date(e.startDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false }) : '09:00',
          type: (e.type?.toLowerCase() === 'internó' ? 'reunião' : e.type?.toLowerCase() || 'reunião') as any,
          location: e.location || '', clientId: e.clientId, projectId: e.projectId,
          color: e.color || 'var(--primary)', description: e.description,
        })));

        // 10. Financeiro (Faturas e Transações)
        const mappedFts: Transaction[] = fts.map((f: any) => ({
          id: f.id, description: f.descricao || `Fatura: ${f.contrato?.title}`, amount: f.valor, 
          type: 'income' as const, category: 'Fatura', date: f.vencimento.split('T')[0], 
          status: f.status.toLowerCase() as any, clientId: f.clienteId
        }));
        
        const mappedTrs: Transaction[] = trs.map((t: any) => ({
          id: t.id, description: t.description, amount: t.amount, 
          type: (t.type === 'RECEITA' ? 'income' : 'expense') as "income" | "expense",
          category: t.category || 'Geral', date: t.dueDate?.split('T')[0] || t.createdAt?.split('T')[0], 
          status: (t.status === 'PAGO' ? 'pago' : 'pendente') as any,
          contractId: t.contractId, clientId: t.clientId,
          isFixedExpense: !!t.isFixedExpense,
          recurringType: t.recurringType || 'mensal',
          employeeId: t.employeeId || undefined,
        }));

        setTransactions([...mappedFts, ...mappedTrs]);

        // 11. Auditoria
        setLogs(lgs.map((l: any) => ({
          id: l.id, action: l.action, module: l.module, details: l.details,
          userName: l.user?.name, userRole: l.user?.role, createdAt: l.createdAt
        })));

        // 12. Kanban e Pipeline Dinâmicos
        const kanbanTasks = tks.filter((t: any) => !t.boardType || t.boardType === 'KANBAN');
        const pipelineTasks = tks.filter((t: any) => t.boardType === 'PIPELINE');

        const dbKanbanCols = boardCols.filter((c: any) => c.boardType === 'KANBAN');
        const dbPipelineCols = boardCols.filter((c: any) => c.boardType === 'PIPELINE');

        const finalKanbanCols = dbKanbanCols.length > 0 
          ? dbKanbanCols.map((c: any) => ({ id: c.id, title: c.title, color: c.color, tasks: [] }))
          : INITIAL_KANBAN;

        const finalPipelineCols = dbPipelineCols.length > 0
          ? dbPipelineCols.map((c: any) => ({ id: c.id, title: c.title, color: c.color, tasks: [] }))
          : INITIAL_PIPELINE;

        setKanbanState(finalKanbanCols.map(col => ({
          ...col,
          tasks: kanbanTasks.filter((t: any) => t.status === col.id || t.status === col.title).map((t: any) => ({
            id: t.id, title: t.title, columnId: col.id, assignee: t.assignee?.name?.substring(0, 2).toUpperCase() || '?',
            priority: t.priority.toLowerCase() as any, tag: t.tags || 'Geral', dueDate: t.deadline?.split('T')[0],
            description: t.description, projectId: t.projectId
          }))
        })));

        setPipelineState(finalPipelineCols.map(col => ({
          ...col,
          tasks: pipelineTasks.filter((t: any) => t.status === col.id || t.status === col.title).map((t: any) => ({
            id: t.id, title: t.title, columnId: col.id, assignee: t.assignee?.name?.substring(0, 2).toUpperCase() || '?',
            priority: t.priority.toLowerCase() as any, tag: t.tags || 'Lead', dueDate: t.deadline?.split('T')[0],
            description: t.description, value: t.value || 0
          }))
        })));

        // 13. Atribuição KPIs Reais
        setTechStack(tch || []);
        setProcessos(proc || []);

        setApiReady(true);
      } catch (err) {
        console.warn('[DataContext] API indisponível ou token expirado.', err);
        setApiReady(false);
      }
    };

    loadAll();
  }, []);

  // — WHATSAPP SSE LISTENER — Cookie automático via credentials: include
  useEffect(() => {
    let eventSource: EventSource | null = null;

    const connectSSE = () => {
      if (eventSource) eventSource.close();

      // EventSource não suporta credentials: 'include' nativo,
      // então usamos polling via fetch (já implementado na página Conectividade).
      // O SSE aqui é mantído como fallback para atualizações em tempo real.
      eventSource = new EventSource('/api/whatsapp/stream');

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setWaState(data);
        } catch (err) {
          console.error('[WA Engine] Erro ao processar SSE:', err);
        }
      };

      eventSource.onerror = () => {
        console.warn('[WA Engine] SSE desconectado. Tentando reconectar...');
        eventSource?.close();
        setTimeout(connectSSE, 5000);
      };
    };

    connectSSE();
    return () => eventSource?.close();
  }, []);

  const sendWAMessage = async (phone: string, message: string) => {
    try {
      await apiFetch('/api/whatsapp/send', {
        method: 'POST',
        body: JSON.stringify({ phone, message }),
      });
      return true;
    } catch (err) {
      console.error('[WA Engine] Falha ao enviar:', err);
      return false;
    }
  };

  const syncWAContacts = async () => {
    await apiFetch('/api/whatsapp/sync-contacts', { method: 'POST' });
  };

  const startWA = async () => {
    await apiFetch('/api/whatsapp/start', { method: 'POST' });
  };

  const disconnectWA = async () => {
    await apiFetch('/api/whatsapp/disconnect', { method: 'POST' });
  };

  // Alert Engine
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const newAlerts: Alert[] = [];
    kanban.flatMap(c => c.tasks).filter(t => t.dueDate && t.dueDate < today && !t.isArchived).forEach(t => {
      newAlerts.push({ id: `at-${t.id}`, message: `Atrasada: ${t.title}`, type: 'danger', module: 'kanban', createdAt: today });
    });
    setAlerts(newAlerts);
  }, [kanban]);

  // ─── CLIENT ACTIONS (API) ──────────────────────────────────────────────────
  const addClient = useCallback(async (c: any) => {
    try {
      const data = await apiFetch<any>('/api/clients', {
        method: 'POST',
        body: JSON.stringify({ name: c.name, company: c.company, email: c.email, phone: c.phone, segment: c.segment, responsible: c.origin }),
      });
      setClients(prev => [{ ...c, id: data.id, createdAt: data.createdAt?.split('T')[0] || '', lastContact: data.createdAt?.split('T')[0] || '', notes: [] }, ...prev]);
    } catch { setClients(prev => [{ ...c, id: `c${Date.now()}`, createdAt: new Date().toISOString().split('T')[0], lastContact: new Date().toISOString().split('T')[0], notes: [] }, ...prev]); }
  }, []);

  const updateClient = useCallback(async (id: string, data: any) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
    try {
      await apiFetch(`/api/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    } catch {}
  }, []);

  const deleteClient = useCallback(async (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
    try { await apiFetch(`/api/clients/${id}`, { method: 'DELETE' }); } catch {}
  }, []);

  const addClientNote = useCallback((clientId: string, text: string, author: string) => {
    const note = { id: `n${Date.now()}`, text, createdAt: new Date().toISOString(), author };
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, notes: [note, ...c.notes], lastContact: new Date().toISOString().split('T')[0] } : c));
  }, []);

  const updateClientContentPlan = useCallback((clientId: string, plan: string) => {
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, contentPlan: plan } : c));
  }, []);

  const updateClientSchedule = useCallback((clientId: string, schedule: { days: string[], defaultAssigneeId?: string }) => {
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, contentSchedule: schedule } : c));
  }, []);

  // ─── CONTRACT ACTIONS (API) ────────────────────────────────────────────────
  const addContract = useCallback(async (c: any) => {
    try {
      const data = await apiFetch<any>('/api/contracts', {
        method: 'POST',
        body: JSON.stringify({ title: c.title, value: c.value, startDate: c.startDate, endDate: c.endDate, clientId: c.clientId, recurrence: c.recurrence }),
      });
      setContracts(prev => [{ ...c, id: data.id, createdAt: data.createdAt?.split('T')[0] || '', status: 'ativo' }, ...prev]);
    } catch { setContracts(prev => [{ ...c, id: `ct${Date.now()}`, createdAt: new Date().toISOString().split('T')[0], status: 'ativo' }, ...prev]); }
  }, []);

  const updateContract = useCallback(async (id: string, data: any) => {
    setContracts(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
    try { await apiFetch(`/api/contracts/${id}`, { method: 'PUT', body: JSON.stringify(data) }); } catch {}
  }, []);

  const updateContractStatus = useCallback(async (id: string, status: any) => {
    setContracts(prev => prev.map(c => c.id === id ? { ...c, status } : c));
  }, []);

  const deleteContract = useCallback(async (id: string) => {
    setContracts(prev => prev.filter(c => c.id !== id));
    try { await apiFetch(`/api/contracts/${id}`, { method: 'DELETE' }); } catch {}
  }, []);

  // ─── PROJECT ACTIONS (API) ─────────────────────────────────────────────────
  const addProject = useCallback(async (p: any) => {
    try {
      const data = await apiFetch<any>('/api/projects', {
        method: 'POST',
        body: JSON.stringify({ name: p.name, clientId: p.clientId, type: p.type, startDate: p.startDate, endDate: p.endDate }),
      });
      setProjects(prev => [{ ...p, id: data.id, progress: 0, color: '#7c3aed' }, ...prev]);
    } catch { setProjects(prev => [{ ...p, id: `proj${Date.now()}`, progress: 0, color: '#7c3aed' }, ...prev]); }
  }, []);

  const updateProject = useCallback(async (id: string, data: any) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
    try { await apiFetch(`/api/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }); } catch {}
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    try { await apiFetch(`/api/projects/${id}`, { method: 'DELETE' }); } catch {}
  }, []);

  const addProjectMeeting = useCallback((projectId: string, meeting: any) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, reunioes: [...(p.reunioes || []), { ...meeting, id: `m${Date.now()}` }] } : p));
  }, []);

  // ─── KANBAN ACTIONS (local + futura API) ───────────────────────────────────
  const setKanban = useCallback((updater: SetStateAction<KanbanColumn[]>) => {
    setKanbanState(updater);
  }, []);

  const addTask = useCallback(async (colId: string, taskData: any) => {
    try {
      const body = { ...taskData, status: colId, boardType: 'KANBAN' };
      const data = await apiFetch<any>('/api/tasks', { method: 'POST', body: JSON.stringify(body) });
      setKanbanState(prev => prev.map(c => c.id === colId ? { ...c, tasks: [...c.tasks, { ...taskData, id: data.id, columnId: colId }] } : c));
    } catch (err) { console.error('Erro ao adicionar tarefa:', err); }
  }, []);

  const updateTask = useCallback(async (taskId: string, data: any) => {
    try {
      await apiFetch(`/api/tasks/${taskId}`, { method: 'PUT', body: JSON.stringify(data) });
      setKanbanState(prev => prev.map(c => ({ ...c, tasks: c.tasks.map(t => t.id === taskId ? { ...t, ...data } : t) })));
    } catch (err) { console.error('Erro ao atualizar tarefa:', err); }
  }, []);

  const deleteTask = useCallback(async (taskId: string) => {
    try {
      await apiFetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      setKanbanState(prev => prev.map(c => ({ ...c, tasks: c.tasks.filter(t => t.id !== taskId) })));
    } catch (err) { console.error('Erro ao excluir tarefa:', err); }
  }, []);

  const archiveTask = useCallback((taskId: string, isArchived: boolean) => {
    setKanbanState(prev => prev.map(c => ({ ...c, tasks: c.tasks.map(t => t.id === taskId ? { ...t, isArchived } : t) })));
  }, []);

  const addTaskLog = useCallback((taskId: string, action: string, user: string) => {
    setKanbanState(prev => prev.map(c => ({
      ...c, tasks: c.tasks.map(t => t.id === taskId ? { ...t, logs: [...(t.logs || []), { timestamp: new Date().toISOString(), action, user }] } : t)
    })));
  }, []);

  // ─── PIPELINE ACTIONS (local + futura API) ─────────────────────────────────
  const setPipeline = useCallback((updater: SetStateAction<KanbanColumn[]>) => {
    setPipelineState(updater);
  }, []);

  const addPipelineDeal = useCallback(async (colId: string, deal: any) => {
    try {
      const body = { ...deal, status: colId, boardType: 'PIPELINE' };
      const data = await apiFetch<any>('/api/tasks', { method: 'POST', body: JSON.stringify(body) });
      setPipelineState(prev => prev.map(c => c.id === colId ? { ...c, tasks: [...c.tasks, { ...deal, id: data.id, columnId: colId }] } : c));
    } catch (err) { console.error('Erro ao adicionar deal:', err); }
  }, []);

  const updatePipelineDeal = useCallback((dealId: string, data: Partial<Task>) => {
    setPipelineState(prev => prev.map(c => ({ ...c, tasks: c.tasks.map(t => t.id === dealId ? { ...t, ...data } : t) })));
  }, []);

  // ─── TRANSACTION ACTIONS (API) ─────────────────────────────────────────────
  const addTransaction = useCallback(async (t: any) => {
    try {
      const body = { 
        ...t, 
        type: t.type === 'income' ? 'RECEITA' : 'DESPESA',
        dueDate: t.date || t.dueDate, // backend expects dueDate
        status: (t.status || 'pendente').toUpperCase(),
        recurrence: !!(t.isFixedExpense), // boolean: fixo = true
      };
      const data = await apiFetch<any>('/api/transactions', { method: 'POST', body: JSON.stringify(body) });
      // Normalize response back to frontend format before adding to state
      const normalized: Transaction = {
        id: data.id,
        description: data.description,
        amount: data.amount,
        type: data.type === 'RECEITA' ? 'income' : 'expense',
        category: data.category || t.category || 'Geral',
        date: data.dueDate?.split('T')[0] || t.date,
        status: (data.status === 'PAGO' ? 'pago' : 'pendente') as any,
        isFixedExpense: !!data.isFixedExpense,
        recurringType: data.recurringType,
        employeeId: data.employeeId,
        contractId: data.contractId,
        clientId: data.clientId,
      };
      setTransactions(prev => [normalized, ...prev]);
    } catch (err) { console.error('Erro ao adicionar transação:', err); }
  }, []);

  const updateTransaction = useCallback((id: string, data: any) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
  }, []);

  const updateTransactionStatus = useCallback(async (id: string, status: any) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    try {
      await apiFetch(`/api/transactions/${id}/status`, { 
        method: 'PUT', 
        body: JSON.stringify({ status }) 
      });
    } catch (err) { console.error('Erro ao atualizar status da transação:', err); }
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    try {
      await apiFetch(`/api/transactions/${id}`, { method: 'DELETE' });
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (err) { console.error('Erro ao excluir transação:', err); }
  }, []);

  // ─── EVENT ACTIONS (API) ──────────────────────────────────────────────────
  const addEvent = useCallback(async (e: any) => {
    try {
      // Backend espera startDate (ISO 8601), não 'date'+'time' separados
      const datePart = e.date || new Date().toISOString().split('T')[0];
      const timePart = e.time || '09:00';
      const startDate = `${datePart}T${timePart}:00`;

      const body = {
        title: e.title,
        description: e.description || null,
        type: (e.type && e.type !== 'reunião') ? e.type.toUpperCase() : 'INTERNO',
        startDate,
        endDate: null,
        allDay: false,
        location: e.location || null,
        color: e.color || 'var(--primary)',
        clientId: e.clientId || null,
        projectId: e.projectId || null,
      };
      const data = await apiFetch<any>('/api/events', { method: 'POST', body: JSON.stringify(body) });
      // Normaliza resposta de volta ao formato do frontend
      setEvents(prev => [...prev, {
        ...e,
        id: data.id,
        date: datePart,
        time: timePart,
        color: data.color || e.color || 'var(--primary)',
      }]);
    } catch (err) { console.error('Erro ao adicionar evento:', err); }
  }, []);

  const updateEvent = useCallback((id: string, patch: any) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));
  }, []);

  const deleteEvent = useCallback(async (id: string) => {
    try {
      await apiFetch(`/api/events/${id}`, { method: 'DELETE' });
      setEvents(prev => prev.filter(e => e.id !== id));
    } catch (err) { console.error('Erro ao excluir evento:', err); }
  }, []);

  // ─── CONTENT ACTIONS ──────────────────────────────────────────────────────
  const addContent = useCallback((c: any) => setContent(prev => [{ ...c, id: `cp${Date.now()}`, createdAt: new Date().toISOString().split('T')[0] }, ...prev]), []);
  const updateContent = useCallback((id: string, data: any) => setContent(prev => prev.map(c => c.id === id ? { ...c, ...data } : c)), []);
  const updateContentStatus = useCallback((id: string, status: any, reason?: string) => setContent(prev => prev.map(c => c.id === id ? { ...c, status, rejectionReason: reason } : c)), []);
  const updateContentComments = useCallback((postId: string, comment: { author: string; text: string }) => {
    const newComment = { ...comment, id: `msg-${Date.now()}`, date: new Date().toISOString() };
    setContent(prev => prev.map(c => c.id === postId ? { ...c, comments: [...(c.comments || []), newComment] } : c));
  }, []);
  const deleteContent = useCallback((id: string) => setContent(prev => prev.filter(c => c.id !== id)), []);

  // ─── TEAM ACTIONS (API) ──────────────────────────────────────────────────
  const addTeamMember = useCallback(async (m: any) => {
    try {
      const data = await apiFetch<any>('/api/users', { method: 'POST', body: JSON.stringify(m) });
      setTeam(prev => [...prev, { ...m, id: data.id, initials: m.name.substring(0, 2).toUpperCase(), performance: 5, tasksOpen: 0, ratings: [] }]);
    } catch (err) { console.error('Erro ao adicionar membro:', err); }
  }, []);

  const updateTeamMember = useCallback(async (id: string, data: any) => {
    try {
      await apiFetch(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      setTeam(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
    } catch (err) { console.error('Erro ao atualizar membro:', err); }
  }, []);

  const refreshTeam = useCallback(async () => {
    try {
      const users = await apiFetch<any[]>('/api/users');
      setTeam(users.map((u: any) => {
        let prefs: any = {};
        try { prefs = typeof u.preferences === 'string' ? JSON.parse(u.preferences) : (u.preferences || {}); } catch {}
        return {
          id: u.id, name: u.name, initials: u.name.substring(0, 2).toUpperCase(),
          role: u.role, sector: u.sector || '', email: u.email, avatar: u.avatar,
          bio: u.bio || '', contracts: prefs.contracts || [], preferences: prefs,
          performance: 5, tasksOpen: 0, ratings: []
        };
      }));
    } catch (err) { console.error('Erro ao recarregar equipe:', err); }
  }, []);

  const deleteTeamMember = useCallback(async (id: string) => {
    try {
      await apiFetch(`/api/users/${id}`, { method: 'DELETE' });
      setTeam(prev => prev.filter(m => m.id !== id));
    } catch (err) { console.error('Erro ao excluir membro:', err); }
  }, []);

  const addTeamRating = useCallback((memberId: string, stars: number, feedback: string) => {
    setTeam(prev => prev.map(m => m.id === memberId ? { ...m, ratings: [...m.ratings, { stars, feedback, date: new Date().toISOString() }] } : m));
  }, []);

  const updateMemberPassword = useCallback(async (id: string, password: string) => {
    try {
      await apiFetch(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify({ password }) });
    } catch (err) { console.error('Erro ao atualizar senha:', err); }
  }, []);

  const updateMemberPermissions = useCallback(async (id: string, permissions: string[], accessLevel: any) => {
    try {
      await apiFetch(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify({ permissions, accessLevel }) });
      setTeam(prev => prev.map(m => m.id === id ? { ...m, permissions, accessLevel } : m));
    } catch (err) { console.error('Erro ao atualizar permissões:', err); }
  }, []);

  // ─── CHAT ACTIONS (API) ───────────────────────────────────────────────────
  const updateMemberPreferences = useCallback(async (memberId: string, preferences: any) => {
    try {
      await apiFetch(`/api/users/${memberId}`, {
        method: 'PUT',
        body: JSON.stringify({ preferences: typeof preferences === 'string' ? preferences : JSON.stringify(preferences) })
      });
      setTeam(prev => prev.map(m => m.id === memberId ? { ...m, preferences } : m));
    } catch (err) { console.error('Erro ao atualizar preferências do membro:', err); }
  }, []);

  const addMessage = useCallback(async (channelId: string, authorInitials: string, authorName: string, text: string) => {
    try {
      const msg = await apiFetch<any>('/api/chat/messages', {
        method: 'POST',
        body: JSON.stringify({ channelId, text })
      });
      const frontendMsg = { 
        id: msg.id, author: authorInitials, authorName, text, 
        time: new Date(msg.timestamp).toLocaleTimeString(), date: msg.timestamp 
      };
      setChat(prev => ({ ...prev, channels: prev.channels.map(ch => ch.id === channelId ? { ...ch, messages: [...ch.messages, frontendMsg] } : ch) }));
    } catch (err) {
      console.error('[Chat] Erro ao enviar mensagem:', err);
    }
  }, []);

  // ─── FEED ACTIONS (API) ───────────────────────────────────────────────────
  const addFeedPost = useCallback(async (p: any) => {
    try {
      const data = await apiFetch<any>('/api/feed', {
        method: 'POST',
        body: JSON.stringify({ text: p.content, type: p.type })
      });
      setFeed(prev => [{ 
        ...p, id: data.id, authorName: data.authorName, 
        authorInitials: data.authorName.substring(0, 2).toUpperCase(), createdAt: data.createdAt 
      }, ...prev]);
    } catch (err) {
      console.error('[Feed] Erro ao criar post:', err);
    }
  }, []);

  const deleteFeedPost = useCallback((id: string) => setFeed(prev => prev.filter(f => f.id !== id)), []);
  const pinFeedPost = useCallback((id: string) => setFeed(prev => prev.map(f => f.id === id ? { ...f, pinned: !f.pinned } : f)), []);
  
  const addFeedComment = useCallback(async (postId: string, comment: any) => {
    try {
      const data = await apiFetch<any>(`/api/feed/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ text: comment.text })
      });
      setFeed(prev => prev.map(f => f.id === postId ? { 
        ...f, comments: [...(f.comments || []), { ...comment, id: data.id, date: data.createdAt }] 
      } : f));
    } catch (err) {
      console.error('[Feed] Erro ao comentar:', err);
    }
  }, []);

  const sendTicketWANotification = useCallback(async (ticketId: string, type: 'created' | 'status_update' | 'new_message', extra?: string) => {
    setTickets(currentTickets => {
      const ticket = currentTickets.find(t => t.id === ticketId);
      if (ticket && ticket.clientWhastapp) {
        const portalUrl = `${window.location.origin}/suporte`;
        let message = '';

        if (type === 'created') {
          message = `✅ Olá ${ticket.clientName}! Recebemos seu chamado: *${ticket.subject}*.\n\nProtocolo: #${ticket.id}\nAcompanhe em tempo real aqui: ${portalUrl}`;
        } else if (type === 'status_update') {
          message = `⏳ Olá ${ticket.clientName}! O status do seu chamado *#${ticket.id}* foi atualizado para: *${extra?.toUpperCase()}*.\n\nVeja os detalhes: ${portalUrl}`;
        } else if (type === 'new_message') {
          message = `💬 Olá ${ticket.clientName}! Você recebeu uma nova resposta no seu chamado *#${ticket.id}*.\n\n"${extra?.substring(0, 50)}..."\n\nResponda em: ${portalUrl}`;
        }

        if (message) {
          apiFetch('/api/whatsapp/send', {
            method: 'POST',
            body: JSON.stringify({ phone: ticket.clientWhastapp, message }),
          }).catch(err => console.error('[WA Notification] Erro:', err));
        }
      }
      return currentTickets;
    });
  }, []);

  // ─── TICKETS ACTIONS (API) ─────────────────────────────────────────────────
  const addTicket = useCallback(async (t: any) => {
    try {
      const data = await apiFetch<any>('/api/public/tickets', {
        method: 'POST',
        body: JSON.stringify({
          subject: t.subject,
          description: t.description || '',
          clientName: t.clientName,
          clientWhatsapp: t.clientWhastapp
        })
      });
      
      const newTicket: Ticket = {
        ...t, id: data.id, protocol: data.protocol, status: 'novo', messages: [],
        createdAt: data.createdAt, updatedAt: data.updatedAt
      };
      
      setTickets(prev => [newTicket, ...prev]);
      sendTicketWANotification(data.id, 'created');
    } catch (err) {
      console.error('[Tickets] Erro ao criar ticket:', err);
    }
  }, [sendTicketWANotification]);

  const updateTicket = useCallback(async (id: string, data: any) => {
    try {
      const updated = await apiFetch<any>(`/api/tickets/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      
      setTickets(prev => prev.map(t => t.id === id ? { 
        ...t, status: (updated.status || t.status).toLowerCase() as any, 
        priority: (updated.priority || t.priority).toLowerCase() as any 
      } : t));

      if (data.status) {
        sendTicketWANotification(id, 'status_update', data.status);
      }
    } catch (err) {
      console.error('[Tickets] Erro ao atualizar ticket:', err);
    }
  }, [sendTicketWANotification]);

  const addTicketMessage = useCallback(async (ticketId: string, message: any) => {
    try {
      const data = await apiFetch<any>(`/api/tickets/${ticketId}/messages`, {
        method: 'POST',
        body: JSON.stringify(message)
      });
      
      const frontendMsg = {
        id: data.id, authorName: data.authorName, text: data.text,
        createdAt: data.createdAt, isInternal: data.isInternal
      };

      setTickets(prev => prev.map(t => t.id === ticketId ? { 
        ...t, messages: [...t.messages, frontendMsg], updatedAt: data.createdAt 
      } : t));

      if (!message.isInternal) {
        sendTicketWANotification(ticketId, 'new_message', data.text);
      }
    } catch (err) {
      console.error('[Tickets] Erro ao enviar mensagem:', err);
    }
  }, [sendTicketWANotification]);

  const deleteTicket = useCallback((id: string) => {
    setTickets(prev => prev.filter(t => t.id !== id));
  }, []);

  const updateGoal = useCallback(async (id: string, current: number) => {
    try {
      await apiFetch(`/api/goals/${id}`, { method: 'PUT', body: JSON.stringify({ current }) });
      setGoals(prev => prev.map(g => g.id === id ? { ...g, current } : g));
    } catch (err) {
      console.error('[Goals] Erro ao atualizar meta:', err);
    }
  }, []);

  // ─── COMPUTED ─────────────────────────────────────────────────────────────
  const getMonthRevenue = () => transactions.filter(t => t.type === 'income' && t.status === 'pago').reduce((a, b) => a + b.amount, 0);
  const getMonthExpense = () => transactions.filter(t => t.type === 'expense' && t.status === 'pago').reduce((a, b) => a + b.amount, 0);
  const getBalance = () => getMonthRevenue() - getMonthExpense();

  const createTechService = async (t: Omit<TechService, 'id'>) => {
    try {
      const res = await apiFetch<TechService>('/api/tech', { method: 'POST', body: JSON.stringify(t) });
      setTechStack(prev => [...prev, res]);
    } catch (err) { }
  };

  const createAgencyProcess = async (p: Omit<AgencyProcess, 'id'>) => {
    try {
      const res = await apiFetch<AgencyProcess>('/api/processos', { method: 'POST', body: JSON.stringify(p) });
      setProcessos(prev => [...prev, res]);
    } catch (err) { }
  };

  return (
    <DataContext.Provider value={{
      clients, contracts, projects, kanban, pipeline, transactions, events, content, team, chat, feed,
      alerts,
      goals,
      logs,
      apiReady,
      addClient, updateClient, deleteClient, addClientNote,
      addContract, updateContract, updateContractStatus, deleteContract,
      addProject, updateProject, deleteProject, addProjectMeeting,
      setKanban, addTask, updateTask, deleteTask,
      setPipeline, addPipelineDeal, updatePipelineDeal,
      addTransaction, updateTransactionStatus, updateTransaction, deleteTransaction,
      addEvent, updateEvent, deleteEvent, updateClientContentPlan, updateClientSchedule, updateContentComments,
      addContent, updateContent, updateContentStatus, deleteContent,
      addTeamMember, updateTeamMember, deleteTeamMember, addTeamRating, refreshTeam,
      updateMemberPassword, updateMemberPermissions, updateMemberPreferences,
      addMessage, addFeedPost, deleteFeedPost, pinFeedPost, addFeedComment,
      archiveTask, addTaskLog, updateGoal,
      addTicket, updateTicket, addTicketMessage, deleteTicket,
      tickets,
      getClientById: (id) => clients.find(c => c.id === id),
      getProjectById: (id) => projects.find(p => p.id === id),
      getContractById: (id) => contracts.find(c => c.id === id),
      getTodayEvents: () => {
        const today = new Date().toISOString().split('T')[0];
        return events.filter(e => e.date === today);
      },
      getOverdueTasks: () => {
        const today = new Date().toISOString().split('T')[0];
        return kanban.flatMap(c => c.tasks).filter(t => t.dueDate && t.dueDate < today && !t.isArchived);
      },
      getBalance, getMonthRevenue, getMonthExpense,
      getPendingReceivables: () => transactions.filter(t => t.type === 'income' && t.status === 'pendente').reduce((a, b) => a + b.amount, 0),
      getAtRiskProjects: () => projects.filter(p => p.status === 'atrasado'),
      getExpiringContracts: () => contracts.filter(c => c.status === 'vencendo'),
      getInactiveClients: () => clients.filter(c => c.status === 'inativo'),
      waState, sendWAMessage, syncWAContacts, startWA, disconnectWA,
      techStack, processos, createTechService, createAgencyProcess
    }}>
      {children}
    </DataContext.Provider>
  );
};
