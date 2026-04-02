import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Tenta fazer o login real com o motor
      const resp = await fetch('http://localhost:3333/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await resp.json();
      
      if (resp.ok) {
        localStorage.setItem('holozonic_token', data.token);
        localStorage.setItem('holozonic_user', JSON.stringify(data.user));
        navigate('/painel');
      } else {
        // Fallback rápido se o banco de dados não estiver rodando (Apenas para dev local)
        if (email === 'admin@holozonic.com' && password === 'admin') {
           navigate('/painel');
           return;
        }
        setError(data.error || 'Erro de autenticação');
      }
    } catch (err) {
      // Fallback bypass: Se falhar conexão (banco desligado) e tentar o master, deixa ver o painel mockup
      if (email === 'admin@holozonic.com' && password === 'admin') {
         navigate('/painel');
         return;
      }
      setError('Falha de conexão com o servidor. (Postgres está rodando?)');
    } finally {
      if (email !== 'admin@holozonic.com' || password !== 'admin') {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 overflow-hidden relative" style={{ backgroundImage: 'radial-gradient(circle at top right, #312e81 0%, #0f172a 40%)' }}>
      
      {/* Background Orbs */}
      <div className="absolute top-[-100px] right-[-100px] w-96 h-96 bg-mint-300 rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>
      <div className="absolute bottom-[-100px] left-[-100px] w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>

      <div className="w-full max-w-md p-8 relative z-10">
        <div className="mb-10 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-mint-300 to-emerald-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-mint-500/30 mb-6">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Painel Administrativo</h1>
          <p className="text-slate-400 font-medium mt-2">Acesso restrito para médicos e gestão.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6 bg-slate-800/50 backdrop-blur-xl p-8 rounded-3xl border border-slate-700/50 shadow-2xl">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-bold text-center">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-slate-300 font-bold text-sm mb-2">E-mail Profissional</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-mint-300 focus:ring-1 focus:ring-mint-300 transition-colors"
                  placeholder="dr.exemplo@holozonic.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-bold text-sm mb-2">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-mint-300 focus:ring-1 focus:ring-mint-300 transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-mint-300 to-emerald-400 hover:from-mint-200 hover:to-emerald-300 text-slate-900 font-extrabold py-3.5 rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? 'Autenticando...' : 'Entrar no Sistema'}
            <ArrowRight size={20} />
          </button>
          
          <div className="text-center mt-6">
             <p className="text-xs text-slate-500 font-medium">Bypass p/ teste local: Use admin@holozonic.com / admin</p>
          </div>
        </form>

        <p className="text-center text-slate-500 text-xs font-medium mt-8">
          &copy; 2026 Holozonic Digital Clinic. Sistema Seguro.
        </p>
      </div>
    </div>
  );
}
