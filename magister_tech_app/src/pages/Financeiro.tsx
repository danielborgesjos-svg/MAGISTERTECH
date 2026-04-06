import { useState } from 'react';
import { Plus, Trash2, CheckCircle, X, TrendingUp, Activity, PieChart, Users, Server, Briefcase } from 'lucide-react';
import { useData } from '../contexts/DataContext';

const fmt = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

const CATEGORIES = ['Serviços', 'Software / Sistemas', 'Infraestrutura', 'Folha de Pagamento', 'Marketing', 'Contratos', 'Impostos', 'Outros'];

export default function Financeiro() {
  const { transactions, team, addTransaction, updateTransactionStatus, deleteTransaction, getMonthRevenue, getBalance } = useData();
  const [tab, setTab] = useState<'lancamentos' | 'dre' | 'projecao'>('dre');
  const [showForm, setShowForm] = useState(false);
  
  const initialForm = { description: '', amount: '', type: 'expense' as 'income' | 'expense', category: 'Software / Sistemas', date: new Date().toISOString().split('T')[0], isFixedExpense: false, recurringType: 'mensal', employeeId: '' };
  const [form, setForm] = useState(initialForm);

  const handleAdd = () => {
    if (!form.description || !form.amount) return;
    addTransaction({ 
      description: form.description, amount: parseFloat(form.amount), type: form.type, 
      category: form.category, date: form.date, status: 'pendente', recurrence: form.isFixedExpense ? 'mensal' : 'unico',
      isFixedExpense: form.isFixedExpense, recurringType: form.isFixedExpense ? form.recurringType : undefined, employeeId: form.employeeId || undefined
    });
    setForm(initialForm);
    setShowForm(false);
  };

  const filtered = transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const revenue = getMonthRevenue();
  const balance = getBalance();

  // DRE Cálculos
  const despesasFolha = transactions.filter(t => t.type === 'expense' && t.category === 'Folha de Pagamento').reduce((a,c) => a + c.amount, 0);
  const despesasInfra = transactions.filter(t => t.type === 'expense' && (t.category === 'Infraestrutura' || t.category === 'Software / Sistemas')).reduce((a,c) => a + c.amount, 0);

  // Projeção Anual
  const custosFixosMensais = transactions.filter(t => t.type === 'expense' && t.isFixedExpense).reduce((a,c) => a + c.amount, 0);
  const projecaoReceitaAnual = revenue * 12; // Supondo MRR estabilizado
  const projecaoDespesaAnual = custosFixosMensais * 12;
  const projecaoLucroAnual = projecaoReceitaAnual - projecaoDespesaAnual;

  return (
    <div className="animate-in">
      <div className="page-header" style={{ marginBottom: 32 }}>
        <div>
           <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 100, fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Activity size={12} color="var(--primary)" /> Controladoria Empresarial
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-main)', margin: 0, lineHeight: 1.1 }}>
            Painel Financeiro & DRE
          </h1>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Novo Lançamento</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 32 }}>
        
        {/* MRR Clientes */}
        <div className="card" style={{ padding: 24, borderTop: '4px solid var(--success)', background: 'var(--success-glow)' }}>
          <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--success)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}><Briefcase size={14}/> Receita Confirmada (MRR)</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 16 }}>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: 'var(--success)' }}>{fmt(revenue)}</h2>
          </div>
        </div>
        
        <div className="card" style={{ padding: 24, borderTop: '4px solid var(--primary)', background: 'var(--primary-glow)' }}>
          <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}><Server size={14}/> Custos Fixos (Infra / Folha)</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 16 }}>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: 'var(--primary)' }}>{fmt(custosFixosMensais)} <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>/mês</span></h2>
          </div>
        </div>

        <div className="card" style={{ padding: 24, borderTop: `4px solid ${balance >= 0 ? 'var(--info)' : 'var(--danger)'}` }}>
          <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}><Activity size={14}/> Lucro Bruto Operacional</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 16 }}>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: balance >= 0 ? 'var(--info)' : 'var(--danger)' }}>{fmt(balance)}</h2>
          </div>
        </div>

      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div className="tab-list" style={{ width: 'auto' }}>
          <button className={`tab-btn ${tab === 'dre' ? 'active' : ''}`} onClick={() => setTab('dre')}><PieChart size={14} style={{ display: 'inline', marginBottom: -2 }}/> DRE Analítico</button>
          <button className={`tab-btn ${tab === 'lancamentos' ? 'active' : ''}`} onClick={() => setTab('lancamentos')}>Lançamentos Mensais</button>
          <button className={`tab-btn ${tab === 'projecao' ? 'active' : ''}`} onClick={() => setTab('projecao')}><TrendingUp size={14} style={{ display: 'inline', marginBottom: -2 }}/> Projeção Anual & Semestral</button>
        </div>
      </div>

      {/* VISOES */}
      {tab === 'dre' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
           <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}><Server size={18} color="var(--primary)"/> Sistemas, Softwares e Infraestrutura</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {transactions.filter(t => t.category === 'Software / Sistemas' || t.category === 'Infraestrutura').map(t => (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{t.description} {t.isFixedExpense && <span className="badge" style={{ background: 'var(--bg-subtle)' }}>Fixo</span>}</span>
                    <span style={{ fontWeight: 900, color: 'var(--danger)' }}>- {fmt(t.amount)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, marginTop: 12, borderTop: '2px solid var(--border)' }}>
                   <span style={{ fontWeight: 800, textTransform: 'uppercase' }}>Total Infraestrutura</span>
                   <span style={{ fontWeight: 900, color: 'var(--danger)' }}>{fmt(despesasInfra)}</span>
                </div>
              </div>
           </div>

           <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}><Users size={18} color="var(--info)"/> Folha de Pagamentos e Pró-Labore</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {transactions.filter(t => t.category === 'Folha de Pagamento').map(t => (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{t.description}</span>
                      {t.employeeId && <span className="badge" style={{ marginLeft: 8, background: 'var(--info-glow)', color: 'var(--info)' }}>{team.find(tm=>tm.id === t.employeeId)?.name || 'Colaborador'}</span>}
                    </div>
                    <span style={{ fontWeight: 900, color: 'var(--danger)' }}>- {fmt(t.amount)}</span>
                  </div>
                ))}
                 <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, marginTop: 12, borderTop: '2px solid var(--border)' }}>
                   <span style={{ fontWeight: 800, textTransform: 'uppercase' }}>Total Pessoal</span>
                   <span style={{ fontWeight: 900, color: 'var(--danger)' }}>{fmt(despesasFolha)}</span>
                </div>
              </div>
           </div>
        </div>
      )}

      {tab === 'projecao' && (
         <div className="card" style={{ padding: 40, textAlign: 'center', background: 'var(--bg-subtle)' }}>
             <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>Projeção de Caixa (12 Meses)</h2>
             <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>Estimativa baseada no MRR recorrente e Despesas Fixas categorizadas.</p>

             <div style={{ display: 'flex', gap: 24, justifyContent: 'center' }}>
                <div style={{ background: 'var(--bg-card)', padding: 24, borderRadius: 16, minWidth: 250, border: '1px solid var(--border)' }}>
                   <p style={{ fontWeight: 800, color: 'var(--success)' }}>Receita Anual Projetada</p>
                   <h1 style={{ fontSize: 32, fontWeight: 900, margin: '12px 0' }}>{fmt(projecaoReceitaAnual)}</h1>
                </div>
                <div style={{ background: 'var(--bg-card)', padding: 24, borderRadius: 16, minWidth: 250, border: '1px solid var(--border)' }}>
                   <p style={{ fontWeight: 800, color: 'var(--danger)' }}>Custo Fixo Anual Projetado</p>
                   <h1 style={{ fontSize: 32, fontWeight: 900, margin: '12px 0' }}>{fmt(projecaoDespesaAnual)}</h1>
                </div>
                <div style={{ background: 'var(--bg-card)', padding: 24, borderRadius: 16, minWidth: 250, border: '2px solid var(--primary)' }}>
                   <p style={{ fontWeight: 800, color: 'var(--primary)' }}>Lucro Líquido Retido ESPERADO</p>
                   <h1 style={{ fontSize: 32, fontWeight: 900, margin: '12px 0' }}>{fmt(projecaoLucroAnual)}</h1>
                </div>
             </div>
         </div>
      )}

      {tab === 'lancamentos' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Data</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th style={{ textAlign: 'center' }}>Vínculo Fixo</th>
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
                  <td style={{ textAlign: 'center' }}>
                     {t.isFixedExpense ? <span className="badge" style={{ background: 'var(--primary-glow)', color: 'var(--primary)' }}>Recorrente {t.recurringType}</span> : 'N/A'}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 900, color: t.type === 'income' ? 'var(--success)' : 'var(--danger)' }}>
                    {t.type === 'income' ? '+' : '-'} {fmt(t.amount)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn-icon" onClick={() => deleteTransaction(t.id)}><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Nenhum lançamento encontrado.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* FORMULÁRIO DE LANÇAMENTO */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="card modal animate-scale-in" style={{ width: '100%', maxWidth: 500, padding: 32 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900 }}>Registo Contábil</h2>
              <button className="btn-icon" onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="form-label">Natureza</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <button className="btn" style={{ background: form.type === 'income' ? 'var(--success-glow)' : 'transparent', color: form.type === 'income' ? 'var(--success)' : 'var(--text-muted)', border: `1px solid ${form.type === 'income' ? 'var(--success)' : 'var(--border)'}` }} onClick={() => setForm({ ...form, type: 'income' })}>Ingresso (Receita)</button>
                  <button className="btn" style={{ background: form.type === 'expense' ? 'var(--danger-glow)' : 'transparent', color: form.type === 'expense' ? 'var(--danger)' : 'var(--text-muted)', border: `1px solid ${form.type === 'expense' ? 'var(--danger)' : 'var(--border)'}` }} onClick={() => setForm({ ...form, type: 'expense' })}>Saída (Despesa)</button>
                </div>
              </div>

              <div>
                <label className="form-label">Categoria Estratégica</label>
                <select className="input" style={{ width: '100%' }} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="form-label">Descrição / Motivo</label>
                <input className="input" placeholder="Ex: Servidor AWS, Heroku" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ width: '100%' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="form-label">Valor (R$)</label>
                  <input className="input" type="number" placeholder="0,00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} style={{ width: '100%' }} />
                </div>
                <div>
                  <label className="form-label">Data Limite</label>
                  <input className="input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={{ width: '100%' }} />
                </div>
              </div>

              {form.type === 'expense' && (
                <div style={{ padding: 16, background: 'var(--bg-subtle)', borderRadius: 12, border: '1px dashed var(--border)' }}>
                   <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontWeight: 800 }}>
                      <input type="checkbox" checked={form.isFixedExpense} onChange={e => setForm({ ...form, isFixedExpense: e.target.checked })} style={{ width: 18, height: 18 }} />
                      Isto é um Custo Fixo de Operação? (Recorrente)
                   </label>
                   
                   {form.isFixedExpense && (
                     <div style={{ marginTop: 12 }}>
                        <select className="input" style={{ width: '100%' }} value={form.recurringType} onChange={e => setForm({ ...form, recurringType: e.target.value })}>
                           <option value="mensal">Recorrência Mensal</option>
                           <option value="semestral">Recorrência Semestral</option>
                           <option value="anual">Recorrência Anual</option>
                        </select>
                     </div>
                   )}

                   {form.category === 'Folha de Pagamento' && (
                      <div style={{ marginTop: 12 }}>
                        <label className="form-label">Vincular a Qual Colaborador?</label>
                        <select className="input" style={{ width: '100%' }} value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })}>
                           <option value="">Nenhum (Geral)</option>
                           {team.map(t => <option key={t.id} value={t.id}>{t.name} ({t.role})</option>)}
                        </select>
                      </div>
                   )}
                </div>
              )}

              <button className="btn btn-primary" style={{ width: '100%', marginTop: 12 }} onClick={handleAdd} disabled={!form.description || !form.amount}><CheckCircle size={16} /> Confirmar Lançamento Contábil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
