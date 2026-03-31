const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DB_DIR, 'financeiro.json');
const DB_PATH_RIMA = path.join(DB_DIR, 'rima_db.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname, { index: false }));

// Forçar a raiz do site para a Rima Imóveis
app.get('/', (req, res) => {
    res.redirect('/rima_imoveis/index.html');
});

// Rota amigável para o Robo Financeiro
app.get('/vendas', (req, res) => {
    res.sendFile(path.join(__dirname, 'robo_financeiro.html'));
});

// Inicialização do Banco de Dados JSON
const initDB = () => {
    if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR);
    }
    // Financeiro
    if (!fs.existsSync(DB_PATH)) {
        const initialState = { 
            vendas: [], 
            transacoes: [], 
            agenda: [],
            config: { dizimo_percent: 0.10 }
        };
        fs.writeFileSync(DB_PATH, JSON.stringify(initialState, null, 2));
    }
    // Rima
    if (!fs.existsSync(DB_PATH_RIMA)) {
        const rimaState = {
            settings: {
                siteName: "Rima Imóveis",
                siteSubtitle: "Alto Padrão",
                logoUrl: "assets/logo.png",
                whatsapp: "5511999999999",
                email: "concierge@rimaimoveis.com",
                address: "Av. Faria Lima, 3000 - São Paulo, SP"
            },
            imoveis: [],
            leads: [],
            comunicacoes: [],
            users: [
                {
                    id: 'u1',
                    nome: 'Daniel',
                    email: 'admin@rimaimoveis.com',
                    senha: hashPassword('rima2026'),
                    role: 'admin',
                    criadoEm: new Date().toISOString()
                }
            ]
        };
        fs.writeFileSync(DB_PATH_RIMA, JSON.stringify(rimaState, null, 2));
    } else {
        // Migração: garantir que users exista no banco existente
        const db = JSON.parse(fs.readFileSync(DB_PATH_RIMA, 'utf8'));
        if (!db.users) {
            db.users = [
                {
                    id: 'u1',
                    nome: 'Daniel',
                    email: 'admin@rimaimoveis.com',
                    senha: hashPassword('rima2026'),
                    role: 'admin',
                    criadoEm: new Date().toISOString()
                }
            ];
            fs.writeFileSync(DB_PATH_RIMA, JSON.stringify(db, null, 2));
        }
    }
};

// Auth helpers
function hashPassword(pass) {
    return crypto.createHash('sha256').update(pass + 'rima_salt_2026').digest('hex');
}

// Active sessions store (in-memory)
const activeSessions = new Map();

function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

function authMiddleware(req, res, next) {
    const token = req.headers['x-auth-token'];
    if (!token || !activeSessions.has(token)) {
        return res.status(401).json({ error: 'Não autorizado. Faça login.' });
    }
    req.user = activeSessions.get(token);
    next();
}

initDB();

const readDB = () => JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
const writeDB = (data) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

// --- ROTAS DE VENDAS ---
// (Mantidas para compatibilidade)

app.get('/api/vendas', (req, res) => {
    try { const db = readDB(); res.json(db.vendas); } catch (e) { res.status(500).json({ error: "Erro ao ler banco de dados" }); }
});

app.post('/api/vendas', (req, res) => {
    try {
        const db = readDB();
        const { produto, nomePeca, nomeCliente, valor, custo, pendente, data, parcelas } = req.body;
        const lucroBruto = valor - custo;
        const dizimo = lucroBruto * db.config.dizimo_percent;
        const lucroLiquido = lucroBruto - dizimo;
        const novaVenda = { id: 'v' + Date.now(), produto, nomePeca, nomeCliente, valor, custo, pendente, data, parcelas, lucroBruto, dizimo, lucroLiquido, status: pendente > 0 ? 'Pendente' : 'Pago', criadoEm: new Date().toISOString() };
        db.vendas.push(novaVenda);
        writeDB(db);
        res.status(201).json(novaVenda);
    } catch (e) { res.status(500).json({ error: "Erro ao salvar venda" }); }
});

app.put('/api/vendas/:id', (req, res) => {
    try {
        const db = readDB();
        const index = db.vendas.findIndex(v => v.id === req.params.id);
        if (index !== -1) {
            const { valor, custo, pendente } = req.body;
            const lucroBruto = valor - custo;
            const dizimo = lucroBruto * db.config.dizimo_percent;
            const lucroLiquido = lucroBruto - dizimo;
            db.vendas[index] = { ...db.vendas[index], ...req.body, lucroBruto, dizimo, lucroLiquido, status: pendente > 0 ? 'Pendente' : 'Pago' };
            writeDB(db);
            res.json(db.vendas[index]);
        } else { res.status(404).json({ error: "Venda não encontrada" }); }
    } catch (e) { res.status(500).json({ error: "Erro ao editar venda" }); }
});

app.delete('/api/vendas/:id', (req, res) => {
    try {
        const db = readDB();
        db.vendas = db.vendas.filter(v => v.id !== req.params.id);
        writeDB(db);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Erro ao excluir venda" }); }
});

// --- ROTAS RIMA IMÓVEIS (OPERATIONAL 4.1) ---

const readRimaDB = () => JSON.parse(fs.readFileSync(DB_PATH_RIMA, 'utf8'));
const writeRimaDB = (data) => fs.writeFileSync(DB_PATH_RIMA, JSON.stringify(data, null, 2));

// ====== AUTH ======
app.post('/api/rima/login', (req, res) => {
    try {
        const { email, senha } = req.body;
        const db = readRimaDB();
        const user = db.users.find(u => u.email === email && u.senha === hashPassword(senha));
        if (!user) return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
        
        const token = generateToken();
        activeSessions.set(token, { id: user.id, nome: user.nome, email: user.email, role: user.role });
        
        // Token expira em 8h
        setTimeout(() => activeSessions.delete(token), 8 * 60 * 60 * 1000);
        
        res.json({ token, user: { nome: user.nome, email: user.email, role: user.role } });
    } catch (e) { res.status(500).json({ error: 'Erro no login.' }); }
});

app.post('/api/rima/logout', authMiddleware, (req, res) => {
    const token = req.headers['x-auth-token'];
    activeSessions.delete(token);
    res.json({ success: true });
});

app.get('/api/rima/me', authMiddleware, (req, res) => {
    res.json(req.user);
});

// ====== USER MANAGEMENT (admin only) ======
app.get('/api/rima/users', authMiddleware, (req, res) => {
    try {
        const db = readRimaDB();
        const users = db.users.map(u => ({ id: u.id, nome: u.nome, email: u.email, role: u.role, criadoEm: u.criadoEm }));
        res.json(users);
    } catch (e) { res.status(500).json({ error: 'Erro ao listar usuários.' }); }
});

app.post('/api/rima/users', authMiddleware, (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Apenas administradores podem criar usuários.' });
        const db = readRimaDB();
        const { nome, email, senha, role } = req.body;
        if (!nome || !email || !senha) return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
        if (db.users.find(u => u.email === email)) return res.status(409).json({ error: 'E-mail já cadastrado.' });
        
        const novoUser = {
            id: 'u' + Date.now(),
            nome, email,
            senha: hashPassword(senha),
            role: role || 'consultor',
            criadoEm: new Date().toISOString()
        };
        db.users.push(novoUser);
        writeRimaDB(db);
        const { senha: _, ...userSafe } = novoUser;
        res.status(201).json(userSafe);
    } catch (e) { res.status(500).json({ error: 'Erro ao criar usuário.' }); }
});

app.delete('/api/rima/users/:id', authMiddleware, (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Apenas administradores.' });
        const db = readRimaDB();
        if (req.params.id === 'u1') return res.status(400).json({ error: 'Não é possível remover o admin principal.' });
        db.users = db.users.filter(u => u.id !== req.params.id);
        writeRimaDB(db);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Erro ao remover usuário.' }); }
});

// Settings
app.get('/api/rima/settings', (req, res) => {
    try { const db = readRimaDB(); res.json(db.settings); } catch (e) { res.status(500).json({ error: "Erro ao ler settings" }); }
});

app.post('/api/rima/settings', (req, res) => {
    try {
        const db = readRimaDB();
        db.settings = { ...db.settings, ...req.body };
        writeRimaDB(db);
        res.json(db.settings);
    } catch (e) { res.status(500).json({ error: "Erro ao salvar settings" }); }
});

// Imóveis
app.get('/api/rima/imoveis', (req, res) => {
    try { const db = readRimaDB(); res.json(db.imoveis); } catch (e) { res.status(500).json({ error: "Erro ao ler imoveis" }); }
});

app.post('/api/rima/imoveis', (req, res) => {
    try {
        const db = readRimaDB();
        const novoImovel = { 
            id: 'im' + Date.now(), 
            ...req.body, 
            imagens: req.body.imagens || [], // Array support
            criadoEm: new Date().toISOString() 
        };
        db.imoveis.push(novoImovel);
        writeRimaDB(db);
        res.status(201).json(novoImovel);
    } catch (e) { res.status(500).json({ error: "Erro ao salvar imóvel" }); }
});

app.put('/api/rima/imoveis/:id', (req, res) => {
    try {
        const db = readRimaDB();
        const index = db.imoveis.findIndex(i => i.id === req.params.id);
        if (index !== -1) {
            db.imoveis[index] = { ...db.imoveis[index], ...req.body };
            writeRimaDB(db);
            res.json(db.imoveis[index]);
        } else { res.status(404).json({ error: "Não encontrado" }); }
    } catch (e) { res.status(500).json({ error: "Erro ao editar" }); }
});

app.delete('/api/rima/imoveis/:id', (req, res) => {
    try {
        const db = readRimaDB();
        db.imoveis = db.imoveis.filter(i => i.id !== req.params.id);
        writeRimaDB(db);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Erro ao excluir" }); }
});

// CRM Leads (Operational)
app.get('/api/rima/leads', (req, res) => {
    try { const db = readRimaDB(); res.json(db.leads); } catch (e) { res.status(500).json({ error: "Erro ao ler leads" }); }
});

app.post('/api/rima/leads', (req, res) => {
    try {
        const db = readRimaDB();
        const novoLead = { 
            id: 'l' + Date.now(), 
            ...req.body, 
            status: 'Novo', 
            followups: [], 
            data: new Date().toISOString() 
        };
        db.leads.push(novoLead);
        writeRimaDB(db);
        res.status(201).json(novoLead);
    } catch (e) { res.status(500).json({ error: "Erro ao capturar lead" }); }
});

app.put('/api/rima/leads/:id', (req, res) => {
    try {
        const db = readRimaDB();
        const index = db.leads.findIndex(l => l.id === req.params.id);
        if (index !== -1) {
            db.leads[index] = { ...db.leads[index], ...req.body };
            writeRimaDB(db);
            res.json(db.leads[index]);
        } else { res.status(404).json({ error: "Lead não encontrado" }); }
    } catch (e) { res.status(500).json({ error: "Erro ao editar lead" }); }
});

app.post('/api/rima/leads/:id/followup', (req, res) => {
    try {
        const db = readRimaDB();
        const index = db.leads.findIndex(l => l.id === req.params.id);
        if (index !== -1) {
            const nota = { data: new Date().toISOString(), ...req.body };
            if (!db.leads[index].followups) db.leads[index].followups = [];
            db.leads[index].followups.push(nota);
            writeRimaDB(db);
            res.status(201).json(db.leads[index]);
        } else { res.status(404).json({ error: "Lead não encontrado" }); }
    } catch (e) { res.status(500).json({ error: "Erro no follow-up" }); }
});

// Marketing Massa
app.post('/api/rima/massa', (req, res) => {
    try {
        const { ids, mensagem } = req.body;
        console.log(`[JARVIS MARKETING] Enviando para ${ids.length} contatos: ${mensagem}`);
        res.json({ success: true, count: ids.length });
    } catch (e) { res.status(500).json({ error: "Erro no envio em massa" }); }
});

// ====== LIVE CHAT ======

// Garantir que 'chats' existe no DB
function ensureChats() {
    const db = readRimaDB();
    if (!db.chats) { db.chats = []; writeRimaDB(db); }
}

// Iniciar conversa (visitante)
app.post('/api/rima/chat/start', (req, res) => {
    try {
        ensureChats();
        const { nome, telefone } = req.body;
        if (!nome || !telefone) return res.status(400).json({ error: 'Nome e telefone são obrigatórios.' });
        const db = readRimaDB();
        const novoChat = {
            id: 'c' + Date.now(),
            visitante: { nome, telefone },
            mensagens: [],
            status: 'ativo',
            criadoEm: new Date().toISOString(),
            ultimaAtividade: new Date().toISOString(),
            naoLidas: 0
        };
        db.chats.push(novoChat);
        writeRimaDB(db);
        res.status(201).json({ chatId: novoChat.id, nome });
    } catch (e) { res.status(500).json({ error: 'Erro ao iniciar chat.' }); }
});

// Visitante envia mensagem
app.post('/api/rima/chat/:id/mensagem', (req, res) => {
    try {
        const db = readRimaDB();
        ensureChats();
        const chat = db.chats.find(c => c.id === req.params.id);
        if (!chat) return res.status(404).json({ error: 'Chat não encontrado.' });
        const msg = { id: 'm' + Date.now(), autor: 'visitante', texto: req.body.texto, hora: new Date().toISOString() };
        chat.mensagens.push(msg);
        chat.ultimaAtividade = new Date().toISOString();
        chat.naoLidas = (chat.naoLidas || 0) + 1;
        writeRimaDB(db);
        res.status(201).json(msg);
    } catch (e) { res.status(500).json({ error: 'Erro ao enviar mensagem.' }); }
});

// Buscar mensagens de um chat (polling)
app.get('/api/rima/chat/:id', (req, res) => {
    try {
        const db = readRimaDB();
        ensureChats();
        const chat = db.chats.find(c => c.id === req.params.id);
        if (!chat) return res.status(404).json({ error: 'Não encontrado.' });
        res.json(chat);
    } catch (e) { res.status(500).json({ error: 'Erro ao buscar chat.' }); }
});

// Admin: listar todos os chats (requer auth)
app.get('/api/rima/chats', authMiddleware, (req, res) => {
    try {
        const db = readRimaDB();
        ensureChats();
        res.json(db.chats.sort((a, b) => new Date(b.ultimaAtividade) - new Date(a.ultimaAtividade)));
    } catch (e) { res.status(500).json({ error: 'Erro ao listar chats.' }); }
});

// Admin: responder em um chat
app.post('/api/rima/chat/:id/resposta', authMiddleware, (req, res) => {
    try {
        const db = readRimaDB();
        ensureChats();
        const chat = db.chats.find(c => c.id === req.params.id);
        if (!chat) return res.status(404).json({ error: 'Chat não encontrado.' });
        const msg = {
            id: 'm' + Date.now(),
            autor: 'atendente',
            nomeAtendente: req.user.nome,
            texto: req.body.texto,
            hora: new Date().toISOString()
        };
        chat.mensagens.push(msg);
        chat.ultimaAtividade = new Date().toISOString();
        chat.naoLidas = 0;
        writeRimaDB(db);
        res.status(201).json(msg);
    } catch (e) { res.status(500).json({ error: 'Erro ao responder.' }); }
});

// Admin: encerrar chat
app.put('/api/rima/chat/:id/encerrar', authMiddleware, (req, res) => {
    try {
        const db = readRimaDB();
        ensureChats();
        const chat = db.chats.find(c => c.id === req.params.id);
        if (!chat) return res.status(404).json({ error: 'Não encontrado.' });
        chat.status = 'encerrado';
        writeRimaDB(db);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Erro ao encerrar.' }); }
});

app.listen(PORT, () => {
    console.log(`[JARVIS 4.1] Servidor Rima Operacional em http://localhost:${PORT}`);
});
