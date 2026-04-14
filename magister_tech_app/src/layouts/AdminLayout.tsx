import { useContext, useState } from 'react';
import { Outlet, NavLink, Navigate, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, KanbanSquare, Users, FileText,
  LogOut, Terminal, Calendar, PenTool,
  Briefcase, Landmark, Moon, Sun, Target, UserCircle,
  Bell, Search, ChevronRight, Settings, X, Rss, Activity, Wifi, MessageCircle, Network, Fingerprint, Headset, BarChart2, Eye, EyeOff, CheckCircle, Trash2
} from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import { usePermission } from '../hooks/usePermission';
import { useData } from '../contexts/DataContext';

const AdminLayout = () => {
  const { user, loading, theme, logout, updatePreferences, impersonating, stopImpersonation } = useContext(AuthContext);
  const { canViewModule } = usePermission();
  const { alerts, feed } = useData();
  const navigate = useNavigate();
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div className="logo-icon"><Terminal size={20} color="#fff" /></div>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Carregando Magister ERP...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    updatePreferences({ theme: nextTheme });
  };

  const alertCount = alerts.length;
  const dangerAlerts = alerts.filter(a => a.type === 'danger');
  const warningAlerts = alerts.filter(a => a.type === 'warning');
  const otherAlerts = alerts.filter(a => a.type !== 'danger' && a.type !== 'warning');

  // Unread feed posts count (posts newer than last visit — simplified: all pinned + last 3)
  const unreadFeed = feed.filter(p => p.pinned).length;

  const navGroups = [
    {
      label: 'Visão Geral',
      items: [
        { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Cockpit', module: 'dashboard' },
        { to: '/admin/kanban', icon: KanbanSquare, label: 'Kanban', module: 'kanban' },
        { to: '/admin/agenda', icon: Calendar, label: 'Agenda', module: 'agenda' },
        { to: '/admin/feed', icon: Rss, label: 'Mural', module: 'feed', badge: unreadFeed },
      ]
    },
    {
      label: 'Comercial',
      items: [
        { to: '/admin/pipeline', icon: Target, label: 'Pipeline', module: 'pipeline' },
        { to: '/admin/tickets', icon: Activity, label: 'Tickets Suporte', module: 'crm' },
        { to: '/admin/inbox', icon: MessageCircle, label: 'Inbox N1', module: 'crm' },
        { to: '/admin/crm', icon: Users, label: 'CRM — Clientes', module: 'crm' },
        { to: '/admin/contratos', icon: FileText, label: 'Contratos', module: 'contratos' },
      ]
    },
    {
      label: 'Produção',
      items: [
        { to: '/admin/projetos', icon: Briefcase, label: 'Projetos', module: 'projetos' },
        { to: '/admin/conteudo', icon: PenTool, label: 'Conteúdo', module: 'conteudo' },
        { to: '/admin/aprovacoes', icon: CheckCircle, label: 'Aprovações', module: 'conteudo' },
        { to: '/admin/hub-clientes', icon: Activity, label: 'Hub de Clientes', module: 'cliente-hub' },
        { to: '/admin/team/diagrama', icon: Network, label: 'Diagrama de Resp.', module: 'projetos' },
      ]
    },
    {
      label: 'Administrativo',
      items: [
        { to: '/admin/financeiro', icon: Landmark, label: 'Financeiro', module: 'financeiro' },
        { to: '/admin/kpis', icon: BarChart2, label: 'KPIs Estratégicos', module: 'kpis' },
        { to: '/admin/equipe', icon: UserCircle, label: 'Equipe / RH', module: 'equipe' },
        { to: '/admin/conectividade', icon: Wifi, label: 'WhatsApp', module: 'dashboard' },
        { to: '/suporte', icon: Headset, label: 'Portal de Suporte (Público)', module: 'dashboard' },
        { to: '/admin/audit', icon: Fingerprint, label: 'Logs Master', module: 'dashboard' },
        { to: '/admin/view-as', icon: Eye, label: 'Visualizar Como', module: 'view-as' },
      ]
    },
  ];

  return (
    <div className={`admin-layout ${theme === 'dark' ? 'dark-mode' : ''}`}>
      {/* ─── SIDEBAR ─────────────────────────────────────── */}
      <aside className={`admin-sidebar ${collapsed ? 'collapsed' : ''}`} style={{ width: collapsed ? 72 : 256 }}>
        {/* Logo */}
        <div className="logo-area" style={{ justifyContent: collapsed ? 'center' : 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="logo-icon">
              <Terminal size={18} color="#fff" />
            </div>
            {!collapsed && (
              <div>
                <div className="logo-text">Magister<span>.</span></div>
                <div style={{ fontSize: 10, color: 'rgba(148,163,184,0.6)', letterSpacing: 1 }}>ERP SYSTEM</div>
              </div>
            )}
          </div>
          {!collapsed && (
            <button onClick={() => setCollapsed(true)} style={{ background: 'transparent', border: 'none', color: 'rgba(148,163,184,0.5)', cursor: 'pointer', padding: 4 }}>
              <ChevronRight size={16} />
            </button>
          )}
        </div>

        <nav style={{ padding: '12px 10px', flex: 1, overflowY: 'auto' }}>
          {navGroups.map(group => {
            const visibleItems = group.items.filter(item => canViewModule(item.module));
            if (visibleItems.length === 0) return null;
            return (
              <div key={group.label}>
                {!collapsed && <div className="nav-group-label">{group.label}</div>}
                {visibleItems.map(item => (
                  collapsed ? (
                    <div key={item.to} className="tooltip-wrap" style={{ marginBottom: 2 }}>
                      <NavLink to={item.to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        style={{ justifyContent: 'center', padding: '10px' }}>
                        <item.icon size={20} />
                      </NavLink>
                      <div className="tooltip">{item.label}</div>
                    </div>
                  ) : (
                    <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                      <item.icon size={18} />
                      <span style={{ flex: 1 }}>{item.label}</span>
                      {(item as any).badge > 0 && (
                        <span className="badge badge-danger" style={{ padding: '1px 6px', fontSize: 10 }}>
                          {(item as any).badge}
                        </span>
                      )}
                      {item.module === 'dashboard' && alertCount > 0 && (
                        <span className="badge badge-danger" style={{ padding: '1px 6px', fontSize: 10 }}>{alertCount}</span>
                      )}
                    </NavLink>
                  )
                ))}
              </div>
            );
          })}
        </nav>

        {/* User Card */}
        {!collapsed && (
          <div className="user-card-sidebar" style={{ cursor: 'default' }}>
            <div
              onClick={() => navigate('/admin/perfil')}
              style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: user.avatar ? `url(${user.avatar}) center/cover` : 'var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 900, color: '#fff', border: '2px solid rgba(255,255,255,0.2)',
                cursor: 'pointer'
              }}
            >
              {!user.avatar && user.name.substring(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div 
                onClick={() => navigate('/admin/perfil')}
                style={{ fontSize: 13, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}
              >
                {user.name.split(' ')[0]}
              </div>
              <div 
                onClick={(e) => { e.stopPropagation(); setRoleModalOpen(true); }}
                style={{ 
                   display: 'inline-block',
                   fontSize: 10, fontWeight: 800, color: 'var(--primary)', 
                   textTransform: 'uppercase', background: 'rgba(99,102,241,0.15)',
                   padding: '2px 6px', borderRadius: 4, marginTop: 4, cursor: 'pointer', border: '1px solid rgba(99,102,241,0.3)'
                }}
              >
                {user.sector || user.role} <ChevronRight size={10} style={{ display: 'inline', marginBottom: -2 }} />
              </div>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="sidebar-footer">
          {collapsed ? (
            <>
              <button onClick={() => setCollapsed(false)} className="nav-item" style={{ justifyContent: 'center', padding: '10px' }}>
                <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} />
              </button>
              <button onClick={toggleTheme} className="nav-item" style={{ justifyContent: 'center', padding: '10px' }}>
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button onClick={() => { logout(); navigate('/login'); }} className="nav-item" style={{ justifyContent: 'center', padding: '10px', color: 'var(--danger)' }}>
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <>
              <button onClick={toggleTheme} className="nav-item">
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
              </button>
              <button onClick={() => navigate('/admin/perfil')} className="nav-item">
                <UserCircle size={18} /> Meu Perfil
              </button>
              <button onClick={() => navigate('/admin/config')} className="nav-item">
                <Settings size={18} /> Configurações
              </button>
              {(role === 'ADMIN' || role === 'CEO') && (
                <button onClick={() => navigate('/admin/lixeira')} className="nav-item" style={{ color: 'var(--danger)', opacity: 0.8 }}>
                  <Trash2 size={18} /> Lixeira
                </button>
              )}
              <button onClick={() => { logout(); navigate('/login'); }} className="nav-item" style={{ color: 'var(--danger)' }}>
                <LogOut size={18} /> Sair do Sistema
              </button>
            </>
          )}
        </div>
      </aside>

      {/* ─── MAIN AREA ────────────────────────────────────── */}
      <main className="admin-main" style={{ marginLeft: collapsed ? 72 : 256 }}>
        {/* Top Bar */}
        <header className="admin-header">
          <div className="search-bar">
            <Search size={15} style={{ color: 'var(--text-light)', flexShrink: 0 }} />
            <input placeholder="Buscar clientes, projetos, tarefas..." />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Alerts Bell */}
            <div style={{ position: 'relative' }}>
              <button className="btn-icon" onClick={() => setAlertsOpen(!alertsOpen)} style={{ position: 'relative' }}>
                <Bell size={16} />
                {alertCount > 0 && (
                  <span className="notification-dot" style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, fontSize: 9 }}>
                    {alertCount > 9 ? '9+' : alertCount}
                  </span>
                )}
              </button>

              {alertsOpen && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: 8,
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)',
                  width: 360, maxHeight: 440, overflowY: 'auto', zIndex: 300,
                  animation: 'slideUp 0.2s ease'
                }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 700 }}>Alertas do Sistema</h3>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{alertCount} alertas ativos</p>
                    </div>
                    <button className="btn-icon btn-sm" onClick={() => setAlertsOpen(false)}><X size={14} /></button>
                  </div>
                  <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {alerts.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>Nenhum alerta ativo</p>}
                    {[...dangerAlerts, ...warningAlerts, ...otherAlerts].map(a => (
                      <div key={a.id} className={`alert-item ${a.type}`}>
                        <div className="status-dot" style={{ marginTop: 3, background: a.type === 'danger' ? 'var(--danger)' : a.type === 'warning' ? 'var(--warning)' : a.type === 'purple' ? 'var(--purple)' : 'var(--primary)' }} />
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 500 }}>{a.message}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.createdAt}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User avatar → profile page */}
            <div
              style={{
                width: 36, height: 36, borderRadius: '50%',
                background: user.avatar ? `url(${user.avatar}) center/cover` : 'var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 900, color: '#fff',
                cursor: 'pointer', border: '2px solid var(--border)', flexShrink: 0
              }}
              title={user.name}
              onClick={() => navigate('/admin/perfil')}
            >
              {!user.avatar && user.name.substring(0, 2).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <section className="admin-content">
          {/* ─── BANNER IMPERSONATION ─ */}
          {impersonating && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px',
              background: 'color-mix(in srgb, var(--warning) 12%, var(--bg-card))',
              border: '1px solid var(--warning)', borderRadius: 10, marginBottom: 20,
            }}>
              <Eye size={16} color="var(--warning)" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--warning)' }}>
                  Visualizando como: {user?.name}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>
                  ({user?.role}) — Você está em modo de debug
                </span>
              </div>
              <button
                className="btn btn-outline"
                style={{ borderColor: 'var(--warning)', color: 'var(--warning)', fontSize: 12, padding: '6px 14px', gap: 6 }}
                onClick={stopImpersonation}
              >
                <EyeOff size={13} /> Sair da Visualização
              </button>
            </div>
          )}
          <Outlet />
          {/* Modal Profile Badge */}
          {roleModalOpen && (
            <div className="modal-overlay" onClick={() => setRoleModalOpen(false)}>
              <div className="modal" onClick={e => e.stopPropagation()} style={{ padding: 0, overflow: 'hidden', maxWidth: 400 }}>
                 <div style={{ padding: '24px', background: 'var(--primary-glow)', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                       <div>
                         <p style={{ fontSize: 10, color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Setor de Atuação</p>
                         <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>{user.sector || user.role}</h2>
                       </div>
                       <button className="btn-icon" onClick={() => setRoleModalOpen(false)}><X size={16} /></button>
                    </div>
                 </div>
                 <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Você possui acessos vinculados à sua função. Abaixo estão listadas as suas responsabilidades de sistema com base no seu cargo atual.</p>
                    
                    <div className="card" style={{ padding: 16, background: 'var(--bg-subtle)' }}>
                       {user.sector === 'DIRETORIA' ? (
                          <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>Acesso Global. Gerenciamento financeiro livre, contratos, gestão da equipe e KPIs Masters liberados.</p>
                       ) : user.sector === 'COMERCIAL' ? (
                          <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>Responsável por Captação de Leads, Funil do CRM, WhatsApp (Inbox) e Propostas Comerciais.</p>
                       ) : user.sector === 'CRIATIVO' || user.sector === 'CONTEÚDO' ? (
                          <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>Responsável visual e editorial. Foco em Kanban de Projetos, Upload de Mídia e Hub de Aprovações de Clientes.</p>
                       ) : user.sector === 'TECNOLOGIA' ? (
                          <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>Atuação no Uptime Supporte. Controle de chamados/Tickets técnicos e resolução avançada (API).</p>
                       ) : (
                          <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>Acesso padrão de módulo operacional (Projetos e Feed).</p>
                       )}
                    </div>
                    
                    {user.permissions && user.permissions.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                        {user.permissions.map((p: string) => (
                           <span key={p} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'var(--border)', color: 'var(--text-sec)', fontWeight: 800, textTransform: 'uppercase' }}>{p}</span>
                        ))}
                      </div>
                    )}
                 </div>
              </div>
            </div>
          )}

        </section>
      </main>

    </div>
  );
};

export default AdminLayout;
