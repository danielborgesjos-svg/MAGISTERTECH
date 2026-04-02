import { useEffect, useState } from 'react';
import { 
  Users, 
  Calendar, 
  Activity, 
  Clock, 
  ArrowUpRight, 
  Video,
  MapPin,
  FileText
} from 'lucide-react';

const Dashboard = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    try {
      const resp = await fetch('http://localhost:3333/api/appointments');
      const data = await resp.json();
      if (resp.ok) {
        setAppointments(data);
      } else {
        console.error('Failed to fetch:', data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const generateMeet = async (id: string) => {
    try {
      const resp = await fetch(`http://localhost:3333/api/appointments/${id}/meet`, {
        method: 'POST'
      });
      if(resp.ok) {
        alert("Link gerado e salvo");
        fetchAppointments();
      } else {
        alert('Erro ao gerar');
      }
    } catch (e) {
      console.error(e);
      alert('Network error');
    }
  };

  const stats = [
    { label: 'Pacientes Ativos', value: '128', icon: Users, change: '+12%', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Consultas Hoje', value: appointments.length.toString(), icon: Calendar, change: 'Atualizado', color: 'text-mint-300', bg: 'bg-mint-50' },
    { label: 'Novas Triagens', value: appointments.filter(a => a.anamnesisId).length.toString(), icon: Activity, change: 'IA', color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Aguardando Inêz', value: appointments.filter(a => a.status === 'AWAITING_PAYMENT').length.toString(), icon: Clock, change: 'Agendamentos', color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="card flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                <ArrowUpRight size={14} className="mr-1" />
                {stat.change}
              </span>
            </div>
            <div>
              <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
              <h3 className="text-3xl font-bold text-dark-900 tracking-tight">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Agenda Section */}
        <div className="lg:col-span-8 card !p-0 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-lg font-bold text-dark-900">Agenda e Triagens Recentes</h3>
              <p className="text-sm text-slate-500 font-medium">Você tem {appointments.length} registros no sistema livre.</p>
            </div>
          </div>
          
          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {loading ? <div className="p-6">Carregando...</div> : appointments.map((appt) => (
              <div key={appt.id} className="p-6 hover:bg-slate-50/80 transition-colors group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-center w-20">
                      <p className="text-lg font-extrabold text-dark-900 leading-none">
                        {new Date(appt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                        {new Date(appt.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center overflow-hidden border border-slate-300">
                      <span className="text-slate-500 font-bold">{appt.patient?.fullName[0] || '?'}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-dark-900 group-hover:text-mint-300 transition-colors">
                        {appt.patient?.fullName || 'Desconhecido'}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium flex items-center gap-2 mt-1">
                         {appt.type === 'TELECONSULTA' ? <Video size={14} className="text-indigo-500" /> : <MapPin size={14} className="text-emerald-500" />}
                         {appt.procedureName}
                      </p>
                      {appt.meetLink && (
                        <p className="text-xs text-indigo-600 mt-1 font-bold">
                          Meet: {appt.meetLink}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                      appt.status === 'SCHEDULED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {appt.status}
                    </span>
                    {appt.type === 'TELECONSULTA' && !appt.meetLink && (
                      <button onClick={() => generateMeet(appt.id)} className="btn-primary py-1.5 px-4 text-xs">
                        Gerar Reunião Meet
                      </button>
                    )}
                  </div>
                </div>

                {/* Display Anamnesis if attached */}
                {appt.anamnesis && (
                  <div className="mt-4 p-4 bg-slate-100 rounded-xl border border-slate-200">
                    <h5 className="font-bold text-sm text-slate-800 mb-2 flex items-center gap-2">
                       <FileText size={16} className="text-mint-300" /> Pré-Anamnese
                    </h5>
                    <pre className="text-xs text-slate-600 font-mono overflow-x-auto">
                      {JSON.stringify(appt.anamnesis.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
            {appointments.length === 0 && !loading && <div className="p-6 text-slate-500">Nenhum registro.</div>}
          </div>
        </div>

        {/* AI & Quick Actions Section */}
        <div className="lg:col-span-4 space-y-6">
          <div className="card bg-dark-900 text-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Activity size={80} strokeWidth={4} />
            </div>
            <h3 className="text-lg font-bold mb-2">Relatório do Dia (IA Cecília)</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-6 italic">
              "Detectei {appointments.filter(a => a.anamnesisId).length} pacientes com formulário de triagem preenchido. Analisei os perfis para a sua agenda."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
