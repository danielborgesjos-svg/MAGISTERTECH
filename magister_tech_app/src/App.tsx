import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/Dashboard';
import Kanban from './pages/Kanban';
import Clientes from './pages/Clientes';
import Contratos from './pages/Contratos';
import Pipeline from './pages/Pipeline';
import Projetos from './pages/Projetos';
import Financeiro from './pages/Financeiro';
import Agenda from './pages/Agenda';
import Conteudo from './pages/Conteudo';
import Equipe from './pages/Equipe';
import DiagramaEquipe from './pages/DiagramaEquipe';
import AuditLog from './pages/AuditLog';
import Feed from './pages/Feed';
import Configuracoes from './pages/Configuracoes';
import ClienteHub from './pages/ClienteHub';
import KanbanCliente from './pages/KanbanCliente';
import ClientesAPI from './pages/ClientesAPI';
import Inbox from './pages/Inbox';

import { AuthContext } from './contexts/AuthContext';
import { useContext } from 'react';
import { usePermission } from './hooks/usePermission';
import Conectividade from './pages/Conectividade';
import PortalSuporte from './pages/PortalSuporte';
import Tickets from './pages/Tickets';
import MeusTickets from './pages/MeusTickets';

function ProtectedRoute({ children, module }: { children: React.ReactNode, module: string }) {
  const { canViewModule } = usePermission();
  const { loading } = useContext(AuthContext);

  if (loading) return null;

  if (!canViewModule(module)) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/suporte" element={<PortalSuporte />} />
            <Route path="/suporte/acompanhar" element={<MeusTickets />} />

            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="kanban" element={<ProtectedRoute module="kanban"><Kanban /></ProtectedRoute>} />
              <Route path="crm" element={<ProtectedRoute module="crm"><Clientes /></ProtectedRoute>} />
              <Route path="inbox" element={<ProtectedRoute module="crm"><Inbox /></ProtectedRoute>} />
              <Route path="contratos" element={<ProtectedRoute module="contratos"><Contratos /></ProtectedRoute>} />
              <Route path="pipeline" element={<ProtectedRoute module="pipeline"><Pipeline /></ProtectedRoute>} />
              <Route path="projetos" element={<ProtectedRoute module="projetos"><Projetos /></ProtectedRoute>} />
              <Route path="agenda" element={<ProtectedRoute module="agenda"><Agenda /></ProtectedRoute>} />
              <Route path="conteudo" element={<ProtectedRoute module="conteudo"><Conteudo /></ProtectedRoute>} />
              <Route path="financeiro" element={<ProtectedRoute module="financeiro"><Financeiro /></ProtectedRoute>} />
              <Route path="equipe" element={<ProtectedRoute module="equipe"><Equipe /></ProtectedRoute>} />
              <Route path="team/diagrama" element={<ProtectedRoute module="projetos"><DiagramaEquipe /></ProtectedRoute>} />
              <Route path="audit" element={<ProtectedRoute module="dashboard"><AuditLog /></ProtectedRoute>} />
              <Route path="feed" element={<ProtectedRoute module="feed"><Feed /></ProtectedRoute>} />
              <Route path="tickets" element={<ProtectedRoute module="crm"><Tickets /></ProtectedRoute>} />
              <Route path="config" element={<Configuracoes />} />
              <Route path="conectividade" element={<ProtectedRoute module="dashboard"><Conectividade /></ProtectedRoute>} />

              {/* ─── FASE 1: Hub de Clientes (backend) ─── */}
              <Route
                path="hub-clientes"
                element={
                  <ProtectedRoute module="cliente-hub">
                    <ClientesAPI />
                  </ProtectedRoute>
                }
              />

              {/* ─── FASE 1: Hub 360 e Kanban interno por cliente ─── */}
              <Route
                path="clientes/:clienteId/hub"
                element={
                  <ProtectedRoute module="cliente-hub">
                    <ClienteHub />
                  </ProtectedRoute>
                }
              />
              <Route
                path="clientes/:clienteId/kanban"
                element={
                  <ProtectedRoute module="kanban-cliente">
                    <KanbanCliente />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Routes>
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}


export default App;
