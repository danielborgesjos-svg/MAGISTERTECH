import { useState, useRef, useEffect, useContext } from 'react';
import { Send, X, Hash } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { AuthContext } from '../contexts/AuthContext';

interface Props {
  compact?: boolean;
  onClose?: () => void;
}

export default function ChatGlobal({ compact = false, onClose }: Props) {
  const { chat, addMessage } = useData();
  const { user } = useContext(AuthContext);
  const [activeChannel, setActiveChannel] = useState('geral');
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const channel = chat.channels.find(c => c.id === activeChannel);
  const messages = channel?.messages || [];

  const userInitials = user?.name.substring(0, 2).toUpperCase() || 'US';
  const userName = user?.name.split(' ')[0] || 'Usuário';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, activeChannel]);

  const handleSend = () => {
    if (!text.trim()) return;
    addMessage(activeChannel, userInitials, userName, text.trim());
    setText('');
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const getInitialsColor = (initials: string) => `hsl(${initials.charCodeAt(0) * 40 + initials.charCodeAt(1) * 20}, 60%, 50%)`;

  if (!compact) {
    return (
      <div className="animate-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">Chat Interno</h1>
            <p className="page-subtitle">Comunicação em tempo real da equipe Magister</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 0, background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden', height: 'calc(100vh - 200px)', boxShadow: 'var(--shadow)' }}>
          <ChatSidebar chat={chat} activeChannel={activeChannel} setActiveChannel={setActiveChannel} />
          <ChatMain messages={messages} text={text} setText={setText} handleSend={handleSend} handleKey={handleKey} userInitials={userInitials} getInitialsColor={getInitialsColor} messagesEndRef={messagesEndRef} channel={channel} />
        </div>
      </div>
    );
  }

  // Compact mode (in drawer)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Compact Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 6px var(--success)' }} />
          <span style={{ fontSize: 13, fontWeight: 700 }}>Chat Interno</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {chat.channels.map(ch => (
              <button key={ch.id} onClick={() => setActiveChannel(ch.id)} title={ch.name} style={{
                background: activeChannel === ch.id ? 'var(--primary)' : 'var(--bg-subtle)',
                border: `1px solid ${activeChannel === ch.id ? 'var(--primary)' : 'var(--border)'}`,
                color: activeChannel === ch.id ? '#fff' : 'var(--text-muted)',
                borderRadius: 6, padding: '3px 8px', fontSize: 11, cursor: 'pointer', fontWeight: 600
              }}>#{ch.name}</button>
            ))}
          </div>
          {onClose && <button onClick={onClose} className="btn-icon" style={{ width: 26, height: 26 }}><X size={14} /></button>}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.map((msg, i) => {
          const isOwn = msg.author === userInitials;
          return (
            <div key={msg.id || i} style={{ display: 'flex', gap: 8, flexDirection: isOwn ? 'row-reverse' : 'row', alignItems: 'flex-end' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: getInitialsColor(msg.author), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                {msg.author}
              </div>
              <div style={{ maxWidth: '70%' }}>
                {!isOwn && <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2, fontWeight: 600 }}>{msg.authorName}</p>}
                <div style={{
                  padding: '8px 12px', borderRadius: isOwn ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  background: isOwn ? 'var(--primary)' : 'var(--bg-subtle)',
                  color: isOwn ? '#fff' : 'var(--text-main)',
                  fontSize: 13, lineHeight: 1.4
                }}>{msg.text}</div>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, textAlign: isOwn ? 'right' : 'left' }}>{msg.time}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
        <input style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 20, background: 'var(--bg-subtle)', color: 'var(--text-main)', fontSize: 13, outline: 'none' }}
          placeholder={`Mensagem em #${activeChannel}...`}
          value={text} onChange={e => setText(e.target.value)} onKeyDown={handleKey} />
        <button onClick={handleSend} style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--primary)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── SUB COMPONENTS ──────────────────────────────────────────────────────────

function ChatSidebar({ chat, activeChannel, setActiveChannel }: any) {
  return (
    <div style={{ background: 'var(--sidebar-bg)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '18px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <p style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>Magister Chat</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success)' }} />
          <span style={{ fontSize: 11, color: 'rgba(148,163,184,0.7)' }}>Online</span>
        </div>
      </div>
      <div style={{ padding: '14px 10px', flex: 1 }}>
        <p style={{ fontSize: 10, color: 'rgba(148,163,184,0.5)', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', padding: '0 8px', marginBottom: 8 }}>Canais</p>
        {chat.channels.map((ch: any) => (
          <button key={ch.id} onClick={() => setActiveChannel(ch.id)} style={{
            display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 12px',
            background: activeChannel === ch.id ? 'rgba(37,99,235,0.3)' : 'transparent',
            border: 'none', borderRadius: 8, cursor: 'pointer', color: activeChannel === ch.id ? '#fff' : 'rgba(148,163,184,0.8)',
            fontSize: 13, fontWeight: activeChannel === ch.id ? 600 : 400, transition: 'all 0.15s'
          }}>
            <Hash size={14} />
            {ch.name}
            {ch.messages.length > 0 && (
              <span style={{ marginLeft: 'auto', fontSize: 10, background: 'rgba(37,99,235,0.3)', color: '#93c5fd', padding: '1px 6px', borderRadius: 10 }}>{ch.messages.length}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChatMain({ messages, text, setText, handleSend, handleKey, userInitials, getInitialsColor, messagesEndRef, channel }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Channel Header */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Hash size={16} style={{ color: 'var(--text-muted)' }} />
        <span style={{ fontWeight: 700, fontSize: 15 }}>{channel?.name}</span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>·</span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{messages.length} mensagens</span>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {messages.map((msg: any, i: number) => {
          const isOwn = msg.author === userInitials;
          const showAuthor = i === 0 || messages[i - 1]?.author !== msg.author;
          return (
            <div key={msg.id || i} style={{ display: 'flex', gap: 12, flexDirection: isOwn ? 'row-reverse' : 'row', alignItems: 'flex-start' }}>
              {showAuthor && (
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: getInitialsColor(msg.author), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                  {msg.author}
                </div>
              )}
              {!showAuthor && <div style={{ width: 36, flexShrink: 0 }} />}
              <div style={{ maxWidth: '60%' }}>
                {showAuthor && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginBottom: 4, flexDirection: isOwn ? 'row-reverse' : 'row' }}>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{isOwn ? 'Você' : msg.authorName}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{msg.time}</span>
                  </div>
                )}
                <div style={{
                  padding: '10px 16px', borderRadius: isOwn ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                  background: isOwn ? 'var(--primary)' : 'var(--bg-subtle)',
                  color: isOwn ? '#fff' : 'var(--text-main)',
                  fontSize: 14, lineHeight: 1.5,
                  border: isOwn ? 'none' : '1px solid var(--border)'
                }}>
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'center' }}>
        <input style={{
          flex: 1, padding: '12px 16px', border: '1px solid var(--border)', borderRadius: 10,
          background: 'var(--bg-subtle)', color: 'var(--text-main)', fontSize: 14, outline: 'none',
          transition: 'all 0.2s'
        }} placeholder={`Mensagem em #${channel?.name || 'geral'}... (Enter para enviar)`}
          value={text} onChange={e => setText(e.target.value)} onKeyDown={handleKey}
          onFocus={e => { (e.target as HTMLElement).style.borderColor = 'var(--primary)'; (e.target as HTMLElement).style.boxShadow = '0 0 0 3px var(--primary-glow)'; }}
          onBlur={e => { (e.target as HTMLElement).style.borderColor = 'var(--border)'; (e.target as HTMLElement).style.boxShadow = 'none'; }}
        />
        <button onClick={handleSend} className="btn btn-primary" style={{ padding: '12px 20px', borderRadius: 10 }}>
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
