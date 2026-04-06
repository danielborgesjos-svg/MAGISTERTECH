import { useState } from 'react';
import { Plus, Trash2, CheckCircle, X, TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import type { Transaction } from '../contexts/DataContext';

const fmt = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

const CATEGORIES = ['Serviços', 'Software', 'Infra', 'Pessoal', 'Marketing', 'Contratos', 'Impostos', 'Outro'];

export default function Financeiro() {
  const { transactions, addTransaction, updateTransactionStatus, deleteTransaction, getMonthRevenue, getMonthExpense, getBalance, getPendingReceivables } = useData();
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

  const filtered = transactions.filter(t => filterType === 'all' || t.type === filterType).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const revenue = getMonthRevenue();
  const expense = getMonthExpense();
  const balance = getBalance();
  const pending = getPendingReceivables();

  return (
    <div className="animate-in">
      <div className="page-header" style={{ marginBottom: 32 }}>
        <div>
           <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 100, fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Activity size={12} color="var(--primary)" /> Controladoria · Fluxo de Caixa
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-main)', margin: 0, lineHeight: 1.1 }}>
            Gestão Financeira
          </h1>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Novo Lançamento</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 32 }}>
        <div className="card" style={{ padding: 24, borderBottom: '3px solid var(--success)' }}>
          <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Receita Confirmada</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 10 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: 'var(--success)' }}>{fmt(revenue)}</h2>
            <TrendingUp size={20} color="var(--success)" opacity={0.5} />
          </div>
        </div>
        <div className="card" style={{ padding: 24, borderBottom: '3px solid var(--danger)' }}>
          <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Despesas Pagas</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 10 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: 'var(--danger)' }}>{fmt(expense)}</h2>
            <TrendingDown size={20} color="var(--danger)" opacity={0.5} />
          </div>
        </div>
        <div className="card" style={{ padding: 24, borderBottom: `3px solid ${balance >= 0 ? 'var(--primary)' : 'var(--warning)'}` }}>
          <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Saldo Operacional</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 10 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: balance >= 0 ? 'var(--primary)' : 'var(--warning)' }}>{fmt(balance)}</h2>
            <Activity size={20} color={balance >= 0 ? 'var(--primary)' : 'var(--warning)'} opacity={0.5} />
          </div>
        </div>
        <div className="card" style={{ padding: 24, borderBottom: '3px solid var(--purple)' }}>
          <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Previsto / Pendente</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 10 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: 'var(--purple)' }}>{fmt(pending)}</h2>
            <DollarSign size={20} color="var(--purple)" opacity={0.5} />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div className="tab-list" style={{ width: 'auto' }}>
          <button className={`tab-btn ${tab === 'lancamentos' ? 'active' : ''}`} onClick={() => setTab('lancamentos')}>Lançamentos</button>
          <button className={`tab-btn ${tab === 'previsao' ? 'active' : ''}`} onClick={() => setTab('previsao')}>Fluxo Previsto</button>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {['all', 'income', 'expense'].map((t) => (
            <button key={t} className="btn-icon" onClick={() => setFilterType(t as any)} style={{ width: 'auto', padding: '6px 12px', fontSize: 11, background: filterType === t ? 'var(--bg-subtle)' : 'transparent', border: '1px solid var(--border)', borderRadius: 8, color: filterType === t ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 800 }}>{t.toUpperCase()}</button>
          ))}
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Data</th>
              <th>Descrição</th>
              <th>Categoria</th>
              <th style={{ textAlign: 'right' }}>Valor</th>
              <th style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t.id}>
                <td>
                  <span className={`badge ${t.status === 'pago' ? 'badge-success' : 'badge-warning'}`} style={{ cursor: 'pointer' }} onClick={() => updateTransactionStatus(t.id, t.status === 'pago' ? 'pendente' : 'pago')}>
                    {t.status === 'pago' ? 'PAGO' : 'PENDENTE'}
                  </span>
                </td>
                <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                <td style={{ fontWeight: 700 }}>{t.description}</td>
                <td><span className="badge badge-muted">{t.category}</span></td>
                <td style={{ textAlign: 'right', fontWeight: 900, color: t.type === 'income' ? 'var(--success)' : 'var(--danger)' }}>
                  {t.type === 'income' ? '+' : '-'} {fmt(t.amount)}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn-icon" onClick={() => deleteTransaction(t.id)}><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Nenhum lançamento encontrado.</td></tr>}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="card modal animate-scale-in" style={{ width: '100%', maxWidth: 450, padding: 32 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900 }}>Novo Lançamento</h2>
              <button className="btn-icon" onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="form-label">Tipo</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <button className="btn" style={{ background: form.type === 'income' ? 'var(--success-glow)' : 'transparent', color: form.type === 'income' ? 'var(--success)' : 'var(--text-muted)', border: `1px solid ${form.type === 'income' ? 'var(--success)' : 'var(--border)'}` }} onClick={() => setForm({ ...form, type: 'income' })}>Receita</button>
                  <button className="btn" style={{ background: form.type === 'expense' ? 'var(--danger-glow)' : 'transparent', color: form.type === 'expense' ? 'var(--danger)' : 'var(--text-muted)', border: `1px solid ${form.type === 'expense' ? 'var(--danger)' : 'var(--border)'}` }} onClick={() => setForm({ ...form, type: 'expense' })}>Despesa</button>
                </div>
              </div>
              <div>
                <label className="form-label">Descrição</label>
                <input className="input" placeholder="Ex: Pagamento AWS" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ width: '100%' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="form-label">Valor (R$)</label>
                  <input className="input" type="number" placeholder="0,00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} style={{ width: '100%' }} />
                </div>
                <div>
                  <label className="form-label">Data</label>
                  <input className="input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={{ width: '100%' }} />
                </div>
              </div>
              <div>
                <label className="form-label">Categoria</label>
                <select className="input" style={{ width: '100%' }} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button className="btn btn-primary" style={{ width: '100%', marginTop: 12 }} onClick={handleAdd} disabled={!form.description || !form.amount}><CheckCircle size={16} /> Confirmar Lançamento</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
