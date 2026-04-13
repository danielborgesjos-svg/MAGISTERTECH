import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export const usePermission = () => {
  const { user } = useContext(AuthContext);

  // Normaliza o role para uppercase para compatibilidade bidirecional (backend vs demo)
  const role = (user?.role || 'colaborador').toUpperCase();
  const sector = (user?.sector || '').toUpperCase();

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

    // Fallback: lógica baseada em cargos (Role) e Setores (Sector)
    switch (module) {
      case 'dashboard':
      case 'kanban':
      case 'agenda':
      case 'feed':
      case 'chat':
        return true; // Todos acessam módulos gerais básicos

      case 'pipeline':
      case 'crm':
        return ['COMERCIAL', 'GESTOR_PROJETOS', 'GESTOR'].includes(role) || ['COMERCIAL', 'DIRETORIA'].includes(sector);

      case 'contratos':
        return ['FINANCEIRO', 'COMERCIAL', 'GESTOR'].includes(role) || ['DIRETORIA', 'FINANCEIRO', 'COMERCIAL'].includes(sector);

      case 'projetos':
      case 'conteudo':
        return ['DESIGNER', 'PROJETO', 'SOCIAL_MEDIA', 'GESTOR_PROJETOS', 'GESTOR'].includes(role) || ['CRIATIVO', 'CONTEÚDO', 'PRODUÇÃO', 'DIRETORIA'].includes(sector);

      case 'financeiro':
      case 'kpis':
        return ['FINANCEIRO', 'GESTOR'].includes(role) || ['DIRETORIA', 'FINANCEIRO'].includes(sector);

      case 'view-as':
        return false; // ADMIN/CEO já passaram pelo if acima — colaboradores nunca acessam

      case 'equipe':
        return ['GESTOR_PROJETOS', 'GESTOR'].includes(role) || ['DIRETORIA', 'RH'].includes(sector);

      // Kanban interno por cliente — apenas equipe interna (não CLIENTE)
      case 'kanban-cliente':
        return isInternalTeam();

      // Hub 360 do cliente
      case 'cliente-hub':
        return isInternalTeam();

      default:
        return false;
    }
  };

  const canViewSensitiveData = (): boolean => {
    if (['ADMIN', 'CEO', 'FINANCEIRO', 'GESTOR'].includes(role) || (user?.permissions?.includes('financeiro') ?? false)) return true;
    if (['DIRETORIA', 'FINANCEIRO'].includes(sector)) return true;
    return false;
  };

  // Verifica se o usuário é da equipe interna (não é CLIENTE)
  const isInternalTeam = (): boolean => {
    return !['CLIENTE'].includes(role);
  };

  return { canViewModule, canViewSensitiveData, isInternalTeam, role, sector };
};
