import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../contexts/AuthContext';
import { Loader2, Lock, Mail } from 'lucide-react';

const ALL_PERMISSIONS = [
  'dashboard', 'kanban', 'crm', 'pipeline', 'contratos',
  'projetos', 'financeiro', 'agenda', 'conteudo', 'equipe',
  'chat', 'config', 'feed', 'cliente-hub', 'kanban-cliente',
];

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Preencha e-mail e senha.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const { data } = await axios.post('/api/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });

      login(data.token, {
        ...data.user,
        accessLevel: data.user.role === 'ADMIN' || data.user.role === 'CEO' ? 'ADMIN' : 'EDITOR',
        permissions: ALL_PERMISSIONS,
      });
      navigate('/admin/dashboard');
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) {
        setError('E-mail ou senha incorretos.');
      } else {
        setError('Serviço temporariamente indisponível. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', padding: '20px', position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)'
    }}>
      {/* Glow orbs */}
      <div style={{ position: 'absolute', top: '20%', left: '15%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 65%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: 600, height: 600, background: 'radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 65%)', pointerEvents: 'none' }} />

      <div style={{
        width: '100%', maxWidth: 440, position: 'relative', zIndex: 1,
        background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(20px)',
        borderRadius: 20, padding: '48px 40px',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.1)',
      }}>
        {/* Logo / Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18, margin: '0 auto 20px',
            background: 'linear-gradient(135deg, #4f46e5, #2563eb)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(79,70,229,0.4)'
          }}>
            <Lock size={28} color="#fff" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f8fafc', marginBottom: 6, letterSpacing: '-0.02em' }}>
            Acesso Restrito
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(148,163,184,0.8)' }}>
            Magister Tech · Painel Corporativo
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.12)', color: '#fca5a5',
            padding: '12px 16px', borderRadius: 10, fontSize: 13, marginBottom: 24,
            border: '1px solid rgba(239,68,68,0.3)', textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(148,163,184,0.9)', marginBottom: 8 }}>
              E-mail corporativo
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="rgba(148,163,184,0.5)" style={{ position: 'absolute', top: '50%', left: 14, transform: 'translateY(-50%)' }} />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                autoComplete="email"
                style={{
                  width: '100%', padding: '13px 16px 13px 44px', borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.1)', outline: 'none',
                  fontSize: 15, background: 'rgba(255,255,255,0.05)',
                  color: '#f8fafc', fontFamily: "'Inter', sans-serif", transition: 'border 0.2s', boxSizing: 'border-box'
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.7)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(148,163,184,0.9)', marginBottom: 8 }}>
              Senha
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="rgba(148,163,184,0.5)" style={{ position: 'absolute', top: '50%', left: 14, transform: 'translateY(-50%)' }} />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                style={{
                  width: '100%', padding: '13px 16px 13px 44px', borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.1)', outline: 'none',
                  fontSize: 15, background: 'rgba(255,255,255,0.05)',
                  color: '#f8fafc', fontFamily: "'Inter', sans-serif", transition: 'border 0.2s', boxSizing: 'border-box'
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.7)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', height: 52, marginTop: 8, fontSize: 15, fontWeight: 700,
              background: loading ? 'rgba(79,70,229,0.5)' : 'linear-gradient(135deg, #4f46e5, #2563eb)',
              color: '#fff', border: 'none', borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 4px 20px rgba(79,70,229,0.3)', transition: 'all 0.2s',
              fontFamily: "'Inter', sans-serif"
            }}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Entrar no Sistema'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 28, fontSize: 12, color: 'rgba(100,116,139,0.7)' }}>
          Acesso exclusivo à equipe autorizada · Magister Tech
        </p>
      </div>
    </div>
  );
};

export default Login;
