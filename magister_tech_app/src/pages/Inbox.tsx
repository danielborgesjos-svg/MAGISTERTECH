import { useState, useRef, useEffect } from 'react';
import {
  Search, MoreVertical, MessageSquare, Phone, Video, Info,
  CheckCheck, Clock, Paperclip, Smile, Send, X,
  Users, Bell, Filter, ChevronRight,
  ArrowRight, Plus
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useNavigate } from 'react-router-dom';

const EMOJIS = ['😀','😂','❤️','👍','🙏','🔥','✅','💬','📊','🚀','⚡','💡','🎯','📌','💰'];

const QUICK_REPLIES = [
  'Olá! Como posso te ajudar hoje?',
  'Obrigado pelo contato! Vou verificar e retorno em breve.',
  'Perfeito! Posso agendar uma reunião para conversarmos melhor?',
  'Enviei o orçamento por e-mail, pode verificar?',
  'Estamos processando sua solicitação. Aguarde.',
];

type Msg = {
  id: string;
  text: string;
  isSender: boolean;
  time: Date;
  status: 'sent' | 'delivered' | 'read';
  replyTo?: string;
};

type TabVal = 'all' | 'unread' | 'groups';

export default function Inbox() {
  const { clients, addPipelineDeal, waState, sendWAMessage: apiSendWA, addTicket } = useData();
  const navigate = useNavigate();
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabVal>('all');
  const [showInfo, setShowInfo] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showQuick, setShowQuick] = useState(false);
  const [showMassModal, setShowMassModal] = useState(false);
  const [selectedForMass, setSelectedForMass] = useState<string[]>([]);
  const [massMessage, setMassMessage] = useState('');
  const [replyTo, setReplyTo] = useState<any | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Mapear contatos: WhatsApp + Dados do CRM se existir
  const contacts = waState.contacts.map(waContact => {
    const crmMatch = clients.find(c => c.phone && c.phone.replace(/\D/g, '').includes(waContact.phone.replace(/\D/g, '')));
    return {
      id: waContact.id,
      name: crmMatch?.name || waContact.name,
      company: crmMatch?.company || waContact.name,
      phone: waContact.phone,
      status: crmMatch?.status || 'desconhecido',
      crmId: crmMatch?.id
    };
  });

  const activeContact = contacts.find(c => c.id === activeChat);
  const rawHistory = activeChat ? waState.recentMessages[activeChat] || [] : [];
  
  // Converte WAMessage para o formato Msg esperado pelo componente
  const chatMessages: Msg[] = rawHistory.map(m => ({
    id: m.id,
    text: m.text,
    isSender: m.fromMe,
    time: new Date(m.timestamp),
    status: 'read' as const,
  }));

  const filtered = contacts.filter(c => {
    const matchSearch = !searchTerm ||
      c.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone || '').includes(searchTerm);
    return matchSearch;
  });

  useEffect(() => {
    if (chatMessages.length > 0) {
      const lastMsg = chatMessages[chatMessages.length - 1];
      // Tocar som se a última mensagem não for minha
      if (!lastMsg.isSender) {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
        audio.play().catch(() => {}); // Browser pode bloquear auto-play sem interação
      }
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, activeChat]);

  const sendMessage = async (text?: string) => {
    const txt = text || message;
    if (!activeChat || !txt.trim() || !activeContact) return;

    setMessage('');
    setReplyTo(null);
    setShowEmoji(false);
    setShowQuick(false);
    setIsSending(true);

    try {
      await apiSendWA(activeContact.phone, txt);
    } catch (_) { /* erro tratado no context */ }
    finally { setIsSending(false); }
  };

  const sendMass = async () => {
    if (!massMessage.trim() || selectedForMass.length === 0) return;
    for (const cid of selectedForMass) {
      const c = contacts.find(x => x.id === cid);
      if (!c) continue;
      try { await apiSendWA(c.phone, massMessage); } catch (_) {}
    }
    setShowMassModal(false);
    setMassMessage('');
    setSelectedForMass([]);
  };

  const handleMoveToFlow = () => {
    if (!activeContact || !addPipelineDeal) return;
    addPipelineDeal('lead', { 
      title: `Lead: ${activeContact.company}`, 
      assignee: 'Não Atribuído',
      priority: 'high',
      tag: 'WhatsApp',
      description: `Iniciado via WhatsApp Inbox N1. Telefone: ${activeContact.phone}`,
      phone: activeContact.phone
    });
    navigate('/admin/pipeline');
  };

  const handleCreateTicket = () => {
    if (!activeContact) return;
    const history = waState.recentMessages[activeContact.id] || [];
    const lastMsgs = history.slice(-5).map(m => `${m.fromMe ? 'Eu' : 'Cliente'}: ${m.text}`).join('\n');
    
    addTicket({
      clientName: activeContact.company,
      clientWhastapp: activeContact.phone,
      subject: `Suporte via WhatsApp: ${activeContact.company}`,
      description: `Ticket gerado a partir do chat.\n\nÚltimas mensagens:\n${lastMsgs}`,
      category: 'suporte',
      priority: 'media'
    });
    
    alert('Ticket gerado com sucesso!');
    navigate('/admin/tickets');
  };

  const StatusIcon = ({ status }: { status: Msg['status'] }) => {
    if (status === 'sent') return <Clock size={10} color="var(--text-muted)" />;
    if (status === 'delivered') return <CheckCheck size={10} color="var(--text-muted)" />;
    return <CheckCheck size={10} color="var(--primary)" />;
  };

  return (
    <div style={{ height: 'calc(100vh - 80px)', display: 'flex', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>

      {/* ── COL 1: SIDEBAR CONTACTS ──────────────────────── */}
      <div style={{ width: 340, background: 'var(--bg-card)', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)', flexShrink: 0 }}>

        {/* Header */}
        <div style={{ padding: '14px 16px', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 14 }}>MT</div>
            <div>
              <p style={{ fontWeight: 800, fontSize: 14, lineHeight: 1.2 }}>CRM Inbox N1</p>
              <p style={{ fontSize: 11, color: 'var(--success)', fontWeight: 700 }}>● Online</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="btn-icon btn-sm" title="Mensagem em Massa" onClick={() => setShowMassModal(true)}><Users size={17}/></button>
            <button className="btn-icon btn-sm"><Bell size={17}/></button>
            <button className="btn-icon btn-sm"><MoreVertical size={17}/></button>
          </div>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
          {([['all','Todas'], ['unread','Não Lidas'], ['groups','Grupos']] as [TabVal, string][]).map(([val, label]) => (
            <button key={val} onClick={() => setActiveTab(val)}
              style={{ flex: 1, padding: '10px 0', fontSize: 12, fontWeight: 800, cursor: 'pointer', border: 'none',
                background: 'transparent', color: activeTab === val ? 'var(--primary)' : 'var(--text-muted)',
                borderBottom: `2px solid ${activeTab === val ? 'var(--primary)' : 'transparent'}`, transition: 'all 0.2s' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ padding: '8px 12px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-subtle)', borderRadius: 100, padding: '8px 14px', border: '1px solid var(--border)' }}>
            <Search size={14} color="var(--text-muted)"/>
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar contato, empresa..."
              style={{ flex: 1, outline: 'none', background: 'transparent', border: 'none', fontSize: 13, color: 'var(--text-main)' }}
            />
            {searchTerm && <button onClick={() => setSearchTerm('')} className="btn-icon btn-sm"><X size={12}/></button>}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.length === 0 && (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Nenhum contato encontrado.</div>
          )}
          {filtered.map(contact => {
            const h = waState.recentMessages[contact.id] || [];
            const lastMsg = h.length > 0 ? h[h.length - 1] : null;
            const isActive = activeChat === contact.id;
            const hue = (contact.id.charCodeAt(0) * 47 + 10) % 360;

            return (
              <div
                key={contact.id}
                onClick={() => setActiveChat(contact.id)}
                style={{
                  display: 'flex', padding: '10px 16px', gap: 12, cursor: 'pointer', alignItems: 'center',
                  background: isActive ? 'var(--primary-glow)' : 'transparent',
                  borderBottom: '1px solid var(--border)', transition: 'background 0.15s',
                  borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                }}
              >
                {/* Avatar */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: 46, height: 46, borderRadius: '50%', background: `hsl(${hue}, 60%, 45%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 15 }}>
                    {(contact.company || '??').substring(0, 2).toUpperCase()}
                  </div>
                  <div style={{ position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: '50%', background: 'var(--success)', border: '2px solid var(--bg-card)' }} />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>{contact.company}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, flexShrink: 0 }}>
                      {lastMsg ? lastMsg.time : ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 170 }}>
                      {lastMsg ? (lastMsg.fromMe ? `Você: ${lastMsg.text}` : lastMsg.text) : contact.phone}
                    </span>
                  </div>
                  {/* Tag Row */}
                  <div style={{ marginTop: 4 }}>
                    <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', padding: '2px 6px', borderRadius: 4,
                      background: contact.status === 'ativo' ? 'var(--success-glow)' : contact.status === 'prospect' ? 'var(--warning-glow)' : 'var(--bg-subtle)',
                      color: contact.status === 'ativo' ? 'var(--success)' : contact.status === 'prospect' ? 'var(--warning)' : 'var(--text-muted)' }}>
                      {contact.status === 'ativo' ? '● ATIVO' : contact.status === 'prospect' ? '◉ LEAD' : '○ ' + contact.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── COL 2: CHAT PANEL ──────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', background: '#e5ddd5' }}>
        {/* Background pattern */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.06, pointerEvents: 'none', backgroundImage: 'url("https://wweb.dev/assets/whatsapp-chat-back.png")', backgroundSize: '400px' }} />

        {activeContact ? (
          <>
            {/* Chat Header */}
            <div style={{ padding: '10px 20px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: `hsl(${(activeContact.id.charCodeAt(0) * 47 + 10) % 360}, 60%, 45%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 15 }}>
                  {activeContact.company.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.2 }}>{activeContact.company}</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {activeContact.name} · {activeContact.phone}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-primary btn-sm" title="Converter para Lead" onClick={handleMoveToFlow} style={{ gap: 8 }}>
                  <ArrowRight size={16}/> Converter em Lead
                </button>
                <button className="btn-icon"><Video size={18}/></button>
                <button className="btn-icon"><Phone size={18}/></button>
                <button className="btn-icon" onClick={() => setShowInfo(!showInfo)} style={{ color: showInfo ? 'var(--primary)' : 'var(--text-muted)' }}>
                  <Info size={18}/>
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 8, position: 'relative', zIndex: 10 }}>
              {chatMessages.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '40px 20px' }}>
                  Nenhuma mensagem carregada. Inicie a conversa abaixo.
                </div>
              )}

              {chatMessages.map(msg => {
                const replyMsg = msg.replyTo ? chatMessages.find(m => m.id === msg.replyTo) : null;
                return (
                  <div
                    key={msg.id}
                    style={{ alignSelf: msg.isSender ? 'flex-end' : 'flex-start', maxWidth: '68%' }}
                    onDoubleClick={() => setReplyTo(msg)}
                  >
                    {replyMsg && (
                      <div style={{ background: 'rgba(0,0,0,0.1)', borderLeft: '3px solid var(--primary)', borderRadius: '8px 8px 0 0', padding: '6px 10px', fontSize: 12, color: 'var(--text-muted)', marginBottom: -4 }}>
                        {replyMsg.text.substring(0, 60)}...
                      </div>
                    )}
                    <div style={{
                      background: msg.isSender ? '#dcf8c6' : '#ffffff',
                      color: '#303030',
                      padding: '8px 12px',
                      borderRadius: msg.isSender ? '8px 0 8px 8px' : '0 8px 8px 8px',
                      boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)',
                      fontSize: 14, lineHeight: 1.5
                    }}>
                      {msg.text}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: msg.isSender ? 'flex-end' : 'flex-start', gap: 4, marginTop: 3, color: 'var(--text-muted)', fontSize: 10 }}>
                      {msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {msg.isSender && <StatusIcon status={msg.status} />}
                    </div>
                  </div>
                );
              })}

              <div ref={messagesEndRef} />
            </div>

            {/* Reply Banner */}
            {replyTo && (
              <div style={{ padding: '8px 24px', background: 'var(--bg-card)', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, position: 'relative', zIndex: 10 }}>
                <div style={{ flex: 1, background: 'var(--primary-glow)', borderLeft: '3px solid var(--primary)', borderRadius: 8, padding: '6px 12px', fontSize: 12, color: 'var(--text-muted)' }}>
                  <span style={{ fontWeight: 800, color: 'var(--primary)', display: 'block' }}>Respondendo a</span>
                  {replyTo.text.substring(0, 80)}
                </div>
                <button className="btn-icon btn-sm" onClick={() => setReplyTo(null)}><X size={14}/></button>
              </div>
            )}

            {/* Quick Replies */}
            {showQuick && (
              <div style={{ padding: '8px 24px', background: 'var(--bg-subtle)', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, overflowX: 'auto', flexWrap: 'nowrap', zIndex: 10, position: 'relative' }}>
                {QUICK_REPLIES.map((r, i) => (
                  <button key={i} onClick={() => { setMessage(r); setShowQuick(false); textareaRef.current?.focus(); }}
                    style={{ flexShrink: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-main)' }}>
                    {r}
                  </button>
                ))}
              </div>
            )}

            {/* Emoji Picker */}
            {showEmoji && (
              <div style={{ padding: '10px 24px', background: 'var(--bg-card)', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, flexWrap: 'wrap', position: 'relative', zIndex: 10 }}>
                {EMOJIS.map(e => (
                  <button key={e} onClick={() => setMessage(m => m + e)} style={{ fontSize: 22, background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 8 }}>
                    {e}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div style={{ padding: '12px 20px', background: 'var(--bg-subtle)', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'flex-end', gap: 10, position: 'relative', zIndex: 10 }}>
              <button className="btn-icon" title="Emoji" onClick={() => { setShowEmoji(!showEmoji); setShowQuick(false); }}><Smile size={20}/></button>
              <button className="btn-icon" title="Respostas rápidas" onClick={() => { setShowQuick(!showQuick); setShowEmoji(false); }}><Filter size={20}/></button>
              <button className="btn-icon" title="Anexo"><Paperclip size={20}/></button>

              <div style={{ flex: 1, position: 'relative' }}>
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Mensagem..."
                  rows={1}
                  style={{ width: '100%', padding: '11px 16px', borderRadius: 22, border: '1px solid var(--border)', outline: 'none', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: 14, resize: 'none', fontFamily: 'inherit', lineHeight: 1.5, boxSizing: 'border-box' }}
                />
                {message.length > 0 && (
                  <span style={{ position: 'absolute', right: 14, bottom: 8, fontSize: 10, color: 'var(--text-muted)' }}>{message.length}</span>
                )}
              </div>

              <button
                onClick={() => sendMessage()}
                disabled={!message.trim() || isSending}
                style={{ width: 46, height: 46, borderRadius: '50%', background: message.trim() ? 'var(--primary)' : 'var(--border)', color: '#fff', border: 'none', cursor: message.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.2s' }}>
                {isSending ? <Clock size={20}/> : <Send size={20}/>}
              </button>
            </div>
          </>
        ) : (
          /* Empty State */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 10 }}>
            <div style={{ width: 110, height: 110, borderRadius: '50%', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, border: '2px dashed var(--border)' }}>
              <MessageSquare size={44} color="var(--primary)" opacity={0.4}/>
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>Magister Inbox N1</h2>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 380, textAlign: 'center', lineHeight: 1.7 }}>
              Central de atendimento unificado. Selecione um contato para iniciar, ou use <strong>Mensagem em Massa</strong> para broadcasting.
            </p>
            <button className="btn btn-primary" style={{ marginTop: 24 }} onClick={() => setShowMassModal(true)}>
              <Users size={16}/> Mensagem em Massa
            </button>
          </div>
        )}
      </div>

      {/* ── COL 3: CONTACT INFO PANEL ──────────────────────── */}
      {showInfo && activeContact && (
        <div style={{ width: 300, background: 'var(--bg-card)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ fontSize: 14, fontWeight: 800 }}>Informações do Contato</h4>
            <button className="btn-icon btn-sm" onClick={() => setShowInfo(false)}><X size={16}/></button>
          </div>

          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: `hsl(${(activeContact.id.charCodeAt(0) * 47 + 10) % 360}, 60%, 45%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 24, marginBottom: 12 }}>
              {activeContact.company.substring(0, 2).toUpperCase()}
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 4 }}>{activeContact.company}</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{activeContact.name}</p>
            <span className={`badge ${activeContact.status === 'ativo' ? 'badge-success' : 'badge-warning'}`} style={{ marginTop: 8 }}>
              {activeContact.status?.toUpperCase()}
            </span>
          </div>

          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Telefone', value: activeContact.phone },
              { label: 'Status CRM', value: activeContact.status },
            ].filter(f => f.value).map(f => (
              <div key={f.label}>
                <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 3 }}>{f.label}</p>
                <p style={{ fontSize: 13, fontWeight: 600 }}>{f.value}</p>
              </div>
            ))}
          </div>

          <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'space-between' }} onClick={handleMoveToFlow}>
              Mover para Pipeline <ChevronRight size={16}/>
            </button>
            <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'space-between', color: 'var(--primary)', borderColor: 'var(--primary)' }} onClick={handleCreateTicket}>
              Gerar Ticket de Suporte <Plus size={16}/>
            </button>
            {activeContact.crmId && (
              <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'space-between' }} onClick={() => navigate(`/admin/clientes/perfil/${activeContact.crmId}`)}>
                Ver no CRM <ChevronRight size={16}/>
              </button>
            )}
          </div>

          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', margin: '0 12px' }}>
            <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>Estatísticas (WhatsApp)</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'Mensagens', value: chatMessages.length },
                { label: 'Enviadas', value: chatMessages.filter(m => m.isSender).length },
                { label: 'Recebidas', value: chatMessages.filter(m => !m.isSender).length },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--bg-subtle)', padding: '8px 10px', borderRadius: 8, textAlign: 'center' }}>
                  <p style={{ fontSize: 18, fontWeight: 900, color: 'var(--primary)', margin: 0 }}>{s.value}</p>
                  <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MASS MESSAGE MODAL ──────────────────────────────── */}
      {showMassModal && (
        <div className="modal-overlay" onClick={() => setShowMassModal(false)}>
          <div className="modal animate-scale-in" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 900 }}>Mensagem em Massa</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Selecione os contatos para disparar a mensagem.</p>
              </div>
              <button className="btn-icon" onClick={() => setShowMassModal(false)}><X size={18}/></button>
            </div>

            <div style={{ padding: 20 }}>
              {/* Contact selector */}
              <div style={{ maxHeight: 280, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 12, marginBottom: 16 }}>
                <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)' }}>CONTATOS ({contacts.length})</span>
                  <button style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}
                    onClick={() => setSelectedForMass(selectedForMass.length === contacts.length ? [] : contacts.map(c => c.id))}>
                    {selectedForMass.length === contacts.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                  </button>
                </div>
                {contacts.map(c => (
                  <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)', background: selectedForMass.includes(c.id) ? 'var(--primary-glow)' : 'transparent' }}>
                    <input type="checkbox" checked={selectedForMass.includes(c.id)}
                      onChange={() => setSelectedForMass(prev => prev.includes(c.id) ? prev.filter(x => x !== c.id) : [...prev, c.id])} />
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: `hsl(${(c.id.charCodeAt(0) * 47 + 10) % 360}, 60%, 45%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 800 }}>
                      {c.company.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 800, margin: 0 }}>{c.company}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>{c.phone}</p>
                    </div>
                  </label>
                ))}
              </div>

              <textarea
                className="input"
                rows={4}
                value={massMessage}
                onChange={e => setMassMessage(e.target.value)}
                placeholder="Digite a mensagem que será enviada para todos os contatos selecionados..."
                style={{ width: '100%', marginBottom: 16 }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
                  {selectedForMass.length} contato(s) selecionado(s)
                </span>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-ghost" onClick={() => setShowMassModal(false)}>Cancelar</button>
                  <button className="btn btn-primary" onClick={sendMass} disabled={!massMessage.trim() || selectedForMass.length === 0}>
                    <Send size={14}/> Disparar para {selectedForMass.length}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
