import { useState, useEffect, useRef } from 'react';
import {
  RefreshCw, Download, Loader2, MessageSquare,
  Send, Search, Flame,
  MoreVertical, Smile, Paperclip, Mic, CheckCheck, Wifi,
  Bot, Plus, Trash2, ToggleLeft, ToggleRight, Settings, Edit3, Save, X, Clock
} from 'lucide-react';
import { apiFetch } from '../lib/api';

type WAStatus = 'disconnected' | 'qr_ready' | 'connecting' | 'connected' | 'auth_failure';
type ActiveTab = 'chat' | 'bot' | 'config';

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

interface BotRule {
  id: string;
  keyword: string;
  response: string;
  isActive: boolean;
  order: number;
}

interface BotConfig {
  id: string;
  isEnabled: boolean;
  greeting: string | null;
  awayMsg: string | null;
  workHours: string | null;
}

export default function Conectividade() {
  const [wa, setWa] = useState<WAState>({ status: 'disconnected', qrDataUrl: null, phone: null, contacts: [], recentMessages: {} });
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ created: number; skipped: number } | null>(null);
  const [loadingStart, setLoadingStart] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [converting, setConverting] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Bot state
  const [botRules, setBotRules] = useState<BotRule[]>([]);
  const [botConfig, setBotConfig] = useState<BotConfig | null>(null);
  const [handoff, setHandoff] = useState<{ isMuted: boolean; muteUntil: string | null }>({ isMuted: false, muteUntil: null });
  const [loadingBot, setLoadingBot] = useState(false);
  const [editingRule, setEditingRule] = useState<BotRule | null>(null);
  const [newRule, setNewRule] = useState({ keyword: '', response: '', order: 0 });
  const [showNewRuleForm, setShowNewRuleForm] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [botConfigForm, setBotConfigForm] = useState({
    greeting: '',
    awayMsg: '',
    workHoursStart: '08:00',
    workHoursEnd: '18:00',
    workDays: [1, 2, 3, 4, 5] as number[],
  });

  const poll = async () => {
    try {
      const data = await apiFetch<WAState>('/api/whatsapp/status');
      setWa(data);
    } catch {}
  };

  useEffect(() => {
    poll();
    const interval = setInterval(poll, 2000); // 2s para mais responsividade
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [wa.recentMessages, selectedChat]);

  // Checar handoff do contato selecionado
  useEffect(() => {
    if (selectedChat) {
      const phone = selectedChat.split('@')[0];
      apiFetch<{ isMuted: boolean; muteUntil: string | null }>(`/api/whatsapp/bot-handoff/${phone}`)
        .then(setHandoff)
        .catch(() => setHandoff({ isMuted: false, muteUntil: null }));
    } else {
      setHandoff({ isMuted: false, muteUntil: null });
    }
  }, [selectedChat]);

  useEffect(() => {
    if (wa.status === 'connected' && activeTab === 'bot') {
      loadBotData();
    }
  }, [activeTab, wa.status]);

  const loadBotData = async () => {
    setLoadingBot(true);
    try {
      const [rules, cfg] = await Promise.all([
        apiFetch<BotRule[]>('/api/whatsapp/bot-rules'),
        apiFetch<BotConfig>('/api/whatsapp/bot-config'),
      ]);
      setBotRules(rules);
      setBotConfig(cfg);
      const wh = cfg.workHours ? JSON.parse(cfg.workHours) : null;
      setBotConfigForm({
        greeting: cfg.greeting || '',
        awayMsg: cfg.awayMsg || '',
        workHoursStart: wh?.start || '08:00',
        workHoursEnd: wh?.end || '18:00',
        workDays: wh?.days || [1, 2, 3, 4, 5],
      });
    } catch (err) {
      console.error('Erro ao carregar bot:', err);
    } finally {
      setLoadingBot(false);
    }
  };

  const handleStart = async () => {
    setLoadingStart(true);
    try {
      await apiFetch('/api/whatsapp/start', { method: 'POST' });
      await poll();
    } finally { setLoadingStart(false); }
  };

  const handleReset = async () => {
    if (!confirm('Isso vai desconectar e apagar a sessão atual, gerando um novo QR Code. Continuar?')) return;
    setLoadingReset(true);
    try {
      await apiFetch('/api/whatsapp/reset', { method: 'POST' });
      // Aguardar um pouco antes de fazer poll, o reset é assíncrono
      setTimeout(async () => {
        await poll();
        setLoadingReset(false);
      }, 3000);
    } catch {
      setLoadingReset(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const data = await apiFetch<any>('/api/whatsapp/sync-contacts', { method: 'POST' });
      setSyncResult({ created: data.created, skipped: data.skipped });
      await poll();
    } finally { setSyncing(false); }
  };

  const sendMessage = async () => {
    if (!selectedChat || !messageInput.trim()) return;
    const phone = selectedChat.split('@')[0];
    try {
      await apiFetch('/api/whatsapp/send', {
        method: 'POST',
        body: JSON.stringify({ phone, message: messageInput }),
      });
      setMessageInput('');
      await poll();
    } catch (err) { console.error('Erro ao enviar:', err); }
  };

  const handleConvertToLead = async () => {
    const activeContact = wa.contacts.find(c => c.id === selectedChat);
    if (!activeContact) return;
    setConverting(true);
    try {
      await apiFetch('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: `Lead: ${activeContact.name}`,
          description: `Conversão direta do Cockpit WA: ${activeContact.phone}`,
          status: 'lead', priority: 'ALTA', tipo: 'tarefa', tags: 'WhatsApp'
        }),
      });
      alert('Lead convertido para o Pipeline!');
    } catch (err) { console.error('Falha na conversão:', err); }
    finally { setConverting(false); }
  };

  const handleResumeBot = async () => {
    if (!selectedChat) return;
    const phone = selectedChat.split('@')[0];
    try {
      await apiFetch(`/api/whatsapp/bot-resume/${phone}`, { method: 'POST' });
      setHandoff({ isMuted: false, muteUntil: null });
    } catch (err) { console.error('Erro ao retomar bot:', err); }
  };

  // Bot actions
  const toggleBotEnabled = async () => {
    if (!botConfig) return;
    const newVal = !botConfig.isEnabled;
    setBotConfig({ ...botConfig, isEnabled: newVal });
    await apiFetch('/api/whatsapp/bot-config', {
      method: 'PUT',
      body: JSON.stringify({ isEnabled: newVal }),
    });
  };

  const saveConfig = async () => {
    setSavingConfig(true);
    try {
      const workHours = JSON.stringify({
        start: botConfigForm.workHoursStart,
        end: botConfigForm.workHoursEnd,
        days: botConfigForm.workDays,
      });
      const cfg = await apiFetch<BotConfig>('/api/whatsapp/bot-config', {
        method: 'PUT',
        body: JSON.stringify({
          isEnabled: botConfig?.isEnabled,
          greeting: botConfigForm.greeting,
          awayMsg: botConfigForm.awayMsg,
          workHours,
        }),
      });
      setBotConfig(cfg);
      alert('Configurações salvas!');
    } finally { setSavingConfig(false); }
  };

  const createRule = async () => {
    if (!newRule.keyword.trim() || !newRule.response.trim()) return;
    try {
      const rule = await apiFetch<BotRule>('/api/whatsapp/bot-rules', {
        method: 'POST',
        body: JSON.stringify(newRule),
      });
      setBotRules(prev => [...prev, rule].sort((a, b) => a.order - b.order));
      setNewRule({ keyword: '', response: '', order: 0 });
      setShowNewRuleForm(false);
    } catch (err) { console.error('Erro ao criar regra:', err); }
  };

  const saveRule = async () => {
    if (!editingRule) return;
    try {
      const updated = await apiFetch<BotRule>(`/api/whatsapp/bot-rules/${editingRule.id}`, {
        method: 'PUT',
        body: JSON.stringify(editingRule),
      });
      setBotRules(prev => prev.map(r => r.id === updated.id ? updated : r));
      setEditingRule(null);
    } catch (err) { console.error('Erro ao salvar regra:', err); }
  };

  const deleteRule = async (id: string) => {
    if (!confirm('Excluir esta regra?')) return;
    try {
      await apiFetch(`/api/whatsapp/bot-rules/${id}`, { method: 'DELETE' });
      setBotRules(prev => prev.filter(r => r.id !== id));
    } catch (err) { console.error('Erro ao excluir regra:', err); }
  };

  const toggleRule = async (rule: BotRule) => {
    const updated = { ...rule, isActive: !rule.isActive };
    await apiFetch(`/api/whatsapp/bot-rules/${rule.id}`, {
      method: 'PUT',
      body: JSON.stringify(updated),
    });
    setBotRules(prev => prev.map(r => r.id === rule.id ? updated : r));
  };

  const activeContact = wa.contacts.find(c => c.id === selectedChat);
  const filteredContacts = wa.contacts.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Tela de desconectado
  if (wa.status !== 'connected') {
    return (
      <div className="animate-in" style={{ height: 'calc(100vh - 120px)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-subtle)' }}>
        <div className="card" style={{ maxWidth: 460, padding: 48, textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', borderRadius: 24 }}>
          <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--primary-glow))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
            <MessageSquare size={48} color="#fff" />
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 16 }}>WhatsApp Engine Pro</h2>

          {wa.status === 'auth_failure' && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 12, padding: '12px 16px', marginBottom: 24 }}>
              <p style={{ color: '#ef4444', fontWeight: 700, fontSize: 13 }}>Sessão inválida ou expirada. A sessão corrompida foi removida automaticamente. Clique em Inicializar para gerar um novo QR Code.</p>
            </div>
          )}

          {wa.status === 'connecting' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
              <Loader2 size={20} className="animate-spin" color="var(--primary)" />
              <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Carregando WhatsApp Web... aguarde</span>
            </div>
          )}

          <p style={{ color: 'var(--text-muted)', marginBottom: 40, lineHeight: 1.6 }}>
            Conecte seu dispositivo para gerenciar atendimentos operacionais e alimentar o pipeline em tempo real.
          </p>

          {wa.status === 'qr_ready' && wa.qrDataUrl ? (
            <div style={{ background: '#fff', padding: 24, borderRadius: 20, boxShadow: '0 10px 30px rgba(0,0,0,0.05)', marginBottom: 32, display: 'inline-block' }}>
              <img src={wa.qrDataUrl} style={{ width: 220, height: 220 }} alt="QR Code" />
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginTop: 12 }}>ESCANEIE COM DISPOSITIVOS VINCULADOS</p>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>WhatsApp → Aparelhos Conectados → Conectar aparelho</p>
            </div>
          ) : null}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary btn-lg"
              style={{ borderRadius: 12, padding: '0 32px', height: 52 }}
              onClick={handleStart}
              disabled={loadingStart || wa.status === 'connecting' || loadingReset}
            >
              {loadingStart ? <Loader2 className="animate-spin" /> : 'Inicializar Motor'}
            </button>
            <button
              className="btn btn-ghost btn-lg"
              style={{ borderRadius: 12, height: 52, padding: '0 20px', border: '1px solid var(--danger)', color: 'var(--danger)' }}
              onClick={handleReset}
              disabled={loadingReset}
              title="Apaga a sessão atual e gera um novo QR Code"
            >
              {loadingReset ? <Loader2 size={18} className="animate-spin" /> : <><RefreshCw size={16} style={{ marginRight: 6 }} />Reset Sessão</>}
            </button>
            <button className="btn btn-ghost btn-lg" style={{ borderRadius: 12, height: 52, width: 52 }} onClick={poll}><RefreshCw size={18} /></button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in" style={{ height: 'calc(100vh - 110px)', display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', background: 'var(--bg-card)', padding: '0 24px' }}>
        {([
          { key: 'chat', icon: MessageSquare, label: 'Conversas' },
          { key: 'bot', icon: Bot, label: 'Bot & Automação' },
          { key: 'config', icon: Settings, label: 'Configurações' },
        ] as { key: ActiveTab; icon: any; label: string }[]).map(tab => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              if (tab.key === 'bot' || tab.key === 'config') loadBotData();
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '14px 20px', cursor: 'pointer',
              background: 'transparent', border: 'none',
              borderBottom: activeTab === tab.key ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === tab.key ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: activeTab === tab.key ? 700 : 500,
              fontSize: 14, transition: '0.2s',
            }}
          >
            <tab.icon size={16} />
            {tab.label}
            {tab.key === 'bot' && botConfig?.isEnabled && (
              <span style={{ background: 'var(--success)', color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 20 }}>ATIVO</span>
            )}
          </button>
        ))}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--success)', fontWeight: 700 }}>
            <Wifi size={14} />
            {wa.phone ? `+${wa.phone}` : 'Conectado'}
          </div>
        </div>
      </div>

      {/* Chat Tab */}
      {activeTab === 'chat' && (
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '380px 1fr', overflow: 'hidden' }}>
          {/* Sidebar contatos */}
          <div style={{ borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--bg-card)' }}>
            <div style={{ padding: '16px 16px 12px', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h3 style={{ fontSize: 18, fontWeight: 900 }}>Conversas</h3>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn-icon" onClick={handleSync} title="Sincronizar Leads">
                    {syncing ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  </button>
                  <button className="btn-icon" onClick={poll}><RefreshCw size={16} /></button>
                </div>
              </div>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  className="input"
                  placeholder="Pesquisar conversa..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: 36, height: 40, fontSize: 13, borderRadius: 8, background: 'var(--bg-card)' }}
                />
              </div>
            </div>

            {syncResult && (
              <div style={{ padding: '8px 16px', background: 'var(--success-glow)', borderBottom: '1px solid var(--success)', fontSize: 12, fontWeight: 700, color: 'var(--success)' }}>
                ✓ {syncResult.created} leads sincronizados no Pipeline
              </div>
            )}

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {filteredContacts.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  {wa.contacts.length === 0 ? 'Nenhum contato carregado. Aguarde o WhatsApp inicializar.' : 'Nenhum resultado.'}
                </div>
              ) : filteredContacts.map(c => {
                const lastMsg = wa.recentMessages[c.id]?.[wa.recentMessages[c.id].length - 1];
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedChat(c.id)}
                    style={{
                      padding: '12px 16px', display: 'flex', gap: 12, cursor: 'pointer',
                      background: selectedChat === c.id ? 'var(--bg-subtle)' : 'transparent',
                      borderBottom: '1px solid rgba(0,0,0,0.03)', transition: '0.15s ease',
                    }}
                  >
                    <div className="avatar" style={{ width: 46, height: 46, background: `hsl(${c.phone.slice(-3)}deg, 45%, 55%)`, color: '#fff', fontSize: 17, fontWeight: 800, flexShrink: 0 }}>
                      {c.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, flexShrink: 0 }}>{lastMsg?.time || ''}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {lastMsg?.fromMe && <CheckCheck size={12} color="var(--primary)" />}
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {lastMsg ? lastMsg.text : `+${c.phone}`}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chat principal */}
          {selectedChat ? (
            <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#efe7de', backgroundImage: `url("https://www.transparenttextures.com/patterns/cubes.png")`, position: 'relative' }}>
              <div style={{ padding: '10px 20px', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="avatar" style={{ width: 42, height: 42, background: `hsl(${activeContact?.phone.slice(-3)}deg, 45%, 55%)`, color: '#fff' }}>
                    {activeContact?.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>{activeContact?.name}</h4>
                    <div style={{ fontSize: 12, color: 'var(--success)', fontWeight: 700 }}>+{activeContact?.phone}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={handleConvertToLead}
                    disabled={converting}
                    style={{
                      background: 'linear-gradient(135deg, #FF3CAC, #784BA0, #2B86C5)',
                      color: '#fff', border: 'none', borderRadius: 24,
                      padding: '0 18px', height: 38, fontSize: 12, fontWeight: 900,
                      display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                    }}
                  >
                    {converting ? <Loader2 size={14} className="animate-spin" /> : <Flame size={14} />}
                    CONVERTER EM LEAD
                  </button>
                  <button className="btn-icon"><MoreVertical size={18} /></button>
                </div>
              </div>

              {/* Handoff Banner */}
              {handoff.isMuted && (
                <div style={{ 
                  background: 'rgba(255, 152, 0, 0.9)', 
                  color: '#fff', 
                  padding: '8px 20px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  zIndex: 5,
                  fontSize: 12,
                  fontWeight: 700,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Bot size={16} />
                    BOT SILENCIADO: Atendimento humano ativo (Até {new Date(handoff.muteUntil!).toLocaleTimeString()})
                  </div>
                  <button 
                    onClick={handleResumeBot}
                    style={{ 
                      background: '#fff', 
                      color: '#f57c00', 
                      border: 'none', 
                      padding: '4px 12px', 
                      borderRadius: 4, 
                      fontSize: 10, 
                      fontWeight: 900, 
                      cursor: 'pointer' 
                    }}
                  >
                    RETOMAR BOT AGORA
                  </button>
                </div>
              )}

              <div style={{ flex: 1, padding: '16px 60px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {(wa.recentMessages[selectedChat] || []).map((m, idx) => {
                  const prevType = idx > 0 ? wa.recentMessages[selectedChat][idx - 1].fromMe : null;
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
                        marginTop: isStartOfGroup ? 8 : 2,
                        fontSize: 14,
                        lineHeight: 1.4,
                        display: 'flex', flexDirection: 'column',
                      }}
                    >
                      <span style={{ marginRight: 48 }}>{m.text}</span>
                      <div style={{ alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: 3, marginTop: -10, marginLeft: 'auto' }}>
                        <span style={{ fontSize: 10, color: '#667781', fontWeight: 500 }}>{m.time}</span>
                        {m.fromMe && <CheckCheck size={13} color="#53bdeb" />}
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              <div style={{ padding: '10px 20px', background: '#f0f2f5', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ display: 'flex', gap: 10, color: '#54656f' }}>
                  <Smile size={22} style={{ cursor: 'pointer' }} />
                  <Paperclip size={22} style={{ cursor: 'pointer' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <input
                    className="input"
                    placeholder="Mensagem..."
                    value={messageInput}
                    onChange={e => setMessageInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    style={{ width: '100%', height: 42, borderRadius: 8, background: '#fff', border: 'none', padding: '12px 14px', fontSize: 14 }}
                  />
                </div>
                {messageInput.trim() ? (
                  <button
                    onClick={sendMessage}
                    style={{ background: 'var(--primary)', color: '#fff', border: 'none', width: 42, height: 42, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <Send size={18} style={{ marginLeft: 2 }} />
                  </button>
                ) : (
                  <Mic size={22} color="#54656f" style={{ cursor: 'pointer' }} />
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-muted)', background: 'var(--bg-subtle)' }}>
              <MessageSquare size={56} style={{ color: 'var(--primary)', opacity: 0.5, marginBottom: 24 }} />
              <h3 style={{ fontWeight: 900, color: 'var(--text-main)', marginBottom: 8 }}>Selecione uma conversa</h3>
              <p style={{ fontSize: 14, textAlign: 'center' }}>{wa.contacts.length} contatos carregados</p>
            </div>
          )}
        </div>
      )}

      {/* Bot Tab */}
      {activeTab === 'bot' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 32, background: 'var(--bg-subtle)' }}>
          {loadingBot ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
              <Loader2 size={32} className="animate-spin" color="var(--primary)" />
            </div>
          ) : (
            <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* Bot Status Banner */}
              <div className="card" style={{ padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%',
                    background: botConfig?.isEnabled ? 'linear-gradient(135deg, #00C851, #007E33)' : 'linear-gradient(135deg, #555, #333)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Bot size={28} color="#fff" />
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 900, fontSize: 20, margin: 0 }}>Bot de Atendimento Automático</h3>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
                      {botConfig?.isEnabled ? '🟢 Respondendo mensagens automaticamente' : '🔴 Desativado — apenas atendimento manual'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={toggleBotEnabled}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: botConfig?.isEnabled ? 'var(--success-glow)' : 'var(--bg-subtle)',
                    border: `1px solid ${botConfig?.isEnabled ? 'var(--success)' : 'var(--border)'}`,
                    borderRadius: 30, padding: '10px 20px', cursor: 'pointer',
                    fontSize: 14, fontWeight: 800,
                    color: botConfig?.isEnabled ? 'var(--success)' : 'var(--text-muted)',
                    transition: '0.2s',
                  }}
                >
                  {botConfig?.isEnabled ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                  {botConfig?.isEnabled ? 'Desativar' : 'Ativar'} Bot
                </button>
              </div>

              {/* Regras de resposta */}
              <div className="card" style={{ borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ fontWeight: 900, fontSize: 17, margin: 0 }}>Regras de Resposta</h4>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                      O bot verifica keywords nas mensagens e responde automaticamente. Primeira regra que match vence.
                    </p>
                  </div>
                  <button
                    className="btn btn-primary"
                    style={{ borderRadius: 10, padding: '0 16px', height: 38, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
                    onClick={() => setShowNewRuleForm(!showNewRuleForm)}
                  >
                    <Plus size={16} /> Nova Regra
                  </button>
                </div>

                {/* Formulário nova regra */}
                {showNewRuleForm && (
                  <div style={{ padding: '20px 24px', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: 12, alignItems: 'start' }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>KEYWORD(S) — separe por vírgula</label>
                        <input
                          className="input"
                          placeholder="preço, valor, quanto custa"
                          value={newRule.keyword}
                          onChange={e => setNewRule({ ...newRule, keyword: e.target.value })}
                          style={{ height: 40, fontSize: 13 }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>RESPOSTA AUTOMÁTICA</label>
                        <input
                          className="input"
                          placeholder="Nossa tabela de preços está em..."
                          value={newRule.response}
                          onChange={e => setNewRule({ ...newRule, response: e.target.value })}
                          style={{ height: 40, fontSize: 13 }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>PRIORIDADE</label>
                        <input
                          type="number"
                          className="input"
                          placeholder="0"
                          value={newRule.order}
                          onChange={e => setNewRule({ ...newRule, order: Number(e.target.value) })}
                          style={{ height: 40, fontSize: 13, width: 80 }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: 8, paddingTop: 24 }}>
                        <button className="btn btn-primary" style={{ height: 40, padding: '0 16px', borderRadius: 8, fontSize: 13 }} onClick={createRule}>
                          <Save size={14} />
                        </button>
                        <button className="btn btn-ghost" style={{ height: 40, padding: '0 12px', borderRadius: 8 }} onClick={() => setShowNewRuleForm(false)}>
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Lista de regras */}
                {botRules.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Bot size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                    <p style={{ fontSize: 14 }}>Nenhuma regra cadastrada.<br />Crie a primeira para o bot começar a responder.</p>
                  </div>
                ) : (
                  <div>
                    {botRules.map(rule => (
                      <div key={rule.id} style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                        {editingRule?.id === rule.id ? (
                          <>
                            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10 }}>
                              <input
                                className="input"
                                value={editingRule.keyword}
                                onChange={e => setEditingRule({ ...editingRule, keyword: e.target.value })}
                                style={{ height: 38, fontSize: 13 }}
                                placeholder="Keywords"
                              />
                              <input
                                className="input"
                                value={editingRule.response}
                                onChange={e => setEditingRule({ ...editingRule, response: e.target.value })}
                                style={{ height: 38, fontSize: 13 }}
                                placeholder="Resposta"
                              />
                              <input
                                type="number"
                                className="input"
                                value={editingRule.order}
                                onChange={e => setEditingRule({ ...editingRule, order: Number(e.target.value) })}
                                style={{ height: 38, fontSize: 13, width: 70 }}
                              />
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button className="btn btn-primary" style={{ height: 38, padding: '0 14px', borderRadius: 8 }} onClick={saveRule}><Save size={14} /></button>
                              <button className="btn btn-ghost" style={{ height: 38, padding: '0 10px', borderRadius: 8 }} onClick={() => setEditingRule(null)}><X size={14} /></button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                                <span style={{ fontWeight: 700, fontSize: 12, background: 'var(--primary)', color: '#fff', padding: '2px 10px', borderRadius: 20 }}>
                                  #{rule.order} — {rule.keyword}
                                </span>
                                {!rule.isActive && (
                                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>inativa</span>
                                )}
                              </div>
                              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-main)', opacity: rule.isActive ? 1 : 0.5 }}>
                                ↳ {rule.response}
                              </p>
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                className="btn-icon"
                                onClick={() => toggleRule(rule)}
                                title={rule.isActive ? 'Desativar' : 'Ativar'}
                                style={{ color: rule.isActive ? 'var(--success)' : 'var(--text-muted)' }}
                              >
                                {rule.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                              </button>
                              <button className="btn-icon" onClick={() => setEditingRule(rule)}><Edit3 size={16} /></button>
                              <button className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => deleteRule(rule.id)}><Trash2 size={16} /></button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Exemplos pré-montados */}
              <div className="card" style={{ borderRadius: 16, padding: 24 }}>
                <h4 style={{ fontWeight: 900, margin: '0 0 16px' }}>Templates Rápidos</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                  {[
                    { keyword: 'preço, valor, orçamento', response: 'Olá! Nossos planos começam a partir de R$997/mês. Posso te passar mais detalhes?' },
                    { keyword: 'suporte, problema, erro', response: 'Entendido! Vou abrir um chamado para você agora. Nossa equipe retorna em até 2h úteis.' },
                    { keyword: 'horário, funcionamento', response: 'Atendemos de Segunda a Sexta, das 8h às 18h. Mas nosso bot está sempre disponível!' },
                    { keyword: 'obrigado, obrigada, valeu', response: 'Disponha! Se precisar de mais alguma coisa, é só chamar. 😊' },
                  ].map((t, i) => (
                    <div
                      key={i}
                      style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 16, cursor: 'pointer', transition: '0.2s' }}
                      onClick={() => {
                        setNewRule({ keyword: t.keyword, response: t.response, order: i });
                        setShowNewRuleForm(true);
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary)', marginBottom: 6 }}>KEYWORDS: {t.keyword}</div>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>{t.response}</p>
                      <div style={{ marginTop: 10, fontSize: 11, color: 'var(--primary)', fontWeight: 700 }}>+ Usar template →</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Config Tab */}
      {activeTab === 'config' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 32, background: 'var(--bg-subtle)' }}>
          <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

            <div className="card" style={{ borderRadius: 16, padding: 28 }}>
              <h4 style={{ fontWeight: 900, fontSize: 18, margin: '0 0 24px' }}>Mensagens Automáticas</h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>
                    MENSAGEM DE BOAS-VINDAS (enviada na primeira mensagem do dia de cada número)
                  </label>
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="Olá! Sou o assistente virtual da Magister Tech. Como posso te ajudar hoje?"
                    value={botConfigForm.greeting}
                    onChange={e => setBotConfigForm({ ...botConfigForm, greeting: e.target.value })}
                    style={{ resize: 'vertical', fontSize: 14, lineHeight: 1.6 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>
                    MENSAGEM DE AUSÊNCIA (fora do horário de atendimento)
                  </label>
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="Estamos fora do horário de atendimento. Retornamos em breve!"
                    value={botConfigForm.awayMsg}
                    onChange={e => setBotConfigForm({ ...botConfigForm, awayMsg: e.target.value })}
                    style={{ resize: 'vertical', fontSize: 14, lineHeight: 1.6 }}
                  />
                </div>
              </div>
            </div>

            <div className="card" style={{ borderRadius: 16, padding: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <Clock size={20} color="var(--primary)" />
                <h4 style={{ fontWeight: 900, fontSize: 18, margin: 0 }}>Horário de Atendimento</h4>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>INÍCIO</label>
                  <input
                    type="time"
                    className="input"
                    value={botConfigForm.workHoursStart}
                    onChange={e => setBotConfigForm({ ...botConfigForm, workHoursStart: e.target.value })}
                    style={{ height: 42, fontSize: 14 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>FIM</label>
                  <input
                    type="time"
                    className="input"
                    value={botConfigForm.workHoursEnd}
                    onChange={e => setBotConfigForm({ ...botConfigForm, workHoursEnd: e.target.value })}
                    style={{ height: 42, fontSize: 14 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 10 }}>DIAS DA SEMANA</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {dayNames.map((d, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        const days = botConfigForm.workDays.includes(i)
                          ? botConfigForm.workDays.filter(x => x !== i)
                          : [...botConfigForm.workDays, i];
                        setBotConfigForm({ ...botConfigForm, workDays: days });
                      }}
                      style={{
                        width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: 'pointer',
                        fontWeight: 800, fontSize: 12,
                        background: botConfigForm.workDays.includes(i) ? 'var(--primary)' : 'var(--bg-subtle)',
                        color: botConfigForm.workDays.includes(i) ? '#fff' : 'var(--text-muted)',
                        transition: '0.2s',
                      }}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              className="btn btn-primary"
              style={{ height: 48, borderRadius: 12, fontSize: 15, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              onClick={saveConfig}
              disabled={savingConfig}
            >
              {savingConfig ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Salvar Configurações
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
