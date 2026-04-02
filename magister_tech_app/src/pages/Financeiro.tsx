import { useState } from 'react';
import { Plus, Trash2, CheckCircle, X, TrendingUp, TrendingDown, DollarSign, Activity, FileText, Calendar } from 'lucide-react';
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
    <div className="animate-in" style={{ paddingBottom: 40 }}>
      {/* ─── HEADER COCKPIT ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 100, fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Activity size={12} color="var(--primary)" /> Fluxo de Caixa · Financeiro
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-main)', margin: 0, lineHeight: 1.1 }}>
            Gestão Financeira
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8 }}>
             Acompanhamento de receitas, despesas e projeção dos próximos 30 dias.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
           <Plus size={16} /> Novo Lançamento
        </button>
      </div>

      {/* ─── KPI STRIP ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        <div className="card" style={{ borderTop: '3px solid var(--success)', padding: '24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, background: 'var(--success-glow)', filter: 'blur(30px)', borderRadius: '50%', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, position: 'relative', zIndex: 1 }}>
            <p style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-sec)', letterSpacing: '0.05em' }}>Receitas (Pagas)</p>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--success-glow)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <TrendingUp size={16} />
            </div>
          </div>
          <p style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em', position: 'relative', zIndex: 1, marginBottom: 8 }}>{fmt(income)}</p>
          <p style={{ fontSize: 12, color: 'var(--success)', fontWeight: 700, position: 'relative', zIndex: 1 }}>+{fmt(pendingIncome)} a receber</p>
        </div>

        <div className="card" style={{ borderTop: '3px solid var(--danger)', padding: '24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, background: 'var(--danger-glow)', filter: 'blur(30px)', borderRadius: '50%', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, position: 'relative', zIndex: 1 }}>
            <p style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-sec)', letterSpacing: '0.05em' }}>Despesas (Pagas)</p>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--danger-glow)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <TrendingDown size={16} />
            </div>
          </div>
          <p style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em', position: 'relative', zIndex: 1, marginBottom: 8 }}>{fmt(expense)}</p>
          <p style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 700, position: 'relative', zIndex: 1, display: 'flex', gap: 4 }}>{fmt(pendingExpense)} a pagar</p>
        </div>

        <div className="card" style={{ background: balance >= 0 ? 'var(--success-glow)' : 'var(--danger-glow)', borderTop: `3px solid ${balance >= 0 ? 'var(--success)' : 'var(--danger)'}`, padding: '24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, position: 'relative', zIndex: 1 }}>
            <p style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: balance >= 0 ? 'var(--success)' : 'var(--danger)', letterSpacing: '0.05em' }}>Saldo Líquido</p>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.2)', color: balance >= 0 ? 'var(--success)' : 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <DollarSign size={16} />
            </div>
          </div>
          <p style={{ fontSize: 32, fontWeight: 900, color: balance >= 0 ? 'var(--success)' : 'var(--danger)', letterSpacing: '-0.02em', position: 'relative', zIndex: 1, marginBottom: 8 }}>{fmt(balance)}</p>
          <p style={{ fontSize: 12, color: balance >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 700, opacity: 0.8, position: 'relative', zIndex: 1 }}>Balanço do Período</p>
        </div>

        <div className="card" style={{ borderTop: '3px solid var(--primary)', padding: '24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, background: 'var(--primary-glow)', filter: 'blur(30px)', borderRadius: '50%', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, position: 'relative', zIndex: 1 }}>
            <p style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-sec)', letterSpacing: '0.05em' }}>Lançamentos</p>
            <span className="badge" style={{ fontSize: 11, fontWeight: 800 }}>TOTAL: {transactions.length}</span>
          </div>
          <p style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em', position: 'relative', zIndex: 1, marginBottom: 8 }}>{transactions.filter(t => t.status === 'pendente').length}</p>
          <p style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 700, position: 'relative', zIndex: 1 }}>Registros pendentes</p>
        </div>
      </div>

      {/* ─── TABS E FILTROS ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
         <div className="tab-list">
           <button className={`tab-btn ${tab === 'lancamentos' ? 'active' : ''}`} onClick={() => setTab('lancamentos')}><FileText size={14} style={{ display: 'inline', marginBottom: -2, marginRight: 4 }}/> Relatório de Caixa</button>
           <button className={`tab-btn ${tab === 'previsao' ? 'active' : ''}`} onClick={() => setTab('previsao')}><TrendingUp size={14} style={{ display: 'inline', marginBottom: -2, marginRight: 4 }}/> Previsão (Forecast 30d)</button>
         </div>
         {tab === 'lancamentos' && (
            <div style={{ display: 'flex', gap: 8, background: 'var(--bg-subtle)', padding: 4, borderRadius: 12, border: '1px solid var(--border)' }}>
               {([['all', 'Todos'], ['income', 'Entradas'], ['expense', 'Saídas']] as const).map(v => (
                 <button key={v[0]} className={`btn btn-sm ${filterType === v[0] ? (v[0] === 'income' ? 'btn-primary' : v[0] === 'expense' ? 'btn-secondary' : 'btn-primary') : 'btn-ghost'}`} style={{ 
                     background: filterType === v[0] ? (v[0] === 'income' ? 'var(--success)' : v[0] === 'expense' ? 'var(--danger)' : 'var(--primary)') : 'transparent',
                     borderColor: 'transparent',
                     color: filterType !== v[0] ? 'var(--text-muted)' : '#fff'
                  }} onClick={() => setFilterType(v[0])}>
                   {v[1]}
                 </button>
               ))}
            </div>
         )}
      </div>

      {/* ─── LISTAGEM DE LANÇAMENTOS ────────────────────────────────────────── */}
      {tab === 'lancamentos' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Descrição da Operação</th>
                  <th>Classificação</th>
                  <th>Data do Registro</th>
                  <th>Recorrência</th>
                  <th style={{ textAlign: 'right' }}>Valor (R$)</th>
                  <th style={{ textAlign: 'center' }}>Situação</th>
                  <th style={{ width: 40, textAlign: 'center' }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={7}><div className="empty-state" style={{ padding: '60px 0' }}><DollarSign size={48} color="var(--text-muted)" style={{ marginBottom: 16 }}/><p>Nenhum lançamento no filtro selecionado.</p></div></td></tr>
                )}
                {filtered.map(t => (
                  <tr key={t.id}>
                    <td>
                      <p style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 8 }}>
                         <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.type === 'income' ? 'var(--success)' : 'var(--danger)' }} />
                         {t.description}
                      </p>
                    </td>
                    <td><span className="badge" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>{t.category}</span></td>
                    <td>
                       <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-sec)', fontWeight: 600 }}>
                          <Calendar size={14}/> {new Date(t.date).toLocaleDateString('pt-BR')}
                       </div>
                    </td>
                    <td><span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t.recurrence || 'Único'}</span></td>
                    <td style={{ textAlign: 'right' }}>
                       <p style={{ fontWeight: 900, fontSize: 16, color: t.type === 'income' ? 'var(--success)' : 'var(--text-main)' }}>
                          {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                       </p>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button onClick={() => updateTransactionStatus(t.id, t.status === 'pago' ? 'pendente' : 'pago')}
                        className="badge"
                        style={{ cursor: 'pointer', background: t.status === 'pago' ? 'var(--success-glow)' : t.status === 'atrasado' ? 'var(--danger-glow)' : 'var(--warning-glow)', color: t.status === 'pago' ? 'var(--success)' : t.status === 'atrasado' ? 'var(--danger)' : 'var(--warning)', border: `1px solid ${t.status === 'pago' ? 'var(--success)' : t.status === 'atrasado' ? 'var(--danger)' : 'var(--warning)'}40`, fontWeight: 800 }}>
                        {t.status === 'pago' ? 'BAIXADO' : t.status === 'atrasado' ? 'EM ATRASO' : 'PENDENTE'}
                      </button>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button className="btn-icon" onClick={() => { if(confirm('Excluir este lançamento financeiro?')) deleteTransaction(t.id); }} style={{ color: 'var(--text-muted)' }}><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── PREVISÃO DE 30 DIAS ───────────────────────────────────────────── */}
      {tab === 'previsao' && (
        <div className="card" style={{ padding: 40 }}>
          <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 32, display: 'flex', alignItems: 'center', gap: 10 }}><TrendingUp size={20} color="var(--primary)"/> Forecast Semanal — (30 Dias)</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {forecastData.map((week, i) => (
              <div key={i} style={{ background: 'var(--bg-subtle)', padding: '20px 24px', borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-main)' }}>{week.label}</span>
                  <div style={{ display: 'flex', gap: 24 }}>
                     <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 600 }}>Entradas: <span style={{ color: 'var(--success)', fontWeight: 800 }}>{fmt(week.income)}</span></span>
                     <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 600 }}>Saídas: <span style={{ color: 'var(--danger)', fontWeight: 800 }}>{fmt(week.expense)}</span></span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: 8, height: 20 }}>
                  <div style={{ width: `${(week.income / maxForecast) * 100}%`, background: 'var(--success)', borderRadius: 100, transition: 'width 0.8s ease', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 10 }}>
                    {week.income / maxForecast > 0.15 && <span style={{ fontSize: 10, color: 'var(--bg-card)', fontWeight: 900 }}>{fmt(week.income)}</span>}
                  </div>
                  <div style={{ width: `${(week.expense / maxForecast) * 100}%`, background: 'var(--danger)', borderRadius: 100, transition: 'width 0.8s ease', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 10 }}>
                    {week.expense / maxForecast > 0.15 && <span style={{ fontSize: 10, color: 'var(--bg-card)', fontWeight: 900 }}>{fmt(week.expense)}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginTop: 40 }}>
            <div style={{ padding: '24px', background: 'var(--success-glow)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 16 }}>
              <p style={{ fontSize: 12, color: 'var(--success)', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>Receita Total (Projetada)</p>
              <p style={{ fontSize: 28, fontWeight: 900, color: 'var(--success)', letterSpacing: '-0.02em' }}>{fmt(forecastData.reduce((a, d) => a + d.income, 0))}</p>
            </div>
            <div style={{ padding: '24px', background: 'var(--danger-glow)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 16 }}>
              <p style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>Saída Total (Projetada)</p>
              <p style={{ fontSize: 28, fontWeight: 900, color: 'var(--danger)', letterSpacing: '-0.02em' }}>{fmt(forecastData.reduce((a, d) => a + d.expense, 0))}</p>
            </div>
            <div style={{ padding: '24px', background: 'var(--primary-glow)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 16 }}>
              <p style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>Saldo Final Previsto</p>
              <p style={{ fontSize: 28, fontWeight: 900, color: 'var(--primary)', letterSpacing: '-0.02em' }}>{fmt(forecastData.reduce((a, d) => a + d.income - d.expense, 0))}</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── ADD FORM MODAL ───────────────────────────────────── */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" style={{ maxWidth: 640, padding: 0 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ padding: '24px 32px', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <DollarSign size={24} color="var(--primary)"/>
                  </div>
                  <div>
                     <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>Inclusão de Movimento</h2>
                     <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Lance receitas, despesas e registre na linha do tempo.</p>
                  </div>
               </div>
               <button className="btn-icon" style={{ background: 'var(--bg-card)' }} onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            
            <div className="modal-body" style={{ padding: 32 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label className="form-label" style={{ fontWeight: 800 }}>Mapeamento da Transação *</label>
                  <input className="input" style={{ fontSize: 16, fontWeight: 700 }} placeholder="Ex: Fee Mensal Consultoria" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                </div>
                
                <div style={{ gridColumn: '1/-1' }}>
                  <label className="form-label" style={{ fontWeight: 800 }}>Natureza (Crédito ou Débito)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                     <button className={`card ${form.type === 'income' ? 'active' : ''}`} style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer', border: form.type === 'income' ? '2px solid var(--success)' : '1px solid var(--border)', background: form.type === 'income' ? 'var(--success-glow)' : 'var(--bg-subtle)' }} onClick={() => setForm({...form, type: 'income'})}>
                        <TrendingUp size={20} color={form.type === 'income' ? 'var(--success)' : 'var(--text-muted)'} />
                        <span style={{ fontSize: 15, fontWeight: 800, color: form.type === 'income' ? 'var(--success)' : 'var(--text-main)' }}>Receita (+)</span>
                     </button>
                     <button className={`card ${form.type === 'expense' ? 'active' : ''}`} style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer', border: form.type === 'expense' ? '2px solid var(--danger)' : '1px solid var(--border)', background: form.type === 'expense' ? 'var(--danger-glow)' : 'var(--bg-subtle)' }} onClick={() => setForm({...form, type: 'expense'})}>
                        <TrendingDown size={20} color={form.type === 'expense' ? 'var(--danger)' : 'var(--text-muted)'} />
                        <span style={{ fontSize: 15, fontWeight: 800, color: form.type === 'expense' ? 'var(--danger)' : 'var(--text-main)' }}>Despesa (-)</span>
                     </button>
                  </div>
                </div>

                <div>
                  <label className="form-label">Valor do Documento (R$) *</label>
                  <input className="input" type="number" style={{ fontSize: 16, fontWeight: 700, color: form.type === 'income' ? 'var(--success)' : 'var(--danger)' }} placeholder="0,00" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Centro de Custo / Categoria</label>
                  <select className="input" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Data de Competência</label>
                  <input className="input" type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Recorrência Fiscal</label>
                  <select className="input" value={form.recurrence} onChange={e => setForm(p => ({ ...p, recurrence: e.target.value as Transaction['recurrence'] }))}>
                    <option value="unico">Pagamento Único</option>
                    <option value="mensal">Faturamento Mensal</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ justifyContent: 'flex-end', padding: '24px 32px', background: 'var(--bg-card)' }}>
              <div style={{ display: 'flex', gap: 12 }}>
                 <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
                 <button className="btn btn-primary" onClick={handleAdd} disabled={!form.description || !form.amount} style={{ padding: '10px 24px' }}>
                    <CheckCircle size={16} /> Emitir Lançamento no DRE
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
