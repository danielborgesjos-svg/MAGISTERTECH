import express from 'express';
import cors from 'cors';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

app.use(cors());
app.use(express.json());

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
    
    res.json({
      id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// =====================================================
// USERS ROUTES
// =====================================================
app.get('/api/users', authMiddleware, async (_req: any, res: any) => {
  try {
    const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, sector: true, avatar: true, isActive: true }});
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar usuários.' });
  }
});

// =====================================================
// CLIENTS (CRM) ROUTES
// =====================================================
app.get('/api/clients', authMiddleware, async (_req: any, res: any) => {
  try {
    const clients = await prisma.client.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(clients);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar clientes.' });
  }
});

app.get('/api/clients/:id', authMiddleware, async (req: any, res: any) => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: req.params.id },
      include: {
        projects: true,
        contracts: true,
        interactions: { orderBy: { date: 'desc' }, include: { user: { select: { name: true } } } },
        tasks: { orderBy: { createdAt: 'desc' }, take: 10, include: { assignee: { select: { name: true } } } }
      }
    });
    if (!client) return res.status(404).json({ error: 'Cliente não encontrado.' });
    res.json(client);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar cliente.' });
  }
});

// =====================================================
// PROJECTS ROUTES
// =====================================================
app.get('/api/projects', authMiddleware, async (_req: any, res: any) => {
  try {
    const projects = await prisma.project.findMany({ include: { client: { select: { name: true, company: true } } }, orderBy: { createdAt: 'desc' } });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar projetos.' });
  }
});

// =====================================================
// TASKS & KANBAN ROUTES
// =====================================================
app.get('/api/tasks', authMiddleware, async (_req: any, res: any) => {
  try {
    const tasks = await prisma.task.findMany({ 
      include: { 
        assignee: { select: { name: true, avatar: true } },
        client: { select: { name: true } }
      },
      orderBy: { order: 'asc' } 
    });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar tarefas.' });
  }
});

app.put('/api/tasks/:id/status', authMiddleware, async (req: any, res: any) => {
  try {
    const { status } = req.body;
    const task = await prisma.task.update({ where: { id: req.params.id }, data: { status } });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar tarefa.' });
  }
});

// =====================================================
// CONTRACTS ROUTES
// =====================================================
app.get('/api/contracts', authMiddleware, async (_req: any, res: any) => {
  try {
    const contracts = await prisma.contract.findMany({ include: { client: { select: { name: true } } }, orderBy: { createdAt: 'desc' } });
    res.json(contracts);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar contratos.' });
  }
});

// =====================================================
// DASHBOARD KPI ROUTES
// =====================================================
app.get('/api/dashboard/kpis', authMiddleware, async (_req: any, res: any) => {
  try {
    const activeClients = await prisma.client.count({ where: { status: 'ATIVO' } });
    const activeProjects = await prisma.project.count({ where: { status: 'EM_ANDAMENTO' } });
    const pendingTasks = await prisma.task.count({ where: { status: { in: ['BACKLOG', 'A_FAZER', 'DOING', 'REVIEW'] } } });
    
    const contracts = await prisma.contract.findMany({ where: { status: 'VIGENTE' } });
    const monthlyRevenue = contracts.reduce((acc: number, curr: any) => acc + curr.value, 0);
    
    // Gráfico mock (6 meses)
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
