import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, MoreVertical, X, User, Building2,
  Mail, Phone, Tag, Globe, StickyNote, FileText,
  Briefcase, ChevronRight, Archive, MessageSquare, CheckCircle, Activity,
  KanbanSquare, LayoutGrid, Key, Copy
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { usePermission } from '../hooks/usePermission';
import { apiFetch } from '../lib/api';
import type { Client } from '../contexts/DataContext';

const STATUS_LABELS: Record<string, string> = {
  ativo: 'Ativa', inativo: 'Inativa', prospect: 'Prospect / Lead'
};

const SEGMENTS = ['Software', 'Gestão', 'E-commerce', 'Consultoria', 'Saúde', 'Educação', 'Marketing', 'Outro'];
const ORIGINS = ['Indicação', 'LinkedIn', 'Google Ads', 'Cold Outreach', 'Evento', 'Site', 'Outro'];

export default function Clientes() {
  const { clients, contracts, projects, addClient, updateClient, deleteClient, addClientNote, pipeline, addPipelineDeal } = useData();
  const { canViewSensitiveData } = usePermission();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [activeTab, setActiveTab] = useState('resumo');
  const [showForm, setShowForm] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', company: '', email: '', phone: '',
    segment: 'Software', status: 'prospect' as Client['status'], origin: 'Site'
  });
  const [isEditingForm, setIsEditingForm] = useState(false);

  // Modal de credenciais do portal gerado
  const [portalCredentials, setPortalCredentials] = useState<{ email: string; tempPassword: string; loginUrl: string } | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // WhatsApp N1 Native State
  const [waModal, setWaModal] = useState<{ phone: string; title: string } | null>(null);
  const [waMessage, setWaMessage] = useState('');
  const [isSendingWA, setIsSendingWA] = useState(false);

  const filtered = clients.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleAdd = async () => {
    if (!form.name || !form.company) return;
    if (isEditingForm && selectedClient) {
      updateClient(selectedClient.id, form);
      const updatedClient = { ...selectedClient, ...form };
      setSelectedClient(updatedClient);
    } else {
      try {
        const res = await apiFetch<any>('/api/clients', {
          method: 'POST',
          body: JSON.stringify({ ...form, generatePortalAccess: true }),
        });
        if (res.portalAccess) {
          setPortalCredentials(res.portalAccess);
        }
        // Refresh data via DataContext
        addClient(form);
      } catch (e) {
        addClient(form);
      }
    }
    setForm({ name: '', company: '', email: '', phone: '', segment: 'Software', status: 'prospect', origin: 'Site' });
    setShowForm(false);
    setIsEditingForm(false);
  };

  const handleAddNote = () => {
    if (!noteText.trim() || !selectedClient) return;
    addClientNote(selectedClient.id, noteText, 'Sistema');
    setNoteText('');
    setSelectedClient(clients.find(c => c.id === selectedClient.id) || selectedClient);
  };

  const sendWA = async () => {
    if (!waModal || !waMessage) return;
    setIsSendingWA(true);
    try {
      const data = await apiFetch<any>('/api/whatsapp/send', {
        method: 'POST',
        body: JSON.stringify({ phone: waModal.phone, message: waMessage }),
      });
      if (data.ok) {
        alert('Mensagem N1 enviada para o cliente!');
        setWaModal(null);
        setWaMessage('');
      } else {
        alert(data.error || 'Erro ao enviar mensagem pela engine.');
      }
    } catch (err) {
      alert('Falha interna ao contatar WhatsApp Engine.');
    } finally {
      setIsSendingWA(false);
    }
  };

  const clientContracts = selectedClient ? contracts.filter(c => c.clientId === selectedClient.id) : [];
  const clientProjects = selectedClient ? projects.filter(p => p.clientId === selectedClient.id) : [];

  const copyCredentials = () => {
    if (!portalCredentials) return;
    const text = `Portal Magister Tech:\nURL: ${window.location.origin}${portalCredentials.loginUrl}\nEmail: ${portalCredentials.email}\nSenha: ${portalCredentials.tempPassword}`;
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  };



  return (
    <div className="animate-in" style={{ paddingBottom: 40 }}>
      {/* ─── HEADER COCKPIT ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 100, fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Activity size={12} color="var(--primary)" /> CRM · Gestão de Contas
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-main)', margin: 0, lineHeight: 1.1 }}>
            Contas & Prospects
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8 }}>
            Base de clientes, histórico de interações e funil de contas.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm({ name: '', company: '', email: '', phone: '', segment: 'Software', status: 'prospect', origin: 'Site' }); setIsEditingForm(false); setShowForm(true); }}>
          <Plus size={16} /> Nova Conta
        </button>
      </div>

      {/* ─── KPIS ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Contas Ativas', value: clients.filter(c => c.status === 'ativo').length, accent: 'var(--success)', glow: 'var(--success-glow)' },
          { label: 'Leads / Prospects', value: clients.filter(c => c.status === 'prospect').length, accent: 'var(--warning)', glow: 'var(--warning-glow)' },
          { label: 'Total Base', value: clients.length, accent: 'var(--primary)', glow: 'var(--primary-glow)' },
        ].map(s => (
           <div key={s.label} className="card" style={{ padding: '24px', position: 'relative', overflow: 'hidden', borderTop: `3px solid ${s.accent}` }}>
               <div style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, background: s.glow, filter: 'blur(30px)', borderRadius: '50%', pointerEvents: 'none' }} />
               <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-sec)', letterSpacing: '0.05em', marginBottom: 10, position: 'relative', zIndex: 1 }}>{s.label}</p>
               <p style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em', position: 'relative', zIndex: 1 }}>{s.value}</p>
           </div>
        ))}
      </div>

      {/* ─── FILTERS ───────────────────────────────────────────────────────── */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-bar" style={{ flex: 1, minWidth: 240 }}>
            <Search size={16} strokeWidth={2.5} style={{ color: 'var(--primary)' }} />
            <input placeholder="Buscar por cliente, empresa ou CNPJ..." value={search} onChange={e => setSearch(e.target.value)} />
            {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={14} /></button>}
          </div>
          <div className="tab-list" style={{ width: 'auto' }}>
            {[['all', 'Visualizar Tudo'], ['ativo', 'Base Ativa'], ['prospect', 'Pipeline (Leads)'], ['inativo', 'Churn / Arquivados']].map(([val, label]) => (
              <button key={val} className={`tab-btn ${filterStatus === val ? 'active' : ''}`} onClick={() => setFilterStatus(val)} style={{ padding: '8px 16px', flex: 'unset', fontSize: 13 }}>{label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── TABLE ─────────────────────────────────────────────────────────── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome da Conta</th>
                <th>Responsável (Contato)</th>
                <th>Segmento de Atuação</th>
                <th>Origem do Lead</th>
                <th>Última Ação</th>
                <th>Status</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7}><div className="empty-state"><Building2 size={36} /><p>Nenhum registro encontrado no CRM.</p></div></td></tr>
              )}
              {filtered.map(client => (
                <tr key={client.id} style={{ cursor: 'pointer' }} onClick={() => { setSelectedClient(client); setActiveTab('resumo'); }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className="avatar avatar-sm" style={{ background: `hsl(${client.id.length * 40}, 65%, 50%)`, borderRadius: 10, fontWeight: 700 }}>
                        {client.company.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontWeight: 800, fontSize: 14 }}>{client.company}</p>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>ID: {client.id.split('-')[0].toUpperCase()}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <p style={{ fontSize: 13, fontWeight: 700 }}>{client.name}</p>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                       <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{client.email}</p>
                       {client.phone && (
                         <button className="btn-icon" style={{ padding: 2, background: 'var(--success-glow)', color: 'var(--success)', border: '1px solid rgba(37,211,102,0.3)', width: 22, height: 22 }} onClick={e => { e.stopPropagation(); setWaModal({ phone: client.phone, title: client.company }); }}>
                            <MessageSquare size={12}/>
                         </button>
                       )}
                    </div>
                  </td>
                  <td>
                     <span className="badge" style={{ background: 'var(--bg-subtle)', color: 'var(--text-main)', border: '1px solid var(--border)' }}>{client.segment}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-sec)', fontWeight: 600 }}>
                      <Globe size={12}/> {client.origin}
                    </div>
                  </td>
                  <td>
                     <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                      {new Date(client.lastContact).toLocaleDateString('pt-BR')}
                     </span>
                  </td>
                  <td>
                    <span className="badge" style={{ 
                        background: client.status === 'ativo' ? 'var(--success-glow)' : client.status === 'prospect' ? 'var(--warning-glow)' : 'var(--bg-subtle)',
                        color: client.status === 'ativo' ? 'var(--success)' : client.status === 'prospect' ? 'var(--warning)' : 'var(--text-muted)',
                        border: `1px solid ${client.status === 'ativo' ? 'rgba(16, 185, 129, 0.2)' : client.status === 'prospect' ? 'rgba(245, 158, 11, 0.2)' : 'var(--border)'}`
                      }}>
                      {STATUS_LABELS[client.status]}
                    </span>
                  </td>
                  <td>
                    <div style={{ position: 'relative' }} onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === client.id ? null : client.id); }}>
                      <button className="btn-icon"><MoreVertical size={16} /></button>
                      {menuOpen === client.id && (
                        <div style={{ position: 'absolute', right: 0, top: '100%', zIndex: 10, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, boxShadow: 'var(--shadow-lg)', minWidth: 180, padding: 6 }}>
                          <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={() => { setSelectedClient(client); setActiveTab('resumo'); setMenuOpen(null); }}><ChevronRight size={14} /> Ficha Completa</button>
                          <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={() => { setSelectedClient(client); setActiveTab('notas'); setMenuOpen(null); }}><StickyNote size={14} /> Registrar Log / Nota</button>
                          <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--danger)' }} onClick={() => { updateClient(client.id, { status: 'inativo' }); setMenuOpen(null); }}><Archive size={14} /> Arquivar Conta</button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── CLIENT DETAIL MODAL ────────────────────────────────── */}
      {selectedClient && (
        <div className="modal-overlay" onClick={() => setSelectedClient(null)}>
          <div className="modal modal-xl" style={{ padding: 0, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ background: 'var(--bg-subtle)', padding: '32px 32px 0 32px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
                   <div style={{ width: 80, height: 80, borderRadius: 20, background: `hsl(${selectedClient.id.length * 40}, 65%, 50%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 32, fontWeight: 900, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
                     {selectedClient.company.substring(0, 2).toUpperCase()}
                   </div>
                   <div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                       <h2 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.02em' }}>{selectedClient.company}</h2>
                       <span className="badge" style={{ 
                        background: selectedClient.status === 'ativo' ? 'var(--success-glow)' : selectedClient.status === 'prospect' ? 'var(--warning-glow)' : 'var(--bg-card)',
                        color: selectedClient.status === 'ativo' ? 'var(--success)' : selectedClient.status === 'prospect' ? 'var(--warning)' : 'var(--text-muted)',
                        border: `1px solid ${selectedClient.status === 'ativo' ? 'rgba(16, 185, 129, 0.2)' : selectedClient.status === 'prospect' ? 'rgba(245, 158, 11, 0.2)' : 'var(--border)'}`
                      }}>
                      {STATUS_LABELS[selectedClient.status]}
                    </span>
                     </div>
                     <p style={{ fontSize: 14, color: 'var(--text-sec)', fontWeight: 600 }}>Responsável: {selectedClient.name} · Conta ID: {selectedClient.id.split('-')[0].toUpperCase()}</p>
                   </div>
                 </div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                   <button
                     className="btn btn-secondary btn-sm"
                     style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                     onClick={() => { setSelectedClient(null); navigate(`/admin/clientes/${selectedClient.id}/hub`); }}
                   >
                     <LayoutGrid size={14} /> Hub 360
                   </button>
                   <button
                     className="btn btn-secondary btn-sm"
                     style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                     onClick={() => { setSelectedClient(null); navigate(`/admin/clientes/${selectedClient.id}/kanban`); }}
                   >
                     <KanbanSquare size={14} /> Kanban
                   </button>
                   <button className="btn-icon" onClick={() => setSelectedClient(null)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}><X size={18} /></button>
                 </div>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: 24, overflowX: 'auto', paddingBottom: 4 }}>
                {[
                  ['resumo', '📌 Ficha Cadastral'],
                  ...(canViewSensitiveData() ? [['contratos', '📄 Contratos Ativos']] : []),
                  ['projetos', '📊 Entregas / Projetos'],
                  ['notas', '💬 Histórico']
                ].map(([tab, label]) => (
                  <button key={tab} onClick={() => setActiveTab(tab)} style={{
                    padding: '12px 0', border: 'none', background: 'transparent', cursor: 'pointer',
                    fontSize: 14, fontWeight: 700, color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)',
                    borderBottom: activeTab === tab ? '3px solid var(--primary)' : '3px solid transparent',
                    transition: 'var(--transition)', whiteSpace: 'nowrap'
                  }}>{label}</button>
                ))}
              </div>
            </div>

            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto', padding: 32 }}>
              {activeTab === 'resumo' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                     <h4 style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Informações de Contato</h4>
                     <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                           <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={14} color="var(--primary)"/></div>
                           <div><p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Nome</p><p style={{ fontSize: 14, fontWeight: 700 }}>{selectedClient.name}</p></div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                           <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Mail size={14} color="var(--primary)"/></div>
                           <div><p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Email Principal</p><p style={{ fontSize: 14, fontWeight: 700 }}>{selectedClient.email}</p></div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                           <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Phone size={14} color="var(--primary)"/></div>
                           <div><p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Telefone / WhatsApp</p>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <p style={{ fontSize: 14, fontWeight: 700 }}>{selectedClient.phone}</p>
                                {selectedClient.phone && (
                                   <button className="btn-icon" style={{ background: 'var(--success-glow)', color: 'var(--success)', width: 24, height: 24 }} onClick={() => setWaModal({ phone: selectedClient.phone, title: selectedClient.company })}>
                                     <MessageSquare size={12}/>
                                   </button>
                                )}
                              </div>
                           </div>
                        </div>
                     </div>
                   </div>

                   <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                     <h4 style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>Dados Comerciais</h4>
                     <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                           <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Tag size={14} color="var(--primary)"/></div>
                           <div><p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Segmento de Atuação</p><p style={{ fontSize: 14, fontWeight: 700 }}>{selectedClient.segment}</p></div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                           <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Globe size={14} color="var(--primary)"/></div>
                           <div><p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Origem da Conta</p><p style={{ fontSize: 14, fontWeight: 700 }}>{selectedClient.origin}</p></div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                           <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle size={14} color="var(--primary)"/></div>
                           <div><p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Cliente Desde</p><p style={{ fontSize: 14, fontWeight: 700 }}>{new Date(selectedClient.createdAt).toLocaleDateString('pt-BR')}</p></div>
                        </div>
                     </div>
                   </div>

                  <div style={{ gridColumn: '1 / -1', display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 16, paddingTop: 24, borderTop: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
                     <button className="btn btn-primary" onClick={() => { setForm({ name: selectedClient.name, company: selectedClient.company, email: selectedClient.email, phone: selectedClient.phone, segment: selectedClient.segment, status: selectedClient.status, origin: selectedClient.origin }); setIsEditingForm(true); setShowForm(true); }}>
                        Editar Dados
                     </button>
                     {selectedClient.status === 'prospect' && (
                        <button className="btn btn-primary" style={{ background: 'var(--indigo)' }} onClick={() => {
                           if (pipeline.length > 0) {
                             addPipelineDeal(pipeline[0].id, {
                               title: selectedClient.company,
                               value: 0,
                               tag: selectedClient.segment,
                               priority: 'medium',
                               phone: selectedClient.phone,
                               description: `Lead gerado automaticamente pelo CRM Hub.\nOrigem: ${selectedClient.origin}`,
                               assignee: 'CRM'
                             });
                             alert('Lead transferido para o Pipeline Comercial com sucesso!');
                           }
                        }}>
                           Mandar p/ Pipeline
                        </button>
                     )}
                    {selectedClient.status !== 'ativo' && (
                       <button className="btn btn-outline" onClick={() => updateClient(selectedClient.id, { status: 'ativo' })} style={{ color: 'var(--success)', borderColor: 'var(--success)' }}>
                          <CheckCircle size={14} /> Ativar Conta
                       </button>
                    )}
                    {selectedClient.status !== 'inativo' && (
                       <button className="btn btn-ghost" onClick={() => updateClient(selectedClient.id, { status: 'inativo' })} style={{ color: 'var(--warning)', borderColor: 'transparent' }}>
                           <Archive size={14} style={{ marginRight: 6 }} />Inativar/Arquivar
                       </button>
                    )}
                    <button className="btn btn-ghost" onClick={() => {
                      if (confirm('Tem certeza absoluta que deseja excluir este cliente permanentemente da base? Todos os contratos sumirão.')) {
                        deleteClient(selectedClient.id);
                        setSelectedClient(null);
                      }
                    }} style={{ color: 'var(--danger)', borderColor: 'transparent', marginLeft: 'auto' }}>
                       <X size={14} style={{ marginRight: 6 }} />Excluir Definitivo
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'contratos' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {clientContracts.length === 0 ? <div className="empty-state" style={{ padding: '40px 0' }}><FileText size={40} /><h3 style={{ marginTop: 16 }}>Nenhum contrato selado</h3></div> : (
                    clientContracts.map(contract => (
                      <div key={contract.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: contract.status === 'ativo' ? '4px solid var(--success)' : '4px solid var(--warning)' }}>
                        <div>
                          <h4 style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>{contract.title}</h4>
                          <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
                            <span style={{ color: 'var(--primary)' }}>{contract.recurrence.toUpperCase()}</span> · Vencimento: {new Date(contract.endDate).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontWeight: 900, color: contract.status === 'ativo' ? 'var(--success)' : 'var(--text-main)', fontSize: 20 }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contract.value)}</p>
                          <span className={`badge ${contract.status === 'ativo' ? 'badge-success' : contract.status === 'vencendo' ? 'badge-warning' : 'badge-muted'}`} style={{ marginTop: 6, display: 'inline-block' }}>STATUS: {contract.status.toUpperCase()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'projetos' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {clientProjects.length === 0 ? <div className="empty-state" style={{ padding: '40px 0' }}><Briefcase size={40} /><h3 style={{ marginTop: 16 }}>Nenhum projeto rodando</h3></div> : (
                    clientProjects.map(project => (
                      <div key={project.id} className="card" style={{ borderTop: `3px solid ${project.color}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                          <div>
                            <h4 style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>{project.name}</h4>
                            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Módulo: <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{project.type}</span></p>
                          </div>
                          <span className="badge" style={{ background: `${project.color}20`, color: project.color, border: `1px solid ${project.color}40`, height: 'fit-content' }}>{project.status.toUpperCase()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, fontWeight: 700 }}>
                           <span>Progresso Operacional</span>
                           <span style={{ color: project.color }}>{project.progress}%</span>
                        </div>
                        <div className="progress-track" style={{ height: 8 }}>
                          <div className="progress-fill" style={{ width: `${project.progress}%`, background: project.color }} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'notas' && (
                <div>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyItems: 'center', flexShrink: 0, justifyContent: 'center', fontWeight: 800 }}>ME</div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                       <textarea className="input" style={{ width: '100%', minHeight: 80, resize: 'none' }} placeholder="Registre uma reunião, ligação ou atualização..." value={noteText} onChange={e => setNoteText(e.target.value)} />
                       <button className="btn btn-primary" onClick={handleAddNote} style={{ alignSelf: 'flex-end', padding: '10px 24px' }}>
                          <MessageSquare size={16} /> Salvar Log
                       </button>
                    </div>
                  </div>
                  
                  {selectedClient.notes.length === 0 ? <div className="empty-state" style={{ padding: '30px 0' }}><p>Timeline vazia.</p></div> : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {selectedClient.notes.map(note => (
                        <div key={note.id} style={{ display: 'flex', gap: 16 }}>
                           <div style={{ width: 2, background: 'var(--border)', position: 'relative', marginTop: 10 }}>
                              <div style={{ position: 'absolute', top: 0, left: -4, width: 10, height: 10, borderRadius: '50%', background: 'var(--primary)', border: '2px solid var(--bg)' }}/>
                           </div>
                           <div className="card" style={{ flex: 1, padding: 16, background: 'var(--bg-subtle)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                                 <span style={{ fontSize: 13, fontWeight: 800 }}>{note.author}</span>
                                 <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{new Date(note.createdAt).toLocaleDateString('pt-BR')}</span>
                              </div>
                              <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-sec)', whiteSpace: 'pre-wrap' }}>{note.text}</p>
                           </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── ADD CLIENT MODAL ─────────────────────────────────── */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: 18, fontWeight: 900 }}>{isEditingForm ? 'Editar Conta' : 'Nova Conta no CRM'}</h2>
              <button className="btn-icon" onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Nome Fantasia / Empresa *</label>
                  <input className="input" placeholder="Ex: Magister Group" value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Nome do Contato Principal *</label>
                  <input className="input" placeholder="Ex: Daniel Borges" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Segmento de Atuação</label>
                  <select className="input" value={form.segment} onChange={e => setForm(p => ({ ...p, segment: e.target.value }))}>
                    {SEGMENTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Email Corporativo</label>
                  <input className="input" type="email" placeholder="contato@empresa.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Telefone / WhatsApp</label>
                  <input className="input" placeholder="(41) 98765-4321" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
                
                <div>
                  <label className="form-label">Canal de Origem</label>
                  <select className="input" value={form.origin} onChange={e => setForm(p => ({ ...p, origin: e.target.value }))}>
                    {ORIGINS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Estágio do Funil (Status)</label>
                  <select className="input" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as any }))}>
                    <option value="prospect">Prospect / Lead (Negociação)</option>
                    <option value="ativo">Conta Ativa (Em operação)</option>
                  </select>
                </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleAdd} disabled={!form.name || !form.company}>{isEditingForm ? 'Salvar Modificações' : <><Plus size={16}/> Inserir no CRM</>}</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL DE CREDENCIAIS DO PORTAL ─────────────────────────── */}
      {portalCredentials && (
        <div className="modal-overlay" onClick={() => setPortalCredentials(null)}>
          <div className="modal animate-scale-in" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Key size={22} color="var(--primary)" />
              </div>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 900, color: 'var(--text-main)' }}>Acesso ao Portal Gerado</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Repasse estas credenciais ao cliente</p>
              </div>
              <button className="btn-icon" onClick={() => setPortalCredentials(null)} style={{ marginLeft: 'auto' }}><X size={18} /></button>
            </div>

            <div style={{ background: 'var(--bg-subtle)', borderRadius: 12, padding: 20, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>URL de Login</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>{window.location.origin}/login</p>
              </div>
              <div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Email</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)', fontFamily: 'monospace' }}>{portalCredentials.email}</p>
              </div>
              <div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Senha Temporária</p>
                <p style={{ fontSize: 18, fontWeight: 900, color: 'var(--warning)', fontFamily: 'monospace', letterSpacing: '0.05em' }}>{portalCredentials.tempPassword}</p>
              </div>
            </div>

            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 16, lineHeight: 1.6 }}>
              ⚠️ Guarde esta senha — ela não será exibida novamente. Se precisar de um novo acesso, use o botão "Resetar Acesso Portal" na ficha do cliente.
            </p>

            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button className="btn btn-ghost" onClick={() => setPortalCredentials(null)} style={{ flex: 1 }}>Fechar</button>
              <button
                className="btn btn-primary"
                onClick={copyCredentials}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: copySuccess ? 'var(--success)' : undefined }}
              >
                {copySuccess ? <><CheckCircle size={16} /> Copiado!</> : <><Copy size={16} /> Copiar Credenciais</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── WHATSAPP MODAL ───────────────────────────────────────────────── */}
      {waModal && (
        <div className="modal-overlay" onClick={() => setWaModal(null)}>
          <div className="modal animate-scale-in" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
               <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--success-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageSquare size={20} color="var(--success)"/>
               </div>
               <div>
                  <h3 style={{ fontSize: 16, fontWeight: 900 }}>Chat de Conta (WhatsApp)</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Contato: {waModal.title} · {waModal.phone}</p>
               </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
               <div>
                  <label className="form-label">Conteúdo da Mensagem (N1)</label>
                  <textarea className="input" rows={5} placeholder="Olá! Aqui é a Magister..." value={waMessage} onChange={e => setWaMessage(e.target.value)} autoFocus />
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>A IA/Sistema assinará o seu nome antes do texto. Sujeito à auditoria visual dos líderes.</p>
               </div>
               <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                  <button className="btn btn-ghost" onClick={() => setWaModal(null)}>Cancelar</button>
                  <button className="btn btn-primary" style={{ background: 'var(--success)' }} onClick={sendWA} disabled={!waMessage || isSendingWA}>
                     {isSendingWA ? 'Transmitindo...' : <><MessageSquare size={16}/> Enviar Mensagem</>}
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
