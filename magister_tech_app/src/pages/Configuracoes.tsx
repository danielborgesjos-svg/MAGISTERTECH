import { useContext, useState } from 'react';
import { Trash2, AlertTriangle, KeyRound, Save, Moon, Sun, Monitor } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Configuracoes() {
  const { logout, user } = useContext(AuthContext);
  const { team } = useData();
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState('');
  
  const handleFactoryReset = () => {
    if (confirmDelete === 'Zerar Tudo') {
      localStorage.clear();
      logout();
      navigate('/login');
      // Força refresh completo para matar referências em memória e re-injetar states limpos
      window.location.reload();
    }
  };

  return (
    <div className="animate-in" style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Configurações do Sistema</h1>
          <p className="page-subtitle">Ajustes locais, tema e gerenciamento de base</p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 24 }}>
        {/* Profile/Auth settings (Local) */}
        <section className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <KeyRound size={18} style={{ color: 'var(--primary)' }} /> Meu Perfil (Local)
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Nome</label>
              <input className="input" value={user?.name || ''} disabled style={{ opacity: 0.7 }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>E-mail</label>
              <input className="input" value={user?.email || ''} disabled style={{ opacity: 0.7 }} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Seu perfil está sincronizado com a base de <b>Equipe/RH</b> do sistema. Para alterar dados ou nível de acesso, um administrador deve editar o perfil na aba correspondente.
              </p>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        {user?.role === 'ADMIN' || user?.role === 'CEO' ? (
          <section className="card" style={{ padding: '24px', border: '1px solid rgba(239, 68, 68, 0.4)', background: 'var(--danger-glow)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--danger)' }}>
              <AlertTriangle size={18} /> Danger Zone
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-main)', marginBottom: 20, opacity: 0.9 }}>
              O botão abaixo apagará <b>100% dos dados locaiş</b> armazenados pelo Magister ERP (Clientes, Projetos, Transações, Colaboradores). Essa ação não pode ser desfeita. O sistema será devolvido ao estado de "Zero", pronto para produção inicial, conservando apenas a estrutura vazia e o modelo base de Admin Mestre.
            </p>
            
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'var(--bg-subtle)', padding: 16, borderRadius: 8 }}>
              <input 
                type="text" 
                className="input" 
                placeholder="Digite 'Zerar Tudo' para confirmar" 
                value={confirmDelete}
                onChange={e => setConfirmDelete(e.target.value)}
                style={{ maxWidth: 300 }}
              />
              <button 
                className="btn btn-danger" 
                onClick={handleFactoryReset}
                disabled={confirmDelete !== 'Zerar Tudo'}
                style={{ opacity: confirmDelete === 'Zerar Tudo' ? 1 : 0.5 }}
              >
                <Trash2 size={16} /> Wipe Base de Dados (Zerar)
              </button>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
