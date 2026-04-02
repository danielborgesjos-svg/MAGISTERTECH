import { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

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

// Demo user para modo offline
const DEMO_USER: User = {
  id: 'demo-1',
  name: 'Daniel Borges',
  email: 'admin@magistertech.com.br',
  role: 'CEO',
  avatar: null,
  accessLevel: 'ADMIN',
  permissions: ['dashboard', 'crm', 'pipeline', 'contratos', 'projetos', 'financeiro', 'agenda', 'conteudo', 'equipe', 'chat', 'config']
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('magister_token');
      const savedUser = localStorage.getItem('magister_user');

      if (!token || !savedUser) {
        setLoading(false);
        return;
      }

      try {
        const parsedUser = JSON.parse(savedUser);
        
        // Verifica se o usuário ainda existe na base mstr_team
        const teamRaw = localStorage.getItem('mstr_team');
        if (teamRaw) {
          const team = JSON.parse(teamRaw);
          const stillExists = team.find((m: any) => m.email === parsedUser.email);
          if (stillExists) {
            setUser({ 
              ...parsedUser, role: stillExists.role, name: stillExists.name,
              accessLevel: stillExists.accessLevel || 'VIEWER',
              permissions: stillExists.permissions || [] 
            }); 
          } else {
            logout(); // Se foi deletado da equipe, cai o login
          }
        } else {
           setUser(parsedUser);
        }
      } catch {
        setUser(DEMO_USER);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('magister_token', token);
    localStorage.setItem('magister_user', JSON.stringify(userData));
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
