// ==== CONFIGURAÇÕES GERAIS ====
const PROFILES = [
  { id: "jrkingdom", name: "JR Kingdom", color: "indigo" },
  { id: "pessoal", name: "Jondson Pessoal", color: "sky" },
  { id: "daiane", name: "Daiane Rabelo", color: "pink" },
  { id: "consolidado", name: "Visão Familiar", color: "purple" }
];

let activeProfileId = "jrkingdom"; 
let abaAtual = "dashboard";
let transacoes = [];
let agendaItens = [];
let vendas = [];
let saldoVisivel = true;
const COLORS = ['#6366f1', '#0ea5e9', '#ec4899', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#14b8a6'];

function safeText(s) { return String(s || '').replace(/[<>&"]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c])); }
function formatDollar(val) { return `$ ${Number(val||0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits:2})}`; }
function showToast(msg) {
  const toast = document.getElementById('toast');
  document.getElementById('toast-message').innerText = msg;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

function showLoader() { document.getElementById('loader-screen').classList.remove('hidden'); }
function hideLoader() { document.getElementById('loader-screen').classList.add('hidden'); }

// ================= API FETCH =================
async function carregarDadosDoServidor() {
  showLoader();
  try {
      const [resT, resV, resA] = await Promise.all([
          fetch('/api/transacoes'), fetch('/api/vendas'), fetch('/api/agenda')
      ]);
      transacoes = await resT.json();
      vendas = await resV.json();
      agendaItens = await resA.json();
      
      atualizarInterface();
      if(abaAtual === 'agenda') renderizarAgenda();
      showToast('Dados sincronizados!');
  } catch(e) {
      showToast('Erro ao sincronizar');
      console.error(e);
  }
  hideLoader();
}

// ==== UI / THEME ====
function atualizarTemaPerfil() {
    const header = document.getElementById('app-header');
    if(activeProfileId === 'jrkingdom') header.className = "bg-slate-900 text-white pt-12 pb-8 px-6 rounded-b-[3rem] shadow-xl shrink-0 transition-colors duration-500 relative z-20";
    else if(activeProfileId === 'pessoal') header.className = "bg-sky-900 text-white pt-12 pb-8 px-6 rounded-b-[3rem] shadow-xl shrink-0 transition-colors duration-500 relative z-20";
    else if(activeProfileId === 'daiane') header.className = "bg-pink-900 text-white pt-12 pb-8 px-6 rounded-b-[3rem] shadow-xl shrink-0 transition-colors duration-500 relative z-20";
    else header.className = "bg-purple-900 text-white pt-12 pb-8 px-6 rounded-b-[3rem] shadow-xl shrink-0 transition-colors duration-500 relative z-20";
}

document.getElementById('profile-selector').addEventListener('change', (e) => {
    activeProfileId = e.target.value;
    atualizarTemaPerfil();
    atualizarInterface();
    if(abaAtual === 'agenda') renderizarAgenda();
    showToast(`Perfil alterado`);
});

window.toggleSaldoVisivel = () => { saldoVisivel = !saldoVisivel; atualizarInterface(); };
window.mudarAba = (aba) => {
    abaAtual = aba;
    ['dashboard','extrato','agenda'].forEach(a => document.getElementById('view-'+a).classList.add('hidden'));
    document.getElementById('view-'+aba).classList.remove('hidden');
    if (aba === 'dashboard') atualizarInterface();
    if (aba === 'agenda') renderizarAgenda();
};

window.handlePlusButton = () => {
    if (abaAtual === 'agenda') abrirModalAgenda();
    else if (activeProfileId === 'jrkingdom') abrirModalVenda();
    else abrirModalTransacao();
};

// ================= FILTROS E CÁLCULOS =================
function filtrarPorPeriodo(arrayDeDados) {
    const periodo = document.getElementById('filtro-periodo').value;
    if (periodo === 'tudo') return arrayDeDados;
    
    const hoje = new Date();
    const mesAtual = (hoje.getMonth() + 1).toString().padStart(2, '0');
    const anoAtual = hoje.getFullYear().toString();
    
    return arrayDeDados.filter(item => {
        let dataStr = item.criadoEm || item.data; // lida com transacoes e vendas/agenda
        if(!dataStr) return false;
        const partes = dataStr.split('/');
        return partes[1] === mesAtual && partes[2] === anoAtual;
    });
}

// ==== DASHBOARD E LISTAGEM ====
window.atualizarInterface = function() {
    const tFiltradas = filtrarPorPeriodo(transacoes.filter(t => activeProfileId === 'consolidado' ? t.profileId !== 'consolidado' : t.profileId === activeProfileId));
    
    let entradas = 0; let saidas = 0;
    tFiltradas.forEach(t => {
        if(t.tipo === 'despesa') saidas += Number(t.valor);
        else entradas += Number(t.valor);
    });

    document.getElementById('card-entradas').innerText = formatDollar(entradas);
    document.getElementById('card-saidas').innerText = formatDollar(saidas);
    document.getElementById('header-saldo').innerText = saldoVisivel ? formatDollar(entradas - saidas) : '$ •••••';
    
    renderizarExtrato(tFiltradas);
    renderizarInsights(entradas, saidas);

    const rsVendas = document.getElementById('resumo-vendas');
    const rsParc = document.getElementById('resumo-parcelamentos');
    if(activeProfileId === 'jrkingdom') {
        rsVendas.classList.remove('hidden');
        rsParc.classList.remove('hidden');
        renderizarVendas();
    } else {
        rsVendas.classList.add('hidden');
        rsParc.classList.add('hidden');
    }
};

function renderizarExtrato(items) {
    const cont = document.getElementById('lista-extrato');
    cont.innerHTML = '';
    
    const sorted = [...items].sort((a,b) => b.criadoEm.split('/').reverse().join('').localeCompare(a.criadoEm.split('/').reverse().join('')));
    
    sorted.forEach(t => {
        const isDespesa = t.tipo === 'despesa';
        cont.insertAdjacentHTML('beforeend', `
            <div class="premium-card p-4 flex justify-between items-center mb-3 group hover-item relative">
                <div class="absolute right-2 top-2 flex gap-1 z-10 hidden group-hover:flex bg-white px-2 py-1 rounded-lg border border-slate-100 shadow-sm">
                    <button onclick="abrirModalTransacao('${t.id}')" class="text-blue-500 hover:text-blue-700 mx-1"><i class="fas fa-edit"></i></button>
                    <button onclick="excluirTransacao('${t.id}')" class="text-rose-500 hover:text-rose-700 mx-1"><i class="fas fa-trash"></i></button>
                </div>
                <div>
                    <p class="font-black text-slate-800 text-sm">${safeText(t.descricao)}</p>
                    <p class="text-[10px] text-slate-400 mt-0.5">${t.criadoEm} • ${t.categoria}</p>
                </div>
                <div class="font-black ${isDespesa?'text-slate-800':'text-emerald-500'}">${isDespesa?'-':'+'} ${formatDollar(t.valor)}</div>
            </div>
        `);
    });
}

function renderizarInsights(entradas, saidas) {
    const bloco = document.getElementById('bloco-insights');
    if (activeProfileId === 'jrkingdom') {
        const vFiltradas = filtrarPorPeriodo(vendas);
        const lucroTotal = vFiltradas.reduce((a, v) => a + v.lucro, 0);
        const dezPerc = lucroTotal * 0.10; // CÁLCULO DO DÍZIMO
        
        bloco.innerHTML = `
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xs font-black uppercase tracking-widest text-indigo-600"><i class="fas fa-chart-bar mr-1"></i> Resumo JR Kingdom</h3>
            </div>
            <div class="grid grid-cols-2 gap-3 mb-3">
                <div class="bg-indigo-50 p-3 rounded-xl text-center border border-indigo-100">
                    <p class="text-[9px] font-black text-indigo-600 uppercase">Lucro Vendas</p>
                    <p class="text-lg font-black text-slate-800">${formatDollar(lucroTotal)}</p>
                </div>
                <div class="bg-amber-50 p-3 rounded-xl text-center border border-amber-100">
                    <p class="text-[9px] font-black text-amber-600 uppercase"><i class="fas fa-pray text-amber-500"></i> Dízimo (10%)</p>
                    <p class="text-lg font-black text-amber-600">${formatDollar(dezPerc)}</p>
                </div>
            </div>
        `;
    } else {
        bloco.innerHTML = `
            <h3 class="text-xs font-black text-slate-800 uppercase tracking-widest"><i class="fas fa-wallet text-sky-500 mr-1"></i> Balanço Pessoal</h3>
            <p class="text-[10px] font-bold text-slate-400 mt-2">Saldo Real: ${formatDollar(entradas - saidas)}</p>
        `;
    }
}

function renderizarVendas() {
    const contV = document.getElementById('lista-vendas');
    const contP = document.getElementById('lista-parcelamentos');
    contV.innerHTML = ''; contP.innerHTML = '';
    
    const vFiltradas = filtrarPorPeriodo(vendas);
    vFiltradas.sort((a,b) => b.data.split('/').reverse().join('').localeCompare(a.data.split('/').reverse().join('')));

    vFiltradas.forEach(v => {
        // Venda listada
        contV.insertAdjacentHTML('beforeend', `
            <div class="border border-slate-100 rounded-xl p-4 mb-3 group hover-item relative bg-white">
                <div class="absolute right-2 top-2 flex gap-1 z-10 hidden group-hover:flex">
                    <button onclick="excluirVenda('${v.id}')" class="bg-rose-100 text-rose-600 w-8 h-8 rounded-full flex items-center justify-center"><i class="fas fa-trash text-xs"></i></button>
                </div>
                <p class="font-black text-slate-800">${safeText(v.produto)}</p>
                <p class="text-xs text-slate-500 mt-1">Valor: ${formatDollar(v.valor)} | Lucro: ${formatDollar(v.lucro)}</p>
                ${v.pendente > 0 ? `<p class="text-[11px] font-bold text-rose-500 mt-1"><i class="fas fa-clock"></i> Faltam: ${formatDollar(v.pendente)}</p>` : `<p class="text-[11px] font-bold text-emerald-500 mt-1"><i class="fas fa-check-circle"></i> Quitada</p>`}
            </div>
        `);

        // Adicionar checklist se for parcelado e tiver pendencia (checklist de recebimentos pendentes)
        if(v.parcelado && Number(v.parcelado) > 0) {
            const numParcelas = Number(v.parcelado);
            const valorPorParcela = v.valor / numParcelas;
            
            let htmlParcelas = '';
            for(let i=1; i<=numParcelas; i++){
                const paga = (v.parcelasPagas || []).includes(i);
                htmlParcelas += `
                    <label class="flex items-center gap-3 p-2 bg-slate-50 border border-slate-100 rounded-lg mb-1 cursor-pointer transition ${paga ? 'opacity-50' : 'hover:bg-indigo-50'}">
                        <input type="checkbox" class="w-4 h-4 text-indigo-600 rounded border-slate-300 pointer-events-none" ${paga ? 'checked disabled' : ''}>
                        <div class="flex-1 text-xs font-bold text-slate-700">Parcela ${i}/${numParcelas} - ${formatDollar(valorPorParcela)}</div>
                        ${!paga ? `<button type="button" onclick="pagarParcela('${v.id}', ${i}, ${valorPorParcela})" class="text-[10px] bg-indigo-600 text-white px-2 py-1 rounded-md font-black">Receber</button>` : `<span class="text-[10px] text-emerald-500 font-black"><i class="fas fa-check"></i></span>`}
                    </label>
                `;
            }
            
            contP.insertAdjacentHTML('beforeend', `
                <div class="mb-4">
                    <p class="text-xs font-black text-slate-800 mb-2">${safeText(v.produto)} <span class="text-slate-400 font-normal">(${v.data})</span></p>
                    ${htmlParcelas}
                </div>
            `);
        }
    });

    if(contP.innerHTML === '') contP.innerHTML = '<p class="text-xs text-slate-400 text-center py-4">Nenhum recebimento pendente.</p>';
}

function renderizarAgenda() {
    const cont = document.getElementById('lista-agenda');
    cont.innerHTML = '';
    const aFiltradas = filtrarPorPeriodo(agendaItens.filter(i => activeProfileId === 'consolidado' ? true : i.profileId === activeProfileId));

    if(!aFiltradas.length) { cont.innerHTML = '<p class="text-sm font-bold text-slate-400">Vazia</p>'; return; }

    aFiltradas.sort((a,b) => a.data.split('/').reverse().join('').localeCompare(b.data.split('/').reverse().join('')));

    aFiltradas.forEach(a => {
        cont.insertAdjacentHTML('beforeend', `
            <div class="relative flex items-center group relative cursor-pointer" onclick="abrirModalAgenda('${a.id}')">
                <div class="absolute -left-[45px] w-4 h-4 rounded-full bg-indigo-500 border-2 border-slate-50 z-10 shadow-md"></div>
                <div class="w-full bg-white border border-slate-100 p-4 rounded-2xl ml-4 shadow-sm hover:shadow-md transition">
                    <div class="flex items-center justify-between mb-1">
                        <span class="font-black text-indigo-600 text-base">${a.hora}</span>
                        <span class="text-xs text-slate-400 font-bold">${a.data}</span>
                    </div>
                    <h4 class="text-sm font-black text-slate-800 leading-tight">${safeText(a.titulo)}</h4>
                </div>
            </div>
        `);
    });
}

// ================= CHAMADAS DE API (CRUD) =================

async function excluirTransacao(id) {
    if(!confirm('Excluir transação?')) return;
    showLoader();
    try {
        await fetch(`/api/transacoes/${id}`, { method: 'DELETE' });
        transacoes = transacoes.filter(t => t.id !== id);
        atualizarInterface();
        showToast('Excluído');
    } catch(e) { showToast('Erro na exclusão'); }
    hideLoader();
}

async function excluirVenda(id) {
    if(!confirm('Excluir venda?')) return;
    showLoader();
    try {
        await fetch(`/api/vendas/${id}`, { method: 'DELETE' });
        vendas = vendas.filter(v => v.id !== id);
        atualizarInterface();
        showToast('Excluído');
    } catch(e) { showToast('Erro na exclusão'); }
    hideLoader();
}

async function pagarParcela(vendaId, indiceParcela, valorParcela) {
    showLoader();
    try {
        const dataHj = new Date().toLocaleDateString('pt-BR');
        const res = await fetch(`/api/vendas/${vendaId}/parcela`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ indiceParcela, valorParcela, dataPagamento: dataHj })
        });
        const json = await res.json();
        
        if(json.success) {
            // Atualiza DB Local
            const idx = vendas.findIndex(v => v.id === vendaId);
            if(idx !== -1) vendas[idx] = json.venda;
            transacoes.push(json.transacao);
            
            atualizarInterface();
            showToast('Parcela recebida! Transação R$'+valorParcela+' gerada.');
        } else {
            showToast(json.error);
        }
    } catch(e){ showToast('Erro ao pagar parcela'); }
    hideLoader();
}

// ==== INJEÇÃO DE MODAIS ====
document.getElementById('modals-container').innerHTML = `
    <!-- MODAL TRANSAÇÃO -->
    <div id="modal-trans" class="fixed inset-0 z-50 hidden">
        <div class="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onclick="fecharModal('trans')"></div>
        <div class="absolute bottom-0 w-full bg-white rounded-t-[2.5rem] p-7 slide-up">
            <h2 class="text-xl font-black mb-4">Nova Transação</h2>
            <form id="f-trans" onsubmit="preSalvarTransacao(event)" class="space-y-4">
                <input type="hidden" id="tr-id">
                <select id="tr-tipo" class="w-full p-4 bg-slate-50 border rounded-2xl"><option value="despesa">Despesa</option><option value="provento">Receita</option></select>
                <input type="number" id="tr-valor" class="w-full p-4 bg-slate-50 border rounded-2xl font-black text-xl text-center" placeholder="Valor ($ USD)" required step="0.01">
                <input type="text" id="tr-desc" class="w-full p-4 bg-slate-50 border rounded-2xl" placeholder="Descrição" required>
                <input type="text" id="tr-cat" class="w-full p-4 bg-slate-50 border rounded-2xl" placeholder="Categoria" required>
                <button type="submit" class="w-full bg-indigo-600 text-white p-4 rounded-xl font-black">Salvar</button>
            </form>
        </div>
    </div>

    <!-- MODAL VENDA -->
    <div id="modal-venda" class="fixed inset-0 z-50 hidden">
        <div class="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onclick="fecharModal('venda')"></div>
        <div class="absolute bottom-0 w-full bg-white rounded-t-[2.5rem] p-7 slide-up max-h-[90vh] overflow-y-auto">
            <h2 class="text-xl font-black mb-4">Mercadoria / Venda</h2>
            <form id="f-venda" onsubmit="preSalvarVenda(event)" class="space-y-4">
                <input type="text" id="vd-prod" class="w-full p-4 bg-slate-50 border rounded-2xl" placeholder="Ex: Aliança Diamante" required>
                <div class="grid grid-cols-2 gap-3">
                    <input type="number" id="vd-valor" class="w-full p-4 bg-slate-50 border rounded-2xl" placeholder="Valor Venda ($)" required step="0.01">
                    <input type="number" id="vd-custo" class="w-full p-4 bg-slate-50 border rounded-2xl" placeholder="Custo Compra ($)" required step="0.01">
                </div>
                <input type="date" id="vd-data" class="w-full p-4 bg-slate-50 border rounded-2xl" required>
                <!-- Modulo Parcelamento -->
                <div class="bg-slate-100 p-4 rounded-2xl border border-slate-200">
                    <p class="font-bold text-sm mb-2 text-indigo-600"><i class="fas fa-list-ol"></i> Configurar Parcelamento</p>
                    <input type="number" id="vd-parc" class="w-full p-3 bg-white border rounded-xl" placeholder="Nº de Parcelas (Ex: 3)">
                    <p class="text-[10px] text-slate-500 mt-1">Se maior que 0, será listado no checklist de receitas pendentes.</p>
                </div>
                <button type="submit" class="w-full bg-indigo-600 text-white p-4 rounded-xl font-black">Salvar Venda</button>
            </form>
        </div>
    </div>
    
    <!-- MODAL AGENDA -->
    <div id="modal-agenda" class="fixed inset-0 z-50 hidden">
        <div class="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onclick="fecharModal('agenda')"></div>
        <div class="absolute bottom-0 w-full bg-white rounded-t-[2.5rem] p-7 slide-up">
            <h2 class="text-xl font-black mb-4">Agenda</h2>
            <form id="f-agenda" onsubmit="preSalvarAgenda(event)" class="space-y-4">
                <input type="hidden" id="ag-id">
                <input type="text" id="ag-titulo" class="w-full p-4 bg-slate-50 border rounded-2xl" placeholder="Título" required>
                <input type="date" id="ag-data" class="w-full p-4 bg-slate-50 border rounded-2xl" required>
                <input type="time" id="ag-hora" class="w-full p-4 bg-slate-50 border rounded-2xl" required>
                <button type="submit" class="w-full bg-indigo-600 text-white p-4 rounded-xl font-black">Agendar</button>
            </form>
        </div>
    </div>
`;

window.fecharModal = (t) => document.getElementById(`modal-${t}`).classList.add('hidden');

window.abrirModalTransacao = (id=null) => {
    document.getElementById('f-trans').reset();
    document.getElementById('tr-id').value = id || '';
    if(id) { 
        const t = transacoes.find(x=>x.id==id); 
        if(t){
            document.getElementById('tr-tipo').value = t.tipo;
            document.getElementById('tr-valor').value = t.valor;
            document.getElementById('tr-desc').value = t.descricao;
            document.getElementById('tr-cat').value = t.categoria;
        }
    }
    document.getElementById('modal-trans').classList.remove('hidden');
};

window.abrirModalVenda = () => {
    document.getElementById('f-venda').reset();
    document.getElementById('vd-data').valueAsDate = new Date();
    document.getElementById('modal-venda').classList.remove('hidden');
};

window.abrirModalAgenda = (id=null) => {
    document.getElementById('f-agenda').reset();
    document.getElementById('ag-id').value = id || '';
    if(id) {
        const a = agendaItens.find(x=>x.id==id);
        if(a) {
            document.getElementById('ag-titulo').value = a.titulo;
            document.getElementById('ag-hora').value = a.hora;
            document.getElementById('ag-data').value = a.data.split('/').reverse().join('-');
        }
    } else {
        document.getElementById('ag-data').valueAsDate = new Date();
    }
    document.getElementById('modal-agenda').classList.remove('hidden');
}

// ==== SALVA NO SERVIDOR ====

window.preSalvarTransacao = async (e) => {
    e.preventDefault();
    showLoader();
    const id = document.getElementById('tr-id').value;
    const body = {
        profileId: activeProfileId === 'consolidado' ? 'pessoal' : activeProfileId,
        tipo: document.getElementById('tr-tipo').value,
        valor: Number(document.getElementById('tr-valor').value),
        descricao: document.getElementById('tr-desc').value,
        categoria: document.getElementById('tr-cat').value,
        criadoEm: new Date().toLocaleDateString('pt-BR')
    };
    try {
        const res = await fetch(id ? `/api/transacoes/${id}` : '/api/transacoes', {
            method: id ? 'PUT' : 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body)
        });
        const saved = await res.json();
        if(id) { const i = transacoes.findIndex(x=>x.id==id); transacoes[i] = saved; } 
        else transacoes.push(saved);
        atualizarInterface();
        fecharModal('trans');
        showToast('Salvo!');
    } catch(e) { showToast('Erro ao salvar'); }
    hideLoader();
};

window.preSalvarVenda = async (e) => {
    e.preventDefault();
    showLoader();
    const val = Number(document.getElementById('vd-valor').value);
    const cus = Number(document.getElementById('vd-custo').value);
    const par = document.getElementById('vd-parc').value;
    const lucro = val - cus;
    const isParcelado = parseInt(par) > 0;
    
    // Se parcelado, o pendente base é o valor total de venda
    const pendente = isParcelado ? val : 0;

    const dataOriginal = document.getElementById('vd-data').value;
    
    const body = {
        produto: document.getElementById('vd-prod').value,
        valor: val, custo: cus, lucro: lucro,
        parcelado: par, pendente: pendente,
        data: dataOriginal.split('-').reverse().join('/'),
        parcelasPagas: []
    };
    try {
        const res = await fetch('/api/vendas', {
            method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body)
        });
        vendas.push(await res.json());

        // Somente lança transação imediata de lucro se NÃO for parcelado! (Ou lança transação referente a entrada)
        if(!isParcelado) {
            const tr = {
                profileId: 'jrkingdom', tipo: 'provento',
                valor: val, categoria: 'Venda Caixa', descricao: `Venda Ref: ${body.produto}`,
                criadoEm: body.data
            };
            const r2 = await fetch('/api/transacoes', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(tr)});
            transacoes.push(await r2.json());
        }

        atualizarInterface();
        fecharModal('venda');
        showToast('Venda Finalizada!');
    } catch(e) { showToast('Erro'); }
    hideLoader();
};

window.preSalvarAgenda = async (e) => {
    e.preventDefault();
    showLoader();
    const id = document.getElementById('ag-id').value;
    const body = {
        profileId: activeProfileId === 'consolidado' ? 'pessoal' : activeProfileId,
        titulo: document.getElementById('ag-titulo').value,
        data: document.getElementById('ag-data').value.split('-').reverse().join('/'),
        hora: document.getElementById('ag-hora').value
    };
    try {
        const res = await fetch(id ? `/api/agenda/${id}` : '/api/agenda', {
            method: id ? 'PUT' : 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body)
        });
        const saved = await res.json();
        if(id) { const i = agendaItens.findIndex(x=>x.id==id); agendaItens[i] = saved; } 
        else agendaItens.push(saved);
        if(abaAtual==='agenda') renderizarAgenda();
        fecharModal('agenda');
        showToast('Agendado!');
    } catch(e) { showToast('Erro'); }
    hideLoader();
};

// Start
window.onload = () => carregarDadosDoServidor();
