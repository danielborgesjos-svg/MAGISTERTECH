import { useState } from 'react';
import { Trash2, CheckCircle, X, TrendingUp, Activity, PieChart, Users, Server, Briefcase, ArrowUpRight, ArrowDownRight, LayoutDashboard, Calculator } from 'lucide-react';
import { useData } from '../contexts/DataContext';

const fmt = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

const CATEGORIES = ['Serviços', 'Software / Sistemas', 'Infraestrutura', 'Folha de Pagamento', 'Marketing', 'Contratos', 'Impostos', 'Outros'];

export default function Financeiro() {
  const { transactions, contracts, team, addTransaction, updateTransactionStatus, deleteTransaction, getMonthRevenue, getMonthExpense } = useData();
  const [tab, setTab] = useState<'kpis' | 'lancamentos' | 'dre' | 'projecao'>('kpis');
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

  // Realized Cash flow Metrics
  const cashIn = getMonthRevenue();
  const cashOut = getMonthExpense();
  const balanceReal = cashIn - cashOut;

  // KPIs Estratégicos
  const mrr = contracts.filter(c => c.status === 'ativo' && c.recurrence !== 'unico').reduce((acc, c) => acc + c.value, 0);
  const custosFixosMensais = transactions.filter(t => t.type === 'expense' && t.isFixedExpense).reduce((a,c) => a + c.amount, 0);
  
  
  // DRE Cálculos
  const despesasFolha = transactions.filter(t => t.type === 'expense' && t.category === 'Folha de Pagamento').reduce((a,c) => a + c.amount, 0);
  const despesasInfra = transactions.filter(t => t.type === 'expense' && (t.category === 'Infraestrutura' || t.category === 'Software / Sistemas')).reduce((a,c) => a + c.amount, 0);

  // Projeção
  const projecaoReceitaAnual = mrr * 12; 
  const projecaoDespesaAnual = custosFixosMensais * 12;
  const lucroPotencial = mrr - custosFixosMensais;

  return (
    <div className="animate-in" style={{ paddingBottom: 40 }}>
      {/* HEADER */}
      <div className="page-header" style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
           <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 100, fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Activity size={12} color="var(--primary)" /> Controladoria Empresarial
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-main)', margin: 0, lineHeight: 1.1 }}>
            Tesouraria & Caixa
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-outline" style={{ borderColor: 'var(--success)', color: 'var(--success)' }} onClick={() => { setForm({...initialForm, type: 'income', category: 'Serviços'}); setShowForm(true); }}>
            <ArrowUpRight size={16} /> Receitar (Cash-In)
          </button>
          <button className="btn btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={() => { setForm({...initialForm, type: 'expense'}); setShowForm(true); }}>
            <ArrowDownRight size={16} /> Despesa (Cash-Out)
          </button>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div className="tab-list" style={{ width: 'auto' }}>
          <button className={`tab-btn ${tab === 'kpis' ? 'active' : ''}`} onClick={() => setTab('kpis')}><LayoutDashboard size={14} style={{ display: 'inline', marginBottom: -2 }}/> KPIs & Dashboard</button>
          <button className={`tab-btn ${tab === 'lancamentos' ? 'active' : ''}`} onClick={() => setTab('lancamentos')}><Calculator size={14} style={{ display: 'inline', marginBottom: -2 }}/> Lançamentos Gerais</button>
          <button className={`tab-btn ${tab === 'dre' ? 'active' : ''}`} onClick={() => setTab('dre')}><PieChart size={14} style={{ display: 'inline', marginBottom: -2 }}/> DRE Analítico</button>
          <button className={`tab-btn ${tab === 'projecao' ? 'active' : ''}`} onClick={() => setTab('projecao')}><TrendingUp size={14} style={{ display: 'inline', marginBottom: -2 }}/> Projeção & Planejamento</button>
        </div>
      </div>

      {/* ─── VISÃO 1: DASHBOARD DE KPIs ────────────────────────── */}
      {tab === 'kpis' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            {/* KPI: MRR */}
            <div className="card" style={{ padding: 24, borderTop: '3px solid var(--primary)', background: 'var(--bg-card)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: -20, top: -20, width: 100, height: 100, background: 'var(--primary-glow)', filter: 'blur(50px)', borderRadius: '50%', opacity: 0.5 }}></div>
              <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-sec)', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><Briefcase size={14} color="var(--primary)"/> MRR Contratual</p>
              <h2 style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-main)', letterSpacing: -1 }}>{fmt(mrr)}</h2>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>Total de recorrrências ativas</p>
            </div>

            {/* KPI: Cash-In */}
            <div className="card" style={{ padding: 24, borderTop: '3px solid var(--success)', background: 'var(--bg-card)' }}>
              <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--success)', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><ArrowUpRight size={14}/> Entradas Caixa (Mês)</p>
              <h2 style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-main)', letterSpacing: -1 }}>{fmt(cashIn)}</h2>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>Receitas efetivamente liquidadas</p>
            </div>

            {/* KPI: Cash-Out */}
            <div className="card" style={{ padding: 24, borderTop: '3px solid var(--danger)', background: 'var(--bg-card)' }}>
              <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--danger)', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><ArrowDownRight size={14}/> Saídas Caixa (Mês)</p>
              <h2 style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-main)', letterSpacing: -1 }}>{fmt(cashOut)}</h2>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>Despesas Fixas e Variáveis pagas</p>
            </div>

            {/* KPI: Lucro/Saldo */}
            <div className="card" style={{ padding: 24, borderTop: `3px solid ${balanceReal >= 0 ? 'var(--info)' : 'var(--danger)'}`, background: balanceReal >= 0 ? 'var(--info-glow)' : 'var(--danger-glow)' }}>
              <p style={{ fontSize: 12, fontWeight: 800, color: balanceReal >= 0 ? 'var(--info)' : 'var(--danger)', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><Activity size={14}/> Lucro Líquido Caixa</p>
              <h2 style={{ fontSize: 32, fontWeight: 900, color: balanceReal >= 0 ? 'var(--info)' : 'var(--danger)', letterSpacing: -1 }}>{fmt(balanceReal)}</h2>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>Margeado no mês atual</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
             <div className="card" style={{ padding: 24, background: 'var(--bg-subtle)' }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 16 }}>Análise de Sustentabilidade Operacional</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                   <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-sec)' }}>Custo Fixo Mensal (Burn Rate)</span>
                   <span style={{ fontWeight: 900, color: 'var(--danger)' }}>{fmt(custosFixosMensais)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                   <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-sec)' }}>Margem de Segurança (MRR vs Fixo)</span>
                   <span style={{ fontWeight: 900, color: lucroPotencial >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {lucroPotencial >= 0 ? `+ ${fmt(lucroPotencial)} (Saudável)` : `${fmt(lucroPotencial)} (Déficit)`}
                   </span>
                </div>
                <div className="progress-track" style={{ height: 10 }}>
                   {custosFixosMensais > 0 && mrr > 0 && (
                     <div className="progress-fill" style={{ background: 'var(--danger)', width: `${Math.min((custosFixosMensais/mrr)*100, 100)}%` }} />
                   )}
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>Se a barra vermelha atingir 100%, todos os contratos fixos servem apenas para pagar a operação.</p>
             </div>
          </div>
        </>
      )}

      {/* ─── VISÃO 2: DRE ─────────────────────────────────────── */}
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

      {/* ─── VISÃO 3: PROJEÇÃO ────────────────────────────────── */}
      {tab === 'projecao' && (
         <div className="card" style={{ padding: 40, textAlign: 'center', background: 'var(--bg-subtle)' }}>
             <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>Projeção de Caixa (12 Meses)</h2>
             <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>Estimativa baseada no MRR recorrente garantido vs Custo Operacional Fixo projetado do ciclo.</p>

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
                   <p style={{ fontWeight: 800, color: 'var(--primary)' }}>Lucro Líquido Anual Retido</p>
                   <h1 style={{ fontSize: 32, fontWeight: 900, margin: '12px 0' }}>{fmt(projecaoReceitaAnual - projecaoDespesaAnual)}</h1>
                </div>
             </div>
         </div>
      )}

      {/* ─── VISÃO 4: LANÇAMENTOS (RAZÃO) ─────────────────────── */}
      {tab === 'lancamentos' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Data</th>
                <th>Descrição / Título</th>
                <th>Categoria</th>
                <th style={{ textAlign: 'center' }}>Vínculo Fixo</th>
                <th style={{ textAlign: 'right' }}>Valor Liquido</th>
                <th style={{ textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id}>
                  <td>
                    <span className={`badge ${t.status === 'pago' ? 'badge-success' : 'badge-warning'}`} style={{ cursor: 'pointer' }} onClick={() => updateTransactionStatus(t.id, t.status === 'pago' ? 'pendente' : 'pago')} title="Clique para alterar status">
                      {t.status === 'pago' ? 'PAGO' : 'PENDENTE'}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                  <td style={{ fontWeight: 800 }}>{t.description}</td>
                  <td><span className="badge badge-muted">{t.category}</span></td>
                  <td style={{ textAlign: 'center' }}>
                     {t.isFixedExpense ? <span className="badge" style={{ background: 'var(--primary-glow)', color: 'var(--primary)', fontWeight: 700 }}>Recorrente {t.recurringType}</span> : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Variável</span>}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 900, color: t.type === 'income' ? 'var(--success)' : 'var(--danger)', fontSize: 16 }}>
                    {t.type === 'income' ? '+' : '-'} {fmt(t.amount)}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button className="btn-icon" onClick={() => deleteTransaction(t.id)}><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Nenhum lançamento contábil encontrado.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── FORMULÁRIO MODAL DE LANÇAMENTO ──────────────────────── */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="card modal animate-scale-in" style={{ width: '100%', maxWidth: 500, padding: 32 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: 20, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 10 }}>
                {form.type === 'income' ? <><ArrowUpRight color="var(--success)"/> Novo Ingresso (Receita)</> : <><ArrowDownRight color="var(--danger)"/> Novo Custo (Despesa)</>}
              </h2>
              <button className="btn-icon" onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="form-label">Natureza</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <button className="btn" style={{ background: form.type === 'income' ? 'var(--success-glow)' : 'transparent', color: form.type === 'income' ? 'var(--success)' : 'var(--text-muted)', border: `2px solid ${form.type === 'income' ? 'var(--success)' : 'var(--border)'}`, fontWeight: form.type==='income' ? 800 : 500 }} onClick={() => setForm({ ...form, type: 'income' })}>Ingresso (Receita)</button>
                  <button className="btn" style={{ background: form.type === 'expense' ? 'var(--danger-glow)' : 'transparent', color: form.type === 'expense' ? 'var(--danger)' : 'var(--text-muted)', border: `2px solid ${form.type === 'expense' ? 'var(--danger)' : 'var(--border)'}`, fontWeight: form.type==='expense' ? 800 : 500 }} onClick={() => setForm({ ...form, type: 'expense' })}>Saída (Despesa)</button>
                </div>
              </div>

              <div>
                <label className="form-label">Categoria Estratégica</label>
                <select className="input" style={{ width: '100%' }} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="form-label">Descrição / Origem do Lançamento</label>
                <input className="input" placeholder={form.type === 'income' ? 'Ex: Fatura Cliente Y' : 'Ex: Servidor AWS, Ferramenta X'} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ width: '100%' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="form-label">Valor do Evento (R$)</label>
                  <input className="input" type="number" placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} style={{ width: '100%' }} />
                </div>
                <div>
                  <label className="form-label">Data Limite / Execução</label>
                  <input className="input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={{ width: '100%' }} />
                </div>
              </div>

              {form.type === 'expense' && (
                <div style={{ padding: 16, background: 'var(--bg-subtle)', borderRadius: 12, border: '1px dashed var(--border)' }}>
                   <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontWeight: 800 }}>
                      <input type="checkbox" checked={form.isFixedExpense} onChange={e => setForm({ ...form, isFixedExpense: e.target.checked })} style={{ width: 18, height: 18 }} />
                      Isto é um Custo Fixo Operacional? (Recorrente)
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

              <button className="btn btn-primary" style={{ width: '100%', marginTop: 12, height: 48, fontSize: 16 }} onClick={handleAdd} disabled={!form.description || !form.amount}>
                 <CheckCircle size={18} /> Confirmar Lançamento no Livro Razão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
