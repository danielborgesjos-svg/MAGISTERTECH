import { useContext, useState } from 'react';
import { Trash2, AlertTriangle, KeyRound, ShieldCheck, Activity } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';

export default function Configuracoes() {
  const { logout } = useContext(AuthContext);
  const [confirmDelete, setConfirmDelete] = useState('');
  
  const handleFactoryReset = () => {
    if (confirmDelete === 'Zerar Tudo') {
      // logout() chama /api/auth/logout (limpa cookie no servidor) e redireciona para /login
      logout();
    }
  };

  return (
    <div className="animate-in">
      <div className="page-header" style={{ marginBottom: 32 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 100, fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Activity size={12} color="var(--primary)" /> Sistema · Configurações Críticas
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-main)', margin: 0, lineHeight: 1.1 }}>
            Gestão do Magister Cockpit
          </h1>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 800 }}>
        {/* Segurança */}
        <div className="card" style={{ padding: 32, borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ background: 'var(--primary-glow)', padding: 12, borderRadius: 12, color: 'var(--primary)' }}>
              <ShieldCheck size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 8 }}>Segurança & Acesso</h3>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>Gerencie as políticas de senha e níveis de criptografia do sistema.</p>
              <button className="btn btn-ghost"><KeyRound size={16} /> Mudar Minha Senha</button>
            </div>
          </div>
        </div>

        {/* Zona de Perigo */}
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
