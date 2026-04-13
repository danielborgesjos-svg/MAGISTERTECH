import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { 
  Search, Plus, 
  Clock, AlertCircle, 
  X, Send 
} from 'lucide-react';

export default function Tickets() {
  const { tickets, team, clients, updateTicket, addTicketMessage, deleteTicket, addTask, kanban, pipeline, addPipelineDeal } = useData();
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState('');

  const activeTicket = tickets.find(t => t.id === activeTicketId);

  const filteredTickets = tickets.filter(t => {
    const matchStatus = filterStatus === 'todos' || t.status === filterStatus;
    const matchSearch = !searchTerm || 
      t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  const handleSendMessage = () => {
    if (!activeTicketId || !newMessage.trim()) return;
    addTicketMessage(activeTicketId, {
      authorName: 'Admin', // Pegar do context de auth seria melhor
      text: newMessage,
      isInternal: false
    });
    setNewMessage('');
    // Se for o primeiro atendimento, muda status para aberto
    if (activeTicket?.status === 'novo') {
      updateTicket(activeTicketId, { status: 'aberto' });
    }
  };

  const statusColors = {
    novo: { bg: 'var(--primary-glow)', color: 'var(--primary)', label: 'Novo' },
    aberto: { bg: 'var(--success-glow)', color: 'var(--success)', label: 'Em Aberto' },
    pendente: { bg: 'var(--warning-glow)', color: 'var(--warning)', label: 'Pendente' },
    resolvido: { bg: 'var(--bg-subtle)', color: 'var(--text-muted)', label: 'Resolvido' },
    fechado: { bg: 'var(--bg-subtle)', color: 'var(--text-muted)', label: 'Fechado' }
  };

  const priorityColors = {
    baixa: '#94a3b8',
    media: '#3b82f6',
    alta: '#f59e0b',
    urgente: '#ef4444'
  };

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', margin: 0 }}>Central de Tickets</h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>Gestão de suporte e solicitações de clientes.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="search-bar" style={{ width: 300 }}>
            <Search size={16} color="var(--text-muted)" />
            <input 
              placeholder="Buscar por cliente ou assunto..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-primary"><Plus size={16} /> Novo Interno</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24, height: 'calc(100vh - 220px)' }}>
        
        {/* Left: Ticket List */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, overflowX: 'auto' }}>
            {['todos', 'novo', 'aberto', 'pendente', 'resolvido'].map(s => (
              <button 
                key={s}
                onClick={() => setFilterStatus(s)}
                style={{ 
                  padding: '6px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800, cursor: 'pointer',
                  border: 'none', background: filterStatus === s ? 'var(--primary)' : 'var(--bg-subtle)',
                  color: filterStatus === s ? '#fff' : 'var(--text-muted)', transition: '0.2s', textTransform: 'uppercase'
                }}
              >
                {s}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredTickets.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                <Clock size={32} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
                <p style={{ fontSize: 13 }}>Nenhum ticket encontrado.</p>
              </div>
            )}
            {filteredTickets.map(t => {
              const isActive = activeTicketId === t.id;
              const statusCfg = statusColors[t.status];
              return (
                <div 
                  key={t.id} 
                  onClick={() => setActiveTicketId(t.id)}
                  style={{ 
                    padding: '16px 20px', borderBottom: '1px solid var(--border)', cursor: 'pointer',
                    background: isActive ? 'var(--primary-glow)' : 'transparent',
                    borderLeft: isActive ? '4px solid var(--primary)' : '4px solid transparent',
                    transition: '0.15s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: statusCfg.color }}>
                      {statusCfg.label}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      {new Date(t.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 4, color: 'var(--text-main)' }}>{t.subject}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: priorityColors[t.priority] }} />
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.clientName}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Ticket Detail */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
          {activeTicket ? (
            <>
              {/* Detail Header */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 4 }}>{activeTicket.subject}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        Aberto por <strong>{activeTicket.clientName}</strong> · {activeTicket.clientWhastapp}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                     {/* BOTAO PARA CONVERTER/MANDAR PARA CRM OU KANBAN */}
                     <select className="btn btn-outline btn-sm" onChange={(e) => {
                       const pMap: any = { baixa: 'low', media: 'medium', alta: 'high', urgente: 'urgent' };
                       const engPriority = pMap[activeTicket.priority] || 'medium';

                       if (e.target.value === 'kanban' && kanban.length > 0) {
                          addTask(kanban[0].id, {
                            title: `[TICKET] ${activeTicket.subject}`,
                            priority: engPriority,
                            tag: 'Suporte',
                            description: activeTicket.description,
                            assignee: activeTicket.assigneeId || team[0]?.id || 'Sys'
                          });
                          alert('Ticket convertido em Tarefa (Kanban) com sucesso!');
                       } else if (e.target.value === 'pipeline' && pipeline.length > 0) {
                          addPipelineDeal(pipeline[0].id, {
                            title: `[TICKET] ${activeTicket.subject} - ${activeTicket.clientName}`,
                            priority: engPriority,
                            tag: 'Suporte/Expansão',
                            description: activeTicket.description,
                            value: 0,
                            assignee: activeTicket.assigneeId || team[0]?.id || 'Sys'
                          });
                          alert('Ticket enviado ao fluxo do Pipeline Comercial!');
                       }
                       // Reseta o select
                       e.target.value = '';
                     }}>
                        <option value="">Ações Rápidas</option>
                        <option value="kanban">Gerar Tarefa (Kanban)</option>
                        <option value="pipeline">Mandar para Pipeline (CRM)</option>
                     </select>
                    <button className="btn-icon" onClick={() => (confirm('Excluir ticket?') && deleteTicket(activeTicket.id))}><X size={16}/></button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 24, marginTop: 20 }}>
                  <div>
                    <p className="form-label">Status do Chamado</p>
                    <select 
                      className="input input-sm" 
                      value={activeTicket.status}
                      onChange={e => updateTicket(activeTicket.id, { status: e.target.value as any })}
                    >
                      <option value="novo">Novo</option>
                      <option value="aberto">Em Aberto</option>
                      <option value="pendente">Pendente</option>
                      <option value="resolvido">Resolvido</option>
                      <option value="fechado">Fechado</option>
                    </select>
                  </div>
                  <div>
                    <p className="form-label">Responsável / Encaminhar</p>
                    <select 
                      className="input input-sm"
                      value={activeTicket.assigneeId || ''}
                      onChange={e => updateTicket(activeTicket.id, { assigneeId: e.target.value })}
                    >
                      <option value="">Não atribuído</option>
                      {team.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="form-label">Vincular a uma Conta (CRM)</p>
                    <select 
                      className="input input-sm"
                      value={activeTicket.clientId || ''}
                      onChange={e => updateTicket(activeTicket.id, { clientId: e.target.value })}
                    >
                      <option value="">-- Vincular Cliente (Automático se houver) --</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.company} ({c.name})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

               {/* Split view if client is linked */}
              <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                <div style={{ flex: 2, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)' }}>
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                
                {/* Description "Message" */}
                <div style={{ background: 'var(--bg-subtle)', borderRadius: 12, padding: 16, border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 11, fontWeight: 900, marginBottom: 8, opacity: 0.5 }}>DESCRIÇÃO INICIAL</p>
                  <p style={{ fontSize: 14, lineHeight: 1.6 }}>{activeTicket.description}</p>
                </div>

                {/* Histórico */}
                {activeTicket.messages.map(m => (
                  <div key={m.id} style={{ 
                    alignSelf: m.isInternal ? 'center' : 'flex-end', 
                    maxWidth: '80%', 
                    background: m.isInternal ? 'rgba(124, 58, 237, 0.05)' : 'var(--primary)',
                    color: m.isInternal ? 'var(--text-main)' : '#fff',
                    padding: '12px 16px',
                    borderRadius: 12,
                    border: m.isInternal ? '1px dashed var(--primary)' : 'none'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, gap: 20 }}>
                      <span style={{ fontSize: 10, fontWeight: 900 }}>{m.authorName}</span>
                      <span style={{ fontSize: 10, opacity: 0.7 }}>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}</span>
                    </div>
                    <p style={{ fontSize: 14 }}>{m.text}</p>
                  </div>
                ))}
              </div>

                   <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <input 
                        className="input" 
                        placeholder="Escreva uma resposta para o cliente ou nota interna..." 
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                      />
                    </div>
                    <button className="btn btn-primary" onClick={handleSendMessage} disabled={!newMessage.trim()}>
                      <Send size={16} /> Enviar
                    </button>
                  </div>
                </div>
                
                {/* 360 Client View */}
                {activeTicket.clientId && (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-subtle)', overflowY: 'auto' }}>
                     <div style={{ padding: '24px' }}>
                        <h4 style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>Visão do Cliente</h4>
                        {(() => {
                           const c = clients.find(cl => cl.id === activeTicket.clientId);
                           if(!c) return <p>Conta não encontrada.</p>;
                           return (
                             <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                               <div className="card" style={{ padding: 16 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14 }}>
                                      {c.company.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                      <p style={{ fontWeight: 800 }}>{c.company}</p>
                                      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.segment}</p>
                                    </div>
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                                    <p><strong>Contato:</strong> {c.name}</p>
                                    <p><strong>Telefone:</strong> {c.phone}</p>
                                    <p><strong>Email:</strong> {c.email}</p>
                                  </div>
                               </div>
                               <div className="card" style={{ padding: 16, borderLeft: c.status === 'ativo' ? '4px solid var(--success)' : '4px solid var(--warning)' }}>
                                  <p style={{ fontWeight: 800, marginBottom: 4 }}>Status Ativo CRM</p>
                                  <span className="badge" style={{ background: c.status === 'ativo' ? 'var(--success-glow)' : 'var(--warning-glow)', color: c.status === 'ativo' ? 'var(--success)' : 'var(--warning)' }}>ESTADO: {c.status.toUpperCase()}</span>
                                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>Último contato: {new Date(c.lastContact).toLocaleDateString('pt-BR')}</p>
                               </div>
                             </div>
                           );
                        })()}
                     </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <HelpCircle size={32} opacity={0.5} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800 }}>Selecione um chamado</h3>
              <p style={{ fontSize: 14 }}>Clique em um ticket à esquerda para ver os detalhes.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function HelpCircle({ size, opacity }: { size: number, opacity: number }) {
  return (
    <div style={{ opacity }}>
      <AlertCircle size={size} />
    </div>
  );
}
