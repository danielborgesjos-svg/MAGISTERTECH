import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { 
  MessageSquare, 
  ChevronRight, 
  Send, ShieldCheck, LogOut, Phone, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MeusTickets() {
  const { tickets, addTicketMessage } = useData();
  const navigate = useNavigate();
  
  const [clientPhone, setClientPhone] = useState<string | null>(null);
  const [phoneInput, setPhoneInput] = useState('');
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
 
  // Sincroniza login (Apenas em memória para sessao aberta)
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const sanitized = phoneInput.replace(/\D/g, '');
    if (sanitized.length >= 8) {
      setClientPhone(sanitized);
    }
  };
 
  const handleLogout = () => {
    setClientPhone(null);
    setActiveTicketId(null);
  };

  const clientTickets = tickets.filter(t => t.clientWhastapp.replace(/\D/g, '').includes(clientPhone || 'NOMATCH'));
  const activeTicket = clientTickets.find(t => t.id === activeTicketId);

  const handleSendMessage = () => {
    if (!activeTicketId || !newMessage.trim()) return;
    addTicketMessage(activeTicketId, {
      authorName: activeTicket?.clientName || 'Cliente',
      text: newMessage,
      isInternal: false
    });
    setNewMessage('');
  };

  if (!clientPhone) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fc', padding: 20 }}>
        <div className="card animate-scale-in" style={{ maxWidth: 400, width: '100%', padding: 40, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--primary-glow)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Phone size={32} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>Acompanhar Chamados</h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 32 }}>Identifique-se com seu WhatsApp para ver o andamento das suas solicitações.</p>
          
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 20, textAlign: 'left' }}>
              <label className="form-label">WhatsApp (com DDD)</label>
              <input 
                className="input" 
                placeholder="Ex: 41999999999" 
                value={phoneInput}
                onChange={e => setPhoneInput(e.target.value)}
                autoFocus
              />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', height: 48 }}>Acessar Meu Painel</button>
          </form>
          <button className="btn btn-ghost" onClick={() => navigate('/suporte')} style={{ width: '100%', marginTop: 12 }}>Voltar</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fc', color: '#0f172a' }}>
      {/* Header */}
      <header style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '16px 0', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ShieldCheck size={24} color="var(--primary)" />
            <h1 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>Portal do Cliente</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>WhatsApp: {clientPhone}</span>
            <button className="btn-icon" onClick={handleLogout} title="Sair"><LogOut size={16} /></button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1000, margin: '32px auto', padding: '0 20px', display: 'grid', gridTemplateColumns: activeTicket ? '350px 1fr' : '1fr', gap: 24 }}>
        
        {/* List of Tickets */}
        <div className="animate-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800 }}>Meus Chamados</h2>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/suporte')}>Novo Chamado</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {clientTickets.length === 0 && (
              <div className="card" style={{ padding: 48, textAlign: 'center' }}>
                <MessageSquare size={40} style={{ margin: '0 auto 16px', opacity: 0.1 }} />
                <p style={{ color: 'var(--text-muted)' }}>Você ainda não tem chamados registrados.</p>
              </div>
            )}
            {clientTickets.map(t => (
              <div 
                key={t.id} 
                className="card" 
                onClick={() => setActiveTicketId(t.id)}
                style={{ 
                  padding: 20, cursor: 'pointer', transition: '0.2s', 
                  border: activeTicketId === t.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                  boxShadow: activeTicketId === t.id ? 'var(--shadow-lg)' : 'none'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: 'var(--primary)' }}>#{t.id}</span>
                  <span className={`badge ${t.status === 'resolvido' || t.status === 'fechado' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: 10 }}>
                    {t.status.toUpperCase()}
                  </span>
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>{t.subject}</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(t.createdAt).toLocaleDateString()}</span>
                  <ChevronRight size={16} color="var(--text-muted)" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ticket Details (Chat) */}
        {activeTicket && (
          <div className="card animate-in" style={{ height: 'calc(100vh - 160px)', display: 'flex', flexDirection: 'column', padding: 0 }}>
            <div style={{ padding: 20, borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: 17, fontWeight: 900 }}>{activeTicket.subject}</h3>
                <button className="btn-icon btn-sm" onClick={() => setActiveTicketId(null)}><X size={16}/></button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: '#f1f5f9', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 14 }}>
                <p style={{ fontWeight: 800, fontSize: 11, color: '#64748b', marginBottom: 8 }}>SOLICITAÇÃO ORIGINAL</p>
                {activeTicket.description}
              </div>

              {activeTicket.messages.filter(m => !m.isInternal).map(m => (
                <div 
                  key={m.id} 
                  style={{ 
                    alignSelf: m.authorName === 'Admin' ? 'flex-start' : 'flex-end',
                    maxWidth: '85%',
                    background: m.authorName === 'Admin' ? '#fff' : 'var(--primary)',
                    color: m.authorName === 'Admin' ? '#1e293b' : '#fff',
                    padding: '12px 16px',
                    borderRadius: 12,
                    boxShadow: 'var(--shadow-sm)',
                    border: m.authorName === 'Admin' ? '1px solid #e2e8f0' : 'none'
                  }}
                >
                  <p style={{ fontSize: 14, lineHeight: 1.5 }}>{m.text}</p>
                  <p style={{ fontSize: 10, marginTop: 4, opacity: 0.7, textAlign: 'right' }}>
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>

            <div style={{ padding: 20, borderTop: '1px solid var(--border)', display: 'flex', gap: 12 }}>
              <input 
                className="input" 
                placeholder="Escreva sua mensagem..." 
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
              />
              <button 
                className="btn btn-primary" 
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
