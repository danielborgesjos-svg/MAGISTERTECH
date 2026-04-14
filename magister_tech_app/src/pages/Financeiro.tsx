import { useState, useMemo } from 'react';
import {
  Trash2, CheckCircle, X, TrendingUp, Activity, PieChart,
  Users, Server, Briefcase, ArrowUpRight, ArrowDownRight,
  LayoutDashboard, Calculator, Plus, Search, Edit2,
  DollarSign, AlertTriangle
} from 'lucide-react';
import { useData } from '../contexts/DataContext';

const fmt = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

const CATEGORIES = [
  'Serviços', 'Software / Sistemas', 'Infraestrutura',
  'Folha de Pagamento', 'Marketing', 'Contratos', 'Impostos', 'Outros'
];

const EMPTY_FORM = {
  description: '', amount: '', type: 'expense' as 'income' | 'expense',
  category: 'Software / Sistemas', date: new Date().toISOString().split('T')[0],
  isFixedExpense: false, recurringType: 'mensal', employeeId: '', status: 'pendente' as 'pago' | 'pendente'
};

export default function Financeiro() {
  const {
    transactions, contracts, team,
    addTransaction, updateTransactionStatus, deleteTransaction,
    getMonthRevenue, getMonthExpense
  } = useData();

  const [tab, setTab] = useState<'kpis' | 'lancamentos' | 'dre' | 'projecao'>('kpis');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCat, setFilterCat] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pago' | 'pendente'>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // ─── Form Handlers ─────────────────────────────────────────
  const openNew = (type: 'income' | 'expense') => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, type, category: type === 'income' ? 'Serviços' : 'Software / Sistemas' });
    setShowForm(true);
  };

  const openEdit = (t: any) => {
    setEditingId(t.id);
    setForm({
      description: t.description, amount: String(t.amount), type: t.type,
      category: t.category || 'Outros', date: t.date, isFixedExpense: t.isFixedExpense || false,
      recurringType: t.recurringType || 'mensal', employeeId: t.employeeId || '', status: t.status
    });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.description || !form.amount) return;
    const payload = {
      description: form.description, amount: parseFloat(form.amount), type: form.type,
      category: form.category, date: form.date, status: form.status,
      isFixedExpense: form.isFixedExpense,
      recurrence: (form.isFixedExpense ? 'mensal' : 'unico') as any,
      recurringType: form.isFixedExpense ? form.recurringType : undefined,
      employeeId: form.employeeId || undefined,
    };
    // For now, always add (edit support requires DataContext update — addressed via delete+re-add)
    addTransaction(payload);
    if (editingId) deleteTransaction(editingId); // replace by deleting old entry
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  };

  const confirmDelete = (id: string) => setConfirmDeleteId(id);
  const doDelete = () => {
    if (confirmDeleteId) { deleteTransaction(confirmDeleteId); setConfirmDeleteId(null); }
  };

  // ─── Filtering ─────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...transactions];
    if (filterType !== 'all') list = list.filter(t => t.type === filterType);
    if (filterCat) list = list.filter(t => t.category === filterCat);
    if (filterStatus !== 'all') list = list.filter(t => t.status === filterStatus);
    if (search) list = list.filter(t => t.description.toLowerCase().includes(search.toLowerCase()));
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filterType, filterCat, filterStatus, search]);

  // ─── KPI Values ─────────────────────────────────────────────
  const cashIn = getMonthRevenue();
  const cashOut = getMonthExpense();
  const balanceReal = cashIn - cashOut;
  const mrr = contracts.filter(c => c.status === 'ativo' && c.recurrence !== 'unico').reduce((acc, c) => acc + c.value, 0);
  const custosFixosMensais = transactions.filter(t => t.type === 'expense' && t.isFixedExpense).reduce((a, c) => a + c.amount, 0);
  const lucroPotencial = mrr - custosFixosMensais;
  const despesasFolha = transactions.filter(t => t.type === 'expense' && t.category === 'Folha de Pagamento').reduce((a, c) => a + c.amount, 0);
  const despesasInfra = transactions.filter(t => t.type === 'expense' && (t.category === 'Infraestrutura' || t.category === 'Software / Sistemas')).reduce((a, c) => a + c.amount, 0);
  const projecaoReceitaAnual = mrr * 12;
  const projecaoDespesaAnual = custosFixosMensais * 12;

  // ─── Totais do filtro atual ───────────────────────────────
  const totalEntradas = filtered.filter(t => t.type === 'income').reduce((a, c) => a + c.amount, 0);
  const totalSaidas = filtered.filter(t => t.type === 'expense').reduce((a, c) => a + c.amount, 0);

  return (
    <div className="animate-in" style={{ paddingBottom: 40 }}>
      {/* HEADER */}
      <div className="page-header" style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 100, fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Activity size={12} color="var(--primary)" /> Controladoria Empresarial
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-main)', margin: 0, lineHeight: 1.1 }}>
            Tesouraria & Caixa
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" style={{ borderColor: 'var(--success)', color: 'var(--success)' }} onClick={() => openNew('income')}>
            <ArrowUpRight size={16} /> + Receita
          </button>
          <button className="btn btn-primary" onClick={() => openNew('expense')}>
            <ArrowDownRight size={16} /> + Despesa
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="tab-list" style={{ marginBottom: 24, width: 'auto', display: 'inline-flex' }}>
        <button className={`tab-btn ${tab === 'kpis' ? 'active' : ''}`} onClick={() => setTab('kpis')}><LayoutDashboard size={14} style={{ display: 'inline', marginBottom: -2 }} /> KPIs</button>
        <button className={`tab-btn ${tab === 'lancamentos' ? 'active' : ''}`} onClick={() => setTab('lancamentos')}><Calculator size={14} style={{ display: 'inline', marginBottom: -2 }} /> Lançamentos</button>
        <button className={`tab-btn ${tab === 'dre' ? 'active' : ''}`} onClick={() => setTab('dre')}><PieChart size={14} style={{ display: 'inline', marginBottom: -2 }} /> DRE</button>
        <button className={`tab-btn ${tab === 'projecao' ? 'active' : ''}`} onClick={() => setTab('projecao')}><TrendingUp size={14} style={{ display: 'inline', marginBottom: -2 }} /> Projeção</button>
      </div>

      {/* ─── KPIs ─────────────────────────────────────────── */}
      {tab === 'kpis' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'MRR Contratual', value: fmt(mrr), color: 'var(--primary)', glow: 'var(--primary-glow)', icon: <Briefcase size={18} />, sub: 'Recorrências ativas' },
              { label: 'Entradas (Mês)', value: fmt(cashIn), color: 'var(--success)', glow: 'var(--success-glow)', icon: <ArrowUpRight size={18} />, sub: 'Receitas liquidadas' },
              { label: 'Saídas (Mês)', value: fmt(cashOut), color: 'var(--danger)', glow: 'var(--danger-glow)', icon: <ArrowDownRight size={18} />, sub: 'Despesas pagas' },
              { label: 'Saldo Líquido', value: fmt(balanceReal), color: balanceReal >= 0 ? 'var(--success)' : 'var(--danger)', glow: balanceReal >= 0 ? 'var(--success-glow)' : 'var(--danger-glow)', icon: <DollarSign size={18} />, sub: balanceReal >= 0 ? 'Caixa positivo ✓' : 'Atenção: déficit !' },
            ].map(k => (
              <div key={k.label} className="card" style={{ padding: 24, borderTop: `3px solid ${k.color}`, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', right: -20, top: -20, width: 80, height: 80, background: k.glow, filter: 'blur(40px)', borderRadius: '50%', opacity: 0.6 }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k.label}</p>
                  <div style={{ color: k.color, opacity: 0.8 }}>{k.icon}</div>
                </div>
                <h2 style={{ fontSize: 28, fontWeight: 900, color: k.color, letterSpacing: -1, margin: 0 }}>{k.value}</h2>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>{k.sub}</p>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: 28 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 20 }}>Sustentabilidade Operacional</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--bg-subtle)', borderRadius: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>Burn Rate Fixo Mensal</span>
                <span style={{ fontWeight: 900, color: 'var(--danger)' }}>{fmt(custosFixosMensais)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--bg-subtle)', borderRadius: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>Margem MRR vs Fixo</span>
                <span style={{ fontWeight: 900, color: lucroPotencial >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                  {lucroPotencial >= 0 ? '+' : ''}{fmt(lucroPotencial)}
                </span>
              </div>
            </div>
            <div style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
              <span>Comprometimento dos contratos com custos fixos</span>
              <span style={{ fontWeight: 800 }}>{mrr > 0 ? Math.round((custosFixosMensais / mrr) * 100) : 0}%</span>
            </div>
            <div className="progress-track" style={{ height: 10 }}>
              <div className="progress-fill" style={{ background: lucroPotencial < 0 ? 'var(--danger)' : 'var(--success)', width: `${mrr > 0 ? Math.min((custosFixosMensais / mrr) * 100, 100) : 0}%`, transition: 'width 0.6s ease' }} />
            </div>
          </div>
        </>
      )}

      {/* ─── LANÇAMENTOS ─────────────────────────────────── */}
      {tab === 'lancamentos' && (
        <>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input className="input" placeholder="Buscar lançamento..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36, width: '100%' }} />
            </div>
            <select className="input" value={filterType} onChange={e => setFilterType(e.target.value as any)} style={{ minWidth: 140 }}>
              <option value="all">Todos os tipos</option>
              <option value="income">Receitas</option>
              <option value="expense">Despesas</option>
            </select>
            <select className="input" value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ minWidth: 180 }}>
              <option value="">Todas as categorias</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="input" value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} style={{ minWidth: 140 }}>
              <option value="all">Qualquer status</option>
              <option value="pago">Pago</option>
              <option value="pendente">Pendente</option>
            </select>
          </div>

          {/* Summary bar */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ padding: '10px 20px', background: 'var(--success-glow)', borderRadius: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
              <ArrowUpRight size={14} color="var(--success)" />
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--success)' }}>Entradas: {fmt(totalEntradas)}</span>
            </div>
            <div style={{ padding: '10px 20px', background: 'var(--danger-glow)', borderRadius: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
              <ArrowDownRight size={14} color="var(--danger)" />
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--danger)' }}>Saídas: {fmt(totalSaidas)}</span>
            </div>
            <div style={{ padding: '10px 20px', background: 'var(--bg-subtle)', borderRadius: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
              <DollarSign size={14} color="var(--text-muted)" />
              <span style={{ fontSize: 13, fontWeight: 800, color: (totalEntradas - totalSaidas) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                Balanço: {fmt(totalEntradas - totalSaidas)}
              </span>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button className="btn btn-outline" style={{ borderColor: 'var(--success)', color: 'var(--success)', fontSize: 13 }} onClick={() => openNew('income')}>
                <Plus size={14} /> Receita
              </button>
              <button className="btn btn-primary" style={{ fontSize: 13 }} onClick={() => openNew('expense')}>
                <Plus size={14} /> Despesa
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 100 }}>Status</th>
                  <th style={{ width: 100 }}>Data</th>
                  <th>Descrição</th>
                  <th>Categoria</th>
                  <th style={{ width: 110 }}>Tipo</th>
                  <th style={{ textAlign: 'right', width: 130 }}>Valor</th>
                  <th style={{ textAlign: 'center', width: 90 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id}>
                    <td>
                      <span
                        className={`badge ${t.status === 'pago' ? 'badge-success' : 'badge-warning'}`}
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        title="Clique para alternar status"
                        onClick={() => updateTransactionStatus(t.id, t.status === 'pago' ? 'pendente' : 'pago')}
                      >
                        {t.status === 'pago' ? '✓ PAGO' : 'PENDENTE'}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
                      {t.date ? new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td>
                      <div style={{ fontWeight: 800, fontSize: 14 }}>{t.description}</div>
                      {t.isFixedExpense && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-glow)', padding: '1px 6px', borderRadius: 20 }}>
                          Fixo · {t.recurringType}
                        </span>
                      )}
                    </td>
                    <td><span className="badge badge-muted">{t.category}</span></td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: t.type === 'income' ? 'var(--success)' : 'var(--danger)' }}>
                        {t.type === 'income' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {t.type === 'income' ? 'Receita' : 'Despesa'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 900, color: t.type === 'income' ? 'var(--success)' : 'var(--danger)', fontSize: 15 }}>
                      {t.type === 'income' ? '+' : '-'} {fmt(t.amount)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                        <button className="btn-icon" title="Editar" onClick={() => openEdit(t)}>
                          <Edit2 size={14} />
                        </button>
                        <button className="btn-icon" title="Mover para Lixeira" onClick={() => confirmDelete(t.id)} style={{ color: 'var(--danger)' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    Nenhum lançamento encontrado com os filtros atuais.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ─── DRE ──────────────────────────────────────────── */}
      {tab === 'dre' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Server size={18} color="var(--primary)" /> Infraestrutura & Sistemas
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {transactions.filter(t => t.category === 'Software / Sistemas' || t.category === 'Infraestrutura').map(t => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{t.description}</span>
                    {t.isFixedExpense && <span className="badge" style={{ background: 'var(--bg-subtle)', fontSize: 10 }}>Fixo</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 900, color: 'var(--danger)' }}>- {fmt(t.amount)}</span>
                    <button className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => confirmDelete(t.id)}><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '2px solid var(--border)' }}>
                <span style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: 12 }}>Total Infraestrutura</span>
                <span style={{ fontWeight: 900, color: 'var(--danger)' }}>{fmt(despesasInfra)}</span>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={18} color="var(--indigo)" /> Folha de Pagamento & Pró-Labore
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {transactions.filter(t => t.category === 'Folha de Pagamento').map(t => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{t.description}</span>
                    {t.employeeId && <span className="badge" style={{ marginLeft: 8, background: 'rgba(99,102,241,0.1)', color: 'var(--indigo)', fontSize: 10 }}>{team.find(tm => tm.id === t.employeeId)?.name || 'Colaborador'}</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 900, color: 'var(--danger)' }}>- {fmt(t.amount)}</span>
                    <button className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => confirmDelete(t.id)}><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '2px solid var(--border)' }}>
                <span style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: 12 }}>Total Pessoal</span>
                <span style={{ fontWeight: 900, color: 'var(--danger)' }}>{fmt(despesasFolha)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── PROJEÇÃO ─────────────────────────────────────── */}
      {tab === 'projecao' && (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>Projeção de Caixa (12 Meses)</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 36 }}>
            Estimativa baseada no MRR recorrente vs Custo Operacional Fixo projetado.
          </p>
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { label: 'Receita Anual Projetada', value: fmt(projecaoReceitaAnual), color: 'var(--success)' },
              { label: 'Custo Fixo Anual', value: fmt(projecaoDespesaAnual), color: 'var(--danger)' },
              { label: 'Lucro Líquido Anual', value: fmt(projecaoReceitaAnual - projecaoDespesaAnual), color: 'var(--primary)', border: true },
            ].map(k => (
              <div key={k.label} style={{ background: 'var(--bg-subtle)', padding: '28px 32px', borderRadius: 16, minWidth: 240, border: k.border ? '2px solid var(--primary)' : '1px solid var(--border)' }}>
                <p style={{ fontWeight: 800, color: k.color, marginBottom: 12 }}>{k.label}</p>
                <h1 style={{ fontSize: 30, fontWeight: 900, color: k.color, margin: 0 }}>{k.value}</h1>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── MODAL FORMULÁRIO ──────────────────────────────── */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="card modal animate-scale-in" style={{ width: '100%', maxWidth: 520, padding: 32 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: 20, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 10 }}>
                {editingId ? <Edit2 size={20} color="var(--primary)" /> : form.type === 'income' ? <ArrowUpRight size={20} color="var(--success)" /> : <ArrowDownRight size={20} color="var(--danger)" />}
                {editingId ? 'Editar Lançamento' : form.type === 'income' ? 'Nova Receita' : 'Nova Despesa'}
              </h2>
              <button className="btn-icon" onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Tipo */}
              <div>
                <label className="form-label">Natureza</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {(['income', 'expense'] as const).map(tp => (
                    <button key={tp} className="btn" onClick={() => setForm({ ...form, type: tp })}
                      style={{
                        background: form.type === tp ? (tp === 'income' ? 'var(--success-glow)' : 'var(--danger-glow)') : 'transparent',
                        color: form.type === tp ? (tp === 'income' ? 'var(--success)' : 'var(--danger)') : 'var(--text-muted)',
                        border: `2px solid ${form.type === tp ? (tp === 'income' ? 'var(--success)' : 'var(--danger)') : 'var(--border)'}`,
                        fontWeight: form.type === tp ? 800 : 500
                      }}>
                      {tp === 'income' ? '↑ Receita' : '↓ Despesa'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categoria */}
              <div>
                <label className="form-label">Categoria</label>
                <select className="input" style={{ width: '100%' }} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Descrição */}
              <div>
                <label className="form-label">Descrição</label>
                <input className="input" placeholder={form.type === 'income' ? 'Ex: Fatura cliente XYZ' : 'Ex: Servidor AWS'} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ width: '100%' }} />
              </div>

              {/* Valor + Data */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label">Valor (R$)</label>
                  <input className="input" type="number" step="0.01" min="0" placeholder="0,00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} style={{ width: '100%' }} />
                </div>
                <div>
                  <label className="form-label">Data</label>
                  <input className="input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={{ width: '100%' }} />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="form-label">Status</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {(['pago', 'pendente'] as const).map(s => (
                    <button key={s} className="btn" onClick={() => setForm({ ...form, status: s })}
                      style={{
                        background: form.status === s ? (s === 'pago' ? 'var(--success-glow)' : 'rgba(234,179,8,0.1)') : 'transparent',
                        color: form.status === s ? (s === 'pago' ? 'var(--success)' : 'var(--warning)') : 'var(--text-muted)',
                        border: `2px solid ${form.status === s ? (s === 'pago' ? 'var(--success)' : 'var(--warning)') : 'var(--border)'}`,
                        fontWeight: form.status === s ? 800 : 500
                      }}>
                      {s === 'pago' ? '✓ Pago' : '⏳ Pendente'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custo Fixo */}
              {form.type === 'expense' && (
                <div style={{ padding: 16, background: 'var(--bg-subtle)', borderRadius: 12, border: '1px dashed var(--border)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontWeight: 700 }}>
                    <input type="checkbox" checked={form.isFixedExpense} onChange={e => setForm({ ...form, isFixedExpense: e.target.checked })} style={{ width: 16, height: 16 }} />
                    Custo Fixo Recorrente?
                  </label>
                  {form.isFixedExpense && (
                    <select className="input" style={{ width: '100%', marginTop: 10 }} value={form.recurringType} onChange={e => setForm({ ...form, recurringType: e.target.value })}>
                      <option value="mensal">Mensal</option>
                      <option value="semestral">Semestral</option>
                      <option value="anual">Anual</option>
                    </select>
                  )}
                  {form.category === 'Folha de Pagamento' && (
                    <div style={{ marginTop: 12 }}>
                      <label className="form-label">Vincular Colaborador</label>
                      <select className="input" style={{ width: '100%' }} value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })}>
                        <option value="">Nenhum (Geral)</option>
                        {team.map(t => <option key={t.id} value={t.id}>{t.name} ({t.role})</option>)}
                      </select>
                    </div>
                  )}
                </div>
              )}

              <button className="btn btn-primary" style={{ width: '100%', height: 48, fontSize: 15, marginTop: 4 }} onClick={handleSave} disabled={!form.description || !form.amount}>
                <CheckCircle size={16} /> {editingId ? 'Salvar Alterações' : 'Registrar Lançamento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CONFIRM DELETE MODAL ──────────────────────────── */}
      {confirmDeleteId && (
        <div className="modal-overlay" onClick={() => setConfirmDeleteId(null)}>
          <div className="card modal animate-scale-in" style={{ maxWidth: 400, padding: 32, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(239,68,68,0.12)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={24} color="var(--danger)" />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 900, marginBottom: 8 }}>Mover para Lixeira?</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>Este lançamento será movido para a lixeira e poderá ser restaurado depois.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setConfirmDeleteId(null)}>Cancelar</button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={doDelete}><Trash2 size={14} /> Mover</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
