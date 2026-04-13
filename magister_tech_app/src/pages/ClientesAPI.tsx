/**
 * ClientesAPI — lista clientes diretamente do banco (backend Prisma).
 * Sessão via httpOnly cookie — sem token em localStorage.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
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

  const loadClients = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<ApiClient[]>('/api/clients?withContracts=true');
      setClients(data);
    } catch (e: any) {
      if (e?.message?.includes('401') || e?.message?.includes('Sessão')) {
        setError('Sessão expirada. Redirecionando para login...');
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
