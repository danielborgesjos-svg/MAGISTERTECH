import { useContext, useState, useRef } from 'react';
import { Camera, Edit3, Save, X, User, Phone, Building2, Lock, Eye, EyeOff, CheckCircle, Image, Activity, History } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { apiFetch } from '../lib/api';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador Master', CEO: 'CEO / Diretor', GESTOR: 'Gestor de Operações',
  COLABORADOR: 'Colaborador', COMERCIAL: 'Comercial', FINANCEIRO: 'Financeiro',
  CLIENTE: 'Cliente', DESIGNER: 'Designer',
};

export default function Perfil() {
  const { user, updateProfile } = useContext(AuthContext);
  const { logs } = useData();

  const [editing, setEditing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  

  const [form, setForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    phone: user?.phone || '',
    sector: user?.sector || '',
    avatarUrl: user?.avatar || '',
    coverUrl: user?.coverUrl || '',
  });

  const [pwdForm, setPwdForm] = useState({ currentPwd: '', newPwd: '', confirmPwd: '' });
  const [pwdError, setPwdError] = useState('');
  const [pwdOk, setPwdOk] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const handleSave = async () => {
    setSavingProfile(true);
    try {
      const data = await apiFetch<any>('/api/users/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: form.name,
          bio: form.bio,
          phone: form.phone,
          sector: form.sector,
          avatarUrl: form.avatarUrl,
          coverUrl: form.coverUrl,
        }),
      });
      updateProfile({
        name: data.user.name,
        avatar: data.user.avatar,
        coverUrl: data.user.coverUrl,
        bio: data.user.bio,
        phone: data.user.phone,
        sector: data.user.sector,
      });
      setSavedOk(true);
      setEditing(false);
      setTimeout(() => setSavedOk(false), 3000);
    } catch (err) {
      console.error('Erro ao salvar perfil:', err);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleImageFile = (field: 'avatarUrl' | 'coverUrl', file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setForm(prev => ({ ...prev, [field]: e.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handlePasswordChange = async () => {
    setPwdError('');
    if (pwdForm.newPwd !== pwdForm.confirmPwd) {
      setPwdError('As senhas não coincidem.');
      return;
    }
    if (pwdForm.newPwd.length < 6) {
      setPwdError('A nova senha deve ter ao menos 6 caracteres.');
      return;
    }
    setSavingPwd(true);
    try {
      await apiFetch('/api/users/change-password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword: pwdForm.currentPwd, newPassword: pwdForm.newPwd }),
      });
      setPwdOk(true);
      setPwdForm({ currentPwd: '', newPwd: '', confirmPwd: '' });
      setTimeout(() => setPwdOk(false), 3000);
    } catch (err: any) {
      setPwdError(err?.message || 'Erro ao alterar senha.');
    } finally {
      setSavingPwd(false);
    }
  };

  const initials = user.name.substring(0, 2).toUpperCase();
  const roleLabel = ROLE_LABELS[user.role] || user.role;

  const displayAvatar = editing ? form.avatarUrl : (user.avatar || '');
  const displayCover = editing ? form.coverUrl : (user.coverUrl || '');

  return (
    <div className="animate-in" style={{ maxWidth: 900, margin: '0 auto', paddingBottom: 60 }}>

      {/* Cover + Avatar */}
      <div style={{ position: 'relative', marginBottom: 80 }}>
        {/* Cover Photo */}
        <div style={{
          height: 240, borderRadius: 20, overflow: 'hidden', position: 'relative',
          background: displayCover
            ? `url(${displayCover}) center/cover no-repeat`
            : 'linear-gradient(135deg, var(--primary) 0%, #7c3aed 50%, #0ea5e9 100%)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}>
          {!displayCover && (
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 40%)'
            }} />
          )}
          {editing && (
            <button
              onClick={() => coverInputRef.current?.click()}
              style={{
                position: 'absolute', bottom: 16, right: 16,
                background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.2)', color: '#fff',
                padding: '8px 16px', borderRadius: 10, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700
              }}
            >
              <Image size={16} /> Alterar Capa
            </button>
          )}
          <input
            ref={coverInputRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={(e) => e.target.files?.[0] && handleImageFile('coverUrl', e.target.files[0])}
          />
        </div>

        {/* Avatar */}
        <div style={{ position: 'absolute', bottom: -64, left: 40, display: 'flex', alignItems: 'flex-end', gap: 24 }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              width: 128, height: 128, borderRadius: '50%',
              border: '4px solid var(--bg-card)',
              overflow: 'hidden',
              background: displayAvatar ? 'transparent' : 'linear-gradient(135deg, var(--primary), #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            }}>
              {displayAvatar
                ? <img src={displayAvatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 40, fontWeight: 900, color: '#fff' }}>{initials}</span>
              }
            </div>
            {editing && (
              <button
                onClick={() => avatarInputRef.current?.click()}
                style={{
                  position: 'absolute', bottom: 4, right: 4,
                  background: 'var(--primary)', border: '2px solid var(--bg-card)',
                  borderRadius: '50%', width: 34, height: 34,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#fff',
                }}
              >
                <Camera size={16} />
              </button>
            )}
            <input
              ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={(e) => e.target.files?.[0] && handleImageFile('avatarUrl', e.target.files[0])}
            />
          </div>
        </div>

        {/* Edit/Save Buttons */}
        <div style={{ position: 'absolute', bottom: -52, right: 0, display: 'flex', gap: 10 }}>
          {savedOk && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--success)', fontSize: 13, fontWeight: 700 }}>
              <CheckCircle size={16} /> Salvo com sucesso!
            </div>
          )}
          {editing ? (
            <>
              <button
                onClick={() => { setEditing(false); setForm({ name: user.name, bio: user.bio || '', phone: user.phone || '', sector: user.sector || '', avatarUrl: user.avatar || '', coverUrl: user.coverUrl || '' }); }}
                className="btn btn-ghost"
                style={{ borderRadius: 10, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <X size={16} /> Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={savingProfile}
                className="btn btn-primary"
                style={{ borderRadius: 10, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Save size={16} /> {savingProfile ? 'Salvando...' : 'Salvar Perfil'}
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="btn btn-secondary"
              style={{ borderRadius: 10, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Edit3 size={16} /> Editar Perfil
            </button>
          )}
        </div>
      </div>

      {/* Name + Role + Bio */}
      <div className="card" style={{ borderRadius: 20, padding: 32, marginBottom: 24 }}>
        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>NOME COMPLETO</label>
                <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ height: 44, fontSize: 15 }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>SETOR / CARGO</label>
                <input className="input" value={form.sector} onChange={e => setForm({ ...form, sector: e.target.value })} placeholder="Ex: Design, Comercial..." style={{ height: 44, fontSize: 15 }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>TELEFONE / WHATSAPP</label>
              <input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(11) 99999-9999" style={{ height: 44, fontSize: 15 }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>URL DO AVATAR (ou clique no ícone acima)</label>
              <input className="input" value={form.avatarUrl} onChange={e => setForm({ ...form, avatarUrl: e.target.value })} placeholder="https://..." style={{ height: 44, fontSize: 13 }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>URL DA CAPA (ou clique no botão)</label>
              <input className="input" value={form.coverUrl} onChange={e => setForm({ ...form, coverUrl: e.target.value })} placeholder="https://..." style={{ height: 44, fontSize: 13 }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>BIO / APRESENTAÇÃO</label>
              <textarea className="input" value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Conte um pouco sobre você..." rows={3} style={{ resize: 'vertical', fontSize: 14, lineHeight: 1.6 }} />
            </div>
          </div>
        ) : (
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, margin: '0 0 6px', letterSpacing: '-0.02em' }}>{user.name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <span style={{
                background: 'linear-gradient(135deg, var(--primary), #7c3aed)',
                color: '#fff', padding: '4px 14px', borderRadius: 20, fontSize: 12, fontWeight: 800
              }}>
                {roleLabel}
              </span>
              {user.sector && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
                  <Building2 size={14} /> {user.sector}
                </span>
              )}
              {user.phone && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
                  <Phone size={14} /> {user.phone}
                </span>
              )}
            </div>
            {user.bio ? (
              <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: 600 }}>{user.bio}</p>
            ) : (
              <p style={{ fontSize: 14, color: 'var(--text-muted)', fontStyle: 'italic' }}>Sem bio. Clique em "Editar Perfil" para adicionar uma apresentação.</p>
            )}
          </div>
        )}
      </div>

      {/* Info Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div className="card" style={{ padding: 24, borderRadius: 16 }}>
          <h4 style={{ fontSize: 14, fontWeight: 900, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <User size={16} color="var(--primary)" /> Dados da Conta
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Email', value: user.email },
              { label: 'Nível de Acesso', value: roleLabel },
              { label: 'Setor', value: user.sector || '—' },
              { label: 'Telefone', value: user.phone || '—' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{item.label}</span>
                <span style={{ fontWeight: 700 }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Change Password */}
        <div className="card" style={{ padding: 24, borderRadius: 16 }}>
          <h4 style={{ fontSize: 14, fontWeight: 900, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Lock size={16} color="var(--warning)" /> Alterar Senha
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <input
                className="input" type={showPwd ? 'text' : 'password'}
                placeholder="Senha atual" value={pwdForm.currentPwd}
                onChange={e => setPwdForm({ ...pwdForm, currentPwd: e.target.value })}
                style={{ height: 40, fontSize: 13, paddingRight: 40 }}
              />
              <button onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                className="input" type='password'
                placeholder="Nova senha" value={pwdForm.newPwd}
                onChange={e => setPwdForm({ ...pwdForm, newPwd: e.target.value })}
                style={{ height: 40, fontSize: 13 }}
              />
            </div>
            <input
              className="input" type="password"
              placeholder="Confirmar nova senha" value={pwdForm.confirmPwd}
              onChange={e => setPwdForm({ ...pwdForm, confirmPwd: e.target.value })}
              style={{ height: 40, fontSize: 13 }}
            />
            {pwdError && <p style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 700 }}>{pwdError}</p>}
            {pwdOk && <p style={{ fontSize: 12, color: 'var(--success)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle size={14} /> Senha alterada com sucesso!</p>}
            <button
              onClick={handlePasswordChange}
              disabled={savingPwd || !pwdForm.currentPwd || !pwdForm.newPwd}
              className="btn btn-primary"
              style={{ height: 40, borderRadius: 10, fontSize: 13 }}
            >
              {savingPwd ? 'Alterando...' : 'Salvar Nova Senha'}
            </button>
          </div>
        </div>
      </div>

      {/* Histórico Operacional */}
      <div className="card" style={{ padding: 24, borderRadius: 16, marginBottom: 24 }}>
        <h4 style={{ fontSize: 14, fontWeight: 900, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <History size={16} color="var(--primary)" /> Histórico Operacional / Atividades Recentes
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
           {logs.filter((l: any) => l.userName === user.name).slice(0, 5).map((log: any) => (
             <div key={log.id} style={{ display: 'flex', gap: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <Activity size={14} color="var(--primary)" />
                </div>
                <div>
                   <p style={{ fontSize: 14, fontWeight: 700 }}>{log.action}</p>
                   <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Módulo: {log.module} — Data: {new Date(log.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
             </div>
           ))}
           {logs.filter((l: any) => l.userName === user.name).length === 0 && (
             <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Nenhuma atividade registrada no log de sistema para você recentemente.</p>
           )}
        </div>
      </div>

      {/* Upload Tips */}
      <div style={{ padding: '14px 20px', background: 'var(--bg-subtle)', borderRadius: 12, border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-muted)' }}>
        <strong style={{ color: 'var(--text-main)' }}>💡 Dica:</strong> Para foto e capa, você pode usar uma URL de imagem hospedada (ex: Imgur, Google Drive, etc.) ou fazer upload diretamente clicando nos ícones de câmera. Formatos aceitos: JPG, PNG, WebP.
      </div>
    </div>
  );
}
