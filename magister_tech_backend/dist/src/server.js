"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const client_1 = require("@prisma/client");
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
const PORT = process.env.PORT || 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// => KANBAN TASKS
app.get('/api/tasks', async (req, res) => {
    try {
        const tasks = await prisma.task.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(tasks);
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao buscar tarefas.' });
    }
});
// => CLIENTES
app.get('/api/clients', async (req, res) => {
    try {
        const clients = await prisma.client.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(clients);
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao buscar clientes.' });
    }
});
// => CONTRATOS
app.get('/api/contracts', async (req, res) => {
    try {
        const contracts = await prisma.contract.findMany({
            include: { client: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(contracts);
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao buscar contratos.' });
    }
});
// => DASHBOARD KPI (Simples)
app.get('/api/dashboard/kpis', async (req, res) => {
    try {
        const clientsCount = await prisma.client.count();
        const activeContracts = await prisma.contract.count({ where: { status: 'EM VIGOR' } });
        const pendingTasks = await prisma.task.count({ where: { status: { in: ['BACKLOG', 'DOING', 'REVIEW'] } } });
        // Revenue mock calculation (just sum of contract values)
        const contracts = await prisma.contract.findMany({ where: { status: 'EM VIGOR' } });
        const totalRevenue = contracts.reduce((acc, curr) => acc + curr.value, 0);
        res.json({
            activeClients: clientsCount,
            activeProjects: activeContracts,
            pendingTasks: pendingTasks,
            monthlyRevenue: totalRevenue,
        });
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao buscar KPIs.' });
    }
});
app.listen(PORT, () => {
    console.log(`🚀 Servidor backend rodando na porta ${PORT}`);
});
//# sourceMappingURL=server.js.map