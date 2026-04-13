"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = __importDefault(require("path"));
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const whatsapp_1 = require("./whatsapp");
dotenv_1.default.config();
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const IS_PROD = process.env.NODE_ENV === 'production';
const ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:3001',
    'http://localhost:3000',
    process.env.FRONTEND_URL,
].filter(Boolean);
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Permitir requests sem origin (ex: mobile apps, curl, server-to-server)
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(null, true); // Em desenvolvimento libera tudo
        }
    },
    credentials: true, // ESSENCIAL para envio automático de cookies
}));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
// =====================================================
// AUDIT LOG HELPER
// =====================================================
async function logAudit(userId, action, systemModule, details) {
    try {
        await prisma.auditLog.create({
            data: {
                userId,
                action,
                module: systemModule,
                details: JSON.stringify(details)
            }
        });
    }
    catch (err) {
        console.error('[AuditLog] Erro ao registrar:', err);
    }
}
// =====================================================
// MIDDLEWARE DE AUTENTICAÇÃO — httpOnly Cookie primeiro, Bearer fallback
// =====================================================
const authMiddleware = (req, res, next) => {
    // 1. Tentar ler token do cookie httpOnly (método principal)
    let token = req.cookies?.magister_jwt;
    // 2. Fallback: Authorization Bearer (retrocompatibilidade e VPS)
    if (!token) {
        token = req.headers.authorization?.split(' ')[1];
    }
    if (!token)
        return res.status(401).json({ error: 'Acesso negado. Sessão não autenticada.' });
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (err) {
        // Cookie inválido — limpar e negar
        res.clearCookie('magister_jwt');
        res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' });
    }
};
// =====================================================
// MIDDLEWARE RBAC — verifica roles permitidos
// =====================================================
// Roles: ADMIN | GESTOR | COLABORADOR | CLIENTE
const requireRole = (...roles) => (req, res, next) => {
    const userRole = (req.user?.role || '').toUpperCase();
    const allowed = roles.map(r => r.toUpperCase());
    // ADMIN e CEO têm acesso irrestrito
    if (['ADMIN', 'CEO'].includes(userRole))
        return next();
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
const blockCliente = (req, res, next) => {
    const userRole = (req.user?.role || '').toUpperCase();
    if (userRole === 'CLIENTE') {
        return res.status(403).json({ error: 'Área restrita à equipe interna.' });
    }
    next();
};
// =====================================================
// AUTH ROUTES
// =====================================================
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user)
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        const validPassword = await bcryptjs_1.default.compare(password, user.password);
        if (!validPassword)
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        if (!user.isActive)
            return res.status(401).json({ error: 'Usuário inativo.' });
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' } // 7 dias — chave se renova sozinha
        );
        // === COOKIE httpOnly — Não acessível por JavaScript ===
        res.cookie('magister_jwt', token, {
            httpOnly: true, // Não acessível via document.cookie
            secure: IS_PROD, // HTTPS apenas em produção
            sameSite: IS_PROD ? 'strict' : 'lax', // CSRF protection
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias em ms
            path: '/',
        });
        // Retornar token também no body para compatibilidade (ex: apps mobile)
        res.json({
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, preferences: user.preferences }
        });
    }
    catch (err) {
        res.status(500).json({ error: 'Erro interno no servidor.' });
    }
});
// Logout — Limpa o cookie no servidor
app.post('/api/auth/logout', (_req, res) => {
    res.clearCookie('magister_jwt', { path: '/' });
    res.json({ ok: true, message: 'Sessão encerrada.' });
});
app.get('/api/auth/me', authMiddleware, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user)
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        res.json({ id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, preferences: user.preferences });
    }
    catch (err) {
        res.status(500).json({ error: 'Erro interno no servidor.' });
    }
});
// =====================================================
// USERS ROUTES
// =====================================================
app.get('/api/users', authMiddleware, blockCliente, async (_req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, name: true, email: true, role: true, sector: true, avatar: true, isActive: true, phone: true }
        });
        res.json(users);
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao buscar usuários.' });
    }
});
app.put('/api/users/preferences', authMiddleware, async (req, res) => {
    try {
        const { preferences } = req.body;
        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: { preferences: JSON.stringify(preferences) }
        });
        res.json({ ok: true, preferences: user.preferences });
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao salvar preferências.' });
    }
});
app.post('/api/users', authMiddleware, requireRole('ADMIN', 'CEO'), async (req, res) => {
    try {
        const { name, email, password, role, sector, phone, avatar } = req.body;
        if (!name || !email || !password)
            return res.status(400).json({ error: 'Campos obrigatórios faltando.' });
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await prisma.user.create({
            data: { name, email, password: hashedPassword, role, sector, phone, avatar }
        });
        await logAudit(req.user.id, 'CREATE_USER', 'EQUIPE', { target: user.email });
        res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao criar usuário.' });
    }
});
app.put('/api/users/:id', authMiddleware, requireRole('ADMIN', 'CEO'), async (req, res) => {
    try {
        const { name, email, password, role, sector, phone, avatar, isActive } = req.body;
        const data = { name, email, role, sector, phone, avatar, isActive };
        if (password)
            data.password = await bcryptjs_1.default.hash(password, 10);
        const user = await prisma.user.update({ where: { id: req.params.id }, data });
        await logAudit(req.user.id, 'UPDATE_USER', 'EQUIPE', { target: user.email });
        res.json(user);
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao atualizar usuário.' });
    }
});
app.delete('/api/users/:id', authMiddleware, requireRole('ADMIN', 'CEO'), async (req, res) => {
    try {
        await prisma.user.delete({ where: { id: req.params.id } });
        await logAudit(req.user.id, 'DELETE_USER', 'EQUIPE', { targetId: req.params.id });
        res.json({ ok: true });
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao excluir usuário.' });
    }
});
// =====================================================
// CLIENTS (CRM) — CRUD COMPLETO
// =====================================================
app.get('/api/clients', authMiddleware, blockCliente, async (req, res) => {
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
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao buscar clientes.' });
    }
});
app.get('/api/clients/:id', authMiddleware, blockCliente, async (req, res) => {
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
        if (!client)
            return res.status(404).json({ error: 'Cliente não encontrado.' });
        res.json(client);
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao buscar cliente.' });
    }
});
// GET /api/clients/:id/hub — visão 360 do cliente
app.get('/api/clients/:id/hub', authMiddleware, blockCliente, async (req, res) => {
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
        if (!cliente)
            return res.status(404).json({ error: 'Cliente não encontrado.' });
        res.json({ cliente, contratoAtivo, projetos, faturas, tarefas, conteudos });
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao buscar hub do cliente.' });
    }
});
// GET /api/clients/:id/kanban — tarefas do kanban interno filtradas por cliente
app.get('/api/clients/:id/kanban', authMiddleware, requireRole('ADMIN', 'CEO', 'GESTOR', 'GESTOR_PROJETOS', 'COLABORADOR'), async (req, res) => {
    try {
        const { assigneeId, tipo } = req.query;
        const where = { clientId: req.params.id };
        if (assigneeId)
            where.assigneeId = assigneeId;
        if (tipo)
            where.tipo = tipo;
        const tasks = await prisma.task.findMany({
            where,
            include: {
                assignee: { select: { id: true, name: true, avatar: true } },
                project: { select: { id: true, name: true } },
            },
            orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        });
        res.json(tasks);
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao buscar kanban do cliente.' });
    }
});
app.post('/api/clients', authMiddleware, requireRole('ADMIN', 'CEO', 'GESTOR', 'COMERCIAL'), async (req, res) => {
    try {
        const { name, company, email, phone, cnpj, status, segment, responsible, briefing, scope, healthScore } = req.body;
        if (!name)
            return res.status(400).json({ error: 'Nome do cliente é obrigatório.' });
        const client = await prisma.client.create({
            data: { name, company, email, phone, cnpj, status: status || 'ATIVO', segment, responsible, briefing, scope, healthScore: healthScore || 0 }
        });
        res.status(201).json(client);
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao criar cliente.' });
    }
});
app.put('/api/clients/:id', authMiddleware, requireRole('ADMIN', 'CEO', 'GESTOR', 'COMERCIAL'), async (req, res) => {
    try {
        const { name, company, email, phone, cnpj, status, segment, responsible, briefing, scope, strategies, observations, healthScore } = req.body;
        const client = await prisma.client.update({
            where: { id: req.params.id },
            data: { name, company, email, phone, cnpj, status, segment, responsible, briefing, scope, strategies, observations, healthScore }
        });
        res.json(client);
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao atualizar cliente.' });
    }
});
app.delete('/api/clients/:id', authMiddleware, requireRole('ADMIN', 'CEO'), async (req, res) => {
    try {
        await prisma.client.delete({ where: { id: req.params.id } });
        res.json({ ok: true });
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao excluir cliente.' });
    }
});
// =====================================================
// PROJECTS — CRUD COMPLETO
// =====================================================
app.get('/api/projects', authMiddleware, blockCliente, async (_req, res) => {
    try {
        const projects = await prisma.project.findMany({
            include: { client: { select: { name: true, company: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(projects);
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao buscar projetos.' });
    }
});
app.get('/api/projects/:id', authMiddleware, blockCliente, async (req, res) => {
    try {
        const project = await prisma.project.findUnique({
            where: { id: req.params.id },
            include: {
                client: { select: { name: true, company: true } },
                tasks: { include: { assignee: { select: { name: true, avatar: true } } } },
                contents: true,
            }
        });
        if (!project)
            return res.status(404).json({ error: 'Projeto não encontrado.' });
        res.json(project);
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao buscar projeto.' });
    }
});
app.post('/api/projects', authMiddleware, requireRole('ADMIN', 'CEO', 'GESTOR', 'GESTOR_PROJETOS'), async (req, res) => {
    try {
        const { name, type, status, startDate, endDate, description, deliverables, observations, clientId } = req.body;
        if (!name || !clientId || !startDate)
            return res.status(400).json({ error: 'name, clientId e startDate são obrigatórios.' });
        const project = await prisma.project.create({
            data: { name, type: type || 'marketing', status: status || 'EM_ANDAMENTO', startDate: new Date(startDate), endDate: endDate ? new Date(endDate) : null, description, deliverables, observations, clientId }
        });
        res.status(201).json(project);
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao criar projeto.' });
    }
});
app.put('/api/projects/:id', authMiddleware, requireRole('ADMIN', 'CEO', 'GESTOR', 'GESTOR_PROJETOS'), async (req, res) => {
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
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao atualizar projeto.' });
    }
});
app.delete('/api/projects/:id', authMiddleware, requireRole('ADMIN', 'CEO'), async (req, res) => {
    try {
        await prisma.project.delete({ where: { id: req.params.id } });
        res.json({ ok: true });
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao excluir projeto.' });
    }
});
// =====================================================
// TASKS — CRUD COMPLETO
// =====================================================
app.get('/api/tasks', authMiddleware, blockCliente, async (req, res) => {
    try {
        const { clientId, status, assigneeId } = req.query;
        const where = {};
        if (clientId)
            where.clientId = clientId;
        if (status)
            where.status = status;
        if (assigneeId)
            where.assigneeId = assigneeId;
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
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao buscar tarefas.' });
    }
});
app.post('/api/tasks', authMiddleware, blockCliente, async (req, res) => {
    try {
        const { title, description, status, priority, deadline, tipo, assigneeId, projectId, clientId, tags } = req.body;
        if (!title)
            return res.status(400).json({ error: 'Título é obrigatório.' });
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
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao criar tarefa.' });
    }
});
app.put('/api/tasks/:id', authMiddleware, blockCliente, async (req, res) => {
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
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao atualizar tarefa.' });
    }
});
app.put('/api/tasks/:id/status', authMiddleware, blockCliente, async (req, res) => {
    try {
        const { status } = req.body;
        const task = await prisma.task.update({ where: { id: req.params.id }, data: { status } });
        res.json(task);
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao atualizar tarefa.' });
    }
});
app.delete('/api/tasks/:id', authMiddleware, requireRole('ADMIN', 'CEO', 'GESTOR', 'GESTOR_PROJETOS'), async (req, res) => {
    try {
        await prisma.task.delete({ where: { id: req.params.id } });
        res.json({ ok: true });
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao excluir tarefa.' });
    }
});
// =====================================================
// CONTRACTS — CRUD COMPLETO
// =====================================================
app.get('/api/contracts', authMiddleware, blockCliente, async (_req, res) => {
    try {
        const contracts = await prisma.contract.findMany({
            include: { client: { select: { name: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(contracts);
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao buscar contratos.' });
    }
});
app.get('/api/contracts/:id', authMiddleware, blockCliente, async (req, res) => {
    try {
        const contract = await prisma.contract.findUnique({
            where: { id: req.params.id },
            include: {
                client: { select: { name: true, company: true } },
                faturas: { orderBy: { vencimento: 'desc' } },
            }
        });
        if (!contract)
            return res.status(404).json({ error: 'Contrato não encontrado.' });
        res.json(contract);
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao buscar contrato.' });
    }
});
app.post('/api/contracts', authMiddleware, requireRole('ADMIN', 'CEO', 'GESTOR', 'COMERCIAL', 'FINANCEIRO'), async (req, res) => {
    try {
        const { title, type, value, recurrence, startDate, endDate, status, renewal, observations, fileUrl, clientId } = req.body;
        if (!title || !value || !startDate || !clientId)
            return res.status(400).json({ error: 'title, value, startDate e clientId são obrigatórios.' });
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
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao criar contrato.' });
    }
});
app.put('/api/contracts/:id', authMiddleware, requireRole('ADMIN', 'CEO', 'GESTOR', 'COMERCIAL', 'FINANCEIRO'), async (req, res) => {
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
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao atualizar contrato.' });
    }
});
app.delete('/api/contracts/:id', authMiddleware, requireRole('ADMIN', 'CEO'), async (req, res) => {
    try {
        await prisma.contract.delete({ where: { id: req.params.id } });
        res.json({ ok: true });
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao excluir contrato.' });
    }
});
// =====================================================
// FATURAS — CRUD
// =====================================================
app.get('/api/faturas', authMiddleware, requireRole('ADMIN', 'CEO', 'GESTOR', 'FINANCEIRO'), async (req, res) => {
    try {
        const { contratoId, clienteId } = req.query;
        const where = {};
        if (contratoId)
            where.contratoId = contratoId;
        if (clienteId)
            where.clienteId = clienteId;
        const faturas = await prisma.fatura.findMany({
            where,
            include: {
                contrato: { select: { title: true, value: true } },
                cliente: { select: { name: true } },
            },
            orderBy: { vencimento: 'desc' }
        });
        res.json(faturas);
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao buscar faturas.' });
    }
});
app.post('/api/faturas', authMiddleware, requireRole('ADMIN', 'CEO', 'GESTOR', 'FINANCEIRO'), async (req, res) => {
    try {
        const { contratoId, clienteId, valor, vencimento, descricao } = req.body;
        if (!contratoId || !clienteId || !valor || !vencimento)
            return res.status(400).json({ error: 'contratoId, clienteId, valor e vencimento são obrigatórios.' });
        const fatura = await prisma.fatura.create({
            data: { contratoId, clienteId, valor: parseFloat(valor), vencimento: new Date(vencimento), descricao }
        });
        res.status(201).json(fatura);
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao criar fatura.' });
    }
});
app.put('/api/faturas/:id/status', authMiddleware, requireRole('ADMIN', 'CEO', 'GESTOR', 'FINANCEIRO'), async (req, res) => {
    try {
        const { status } = req.body;
        const data = { status };
        if (status === 'PAGO')
            data.paidAt = new Date();
        const fatura = await prisma.fatura.update({ where: { id: req.params.id }, data });
        res.json(fatura);
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao atualizar fatura.' });
    }
});
// =====================================================
// DASHBOARD KPI ROUTES
// =====================================================
app.get('/api/dashboard/kpis', authMiddleware, blockCliente, async (_req, res) => {
    try {
        const activeClients = await prisma.client.count({ where: { status: 'ATIVO' } });
        const activeProjects = await prisma.project.count({ where: { status: 'EM_ANDAMENTO' } });
        const pendingTasks = await prisma.task.count({ where: { status: { in: ['BACKLOG', 'A_FAZER', 'DOING', 'REVIEW'] } } });
        const contracts = await prisma.contract.findMany({ where: { status: 'VIGENTE' } });
        const monthlyRevenue = contracts.reduce((acc, curr) => acc + curr.value, 0);
        const revenueChart = [
            { name: 'Out', total: monthlyRevenue * 0.8 },
            { name: 'Nov', total: monthlyRevenue * 0.85 },
            { name: 'Dez', total: monthlyRevenue * 0.9 },
            { name: 'Jan', total: monthlyRevenue * 0.95 },
            { name: 'Fev', total: monthlyRevenue * 1.0 },
            { name: 'Mar', total: monthlyRevenue }
        ];
        res.json({ activeClients, activeProjects, pendingTasks, monthlyRevenue, revenueChart });
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao buscar KPIs.' });
    }
});
// =====================================================
// EVENTS (AGENDA) — CRUD
// =====================================================
app.get('/api/events', authMiddleware, async (_req, res) => {
    try {
        const events = await prisma.event.findMany({
            include: { client: { select: { name: true } }, project: { select: { name: true } } },
            orderBy: { startDate: 'asc' }
        });
        res.json(events);
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao buscar eventos.' });
    }
});
app.post('/api/events', authMiddleware, async (req, res) => {
    try {
        const { title, description, type, startDate, endDate, allDay, location, color, clientId, projectId } = req.body;
        if (!title || !startDate)
            return res.status(400).json({ error: 'Título e data inicial são obrigatórios.' });
        const event = await prisma.event.create({
            data: {
                title, description, type: type || 'INTERNO',
                startDate: new Date(startDate), endDate: endDate ? new Date(endDate) : null,
                allDay: allDay || false, location, color, clientId, projectId, userId: req.user.id
            }
        });
        res.status(201).json(event);
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao criar evento.' });
    }
});
app.delete('/api/events/:id', authMiddleware, async (req, res) => {
    try {
        await prisma.event.delete({ where: { id: req.params.id } });
        res.json({ ok: true });
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao excluir evento.' });
    }
});
// =====================================================
// TRANSACTIONS — CRUD
// =====================================================
app.get('/api/transactions', authMiddleware, requireRole('ADMIN', 'CEO', 'FINANCEIRO'), async (_req, res) => {
    try {
        const transactions = await prisma.transaction.findMany({
            include: { client: { select: { name: true } }, contract: { select: { title: true } } },
            orderBy: { dueDate: 'desc' }
        });
        res.json(transactions);
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao buscar transações.' });
    }
});
app.post('/api/transactions', authMiddleware, requireRole('ADMIN', 'CEO', 'FINANCEIRO'), async (req, res) => {
    try {
        const { description, type, amount, dueDate, status, category, clientId, contractId } = req.body;
        if (!description || !amount || !dueDate)
            return res.status(400).json({ error: 'Campos faltando.' });
        const transaction = await prisma.transaction.create({
            data: { description, type, amount: parseFloat(amount), dueDate: new Date(dueDate), status: status || 'PENDENTE', category, clientId, contractId }
        });
        res.status(201).json(transaction);
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao criar transação.' });
    }
});
app.delete('/api/transactions/:id', authMiddleware, requireRole('ADMIN', 'CEO'), async (req, res) => {
    try {
        await prisma.transaction.delete({ where: { id: req.params.id } });
        res.json({ ok: true });
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao excluir transação.' });
    }
});
// =====================================================
// GOALS & LOGS
// =====================================================
app.get('/api/goals', authMiddleware, async (_req, res) => {
    try {
        const goals = await prisma.goal.findMany();
        res.json(goals);
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao buscar metas.' });
    }
});
app.put('/api/goals/:id', authMiddleware, requireRole('ADMIN', 'CEO', 'GESTOR'), async (req, res) => {
    try {
        const { current } = req.body;
        const goal = await prisma.goal.update({ where: { id: req.params.id }, data: { current: parseFloat(current) } });
        res.json(goal);
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao atualizar meta.' });
    }
});
app.get('/api/logs', authMiddleware, requireRole('ADMIN', 'CEO'), async (_req, res) => {
    try {
        const logs = await prisma.auditLog.findMany({
            include: { user: { select: { name: true, role: true } } },
            orderBy: { createdAt: 'desc' },
            take: 200
        });
        res.json(logs);
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao buscar logs.' });
    }
});
// =====================================================
// TICKETS (SUPORTE) — ADMIN & PUBLIC
// =====================================================
// Rota pública para criação de tickets (Portal de Entrada)
app.post('/api/public/tickets', async (req, res) => {
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
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao criar ticket público.' });
    }
});
// Acompanhamento do cliente (simplificado por whatsapp)
app.get('/api/public/tickets/:whatsapp', async (req, res) => {
    try {
        const tickets = await prisma.ticket.findMany({
            where: { clientWhatsapp: req.params.whatsapp },
            include: { messages: { orderBy: { createdAt: 'asc' } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(tickets);
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao buscar chamados.' });
    }
});
// Admin routes for Tickets
app.get('/api/tickets', authMiddleware, async (_req, res) => {
    try {
        const tickets = await prisma.ticket.findMany({
            include: { messages: { orderBy: { createdAt: 'asc' } }, client: true },
            orderBy: { updatedAt: 'desc' }
        });
        res.json(tickets);
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao buscar tickets.' });
    }
});
app.post('/api/tickets/:id/messages', async (req, res) => {
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
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao enviar mensagem.' });
    }
});
app.put('/api/tickets/:id', authMiddleware, async (req, res) => {
    try {
        const { status, priority } = req.body;
        const ticket = await prisma.ticket.update({
            where: { id: req.params.id },
            data: { status, priority }
        });
        res.json(ticket);
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao atualizar ticket.' });
    }
});
// =====================================================
// FEED (COMUNICAÇÃO INTERNA)
// =====================================================
app.get('/api/feed', authMiddleware, async (_req, res) => {
    try {
        const posts = await prisma.feedPost.findMany({
            include: { comments: { orderBy: { createdAt: 'asc' } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json(posts);
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao buscar feed.' });
    }
});
app.post('/api/feed', authMiddleware, async (req, res) => {
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
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao criar post.' });
    }
});
app.post('/api/feed/:id/comments', authMiddleware, async (req, res) => {
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
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao comentar.' });
    }
});
app.post('/api/feed/:id/like', authMiddleware, async (req, res) => {
    try {
        const post = await prisma.feedPost.findUnique({ where: { id: req.params.id } });
        if (!post)
            return res.status(404).json({ error: 'Post não encontrado.' });
        let likes = JSON.parse(post.likes || '[]');
        if (likes.includes(req.user.name)) {
            likes = likes.filter((l) => l !== req.user.name);
        }
        else {
            likes.push(req.user.name);
        }
        const updated = await prisma.feedPost.update({
            where: { id: req.params.id },
            data: { likes: JSON.stringify(likes) }
        });
        res.json(updated);
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao curtir.' });
    }
});
// =====================================================
// CHAT GLOBAL
// =====================================================
app.get('/api/chat', authMiddleware, async (_req, res) => {
    try {
        const channels = await prisma.chatChannel.findMany({
            include: { messages: { orderBy: { timestamp: 'asc' }, take: 50 } }
        });
        res.json(channels);
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao buscar chat.' });
    }
});
app.post('/api/chat/messages', authMiddleware, async (req, res) => {
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
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao enviar mensagem no chat.' });
    }
});
// =====================================================
// METAS & INDICADORES (GOALS)
// =====================================================
app.get('/api/goals', authMiddleware, async (_req, res) => {
    try {
        const goals = await prisma.goal.findMany({ orderBy: { createdAt: 'desc' } });
        res.json(goals);
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao buscar metas.' });
    }
});
app.post('/api/goals', authMiddleware, requireRole('ADMIN', 'CEO', 'GESTOR'), async (req, res) => {
    try {
        const { title, target, current, unit, color, deadline } = req.body;
        const goal = await prisma.goal.create({
            data: { title, target, current: current || 0, unit, color, deadline: deadline ? new Date(deadline) : null }
        });
        res.status(201).json(goal);
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao criar meta.' });
    }
});
app.put('/api/goals/:id', authMiddleware, async (req, res) => {
    try {
        const { current } = req.body;
        const goal = await prisma.goal.update({ where: { id: req.params.id }, data: { current } });
        res.json(goal);
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao atualizar meta.' });
    }
});
// =====================================================
// BOARD COLUMNS
// =====================================================
app.get('/api/boards/columns', authMiddleware, async (_req, res) => {
    try {
        const columns = await prisma.boardColumn.findMany({ orderBy: { order: 'asc' } });
        res.json(columns);
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao buscar colunas.' });
    }
});
app.post('/api/boards/columns', authMiddleware, requireRole('ADMIN', 'CEO'), async (req, res) => {
    try {
        const { boardType, title, color, order } = req.body;
        const col = await prisma.boardColumn.create({
            data: { boardType, title, color, order: order || 0 }
        });
        res.json(col);
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao criar coluna.' });
    }
});
// SSE stream: tempo real de QR Code e status
app.get('/api/whatsapp/stream', authMiddleware, requireRole('ADMIN', 'CEO'), (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);
    // Envia estado atual imediatamente
    send((0, whatsapp_1.getWAState)());
    (0, whatsapp_1.addWAListener)(send);
    req.on('close', () => {
        (0, whatsapp_1.removeWAListener)(send);
    });
});
// Status simples (polling)
app.get('/api/whatsapp/status', authMiddleware, requireRole('ADMIN', 'CEO'), (_req, res) => {
    res.json((0, whatsapp_1.getWAState)());
});
// Iniciar conexão (gera QR Code)
app.post('/api/whatsapp/start', authMiddleware, requireRole('ADMIN', 'CEO'), (_req, res) => {
    (0, whatsapp_1.startWhatsApp)(prisma).catch(err => console.error('[WA Start]', err));
    res.json({ ok: true, message: 'Iniciando conexão WhatsApp...' });
});
// Desconectar sessão
app.post('/api/whatsapp/disconnect', authMiddleware, requireRole('ADMIN', 'CEO'), async (_req, res) => {
    await (0, whatsapp_1.disconnectWhatsApp)();
    res.json({ ok: true, message: 'WhatsApp desconectado.' });
});
// Listar contatos sincronizados
app.get('/api/whatsapp/contacts', authMiddleware, requireRole('ADMIN', 'CEO', 'GESTOR', 'COMERCIAL'), (_req, res) => {
    const { contacts, status } = (0, whatsapp_1.getWAState)();
    if (status !== 'connected') {
        return res.status(409).json({ error: 'WhatsApp não está conectado.' });
    }
    res.json(contacts);
});
// Sincronizar contatos do WA → Clientes no Prisma (importa como PROSPECT)
app.post('/api/whatsapp/sync-contacts', authMiddleware, requireRole('ADMIN', 'CEO'), async (_req, res) => {
    const { contacts, status } = (0, whatsapp_1.getWAState)();
    if (status !== 'connected') {
        return res.status(409).json({ error: 'WhatsApp não conectado.' });
    }
    let created = 0;
    let skipped = 0;
    for (const contact of contacts) {
        if (!contact.phone)
            continue;
        // Verifica se já existe uma tarefa (lead) com este telefone nas observações ou descrição
        const existing = await prisma.task.findFirst({
            where: {
                OR: [
                    { description: { contains: contact.phone } },
                    { title: { contains: contact.name } }
                ]
            }
        });
        if (existing) {
            skipped++;
            continue;
        }
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
app.post('/api/whatsapp/send', authMiddleware, async (req, res) => {
    const { phone, message } = req.body;
    if (!phone || !message) {
        return res.status(400).json({ error: 'Telefone e mensagem são obrigatórios.' });
    }
    const { status } = (0, whatsapp_1.getWAState)();
    if (status !== 'connected') {
        return res.status(409).json({ error: 'Motor do WhatsApp não está conectado.' });
    }
    try {
        const formattedMessage = `*${req.user.name} diz:*\n\n${message}`;
        await (0, whatsapp_1.sendWAMessage)(phone, formattedMessage);
        await logAudit(req.user.id, 'MENSAGEM_ENVIADA', 'WHATSAPP', { phone, message: formattedMessage });
        res.json({ ok: true, message: 'Mensagem enviada com sucesso!' });
    }
    catch (err) {
        res.status(500).json({ error: 'Falha ao enviar mensagem', details: err.message });
    }
});
// =====================================================
// WHATSAPP BOT — REGRAS DE RESPOSTA AUTOMÁTICA
// =====================================================
app.get('/api/whatsapp/bot-rules', authMiddleware, requireRole('ADMIN', 'CEO', 'GESTOR'), async (_req, res) => {
    try {
        const rules = await prisma.waBotRule.findMany({ orderBy: { order: 'asc' } });
        res.json(rules);
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao buscar regras do bot.' });
    }
});
app.post('/api/whatsapp/bot-rules', authMiddleware, requireRole('ADMIN', 'CEO'), async (req, res) => {
    try {
        const { keyword, response, isActive, order } = req.body;
        if (!keyword || !response)
            return res.status(400).json({ error: 'keyword e response são obrigatórios.' });
        const rule = await prisma.waBotRule.create({
            data: { keyword, response, isActive: isActive ?? true, order: order || 0 }
        });
        await logAudit(req.user.id, 'BOT_RULE_CREATED', 'WHATSAPP', { keyword });
        res.status(201).json(rule);
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao criar regra.' });
    }
});
app.put('/api/whatsapp/bot-rules/:id', authMiddleware, requireRole('ADMIN', 'CEO'), async (req, res) => {
    try {
        const { keyword, response, isActive, order } = req.body;
        const rule = await prisma.waBotRule.update({
            where: { id: req.params.id },
            data: { keyword, response, isActive, order }
        });
        res.json(rule);
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao atualizar regra.' });
    }
});
app.delete('/api/whatsapp/bot-rules/:id', authMiddleware, requireRole('ADMIN', 'CEO'), async (req, res) => {
    try {
        await prisma.waBotRule.delete({ where: { id: req.params.id } });
        res.json({ ok: true });
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao excluir regra.' });
    }
});
app.get('/api/whatsapp/bot-config', authMiddleware, requireRole('ADMIN', 'CEO', 'GESTOR'), async (_req, res) => {
    try {
        let config = await prisma.waBotConfig.findFirst();
        if (!config)
            config = await prisma.waBotConfig.create({ data: {} });
        res.json(config);
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao buscar config do bot.' });
    }
});
app.put('/api/whatsapp/bot-config', authMiddleware, requireRole('ADMIN', 'CEO'), async (req, res) => {
    try {
        const { isEnabled, greeting, awayMsg, workHours } = req.body;
        let config = await prisma.waBotConfig.findFirst();
        if (!config) {
            config = await prisma.waBotConfig.create({
                data: { isEnabled: isEnabled ?? false, greeting, awayMsg, workHours }
            });
        }
        else {
            config = await prisma.waBotConfig.update({
                where: { id: config.id },
                data: { isEnabled: isEnabled ?? config.isEnabled, greeting, awayMsg, workHours }
            });
        }
        await logAudit(req.user.id, 'BOT_CONFIG_UPDATED', 'WHATSAPP', { isEnabled });
        res.json(config);
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao salvar config do bot.' });
    }
});
// Listar Logs de Auditoria (Apenas ADMIN/CEO)
app.get('/api/audit', authMiddleware, requireRole('ADMIN', 'CEO'), async (_req, res) => {
    try {
        const logs = await prisma.auditLog.findMany({
            include: { user: { select: { name: true, role: true } } },
            orderBy: { createdAt: 'desc' },
            take: 200
        });
        res.json(logs);
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao buscar auditoria' });
    }
});
// =====================================================
// SERVE FRONTEND ESTÁTICO (SPA fallback)
// =====================================================
const frontendDist = path_1.default.resolve(__dirname, '../../magister_tech_app/dist');
app.use(express_1.default.static(frontendDist));
app.get('/{*splat}', (_req, res) => {
    res.sendFile(path_1.default.join(frontendDist, 'index.html'));
});
app.listen(PORT, () => {
    console.log(`🚀 Magister Tech rodando na porta ${PORT}`);
    console.log(`   Landing:    http://localhost:${PORT}/`);
    console.log(`   Painel:     http://localhost:${PORT}/admin`);
});
