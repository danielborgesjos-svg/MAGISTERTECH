import { useState, useContext } from 'react';
import {
  Search, Plus, MoreVertical, X, User, Building2,
  Mail, Phone, Tag, Globe, StickyNote, FileText,
  Briefcase, ChevronRight, Archive, MessageSquare, CheckCircle
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import type { Client } from '../contexts/DataContext';
import { AuthContext } from '../contexts/AuthContext';

const STATUS_LABELS: Record<string, string> = {
  ativo: 'Ativo', inativo: 'Inativo', prospect: 'Prospect'
};
const STATUS_BADGE: Record<string, string> = {
  ativo: 'badge-success', inativo: 'badge-muted', prospect: 'badge-warning'
};

const SEGMENTS = ['Software', 'Gestão', 'E-commerce', 'Consultoria', 'Saúde', 'Educação', 'Marketing', 'Outro'];
const ORIGINS = ['Indicação', 'LinkedIn', 'Google Ads', 'Cold Outreach', 'Evento', 'Site', 'Outro'];

export default function Clientes() {
  const { clients, contracts, projects, addClient, updateClient, addClientNote } = useData();
  const { user } = useContext(AuthContext);

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

  const filtered = clients.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleAdd = () => {
    if (!form.name || !form.company) return;
    if (isEditingForm && selectedClient) {
      updateClient(selectedClient.id, form);
      const updatedClient = { ...selectedClient, ...form };
      setSelectedClient(updatedClient);
    } else {
      addClient(form);
    }
    setForm({ name: '', company: '', email: '', phone: '', segment: 'Software', status: 'prospect', origin: 'Site' });
    setShowForm(false);
    setIsEditingForm(false);
  };

  const handleAddNote = () => {
    if (!noteText.trim() || !selectedClient) return;
    addClientNote(selectedClient.id, noteText, user?.name || 'Sistema');
    setNoteText('');
    setSelectedClient(clients.find(c => c.id === selectedClient.id) || selectedClient);
  };

  const clientContracts = selectedClient ? contracts.filter(c => c.clientId === selectedClient.id) : [];
  const clientProjects = selectedClient ? projects.filter(p => p.clientId === selectedClient.id) : [];

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestão de Clientes</h1>
          <p className="page-subtitle">CRM — Gerencie contas, histórico e relacionamentos</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm({ name: '', company: '', email: '', phone: '', segment: 'Software', status: 'prospect', origin: 'Site' }); setIsEditingForm(false); setShowForm(true); }}><Plus size={16} /> Novo Cliente</button>
      </div>

      {/* Stats Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Clientes Ativos', value: clients.filter(c => c.status === 'ativo').length, color: 'var(--success)' },
          { label: 'Prospects', value: clients.filter(c => c.status === 'prospect').length, color: 'var(--warning)' },
          { label: 'Total', value: clients.length, color: 'var(--primary)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</p>
            <p style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-bar" style={{ flex: 1, minWidth: 240 }}>
            <Search size={14} style={{ color: 'var(--text-light)' }} />
            <input placeholder="Buscar por nome, empresa ou email..." value={search} onChange={e => setSearch(e.target.value)} />
            {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}><X size={14} /></button>}
          </div>
          <div className="tab-list" style={{ width: 'auto' }}>
            {[['all', 'Todos'], ['ativo', 'Ativos'], ['prospect', 'Prospects'], ['inativo', 'Inativos']].map(([val, label]) => (
              <button key={val} className={`tab-btn ${filterStatus === val ? 'active' : ''}`} onClick={() => setFilterStatus(val)} style={{ padding: '7px 14px', flex: 'unset' }}>{label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Empresa / Cliente</th>
                <th>Contato</th>
                <th>Segmento</th>
                <th>Origem</th>
                <th>Último Contato</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7}><div className="empty-state"><User size={36} /><h3>Nenhum cliente encontrado</h3><button className="btn btn-primary btn-sm" onClick={() => { setIsEditingForm(false); setShowForm(true); }}><Plus size={14} /> Adicionar primeiro cliente</button></div></td></tr>
              )}
              {filtered.map(client => (
                <tr key={client.id} style={{ cursor: 'pointer' }} onClick={() => { setSelectedClient(client); setActiveTab('resumo'); }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className="avatar avatar-sm" style={{ background: `hsl(${client.id.length * 40}, 65%, 50%)` }}>
                        {client.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: 13 }}>{client.company}</p>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{client.name}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <p style={{ fontSize: 13 }}>{client.email}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{client.phone}</p>
                  </td>
                  <td><span className="badge badge-primary">{client.segment}</span></td>
                  <td><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{client.origin}</span></td>
                  <td><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(client.lastContact).toLocaleDateString('pt-BR')}</span></td>
                  <td><span className={`badge ${STATUS_BADGE[client.status]}`}>{STATUS_LABELS[client.status]}</span></td>
                  <td>
                    <div style={{ position: 'relative' }} onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === client.id ? null : client.id); }}>
                      <button className="btn-icon"><MoreVertical size={15} /></button>
                      {menuOpen === client.id && (
                        <div style={{ position: 'absolute', right: 0, top: '100%', zIndex: 10, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, boxShadow: 'var(--shadow)', minWidth: 180, padding: 4 }}>
                          <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', borderColor: 'transparent' }} onClick={() => { setSelectedClient(client); setActiveTab('resumo'); setMenuOpen(null); }}><ChevronRight size={14} /> Ver detalhes</button>
                          <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', borderColor: 'transparent' }} onClick={() => { updateClient(client.id, { status: 'inativo' }); setMenuOpen(null); }}><Archive size={14} /> Arquivar</button>
                          <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', borderColor: 'transparent' }} onClick={() => { setSelectedClient(client); setActiveTab('notas'); setMenuOpen(null); }}><StickyNote size={14} /> Adicionar nota</button>
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
          <div className="modal" style={{ maxWidth: 720 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div className="avatar avatar-lg" style={{ background: `hsl(${selectedClient.id.length * 40}, 65%, 50%)` }}>
                  {selectedClient.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 800 }}>{selectedClient.company}</h2>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{selectedClient.name} · {selectedClient.email}</p>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setSelectedClient(null)}><X size={18} /></button>
            </div>

            {/* Tabs */}
            <div style={{ padding: '0 28px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', gap: 0 }}>
                {[['resumo', '📌 Resumo'], ['contratos', '📄 Contratos'], ['projetos', '📊 Projetos'], ['notas', '💬 Notas']].map(([tab, label]) => (
                  <button key={tab} onClick={() => setActiveTab(tab)} style={{
                    padding: '12px 16px', border: 'none', background: 'transparent', cursor: 'pointer',
                    fontSize: 13, fontWeight: 600, color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)',
                    borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                    transition: 'var(--transition)'
                  }}>{label}</button>
                ))}
              </div>
            </div>

            <div className="modal-body" style={{ maxHeight: 440, overflowY: 'auto' }}>
              {activeTab === 'resumo' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {[
                    { icon: Building2, label: 'Empresa', value: selectedClient.company },
                    { icon: User, label: 'Responsável', value: selectedClient.name },
                    { icon: Mail, label: 'Email', value: selectedClient.email },
                    { icon: Phone, label: 'Telefone', value: selectedClient.phone },
                    { icon: Tag, label: 'Segmento', value: selectedClient.segment },
                    { icon: Globe, label: 'Origem', value: selectedClient.origin },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px', background: 'var(--bg-subtle)', borderRadius: 8 }}>
                      <Icon size={16} style={{ color: 'var(--primary)', marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{label}</p>
                        <p style={{ fontSize: 14, fontWeight: 600 }}>{value}</p>
                      </div>
                    </div>
                  ))}
                  <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8 }}>
                    <span className={`badge ${STATUS_BADGE[selectedClient.status]}`}>{STATUS_LABELS[selectedClient.status]}</span>
                    <span className="badge badge-muted">Desde {new Date(selectedClient.createdAt).toLocaleDateString('pt-BR')}</span>
                    <span className="badge badge-primary">{selectedClient.segment}</span>
                  </div>
                  <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => { setForm({ name: selectedClient.name, company: selectedClient.company, email: selectedClient.email, phone: selectedClient.phone, segment: selectedClient.segment, status: selectedClient.status, origin: selectedClient.origin }); setIsEditingForm(true); setShowForm(true); }}>Editar Dados</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => updateClient(selectedClient.id, { status: 'ativo' })}><CheckCircle size={13} /> Marcar Ativo</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => updateClient(selectedClient.id, { status: 'inativo' })}><Archive size={13} /> Arquivar</button>
                  </div>
                </div>
              )}

              {activeTab === 'contratos' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {clientContracts.length === 0 ? <div className="empty-state" style={{ padding: '24px 0' }}><FileText size={28} /><p>Nenhum contrato vinculado</p></div> : (
                    clientContracts.map(contract => (
                      <div key={contract.id} style={{ padding: '14px 16px', background: 'var(--bg-subtle)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border)' }}>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: 13 }}>{contract.title}</p>
                          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{contract.recurrence} · Até {new Date(contract.endDate).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontWeight: 800, color: 'var(--success)', fontSize: 16 }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contract.value)}</p>
                          <span className={`badge ${contract.status === 'ativo' ? 'badge-success' : contract.status === 'vencendo' ? 'badge-warning' : 'badge-muted'}`}>{contract.status}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'projetos' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {clientProjects.length === 0 ? <div className="empty-state" style={{ padding: '24px 0' }}><Briefcase size={28} /><p>Nenhum projeto vinculado</p></div> : (
                    clientProjects.map(project => (
                      <div key={project.id} style={{ padding: '14px 16px', background: 'var(--bg-subtle)', borderRadius: 8, border: `1px solid var(--border)`, borderLeft: `4px solid ${project.color}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <p style={{ fontWeight: 700, fontSize: 13 }}>{project.name}</p>
                          <span className="badge" style={{ background: `${project.color}20`, color: project.color }}>{project.status}</span>
                        </div>
                        <div className="progress-track">
                          <div className="progress-fill" style={{ width: `${project.progress}%`, background: project.color }} />
                        </div>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{project.progress}% concluído</p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'notas' && (
                <div>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                    <textarea className="input" style={{ flex: 1, minHeight: 70, resize: 'none' }} placeholder="Escreva uma nota sobre este cliente..." value={noteText} onChange={e => setNoteText(e.target.value)} />
                    <button className="btn btn-primary" onClick={handleAddNote} style={{ alignSelf: 'flex-end' }}><MessageSquare size={14} /> Salvar</button>
                  </div>
                  {selectedClient.notes.length === 0 ? <div className="empty-state" style={{ padding: '16px 0' }}><StickyNote size={28} /><p>Sem notas ainda</p></div> : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {selectedClient.notes.map(note => (
                        <div key={note.id} style={{ padding: '12px 16px', background: 'var(--bg-subtle)', borderRadius: 8, borderLeft: '3px solid var(--primary)' }}>
                          <p style={{ fontSize: 13, marginBottom: 6 }}>{note.text}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{note.author} · {new Date(note.createdAt).toLocaleDateString('pt-BR')}</p>
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
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>{isEditingForm ? 'Editar Cliente' : 'Novo Cliente'}</h2>
              <button className="btn-icon" onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Nome do Responsável *</label>
                  <input className="input" placeholder="Ex: Daniel Borges" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Empresa *</label>
                  <input className="input" placeholder="Ex: Cinepasse Labs" value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Email</label>
                  <input className="input" type="email" placeholder="email@empresa.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Telefone</label>
                  <input className="input" placeholder="(11) 99999-9999" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Segmento</label>
                  <select className="input" value={form.segment} onChange={e => setForm(p => ({ ...p, segment: e.target.value }))}>
                    {SEGMENTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Origem</label>
                  <select className="input" value={form.origin} onChange={e => setForm(p => ({ ...p, origin: e.target.value }))}>
                    {ORIGINS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Status Inicial</label>
                  <div className="tab-list" style={{ width: '100%' }}>
                    {(['prospect', 'ativo'] as const).map(s => (
                      <button key={s} className={`tab-btn ${form.status === s ? 'active' : ''}`} onClick={() => setForm(p => ({ ...p, status: s }))} style={{ textTransform: 'capitalize' }}>{s}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleAdd} disabled={!form.name || !form.company}>{isEditingForm ? 'Atualizar Cliente' : <><Plus size={14}/> Criar Cliente</>}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
