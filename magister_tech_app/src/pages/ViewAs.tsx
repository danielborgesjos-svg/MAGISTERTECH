import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye, EyeOff, Search, Users, Shield, UserCircle, Briefcase,
  Activity, AlertTriangle, ChevronRight, Monitor, RefreshCw,
  LayoutDashboard, KanbanSquare, FileText, DollarSign, Target,
  Calendar, PenTool, Rss, Wifi, Fingerprint, BarChart2, MessageCircle
} from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import { apiFetch } from '../lib/api';

interface TeamUser {
  id: string;
  name: string;
  email: string;
  role: string;
  sector?: string;
  avatar?: string;
  isActive: boolean;
}

// Mapeamento de role → módulos visíveis
const MODULES_BY_ROLE: Record<string, { label: string; icon: any; color: string }[]> = {
  ADMIN: [
    { label: 'Cockpit', icon: LayoutDashboard, color: '#7c3aed' },
    { label: 'Kanban', icon: KanbanSquare, color: '#3b82f6' },
    { label: 'Agenda', icon: Calendar, color: '#10b981' },
    { label: 'Mural', icon: Rss, color: '#f59e0b' },
    { label: 'Pipeline', icon: Target, color: '#6366f1' },
    { label: 'CRM', icon: Users, color: '#ec4899' },
    { label: 'Inbox', icon: MessageCircle, color: '#25d366' },
    { label: 'Contratos', icon: FileText, color: '#14b8a6' },
    { label: 'Projetos', icon: Briefcase, color: '#8b5cf6' },
    { label: 'Conteúdo', icon: PenTool, color: '#f43f5e' },
    { label: 'Financeiro', icon: DollarSign, color: '#22c55e' },
    { label: 'KPIs', icon: BarChart2, color: '#0ea5e9' },
    { label: 'Equipe/RH', icon: UserCircle, color: '#a78bfa' },
    { label: 'WhatsApp', icon: Wifi, color: '#25d366' },
    { label: 'Logs Master', icon: Fingerprint, color: '#94a3b8' },
  ],
  CEO: [
    { label: 'Cockpit', icon: LayoutDashboard, color: '#7c3aed' },
    { label: 'KPIs', icon: BarChart2, color: '#0ea5e9' },
    { label: 'Financeiro', icon: DollarSign, color: '#22c55e' },
    { label: 'Pipeline', icon: Target, color: '#6366f1' },
    { label: 'Projetos', icon: Briefcase, color: '#8b5cf6' },
    { label: 'Equipe/RH', icon: UserCircle, color: '#a78bfa' },
    { label: 'Mural', icon: Rss, color: '#f59e0b' },
  ],
  GESTOR: [
    { label: 'Cockpit', icon: LayoutDashboard, color: '#7c3aed' },
    { label: 'Kanban', icon: KanbanSquare, color: '#3b82f6' },
    { label: 'CRM', icon: Users, color: '#ec4899' },
    { label: 'Pipeline', icon: Target, color: '#6366f1' },
    { label: 'Contratos', icon: FileText, color: '#14b8a6' },
    { label: 'Projetos', icon: Briefcase, color: '#8b5cf6' },
    { label: 'Financeiro', icon: DollarSign, color: '#22c55e' },
    { label: 'Equipe/RH', icon: UserCircle, color: '#a78bfa' },
    { label: 'Agenda', icon: Calendar, color: '#10b981' },
    { label: 'Conteúdo', icon: PenTool, color: '#f43f5e' },
    { label: 'Mural', icon: Rss, color: '#f59e0b' },
  ],
  FINANCEIRO: [
    { label: 'Cockpit', icon: LayoutDashboard, color: '#7c3aed' },
    { label: 'Financeiro', icon: DollarSign, color: '#22c55e' },
    { label: 'KPIs', icon: BarChart2, color: '#0ea5e9' },
    { label: 'Contratos', icon: FileText, color: '#14b8a6' },
    { label: 'Kanban', icon: KanbanSquare, color: '#3b82f6' },
    { label: 'Agenda', icon: Calendar, color: '#10b981' },
    { label: 'Mural', icon: Rss, color: '#f59e0b' },
  ],
  COMERCIAL: [
    { label: 'Cockpit', icon: LayoutDashboard, color: '#7c3aed' },
    { label: 'CRM', icon: Users, color: '#ec4899' },
    { label: 'Pipeline', icon: Target, color: '#6366f1' },
    { label: 'Contratos', icon: FileText, color: '#14b8a6' },
    { label: 'Kanban', icon: KanbanSquare, color: '#3b82f6' },
    { label: 'Inbox', icon: MessageCircle, color: '#25d366' },
    { label: 'Agenda', icon: Calendar, color: '#10b981' },
    { label: 'Mural', icon: Rss, color: '#f59e0b' },
  ],
  GESTOR_PROJETOS: [
    { label: 'Cockpit', icon: LayoutDashboard, color: '#7c3aed' },
    { label: 'Kanban', icon: KanbanSquare, color: '#3b82f6' },
    { label: 'Projetos', icon: Briefcase, color: '#8b5cf6' },
    { label: 'Conteúdo', icon: PenTool, color: '#f43f5e' },
    { label: 'Equipe/RH', icon: UserCircle, color: '#a78bfa' },
    { label: 'Agenda', icon: Calendar, color: '#10b981' },
    { label: 'Mural', icon: Rss, color: '#f59e0b' },
  ],
  DESIGNER: [
    { label: 'Cockpit', icon: LayoutDashboard, color: '#7c3aed' },
    { label: 'Kanban', icon: KanbanSquare, color: '#3b82f6' },
    { label: 'Conteúdo', icon: PenTool, color: '#f43f5e' },
    { label: 'Projetos', icon: Briefcase, color: '#8b5cf6' },
    { label: 'Agenda', icon: Calendar, color: '#10b981' },
    { label: 'Mural', icon: Rss, color: '#f59e0b' },
  ],
  CLIENTE: [
    { label: 'Portal do Cliente', icon: Monitor, color: '#6366f1' },
  ],
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  CEO: 'CEO / Diretor',
  GESTOR: 'Gestor',
  GESTOR_PROJETOS: 'Gestor de Projetos',
  FINANCEIRO: 'Financeiro',
  COMERCIAL: 'Comercial',
  DESIGNER: 'Designer',
  SOCIAL_MEDIA: 'Social Media',
  PROJETO: 'Projetos',
  COLABORADOR: 'Colaborador',
  CLIENTE: 'Cliente',
};

const ROLE_COLOR: Record<string, string> = {
  ADMIN: '#7c3aed',
  CEO: '#0ea5e9',
  GESTOR: '#10b981',
  FINANCEIRO: '#f59e0b',
  COMERCIAL: '#6366f1',
  DESIGNER: '#ec4899',
  GESTOR_PROJETOS: '#8b5cf6',
  CLIENTE: '#64748b',
  COLABORADOR: '#94a3b8',
};

export default function ViewAs() {
  const { realUser, impersonating, startImpersonation, stopImpersonation } = useContext(AuthContext);
  const navigate = useNavigate();

  const [users, setUsers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [selectedUser, setSelectedUser] = useState<TeamUser | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<TeamUser[]>('/api/users')
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole ? u.role.toUpperCase() === filterRole : true;
    return matchSearch && matchRole;
  });

  const roles = [...new Set(users.map(u => u.role.toUpperCase()))];

  const handleViewAs = (u: TeamUser) => {
    startImpersonation({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      avatar: u.avatar || null,
      sector: u.sector,
      preferences: null,
    });
    navigate('/admin/dashboard');
  };

  const modulesForUser = (role: string) => {
    const r = role.toUpperCase();
    return MODULES_BY_ROLE[r] || MODULES_BY_ROLE['COLABORADOR'] || [];
  };

  return (
    <div className="animate-in" style={{ paddingBottom: 60 }}>

      {/* ─── HEADER ─────────────────────────────────────────────── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px',
          background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 100,
          fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12,
          textTransform: 'uppercase', letterSpacing: '0.05em'
        }}>
          <Eye size={12} color="var(--primary)" /> Ferramentas de Debug
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 900, margin: '0 0 8px', letterSpacing: '-0.04em' }}>
          Visualizar Como
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
          Veja o ERP exatamente como qualquer usuário vê — com suas permissões, módulos e dados. Ideal para debug de UI e suporte.
        </p>
      </div>

      {/* ─── AVISO QUANDO IMPERSONANDO ────────────────────────────── */}
      {impersonating && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px',
          background: 'color-mix(in srgb, var(--warning) 10%, var(--bg-card))',
          border: '2px solid var(--warning)', borderRadius: 14, marginBottom: 28,
        }}>
          <AlertTriangle size={22} color="var(--warning)" />
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 800, color: 'var(--warning)', margin: 0, fontSize: 14 }}>
              Modo Visualização Ativo
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>
              Você está navegando como um usuário diferente. O sistema mostra exatamente o que esse usuário vê.
            </p>
          </div>
          <button
            className="btn btn-outline"
            style={{ borderColor: 'var(--warning)', color: 'var(--warning)', gap: 6 }}
            onClick={stopImpersonation}
          >
            <EyeOff size={14} /> Sair da Visualização
          </button>
        </div>
      )}

      {/* ─── PAINEL DE BOAS-VINDAS / INSTRUÇÕES ───────────────────── */}
      {!impersonating && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28
        }}>
          {[
            {
              icon: <Monitor size={22} color="var(--primary)" />,
              title: 'Visão Fiel',
              desc: 'Veja exatamente o que o usuário vê: sidebar, módulos disponíveis e restrições de acesso.',
              color: 'var(--primary)',
            },
            {
              icon: <Shield size={22} color="var(--success)" />,
              title: '100% Seguro',
              desc: 'Nenhuma sessão real é trocada. Você permanece como admin — é apenas uma sobreposição de UI.',
              color: 'var(--success)',
            },
            {
              icon: <Activity size={22} color="var(--info)" />,
              title: 'Debug Preciso',
              desc: 'Reproduza bugs de permissão, visibilidade de dados e problemas de UI com precisão cirúrgica.',
              color: 'var(--info)',
            },
          ].map(card => (
            <div key={card.title} className="card" style={{ padding: 20, display: 'flex', gap: 14, alignItems: 'flex-start', borderTop: `3px solid ${card.color}` }}>
              <div style={{ padding: 8, background: `color-mix(in srgb, ${card.color} 12%, var(--bg-subtle))`, borderRadius: 10, flexShrink: 0 }}>
                {card.icon}
              </div>
              <div>
                <p style={{ fontWeight: 800, margin: '0 0 4px', fontSize: 14 }}>{card.title}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>{card.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── FILTROS ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="input"
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 36, width: '100%' }}
          />
        </div>
        <select
          className="input"
          value={filterRole}
          onChange={e => setFilterRole(e.target.value)}
          style={{ minWidth: 180 }}
        >
          <option value="">Todos os cargos</option>
          {roles.map(r => (
            <option key={r} value={r}>{ROLE_LABELS[r] || r}</option>
          ))}
        </select>
        <button
          className="btn btn-outline"
          onClick={() => { setSearch(''); setFilterRole(''); }}
          style={{ gap: 6, flexShrink: 0 }}
        >
          <RefreshCw size={14} /> Limpar
        </button>
      </div>

      {/* ─── GRID DE USUÁRIOS ───────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
        {loading && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
            <p>Carregando usuários...</p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <Users size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p style={{ fontSize: 14 }}>Nenhum usuário encontrado</p>
          </div>
        )}

        {filtered.map(u => {
          const roleColor = ROLE_COLOR[u.role.toUpperCase()] || '#94a3b8';
          const isMe = realUser?.id === u.id;
          const modules = modulesForUser(u.role);
          const isSelected = selectedUser?.id === u.id;

          return (
            <div
              key={u.id}
              className="card"
              style={{
                overflow: 'hidden',
                borderTop: `3px solid ${roleColor}`,
                boxShadow: hovered === u.id ? 'var(--shadow-lg)' : 'var(--shadow)',
                transform: hovered === u.id ? 'translateY(-2px)' : 'none',
                transition: 'all 0.2s ease',
                opacity: !u.isActive ? 0.5 : 1,
              }}
              onMouseEnter={() => setHovered(u.id)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Card header */}
              <div style={{ padding: '20px 20px 16px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                  background: u.avatar ? `url(${u.avatar}) center/cover` : `color-mix(in srgb, ${roleColor} 20%, var(--bg-subtle))`,
                  border: `2px solid ${roleColor}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 900, color: roleColor,
                }}>
                  {!u.avatar && u.name.substring(0, 2).toUpperCase()}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <p style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-main)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {u.name}
                    </p>
                    {isMe && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', background: 'var(--primary-glow)', color: 'var(--primary)', borderRadius: 20 }}>
                        VOCÊ
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {u.email}
                  </p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                      background: `color-mix(in srgb, ${roleColor} 15%, transparent)`,
                      color: roleColor, border: `1px solid ${roleColor}30`,
                    }}>
                      {ROLE_LABELS[u.role.toUpperCase()] || u.role}
                    </span>
                    {u.sector && (
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'var(--bg-subtle)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                        {u.sector}
                      </span>
                    )}
                    {!u.isActive && (
                      <span className="badge badge-danger">Inativo</span>
                    )}
                  </div>
                </div>

                {/* Toggle detalhe */}
                <button
                  className="btn-icon"
                  onClick={() => setSelectedUser(isSelected ? null : u)}
                  title="Ver módulos acessíveis"
                  style={{ flexShrink: 0, color: isSelected ? roleColor : 'var(--text-muted)' }}
                >
                  <ChevronRight size={16} style={{ transform: isSelected ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
              </div>

              {/* Módulos expandidos */}
              {isSelected && (
                <div style={{ padding: '0 20px 16px' }}>
                  <div style={{ padding: '12px', background: 'var(--bg-subtle)', borderRadius: 10, marginBottom: 12 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                      Módulos que este usuário acessa
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {modules.map(m => {
                        const Icon = m.icon;
                        return (
                          <span key={m.label} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px',
                            background: `color-mix(in srgb, ${m.color} 12%, var(--bg-card))`,
                            border: `1px solid ${m.color}30`, borderRadius: 20, fontSize: 11, fontWeight: 600, color: m.color,
                          }}>
                            <Icon size={11} />
                            {m.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Footer com ação */}
              <div style={{ padding: '12px 20px 20px', paddingTop: isSelected ? 0 : 0 }}>
                {isMe ? (
                  <div style={{ padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: 10, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
                    Esta é a sua própria conta — visualização desnecessária
                  </div>
                ) : u.role.toUpperCase() === 'CLIENTE' ? (
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', gap: 8, background: roleColor, borderColor: roleColor }}
                    onClick={() => {
                      handleViewAs(u);
                      navigate('/cliente-dashboard');
                    }}
                  >
                    <Eye size={15} /> Portal do Cliente ({u.name.split(' ')[0]})
                  </button>
                ) : (
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', gap: 8, background: roleColor, borderColor: roleColor }}
                    onClick={() => handleViewAs(u)}
                    disabled={!u.isActive}
                  >
                    <Eye size={15} /> Visualizar como {u.name.split(' ')[0]}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
