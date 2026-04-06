import { useState, useEffect, useRef } from 'react';
import { Wifi, WifiOff, RefreshCw, Users, Download, Phone, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { useData } from '../contexts/DataContext';

type WAStatus = 'disconnected' | 'qr_ready' | 'connecting' | 'connected' | 'auth_failure';

interface WAState {
  status: WAStatus;
  qrDataUrl: string | null;
  phone: string | null;
  contacts: { id: string; name: string; phone: string }[];
}

const STATUS_CONFIG: Record<WAStatus, { label: string; color: string; icon: React.ReactNode }> = {
  disconnected:  { label: 'Desconectado',          color: 'var(--text-muted)',  icon: <WifiOff size={18} /> },
  qr_ready:      { label: 'Aguardando QR Code',     color: 'var(--warning)',     icon: <Loader2 size={18} className="animate-spin" /> },
  connecting:    { label: 'Conectando...',           color: 'var(--primary)',     icon: <Loader2 size={18} className="animate-spin" /> },
  connected:     { label: 'Conectado',               color: 'var(--success)',     icon: <CheckCircle size={18} /> },
  auth_failure:  { label: 'Falha de Autenticação',  color: 'var(--danger)',      icon: <AlertCircle size={18} /> },
};

export default function Conectividade() {
  const { addPipelineDeal } = useData();
  const [wa, setWa] = useState<WAState>({ status: 'disconnected', qrDataUrl: null, phone: null, contacts: [] });
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ created: number; skipped: number } | null>(null);
  const [loadingStart, setLoadingStart] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  const token = localStorage.getItem('magister_token');

  // SSE — conecta ao stream do servidor para receber atualizações de status em tempo real
  useEffect(() => {
    const connect = () => {
      if (esRef.current) esRef.current.close();
      // EventSource não suporta headers nativos; usamos polling como fallback seguro
      // com fetch para o header Authorization
      poll();
    };

    connect();
    const interval = setInterval(poll, 3000);
    return () => {
      clearInterval(interval);
      esRef.current?.close();
    };
  }, []);

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
    setSyncResult(null);
    try {
      await fetch('/api/whatsapp/start', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      await poll();
    } finally {
      setLoadingStart(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await fetch('/api/whatsapp/disconnect', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      await poll();
      setSyncResult(null);
    } catch {}
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/whatsapp/sync-contacts', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        setSyncResult({ created: data.created, skipped: data.skipped });
        await poll();
      }
    } finally {
      setSyncing(false);
    }
  };

  const cfg = STATUS_CONFIG[wa.status];

  return (
    <div className="animate-in" style={{ paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 100, fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <Wifi size={12} color="var(--success)" /> Conectividade · WhatsApp Engine
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-main)', margin: 0, lineHeight: 1.1 }}>
          Integração WhatsApp
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8 }}>
          Conecte seu WhatsApp comercial para sincronizar contatos e enviar mensagens diretamente do ERP.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Status Card */}
        <div className="card" style={{ padding: 32 }}>
          <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 24 }}>Status da Conexão</h3>

          {/* Status pill */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 100, background: 'var(--bg-subtle)', border: `1.5px solid ${cfg.color}`, color: cfg.color, fontWeight: 700, fontSize: 14, marginBottom: 28 }}>
            {cfg.icon} {cfg.label}
          </div>

          {wa.phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'var(--success-glow)', borderRadius: 12, marginBottom: 20 }}>
              <Phone size={16} color="var(--success)" />
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--success)' }}>+{wa.phone}</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {wa.status === 'disconnected' || wa.status === 'auth_failure' ? (
              <button
                className="btn btn-primary"
                onClick={handleStart}
                disabled={loadingStart}
                style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}
              >
                {loadingStart ? <Loader2 size={16} className="animate-spin" /> : <Wifi size={16} />}
                {loadingStart ? 'Iniciando...' : 'Conectar WhatsApp'}
              </button>
            ) : (
              <button
                className="btn btn-ghost"
                onClick={handleDisconnect}
                style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', color: 'var(--danger)' }}
              >
                <WifiOff size={16} /> Desconectar Sessão
              </button>
            )}

            <button
              className="btn btn-secondary"
              onClick={poll}
              style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}
            >
              <RefreshCw size={16} /> Atualizar Status
            </button>
          </div>

          {/* Contagem de contatos */}
          {wa.contacts.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px', background: 'var(--bg-subtle)', borderRadius: 12, marginTop: 24, borderLeft: '4px solid var(--primary)' }}>
              <Users size={20} color="var(--primary)" />
              <div>
                <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-main)' }}>{wa.contacts.length} contatos sincronizados</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Prontos para importar para o CRM</p>
              </div>
            </div>
          )}
        </div>

        {/* QR Code / Actions Panel */}
        <div className="card" style={{ padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {wa.status === 'qr_ready' && wa.qrDataUrl ? (
            <>
              <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 8, textAlign: 'center' }}>Escaneie o QR Code</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24, textAlign: 'center' }}>
                Abra o WhatsApp no celular → Menu → Dispositivos Vinculados → Vincular dispositivo
              </p>
              <div style={{ padding: 16, background: '#fff', borderRadius: 16, boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}>
                <img src={wa.qrDataUrl} alt="QR Code WhatsApp" style={{ width: 240, height: 240, display: 'block' }} />
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 16, textAlign: 'center' }}>
                O QR Code expira em ~60 segundos. Atualize se necessário.
              </p>
            </>
          ) : wa.status === 'connected' ? (
            <>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--success-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <CheckCircle size={40} color="var(--success)" />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--success)', marginBottom: 6 }}>WhatsApp Conectado!</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Agora você pode sincronizar seus contatos com o CRM</p>
              </div>

              <button
                className="btn btn-primary"
                onClick={handleSync}
                disabled={syncing}
                style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', width: '100%', marginBottom: 16 }}
              >
                {syncing ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                {syncing ? 'Importando contatos...' : 'Importar Contatos para CRM'}
              </button>

              {syncResult && (
                <div style={{ padding: '16px', background: 'var(--success-glow)', borderRadius: 12, textAlign: 'center', width: '100%' }}>
                  <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--success)', marginBottom: 4 }}>
                    ✅ {syncResult.created} novos contatos importados
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {syncResult.skipped} contatos já existiam no CRM
                  </p>
                </div>
              )}

              {wa.contacts.length > 0 && (
                <div style={{ marginTop: 24, width: '100%' }}>
                  <h4 style={{ fontSize: 13, fontWeight: 800, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                    Prévia de Contatos
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
                    {wa.contacts.slice(0, 15).map(c => (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: 12, border: '1px solid var(--border)' }}>
                        <div className="avatar" style={{ width: 32, height: 32, fontSize: 12, background: `hsl(${c.name.charCodeAt(0) * 45}, 70%, 45%)`, color: '#fff', fontWeight: 800 }}>
                          {c.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>{c.name}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>+{c.phone}</p>
                        </div>
                        <button 
                          className="btn btn-primary btn-sm" 
                          style={{ padding: '6px 10px', fontSize: 10, background: 'linear-gradient(135deg, #ff4d4d, #f81ce5)', border: 'none' }}
                          onClick={() => {
                            addPipelineDeal('lead', {
                              title: `Lead: ${c.name}`,
                              assignee: 'Sem Atribuir',
                              priority: 'high',
                              tag: 'WhatsApp',
                              phone: c.phone
                            });
                            alert(`${c.name} movido para o Pipeline! 🔥`);
                          }}
                        >
                          🔥 QUENTE
                        </button>
                      </div>
                    ))}
                    {wa.contacts.length > 15 && (
                      <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', padding: '8px 0' }}>
                        +{wa.contacts.length - 15} contatos adicionais disponíveis
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                {wa.status === 'connecting' ? <Loader2 size={40} color="var(--primary)" className="animate-spin" /> : <WifiOff size={40} color="var(--text-muted)" style={{ opacity: 0.3 }} />}
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-main)', marginBottom: 8 }}>
                {wa.status === 'connecting' ? 'Inicializando Motor WhatsApp...' : 'WhatsApp não conectado'}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {wa.status === 'connecting' ? 'Aguarde, isso pode levar alguns segundos.' : 'Clique em "Conectar WhatsApp" para iniciar.'}
              </p>
              {wa.status === 'auth_failure' && (
                <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--danger-glow)', borderRadius: 10, border: '1px solid rgba(239,68,68,0.3)' }}>
                  <p style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 700 }}>
                    Falha na autenticação. Tente desconectar e reconectar.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
