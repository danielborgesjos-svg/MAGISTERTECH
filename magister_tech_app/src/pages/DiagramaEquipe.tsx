import { useState, useContext } from 'react';
import { Network, Crown, Briefcase, LayoutGrid, X, FileText, Calendar, DollarSign, User, ShieldCheck } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { AuthContext } from '../contexts/AuthContext';
import type { TeamMember } from '../contexts/DataContext';

export default function DiagramaEquipe() {
  const { team } = useData();
  const { user } = useContext(AuthContext);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [masterView, setMasterView] = useState(false);

  const canEdit = user?.accessLevel === 'ADMIN' || user?.role === 'CEO';

  const cLevel = team.filter(t => t.role === 'CEO' || t.role === 'ADMIN' || t.sector === 'Diretoria');
  const middleManagement = team.filter(t => t.role === 'MANAGER' || t.sector === 'Comercial' || t.sector === 'RH');
  const operational = team.filter(t => !cLevel.includes(t) && !middleManagement.includes(t));

  const sectors = [...new Set(operational.map(t => t.sector))].filter(Boolean);

  return (
    <div className="animate-in" style={{ paddingBottom: 40, maxWidth: masterView ? '100%' : 1200, margin: '0 auto', transition: 'max-width 0.3s' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Network /> Organograma Master da Empresa
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Mapeamento hierárquico dinâmico gerado a partir do quadro de funcionários</p>
        </div>
        {canEdit && (
          <div style={{ display: 'flex', gap: 12 }}>
             <button 
                className={`btn ${masterView ? 'btn-primary' : 'btn-outline'}`} 
                onClick={() => setMasterView(!masterView)}
                style={{ gap: 8 }}
             >
                <ShieldCheck size={16} /> {masterView ? 'Visão Compacta' : 'Visão Master (Full)'}
             </button>
             <button className="btn btn-primary" onClick={() => alert('Apenas Admin Master pode alterar conexões manuais')}>
                Editar Fluxo
             </button>
          </div>
        )}
      </div>

      <div className="card" style={{ minHeight: 600, padding: 40, position: 'relative', overflowX: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* Nível 1: C-Level / Diretoria */}
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', position: 'relative', zIndex: 10 }}>
          {cLevel.map(user => (
            <div key={user.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
               <div 
                  onClick={() => setSelectedMember(user)}
                  style={{ padding: '16px 24px', background: 'var(--danger-glow)', border: '2px solid var(--danger)', borderRadius: 16, textAlign: 'center', minWidth: 220, boxShadow: 'var(--shadow-md)', cursor: 'pointer', transition: 'var(--transition)' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <Crown size={20} color="var(--danger)" style={{ marginBottom: 8 }}/>
                  <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: 1 }}>{user.role} · {user.sector}</p>
                  <p style={{ fontSize: 16, fontWeight: 900, color: '#fff', margin: '4px 0' }}>{user.name}</p>
               </div>
            </div>
          ))}
        </div>

        {/* Linha Conectora Nível 1 pro Nível 2 */}
        {middleManagement.length > 0 && (
          <div style={{ width: 2, height: 40, background: 'var(--border)' }} />
        )}

        {/* Nível 2: Middle Management (Sócios, Gestão) */}
        {middleManagement.length > 0 && (
          <div style={{ display: 'flex', gap: 40, justifyContent: 'center', position: 'relative' }}>
             <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 200px)', height: 2, background: 'var(--border)' }} />
            
             {middleManagement.map(user => (
               <div key={user.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 2, height: 20, background: 'var(--border)' }} />
                  <div 
                     onClick={() => setSelectedMember(user)}
                     style={{ padding: '12px 20px', background: 'var(--primary-glow)', border: '2px solid var(--primary)', borderRadius: 12, textAlign: 'center', minWidth: 180, zIndex: 10, cursor: 'pointer', transition: 'var(--transition)' }}
                     onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                     onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                   >
                     <Briefcase size={16} color="var(--primary)" style={{ marginBottom: 6 }}/>
                     <p style={{ fontSize: 10, fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }}>{user.role} · {user.sector}</p>
                     <p style={{ fontSize: 14, fontWeight: 900, color: '#fff', margin: '4px 0' }}>{user.name}</p>
                  </div>
                  {/* Conector para Operacional, se houver o mesmo setor */}
                  <div style={{ width: 2, height: 20, background: 'var(--border)' }} />
               </div>
             ))}
          </div>
        )}

        {/* Linha Conectora Central se Nível 2 não existir */}
        {middleManagement.length === 0 && operational.length > 0 && (
          <div style={{ width: 2, height: 40, background: 'var(--border)' }} />
        )}

        {/* Nível 3: Operacional Agrupado por Setor */}
        <div style={{ display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap', position: 'relative', marginTop: middleManagement.length > 0 ? -20 : 0 }}>
             {/* Linha base para Operacional caso venha do topo (simplificado) */}
             {middleManagement.length === 0 && operational.length > 0 && (
                <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '80%', height: 2, background: 'var(--border)' }} />
             )}

             {sectors.map(sector => {
               const sectorTeam = operational.filter(t => t.sector === sector);
               return (
                 <div key={sector} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--bg-subtle)', padding: 16, borderRadius: 16, border: '1px solid var(--border)' }}>
                    <h4 style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-sec)', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 1 }}><LayoutGrid size={12} style={{display:'inline'}}/> SETOR: {sector}</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {sectorTeam.map(user => (
                         <div 
                             key={user.id} 
                             onClick={() => setSelectedMember(user)}
                             style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: 'var(--bg-card)', borderRadius: 8, boxShadow: 'var(--shadow-sm)', cursor: 'pointer', transition: 'var(--transition)', border: '1px solid transparent' }}
                             onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                             onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.transform = 'translateX(0)'; }}
                          >
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: user.profileColor || 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 800 }}>
                               {user.initials}
                            </div>
                            <div>
                               <p style={{ fontSize: 13, fontWeight: 800, margin: 0 }}>{user.name}</p>
                               <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{user.role}</span>
                            </div>
                         </div>
                      ))}
                    </div>
                 </div>
               )
             })}
        </div>


      </div>

      {/* MODAL GESTÃO HR / CONTRATO */}
      {selectedMember && (
        <div className="modal-overlay" onClick={() => { setSelectedMember(null); }}>
<div className="modal animate-scale-in" style={{ maxWidth: 500, padding: 0, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '24px 32px', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: selectedMember.profileColor || 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, fontWeight: 800 }}>
                    {selectedMember.initials}
                  </div>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>{selectedMember.name}</h2>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{selectedMember.role} · {selectedMember.sector}</p>
                  </div>
               </div>
               <button className="btn-icon" onClick={() => { setSelectedMember(null); }}><X size={18} /></button>
            </div>

            <div style={{ padding: 32 }}>
               <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  
                  {/* Info Section */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                     <div className="card" style={{ padding: 16, background: 'var(--bg-subtle)' }}>
                        <p style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}><FileText size={10}/> Tipo de Contrato</p>
                        <p style={{ fontSize: 14, fontWeight: 800 }}>PJ / Assessor</p>
                     </div>
                     <div className="card" style={{ padding: 16, background: 'var(--bg-subtle)' }}>
                        <p style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={10}/> Admissão</p>
                        <p style={{ fontSize: 14, fontWeight: 800 }}>{selectedMember.joinedAt || '01/01/2026'}</p>
                     </div>
                  </div>

                  {/* Financial Section (HR Only) */}
                  <div className="card" style={{ padding: 24, border: '1px dashed var(--primary)', background: 'var(--primary-glow)' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h4 style={{ fontSize: 13, fontWeight: 900, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                           <DollarSign size={14} /> Dados Financeiros HR
                        </h4>
                        <span className="badge badge-success">ATIVO</span>
                     </div>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                           <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 4 }}>Custo Mensal (Fixo)</p>
                           <p style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>R$ 4.500,00</p>
                        </div>
                        <button className="btn btn-primary btn-sm" style={{ padding: '8px 16px' }}>Ver Holerite</button>
                     </div>
                  </div>

                  {/* Contact Methods */}
                  <div style={{ display: 'flex', gap: 12 }}>
                     <button className="btn btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                        <User size={14} /> Perfil Completo
                     </button>
                     <button className="btn btn-ghost" style={{ flex: 1, color: 'var(--danger)' }}>Encerrar Contrato</button>
                  </div>

               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
