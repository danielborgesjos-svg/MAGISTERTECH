import { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  accessLevel?: 'VIEWER' | 'EDITOR' | 'ADMIN';
  permissions?: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null, loading: true, login: () => {}, logout: () => {}
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('magister_token');

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Valida o token com o servidor
        const { data } = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const ALL_PERMISSIONS = [
          'dashboard', 'kanban', 'crm', 'pipeline', 'contratos',
          'projetos', 'financeiro', 'agenda', 'conteudo', 'equipe',
          'chat', 'config', 'feed', 'cliente-hub', 'kanban-cliente',
        ];

        setUser({
          ...data,
          accessLevel: ['ADMIN', 'CEO'].includes(data.role) ? 'ADMIN' : 'EDITOR',
          permissions: ALL_PERMISSIONS,
        });
      } catch {
        // Token inválido ou expirado — força logout limpo
        localStorage.removeItem('magister_token');
        localStorage.removeItem('magister_user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('magister_token', token);
    // NÃO salva dados do usuário em localStorage. Eles vêm do servidor a cada boot.
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('magister_token');
    localStorage.removeItem('magister_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
