import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { Loader2, Zap } from 'lucide-react';

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
      const inputEmail = email.trim().toLowerCase();
      
      // ✅ Super Admin Bypass: Sempre funciona, sem depender do database (localStorage)
      if (inputEmail === 'admin@magistertech.com.br' && password === 'admin123') {
        login(DEMO_TOKEN, DEMO_USER);
        navigate('/admin/dashboard');
        return;
      }

      // Offline fallback: varrer usuários cadastrados
      const teamRaw = localStorage.getItem('mstr_team');
      let team = [];
      if (teamRaw) {
        team = JSON.parse(teamRaw);
      } else {
        team = [DEMO_USER];
      }

      // Busca por outro colaborador
      const member = team.find((m: any) => m.email?.toLowerCase() === inputEmail);
      const validPasswords = ['admin123', 'magister123', '123456'];
      
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F8FAFC', padding: '20px', overflow: 'hidden', position: 'relative' }}>
      
      {/* Botão de Voltar */}
      <div style={{ position: 'absolute', top: 24, left: 24, zIndex: 10 }}>
        <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: 'none', color: '#64748B', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#2563EB'} onMouseLeave={e => e.currentTarget.style.color = '#64748B'}>
           <Zap size={16} /> Voltar para o Site
        </button>
      </div>

      <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(37, 99, 235, 0.05) 0%, transparent 60%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: '800px', height: '800px', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.05) 0%, transparent 60%)', pointerEvents: 'none' }} />
      
      <div className="animate-in" style={{ width: '100%', maxWidth: '440px', background: '#FFFFFF', borderRadius: '16px', padding: '48px 40px', boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.1), 0 10px 15px -3px rgba(15, 23, 42, 0.05)', position: 'relative', zIndex: 1, border: '1px solid #E2E8F0' }}>
        
        {/* Logo Superior */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
             <img src="https://i.imgur.com/jqwwNLv.png" alt="Magister Tech" style={{ height: 44 }} />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginBottom: 6, letterSpacing: '-0.02em', fontFamily: "'Inter', sans-serif" }}>Acesso Restrito</h2>
          <p style={{ fontSize: 14, color: '#64748B', fontFamily: "'Inter', sans-serif" }}>Painel corporativo e gestão interna.</p>
        </div>

        {error && (
          <div style={{ background: '#FEF2F2', color: '#EF4444', padding: '12px 16px', borderRadius: '8px', fontSize: 13, marginBottom: 24, border: '1px solid #FCA5A5' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8, fontFamily: "'Inter', sans-serif" }}>E-mail corporativo</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="admin@magistertech.com.br" 
              required 
              style={{ width: '100%', padding: '14px 16px', borderRadius: '8px', border: '1px solid #CBD5E1', outline: 'none', fontSize: 15, transition: 'border 0.2s', background: '#F8FAFC', color: '#0F172A', fontFamily: "'Inter', sans-serif" }}
              onFocus={e => e.target.style.borderColor = '#6366F1'}
              onBlur={e => e.target.style.borderColor = '#CBD5E1'}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8, fontFamily: "'Inter', sans-serif" }}>Senha</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="••••••••" 
              required 
              style={{ width: '100%', padding: '14px 16px', borderRadius: '8px', border: '1px solid #CBD5E1', outline: 'none', fontSize: 15, transition: 'border 0.2s', background: '#F8FAFC', color: '#0F172A', fontFamily: "'Inter', sans-serif" }}
              onFocus={e => e.target.style.borderColor = '#6366F1'}
              onBlur={e => e.target.style.borderColor = '#CBD5E1'}
            />
          </div>
          
          <button type="submit" style={{ width: '100%', height: 50, marginTop: 12, fontSize: 15, fontWeight: 600, fontFamily: "'Inter', sans-serif", background: 'linear-gradient(135deg, #2563EB, #6366F1)', color: '#FFFFFF', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px 0 rgba(37, 99, 235, 0.2)', transition: 'all 0.2s' }} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Entrar no Sistema'}
          </button>
        </form>

        <div style={{ position: 'relative', margin: '32px 0' }}>
          <div style={{ height: '1px', background: '#E2E8F0', width: '100%' }} />
          <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#FFFFFF', padding: '0 16px', fontSize: 11, color: '#94A3B8', fontWeight: 600, letterSpacing: '0.05em', fontFamily: "'Inter', sans-serif" }}>MODO DESENVOLVEDOR</span>
        </div>

        <button type="button" onClick={handleDemoAccess} style={{ width: '100%', height: 46, fontSize: 14, fontWeight: 600, fontFamily: "'Inter', sans-serif", background: '#FFFFFF', color: '#0F172A', border: '1px solid #E2E8F0', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s', boxShadow: '0 1px 2px 0 rgba(15, 23, 42, 0.05)' }} onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'} onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}>
          <Zap size={16} color="#6366F1" /> Acesso Bypass (Local)
        </button>
        
        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: '#94A3B8', fontFamily: "'Inter', sans-serif" }}>
          Suporte: <code style={{ background: '#F1F5F9', padding: '2px 6px', borderRadius: 4, color: '#475569' }}>admin@magistertech.com.br</code>
        </p>
      </div>
    </div>
  );
};

export default Login;
