import { useState } from 'react';
import { Plus, Trash2, CheckCircle, X, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import type { Transaction } from '../contexts/DataContext';

const fmt = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

const CATEGORIES = ['Serviços', 'Software', 'Infra', 'Pessoal', 'Marketing', 'Contratos', 'Impostos', 'Outro'];

export default function Financeiro() {
  const { transactions, addTransaction, updateTransactionStatus, deleteTransaction } = useData();
  const [tab, setTab] = useState<'lancamentos' | 'previsao'>('lancamentos');
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [form, setForm] = useState({ description: '', amount: '', type: 'income' as 'income' | 'expense', category: 'Serviços', date: new Date().toISOString().split('T')[0], recurrence: 'unico' as Transaction['recurrence'] });

  const handleAdd = () => {
    if (!form.description || !form.amount) return;
    addTransaction({ description: form.description, amount: parseFloat(form.amount), type: form.type, category: form.category, date: form.date, status: 'pendente', recurrence: form.recurrence });
    setForm({ description: '', amount: '', type: 'income', category: 'Serviços', date: new Date().toISOString().split('T')[0], recurrence: 'unico' });
    setShowForm(false);
  };

  const filtered = transactions.filter(t => filterType === 'all' || t.type === filterType);
  const income = transactions.filter(t => t.type === 'income' && t.status === 'pago').reduce((a, t) => a + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense' && t.status === 'pago').reduce((a, t) => a + t.amount, 0);
  const balance = income - expense;
  const pendingIncome = transactions.filter(t => t.type === 'income' && t.status === 'pendente').reduce((a, t) => a + t.amount, 0);
  const pendingExpense = transactions.filter(t => t.type === 'expense' && t.status === 'pendente').reduce((a, t) => a + t.amount, 0);

  // Previsão 30 dias — agrupada por semana
  const forecastData = [
    { label: 'Semana 1', income: 5000, expense: 1200 },
    { label: 'Semana 2', income: 3500, expense: 800 },
    { label: 'Semana 3', income: 6000, expense: 1500 },
    { label: 'Semana 4', income: 2800, expense: 2200 },
  ];
  const maxForecast = Math.max(...forecastData.flatMap(d => [d.income, d.expense]));

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestão Financeira</h1>
          <p className="page-subtitle">Fluxo de caixa, receitas, despesas e previsão 30 dias</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Novo Lançamento</button>
      </div>

      {/* KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        <div className="card" style={{ borderLeft: '4px solid var(--success)', padding: '18px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Receitas (pagas)</p>
            <TrendingUp size={18} style={{ color: 'var(--success)' }} />
          </div>
          <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--success)' }}>{fmt(income)}</p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>+{fmt(pendingIncome)} a receber</p>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--danger)', padding: '18px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Despesas (pagas)</p>
            <TrendingDown size={18} style={{ color: 'var(--danger)' }} />
          </div>
          <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--danger)' }}>{fmt(expense)}</p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{fmt(pendingExpense)} a pagar</p>
        </div>
        <div className="card" style={{ background: balance >= 0 ? 'var(--success-glow)' : 'var(--danger-glow)', borderLeft: `4px solid ${balance >= 0 ? 'var(--success)' : 'var(--danger)'}`, padding: '18px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Saldo Atual</p>
            <DollarSign size={18} style={{ color: balance >= 0 ? 'var(--success)' : 'var(--danger)' }} />
          </div>
          <p style={{ fontSize: 22, fontWeight: 800, color: balance >= 0 ? 'var(--success)' : 'var(--danger)' }}>{fmt(balance)}</p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Resultado do período</p>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--primary)', padding: '18px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Lançamentos</p>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)' }}>{transactions.length} total</span>
          </div>
          <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)' }}>{transactions.filter(t => t.status === 'pendente').length}</p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Pendentes de aprovação</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-list" style={{ marginBottom: 24, width: 'auto', display: 'inline-flex' }}>
        <button className={`tab-btn ${tab === 'lancamentos' ? 'active' : ''}`} style={{ flex: 'unset', padding: '8px 20px' }} onClick={() => setTab('lancamentos')}>Lançamentos</button>
        <button className={`tab-btn ${tab === 'previsao' ? 'active' : ''}`} style={{ flex: 'unset', padding: '8px 20px' }} onClick={() => setTab('previsao')}>Previsão 30 dias</button>
      </div>

      {tab === 'lancamentos' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Filter */}
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8 }}>
            {(['all', 'income', 'expense'] as const).map(v => (
              <button key={v} className={`badge ${filterType === v ? 'badge-primary' : 'badge-muted'}`} style={{ cursor: 'pointer', border: 'none', padding: '5px 14px', fontSize: 12 }} onClick={() => setFilterType(v)}>
                {v === 'all' ? 'Todos' : v === 'income' ? 'Entradas' : 'Saídas'}
              </button>
            ))}
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Categoria</th>
                  <th>Data</th>
                  <th>Recorrência</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={7}><div className="empty-state"><DollarSign size={36} /><p>Nenhum lançamento</p><button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}><Plus size={14} /> Novo Lançamento</button></div></td></tr>
                )}
                {filtered.map(t => (
                  <tr key={t.id}>
                    <td>
                      <p style={{ fontWeight: 700, fontSize: 13 }}>{t.description}</p>
                    </td>
                    <td><span className="badge badge-muted">{t.category}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                    <td><span className="badge badge-muted" style={{ fontSize: 10 }}>{t.recurrence || 'único'}</span></td>
                    <td style={{ fontWeight: 800, fontSize: 15, color: t.type === 'income' ? 'var(--success)' : 'var(--danger)' }}>
                      {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                    </td>
                    <td>
                      <button onClick={() => updateTransactionStatus(t.id, t.status === 'pago' ? 'pendente' : 'pago')}
                        className={`badge ${t.status === 'pago' ? 'badge-success' : t.status === 'atrasado' ? 'badge-danger' : 'badge-warning'}`}
                        style={{ cursor: 'pointer', border: 'none' }}>
                        {t.status === 'pago' ? '✓ Pago' : t.status === 'atrasado' ? '⚠ Atrasado' : '○ Pendente'}
                      </button>
                    </td>
                    <td>
                      <button className="btn-icon" onClick={() => deleteTransaction(t.id)} style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'previsao' && (
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 24 }}>Previsão de Fluxo de Caixa — Próximos 30 dias</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {forecastData.map((week, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{week.label}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    <span style={{ color: 'var(--success)', fontWeight: 700 }}>{fmt(week.income)}</span> entrada · <span style={{ color: 'var(--danger)', fontWeight: 700 }}>{fmt(week.expense)}</span> saída
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 4, height: 28 }}>
                  <div style={{ width: `${(week.income / maxForecast) * 100}%`, background: 'var(--success)', borderRadius: 4, transition: 'width 0.8s ease', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 6 }}>
                    {week.income / maxForecast > 0.15 && <span style={{ fontSize: 10, color: 'white', fontWeight: 700 }}>{fmt(week.income)}</span>}
                  </div>
                  <div style={{ width: `${(week.expense / maxForecast) * 100}%`, background: 'var(--danger)', borderRadius: 4, transition: 'width 0.8s ease', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 6 }}>
                    {week.expense / maxForecast > 0.15 && <span style={{ fontSize: 10, color: 'white', fontWeight: 700 }}>{fmt(week.expense)}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 20, marginTop: 24, padding: '16px 20px', background: 'var(--bg-subtle)', borderRadius: 10 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Total Previsto Entrar</p>
              <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--success)' }}>{fmt(forecastData.reduce((a, d) => a + d.income, 0))}</p>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Total Previsto Sair</p>
              <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--danger)' }}>{fmt(forecastData.reduce((a, d) => a + d.expense, 0))}</p>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Saldo Projetado</p>
              <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary)' }}>{fmt(forecastData.reduce((a, d) => a + d.income - d.expense, 0))}</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── ADD FORM MODAL ───────────────────────────────────── */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Novo Lançamento</h2>
              <button className="btn-icon" onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Descrição *</label>
                  <input className="input" placeholder="Ex: Pagamento Projeto Eletroc" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Valor (R$) *</label>
                  <input className="input" type="number" placeholder="0.00" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Tipo</label>
                  <div className="tab-list">
                    <button className={`tab-btn ${form.type === 'income' ? 'active' : ''}`} onClick={() => setForm(p => ({ ...p, type: 'income' }))}>Entrada (+)</button>
                    <button className={`tab-btn ${form.type === 'expense' ? 'active' : ''}`} onClick={() => setForm(p => ({ ...p, type: 'expense' }))}>Saída (-)</button>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Categoria</label>
                  <select className="input" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Data</label>
                  <input className="input" type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Recorrência</label>
                  <select className="input" value={form.recurrence} onChange={e => setForm(p => ({ ...p, recurrence: e.target.value as Transaction['recurrence'] }))}>
                    <option value="unico">Único</option>
                    <option value="mensal">Mensal</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleAdd} disabled={!form.description || !form.amount}><CheckCircle size={14} /> Lançar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
