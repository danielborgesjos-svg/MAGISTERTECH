
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  ClipboardList, 
  FileText, 
  LogOut,
  Stethoscope
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Calendar, label: 'Agenda', path: '/agenda' },
    { icon: Users, label: 'Pacientes', path: '/pacientes' },
    { icon: ClipboardList, label: 'Prontuários', path: '/prontuarios' },
    { icon: FileText, label: 'Prescrições', path: '/prescricoes' },
  ];

  return (
    <aside className="w-64 h-screen sidebar-glass fixed left-0 top-0 text-white flex flex-col">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-mint-200 rounded-xl flex items-center justify-center">
          <Stethoscope className="text-dark-900" size={24} />
        </div>
        <span className="text-xl font-bold text-white tracking-tight">Holozonic</span>
      </div>

      <nav className="flex-1 px-4 mt-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive 
                  ? 'bg-mint-200 text-dark-900 font-bold shadow-lg shadow-mint-200/20' 
                  : 'hover:bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5">
        <button className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-red-400 transition-colors">
          <LogOut size={20} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
