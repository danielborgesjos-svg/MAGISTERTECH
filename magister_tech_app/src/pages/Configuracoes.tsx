import { useContext, useState } from 'react';
import { Trash2, AlertTriangle, KeyRound, Save, CheckCircle, ShieldCheck, Settings, Activity } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Configuracoes() {
  const { logout, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState('');
  
  const handleFactoryReset = () => {
    if (confirmDelete === 'Zerar Tudo') {
      localStorage.clear();
      logout();
      navigate('/login');
      window.location.reload();
    }
  };

  return (
    <div className="animate-in" style={{ paddingBottom: 40, maxWidth: 960, margin: '0 auto' }}>
      {/* ─── HEADER COCKPIT ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 100, fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Activity size={12} color="var(--primary)" /> Sistema · Base de Dados
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-main)', margin: 0, lineHeight: 1.1 }}>
            Configurações
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8 }}>
            Ajustes do perfil, preferências e recursos avançados de sistema (Wipe Database).
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 24 }}>
        {/* Profile/Auth settings (Local) */}
        <section className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)' }}>
          <div style={{ padding: '24px 32px', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <KeyRound size={24} color="var(--primary)"/>
              </div>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>Meu Perfil Local</h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Visualização de credenciais integradas.</p>
              </div>
            </div>
          </div>

          <div style={{ padding: 32 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 640 }}>
              <div>
                <label className="form-label" style={{ fontWeight: 800 }}>Nome de Exibição</label>
                <input className="input" value={user?.name || ''} disabled style={{ opacity: 0.7, fontSize: 16, fontWeight: 700, background: 'var(--bg-subtle)' }} />
              </div>
              <div>
                <label className="form-label" style={{ fontWeight: 800 }}>E-mail (Credencial)</label>
                <input className="input" value={user?.email || ''} disabled style={{ opacity: 0.7, fontSize: 16, fontWeight: 700, background: 'var(--bg-subtle)' }} />
              </div>
              <div style={{ gridColumn: '1/-1', padding: '16px 20px', background: 'var(--primary-glow)', borderRadius: 12, border: '1px solid rgba(124,58,237,0.15)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <ShieldCheck size={20} color="var(--primary)" style={{ flexShrink: 0 }} />
                <p style={{ fontSize: 13, color: 'var(--text-main)', fontWeight: 600 }}>
                  <strong style={{ color: 'var(--primary)' }}>Sincronização Ativa:</strong> O seu perfil está travado na master data de "Equipe". Para alterar permissões ou dados cadastrais, acesse a página de <a href="/admin/equipe" style={{ color: 'var(--primary)' }}>Gestão de Colaboradores</a> com credenciais Mestre.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        {user?.role === 'ADMIN' || user?.role === 'CEO' ? (
          <section className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid rgba(239, 68, 68, 0.4)', background: 'var(--bg-card)' }}>
             <div style={{ padding: '24px 32px', background: 'var(--danger-glow)', borderBottom: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={24} color="#fff"/>
                </div>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--danger)', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>Zona de Perigo Extremo (WIPE)</h2>
                  <p style={{ fontSize: 13, color: 'var(--danger)', fontWeight: 800, opacity: 0.9 }}>Restaurar Magister System aos Padrões de Fábrica.</p>
                </div>
              </div>
            </div>

            <div style={{ padding: 32 }}>
              <p style={{ fontSize: 14, color: 'var(--text-main)', marginBottom: 24, fontWeight: 600, lineHeight: 1.6 }}>
                Atenção, Gestor: A ação abaixo executará um <strong style={{ color: 'var(--danger)', background: 'var(--danger-glow)', padding: '2px 6px', borderRadius: 6 }}>HARD RESET</strong>. <br/>
                Isso apagará <b>100% da persistência local</b> do ERP (Clientes, Projetos, Pipeline Comercial, Transações Financeiras, Contratos e Colaboradores). Essa operação <b>não pode ser desfeita</b>. O sistema em produção retornará ao estado de "Container Novo".
              </p>
              
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', background: 'var(--bg-subtle)', padding: 24, borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ flex: 1 }}>
                   <label className="form-label" style={{ fontWeight: 800, color: 'var(--danger)' }}>Confirmação de Segurança Requerida</label>
                   <input 
                    type="text" 
                    className="input" 
                    placeholder="Digite exatamente: Zerar Tudo" 
                    value={confirmDelete}
                    onChange={e => setConfirmDelete(e.target.value)}
                    style={{ fontSize: 16, fontWeight: 700, borderColor: confirmDelete === 'Zerar Tudo' ? 'var(--danger)' : 'var(--border)' }}
                  />
                </div>
                <button 
                  className="btn btn-danger" 
                  onClick={handleFactoryReset}
                  disabled={confirmDelete !== 'Zerar Tudo'}
                  style={{ opacity: confirmDelete === 'Zerar Tudo' ? 1 : 0.5, padding: '16px 24px', fontSize: 15, fontWeight: 800, alignSelf: 'flex-end', height: 48 }}
                >
                  <Trash2 size={18} /> Executar Wipe
                </button>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
