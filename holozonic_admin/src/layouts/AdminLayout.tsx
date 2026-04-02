import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Bell, Search, User } from 'lucide-react';

const AdminLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8">
        <header className="flex items-center justify-between mb-8 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-dark-900 tracking-tight">
              Olá, Dr. Hamilton
            </h1>
            <p className="text-slate-500 text-sm font-medium">Bem-vindo ao seu centro de comando clínico.</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar pacientes..." 
                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-mint-200 focus:border-mint-200 transition-all w-64"
              />
            </div>
            
            <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="text-right">
                <p className="text-sm font-bold text-dark-900">Dr. Hamilton Souza</p>
                <p className="text-xs font-medium text-mint-300">ADMIN</p>
              </div>
              <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center overflow-hidden border border-slate-300">
                <User size={24} className="text-slate-400" />
              </div>
            </div>
          </div>
        </header>

        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Outlet />
        </section>
      </main>
    </div>
  );
};

export default AdminLayout;
