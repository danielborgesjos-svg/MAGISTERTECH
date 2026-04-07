import { useContext, useState } from 'react';
import { Outlet, NavLink, Navigate, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, KanbanSquare, Users, FileText,
  LogOut, Terminal, Calendar, PenTool,
  Briefcase, Landmark, Moon, Sun, Target, UserCircle,
  Bell, Search, ChevronRight, Settings, X, Rss, Activity, Wifi, MessageCircle, Network, Fingerprint
} from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import { usePermission } from '../hooks/usePermission';
import { useData } from '../contexts/DataContext';

const AdminLayout = () => {
  const { user, loading, logout } = useContext(AuthContext);
  const { canViewModule } = usePermission();
  const { alerts, feed } = useData();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('mstr_dark') === '1');
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

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
    const next = !darkMode;
    setDarkMode(next);
    document.body.classList.toggle('dark-mode', next);
    localStorage.setItem('mstr_dark', next ? '1' : '0');
  };

  if (darkMode && !document.body.classList.contains('dark-mode')) {
    document.body.classList.add('dark-mode');
  }

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
        { to: '/admin/hub-clientes', icon: Activity, label: 'Hub de Clientes', module: 'cliente-hub' },
        { to: '/admin/team/diagrama', icon: Network, label: 'Diagrama de Resp.', module: 'projetos' },
      ]
    },
    {
      label: 'Administrativo',
      items: [
        { to: '/admin/financeiro', icon: Landmark, label: 'Financeiro', module: 'financeiro' },
        { to: '/admin/equipe', icon: UserCircle, label: 'Equipe / RH', module: 'equipe' },
        { to: '/admin/conectividade', icon: Wifi, label: 'WhatsApp', module: 'dashboard' },
        { to: '/admin/audit', icon: Fingerprint, label: 'Logs Master', module: 'dashboard' },
      ]
    },
  ];

  return (
    <div className={`admin-layout ${darkMode ? 'dark-mode' : ''}`}>
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
          <div className="user-card-sidebar">
            <div className="avatar avatar-sm" style={{ background: 'var(--primary)' }}>
              {user.name.substring(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name.split(' ')[0]}</div>
              <div style={{ fontSize: 10, color: 'var(--sidebar-text)', textTransform: 'capitalize' }}>{user.role}</div>
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
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button onClick={() => { logout(); navigate('/login'); }} className="nav-item" style={{ justifyContent: 'center', padding: '10px', color: 'var(--danger)' }}>
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <>
              <button onClick={toggleTheme} className="nav-item">
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                {darkMode ? 'Modo Claro' : 'Modo Escuro'}
              </button>
              <button onClick={() => navigate('/admin/config')} className="nav-item">
                <Settings size={18} /> Configurações
              </button>
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

            {/* User avatar → go to config */}
            <div className="avatar avatar-sm" style={{ background: 'var(--primary)', cursor: 'pointer' }}
              title={user.name} onClick={() => navigate('/admin/config')}>
              {user.name.substring(0, 2).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <section className="admin-content">
          <Outlet />
        </section>
      </main>

    </div>
  );
};

export default AdminLayout;
