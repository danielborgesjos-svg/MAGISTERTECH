import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export const usePermission = () => {
  const { user } = useContext(AuthContext);

  // Normaliza o role para uppercase para compatibilidade bidirecional (backend vs demo)
  const role = (user?.role || 'colaborador').toUpperCase();

  const canViewModule = (module: string): boolean => {
    // Admin e CEO veem tudo
    if (['ADMIN', 'CEO'].includes(role)) return true;

    switch (module) {
      case 'dashboard':
        return true; // todos veem o cockpit

      case 'kanban':
        return true; // todos veem o kanban

      case 'agenda':
        return true; // todos veem a agenda

      case 'pipeline':
        return ['CTO', 'COMERCIAL', 'GESTOR_PROJETOS', 'FINANCEIRO'].includes(role);

      case 'crm':
        return ['CTO', 'COMERCIAL', 'GESTOR_PROJETOS', 'FINANCEIRO'].includes(role);

      case 'contratos':
        return ['CTO', 'COMERCIAL', 'FINANCEIRO'].includes(role);

      case 'projetos':
        return ['CTO', 'GESTOR_PROJETOS', 'COMERCIAL', 'DESIGNER', 'COLABORADOR'].includes(role);

      case 'conteudo':
        return ['CTO', 'DESIGNER', 'SOCIAL_MEDIA', 'GESTOR_PROJETOS', 'COMERCIAL'].includes(role);

      case 'financeiro':
        return ['CTO', 'FINANCEIRO', 'COMERCIAL'].includes(role);

      case 'equipe':
        return ['CTO', 'GESTOR_PROJETOS', 'FINANCEIRO'].includes(role);

      case 'configuracoes':
        return false; // somente ADMIN via panel direto

      default:
        return false;
    }
  };

  return { canViewModule, role };
};
