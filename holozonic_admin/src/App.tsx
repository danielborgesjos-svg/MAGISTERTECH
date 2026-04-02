import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import SistemaPage from './pages/SistemaPage';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';

// Placeholder Pages
const PatientsPage = () => <div className="p-10 text-center font-bold">Módulo de Pacientes (Prontuários) - Em Desenvolvimento</div>;
const AgendaPage = () => <div className="p-10 text-center font-bold">Módulo de Agenda - Em Desenvolvimento</div>;
const PrescriptionsPage = () => <div className="p-10 text-center font-bold">Módulo de Prescrições e Receituário - Em Desenvolvimento</div>;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing page — portal de entrada */}
        <Route path="/" element={<LandingPage />} />

        {/* Login */}
        <Route path="/login" element={<Login />} />

        {/* Sistema HTML original embarcado via iframe */}
        <Route path="/sistema" element={<SistemaPage />} />

        {/* Painel Administrativo React */}
        <Route path="/painel" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="pacientes" element={<PatientsPage />} />
          <Route path="agenda" element={<AgendaPage />} />
          <Route path="prontuarios" element={<PatientsPage />} />
          <Route path="prescricoes" element={<PrescriptionsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
