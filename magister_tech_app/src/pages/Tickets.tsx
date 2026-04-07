import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { 
  Search, Plus, 
  Clock, AlertCircle, 
  X, Send,
} from 'lucide-react';

export default function Tickets() {
  const { tickets, team, updateTicket, addTicketMessage, deleteTicket } = useData();
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
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      Aberto por <strong>{activeTicket.clientName}</strong> · {activeTicket.clientWhastapp}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn-icon" onClick={() => (confirm('Excluir ticket?') && deleteTicket(activeTicket.id))}><X size={16}/></button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 24, marginTop: 20 }}>
                  <div>
                    <p className="form-label">Status</p>
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
                    <p className="form-label">Responsável</p>
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
                    <p className="form-label">Prioridade</p>
                    <select 
                      className="input input-sm"
                      value={activeTicket.priority}
                      onChange={e => updateTicket(activeTicket.id, { priority: e.target.value as any })}
                    >
                      <option value="baixa">Baixa</option>
                      <option value="media">Média</option>
                      <option value="alta">Alta</option>
                      <option value="urgente">Urgente</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Chat View */}
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

              {/* Input */}
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
