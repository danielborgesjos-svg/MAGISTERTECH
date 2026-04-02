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
import Feed from './pages/Feed';
import Configuracoes from './pages/Configuracoes';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />

            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="kanban" element={<Kanban />} />
              <Route path="crm" element={<Clientes />} />
              <Route path="contratos" element={<Contratos />} />
              <Route path="pipeline" element={<Pipeline />} />
              <Route path="projetos" element={<Projetos />} />
              <Route path="agenda" element={<Agenda />} />
              <Route path="conteudo" element={<Conteudo />} />
              <Route path="financeiro" element={<Financeiro />} />
              <Route path="equipe" element={<Equipe />} />
              <Route path="feed" element={<Feed />} />
              <Route path="config" element={<Configuracoes />} />
            </Route>
          </Routes>
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
