import { useState, useEffect, useRef } from 'react';
import { 
  RefreshCw, Download, Loader2, MessageSquare, 
  Send, Search, Flame, 
  MoreVertical, Smile, Paperclip, Mic, CheckCheck, Wifi
} from 'lucide-react';

type WAStatus = 'disconnected' | 'qr_ready' | 'connecting' | 'connected' | 'auth_failure';

interface WAMessage {
  id: string;
  author: string;
  text: string;
  time: string;
  timestamp: number;
  fromMe: boolean;
  status?: 'sent' | 'delivered' | 'read';
}

interface WAState {
  status: WAStatus;
  qrDataUrl: string | null;
  phone: string | null;
  contacts: { id: string; name: string; phone: string }[];
  recentMessages: { [chatId: string]: WAMessage[] };
}

export default function Conectividade() {
  const [wa, setWa] = useState<WAState>({ status: 'disconnected', qrDataUrl: null, phone: null, contacts: [], recentMessages: {} });
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ created: number; skipped: number } | null>(null);
  const [loadingStart, setLoadingStart] = useState(false);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [converting, setConverting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const token = localStorage.getItem('magister_token');

  useEffect(() => {
    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [wa.recentMessages, selectedChat]);

  const poll = async () => {
    try {
      const res = await fetch('/api/whatsapp/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWa(data);
      }
    } catch {}
  };

  const handleStart = async () => {
    setLoadingStart(true);
    try {
      await fetch('/api/whatsapp/start', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      await poll();
    } finally { setLoadingStart(false); }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/whatsapp/sync-contacts', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setSyncResult({ created: data.created, skipped: data.skipped });
        await poll();
      }
    } finally { setSyncing(false); }
  };

  const sendMessage = async () => {
    if (!selectedChat || !messageInput.trim()) return;
    const phone = selectedChat.split('@')[0];
    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message: messageInput })
      });
      if (res.ok) {
        setMessageInput('');
        await poll();
      }
    } catch (err) { console.error('Erro ao enviar:', err); }
  };

  const handleConvertToLead = async () => {
    const activeContact = wa.contacts.find(c => c.id === selectedChat);
    if (!activeContact) return;

    setConverting(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Lead: ${activeContact.name}`,
          description: `Conversão direta do Cockpit WA: ${activeContact.phone}`,
          status: 'lead',
          priority: 'ALTA',
          tipo: 'tarefa',
          tags: 'WhatsApp'
        })
      });
      if (res.ok) {
        alert('Lead convertido estrategicamente para o Pipeline! 🔥🚀');
        setConverting(false);
      }
    } catch (err) {
      console.error('Falha na conversão:', err);
      setConverting(false);
    }
  };

  const activeContact = wa.contacts.find(c => c.id === selectedChat);
  const filteredContacts = wa.contacts.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  // WhatsApp Doodle Background (CSS Pattern)
  const waDoodleStyle: React.CSSProperties = {
    backgroundColor: '#efe7de',
    backgroundImage: `url("https://www.transparenttextures.com/patterns/cubes.png")`, // Simulação de textura
    opacity: 0.8
  };

  if (wa.status !== 'connected') {
    return (
      <div className="animate-in" style={{ height: 'calc(100vh - 120px)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-subtle)' }}>
        <div className="card" style={{ maxWidth: 460, padding: 48, textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', borderRadius: 24 }}>
          <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--primary-glow))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
            <MessageSquare size={48} color="#fff" />
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 16 }}>WhatsApp Engine Pro</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 40, lineHeight: 1.6 }}>Conecte seu dispositivo para gerenciar atendimentos operacionais e alimente seu pipeline em tempo real.</p>
          
          {wa.status === 'qr_ready' && wa.qrDataUrl ? (
            <div style={{ background: '#fff', padding: 24, borderRadius: 20, boxShadow: '0 10px 30px rgba(0,0,0,0.05)', marginBottom: 32, display: 'inline-block' }}>
               <img src={wa.qrDataUrl} style={{ width: 220, height: 220 }} alt="QR Code" />
               <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginTop: 12 }}>ESCANEIE COM DISPOSITIVOS VINCULADOS</p>
            </div>
          ) : null}

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <button className="btn btn-primary btn-lg" style={{ borderRadius: 12, padding: '0 32px', height: 52 }} onClick={handleStart} disabled={loadingStart || wa.status === 'connecting'}>
              {loadingStart ? <Loader2 className="animate-spin" /> : 'Inicializar Motor'}
            </button>
            <button className="btn btn-ghost btn-lg" onClick={poll}><RefreshCw size={18} /></button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in" style={{ height: 'calc(100vh - 110px)', display: 'grid', gridTemplateColumns: '400px 1fr', gap: 0, borderRadius: 20, overflow: 'hidden', border: '1px solid var(--border)', boxShadow: '0 15px 40px rgba(0,0,0,0.1)' }}>
      {/* Sidebar - Contacts */}
      <div style={{ borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--bg-card)' }}>
        <div style={{ padding: '24px 20px', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontSize: 22, fontWeight: 900 }}>Conversas</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-icon" onClick={handleSync} title="Sincronizar Leads">
                {syncing ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
              </button>
              <button className="btn-icon"><MoreVertical size={18} /></button>
            </div>
          </div>
          <div className="search-box" style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              className="input" 
              placeholder="Pesquisar ou começar uma nova conversa" 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ paddingLeft: 42, height: 44, fontSize: 14, borderRadius: 10, background: 'var(--bg-card)' }} 
            />
          </div>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-card)' }}>
          {filteredContacts.map(c => {
            const lastMsg = wa.recentMessages[c.id]?.[wa.recentMessages[c.id].length - 1];
            return (
              <div 
                key={c.id} 
                onClick={() => setSelectedChat(c.id)}
                style={{ 
                  padding: '16px 20px', 
                  display: 'flex', 
                  gap: 14, 
                  cursor: 'pointer',
                  background: selectedChat === c.id ? 'var(--bg-subtle)' : 'transparent',
                  borderBottom: '1px solid rgba(0,0,0,0.03)',
                  transition: '0.15s ease'
                }}
              >
                <div className="avatar" style={{ width: 52, height: 52, background: `hsl(${c.phone.slice(-3)}deg, 45%, 55%)`, color: '#fff', fontSize: 20, fontWeight: 800 }}>
                  {c.name.substring(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{lastMsg?.time || ''}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {lastMsg?.fromMe && <CheckCheck size={14} color="var(--primary)" />}
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {lastMsg ? lastMsg.text : `+${c.phone}`}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Chat Area */}
      {selectedChat ? (
        <div style={{ display: 'flex', flexDirection: 'column', ...waDoodleStyle, position: 'relative' }}>
          {/* Chat Header */}
          <div style={{ padding: '12px 24px', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="avatar" style={{ width: 44, height: 44, background: `hsl(${activeContact?.phone.slice(-3)}deg, 45%, 55%)`, color: '#fff' }}>
                {activeContact?.name.substring(0, 2).toUpperCase()}
              </div>
              <div onClick={() => alert('Dados do contato...')}>
                <h4 style={{ margin: 0, fontSize: 17, fontWeight: 900 }}>{activeContact?.name}</h4>
                <div style={{ fontSize: 12, color: 'var(--success)', fontWeight: 700 }}>disponível no cockpit</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button 
                className={`btn ${converting ? 'loading' : ''}`}
                style={{ 
                  background: 'linear-gradient(135deg, #FF3CAC, #784BA0, #2B86C5)', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: 30,
                  padding: '0 20px',
                  height: 40,
                  fontSize: 13,
                  fontWeight: 900,
                  boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer'
                }}
                disabled={converting}
                onClick={handleConvertToLead}
              >
                {converting ? <Loader2 size={16} className="animate-spin" /> : <Flame size={16} />}
                JET: CONVERTER EM LEAD
              </button>
              <button className="btn-icon"><Search size={20} /></button>
              <button className="btn-icon"><MoreVertical size={20} /></button>
            </div>
          </div>

          {/* Messages Area - Authentique WA Style */}
          <div style={{ flex: 1, padding: '20px 60px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(wa.recentMessages[selectedChat] || []).map((m, idx) => {
              const prevType = idx > 0 ? wa.recentMessages[selectedChat][idx-1].fromMe : null;
              const isStartOfGroup = prevType !== m.fromMe;

              return (
                <div 
                  key={m.id} 
                  style={{ 
                    alignSelf: m.fromMe ? 'flex-end' : 'flex-start', 
                    maxWidth: '65%', 
                    background: m.fromMe ? '#d9fdd3' : '#ffffff', 
                    color: '#111b21', 
                    padding: '6px 10px 8px 10px', 
                    borderRadius: m.fromMe ? '8px 8px 0 8px' : '8px 8px 8px 0', 
                    boxShadow: '0 1px 1px rgba(0,0,0,0.1)', 
                    position: 'relative',
                    marginTop: isStartOfGroup ? 8 : 2,
                    fontSize: 14.2,
                    lineHeight: 1.4,
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                   {/* Mensagem text */}
                   <span style={{ marginRight: 50 }}>{m.text}</span>
                   
                   {/* Meta-info inside bubble bottom right */}
                   <div style={{ alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: 4, marginTop: -10, marginLeft: 'auto' }}>
                     <span style={{ fontSize: 10, color: '#667781', fontWeight: 500 }}>{m.time}</span>
                     {m.fromMe && <CheckCheck size={14} color="#53bdeb" />}
                   </div>
                   
                   {/* Tail simulation for start of groups */}
                   {isStartOfGroup && (
                     <div style={{ 
                       position: 'absolute', 
                       top: 0, 
                       [m.fromMe ? 'right' : 'left']: -8,
                       width: 0,
                       height: 0,
                       borderStyle: 'solid',
                       borderWidth: m.fromMe ? '0 10px 10px 0' : '0 0 10px 10px',
                       borderColor: `transparent ${m.fromMe ? '#d9fdd3' : '#ffffff'} transparent transparent`,
                       transform: m.fromMe ? 'none' : 'rotate(-90deg)',
                       display: 'none' // Simplificado sem tails reais para manter estabilidade visual no grid
                     }} />
                   )}
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Premium Footer Input Area */}
          <div style={{ padding: '10px 24px', background: '#f0f2f5', display: 'flex', alignItems: 'center', gap: 16, zIndex: 10 }}>
            <div style={{ display: 'flex', gap: 12, color: '#54656f' }}>
              <Smile size={24} style={{ cursor: 'pointer' }} />
              <Paperclip size={24} style={{ cursor: 'pointer' }} />
            </div>
            <div style={{ flex: 1 }}>
              <input 
                className="input" 
                placeholder="Mensagem operacional rápida..." 
                value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                style={{ 
                  width: '100%', 
                  height: 44, 
                  borderRadius: 8, 
                  background: '#fff', 
                  border: 'none', 
                  padding: '12px 16px',
                  fontSize: 15,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }} 
              />
            </div>
            {messageInput.trim() ? (
              <button 
                onClick={sendMessage}
                style={{ background: 'var(--primary)', color: '#fff', border: 'none', width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.2s' }}
              >
                <Send size={20} style={{ marginLeft: 2 }} />
              </button>
            ) : (
              <Mic size={24} color="#54656f" style={{ cursor: 'pointer' }} />
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-muted)', background: 'var(--bg-subtle)' }}>
          <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32, boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
            <MessageSquare size={56} style={{ color: 'var(--primary)', opacity: 0.8 }} />
          </div>
          <h2 style={{ fontWeight: 900, color: 'var(--text-main)', marginBottom: 12 }}>Magister Cockpit · WhatsApp Pro</h2>
          <p style={{ fontSize: 15, maxWidth: 350, textAlign: 'center', lineHeight: 1.6 }}>Selecione uma conversa ao lado para iniciar um atendimento operacional integrado.</p>
          <div style={{ marginTop: 40, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--success)', fontSize: 13, fontWeight: 700 }}>
             <Wifi size={14} /> Sistema Conectado e Criptografado
          </div>
          {syncResult && (
            <div style={{ marginTop: 24, padding: '12px 20px', background: 'var(--success-glow)', borderRadius: 12, border: '1px solid var(--success)' }}>
              <span style={{ fontWeight: 800 }}>✓ {syncResult.created} Leads sincronizados no Pipeline!</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
