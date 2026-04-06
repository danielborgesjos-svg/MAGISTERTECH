import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export const usePermission = () => {
  const { user } = useContext(AuthContext);

  // Normaliza o role para uppercase para compatibilidade bidirecional (backend vs demo)
  const role = (user?.role || 'colaborador').toUpperCase();

  const canViewModule = (module: string): boolean => {
    // Admin e CEO veem tudo
    if (['ADMIN', 'CEO'].includes(role)) return true;

    // CLIENTE só acessa módulos explícitos para clientes
    if (role === 'CLIENTE') {
      return ['dashboard'].includes(module);
    }

    // Se o usuário tem uma lista explícita de permissões, usamos ela
    if (user?.permissions && user.permissions.length > 0) {
      return user.permissions.includes(module);
    }

    // Fallback: lógica baseada em cargos (Role-based)
    switch (module) {
      case 'dashboard':
      case 'kanban':
      case 'agenda':
      case 'feed':
      case 'chat':
        return true;

      case 'pipeline':
      case 'crm':
        return ['COMERCIAL', 'GESTOR_PROJETOS', 'GESTOR'].includes(role);

      case 'contratos':
        return ['FINANCEIRO', 'COMERCIAL', 'GESTOR'].includes(role);

      case 'projetos':
      case 'conteudo':
        return ['DESIGNER', 'PROJETO', 'SOCIAL_MEDIA', 'GESTOR_PROJETOS', 'GESTOR'].includes(role);

      case 'financeiro':
        return ['FINANCEIRO', 'GESTOR'].includes(role);

      case 'equipe':
        return ['GESTOR_PROJETOS', 'GESTOR'].includes(role);

      // Kanban interno por cliente — apenas equipe interna (não CLIENTE)
      case 'kanban-cliente':
        return ['GESTOR', 'GESTOR_PROJETOS', 'DESIGNER', 'PROJETO', 'SOCIAL_MEDIA', 'COMERCIAL', 'FINANCEIRO', 'COLABORADOR'].includes(role);

      // Hub 360 do cliente
      case 'cliente-hub':
        return ['GESTOR', 'GESTOR_PROJETOS', 'COMERCIAL', 'FINANCEIRO', 'COLABORADOR'].includes(role);

      default:
        return false;
    }
  };

  const canViewSensitiveData = (): boolean => {
    return ['ADMIN', 'CEO', 'FINANCEIRO', 'GESTOR'].includes(role) || (user?.permissions?.includes('financeiro') ?? false);
  };

  // Verifica se o usuário é da equipe interna (não é CLIENTE)
  const isInternalTeam = (): boolean => {
    return !['CLIENTE'].includes(role);
  };

  return { canViewModule, canViewSensitiveData, isInternalTeam, role };
};
