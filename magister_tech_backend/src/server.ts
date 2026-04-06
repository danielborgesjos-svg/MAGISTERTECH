import express from 'express';
import cors from 'cors';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { startWhatsApp, disconnectWhatsApp, getWAState, addWAListener, removeWAListener, sendWAMessage } from './whatsapp';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

app.use(cors());
app.use(express.json());

// =====================================================
// AUDIT LOG HELPER
// =====================================================
async function logAudit(userId: string, action: string, systemModule: string, details: any) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        module: systemModule,
        details: JSON.stringify(details)
      }
    });
  } catch (err) {
    console.error('[AuditLog] Erro ao registrar:', err);
  }
}

// =====================================================
// MIDDLEWARE DE AUTENTICAÇÃO
// =====================================================
const authMiddleware = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
};

// =====================================================
// MIDDLEWARE RBAC — verifica roles permitidos
// =====================================================
// Roles: ADMIN | GESTOR | COLABORADOR | CLIENTE
const requireRole = (...roles: string[]) => (req: any, res: any, next: any) => {
  const userRole = (req.user?.role || '').toUpperCase();
  const allowed = roles.map(r => r.toUpperCase());

  // ADMIN e CEO têm acesso irrestrito
  if (['ADMIN', 'CEO'].includes(userRole)) return next();

  if (!allowed.includes(userRole)) {
    return res.status(403).json({
      error: 'Acesso negado. Você não tem permissão para esta operação.',
      required: roles,
      current: userRole,
    });
  }
  next();
};

// CLIENTE não pode acessar rotas internas de gestão
const blockCliente = (req: any, res: any, next: any) => {
  const userRole = (req.user?.role || '').toUpperCase();
  if (userRole === 'CLIENTE') {
    return res.status(403).json({ error: 'Área restrita à equipe interna.' });
  }
  next();
};

// =====================================================
// AUTH ROUTES
// =====================================================
app.post('/api/auth/login', async (req: any, res: any) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Credenciais inválidas.' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Credenciais inválidas.' });

    if (!user.isActive) return res.status(401).json({ error: 'Usuário inativo.' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar }
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

app.get('/api/auth/me', authMiddleware, async (req: any, res: any) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// =====================================================
// USERS ROUTES
// =====================================================
app.get('/api/users', authMiddleware, blockCliente, async (_req: any, res: any) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, sector: true, avatar: true, isActive: true }
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar usuários.' });
  }
});

// =====================================================
// CLIENTS (CRM) — CRUD COMPLETO
// =====================================================
app.get('/api/clients', authMiddleware, blockCliente, async (_req: any, res: any) => {
  try {
    const clients = await prisma.client.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(clients);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar clientes.' });
  }
});

app.get('/api/clients/:id', authMiddleware, blockCliente, async (req: any, res: any) => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: req.params.id },
      include: {
        projects: true,
        contracts: true,
        interactions: {
          orderBy: { date: 'desc' },
          include: { user: { select: { name: true } } }
        },
        tasks: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { assignee: { select: { name: true, avatar: true } } }
        }
      }
    });
    if (!client) return res.status(404).json({ error: 'Cliente não encontrado.' });
    res.json(client);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar cliente.' });
  }
});

// GET /api/clients/:id/hub — visão 360 do cliente
app.get('/api/clients/:id/hub', authMiddleware, blockCliente, async (req: any, res: any) => {
  try {
    const clienteId = req.params.id;

    const [cliente, contratoAtivo, projetos, faturas, tarefas, conteudos] = await Promise.all([
      prisma.client.findUnique({ where: { id: clienteId } }),

      prisma.contract.findFirst({
        where: { clientId: clienteId, status: 'VIGENTE' },
        orderBy: { startDate: 'desc' },
      }),

      prisma.project.findMany({
        where: { clientId: clienteId, status: { in: ['EM_ANDAMENTO', 'PLANEJAMENTO'] } },
        orderBy: { createdAt: 'desc' },
      }),

      prisma.fatura.findMany({
        where: { clienteId },
        orderBy: { vencimento: 'desc' },
        take: 6,
      }),

      prisma.task.findMany({
        where: {
          clientId: clienteId,
          status: { notIn: ['ENTREGUE', 'PUBLICADO', 'APROVADO'] }
        },
        include: { assignee: { select: { id: true, name: true, avatar: true } } },
        orderBy: { deadline: 'asc' },
        take: 10,
      }),

      prisma.content.findMany({
        where: { clientId: clienteId, status: 'AGUARDANDO_APROVACAO' },
        include: { author: { select: { id: true, name: true } } },
        orderBy: { updatedAt: 'desc' },
        take: 8,
      }),
    ]);

    if (!cliente) return res.status(404).json({ error: 'Cliente não encontrado.' });

    res.json({ cliente, contratoAtivo, projetos, faturas, tarefas, conteudos });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar hub do cliente.' });
  }
});

// GET /api/clients/:id/kanban — tarefas do kanban interno filtradas por cliente
app.get('/api/clients/:id/kanban', authMiddleware, requireRole('ADMIN', 'CEO', 'GESTOR', 'GESTOR_PROJETOS', 'COLABORADOR'), async (req: any, res: any) => {
  try {
    const { assigneeId, tipo } = req.query as { assigneeId?: string; tipo?: string };

    const where: any = { clientId: req.params.id };
    if (assigneeId) where.assigneeId = assigneeId;
    if (tipo) where.tipo = tipo;

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar kanban do cliente.' });
  }
});

app.post('/api/clients', authMiddleware, requireRole('ADMIN', 'CEO', 'GESTOR', 'COMERCIAL'), async (req: any, res: any) => {
  try {
    const { name, company, email, phone, cnpj, status, segment, responsible, briefing, scope, healthScore } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome do cliente é obrigatório.' });

    const client = await prisma.client.create({
      data: { name, company, email, phone, cnpj, status: status || 'ATIVO', segment, responsible, briefing, scope, healthScore: healthScore || 0 }
    });
    res.status(201).json(client);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar cliente.' });
  }
});

app.put('/api/clients/:id', authMiddleware, requireRole('ADMIN', 'CEO', 'GESTOR', 'COMERCIAL'), async (req: any, res: any) => {
  try {
    const { name, company, email, phone, cnpj, status, segment, responsible, briefing, scope, strategies, observations, healthScore } = req.body;
    const client = await prisma.client.update({
      where: { id: req.params.id },
      data: { name, company, email, phone, cnpj, status, segment, responsible, briefing, scope, strategies, observations, healthScore }
    });
    res.json(client);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar cliente.' });
  }
});

app.delete('/api/clients/:id', authMiddleware, requireRole('ADMIN', 'CEO'), async (req: any, res: any) => {
  try {
    await prisma.client.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir cliente.' });
  }
});

// =====================================================
// PROJECTS — CRUD COMPLETO
// =====================================================
app.get('/api/projects', authMiddleware, blockCliente, async (_req: any, res: any) => {
  try {
    const projects = await prisma.project.findMany({
      include: { client: { select: { name: true, company: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar projetos.' });
  }
});

app.get('/api/projects/:id', authMiddleware, blockCliente, async (req: any, res: any) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        client: { select: { name: true, company: true } },
        tasks: { include: { assignee: { select: { name: true, avatar: true } } } },
        contents: true,
      }
    });
    if (!project) return res.status(404).json({ error: 'Projeto não encontrado.' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar projeto.' });
  }
});

app.post('/api/projects', authMiddleware, requireRole('ADMIN', 'CEO', 'GESTOR', 'GESTOR_PROJETOS'), async (req: any, res: any) => {
  try {
    const { name, type, status, startDate, endDate, description, deliverables, observations, clientId } = req.body;
    if (!name || !clientId || !startDate) return res.status(400).json({ error: 'name, clientId e startDate são obrigatórios.' });

    const project = await prisma.project.create({
      data: { name, type: type || 'marketing', status: status || 'EM_ANDAMENTO', startDate: new Date(startDate), endDate: endDate ? new Date(endDate) : null, description, deliverables, observations, clientId }
    });
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar projeto.' });
  }
});

app.put('/api/projects/:id', authMiddleware, requireRole('ADMIN', 'CEO', 'GESTOR', 'GESTOR_PROJETOS'), async (req: any, res: any) => {
  try {
    const { name, type, status, startDate, endDate, description, deliverables, observations } = req.body;
    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        name, type, status,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : null,
        description, deliverables, observations
      }
    });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar projeto.' });
  }
});

app.delete('/api/projects/:id', authMiddleware, requireRole('ADMIN', 'CEO'), async (req: any, res: any) => {
  try {
    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir projeto.' });
  }
});

// =====================================================
// TASKS — CRUD COMPLETO
// =====================================================
app.get('/api/tasks', authMiddleware, blockCliente, async (req: any, res: any) => {
  try {
    const { clientId, status, assigneeId } = req.query as any;
    const where: any = {};
    if (clientId) where.clientId = clientId;
    if (status) where.status = status;
    if (assigneeId) where.assigneeId = assigneeId;

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
        client: { select: { name: true } },
        project: { select: { name: true } },
      },
      orderBy: { order: 'asc' }
    });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar tarefas.' });
  }
});

app.post('/api/tasks', authMiddleware, blockCliente, async (req: any, res: any) => {
  try {
    const { title, description, status, priority, deadline, tipo, assigneeId, projectId, clientId, tags } = req.body;
    if (!title) return res.status(400).json({ error: 'Título é obrigatório.' });

    const task = await prisma.task.create({
      data: {
        title, description,
        status: status || 'BACKLOG',
        priority: priority || 'MEDIA',
        deadline: deadline ? new Date(deadline) : null,
        tipo: tipo || 'tarefa',
        assigneeId, projectId, clientId, tags
      },
      include: { assignee: { select: { id: true, name: true, avatar: true } } }
    });
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar tarefa.' });
  }
});

app.put('/api/tasks/:id', authMiddleware, blockCliente, async (req: any, res: any) => {
  try {
    const { title, description, status, priority, deadline, tipo, assigneeId, order } = req.body;
    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        title, description, status, priority,
        deadline: deadline ? new Date(deadline) : undefined,
        tipo, assigneeId, order
      },
      include: { assignee: { select: { id: true, name: true, avatar: true } } }
    });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar tarefa.' });
  }
});

app.put('/api/tasks/:id/status', authMiddleware, blockCliente, async (req: any, res: any) => {
  try {
    const { status } = req.body;
    const task = await prisma.task.update({ where: { id: req.params.id }, data: { status } });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar tarefa.' });
  }
});

app.delete('/api/tasks/:id', authMiddleware, requireRole('ADMIN', 'CEO', 'GESTOR', 'GESTOR_PROJETOS'), async (req: any, res: any) => {
  try {
    await prisma.task.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir tarefa.' });
  }
});

// =====================================================
// CONTRACTS — CRUD COMPLETO
// =====================================================
app.get('/api/contracts', authMiddleware, blockCliente, async (_req: any, res: any) => {
  try {
    const contracts = await prisma.contract.findMany({
      include: { client: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(contracts);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar contratos.' });
  }
});

app.get('/api/contracts/:id', authMiddleware, blockCliente, async (req: any, res: any) => {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id: req.params.id },
      include: {
        client: { select: { name: true, company: true } },
        faturas: { orderBy: { vencimento: 'desc' } },
      }
    });
    if (!contract) return res.status(404).json({ error: 'Contrato não encontrado.' });
    res.json(contract);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar contrato.' });
  }
});

app.post('/api/contracts', authMiddleware, requireRole('ADMIN', 'CEO', 'GESTOR', 'COMERCIAL', 'FINANCEIRO'), async (req: any, res: any) => {
  try {
    const { title, type, value, recurrence, startDate, endDate, status, renewal, observations, fileUrl, clientId } = req.body;
    if (!title || !value || !startDate || !clientId) return res.status(400).json({ error: 'title, value, startDate e clientId são obrigatórios.' });

    const contract = await prisma.contract.create({
      data: {
        title, type: type || 'servicos', value: parseFloat(value),
        recurrence, startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        status: status || 'VIGENTE', renewal: renewal || false,
        observations, fileUrl, clientId
      }
    });
    res.status(201).json(contract);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar contrato.' });
  }
});

app.put('/api/contracts/:id', authMiddleware, requireRole('ADMIN', 'CEO', 'GESTOR', 'COMERCIAL', 'FINANCEIRO'), async (req: any, res: any) => {
  try {
    const { title, type, value, recurrence, startDate, endDate, status, renewal, observations, fileUrl } = req.body;
    const contract = await prisma.contract.update({
      where: { id: req.params.id },
      data: {
        title, type, value: value ? parseFloat(value) : undefined,
        recurrence,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : null,
        status, renewal, observations, fileUrl
      }
    });
    res.json(contract);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar contrato.' });
  }
});

app.delete('/api/contracts/:id', authMiddleware, requireRole('ADMIN', 'CEO'), async (req: any, res: any) => {
  try {
    await prisma.contract.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir contrato.' });
  }
});

// =====================================================
// FATURAS — CRUD
// =====================================================
app.get('/api/faturas', authMiddleware, requireRole('ADMIN', 'CEO', 'GESTOR', 'FINANCEIRO'), async (req: any, res: any) => {
  try {
    const { contratoId, clienteId } = req.query as any;
    const where: any = {};
    if (contratoId) where.contratoId = contratoId;
    if (clienteId) where.clienteId = clienteId;

    const faturas = await prisma.fatura.findMany({
      where,
      include: {
        contrato: { select: { title: true, value: true } },
        cliente: { select: { name: true } },
      },
      orderBy: { vencimento: 'desc' }
    });
    res.json(faturas);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar faturas.' });
  }
});

app.post('/api/faturas', authMiddleware, requireRole('ADMIN', 'CEO', 'GESTOR', 'FINANCEIRO'), async (req: any, res: any) => {
  try {
    const { contratoId, clienteId, valor, vencimento, descricao } = req.body;
    if (!contratoId || !clienteId || !valor || !vencimento) return res.status(400).json({ error: 'contratoId, clienteId, valor e vencimento são obrigatórios.' });

    const fatura = await prisma.fatura.create({
      data: { contratoId, clienteId, valor: parseFloat(valor), vencimento: new Date(vencimento), descricao }
    });
    res.status(201).json(fatura);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar fatura.' });
  }
});

app.put('/api/faturas/:id/status', authMiddleware, requireRole('ADMIN', 'CEO', 'GESTOR', 'FINANCEIRO'), async (req: any, res: any) => {
  try {
    const { status } = req.body;
    const data: any = { status };
    if (status === 'PAGO') data.paidAt = new Date();
    const fatura = await prisma.fatura.update({ where: { id: req.params.id }, data });
    res.json(fatura);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar fatura.' });
  }
});

// =====================================================
// DASHBOARD KPI ROUTES
// =====================================================
app.get('/api/dashboard/kpis', authMiddleware, blockCliente, async (_req: any, res: any) => {
  try {
    const activeClients = await prisma.client.count({ where: { status: 'ATIVO' } });
    const activeProjects = await prisma.project.count({ where: { status: 'EM_ANDAMENTO' } });
    const pendingTasks = await prisma.task.count({ where: { status: { in: ['BACKLOG', 'A_FAZER', 'DOING', 'REVIEW'] } } });

    const contracts = await prisma.contract.findMany({ where: { status: 'VIGENTE' } });
    const monthlyRevenue = contracts.reduce((acc: number, curr: any) => acc + curr.value, 0);

    const revenueChart = [
      { name: 'Out', total: monthlyRevenue * 0.8 },
      { name: 'Nov', total: monthlyRevenue * 0.85 },
      { name: 'Dez', total: monthlyRevenue * 0.9 },
      { name: 'Jan', total: monthlyRevenue * 0.95 },
      { name: 'Fev', total: monthlyRevenue * 1.0 },
      { name: 'Mar', total: monthlyRevenue }
    ];

    res.json({ activeClients, activeProjects, pendingTasks, monthlyRevenue, revenueChart });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar KPIs.' });
  }
});

// =====================================================
// WHATSAPP ENGINE ROUTES
// =====================================================

// SSE stream: tempo real de QR Code e status
app.get('/api/whatsapp/stream', authMiddleware, requireRole('ADMIN', 'CEO'), (req: any, res: any) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (data: any) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  // Envia estado atual imediatamente
  send(getWAState());

  addWAListener(send);

  req.on('close', () => {
    removeWAListener(send);
  });
});

// Status simples (polling)
app.get('/api/whatsapp/status', authMiddleware, requireRole('ADMIN', 'CEO'), (_req: any, res: any) => {
  res.json(getWAState());
});

// Iniciar conexão (gera QR Code)
app.post('/api/whatsapp/start', authMiddleware, requireRole('ADMIN', 'CEO'), (_req: any, res: any) => {
  startWhatsApp().catch(err => console.error('[WA Start]', err));
  res.json({ ok: true, message: 'Iniciando conexão WhatsApp...' });
});

// Desconectar sessão
app.post('/api/whatsapp/disconnect', authMiddleware, requireRole('ADMIN', 'CEO'), async (_req: any, res: any) => {
  await disconnectWhatsApp();
  res.json({ ok: true, message: 'WhatsApp desconectado.' });
});

// Listar contatos sincronizados
app.get('/api/whatsapp/contacts', authMiddleware, requireRole('ADMIN', 'CEO', 'GESTOR', 'COMERCIAL'), (_req: any, res: any) => {
  const { contacts, status } = getWAState();
  if (status !== 'connected') {
    return res.status(409).json({ error: 'WhatsApp não está conectado.' });
  }
  res.json(contacts);
});

// Sincronizar contatos do WA → Clientes no Prisma (importa como PROSPECT)
app.post('/api/whatsapp/sync-contacts', authMiddleware, requireRole('ADMIN', 'CEO'), async (_req: any, res: any) => {
  const { contacts, status } = getWAState();
  if (status !== 'connected') {
    return res.status(409).json({ error: 'WhatsApp não conectado.' });
  }

  let created = 0;
  let skipped = 0;

  for (const contact of contacts) {
    if (!contact.phone) continue;
    const existing = await prisma.client.findFirst({ where: { phone: contact.phone } });
    if (existing) { skipped++; continue; }
    await prisma.client.create({
      data: {
        name: contact.name,
        phone: contact.phone,
        status: 'PROSPECT',
        segment: 'WhatsApp Import',
      }
    });
    created++;
  }

  res.json({ ok: true, created, skipped, message: `Sincronização concluída: ${created} criados, ${skipped} ignorados.` });
});

// Envia mensagem pelo WhatsApp (Atendimento N1 CRM)
app.post('/api/whatsapp/send', authMiddleware, async (req: any, res: any) => {
  const { phone, message } = req.body;
  if (!phone || !message) {
    return res.status(400).json({ error: 'Telefone e mensagem são obrigatórios.' });
  }

  const { status } = getWAState();
  if (status !== 'connected') {
    return res.status(409).json({ error: 'Motor do WhatsApp não está conectado.' });
  }

  try {
    const formattedMessage = `*${req.user.name} diz:*\n\n${message}`;
    await sendWAMessage(phone, formattedMessage);
    
    // Registrar na auditoria
    await logAudit(req.user.id, 'MENSAGEM_ENVIADA', 'WHATSAPP', { phone, message: formattedMessage });
    
    res.json({ ok: true, message: 'Mensagem enviada com sucesso!' });
  } catch (err: any) {
    res.status(500).json({ error: 'Falha ao enviar mensagem', details: err.message });
  }
});

// Listar Logs de Auditoria (Apenas ADMIN/CEO)
app.get('/api/audit', authMiddleware, requireRole('ADMIN', 'CEO'), async (_req: any, res: any) => {
  try {
    const logs = await prisma.auditLog.findMany({
      include: { user: { select: { name: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar auditoria' });
  }
});

// =====================================================
// SERVE FRONTEND ESTÁTICO (SPA fallback)
// =====================================================
const frontendDist = path.resolve(__dirname, '../../magister_tech_app/dist');
app.use(express.static(frontendDist));

app.get('/{*splat}', (_req: any, res: any) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Magister Tech rodando na porta ${PORT}`);
  console.log(`   Landing:    http://localhost:${PORT}/`);
  console.log(`   Painel:     http://localhost:${PORT}/admin`);
});
