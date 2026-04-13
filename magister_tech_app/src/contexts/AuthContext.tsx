import { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { apiFetch, apiLogout } from '../lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  coverUrl?: string | null;
  bio?: string | null;
  phone?: string | null;
  sector?: string | null;
  preferences: string | null;
  accessLevel?: 'VIEWER' | 'EDITOR' | 'ADMIN';
  permissions?: string[];
}

interface AuthContextType {
  user: User | null;
  realUser: User | null;
  impersonating: boolean;
  loading: boolean;
  theme: 'dark' | 'light';
  login: (userData: User) => void;
  logout: () => Promise<void>;
  updatePreferences: (prefs: any) => Promise<void>;
  updateProfile: (data: Partial<User>) => void;
  startImpersonation: (target: User) => void;
  stopImpersonation: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null, realUser: null, impersonating: false, loading: true, theme: 'dark',
  login: () => {},
  logout: async () => {},
  updatePreferences: async () => {},
  updateProfile: () => {},
  startImpersonation: () => {},
  stopImpersonation: () => {},
});

const ALL_PERMISSIONS = [
  'dashboard', 'kanban', 'crm', 'pipeline', 'contratos',
  'projetos', 'financeiro', 'kpis', 'agenda', 'conteudo', 'equipe',
  'chat', 'config', 'feed', 'cliente-hub', 'kanban-cliente',
];

function getPermissionsForRole(role: string): string[] {
  const r = role.toUpperCase();
  if (['ADMIN', 'CEO'].includes(r)) return ALL_PERMISSIONS;
  if (r === 'CLIENTE') return ['dashboard'];
  if (r === 'GESTOR') return ['dashboard', 'kanban', 'crm', 'pipeline', 'contratos', 'projetos', 'financeiro', 'equipe', 'agenda', 'conteudo', 'feed', 'cliente-hub', 'kanban-cliente'];
  if (r === 'FINANCEIRO') return ['dashboard', 'financeiro', 'kpis', 'contratos', 'kanban', 'agenda', 'feed'];
  if (r === 'COMERCIAL') return ['dashboard', 'crm', 'pipeline', 'contratos', 'kanban', 'agenda', 'feed'];
  if (r === 'GESTOR_PROJETOS') return ['dashboard', 'kanban', 'projetos', 'conteudo', 'equipe', 'agenda', 'feed', 'cliente-hub', 'kanban-cliente'];
  if (['DESIGNER', 'SOCIAL_MEDIA', 'PROJETO'].includes(r)) return ['dashboard', 'kanban', 'projetos', 'conteudo', 'agenda', 'feed', 'kanban-cliente'];
  return ['dashboard', 'kanban', 'agenda', 'feed'];
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [realUser, setRealUser] = useState<User | null>(null);
  const [impersonatedUser, setImpersonatedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const user = impersonatedUser ?? realUser;
  const impersonating = impersonatedUser !== null;

  const applyTheme = (prefsStr?: string | null) => {
    try {
      const prefs = prefsStr ? JSON.parse(prefsStr) : {};
      const newTheme = prefs.theme === 'light' ? 'light' : 'dark';
      setTheme(newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
      if (newTheme === 'dark') {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
    } catch {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.classList.add('dark-mode');
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const data = await apiFetch<any>('/api/auth/me');
        setRealUser({
          ...data,
          accessLevel: ['ADMIN', 'CEO'].includes(data.role) ? 'ADMIN' : 'EDITOR',
          permissions: ALL_PERMISSIONS,
        });
        applyTheme(data.preferences);
      } catch {
        setRealUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = (userData: User) => {
    setRealUser({
      ...userData,
      accessLevel: ['ADMIN', 'CEO'].includes(userData.role) ? 'ADMIN' : 'EDITOR',
      permissions: ALL_PERMISSIONS,
    });
    applyTheme(userData.preferences);
  };

  const logout = async () => {
    setImpersonatedUser(null);
    localStorage.removeItem('magister_impersonate_id');
    await apiLogout();
    setRealUser(null);
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.classList.add('dark-mode');
    setTheme('dark');
    window.location.href = '/login';
  };

  const updatePreferences = async (prefs: any) => {
    try {
      const data = await apiFetch<any>('/api/users/preferences', {
        method: 'PUT',
        body: JSON.stringify({ preferences: prefs }),
      });
      if (data.ok) {
        setRealUser(prev => prev ? { ...prev, preferences: data.preferences } : null);
        applyTheme(data.preferences);
      }
    } catch (err) {
      console.error('Erro ao salvar preferências:', err);
    }
  };

  const updateProfile = (data: Partial<User>) => {
    setRealUser(prev => prev ? { ...prev, ...data } : null);
  };

  const startImpersonation = (target: User) => {
    setImpersonatedUser({
      ...target,
      permissions: getPermissionsForRole(target.role),
    });
    localStorage.setItem('magister_impersonate_id', target.id);
  };

  const stopImpersonation = () => {
    setImpersonatedUser(null);
    localStorage.removeItem('magister_impersonate_id');
  };

  return (
    <AuthContext.Provider value={{
      user, realUser, impersonating, loading, theme,
      login, logout, updatePreferences, updateProfile,
      startImpersonation, stopImpersonation,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
