import { useContext, useState } from 'react';
import {
  Plus, RefreshCw, X, Zap, AlertTriangle, CheckCircle,
  FileText, Calendar, DollarSign, Activity, Eye
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { AuthContext } from '../contexts/AuthContext';
import type { Contract } from '../contexts/DataContext';

const fmt = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

const STATUS_COLORS: Record<string, string> = {
  ativo: 'var(--success)',
  vencendo: 'var(--warning)',
  encerrado: 'var(--text-muted)',
  cancelado: 'var(--danger)',
};

const STATUS_BG: Record<string, string> = {
  ativo: 'var(--success-glow)',
  vencendo: 'var(--warning-glow)',
  encerrado: 'var(--bg-subtle)',
  cancelado: 'var(--danger-glow)',
};

const RECURRENCE_LABELS: Record<string, string> = {
  mensal: 'Mensal / MRR',
  anual: 'Anual / ARR',
  unico: 'Pagamento Único',
};

export default function Contratos() {
  const { contracts, clients, addContract, updateContractStatus, updateContract, deleteContract } = useData();
  const { user } = useContext(AuthContext);
  const [showForm, setShowForm] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  if (!user) return <div style={{ padding: 40 }}>Carregando permissões...</div>;

  const hasAccess = user.accessLevel === 'ADMIN' || user.role === 'CEO' || user.role === 'FINANCEIRO';
  
  if (!hasAccess) {
    return (
      <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '70vh', textAlign: 'center' }}>
         <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--danger-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            <AlertTriangle size={40} color="var(--danger)" />
         </div>
         <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 12 }}>Acesso Restrito</h1>
         <p style={{ color: 'var(--text-muted)', maxWidth: 450, fontSize: 15, lineHeight: 1.6 }}>
            Esta área contém dados sensíveis (SLAs e Faturamento). <br/> 
            Sua conta não possui nível de acesso <strong>Diretoria</strong> ou <strong>Financeiro</strong>.
         </p>
         <button className="btn btn-primary" style={{ marginTop: 32, padding: '12px 32px' }} onClick={() => window.history.back()}>
            Voltar para o Painel
         </button>
      </div>
    );
  }

  const canManageContracts = user.accessLevel === 'ADMIN' || user.role === 'CEO';
  const [filterStatus, setFilterStatus] = useState<'all' | 'ativo' | 'vencendo' | 'encerrado'>('all');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    clientId: '',
    value: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    recurrence: 'mensal' as Contract['recurrence'],
    notes: '',
  });

  const handleSave = async () => {
    if (!form.title || !form.clientId || !form.value || !form.endDate) return;
    
    const contractData = {
      title: form.title,
      clientId: form.clientId,
      value: parseFloat(form.value),
      startDate: form.startDate,
      endDate: form.endDate,
      recurrence: form.recurrence,
    };

    if (isEditing && editingId) {
      await (updateContract as any)(editingId, contractData);
    } else {
      await addContract(contractData);
    }

    setForm({
      title: '', clientId: '', value: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '', recurrence: 'mensal', notes: '',
    });
    setIsEditing(false);
    setEditingId(null);
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este contrato? Esta ação é irreversível.')) return;
    await (deleteContract as any)(id);
  };

  const openEdit = (c: Contract) => {
    setForm({
      title: c.title,
      clientId: c.clientId,
      value: c.value.toString(),
      startDate: c.startDate.split('T')[0],
      endDate: c.endDate.split('T')[0],
      recurrence: c.recurrence,
      notes: '',
    });
    setEditingId(c.id);
    setIsEditing(true);
    setShowForm(true);
  };

  const totalMRR = contracts.filter(c => c.status === 'ativo' && c.recurrence === 'mensal').reduce((a, c) => a + c.value, 0);
  const totalARR = contracts.filter(c => c.status === 'ativo').reduce((a, c) => a + (c.recurrence === 'anual' ? c.value : c.recurrence === 'mensal' ? c.value * 12 : c.value), 0);
  const expiringCount = contracts.filter(c => c.status === 'vencendo').length;

  const getClient = (id: string) => clients.find(c => c.id === id);
  const getDaysLeft = (endDate: string) => Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);

  const filtered = contracts.filter(c => filterStatus === 'all' || c.status === filterStatus);

  return (
    <div className="animate-in" style={{ paddingBottom: 40 }}>
      {/* ─── HEADER COCKPIT ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 100, fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Activity size={12} color="var(--primary)" /> SLAs · Contratos · Documentos
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-main)', margin: 0, lineHeight: 1.1 }}>
            Contratos & Documentos
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8 }}>
            Controle de SLAs, vigências, recorrências e automação financeira.
          </p>
        </div>
        {canManageContracts && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Novo Contrato
          </button>
        )}
      </div>

      {/* ─── KPI STRIP ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        <div className="card" style={{ borderTop: '3px solid var(--success)', padding: 24, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 100, height: 100, background: 'var(--success-glow)', filter: 'blur(30px)', borderRadius: '50%', pointerEvents: 'none' }} />
          <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-sec)', letterSpacing: '0.05em', marginBottom: 12, position: 'relative', zIndex:1 }}>Contratos Ativos</p>
          <p style={{ fontSize: 36, fontWeight: 900, color: 'var(--success)', letterSpacing: '-0.02em', position: 'relative', zIndex:1 }}>{contracts.filter(c => c.status === 'ativo').length}</p>
        </div>
        <div className="card" style={{ borderTop: '3px solid var(--warning)', padding: 24, position: 'relative', overflow: 'hidden', cursor: expiringCount > 0 ? 'pointer' : 'default' }}
          onClick={() => setFilterStatus(filterStatus === 'vencendo' ? 'all' : 'vencendo')}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 100, height: 100, background: 'var(--warning-glow)', filter: 'blur(30px)', borderRadius: '50%', pointerEvents: 'none', opacity: expiringCount > 0 ? 1 : 0.5 }} />
          <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-sec)', letterSpacing: '0.05em', marginBottom: 12, position: 'relative', zIndex: 1 }}>Vencendo (30d)</p>
          <p style={{ fontSize: 36, fontWeight: 900, color: 'var(--warning)', letterSpacing: '-0.02em', position: 'relative', zIndex: 1 }}>{expiringCount}</p>
        </div>
        <div className="card" style={{ borderTop: '3px solid var(--primary)', padding: 24, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 100, height: 100, background: 'var(--primary-glow)', filter: 'blur(30px)', borderRadius: '50%', pointerEvents: 'none' }} />
          <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-sec)', letterSpacing: '0.05em', marginBottom: 4, position: 'relative', zIndex: 1 }}>MRR Recorrente</p>
          <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8, position: 'relative', zIndex: 1 }}>Monthly Recurring Revenue</p>
          <p style={{ fontSize: 22, fontWeight: 900, color: 'var(--primary)', letterSpacing: '-0.02em', position: 'relative', zIndex: 1 }}>{fmt(totalMRR)}</p>
        </div>
        <div className="card" style={{ borderTop: '3px solid var(--success)', padding: 24, background: 'var(--success-glow)', position: 'relative', overflow: 'hidden' }}>
          <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--success)', letterSpacing: '0.05em', marginBottom: 4, position: 'relative', zIndex: 1 }}>ARR Projetado</p>
          <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8, position: 'relative', zIndex: 1 }}>Annual Recurring Revenue</p>
          <p style={{ fontSize: 22, fontWeight: 900, color: 'var(--success)', letterSpacing: '-0.02em', position: 'relative', zIndex: 1 }}>{fmt(totalARR)}</p>
        </div>
      </div>

      {/* ─── ALERTAS ────────────────────────────────────────────────────────── */}
      {expiringCount > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, padding: '16px 20px', background: 'var(--warning-glow)', borderRadius: 12, border: '1px solid rgba(245,158,11,0.25)' }}>
          <AlertTriangle size={20} style={{ color: 'var(--warning)', flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-main)' }}>{expiringCount} contrato{expiringCount > 1 ? 's' : ''} vencendo nos próximos 30 dias</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Acione o cliente para renovação e evite churn. Clique no card acima para filtrar.</p>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto', color: 'var(--warning)' }} onClick={() => setFilterStatus('vencendo')}>Ver contratos</button>
        </div>
      )}

      {/* ─── FILTROS ────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div className="tab-list">
          {[['all', 'Todos'], ['ativo', 'Ativos'], ['vencendo', 'Vencendo'], ['encerrado', 'Encerrados']].map(([val, label]) => (
            <button key={val} className={`tab-btn ${filterStatus === val ? 'active' : ''}`} onClick={() => setFilterStatus(val as typeof filterStatus)}>{label}</button>
          ))}
        </div>
        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{filtered.length} contrato(s)</span>
      </div>

      {/* ─── TABELA ─────────────────────────────────────────────────────────── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Contrato / Serviço</th>
                <th>Empresa Cliente</th>
                <th>Vigência</th>
                <th>Recorrência</th>
                <th style={{ textAlign: 'right' }}>Valor</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state" style={{ padding: '60px 0' }}>
                      <FileText size={48} color="var(--text-muted)" style={{ marginBottom: 16 }} />
                      <p style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Nenhum contrato encontrado</p>
                      {canManageContracts ? (
                        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                          <Plus size={14} /> Criar primeiro contrato
                        </button>
                      ) : (
                        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Você não possui permissão para criar contratos.</p>
                      )}
                    </div>
                  </td>
                </tr>
              )}
              {filtered.map(contract => {
                const client = getClient(contract.clientId);
                const daysLeft = getDaysLeft(contract.endDate);
                const statusColor = STATUS_COLORS[contract.status] || 'var(--text-muted)';
                return (
                  <tr key={contract.id} style={{ cursor: 'pointer' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${statusColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <FileText size={18} style={{ color: statusColor }} />
                        </div>
                        <div>
                          <p style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-main)' }}>{contract.title}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Criado em {new Date(contract.createdAt).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar" style={{ width: 32, height: 32, fontSize: 12, fontWeight: 800, background: 'var(--primary)', color: '#fff', borderRadius: 8 }}>
                          {client?.company.substring(0, 2).toUpperCase() || '--'}
                        </div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 800 }}>{client?.company || 'Desconhecido'}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{client?.name}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <Calendar size={13} color="var(--text-muted)" />
                        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-sec)' }}>
                          {new Date(contract.startDate).toLocaleDateString('pt-BR')} → {new Date(contract.endDate).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <p style={{ fontSize: 12, fontWeight: 800, color: daysLeft < 0 ? 'var(--danger)' : daysLeft < 30 ? 'var(--warning)' : 'var(--success)' }}>
                        {daysLeft < 0 ? `⚠ Vencido há ${Math.abs(daysLeft)}d` : `${daysLeft} dias restantes`}
                      </p>
                    </td>
                    <td>
                      <span className="badge" style={{ background: 'var(--primary-glow)', color: 'var(--primary)', border: '1px solid rgba(124,58,237,0.2)', fontWeight: 800 }}>
                        {RECURRENCE_LABELS[contract.recurrence] || contract.recurrence}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <p style={{ fontWeight: 900, fontSize: 16, color: 'var(--success)' }}>{fmt(contract.value)}</p>
                      {contract.recurrence === 'mensal' && (
                        <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>/mês</p>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge" style={{
                        background: STATUS_BG[contract.status], color: statusColor,
                        border: `1px solid ${statusColor}30`, fontWeight: 800, textTransform: 'uppercase'
                      }}>
                        {contract.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button className="btn-icon" title="Visualizar" onClick={() => setSelectedContract(contract)}>
                          <Eye size={15} />
                        </button>
                        {canManageContracts && (
                          <>
                            <button className="btn-icon" title="Editar" onClick={() => openEdit(contract)} style={{ color: 'var(--primary)' }}>
                              <RefreshCw size={14} />
                            </button>
                            <button className="btn-icon" title="Excluir" onClick={() => handleDelete(contract.id)} style={{ color: 'var(--danger)' }}>
                              <X size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── AUTOMAÇÃO HINT ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20, padding: '16px 20px', background: 'linear-gradient(135deg, var(--primary-glow), var(--purple-glow))', borderRadius: 12, border: '1px solid rgba(124,58,237,0.15)' }}>
        <Zap size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
        <p style={{ fontSize: 13, color: 'var(--text-main)', fontWeight: 600 }}>
          <strong style={{ color: 'var(--primary)' }}>Automação Financeira:</strong> Ao criar um novo contrato, um lançamento de receita é gerado automaticamente no módulo Financeiro com a recorrência configurada.
        </p>
      </div>

      {/* ─── DETAIL MODAL ───────────────────────────────────────────────────── */}
      {selectedContract && (
        <div className="modal-overlay" onClick={() => setSelectedContract(null)}>
          <div className="modal" style={{ maxWidth: 560, padding: 0 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ padding: '24px 32px', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: `${STATUS_COLORS[selectedContract.status]}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={24} style={{ color: STATUS_COLORS[selectedContract.status] }} />
                </div>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>{selectedContract.title}</h2>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{getClient(selectedContract.clientId)?.company}</p>
                </div>
              </div>
              <button className="btn-icon" style={{ background: 'var(--bg-card)' }} onClick={() => setSelectedContract(null)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ padding: 32 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { label: 'Valor do Contrato', value: fmt(selectedContract.value), color: 'var(--success)' },
                  { label: 'Recorrência', value: RECURRENCE_LABELS[selectedContract.recurrence], color: 'var(--primary)' },
                  { label: 'Data de Início', value: new Date(selectedContract.startDate).toLocaleDateString('pt-BR'), color: 'var(--text-main)' },
                  { label: 'Data de Vencimento', value: new Date(selectedContract.endDate).toLocaleDateString('pt-BR'), color: getDaysLeft(selectedContract.endDate) < 30 ? 'var(--warning)' : 'var(--text-main)' },
                  { label: 'Dias Restantes', value: getDaysLeft(selectedContract.endDate) < 0 ? 'VENCIDO' : `${getDaysLeft(selectedContract.endDate)} dias`, color: getDaysLeft(selectedContract.endDate) < 0 ? 'var(--danger)' : getDaysLeft(selectedContract.endDate) < 30 ? 'var(--warning)' : 'var(--success)' },
                  { label: 'Status Atual', value: selectedContract.status.toUpperCase(), color: STATUS_COLORS[selectedContract.status] },
                ].map(item => (
                  <div key={item.label} className="card" style={{ padding: 16, background: 'var(--bg-subtle)' }}>
                    <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: 8 }}>{item.label}</p>
                    <p style={{ fontSize: 18, fontWeight: 900, color: item.color }}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer" style={{ padding: '20px 32px', background: 'var(--bg-card)', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
               {canManageContracts && (
                 <>
                   {selectedContract.status !== 'ativo' && (
                     <button className="btn btn-secondary" onClick={() => { updateContractStatus(selectedContract.id, 'ativo'); setSelectedContract(null); }}>
                       <RefreshCw size={14} /> Reativar Contrato
                     </button>
                   )}
                   {selectedContract.status !== 'encerrado' && (
                     <button className="btn btn-ghost" style={{ color: 'var(--text-muted)' }} onClick={() => { updateContractStatus(selectedContract.id, 'encerrado'); setSelectedContract(null); }}>
                       Inativar
                     </button>
                   )}
                   {selectedContract.status !== 'cancelado' && (
                     <button className="btn btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => { if(confirm('Cancelar contrato?')) { updateContractStatus(selectedContract.id, 'cancelado'); setSelectedContract(null); } }}>
                       Cancelar Contrato
                     </button>
                   )}
                 </>
               )}
               <button className="btn btn-outline" onClick={() => setSelectedContract(null)}>Fechar</button>
             </div>
          </div>
        </div>
      )}

      {/* ─── ADD CONTRACT MODAL ─────────────────────────────────────────────── */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" style={{ maxWidth: 640, padding: 0 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ padding: '24px 32px', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={24} color="var(--primary)" />
                </div>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>{isEditing ? 'Editar Contrato' : 'Formalizar Novo Contrato'}</h2>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{isEditing ? 'Atualize os termos e vigência do contrato.' : 'Registre o SLA, valor e vigência acordados com o cliente.'}</p>
                </div>
              </div>
              <button className="btn-icon" style={{ background: 'var(--bg-card)' }} onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>

            <div className="modal-body" style={{ padding: 32 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label className="form-label" style={{ fontWeight: 800 }}>Título do Instrumento / Serviço Contratado *</label>
                  <input className="input" style={{ fontSize: 16, fontWeight: 700 }} placeholder="Ex: Gestão de Tráfego Pago — Plano Scale" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
                </div>

                <div style={{ gridColumn: '1/-1' }}>
                  <label className="form-label" style={{ fontWeight: 800 }}>Empresa Contratante *</label>
                  <select className="input" value={form.clientId} onChange={e => setForm(p => ({ ...p, clientId: e.target.value }))}>
                    <option value="">Selecione o cliente base...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.company} — {c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 800 }}><DollarSign size={13} style={{ display: 'inline', marginBottom: -2 }} /> Valor do Contrato (R$) *</label>
                  <input className="input" type="number" style={{ fontSize: 16, fontWeight: 700, color: 'var(--success)' }} placeholder="0,00" value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} />
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 800 }}>Modelo de Cobrança</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                    {(['mensal', 'anual', 'unico'] as Contract['recurrence'][]).map(rec => (
                      <button key={rec} onClick={() => setForm(p => ({ ...p, recurrence: rec }))}
                        style={{ padding: '10px 16px', borderRadius: 10, border: `1.5px solid ${form.recurrence === rec ? 'var(--primary)' : 'var(--border)'}`, background: form.recurrence === rec ? 'var(--primary-glow)' : 'var(--bg-subtle)', color: form.recurrence === rec ? 'var(--primary)' : 'var(--text-main)', fontWeight: 800, fontSize: 13, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
                        {rec === 'mensal' ? '📅 Mensal (MRR)' : rec === 'anual' ? '📆 Anual (ARR)' : '🔁 Pagamento Único'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="form-label"><Calendar size={13} style={{ display: 'inline', marginBottom: -2 }} /> Data de Início</label>
                  <input className="input" type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label"><Calendar size={13} style={{ display: 'inline', marginBottom: -2 }} /> Vencimento do Contrato *</label>
                  <input className="input" type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} />
                </div>

                <div style={{ gridColumn: '1/-1', padding: '16px 20px', background: 'var(--success-glow)', borderRadius: 12, display: 'flex', gap: 10, alignItems: 'center', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <CheckCircle size={18} style={{ color: 'var(--success)', flexShrink: 0 }} />
                  <p style={{ fontSize: 13, color: 'var(--text-main)', fontWeight: 600 }}>
                    <strong style={{ color: 'var(--success)' }}>Automatização:</strong> Um lançamento de receita será gerado no Financeiro e o cliente será vinculado ao contrato automaticamente.
                  </p>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ justifyContent: 'flex-end', padding: '24px 32px', background: 'var(--bg-card)' }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-ghost" onClick={() => { setShowForm(false); setIsEditing(false); }}>Cancelar</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={!form.title || !form.clientId || !form.value || !form.endDate} style={{ padding: '10px 24px' }}>
                  <CheckCircle size={16} /> {isEditing ? 'Salvar Alterações' : 'Assinar & Formalizar Contrato'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
