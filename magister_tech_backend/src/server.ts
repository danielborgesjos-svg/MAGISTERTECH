import express from 'express';
import multer from 'multer';
import fs from 'fs';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { startWhatsApp, disconnectWhatsApp, resetWhatsAppSession, getWAState, addWAListener, removeWAListener, sendWAMessage } from './whatsapp';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const IS_PROD = process.env.NODE_ENV === 'production';
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3001',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sem origin (ex: mobile apps, curl, server-to-server)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Em desenvolvimento libera tudo
    }
  },
  credentials: true, // ESSENCIAL para envio automático de cookies
}));
app.use(cookieParser());
app.use(express.json());

// =====================================================
// MULTER SETUP FOR UPLOADS
// =====================================================
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve a pasta de uploads de forma estática para testes e visualização
app.use('/uploads', express.static(uploadDir));

const storage = multer.diskStorage({
  destination: (req, res, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

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
// MIDDLEWARE DE AUTENTICAÇÃO — httpOnly Cookie primeiro, Bearer fallback
// =====================================================
const authMiddleware = async (req: any, res: any, next: any) => {
  // 1. Tentar ler token do cookie httpOnly (método principal)
  let token = req.cookies?.magister_jwt;

  // 2. Fallback: Authorization Bearer (retrocompatibilidade e VPS)
  if (!token) {
    token = req.headers.authorization?.split(' ')[1];
  }

  if (!token) return res.status(401).json({ error: 'Acesso negado. Sessão não autenticada.' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;

    // --- IMPERSONATION SECURE OVERRIDE ---
    const impUserId = req.headers['x-impersonate-user'];
    if (impUserId && ['ADMIN', 'CEO'].includes(decoded.role.toUpperCase())) {
      const impUser = await prisma.user.findUnique({ where: { id: impUserId } });
      if (impUser) {
        req.realUser = decoded; // Mantém o admin original salvo
        req.user = { id: impUser.id, email: impUser.email, role: impUser.role, name: impUser.name };
      }
    }

    // AUTO-RENEW: Se o token expira em menos de 2 dias, renova silenciosamente
    const expiresAt = decoded.exp ? decoded.exp * 1000 : 0;
    const twoDays = 2 * 24 * 60 * 60 * 1000;
    
    if (expiresAt > 0 && (expiresAt - Date.now() < twoDays)) {
      const renewedToken = jwt.sign(
        { id: decoded.id, email: decoded.email, role: decoded.role, name: decoded.name },
        JWT_SECRET,
        { expiresIn: '30d' }
      );
      res.cookie('magister_jwt', renewedToken, {
        httpOnly: true,
        secure: false, // Desabilitado para suportar acesso via IP HTTP na VPS
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: '/'
      });
    }

    next();
  } catch (err: any) {
    console.error('[AuthMiddleware] Erro na validação:', err.message);
    // Cookie inválido — limpar e negar
    res.clearCookie('magister_jwt');
    res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' });
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
      { expiresIn: '7d' } // 7 dias — chave se renova sozinha
    );

    // === COOKIE httpOnly — Não acessível por JavaScript ===
    res.cookie('magister_jwt', token, {
      httpOnly: true,        // Não acessível via document.cookie
      secure: false,         // Desabilitado para suportar acesso via IP HTTP na VPS
      sameSite: 'lax',       // 'lax' garante envio correto em SPAs
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 dias — sessão persistente
      path: '/',
    });

    // Retornar token também no body para compatibilidade (ex: apps mobile)
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, coverUrl: (user as any).coverUrl, bio: (user as any).bio, phone: user.phone, sector: user.sector, preferences: user.preferences }
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// Logout — Limpa o cookie no servidor
app.post('/api/auth/logout', (_req: any, res: any) => {
  res.clearCookie('magister_jwt', { path: '/' });
  res.json({ ok: true, message: 'Sessão encerrada.' });
});

app.get('/api/auth/me', authMiddleware, async (req: any, res: any) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
    res.json({ 
      id: user.id, name: user.name, email: user.email, role: user.role, 
      avatar: user.avatar, coverUrl: (user as any).coverUrl, bio: (user as any).bio,
      phone: user.phone, sector: user.sector, preferences: user.preferences 
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// Atualizar perfil do usuário logado
app.put('/api/users/profile', authMiddleware, async (req: any, res: any) => {
  try {
    const { name, bio, phone, sector, avatarUrl, coverUrl } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name && { name }),
        ...(phone !== undefined && { phone }),
        ...(sector !== undefined && { sector }),
        ...(avatarUrl !== undefined && { avatar: avatarUrl }),
        ...((coverUrl !== undefined) && { coverUrl } as any),
        ...((bio !== undefined) && { bio } as any),
      }
    });
    await logAudit(req.user.id, 'PROFILE_UPDATED', 'EQUIPE', { name, avatarUrl, coverUrl });
    res.json({ 
      ok: true, 
      user: { 
        id: updated.id, name: updated.name, email: updated.email, role: updated.role,
        avatar: updated.avatar, coverUrl: (updated as any).coverUrl, bio: (updated as any).bio,
        phone: updated.phone, sector: updated.sector, preferences: updated.preferences 
      } 
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar perfil.' });
  }
});

// =====================================================
// USERS ROUTES
// =====================================================
app.get('/api/users', authMiddleware, blockCliente, async (_req: any, res: any) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, sector: true, avatar: true, isActive: true, phone: true }
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar usuários.' });
  }
});

app.put('/api/users/preferences', authMiddleware, async (req: any, res: any) => {
  try {
    const { preferences } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { preferences: JSON.stringify(preferences) }
    });
    res.json({ ok: true, preferences: user.preferences });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao salvar preferências.' });
  }
});

// Trocar senha do usuário logado
app.put('/api/users/change-password', authMiddleware, async (req: any, res: any) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'A nova senha deve ter ao menos 6 caracteres.' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(401).json({ error: 'Senha atual incorreta.' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });
    await logAudit(req.user.id, 'PASSWORD_CHANGED', 'EQUIPE', {});
    res.json({ ok: true, message: 'Senha alterada com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao alterar senha.' });
  }
});

app.post('/api/users', authMiddleware, requireRole('ADMIN', 'CEO'), async (req: any, res: any) => {
  try {
    const { name, email, password, role, sector, phone, avatar } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Campos obrigatórios faltando.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role, sector, phone, avatar }
    });
    
    await logAudit(req.user.id, 'CREATE_USER', 'EQUIPE', { target: user.email });
    res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar usuário.' });
  }
});

app.put('/api/users/:id', authMiddleware, requireRole('ADMIN', 'CEO'), async (req: any, res: any) => {
  try {
    const { name, email, password, role, sector, phone, avatar, isActive, preferences } = req.body;
    const data: any = { name, email, role, sector, phone, avatar, isActive };
    if (preferences !== undefined) data.preferences = preferences;
    if (password) data.password = await bcrypt.hash(password, 10);

    const user = await prisma.user.update({ where: { id: req.params.id }, data });
    await logAudit(req.user.id, 'UPDATE_USER', 'EQUIPE', { target: user.email });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar usuário.' });
  }
});

app.delete('/api/users/:id', authMiddleware, requireRole('ADMIN', 'CEO'), async (req: any, res: any) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    await logAudit(req.user.id, 'DELETE_USER', 'EQUIPE', { targetId: req.params.id });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir usuário.' });
  }
});

// =====================================================
// CLIENTS (CRM) — CRUD COMPLETO
// =====================================================
app.get('/api/clients', authMiddleware, blockCliente, async (req: any, res: any) => {
  try {
    const { withContracts } = req.query;
    
    let where = {};
    if (withContracts === 'true') {
      // Filtra apenas clientes que possuem contratos VIGENTES ou ativos
      where = { contracts: { some: { status: 'VIGENTE' } } };
    }

    const clients = await prisma.client.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { contracts: { select: { id: true, status: true } } }
    });
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
    const { name, company, email, phone, cnpj, status, segment, responsible, briefing, scope, healthScore, metaPageId, generatePortalAccess } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome do cliente é obrigatório.' });

    const client = await prisma.client.create({
      data: { name, company, email, phone, cnpj, status: status || 'ATIVO', segment, responsible, briefing, scope, healthScore: healthScore || 0, metaPageId }
    });

    // Geração automática de acesso ao portal do cliente
    let portalAccess = null;
    if (email && generatePortalAccess !== false) {
      try {
        // Verificar se já existe um User com este email
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (!existingUser) {
          const tempPassword = `Mag@${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
          const hashedPwd = await bcrypt.hash(tempPassword, 10);
          const clientUser = await prisma.user.create({
            data: {
              name: name,
              email,
              password: hashedPwd,
              role: 'CLIENTE',
              sector: company || name,
              isActive: true
            }
          });
          // Vincular o userId ao registro do cliente
          await prisma.client.update({
            where: { id: client.id },
            data: { clientUserId: clientUser.id }
          });
          portalAccess = { email, tempPassword, loginUrl: '/login' };
        }
      } catch (e) {
        console.error('[ClientCreate] Erro ao gerar acesso de portal:', e);
      }
    }

    await logAudit(req.user.id, 'CREATE_CLIENT', 'CRM', { company, email, portalGenerated: !!portalAccess });
    res.status(201).json({ ...client, portalAccess });
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
    // Soft Delete: Apenas altera o status para evitar quebras estruturais na base de dados
    await prisma.client.update({ 
       where: { id: req.params.id },
       data: { status: 'INATIVO' }
    });
    res.json({ ok: true, message: 'Cliente inativado.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao inativar cliente.' });
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
// TECH SERVICES (KPIs)
// =====================================================
app.get('/api/tech', authMiddleware, async (req: any, res: any) => {
  try {
    const tech = await prisma.techService.findMany({ orderBy: { custo_mes: 'desc' } });
    if (tech.length === 0) {
      // Seed automático se estiver vazio
      const mockTech = [
        { nome: 'Backend (Node 20 + Prisma)', status: 'operacional', uptime: 99.8, custo_mes: 89, tipo: 'infra', versao: '20.x' },
        { nome: 'Frontend (Vite + React 18)', status: 'operacional', uptime: 99.9, custo_mes: 0, tipo: 'dev', versao: '18.x' },
        { nome: 'Banco de Dados (PostgreSQL)', status: 'operacional', uptime: 99.95, custo_mes: 45, tipo: 'dados', versao: '15' },
        { nome: 'WhatsApp (Baileys)', status: 'operacional', uptime: 97.2, custo_mes: 0, tipo: 'integ', versao: 'Latest' },
        { nome: 'VPS / Hospedagem', status: 'operacional', uptime: 99.7, custo_mes: 120, tipo: 'infra', versao: '-' },
        { nome: 'Vercel (CDN/Preview)', status: 'operacional', uptime: 99.99, custo_mes: 20, tipo: 'infra', versao: '-' },
        { nome: 'Domínio + SSL', status: 'operacional', uptime: 100, custo_mes: 8, tipo: 'infra', versao: '-' },
        { nome: 'ElevenLabs (TTS/STT)', status: 'standby', uptime: 99.5, custo_mes: 22, tipo: 'ia', versao: 'v2' },
        { nome: 'Gemini / Groq API', status: 'operacional', uptime: 99.6, custo_mes: 15, tipo: 'ia', versao: 'Latest' },
      ];
      for (const t of mockTech) {
        await prisma.techService.create({ data: t });
      }
      return res.json(await prisma.techService.findMany({ orderBy: { custo_mes: 'desc' } }));
    }
    res.json(tech);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar tech stack.' });
  }
});

app.post('/api/tech', authMiddleware, requireRole('ADMIN', 'CEO'), async (req: any, res: any) => {
  try {
    const data = req.body;
    const tech = await prisma.techService.create({ data });
    res.status(201).json(tech);
  } catch(err) {
    res.status(500).json({ error: 'Erro ao criar tech service.' });
  }
});

app.put('/api/tech/:id', authMiddleware, requireRole('ADMIN', 'CEO'), async (req: any, res: any) => {
  try {
    const tech = await prisma.techService.update({ where: { id: req.params.id }, data: req.body });
    res.json(tech);
  } catch(err) {
    res.status(500).json({ error: 'Erro ao atualizar tech service.' });
  }
});

app.delete('/api/tech/:id', authMiddleware, requireRole('ADMIN', 'CEO'), async (req: any, res: any) => {
  try {
    await prisma.techService.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch(err) {
    res.status(500).json({ error: 'Erro ao excluir tech service.' });
  }
});

// =====================================================
// PROCESSOS E SLA (KPIs)
// =====================================================
app.get('/api/processos', authMiddleware, async (req: any, res: any) => {
  try {
    const processos = await prisma.agencyProcess.findMany({ orderBy: { area: 'asc' } });
    if (processos.length === 0) {
      // Seed automático se vazio
      const mockProcessos = [
        { nome: 'Onboarding de Clientes', slaHoras: 48, realizado: 36, status: 'ok', area: 'Comercial', responsavel: 'Vendas', automacao: 70 },
        { nome: 'Produção de Conteúdo', slaHoras: 72, realizado: 80, status: 'atraso', area: 'Produção', responsavel: 'Design', automacao: 40 },
        { nome: 'Aprovação de Arte', slaHoras: 24, realizado: 20, status: 'ok', area: 'Cliente', responsavel: 'Gestor', automacao: 55 },
        { nome: 'Faturamento/Cobrança', slaHoras: 5, realizado: 4, status: 'ok', area: 'Financeiro', responsavel: 'Financeiro', automacao: 90 },
        { nome: 'Suporte N1 (Tickets)', slaHoras: 12, realizado: 18, status: 'critico', area: 'Suporte', responsavel: 'N1', automacao: 30 },
        { nome: 'Relatório de Resultados', slaHoras: 168, realizado: 200, status: 'atraso', area: 'Estratégia', responsavel: 'CEO', automacao: 20 },
        { nome: 'Pipeline / Prospecção', slaHoras: 48, realizado: 36, status: 'ok', area: 'Comercial', responsavel: 'SDR', automacao: 60 },
      ];
      for (const p of mockProcessos) {
        await prisma.agencyProcess.create({ data: p });
      }
      return res.json(await prisma.agencyProcess.findMany({ orderBy: { area: 'asc' } }));
    }
    res.json(processos);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar processos.' });
  }
});

app.post('/api/processos', authMiddleware, requireRole('ADMIN', 'CEO'), async (req: any, res: any) => {
  try {
    const data = req.body;
    const proc = await prisma.agencyProcess.create({ data });
    res.status(201).json(proc);
  } catch(err) {
    res.status(500).json({ error: 'Erro ao criar processo.' });
  }
});

app.put('/api/processos/:id', authMiddleware, requireRole('ADMIN', 'CEO', 'GESTOR'), async (req: any, res: any) => {
  try {
    const proc = await prisma.agencyProcess.update({ where: { id: req.params.id }, data: req.body });
    res.json(proc);
  } catch(err) {
    res.status(500).json({ error: 'Erro ao atualizar processo.' });
  }
});

app.delete('/api/processos/:id', authMiddleware, requireRole('ADMIN', 'CEO'), async (req: any, res: any) => {
  try {
    await prisma.agencyProcess.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch(err) {
    res.status(500).json({ error: 'Erro ao excluir processo.' });
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
// EVENTS (AGENDA) — CRUD
// =====================================================
app.get('/api/events', authMiddleware, async (_req: any, res: any) => {
  try {
    const events = await prisma.event.findMany({
      include: { client: { select: { name: true } }, project: { select: { name: true } } },
      orderBy: { startDate: 'asc' }
    });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar eventos.' });
  }
});

app.post('/api/events', authMiddleware, async (req: any, res: any) => {
  try {
    const { title, description, type, startDate, endDate, allDay, location, color, clientId, projectId } = req.body;
    if (!title || !startDate) return res.status(400).json({ error: 'Título e data inicial são obrigatórios.' });

    const event = await prisma.event.create({
      data: {
        title, description, type: type || 'INTERNO',
        startDate: new Date(startDate), endDate: endDate ? new Date(endDate) : null,
        allDay: allDay || false, location, color, clientId, projectId, userId: req.user.id
      }
    });
    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar evento.' });
  }
});

app.delete('/api/events/:id', authMiddleware, async (req: any, res: any) => {
  try {
    await prisma.event.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir evento.' });
  }
});

// =====================================================
// TRANSACTIONS — CRUD
// =====================================================
app.get('/api/transactions', authMiddleware, requireRole('ADMIN', 'CEO', 'FINANCEIRO'), async (_req: any, res: any) => {
  try {
    const transactions = await prisma.transaction.findMany({
      include: { client: { select: { name: true } }, contract: { select: { title: true } } },
      orderBy: { dueDate: 'desc' }
    });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar transações.' });
  }
});

app.post('/api/transactions', authMiddleware, requireRole('ADMIN', 'CEO', 'FINANCEIRO'), async (req: any, res: any) => {
  try {
    const { description, type, amount, dueDate, status, category, clientId, contractId } = req.body;
    if (!description || !amount || !dueDate) return res.status(400).json({ error: 'Campos faltando.' });

    const transaction = await prisma.transaction.create({
      data: { description, type, amount: parseFloat(amount), dueDate: new Date(dueDate), status: status || 'PENDENTE', category, clientId, contractId }
    });
    res.status(201).json(transaction);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar transação.' });
  }
});

app.delete('/api/transactions/:id', authMiddleware, requireRole('ADMIN', 'CEO'), async (req: any, res: any) => {
  try {
    await prisma.transaction.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir transação.' });
  }
});

// =====================================================
// GOALS & LOGS
// =====================================================
app.get('/api/goals', authMiddleware, async (_req: any, res: any) => {
  try {
    const goals = await prisma.goal.findMany();
    res.json(goals);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar metas.' });
  }
});

app.put('/api/goals/:id', authMiddleware, requireRole('ADMIN', 'CEO', 'GESTOR'), async (req: any, res: any) => {
  try {
    const { current } = req.body;
    const goal = await prisma.goal.update({ where: { id: req.params.id }, data: { current: parseFloat(current) } });
    res.json(goal);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar meta.' });
  }
});

app.get('/api/logs', authMiddleware, requireRole('ADMIN', 'CEO'), async (_req: any, res: any) => {
  try {
    const logs = await prisma.auditLog.findMany({
      include: { user: { select: { name: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar logs.' });
  }
});

// =====================================================
// TICKETS (SUPORTE) — ADMIN & PUBLIC
// =====================================================

// Rota pública para criação de tickets (Portal de Entrada)
app.post('/api/public/tickets', async (req: any, res: any) => {
  try {
    const { subject, description, clientName, clientWhatsapp } = req.body;
    if (!subject || !clientName || !clientWhatsapp) {
      return res.status(400).json({ error: 'Assunto, nome e whatsapp são obrigatórios.' });
    }

    const protocol = `TK-${Math.floor(Date.now() / 1000)}`;

    const ticket = await prisma.ticket.create({
      data: {
        protocol,
        subject,
        description,
        clientName,
        clientWhatsapp,
        status: 'NOVO',
        priority: 'MEDIA'
      }
    });

    res.status(201).json(ticket);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar ticket público.' });
  }
});

// Acompanhamento do cliente (simplificado por whatsapp)
app.get('/api/public/tickets/:whatsapp', async (req: any, res: any) => {
  try {
    const tickets = await prisma.ticket.findMany({
      where: { clientWhatsapp: req.params.whatsapp },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar chamados.' });
  }
});

// Admin routes for Tickets
app.get('/api/tickets', authMiddleware, async (_req: any, res: any) => {
  try {
    const tickets = await prisma.ticket.findMany({
      include: { messages: { orderBy: { createdAt: 'asc' } }, client: true },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar tickets.' });
  }
});

app.post('/api/tickets/:id/messages', async (req: any, res: any) => {
  try {
    // Nota: Essa rota atende tanto admin quanto cliente (público)
    const { authorName, text, isInternal } = req.body;
    const message = await prisma.ticketMessage.create({
      data: {
        ticketId: req.params.id,
        authorName,
        text,
        isInternal: isInternal || false
      }
    });
    
    // Atualiza o updatedAt do ticket para subir na lista
    await prisma.ticket.update({ where: { id: req.params.id }, data: { updatedAt: new Date() } });

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao enviar mensagem.' });
  }
});

app.put('/api/tickets/:id', authMiddleware, async (req: any, res: any) => {
  try {
    const { status, priority, clientId, projectId } = req.body;
    
    // Preparar os dados a atualizar (apenas os que forem enviados)
    const dataToUpdate: any = {};
    if (status) dataToUpdate.status = status;
    if (priority) dataToUpdate.priority = priority;
    if (clientId !== undefined) dataToUpdate.clientId = clientId; // permite null para desvincular
    if (projectId !== undefined) dataToUpdate.projectId = projectId;

    const ticket = await prisma.ticket.update({
      where: { id: req.params.id },
      data: dataToUpdate
    });
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar ticket.' });
  }
});

// =====================================================
// FEED (COMUNICAÇÃO INTERNA)
// =====================================================
app.get('/api/feed', authMiddleware, async (_req: any, res: any) => {
  try {
    const posts = await prisma.feedPost.findMany({
      include: { comments: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar feed.' });
  }
});

app.post('/api/feed', authMiddleware, async (req: any, res: any) => {
  try {
    const { text, image, type } = req.body;
    const post = await prisma.feedPost.create({
      data: {
        text,
        image,
        type: type || 'news',
        authorName: req.user.name,
        authorId: req.user.id
      }
    });
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar post.' });
  }
});

app.post('/api/feed/:id/comments', authMiddleware, async (req: any, res: any) => {
  try {
    const { text } = req.body;
    const comment = await prisma.feedComment.create({
      data: {
        postId: req.params.id,
        text,
        authorName: req.user.name
      }
    });
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao comentar.' });
  }
});

app.post('/api/feed/:id/like', authMiddleware, async (req: any, res: any) => {
  try {
    const post = await prisma.feedPost.findUnique({ where: { id: req.params.id } });
    if (!post) return res.status(404).json({ error: 'Post não encontrado.' });
    
    let likes = JSON.parse(post.likes || '[]');
    if (likes.includes(req.user.name)) {
      likes = likes.filter((l: string) => l !== req.user.name);
    } else {
      likes.push(req.user.name);
    }
    
    const updated = await prisma.feedPost.update({
      where: { id: req.params.id },
      data: { likes: JSON.stringify(likes) }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao curtir.' });
  }
});

// =====================================================
// CHAT GLOBAL
// =====================================================
app.get('/api/chat', authMiddleware, async (_req: any, res: any) => {
  try {
    const channels = await prisma.chatChannel.findMany({
      include: { messages: { orderBy: { timestamp: 'asc' }, take: 50 } }
    });
    res.json(channels);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar chat.' });
  }
});

app.post('/api/chat/messages', authMiddleware, async (req: any, res: any) => {
  try {
    const { channelId, text } = req.body;
    const message = await prisma.chatMessage.create({
      data: {
        channelId,
        text,
        senderName: req.user.name,
        senderId: req.user.id
      }
    });
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao enviar mensagem no chat.' });
  }
});

// =====================================================
// METAS & INDICADORES (GOALS)
// =====================================================
app.get('/api/goals', authMiddleware, async (_req: any, res: any) => {
  try {
    const goals = await prisma.goal.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(goals);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar metas.' });
  }
});

app.post('/api/goals', authMiddleware, requireRole('ADMIN', 'CEO', 'GESTOR'), async (req: any, res: any) => {
  try {
    const { title, target, current, unit, color, deadline } = req.body;
    const goal = await prisma.goal.create({
      data: { title, target, current: current || 0, unit, color, deadline: deadline ? new Date(deadline) : null }
    });
    res.status(201).json(goal);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar meta.' });
  }
});

app.put('/api/goals/:id', authMiddleware, async (req: any, res: any) => {
  try {
    const { current } = req.body;
    const goal = await prisma.goal.update({ where: { id: req.params.id }, data: { current } });
    res.json(goal);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar meta.' });
  }
});

// =====================================================
// BOARD COLUMNS
// =====================================================
app.get('/api/boards/columns', authMiddleware, async (_req: any, res: any) => {
  try {
    const columns = await prisma.boardColumn.findMany({ orderBy: { order: 'asc' } });
    res.json(columns);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar colunas.' });
  }
});

app.post('/api/boards/columns', authMiddleware, requireRole('ADMIN', 'CEO'), async (req: any, res: any) => {
  try {
    const { boardType, title, color, order } = req.body;
    const col = await prisma.boardColumn.create({
      data: { boardType, title, color, order: order || 0 }
    });
    res.json(col);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar coluna.' });
  }
});


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

// Status simples (polling) — inclui timestamp para forçar re-render no React
app.get('/api/whatsapp/status', authMiddleware, requireRole('ADMIN', 'CEO'), (_req: any, res: any) => {
  const waState = getWAState();
  res.json({ ...waState, _ts: Date.now() });
});

// Iniciar conexão (gera QR Code)
app.post('/api/whatsapp/start', authMiddleware, requireRole('ADMIN', 'CEO'), (_req: any, res: any) => {
  startWhatsApp(prisma).catch(err => console.error('[WA Start]', err));
  res.json({ ok: true, message: 'Iniciando conexão WhatsApp...' });
});

// Desconectar sessão
app.post('/api/whatsapp/disconnect', authMiddleware, requireRole('ADMIN', 'CEO'), async (_req: any, res: any) => {
  await disconnectWhatsApp();
  res.json({ ok: true, message: 'WhatsApp desconectado.' });
});

// Reset completo da sessão (destrói sessão local + reinicia com novo QR)
app.post('/api/whatsapp/reset', authMiddleware, requireRole('ADMIN', 'CEO'), async (_req: any, res: any) => {
  try {
    resetWhatsAppSession(prisma).catch(err => console.error('[WA Reset]', err));
    res.json({ ok: true, message: 'Reset iniciado. Novo QR Code será gerado em instantes.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao resetar sessão.', details: err.message });
  }
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
    // Verifica se já existe uma tarefa (lead) com este telefone nas observações ou descrição
    const existing = await prisma.task.findFirst({ 
      where: { 
        OR: [
          { description: { contains: contact.phone } },
          { title: { contains: contact.name } }
        ]
      } 
    });
    
    if (existing) { skipped++; continue; }
    
    await prisma.task.create({
      data: {
        title: `Lead: ${contact.name}`,
        description: `Importado via WhatsApp Engine: ${contact.phone}`,
        status: 'lead',
        priority: 'ALTA',
        tipo: 'tarefa',
        tags: 'WhatsApp',
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
    await logAudit(req.user.id, 'MENSAGEM_ENVIADA', 'WHATSAPP', { phone, message: formattedMessage });
    res.json({ ok: true, message: 'Mensagem enviada com sucesso!' });
  } catch (err: any) {
    res.status(500).json({ error: 'Falha ao enviar mensagem', details: err.message });
  }
});

// =====================================================
// WHATSAPP BOT — REGRAS DE RESPOSTA AUTOMÁTICA
// =====================================================

app.get('/api/whatsapp/bot-rules', authMiddleware, requireRole('ADMIN', 'CEO', 'GESTOR'), async (_req: any, res: any) => {
  try {
    const rules = await (prisma as any).waBotRule.findMany({ orderBy: { order: 'asc' } });
    res.json(rules);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar regras do bot.' });
  }
});

app.post('/api/whatsapp/bot-rules', authMiddleware, requireRole('ADMIN', 'CEO'), async (req: any, res: any) => {
  try {
    const { keyword, response, isActive, order } = req.body;
    if (!keyword || !response) return res.status(400).json({ error: 'keyword e response são obrigatórios.' });
    const rule = await (prisma as any).waBotRule.create({
      data: { keyword, response, isActive: isActive ?? true, order: order || 0 }
    });
    await logAudit(req.user.id, 'BOT_RULE_CREATED', 'WHATSAPP', { keyword });
    res.status(201).json(rule);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar regra.' });
  }
});

app.put('/api/whatsapp/bot-rules/:id', authMiddleware, requireRole('ADMIN', 'CEO'), async (req: any, res: any) => {
  try {
    const { keyword, response, isActive, order } = req.body;
    const rule = await (prisma as any).waBotRule.update({
      where: { id: req.params.id },
      data: { keyword, response, isActive, order }
    });
    res.json(rule);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar regra.' });
  }
});

app.delete('/api/whatsapp/bot-rules/:id', authMiddleware, requireRole('ADMIN', 'CEO'), async (req: any, res: any) => {
  try {
    await (prisma as any).waBotRule.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir regra.' });
  }
});

app.get('/api/whatsapp/bot-config', authMiddleware, requireRole('ADMIN', 'CEO', 'GESTOR'), async (_req: any, res: any) => {
  try {
    let config = await (prisma as any).waBotConfig.findFirst();
    if (!config) config = await (prisma as any).waBotConfig.create({ data: {} });
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar config do bot.' });
  }
});

app.put('/api/whatsapp/bot-config', authMiddleware, requireRole('ADMIN', 'CEO'), async (req: any, res: any) => {
  try {
    const { isEnabled, greeting, awayMsg, workHours } = req.body;
    let config = await (prisma as any).waBotConfig.findFirst();
    if (!config) {
      config = await (prisma as any).waBotConfig.create({
        data: { isEnabled: isEnabled ?? false, greeting, awayMsg, workHours }
      });
    } else {
      config = await (prisma as any).waBotConfig.update({
        where: { id: config.id },
        data: { isEnabled: isEnabled ?? config.isEnabled, greeting, awayMsg, workHours }
      });
    }
    await logAudit(req.user.id, 'BOT_CONFIG_UPDATED', 'WHATSAPP', { isEnabled });
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao salvar config do bot.' });
  }
});

// Verificar se o bot está silenciado para um número específico
app.get('/api/whatsapp/bot-handoff/:phone', authMiddleware, async (req: any, res: any) => {
  try {
    const handoff = await (prisma as any).waHandoff.findUnique({
      where: { clientWhatsapp: req.params.phone }
    });
    res.json({ 
      isMuted: handoff ? handoff.muteUntil > new Date() : false,
      muteUntil: handoff?.muteUntil || null
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar status de handoff.' });
  }
});

// Retomar bot manualmente para um número
app.post('/api/whatsapp/bot-resume/:phone', authMiddleware, async (req: any, res: any) => {
  try {
    await (prisma as any).waHandoff.delete({
      where: { clientWhatsapp: req.params.phone }
    }).catch(() => {}); // Ignora se não existir
    
    await logAudit(req.user.id, 'BOT_RESUMED', 'WHATSAPP', { phone: req.params.phone });
    res.json({ ok: true, message: 'Bot retomado para este contato.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao retomar bot.' });
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
// PORTAL DO CLIENTE — CRIAÇÃO AUTOMÁTICA AO CADASTRAR EMPRESA
// =====================================================

// Sobrescreve o POST /api/clients original para incluir geração de acesso
// NOTA: Este bloco adicional registra ANTES do serve estático

// Geração de senha temporária segura para clientes
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let pass = 'Mag@';
  for (let i = 0; i < 6; i++) pass += chars[Math.floor(Math.random() * chars.length)];
  return pass;
}

// Reset de acesso do cliente — gera nova senha temporária
app.post('/api/clients/:id/reset-access', authMiddleware, requireRole('ADMIN', 'CEO', 'GESTOR'), async (req: any, res: any) => {
  try {
    const client = await prisma.client.findUnique({ where: { id: req.params.id } });
    if (!client) return res.status(404).json({ error: 'Cliente não encontrado.' });
    if (!client.clientUserId) return res.status(400).json({ error: 'Este cliente não possui acesso ao portal gerado.' });

    const tempPassword = generateTempPassword();
    const hashed = await bcrypt.hash(tempPassword, 10);
    const user = await prisma.user.update({
      where: { id: client.clientUserId },
      data: { password: hashed, isActive: true }
    });

    await logAudit(req.user.id, 'RESET_ACESSO_CLIENTE', 'CRM', { clientId: client.id, email: user.email });
    res.json({ ok: true, portalAccess: { email: user.email, tempPassword, loginUrl: '/login' } });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao resetar acesso do cliente.' });
  }
});

// Middleware: garantir que usuário é CLIENTE e retornar o clientId vinculado
const requireCliente = async (req: any, res: any, next: any) => {
  const userRole = (req.user?.role || '').toUpperCase();
  if (userRole !== 'CLIENTE') {
    return res.status(403).json({ error: 'Rota exclusiva para portais de cliente.' });
  }
  // Buscar o clientId vinculado a este usuário
  const client = await prisma.client.findFirst({ where: { clientUserId: req.user.id } });
  if (!client) return res.status(404).json({ error: 'Empresa vinculada não encontrada.' });
  req.clientId = client.id;
  req.clientData = client;
  next();
};

// =====================================================
// ROTAS DO PORTAL DO CLIENTE (role=CLIENTE only)
// =====================================================

// Dashboard consolidado do cliente
app.get('/api/cliente/dashboard', authMiddleware, requireCliente, async (req: any, res: any) => {
  try {
    const clientId = req.clientId;

    const [client, projetos, tarefas, proximosEventos, metaLeads, conteudos] = await Promise.all([
      prisma.client.findUnique({ where: { id: clientId } }),
      prisma.project.findMany({
        where: { clientId, status: { in: ['EM_ANDAMENTO', 'PLANEJAMENTO'] } },
        orderBy: { createdAt: 'desc' }, take: 5
      }),
      prisma.task.findMany({
        where: { clientId, status: { notIn: ['ENTREGUE', 'PUBLICADO', 'APROVADO'] } },
        orderBy: { deadline: 'asc' }, take: 10
      }),
      prisma.event.findMany({
        where: { clientId, startDate: { gte: new Date() } },
        orderBy: { startDate: 'asc' }, take: 5
      }),
      (prisma as any).waLead.findMany({
        where: { clientId },
        orderBy: { createdAt: 'desc' }, take: 10
      }),
      prisma.content.findMany({
        where: { clientId, status: { in: ['AGUARDANDO_APROVACAO', 'APROVADO'] } },
        orderBy: { updatedAt: 'desc' }, take: 6
      })
    ]);

    const totalLeads = await (prisma as any).waLead.count({ where: { clientId } });
    const novosLeads = await (prisma as any).waLead.count({ where: { clientId, stage: 'NOVO_LEAD' } });
    const tarefasPendentes = await prisma.task.count({ where: { clientId, status: { in: ['BACKLOG', 'A_FAZER', 'DOING', 'REVIEW'] } } });

    res.json({
      empresa: client,
      kpis: {
        totalLeads,
        novosLeads,
        tarefasPendentes,
        projetosAtivos: projetos.length,
        healthScore: client?.healthScore || 0
      },
      projetos,
      tarefas,
      proximosEventos,
      waLeads: metaLeads,
      conteudos
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao carregar dashboard do cliente.' });
  }
});

app.get('/api/cliente/pipeline', authMiddleware, requireCliente, async (req: any, res: any) => {
  try {
    const leads = await (prisma as any).waLead.findMany({
      where: { clientId: req.clientId },
      orderBy: { createdAt: 'desc' }
    });

    // Agrupar por estágio
    const pipeline = {
      NOVO_LEAD: leads.filter((l: any) => l.stage === 'NOVO_LEAD'),
      CONTATO_FEITO: leads.filter((l: any) => l.stage === 'CONTATO_FEITO'),
      PROPOSTA: leads.filter((l: any) => l.stage === 'PROPOSTA'),
      FECHADO: leads.filter((l: any) => l.stage === 'FECHADO'),
      PERDIDO: leads.filter((l: any) => l.stage === 'PERDIDO'),
    };

    res.json(pipeline);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao carregar pipeline.' });
  }
});

// Agenda do cliente
app.get('/api/cliente/agenda', authMiddleware, requireCliente, async (req: any, res: any) => {
  try {
    const eventos = await prisma.event.findMany({
      where: { clientId: req.clientId },
      orderBy: { startDate: 'asc' }
    });
    res.json(eventos);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao carregar agenda.' });
  }
});

// Relatórios / Conteúdo do cliente
app.get('/api/cliente/relatorios', authMiddleware, requireCliente, async (req: any, res: any) => {
  try {
    const [conteudos, projetos] = await Promise.all([
      prisma.content.findMany({
        where: { clientId: req.clientId },
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.project.findMany({
        where: { clientId: req.clientId },
        orderBy: { createdAt: 'desc' }
      })
    ]);
    res.json({ conteudos, projetos });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao carregar relatórios.' });
  }
});

// =====================================================
// WHATSAPP LEADS — CRUD
// =====================================================

// GET: Listar todos os Leads (admin)
app.get('/api/whatsapp/leads', authMiddleware, blockCliente, async (req: any, res: any) => {
  try {
    const { clientId, stage } = req.query as any;
    const where: any = {};
    if (clientId) where.clientId = clientId;
    if (stage) where.stage = stage;

    const leads = await (prisma as any).waLead.findMany({
      where,
      include: { client: { select: { name: true, company: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(leads);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar Leads.' });
  }
});

// PUT: Atualizar estágio de um lead (mover no pipeline)
app.put('/api/whatsapp/leads/:id', authMiddleware, blockCliente, async (req: any, res: any) => {
  try {
    const { stage, notes, clientId } = req.body;
    const lead = await (prisma as any).waLead.update({
      where: { id: req.params.id },
      data: { ...(stage && { stage }), ...(notes !== undefined && { notes }), ...(clientId !== undefined && { clientId }) }
    });
    await logAudit(req.user.id, 'WA_LEAD_UPDATED', 'CRM', { leadId: req.params.id, stage });
    res.json(lead);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar lead.' });
  }
});

// DELETE: Remover lead
app.delete('/api/whatsapp/leads/:id', authMiddleware, requireRole('ADMIN', 'CEO'), async (req: any, res: any) => {
  try {
    await (prisma as any).waLead.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir lead.' });
  }
});

// POST: Converter WhatsApp Lead em Cliente (prospect) no CRM
app.post('/api/whatsapp/leads/:id/convert', authMiddleware, requireRole('ADMIN', 'CEO', 'GESTOR', 'COMERCIAL'), async (req: any, res: any) => {
  try {
    const lead = await (prisma as any).waLead.findUnique({ where: { id: req.params.id } });
    if (!lead) return res.status(404).json({ error: 'Lead não encontrado.' });

    const client = await prisma.client.create({
      data: {
        name: lead.name || 'Lead WhatsApp',
        company: lead.name || 'Empresa Lead',
        email: '',
        phone: lead.phone || '',
        status: 'ATIVO',
        segment: 'Não Informado',
        responsible: req.user.name,
        briefing: `Lead gerado via WhatsApp.`
      }
    });

    // Atualizar lead com o clientId e mover para FECHADO
    await (prisma as any).waLead.update({
      where: { id: req.params.id },
      data: { clientId: client.id, stage: 'FECHADO' }
    });

    await logAudit(req.user.id, 'WA_LEAD_CONVERTED', 'CRM', { leadId: req.params.id, clientId: client.id });
    res.status(201).json({ ok: true, client });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao converter lead em cliente.' });
  }
});

// =====================================================
// APROVAÇÕES E UPLOAD
// =====================================================

app.post('/api/upload', authMiddleware, upload.single('file'), (req: any, res: any) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    // URL exposta via pasta estática
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ ok: true, url: fileUrl });
  } catch (err) {
    res.status(500).json({ error: 'Erro no upload do arquivo.' });
  }
});

app.get('/api/approvals', authMiddleware, blockCliente, async (_req: any, res: any) => {
  try {
    const approvals = await prisma.approval.findMany({
      include: { client: { select: { name: true, phone: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(approvals);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar aprovações.' });
  }
});

app.get('/api/approvals/:id', async (req: any, res: any) => {
  try {
    // Rota pública para visualização do cliente
    const approval = await prisma.approval.findUnique({
      where: { id: req.params.id },
      include: { client: { select: { name: true } } }
    });
    if (!approval) return res.status(404).json({ error: 'Registro não encontrado.' });
    res.json(approval);
  } catch (err) {
    res.status(500).json({ error: 'Erro.' });
  }
});

app.post('/api/approvals', authMiddleware, blockCliente, async (req: any, res: any) => {
  try {
    const { title, type, fileUrl, clientId } = req.body;
    if (!title || !clientId) return res.status(400).json({ error: 'Título e cliente são obrigatórios.' });

    const approval = await prisma.approval.create({
      data: { title, type: type || 'Criativo', fileUrl, clientId, status: 'PENDING' },
      include: { client: { select: { phone: true, name: true } } }
    });
    
    // Disparar envio de message no WhatsApp
    if (approval.client && approval.client.phone) {
      const publicDomain = process.env.FRONTEND_URL || 'http://localhost:5173';
      const url = `${publicDomain}/validar-aprovacao/${approval.id}`;
      const msg = `Olá! A agência Magister Tech enviou um novo material ("${title}") para sua aprovação.\n\nPara visualizar e aprovar/rejeitar, clique no link abaixo:\n${url}`;
      
      // Enviando async para não travar
      sendWAMessage(approval.client.phone, msg).catch((e: any) => console.error('[Approvals] Erro ao enviar WA:', e));
    }

    res.status(201).json(approval);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar aprovação.' });
  }
});

app.put('/api/approvals/:id/reply', async (req: any, res: any) => {
  try {
    // Rota pública para aprovar/recusar
    const { status, respondedBy } = req.body;
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido.' });
    }

    const approval = await prisma.approval.update({
      where: { id: req.params.id },
      data: { status, respondedBy }
    });
    
    res.json({ ok: true, approval });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar resposta.' });
  }
});

app.delete('/api/approvals/:id', authMiddleware, blockCliente, async (req: any, res: any) => {
  try {
    await prisma.approval.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao deletar.' });
  }
});

// =====================================================
// PORTAL CLIENTE — ROTAS EXCLUSIVAS (role=CLIENTE)
// =====================================================

// Helper: pega o clientId vinculado ao user logado (via clientUserId)
async function getClientIdByUser(userId: string): Promise<string | null> {
  const client = await prisma.client.findFirst({ where: { clientUserId: userId } });
  return client?.id ?? null;
}

// GET /api/cliente/dashboard — dados completos do painel do cliente
app.get('/api/cliente/dashboard', authMiddleware, requireRole('CLIENTE', 'ADMIN', 'CEO'), async (req: any, res: any) => {
  try {
    const clientId = await getClientIdByUser(req.user.id);
    if (!clientId) return res.status(404).json({ error: 'Empresa vinculada não encontrada.' });

    const [empresa, projetos, tarefas, eventos, waLeads, conteudos] = await Promise.all([
      prisma.client.findUnique({ where: { id: clientId } }),
      prisma.project.findMany({ where: { clientId, status: { in: ['EM_ANDAMENTO', 'PLANEJAMENTO'] } }, orderBy: { createdAt: 'desc' } }),
      prisma.task.findMany({ where: { clientId, status: { notIn: ['CONCLUIDO', 'ENTREGUE', 'PUBLICADO'] } }, orderBy: { deadline: 'asc' }, take: 10 }),
      prisma.event.findMany({ where: { clientId, startDate: { gte: new Date() } }, orderBy: { startDate: 'asc' }, take: 5 }),
      prisma.waLead.findMany({ where: { clientId }, orderBy: { createdAt: 'desc' }, take: 20 }),
      prisma.content.findMany({ where: { clientId }, orderBy: { updatedAt: 'desc' }, take: 30 }),
    ]);

    const totalLeads       = await prisma.waLead.count({ where: { clientId } });
    const novosLeads       = await prisma.waLead.count({ where: { clientId, stage: 'NOVO_LEAD' } });
    const tarefasPendentes = await prisma.task.count({ where: { clientId, status: { notIn: ['CONCLUIDO', 'ENTREGUE'] } } });
    const projetosAtivos   = projetos.length;
    const healthScore      = empresa?.healthScore ?? 0;

    res.json({
      empresa,
      kpis: { totalLeads, novosLeads, tarefasPendentes, projetosAtivos, healthScore },
      projetos,
      tarefas,
      proximosEventos: eventos,
      waLeads,
      conteudos,
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao carregar dashboard do cliente.' });
  }
});

// GET /api/cliente/agenda — eventos do cliente
app.get('/api/cliente/agenda', authMiddleware, requireRole('CLIENTE', 'ADMIN', 'CEO'), async (req: any, res: any) => {
  try {
    const clientId = await getClientIdByUser(req.user.id);
    if (!clientId) return res.status(404).json({ error: 'Empresa não encontrada.' });
    const events = await prisma.event.findMany({ where: { clientId }, orderBy: { startDate: 'asc' } });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao carregar agenda.' });
  }
});

// GET /api/cliente/relatorios — conteúdos + projetos
app.get('/api/cliente/relatorios', authMiddleware, requireRole('CLIENTE', 'ADMIN', 'CEO'), async (req: any, res: any) => {
  try {
    const clientId = await getClientIdByUser(req.user.id);
    if (!clientId) return res.status(404).json({ error: 'Empresa não encontrada.' });
    const [conteudos, projetos] = await Promise.all([
      prisma.content.findMany({ where: { clientId }, orderBy: { updatedAt: 'desc' } }),
      prisma.project.findMany({ where: { clientId }, orderBy: { startDate: 'desc' } }),
    ]);
    res.json({ conteudos, projetos });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao carregar relatórios.' });
  }
});

// GET /api/cliente/pipeline — leads CRM do cliente
app.get('/api/cliente/pipeline', authMiddleware, requireRole('CLIENTE', 'ADMIN', 'CEO'), async (req: any, res: any) => {
  try {
    const clientId = await getClientIdByUser(req.user.id);
    if (!clientId) return res.status(404).json({ error: 'Empresa não encontrada.' });
    const leads = await prisma.waLead.findMany({ where: { clientId }, orderBy: { createdAt: 'desc' } });
    const grouped: Record<string, any[]> = {
      NOVO_LEAD: [], CONTATO_FEITO: [], PROPOSTA: [], FECHADO: [], PERDIDO: [],
    };
    leads.forEach(l => { if (grouped[l.stage]) grouped[l.stage].push(l); });
    res.json(grouped);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao carregar pipeline.' });
  }
});

// GET /api/cliente/kanban — tarefas do kanban por cliente
app.get('/api/cliente/kanban', authMiddleware, requireRole('CLIENTE', 'ADMIN', 'CEO'), async (req: any, res: any) => {
  try {
    const clientId = await getClientIdByUser(req.user.id);
    if (!clientId) return res.status(404).json({ error: 'Empresa não encontrada.' });
    const tasks = await prisma.task.findMany({
      where: { clientId },
      include: { assignee: { select: { id: true, name: true, avatar: true } }, project: { select: { id: true, name: true } } },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao carregar kanban.' });
  }
});

// POST /api/cliente/ticket — abre chamado pelo cliente
app.post('/api/cliente/ticket', authMiddleware, requireRole('CLIENTE', 'ADMIN', 'CEO'), async (req: any, res: any) => {
  try {
    const clientId = await getClientIdByUser(req.user.id);
    const { subject, description, priority } = req.body;
    if (!subject) return res.status(400).json({ error: 'Assunto é obrigatório.' });

    const protocol = `TK-${Date.now().toString(36).toUpperCase()}`;
    const ticket = await prisma.ticket.create({
      data: {
        protocol,
        subject,
        description: description || '',
        priority: priority || 'MEDIA',
        status: 'NOVO',
        clientName: req.user.name,
        clientWhatsapp: '',
        ...(clientId ? { clientId } : {}),
      }
    });

    await logAudit(req.user.id, 'TICKET_CREATED', 'SUPORTE', { protocol, subject, priority });
    res.status(201).json({ ok: true, ticket });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao abrir chamado.' });
  }
});

// GET /api/cliente/ads-status — status mock/real das campanhas
app.get('/api/cliente/ads-status', authMiddleware, requireRole('CLIENTE', 'ADMIN', 'CEO'), async (req: any, res: any) => {
  try {
    const clientId = await getClientIdByUser(req.user.id);
    const empresa = clientId ? await prisma.client.findUnique({ where: { id: clientId }, select: { company: true, responsible: true } }) : null;
    // Dados mock realistas — substituir por integração real quando token configurado
    res.json({
      meta: { status: 'ATIVA', campanha: `${empresa?.company || 'Empresa'} — Meta Ads`, spend: 1240.50, impressions: 84320, reach: 52100, clicks: 1873, ctr: 2.22, cpc: 0.66, messages: 94, otimizador: empresa?.responsible || 'Equipe Magister Tech', ultimaOtimizacao: new Date().toLocaleDateString('pt-BR') },
      google: { status: 'ATIVA', campanha: `${empresa?.company || 'Empresa'} — Google Ads`, spend: 680.00, impressions: 22400, reach: 18900, clicks: 890, ctr: 3.97, cpc: 0.76, conversions: 38, otimizador: empresa?.responsible || 'Equipe Magister Tech', ultimaOtimizacao: new Date().toLocaleDateString('pt-BR') },
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar status dos anúncios.' });
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

