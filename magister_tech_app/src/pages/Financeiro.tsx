import { useState, useMemo } from 'react';
import {
  Trash2, CheckCircle, X, TrendingUp, Activity, PieChart,
  Users, Server, Briefcase, ArrowUpRight, ArrowDownRight,
  LayoutDashboard, Calculator, Plus, Search, Edit2,
  DollarSign, AlertTriangle, RefreshCw, Calendar, Tag,
  FileText, ChevronDown
} from 'lucide-react';
import { useData } from '../contexts/DataContext';

const fmt = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n ?? 0);

const CATEGORIES = [
  'Serviços', 'Software / Sistemas', 'Infraestrutura',
  'Folha de Pagamento', 'Marketing', 'Contratos', 'Impostos', 'Outros'
];

const EMPTY_FORM = {
  description: '',
  amount: '',
  type: 'expense' as 'income' | 'expense',
  category: 'Software / Sistemas',
  date: new Date().toISOString().split('T')[0],
  isFixedExpense: false,
  recurringType: 'mensal',
  employeeId: '',
  status: 'pendente' as 'pago' | 'pendente',
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // ─── Form Handlers ─────────────────────────────────────────
  const openNew = (type: 'income' | 'expense') => {
    setEditingId(null);
    setError('');
    setForm({
      ...EMPTY_FORM,
      type,
      category: type === 'income' ? 'Serviços' : 'Software / Sistemas',
      date: new Date().toISOString().split('T')[0],
    });
    setShowForm(true);
  };

  const openEdit = (t: any) => {
    setEditingId(t.id);
    setError('');
    setForm({
      description: t.description,
      amount: String(t.amount),
      type: t.type as 'income' | 'expense',
      category: t.category || 'Outros',
      date: t.date || new Date().toISOString().split('T')[0],
      isFixedExpense: t.isFixedExpense || false,
      recurringType: t.recurringType || 'mensal',
      employeeId: t.employeeId || '',
      status: (t.status === 'pago' ? 'pago' : 'pendente') as 'pago' | 'pendente',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.description.trim()) { setError('Descrição é obrigatória.'); return; }
    if (!form.amount || parseFloat(form.amount) <= 0) { setError('Informe um valor válido maior que zero.'); return; }
    if (!form.date) { setError('Data é obrigatória.'); return; }

    setSaving(true);
    setError('');
    try {
      const payload = {
        description: form.description.trim(),
        amount: parseFloat(form.amount),
        type: form.type,      // 'income' | 'expense' — DataContext converte para RECEITA/DESPESA
        category: form.category,
        date: form.date,       // DataContext mapeia para dueDate no body enviado ao backend
        status: form.status,
        isFixedExpense: form.isFixedExpense,
        recurringType: form.isFixedExpense ? form.recurringType : undefined,
        employeeId: form.employeeId || undefined,
      };

      if (editingId) {
        // Edit = delete old + create new (simples até termos PUT dedicado)
        await deleteTransaction(editingId);
      }
      await addTransaction(payload);

      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
    } catch (e) {
      setError('Erro ao salvar lançamento. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const doDelete = () => {
    if (confirmDeleteId) { deleteTransaction(confirmDeleteId); setConfirmDeleteId(null); }
  };

  // ─── Filtering ─────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...transactions];
    if (filterType !== 'all') list = list.filter(t => t.type === filterType);
    if (filterCat) list = list.filter(t => t.category === filterCat);
    if (filterStatus !== 'all') list = list.filter(t => t.status === filterStatus);
    if (search) list = list.filter(t => t.description?.toLowerCase().includes(search.toLowerCase()));
    return list.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  }, [transactions, filterType, filterCat, filterStatus, search]);

  // ─── KPI Values ─────────────────────────────────────────────
  const cashIn = getMonthRevenue();
  const cashOut = getMonthExpense();
  const balanceReal = cashIn - cashOut;
  const mrr = contracts
    .filter(c => (c.status === 'ativo' || c.status === 'VIGENTE') && c.recurrence !== 'unico')
    .reduce((acc, c) => acc + c.value, 0);
  const custosFixosMensais = transactions
    .filter(t => t.type === 'expense' && t.isFixedExpense)
    .reduce((a, c) => a + (c.amount || 0), 0);
  const lucroPotencial = mrr - custosFixosMensais;
  const despesasFolha = transactions
    .filter(t => t.type === 'expense' && t.category === 'Folha de Pagamento')
    .reduce((a, c) => a + (c.amount || 0), 0);
  const despesasInfra = transactions
    .filter(t => t.type === 'expense' && (t.category === 'Infraestrutura' || t.category === 'Software / Sistemas'))
    .reduce((a, c) => a + (c.amount || 0), 0);

  const totalEntradas = filtered.filter(t => t.type === 'income').reduce((a, c) => a + (c.amount || 0), 0);
  const totalSaidas = filtered.filter(t => t.type === 'expense').reduce((a, c) => a + (c.amount || 0), 0);

  const isFormTypeExpense = form.type === 'expense';

  return (
    <div className="animate-in" style={{ paddingBottom: 40 }}>

      {/* ── HEADER ───────────────────────────────────────────── */}
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'var(--primary-glow)', border: '1px solid var(--border-strong)', borderRadius: 100, fontSize: 11, fontWeight: 700, color: 'var(--primary)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <Activity size={12} /> Controladoria Financeira
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-main)', margin: 0 }}>
            Tesouraria & Caixa
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>
            Receitas, despesas, DRE e projeção anual
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn btn-outline"
            style={{ borderColor: 'var(--success)', color: 'var(--success)', fontWeight: 700 }}
            onClick={() => openNew('income')}
          >
            <ArrowUpRight size={16} /> + Receita
          </button>
          <button className="btn btn-primary" onClick={() => openNew('expense')}>
            <ArrowDownRight size={16} /> + Despesa
          </button>
        </div>
      </div>

      {/* ── TABS ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, padding: '6px 8px', background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', width: 'fit-content' }}>
        {[
          { k: 'kpis', label: 'KPIs', icon: LayoutDashboard },
          { k: 'lancamentos', label: 'Lançamentos', icon: Calculator },
          { k: 'dre', label: 'DRE', icon: PieChart },
          { k: 'projecao', label: 'Projeção', icon: TrendingUp },
        ].map(({ k, label, icon: Icon }) => (
          <button
            key={k}
            onClick={() => setTab(k as any)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: 13, transition: 'all 0.2s',
              background: tab === k ? 'var(--primary)' : 'transparent',
              color: tab === k ? '#fff' : 'var(--text-muted)',
              boxShadow: tab === k ? '0 4px 12px var(--primary-glow)' : 'none',
            }}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* ─── KPIs ─────────────────────────────────────────────── */}
      {tab === 'kpis' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'MRR Contratual', value: fmt(mrr), color: 'var(--primary)', icon: <Briefcase size={20} />, sub: 'Contratos recorrentes ativos' },
              { label: 'Entradas (Mês)', value: fmt(cashIn), color: 'var(--success)', icon: <ArrowUpRight size={20} />, sub: 'Receitas liquidadas no mês' },
              { label: 'Saídas (Mês)', value: fmt(cashOut), color: 'var(--danger)', icon: <ArrowDownRight size={20} />, sub: 'Despesas registradas no mês' },
              {
                label: 'Saldo Líquido', value: fmt(balanceReal),
                color: balanceReal >= 0 ? 'var(--success)' : 'var(--danger)',
                icon: <DollarSign size={20} />, sub: balanceReal >= 0 ? 'Caixa positivo ✓' : '⚠ Atenção: déficit'
              },
            ].map(k => (
              <div key={k.label} className="card" style={{ padding: 24, borderTop: `3px solid ${k.color}`, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', right: -16, top: -16, width: 72, height: 72, borderRadius: '50%', background: k.color, opacity: 0.08, filter: 'blur(24px)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>{k.label}</p>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${k.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: k.color }}>{k.icon}</div>
                </div>
                <h2 style={{ fontSize: 26, fontWeight: 900, color: k.color, letterSpacing: -1, margin: '0 0 8px' }}>{k.value}</h2>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>{k.sub}</p>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: 28 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 20, color: 'var(--text-main)' }}>Sustentabilidade Operacional</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Burn Rate Fixo Mensal', value: fmt(custosFixosMensais), color: 'var(--danger)' },
                { label: 'Margem MRR vs Fixo', value: `${lucroPotencial >= 0 ? '+' : ''}${fmt(lucroPotencial)}`, color: lucroPotencial >= 0 ? 'var(--success)' : 'var(--danger)' },
                { label: 'Comprometimento', value: `${mrr > 0 ? Math.round((custosFixosMensais / mrr) * 100) : 0}%`, color: 'var(--primary)' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: 'var(--bg-subtle)', borderRadius: 12, border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>{item.label}</span>
                  <span style={{ fontWeight: 900, fontSize: 15, color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                <span>Comprometimento dos contratos nos custos fixos</span>
                <span style={{ fontWeight: 800 }}>{mrr > 0 ? Math.round((custosFixosMensais / mrr) * 100) : 0}%</span>
              </div>
              <div style={{ height: 10, borderRadius: 10, background: 'var(--bg-subtle)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 10, transition: 'width 0.6s ease',
                  background: lucroPotencial < 0 ? 'var(--danger)' : 'var(--success)',
                  width: `${mrr > 0 ? Math.min((custosFixosMensais / mrr) * 100, 100) : 0}%`
                }} />
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─── LANÇAMENTOS ─────────────────────────────────────── */}
      {tab === 'lancamentos' && (
        <>
          {/* Barra de resumo */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ padding: '10px 18px', background: 'var(--success-glow)', borderRadius: 10, display: 'flex', gap: 8, alignItems: 'center', border: '1px solid rgba(16,185,129,0.2)' }}>
              <ArrowUpRight size={16} color="var(--success)" />
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--success)' }}>Entradas: {fmt(totalEntradas)}</span>
            </div>
            <div style={{ padding: '10px 18px', background: 'var(--danger-glow)', borderRadius: 10, display: 'flex', gap: 8, alignItems: 'center', border: '1px solid rgba(239,68,68,0.15)' }}>
              <ArrowDownRight size={16} color="var(--danger)" />
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--danger)' }}>Saídas: {fmt(totalSaidas)}</span>
            </div>
            <div style={{ padding: '10px 18px', background: 'var(--bg-subtle)', borderRadius: 10, display: 'flex', gap: 8, alignItems: 'center', border: '1px solid var(--border)' }}>
              <DollarSign size={16} color="var(--text-muted)" />
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

          {/* Filtros */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input className="input" placeholder="Buscar lançamento..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36, width: '100%' }} />
            </div>
            <select className="input" value={filterType} onChange={e => setFilterType(e.target.value as any)} style={{ minWidth: 140 }}>
              <option value="all">Todos os tipos</option>
              <option value="income">Receitas</option>
              <option value="expense">Despesas</option>
            </select>
            <select className="input" value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ minWidth: 170 }}>
              <option value="">Todas as categorias</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="input" value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} style={{ minWidth: 140 }}>
              <option value="all">Qualquer status</option>
              <option value="pago">Pago</option>
              <option value="pendente">Pendente</option>
            </select>
          </div>

          {/* Tabela */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 110 }}>Status</th>
                  <th style={{ width: 110 }}>Data</th>
                  <th>Descrição</th>
                  <th style={{ width: 160 }}>Categoria</th>
                  <th style={{ width: 110 }}>Tipo</th>
                  <th style={{ textAlign: 'right', width: 140 }}>Valor</th>
                  <th style={{ textAlign: 'center', width: 90 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id}>
                    <td>
                      <span
                        className={`badge ${t.status === 'pago' ? 'badge-success' : 'badge-warning'}`}
                        style={{ cursor: 'pointer', userSelect: 'none', fontSize: 11 }}
                        title="Clique para alternar status"
                        onClick={() => updateTransactionStatus(t.id, t.status === 'pago' ? 'pendente' : 'pago')}
                      >
                        {t.status === 'pago' ? '✓ Pago' : '⏳ Pendente'}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
                      {t.date ? new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-main)' }}>{t.description}</div>
                      {t.isFixedExpense && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-glow)', padding: '2px 8px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          <RefreshCw size={8} /> Fixo · {t.recurringType || 'mensal'}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-muted">{t.category}</span>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: t.type === 'income' ? 'var(--success)' : 'var(--danger)' }}>
                        {t.type === 'income' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {t.type === 'income' ? 'Receita' : 'Despesa'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 900, color: t.type === 'income' ? 'var(--success)' : 'var(--danger)', fontSize: 15 }}>
                      {t.type === 'income' ? '+' : '−'} {fmt(t.amount)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                        <button className="btn-icon" title="Editar" onClick={() => openEdit(t)}>
                          <Edit2 size={14} />
                        </button>
                        <button className="btn-icon" title="Excluir" onClick={() => setConfirmDeleteId(t.id)} style={{ color: 'var(--danger)' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
                      <FileText size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
                      <p style={{ margin: 0, fontWeight: 600 }}>Nenhum lançamento encontrado</p>
                      <p style={{ margin: '6px 0 0', fontSize: 13 }}>Ajuste os filtros ou adicione um novo lançamento.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ─── DRE ──────────────────────────────────────────────── */}
      {tab === 'dre' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24 }}>
          {/* Infraestrutura */}
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 900, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-main)' }}>
              <Server size={18} color="var(--primary)" /> Infraestrutura & Sistemas
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {transactions.filter(t => t.category === 'Software / Sistemas' || t.category === 'Infraestrutura').map(t => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-main)' }}>{t.description}</span>
                    {t.isFixedExpense && <span className="badge" style={{ background: 'var(--primary-glow)', color: 'var(--primary)', fontSize: 10 }}>Fixo</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontWeight: 900, color: 'var(--danger)' }}>−{fmt(t.amount)}</span>
                    <button className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => setConfirmDeleteId(t.id)}><Trash2 size={13} /></button>
                  </div>
                </div>
              ))}
              {transactions.filter(t => t.category === 'Software / Sistemas' || t.category === 'Infraestrutura').length === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 20 }}>Nenhuma despesa de infraestrutura</p>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 14, borderTop: '2px solid var(--border)', marginTop: 4 }}>
                <span style={{ fontWeight: 800, fontSize: 12, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Total</span>
                <span style={{ fontWeight: 900, color: 'var(--danger)', fontSize: 16 }}>{fmt(despesasInfra)}</span>
              </div>
            </div>
          </div>

          {/* Folha de Pagamento */}
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 900, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-main)' }}>
              <Users size={18} color="var(--primary)" /> Folha de Pagamento & Pró-Labore
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {transactions.filter(t => t.category === 'Folha de Pagamento').map(t => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-main)' }}>{t.description}</span>
                    {t.employeeId && (
                      <span className="badge" style={{ marginLeft: 8, background: 'rgba(99,102,241,0.1)', color: '#6366f1', fontSize: 10 }}>
                        {team.find(tm => tm.id === t.employeeId)?.name || 'Colaborador'}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontWeight: 900, color: 'var(--danger)' }}>−{fmt(t.amount)}</span>
                    <button className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => setConfirmDeleteId(t.id)}><Trash2 size={13} /></button>
                  </div>
                </div>
              ))}
              {transactions.filter(t => t.category === 'Folha de Pagamento').length === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 20 }}>Nenhuma despesa de pessoal</p>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 14, borderTop: '2px solid var(--border)', marginTop: 4 }}>
                <span style={{ fontWeight: 800, fontSize: 12, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Total</span>
                <span style={{ fontWeight: 900, color: 'var(--danger)', fontSize: 16 }}>{fmt(despesasFolha)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── PROJEÇÃO ─────────────────────────────────────────── */}
      {tab === 'projecao' && (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <TrendingUp size={48} color="var(--primary)" style={{ marginBottom: 20, opacity: 0.6 }} />
          <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 8, color: 'var(--text-main)' }}>Projeção de Caixa — 12 Meses</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 40, maxWidth: 500, margin: '0 auto 40px' }}>
            Estimativa baseada no MRR recorrente versus custo operacional fixo projetado para o ano.
          </p>
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { label: 'Receita Anual Projetada', value: fmt(mrr * 12), color: 'var(--success)', sub: 'MRR × 12 meses' },
              { label: 'Custo Fixo Anual', value: fmt(custosFixosMensais * 12), color: 'var(--danger)', sub: 'Burn rate × 12 meses' },
              {
                label: 'Lucro Líquido Anual',
                value: fmt((mrr * 12) - (custosFixosMensais * 12)),
                color: (mrr * 12) >= (custosFixosMensais * 12) ? 'var(--primary)' : 'var(--danger)',
                sub: 'Receita − Custo Fixo',
                highlight: true
              },
            ].map(k => (
              <div key={k.label} style={{
                padding: '32px 40px', borderRadius: 20, minWidth: 260,
                background: 'var(--bg-subtle)',
                border: k.highlight ? `2px solid ${k.color}` : '1px solid var(--border)',
                boxShadow: k.highlight ? `0 8px 24px ${k.color}20` : 'none',
              }}>
                <p style={{ fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4, fontSize: 13 }}>{k.label}</p>
                <h1 style={{ fontSize: 32, fontWeight: 900, color: k.color, margin: '8px 0' }}>{k.value}</h1>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>{k.sub}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── MODAL FORMULÁRIO ──────────────────────────────────── */}
      {showForm && (
        <div className="modal-overlay" onClick={() => !saving && setShowForm(false)}>
          <div
            className="card animate-scale-in"
            style={{ width: '100%', maxWidth: 560, padding: 0, overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '24px 28px', borderBottom: '1px solid var(--border)',
              background: form.type === 'income' ? 'var(--success-glow)' : 'var(--danger-glow)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 14,
                  background: form.type === 'income' ? 'var(--success)' : 'var(--danger)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {form.type === 'income' ? <ArrowUpRight size={22} color="#fff" /> : <ArrowDownRight size={22} color="#fff" />}
                </div>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: 'var(--text-main)' }}>
                    {editingId ? 'Editar Lançamento' : form.type === 'income' ? 'Nova Receita' : 'Nova Despesa'}
                  </h2>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                    Preencha todos os campos obrigatórios
                  </p>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setShowForm(false)} disabled={saving}>
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {error && (
                <div style={{ padding: '12px 16px', background: 'var(--danger-glow)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
                  <AlertTriangle size={16} color="var(--danger)" />
                  <span style={{ fontSize: 13, color: 'var(--danger)', fontWeight: 600 }}>{error}</span>
                </div>
              )}

              {/* Natureza */}
              <div>
                <label className="form-label">Natureza do Lançamento *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {(['income', 'expense'] as const).map(tp => (
                    <button
                      key={tp}
                      type="button"
                      onClick={() => setForm({ ...form, type: tp, category: tp === 'income' ? 'Serviços' : 'Software / Sistemas' })}
                      style={{
                        padding: '12px', borderRadius: 10, cursor: 'pointer', fontWeight: 800, fontSize: 14,
                        border: `2px solid ${form.type === tp ? (tp === 'income' ? 'var(--success)' : 'var(--danger)') : 'var(--border)'}`,
                        background: form.type === tp ? (tp === 'income' ? 'var(--success-glow)' : 'var(--danger-glow)') : 'var(--bg-subtle)',
                        color: form.type === tp ? (tp === 'income' ? 'var(--success)' : 'var(--danger)') : 'var(--text-muted)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s'
                      }}
                    >
                      {tp === 'income' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                      {tp === 'income' ? 'Receita' : 'Despesa'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categoria */}
              <div>
                <label className="form-label">Categoria *</label>
                <div style={{ position: 'relative' }}>
                  <Tag size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <select className="input" style={{ width: '100%', paddingLeft: 36 }} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="form-label">Descrição *</label>
                <input
                  className="input"
                  style={{ width: '100%' }}
                  placeholder={form.type === 'income' ? 'Ex: Fatura cliente Baragão — Abril' : 'Ex: Servidor Railway Pro'}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  autoFocus
                />
              </div>

              {/* Valor + Data */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label">Valor (R$) *</label>
                  <div style={{ position: 'relative' }}>
                    <DollarSign size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    <input
                      className="input"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0,00"
                      value={form.amount}
                      onChange={e => setForm({ ...form, amount: e.target.value })}
                      style={{ width: '100%', paddingLeft: 36 }}
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label">Data de Vencimento *</label>
                  <div style={{ position: 'relative' }}>
                    <Calendar size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    <input
                      className="input"
                      type="date"
                      value={form.date}
                      onChange={e => setForm({ ...form, date: e.target.value })}
                      style={{ width: '100%', paddingLeft: 36 }}
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="form-label">Status</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {(['pago', 'pendente'] as const).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm({ ...form, status: s })}
                      style={{
                        padding: '11px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13,
                        border: `2px solid ${form.status === s ? (s === 'pago' ? 'var(--success)' : 'var(--warning)') : 'var(--border)'}`,
                        background: form.status === s ? (s === 'pago' ? 'var(--success-glow)' : 'rgba(234,179,8,0.1)') : 'var(--bg-subtle)',
                        color: form.status === s ? (s === 'pago' ? 'var(--success)' : 'var(--warning)') : 'var(--text-muted)',
                        transition: 'all 0.2s'
                      }}
                    >
                      {s === 'pago' ? '✓ Pago / Recebido' : '⏳ Pendente'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custo Fixo (apenas despesas) */}
              {isFormTypeExpense && (
                <div style={{ padding: 16, background: 'var(--bg-subtle)', borderRadius: 12, border: '1px dashed var(--border)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontWeight: 700, color: 'var(--text-main)' }}>
                    <input
                      type="checkbox"
                      checked={form.isFixedExpense}
                      onChange={e => setForm({ ...form, isFixedExpense: e.target.checked })}
                      style={{ width: 16, height: 16, accentColor: 'var(--primary)' }}
                    />
                    <RefreshCw size={14} color="var(--primary)" />
                    Custo Fixo Recorrente
                  </label>
                  {form.isFixedExpense && (
                    <div style={{ marginTop: 12 }}>
                      <label className="form-label">Periodicidade</label>
                      <select className="input" style={{ width: '100%' }} value={form.recurringType} onChange={e => setForm({ ...form, recurringType: e.target.value })}>
                        <option value="mensal">Mensal</option>
                        <option value="semestral">Semestral</option>
                        <option value="anual">Anual</option>
                      </select>
                    </div>
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

              <button
                className="btn btn-primary"
                style={{ width: '100%', height: 50, fontSize: 15, marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
                onClick={handleSave}
                disabled={saving || !form.description || !form.amount || !form.date}
              >
                {saving ? (
                  <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Salvando...</>
                ) : (
                  <><CheckCircle size={18} /> {editingId ? 'Salvar Alterações' : 'Registrar Lançamento'}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CONFIRM DELETE MODAL ──────────────────────────────── */}
      {confirmDeleteId && (
        <div className="modal-overlay" onClick={() => setConfirmDeleteId(null)}>
          <div className="card animate-scale-in" style={{ maxWidth: 420, padding: 32, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--danger-glow)', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(239,68,68,0.3)' }}>
              <AlertTriangle size={28} color="var(--danger)" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 8, color: 'var(--text-main)' }}>Mover para Lixeira?</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28, lineHeight: 1.6 }}>
              Este lançamento será movido para a lixeira e poderá ser restaurado quando necessário.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setConfirmDeleteId(null)}>Cancelar</button>
              <button className="btn btn-danger" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} onClick={doDelete}>
                <Trash2 size={15} /> Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
