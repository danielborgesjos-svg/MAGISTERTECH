const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'data', 'db_gestor.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helpers
const readDB = () => {
    if (!fs.existsSync(DB_PATH)) {
        return { transacoes: [], vendas: [], agenda: [] };
    }
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
};

const writeDB = (data) => {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

// ================= TRANSAÇÕES =================
app.get('/api/transacoes', (req, res) => {
    const db = readDB();
    res.json(db.transacoes || []);
});

app.post('/api/transacoes', (req, res) => {
    const db = readDB();
    const novaTransacao = { ...req.body, id: req.body.id || Date.now().toString() };
    db.transacoes.push(novaTransacao);
    writeDB(db);
    res.json(novaTransacao);
});

app.put('/api/transacoes/:id', (req, res) => {
    const db = readDB();
    const index = db.transacoes.findIndex(t => t.id === req.params.id);
    if (index !== -1) {
        db.transacoes[index] = { ...db.transacoes[index], ...req.body };
        writeDB(db);
        res.json(db.transacoes[index]);
    } else {
        res.status(404).json({ error: 'Not found' });
    }
});

app.delete('/api/transacoes/:id', (req, res) => {
    const db = readDB();
    db.transacoes = db.transacoes.filter(t => t.id !== req.params.id);
    writeDB(db);
    res.json({ success: true });
});

// ================= VENDAS E PARCELAMENTOS =================
app.get('/api/vendas', (req, res) => {
    const db = readDB();
    res.json(db.vendas || []);
});

app.post('/api/vendas', (req, res) => {
    const db = readDB();
    const novaVenda = { ...req.body, id: req.body.id || 'v' + Date.now(), parcelasPagas: req.body.parcelasPagas || [] };
    db.vendas.push(novaVenda);
    writeDB(db);
    res.json(novaVenda);
});

app.put('/api/vendas/:id', (req, res) => {
    const db = readDB();
    const index = db.vendas.findIndex(v => v.id === req.params.id);
    if (index !== -1) {
        db.vendas[index] = { ...db.vendas[index], ...req.body };
        writeDB(db);
        res.json(db.vendas[index]);
    } else {
        res.status(404).json({ error: 'Not found' });
    }
});

app.delete('/api/vendas/:id', (req, res) => {
    const db = readDB();
    db.vendas = db.vendas.filter(v => v.id !== req.params.id);
    writeDB(db);
    res.json({ success: true });
});

// Registrar pagamento de parcela
app.post('/api/vendas/:id/parcela', (req, res) => {
    const db = readDB();
    const index = db.vendas.findIndex(v => v.id === req.params.id);
    if (index !== -1) {
        const { indiceParcela, valorParcela, dataPagamento } = req.body;
        
        // Verifica se parcelasPagas existe
        if (!db.vendas[index].parcelasPagas) db.vendas[index].parcelasPagas = [];
        
        // Se a parcela já não estiver paga
        if (!db.vendas[index].parcelasPagas.includes(indiceParcela)) {
            db.vendas[index].parcelasPagas.push(indiceParcela);
            db.vendas[index].pendente = Math.max(0, db.vendas[index].pendente - valorParcela);
            
            // Adicionar como transação na JR Kingdom
            const transacaoParcela = {
                id: Date.now().toString() + '-parc',
                profileId: 'jrkingdom',
                tipo: 'provento',
                categoria: 'Recebimento Parcela',
                valor: valorParcela,
                descricao: `Parcela ${indiceParcela} recebida de: ${db.vendas[index].produto}`,
                metodo: 'pix',
                viaWhatsapp: false,
                recorrente: false,
                criadoEm: dataPagamento || new Date().toLocaleDateString('pt-BR')
            };
            db.transacoes.push(transacaoParcela);
            
            writeDB(db);
            res.json({ success: true, venda: db.vendas[index], transacao: transacaoParcela });
        } else {
            res.status(400).json({ error: 'Parcela já paga' });
        }
    } else {
        res.status(404).json({ error: 'Not found' });
    }
});

// ================= AGENDA =================
app.get('/api/agenda', (req, res) => {
    const db = readDB();
    res.json(db.agenda || []);
});

app.post('/api/agenda', (req, res) => {
    const db = readDB();
    const novoItem = { ...req.body, id: req.body.id || 'a' + Date.now() };
    db.agenda.push(novoItem);
    writeDB(db);
    res.json(novoItem);
});

app.put('/api/agenda/:id', (req, res) => {
    const db = readDB();
    const index = db.agenda.findIndex(a => a.id === req.params.id);
    if (index !== -1) {
        db.agenda[index] = { ...db.agenda[index], ...req.body };
        writeDB(db);
        res.json(db.agenda[index]);
    } else {
        res.status(404).json({ error: 'Not found' });
    }
});

app.delete('/api/agenda/:id', (req, res) => {
    const db = readDB();
    db.agenda = db.agenda.filter(a => a.id !== req.params.id);
    writeDB(db);
    res.json({ success: true });
});

// Rota fallback para o front-end SPA / HTML puro estático
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Gestor Financeiro rodando na porta ${PORT}`);
});
