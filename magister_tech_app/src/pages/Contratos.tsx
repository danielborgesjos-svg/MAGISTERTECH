import { useState } from 'react';
import { Plus, Download, RefreshCw, X, Zap, AlertTriangle, CheckCircle } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import type { Contract } from '../contexts/DataContext';

const fmt = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

export default function Contratos() {
  const { contracts, clients, addContract, updateContractStatus } = useData();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '', clientId: '', value: '', startDate: new Date().toISOString().split('T')[0],
    endDate: '', recurrence: 'mensal' as Contract['recurrence'],
  });

  const handleAdd = () => {
    if (!form.title || !form.clientId || !form.value || !form.endDate) return;
    addContract({
      title: form.title,
      clientId: form.clientId,
      value: parseFloat(form.value),
      startDate: form.startDate,
      endDate: form.endDate,
      recurrence: form.recurrence,
    });
    setForm({ title: '', clientId: '', value: '', startDate: new Date().toISOString().split('T')[0], endDate: '', recurrence: 'mensal' });
    setShowForm(false);
  };

  const totalValue = contracts.filter(c => c.status === 'ativo').reduce((a, c) => a + c.value, 0);
  const expiringCount = contracts.filter(c => c.status === 'vencendo').length;

  const getClient = (id: string) => clients.find(c => c.id === id);

  const getDaysLeft = (endDate: string) => {
    return Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
  };

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Contratos & Documentos</h1>
          <p className="page-subtitle">Controle de SLAs, vigências e recorrências</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Novo Contrato</button>
      </div>

      {/* KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--success)' }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Ativos</p>
          <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--success)' }}>{contracts.filter(c => c.status === 'ativo').length}</p>
        </div>
        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--warning)' }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Vencendo</p>
          <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--warning)' }}>{expiringCount}</p>
        </div>
        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--primary)' }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>MRR Total</p>
          <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary)' }}>{fmt(totalValue)}</p>
        </div>
        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--purple)' }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Total Contratos</p>
          <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--purple)' }}>{contracts.length}</p>
        </div>
      </div>

      {/* Warning Alert */}
      {expiringCount > 0 && (
        <div className="alert-item warning" style={{ marginBottom: 20, padding: '14px 18px' }}>
          <AlertTriangle size={18} style={{ color: 'var(--warning)', flexShrink: 0 }} />
          <p style={{ fontSize: 13 }}><strong>{expiringCount} contrato{expiringCount > 1 ? 's' : ''}</strong> vencendo nos próximos 30 dias. Revise e renove.</p>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Serviço / Contrato</th>
                <th>Cliente</th>
                <th>Vigência</th>
                <th>Recorrência</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {contracts.length === 0 && (
                <tr><td colSpan={7}><div className="empty-state"><p>Nenhum contrato cadastrado</p><button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}><Plus size={14} /> Criar primeiro contrato</button></div></td></tr>
              )}
              {contracts.map(contract => {
                const client = getClient(contract.clientId);
                const daysLeft = getDaysLeft(contract.endDate);
                return (
                  <tr key={contract.id}>
                    <td>
                      <p style={{ fontWeight: 700, fontSize: 13 }}>{contract.title}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Criado em {new Date(contract.createdAt).toLocaleDateString('pt-BR')}</p>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="avatar avatar-sm" style={{ background: 'var(--primary)' }}>
                          {client?.company.substring(0, 2).toUpperCase() || '--'}
                        </div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600 }}>{client?.company || 'Desconhecido'}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{client?.name}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p style={{ fontSize: 12 }}>{new Date(contract.startDate).toLocaleDateString('pt-BR')} → {new Date(contract.endDate).toLocaleDateString('pt-BR')}</p>
                      <p style={{ fontSize: 11, fontWeight: 600, color: daysLeft < 0 ? 'var(--danger)' : daysLeft < 30 ? 'var(--warning)' : 'var(--success)' }}>
                        {daysLeft < 0 ? `Vencido há ${Math.abs(daysLeft)}d` : `${daysLeft} dias restantes`}
                      </p>
                    </td>
                    <td><span className="badge badge-primary">{contract.recurrence}</span></td>
                    <td style={{ fontWeight: 800, color: 'var(--success)', fontSize: 15 }}>{fmt(contract.value)}</td>
                    <td>
                      <span className={`badge ${contract.status === 'ativo' ? 'badge-success' : contract.status === 'vencendo' ? 'badge-warning' : 'badge-muted'}`}>
                        {contract.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-icon" title="Download"><Download size={14} /></button>
                        <button className="btn btn-ghost btn-sm" onClick={() => updateContractStatus(contract.id, 'ativo')} title="Renovar">
                          <RefreshCw size={13} /> Renovar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* INFO: Auto-financial */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, padding: '12px 16px', background: 'var(--primary-glow)', borderRadius: 8, border: '1px solid rgba(37,99,235,0.2)' }}>
        <Zap size={15} style={{ color: 'var(--primary)' }} />
        <p style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 500 }}>
          <strong>Automação ativa:</strong> Ao criar um novo contrato, um lançamento financeiro é gerado automaticamente no módulo Financeiro.
        </p>
      </div>

      {/* ─── ADD CONTRACT MODAL ───────────────────────────────── */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Novo Contrato</h2>
              <button className="btn-icon" onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Título do Contrato *</label>
                  <input className="input" placeholder="Ex: ERP Cloud — Licença Anual" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Cliente *</label>
                  <select className="input" value={form.clientId} onChange={e => setForm(p => ({ ...p, clientId: e.target.value }))}>
                    <option value="">Selecione um cliente...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.company} — {c.name}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Valor (R$) *</label>
                    <input className="input" type="number" placeholder="0.00" value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Recorrência</label>
                    <select className="input" value={form.recurrence} onChange={e => setForm(p => ({ ...p, recurrence: e.target.value as Contract['recurrence'] }))}>
                      <option value="mensal">Mensal</option>
                      <option value="anual">Anual</option>
                      <option value="unico">Único</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Data Início</label>
                    <input className="input" type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Data Fim *</label>
                    <input className="input" type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} />
                  </div>
                </div>
                <div style={{ padding: '12px 16px', background: 'var(--success-glow)', borderRadius: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <CheckCircle size={15} style={{ color: 'var(--success)' }} />
                  <p style={{ fontSize: 12, color: 'var(--success)', fontWeight: 500 }}>
                    Um lançamento financeiro será criado automaticamente ao salvar este contrato.
                  </p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleAdd} disabled={!form.title || !form.clientId || !form.value || !form.endDate}>
                <Plus size={14} /> Criar Contrato
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
