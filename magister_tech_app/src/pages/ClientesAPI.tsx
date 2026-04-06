/**
 * ClientesAPI — lista clientes diretamente do banco (backend Prisma).
 * Serve como ponto de entrada para Hub 360 e Kanban Interno por cliente.
 * Funciona apenas quando o backend está rodando com JWT real.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Activity, Building2, KanbanSquare, LayoutGrid,
  Search, Plus, RefreshCw, AlertCircle, TrendingUp
} from 'lucide-react';

interface ApiClient {
  id: string;
  name: string;
  company?: string;
  email?: string;
  segment?: string;
  status: string;
  healthScore: number;
  responsible?: string;
  createdAt: string;
}

function HealthDot({ score }: { score: number }) {
  const color = score >= 70 ? 'var(--success)' : score >= 40 ? 'var(--warning)' : 'var(--danger)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
      <span style={{ fontSize: 12, fontWeight: 700, color }}>{score}%</span>
    </div>
  );
}

export default function ClientesAPI() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<ApiClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const token = localStorage.getItem('magister_token');
  const isDemoToken = token === 'demo-offline-token' || !token;

  const loadClients = async () => {
    if (isDemoToken) { setLoading(false); return; }
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get('/api/clients', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClients(data);
    } catch (e: any) {
      if (e?.response?.status === 401) {
        setError('Sessão expirada. Faça login novamente.');
      } else {
        setError('Backend indisponível. Certifique-se de que o servidor está rodando na porta 3001.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadClients(); }, []);

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.company || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q)
    );
  });

  // ─── Estado: token demo / backend offline ──────────────────
  if (isDemoToken) {
    return (
      <div className="animate-in">
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>Hub de Clientes</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Acesso 360 e Kanban interno por cliente.</p>
        </div>
        <div className="card" style={{ padding: 40, textAlign: 'center', maxWidth: 520, margin: '0 auto' }}>
          <AlertCircle size={36} color="var(--warning)" style={{ marginBottom: 16 }} />
          <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Backend necessário</h3>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 24 }}>
            Você está em <strong>modo offline (Bypass)</strong>. Para acessar o Hub 360 e o Kanban interno, o backend precisa estar rodando e você precisa fazer login com credenciais reais.
          </p>
          <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px', textAlign: 'left', marginBottom: 20, fontSize: 13 }}>
            <p style={{ fontWeight: 700, marginBottom: 8 }}>Como ativar:</p>
            <ol style={{ paddingLeft: 18, color: 'var(--text-muted)', lineHeight: 2 }}>
              <li>Abra um terminal em <code style={{ background: 'var(--bg-card)', padding: '1px 5px', borderRadius: 4 }}>magister_tech_backend</code></li>
              <li>Rode <code style={{ background: 'var(--bg-card)', padding: '1px 5px', borderRadius: 4 }}>npm run dev</code></li>
              <li>Faça logout e entre novamente com <code style={{ background: 'var(--bg-card)', padding: '1px 5px', borderRadius: 4 }}>admin@magistertech.com.br / admin123</code></li>
            </ol>
          </div>
          <button className="btn btn-primary" onClick={() => { localStorage.removeItem('magister_token'); localStorage.removeItem('magister_user'); navigate('/login'); }}>
            Ir para o Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in" style={{ paddingBottom: 40 }}>
      {/* ─── HEADER ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 100, fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Activity size={12} color="var(--primary)" /> Hub de Clientes · Banco de Dados
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-main)', margin: 0, lineHeight: 1.1 }}>
            Hub de Clientes
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8 }}>
            Acesso 360 e Kanban interno — dados do banco de dados.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={loadClients} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={14} /> Atualizar
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/admin/crm')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} /> Novo Cliente
          </button>
        </div>
      </div>

      {/* ─── ERRO ─── */}
      {error && (
        <div style={{ background: 'var(--danger-glow)', border: '1px solid var(--danger)', borderRadius: 10, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle size={16} color="var(--danger)" />
          <p style={{ fontSize: 13, color: 'var(--danger)' }}>{error}</p>
        </div>
      )}

      {/* ─── BUSCA ─── */}
      <div className="card" style={{ padding: '14px 18px', marginBottom: 20 }}>
        <div className="search-bar">
          <Search size={15} style={{ color: 'var(--text-light)' }} />
          <input
            placeholder="Buscar por nome, empresa ou e-mail..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ─── LISTA ─── */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
          <Activity size={24} color="var(--primary)" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <Building2 size={36} color="var(--text-light)" style={{ marginBottom: 12 }} />
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            {clients.length === 0 ? 'Nenhum cliente no banco de dados. Rode o seed primeiro.' : 'Nenhum cliente encontrado.'}
          </p>
          {clients.length === 0 && (
            <code style={{ display: 'block', marginTop: 12, background: 'var(--bg-subtle)', padding: '8px 14px', borderRadius: 8, fontSize: 12, color: 'var(--text-muted)' }}>
              npm run seed  (na pasta magister_tech_backend)
            </code>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {filtered.map(client => (
            <div key={client.id} className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Card header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="avatar" style={{
                  width: 44, height: 44, fontSize: 15, fontWeight: 800,
                  background: `hsl(${(client.id.charCodeAt(0) * 37) % 360}, 55%, 50%)`,
                  color: '#fff', borderRadius: 12, flexShrink: 0,
                }}>
                  {(client.company || client.name).substring(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <p style={{ fontWeight: 800, fontSize: 14, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {client.company || client.name}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {client.email || 'Sem e-mail'}
                  </p>
                </div>
                <span className="badge" style={{
                  background: client.status === 'ATIVO' ? 'var(--success-glow)' : 'var(--bg-subtle)',
                  color: client.status === 'ATIVO' ? 'var(--success)' : 'var(--text-muted)',
                  fontWeight: 700, fontSize: 11, flexShrink: 0,
                }}>
                  {client.status}
                </span>
              </div>

              {/* Detalhes */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {client.segment && (
                  <span className="badge" style={{ background: 'var(--indigo-glow)', color: 'var(--indigo)', fontSize: 11 }}>
                    {client.segment}
                  </span>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 'auto' }}>
                  <TrendingUp size={11} color="var(--text-muted)" />
                  <HealthDot score={client.healthScore} />
                </div>
              </div>

              {/* Ações */}
              <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 12 }}
                  onClick={() => navigate(`/admin/clientes/${client.id}/hub`)}
                >
                  <LayoutGrid size={13} /> Hub 360
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 12 }}
                  onClick={() => navigate(`/admin/clientes/${client.id}/kanban`)}
                >
                  <KanbanSquare size={13} /> Kanban
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
