import { useContext, useState, useRef, useEffect } from 'react';
import { Trash2, AlertTriangle, KeyRound, ShieldCheck, Activity, Upload, Image as ImageIcon, CheckCircle, RefreshCw } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import { apiFetch } from '../lib/api';

export default function Configuracoes() {
  const { logout } = useContext(AuthContext);
  const [confirmDelete, setConfirmDelete] = useState('');

  // Logo
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoSuccess, setLogoSuccess] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  useEffect(() => {
    // Carrega logo atual do banco
    apiFetch<{ value: string }>('/api/config/LOGO_URL').then(d => {
      if (d?.value) setLogoUrl(d.value);
    }).catch(() => {});
  }, []);

  const handleLogoFile = (file: File) => {
    if (!file.type.startsWith('image/')) { alert('Apenas imagens são aceitas.'); return; }
    const reader = new FileReader();
    reader.onload = e => setLogoPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = async () => {
    const file = logoRef.current?.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    setLogoSuccess(false);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Upload falhou.');
      const { url } = await res.json();

      // Salvar no AppConfig
      await apiFetch('/api/config/LOGO_URL', {
        method: 'PUT',
        body: JSON.stringify({ value: url, label: 'Logo da Empresa', group: 'branding' }),
      });

      setLogoUrl(url);
      setLogoSuccess(true);

      // Disparar evento global para atualizar logo em tempo real
      window.dispatchEvent(new CustomEvent('logoUpdated', { detail: { url } }));

      setTimeout(() => setLogoSuccess(false), 3000);
    } catch (err) {
      alert('Erro ao fazer upload da logo.');
    } finally {
      setLogoUploading(false);
    }
  };

  const handleFactoryReset = () => {
    if (confirmDelete === 'Zerar Tudo') {
      logout();
    }
  };

  const currentLogoDisplay = logoPreview || (logoUrl ? `${backendUrl}${logoUrl}` : null);

  return (
    <div className="animate-in">
      <div className="page-header" style={{ marginBottom: 32 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 100, fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Activity size={12} color="var(--primary)" /> Sistema · Configurações
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-main)', margin: 0, lineHeight: 1.1 }}>
            Gestão do Magister Cockpit
          </h1>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 800 }}>

        {/* ── LOGO DA EMPRESA ── */}
        <div className="card" style={{ padding: 32, borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ background: 'var(--primary-glow)', padding: 12, borderRadius: 12, color: 'var(--primary)', flexShrink: 0 }}>
              <ImageIcon size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 4 }}>Logo da Empresa</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                A logo aparece no topo da barra lateral (25×25, circular). Faça upload da sua marca aqui.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                {/* Preview atual */}
                <div
                  style={{
                    width: 80, height: 80, borderRadius: '50%', border: '2px dashed var(--border-strong)',
                    background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', flexShrink: 0, cursor: 'pointer', position: 'relative',
                  }}
                  onClick={() => logoRef.current?.click()}
                >
                  {currentLogoDisplay ? (
                    <img src={currentLogoDisplay} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <ImageIcon size={32} color="var(--text-light)" />
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <input
                    ref={logoRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoFile(f); }}
                  />
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button className="btn btn-ghost" onClick={() => logoRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Upload size={14} /> {logoPreview ? 'Trocar arquivo' : 'Selecionar logo'}
                    </button>
                    {logoPreview && (
                      <button
                        className="btn btn-primary"
                        onClick={handleLogoUpload}
                        disabled={logoUploading}
                        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        {logoUploading
                          ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Enviando...</>
                          : logoSuccess
                          ? <><CheckCircle size={14} /> Logo aplicada!</>
                          : <><Upload size={14} /> Aplicar Logo</>
                        }
                      </button>
                    )}
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 8 }}>
                    Formatos: PNG, JPG, SVG. A imagem será exibida em 25×25px circular. Recomendado: imagem quadrada com fundo transparente (PNG).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── SEGURANÇA ── */}
        <div className="card" style={{ padding: 32, borderLeft: '4px solid var(--indigo)' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ background: 'var(--indigo-glow)', padding: 12, borderRadius: 12, color: 'var(--indigo)' }}>
              <ShieldCheck size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 8 }}>Segurança & Acesso</h3>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>Gerencie as políticas de senha e níveis de criptografia do sistema.</p>
              <button className="btn btn-ghost"><KeyRound size={16} /> Mudar Minha Senha</button>
            </div>
          </div>
        </div>

        {/* ── ZONA DE PERIGO ── */}
        <div className="card" style={{ padding: 32, borderLeft: '4px solid var(--danger)', background: 'rgba(239, 68, 68, 0.02)' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: 12, borderRadius: 12, color: 'var(--danger)' }}>
              <AlertTriangle size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 8, color: 'var(--danger)' }}>Zona de Perigo</h3>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>As ações abaixo são irreversíveis. Tenha certeza antes de prosseguir.</p>
              <div style={{ background: 'var(--bg-subtle)', padding: 20, borderRadius: 12, border: '1px solid var(--border)' }}>
                <h4 style={{ fontSize: 13, fontWeight: 800, marginBottom: 12 }}>Reset de Fábrica (Limpar Tudo)</h4>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Isso apagará TODOS os dados locais (clientes, projetos, kanban) e fará o logout.</p>
                <div style={{ display: 'flex', gap: 12 }}>
                  <input
                    className="input"
                    placeholder="Digite 'Zerar Tudo' para confirmar"
                    value={confirmDelete}
                    onChange={e => setConfirmDelete(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button
                    className="btn btn-danger"
                    disabled={confirmDelete !== 'Zerar Tudo'}
                    onClick={handleFactoryReset}
                  >
                    <Trash2 size={16} /> Resetar Sistema
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
