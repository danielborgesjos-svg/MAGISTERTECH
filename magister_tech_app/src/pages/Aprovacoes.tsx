import { useState, useEffect, useRef } from 'react';
import {
  Plus, CheckCircle, XCircle, Clock, Trash2, Eye, Send,
  Image as ImageIcon, Video, FileText, Layout, Type,
  RefreshCw, MessageCircle, ExternalLink, X, Upload,
  BarChart2, AlertTriangle, Zap, Filter
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { apiFetch } from '../lib/api';

interface Approval {
  id: string;
  title: string;
  type: string;
  fileUrl: string;
  clientId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  respondedBy?: string;
  createdAt: string;
  client: { name: string; phone: string };
}

/* ─── Metadata maps ─────────────────────────────────────────────────────── */
const TYPE_META: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  'Criativo':           { icon: ImageIcon, color: '#e1306c', label: 'Criativo Imagem' },
  'Vídeo':              { icon: Video,     color: '#ff4500', label: 'Vídeo / Reels' },
  'Identidade Visual':  { icon: Layout,    color: '#7c3aed', label: 'Identidade Visual' },
  'Estratégia/Tráfego': { icon: BarChart2, color: '#2563eb', label: 'Tráfego Pago' },
  'Cópia/Texto':        { icon: Type,      color: '#059669', label: 'Copy / Texto' },
};

const STATUS_META = {
  PENDING:  { label: 'Aguardando', icon: Clock,       cls: 'badge-warning' as const, borderVar: 'var(--warning)',  colorVar: 'var(--warning)'  },
  APPROVED: { label: 'Aprovado',   icon: CheckCircle, cls: 'badge-success' as const, borderVar: 'var(--success)',  colorVar: 'var(--success)'  },
  REJECTED: { label: 'Recusado',   icon: XCircle,     cls: 'badge-danger'  as const, borderVar: 'var(--danger)',   colorVar: 'var(--danger)'   },
};

/* ─── Utils ─────────────────────────────────────────────────────────────── */
function isImage(url: string) { return /\.(jpeg|jpg|gif|png|webp)(\?|$)/i.test(url || ''); }
function isVideo(url: string) { return /\.(mp4|mov|webm|avi)(\?|$)/i.test(url || ''); }
function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return 'agora';
  if (m < 60) return `${m}min atrás`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h atrás`;
  return `${Math.floor(h / 24)}d atrás`;
}

/* ─── ApprovalCard ──────────────────────────────────────────────────────── */
function ApprovalCard({ app, onDelete, onPreview, onResend }: {
  app: Approval;
  onDelete: (id: string) => void;
  onPreview: (app: Approval) => void;
  onResend: (app: Approval) => void;
}) {
  const sm = STATUS_META[app.status] ?? STATUS_META.PENDING;
  const tm = TYPE_META[app.type] ?? TYPE_META['Criativo'];
  const StatusIcon = sm.icon;
  const TypeIcon = tm.icon;

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', borderLeft: `3px solid ${sm.borderVar}`, transition: 'var(--transition)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Thumbnail ── */}
      <div
        onClick={() => onPreview(app)}
        className="aprv-thumb"
        style={{ height: 160, background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', cursor: 'pointer' }}
      >
        {app.fileUrl && isImage(app.fileUrl) ? (
          <img src={app.fileUrl} alt={app.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
            className="aprv-thumb-img"
          />
        ) : app.fileUrl && isVideo(app.fileUrl) ? (
          <video src={app.fileUrl} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <TypeIcon size={40} color={tm.color} strokeWidth={1.5} />
            <span style={{ fontSize: 11, color: 'var(--text-light)', fontWeight: 600 }}>Sem preview</span>
          </div>
        )}

        {/* Status overlay badge */}
        <div className={`badge ${sm.cls}`}
          style={{ position: 'absolute', top: 10, right: 10, backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: 5 }}>
          <StatusIcon size={11} />
          {sm.label}
        </div>

        {/* Hover overlay */}
        <div className="aprv-hover-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.38)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fff', fontWeight: 700, fontSize: 13 }}>
            <Eye size={18} /> Visualizar
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Type + title */}
        <div>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '3px 9px', borderRadius: 8, marginBottom: 8,
            background: `${tm.color}18`, border: `1px solid ${tm.color}40`,
            fontSize: 10, fontWeight: 800, color: tm.color, textTransform: 'uppercase', letterSpacing: '0.06em'
          }}>
            <TypeIcon size={11} /> {tm.label}
          </span>
          <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.3, margin: 0 }}>
            {app.title}
          </p>
        </div>

        {/* Client chip */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
          borderRadius: 10, background: 'var(--bg-subtle)', border: '1px solid var(--border)',
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7, flexShrink: 0, fontSize: 11, fontWeight: 900, color: '#fff',
            background: 'linear-gradient(135deg, var(--primary), var(--indigo))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {(app.client?.name || '?')[0].toUpperCase()}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-main)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {app.client?.name || '—'}
            </p>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0 }}>
              {app.client?.phone || 'Sem telefone'}
            </p>
          </div>
          <MessageCircle size={13} color="var(--success)" />
        </div>

        {/* Respondido por */}
        {app.respondedBy && (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
            Respondido por: <strong style={{ color: 'var(--text-main)' }}>{app.respondedBy}</strong>
          </p>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
          <span style={{ fontSize: 11, color: 'var(--text-light)', fontWeight: 600 }}>{timeAgo(app.createdAt)}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {/* Reenviar WA */}
            <button className="btn-icon" onClick={() => onResend(app)} title="Reenviar WhatsApp"
              style={{ background: 'var(--success-glow)', border: '1px solid rgba(16,185,129,0.25)', color: 'var(--success)', width: 32, height: 32 }}>
              <Send size={13} />
            </button>
            {/* Abrir arquivo */}
            <button className="btn-icon" onClick={() => app.fileUrl && window.open(app.fileUrl, '_blank')} title="Abrir arquivo"
              disabled={!app.fileUrl}
              style={{ color: 'var(--primary)', width: 32, height: 32, opacity: app.fileUrl ? 1 : 0.35 }}>
              <ExternalLink size={13} />
            </button>
            {/* Excluir */}
            <button className="btn-icon" onClick={() => onDelete(app.id)} title="Excluir"
              style={{ background: 'var(--danger-glow)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--danger)', width: 32, height: 32 }}>
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Preview Modal ─────────────────────────────────────────────────────── */
function PreviewModal({ app, onClose }: { app: Approval; onClose: () => void }) {
  const sm = STATUS_META[app.status] ?? STATUS_META.PENDING;
  const StatusIcon = sm.icon;
  const publicLink = `${window.location.origin}/validar-aprovacao/${app.id}`;
  const [copied, setCopied] = useState(false);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-xl" onClick={e => e.stopPropagation()} style={{ padding: 0, overflow: 'hidden' }}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
              Preview do Material
            </p>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>{app.title}</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className={`badge ${sm.cls}`} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <StatusIcon size={11} /> {sm.label}
            </span>
            <button className="btn-icon" onClick={onClose}><X size={16} /></button>
          </div>
        </div>

        {/* Media */}
        <div style={{ background: 'var(--bg-subtle)', maxHeight: 360, minHeight: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {app.fileUrl && isImage(app.fileUrl) ? (
            <img src={app.fileUrl} alt={app.title} style={{ maxWidth: '100%', maxHeight: 360, objectFit: 'contain' }} />
          ) : app.fileUrl && isVideo(app.fileUrl) ? (
            <video src={app.fileUrl} controls style={{ maxWidth: '100%', maxHeight: 360 }} />
          ) : (
            <div style={{ padding: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <FileText size={48} color="var(--text-light)" />
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Sem preview disponível</p>
            </div>
          )}
        </div>

        {/* Info cards */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { label: 'Cliente',  value: app.client?.name },
              { label: 'Tipo',     value: app.type },
              { label: 'Enviado',  value: new Date(app.createdAt).toLocaleDateString('pt-BR') },
            ].map(f => (
              <div key={f.label} className="card" style={{ padding: '12px 16px' }}>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>{f.label}</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>{f.value}</p>
              </div>
            ))}
          </div>

          {/* Link público */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'var(--primary-glow)', border: '1px solid var(--border-strong)',
            borderRadius: 10, padding: '10px 14px',
          }}>
            <Zap size={14} color="var(--primary)" />
            <p style={{ flex: 1, fontSize: 12, color: 'var(--primary)', fontFamily: 'monospace', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {publicLink}
            </p>
            <button className="btn btn-sm btn-outline" onClick={() => { navigator.clipboard.writeText(publicLink); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
              {copied ? <><CheckCircle size={12} /> Copiado!</> : 'Copiar link'}
            </button>
            <a href={publicLink} target="_blank" rel="noreferrer" className="btn-icon">
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Create Modal ──────────────────────────────────────────────────────── */
function CreateModal({ clients, onClose, onCreated }: {
  clients: any[];
  onClose: () => void;
  onCreated: (app: Approval) => void;
}) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Criativo');
  const [clientId, setClientId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [step, setStep] = useState<'idle' | 'uploading' | 'sending_wa' | 'done'>('idle');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f);
    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);
    } else setPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title || !clientId) return;
    setSubmitting(true); setStep('uploading');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('token');
      const uploadRes = await fetch('/api/upload', {
        method: 'POST', body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!uploadRes.ok) throw new Error('Upload falhou');
      const { url: fileUrl } = await uploadRes.json();

      setStep('sending_wa');
      const newApproval = await apiFetch<Approval>('/api/approvals', {
        method: 'POST',
        body: JSON.stringify({ title, type, clientId, fileUrl }),
      });
      setStep('done');
      setTimeout(() => { onCreated(newApproval); onClose(); }, 1000);
    } catch (err) {
      console.error(err);
      alert('Erro ao criar aprovação.');
      setSubmitting(false); setStep('idle');
    }
  };

  const selectedClient = clients.find(c => c.id === clientId);
  const canSubmit = !!file && !!title && !!clientId;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ padding: 0, maxWidth: 560 }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="logo-icon" style={{ width: 40, height: 40, borderRadius: 12 }}><Send size={17} color="#fff" /></div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>Novo Envio para Aprovação</h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>WhatsApp disparado automaticamente</p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Título */}
            <div>
              <label className="form-label">Título do Material *</label>
              <input className="input" value={title} onChange={e => setTitle(e.target.value)}
                placeholder="Ex: Criativo MetaAds — Campanha Verão" required />
            </div>

            {/* Tipo — pill buttons */}
            <div>
              <label className="form-label">Tipo de Material *</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {Object.entries(TYPE_META).map(([key, meta]) => {
                  const Icon = meta.icon;
                  const active = type === key;
                  return (
                    <button type="button" key={key} onClick={() => setType(key)} style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '7px 13px', borderRadius: 10, cursor: 'pointer',
                      background: active ? `${meta.color}18` : 'var(--bg-subtle)',
                      border: `1px solid ${active ? meta.color + '60' : 'var(--border)'}`,
                      color: active ? meta.color : 'var(--text-muted)',
                      fontWeight: active ? 800 : 600, fontSize: 12, transition: 'all 0.15s',
                    }}>
                      <Icon size={12} /> {meta.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cliente */}
            <div>
              <label className="form-label">Cliente destinatário *</label>
              <select className="input" value={clientId} onChange={e => setClientId(e.target.value)} required>
                <option value="">Selecione um cliente...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.company} — {c.name}</option>)}
              </select>
              {selectedClient && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, padding: '8px 12px', borderRadius: 10, background: 'var(--success-glow)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <MessageCircle size={13} color="var(--success)" />
                  <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 700 }}>
                    {selectedClient.phone ? `WhatsApp: ${selectedClient.phone}` : 'Sem número cadastrado'}
                  </span>
                </div>
              )}
            </div>

            {/* Drag & Drop */}
            <div>
              <label className="form-label">Arquivo *</label>
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                style={{
                  border: `2px dashed ${dragOver ? 'var(--primary)' : file ? 'var(--success)' : 'var(--border-strong)'}`,
                  borderRadius: 12, padding: '24px 20px', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                  background: dragOver ? 'var(--primary-glow)' : file ? 'var(--success-glow)' : 'var(--bg-subtle)',
                  transition: 'all 0.2s',
                }}
              >
                {preview ? (
                  <img src={preview} alt="preview" style={{ maxHeight: 130, maxWidth: '100%', borderRadius: 8, objectFit: 'contain' }} />
                ) : (
                  <Upload size={32} color={file ? 'var(--success)' : 'var(--text-light)'} strokeWidth={1.5} />
                )}
                <div style={{ textAlign: 'center' }}>
                  {file ? (
                    <>
                      <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--success)', margin: 0 }}>{file.name}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0' }}>{(file.size / 1024 / 1024).toFixed(2)} MB · clique para substituir</p>
                    </>
                  ) : (
                    <>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', margin: 0 }}>Arraste ou clique para selecionar</p>
                      <p style={{ fontSize: 11, color: 'var(--text-light)', margin: '4px 0 0' }}>PNG, JPG, MP4, PDF — máx. 50MB</p>
                    </>
                  )}
                </div>
              </div>
              <input ref={fileRef} type="file" style={{ display: 'none' }}
                accept="image/*,video/*,.pdf"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </div>

            {/* WA info */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px', borderRadius: 12, background: 'var(--success-glow)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <MessageCircle size={16} color="var(--success)" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
                O backend irá <strong style={{ color: 'var(--success)' }}>disparar automaticamente</strong> uma mensagem WhatsApp para o número cadastrado com o link de aprovação único.
              </p>
            </div>

            {/* Progress steps */}
            {submitting && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {([
                  ['uploading',   'Fazendo upload do arquivo...'],
                  ['sending_wa',  'Disparando mensagem WhatsApp...'],
                  ['done',        'Aprovação criada com sucesso!'],
                ] as [string, string][]).map(([id, label], i) => {
                  const steps = ['idle', 'uploading', 'sending_wa', 'done'];
                  const done   = steps.indexOf(step) > steps.indexOf(id);
                  const active = step === id;
                  return (
                    <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                        background: done ? 'var(--success)' : active ? 'var(--primary)' : 'var(--bg-subtle)',
                        border: `2px solid ${done ? 'var(--success)' : active ? 'var(--primary)' : 'var(--border)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.3s',
                      }}>
                        {done
                          ? <CheckCircle size={12} color="#fff" />
                          : <span style={{ fontSize: 9, fontWeight: 900, color: active ? '#fff' : 'var(--text-light)' }}>{i + 1}</span>
                        }
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: done ? 'var(--success)' : active ? 'var(--text-main)' : 'var(--text-light)' }}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {!submitting && (
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={!canSubmit}
                style={{ opacity: canSubmit ? 1 : 0.5, gap: 8 }}>
                <Send size={14} /> Enviar + Notificar WhatsApp
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────────── */
export default function Aprovacoes() {
  const { clients } = useData();
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [previewApp, setPreviewApp] = useState<Approval | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, []);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try { setApprovals(await apiFetch<Approval[]>('/api/approvals')); }
    catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta aprovação permanentemente?')) return;
    try { await apiFetch(`/api/approvals/${id}`, { method: 'DELETE' }); setApprovals(p => p.filter(a => a.id !== id)); }
    catch { alert('Erro ao excluir.'); }
  };

  const handleResend = async (app: Approval) => {
    if (!app.client?.phone) return alert('Cliente sem telefone.');
    try {
      await apiFetch('/api/whatsapp/send', {
        method: 'POST',
        body: JSON.stringify({
          phone: app.client.phone,
          message: `Olá! O material *"${app.title}"* ainda aguarda sua aprovação:\n${window.location.origin}/validar-aprovacao/${app.id}`,
        }),
      });
      alert('Mensagem reenviada via WhatsApp!');
    } catch { alert('Erro ao reenviar. Verifique se o WhatsApp está conectado.'); }
  };

  const pending  = approvals.filter(a => a.status === 'PENDING').length;
  const approved = approvals.filter(a => a.status === 'APPROVED').length;
  const rejected = approvals.filter(a => a.status === 'REJECTED').length;

  const filtered = approvals.filter(a => {
    const matchStatus = filterStatus === 'ALL' || a.status === filterStatus;
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) || (a.client?.name || '').toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="animate-in" style={{ paddingBottom: 60 }}>

      {/* ── Header ── */}
      <div className="page-header" style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'var(--success-glow)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 100, fontSize: 11, fontWeight: 700, color: 'var(--success)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <MessageCircle size={12} /> Central de Aprovações
          </div>
          <h1 className="page-title" style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', margin: 0 }}>
            Aprovações de Materiais
          </h1>
          <p className="page-subtitle">Envie criativos, receba aprovações e acompanhe o status em tempo real</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => load(true)} style={{ gap: 6 }}>
            <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          </button>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)} style={{ gap: 8 }}>
            <Plus size={16} /> Novo Envio
          </button>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Total Enviados', value: approvals.length, color: 'var(--primary)',  glow: 'var(--primary-glow)',  icon: Send        },
          { label: 'Aguardando',    value: pending,           color: 'var(--warning)',  glow: 'var(--warning-glow)',  icon: Clock       },
          { label: 'Aprovados',     value: approved,          color: 'var(--success)',  glow: 'var(--success-glow)',  icon: CheckCircle },
          { label: 'Recusados',     value: rejected,          color: 'var(--danger)',   glow: 'var(--danger-glow)',   icon: XCircle     },
        ].map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="kpi-card" style={{ borderTop: `3px solid ${k.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <p className="kpi-label">{k.label}</p>
                <div className="kpi-icon" style={{ background: k.glow }}><Icon size={18} color={k.color} /></div>
              </div>
              <p className="kpi-value" style={{ color: k.color }}>{k.value}</p>
            </div>
          );
        })}
      </div>

      {/* ── Filters ── */}
      <div className="card" style={{ padding: '14px 18px', marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
          <Filter size={14} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por título ou cliente..." />
        </div>
        <div className="tab-list" style={{ width: 'auto', flexShrink: 0 }}>
          {[['ALL','Todos'],['PENDING','Aguardando'],['APPROVED','Aprovados'],['REJECTED','Recusados']].map(([val,lbl]) => (
            <button key={val} className={`tab-btn ${filterStatus === val ? 'active' : ''}`}
              onClick={() => setFilterStatus(val)} style={{ padding: '7px 14px', flex: 'unset', fontSize: 12 }}>
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grid ── */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
          {[1,2,3].map(i => (
            <div key={i} className="card" style={{ height: 320, background: 'var(--bg-subtle)', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <AlertTriangle size={44} />
          <h3>Nenhuma aprovação encontrada</h3>
          <p>Clique em <strong>Novo Envio</strong> para criar a primeira.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
          {filtered.map(app => (
            <ApprovalCard key={app.id} app={app}
              onDelete={handleDelete} onPreview={setPreviewApp} onResend={handleResend} />
          ))}
        </div>
      )}

      {/* ── Modals ── */}
      {showCreate && <CreateModal clients={clients} onClose={() => setShowCreate(false)} onCreated={app => setApprovals(p => [app, ...p])} />}
      {previewApp && <PreviewModal app={previewApp} onClose={() => setPreviewApp(null)} />}

      <style>{`
        @keyframes spin    { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        @keyframes pulse   { 0%,100% { opacity:1; } 50% { opacity:0.45; } }

        /* Thumb hover overlay */
        .aprv-thumb:hover .aprv-hover-overlay { opacity: 1 !important; }
        .aprv-thumb:hover .aprv-thumb-img     { transform: scale(1.05); }
      `}</style>
    </div>
  );
}
