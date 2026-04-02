import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../contexts/AuthContext';
import { Terminal, Loader2, Zap } from 'lucide-react';

const DEMO_USER = { id: 'demo-1', name: 'Daniel Borges', email: 'admin@magistertech.com.br', role: 'admin', avatar: null };
const DEMO_TOKEN = 'demo-offline-token';

const Login = () => {
  const [email, setEmail] = useState('admin@magistertech.com.br');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Offline fallback: varrer usuários cadastrados
      const teamRaw = localStorage.getItem('mstr_team');
      let team = [];
      if (teamRaw) {
        team = JSON.parse(teamRaw);
      } else {
        // Se a base esvaziou globalmente, insere o mestre admin
        team = [DEMO_USER];
      }

      // Senha padrao "magister123" para usuários recém-criados ou "admin123" pra conta admin
      const member = team.find((m: any) => m.email === email);
      
      const validPasswords = ['admin123', 'magister123', '123456']; // Senhas aceitas em ambiente demo/offline
      
      if (member && validPasswords.includes(password)) {
        login(DEMO_TOKEN, {
          id: member.id,
          name: member.name,
          email: member.email,
          role: member.role,
          avatar: null
        });
        navigate('/admin/dashboard');
      } else {
        setError('Colaborador não encontrado ou senha incorreta.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccess = () => {
    login(DEMO_TOKEN, DEMO_USER);
    navigate('/admin/dashboard');
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
      <div className="animate-in card" style={{ width: '100%', maxWidth: '420px', padding: '44px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div className="logo-icon"><Terminal size={18} color="#fff" /></div>
            <div className="logo-text" style={{ color: 'var(--text-main)', fontFamily: "'Outfit', sans-serif", fontSize: 22, fontWeight: 800 }}>
              Magister<span style={{ color: 'var(--primary)' }}>.</span>
            </div>
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Acesso ao Sistema</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Insira suas credenciais corporativas</p>
        </div>

        {error && (
          <div style={{ background: 'var(--danger-glow)', color: 'var(--danger)', padding: '12px 16px', borderRadius: 8, fontSize: 13, marginBottom: 20, border: '1px solid rgba(239,68,68,0.2)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>E-mail</label>
            <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@magistertech.com.br" required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Senha</label>
            <input type="password" className="input" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', height: 46, marginTop: 4, fontSize: 15 }} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Entrar no Sistema'}
          </button>
        </form>

        <div style={{ position: 'relative', margin: '24px 0' }}>
          <div className="divider" />
          <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'var(--bg-card)', padding: '0 12px', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>OU</span>
        </div>

        <button type="button" className="btn btn-ghost" style={{ width: '100%', height: 42 }} onClick={handleDemoAccess}>
          <Zap size={14} style={{ color: 'var(--warning)' }} /> Acesso Demo (sem backend)
        </button>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--text-muted)' }}>
          Demo: <code style={{ background: 'var(--bg-subtle)', padding: '2px 6px', borderRadius: 4 }}>admin@magistertech.com.br</code> / <code style={{ background: 'var(--bg-subtle)', padding: '2px 6px', borderRadius: 4 }}>admin123</code>
        </p>
      </div>
    </div>
  );
};

export default Login;
