import { useState } from 'react';
import { Network, ArrowRight, ShieldCheck, Hexagon, Component, Hash, Eye, MonitorPlay } from 'lucide-react';
import { useData } from '../contexts/DataContext';

export default function DiagramaEquipe() {
  const { team, projects } = useData();
  const [activeProject, setActiveProject] = useState<string | null>(null);

  // Mapear quem está alocado em quais projetos pelas Tasks
  // Mas como não temos relations profundos carregados aqui, fingiremos um organograma vivo
  const activeProj = projects.find(p => p.id === activeProject) || projects[0];

  return (
    <div className="animate-in" style={{ paddingBottom: 40, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Network /> Diagrama de Responsabilidades
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Mapeamento visual de processos, equipe e escopo corporativo</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 320px) 1fr', gap: 24, alignItems: 'flex-start' }}>
        
        {/* Painel Lateral: Seleção de Escopo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Selecionar Escopo</h3>
          <div className="card" style={{ padding: 16 }}>
            {projects.length === 0 ? (
               <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>Nenhum projeto escopado</p>
            ) : (
              projects.map(p => (
                <button 
                  key={p.id}
                  onClick={() => setActiveProject(p.id)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px',
                    width: '100%', background: activeProject === p.id || (!activeProject && projects[0].id === p.id) ? 'var(--primary-glow)' : 'transparent',
                    border: '1px solid', borderColor: activeProject === p.id || (!activeProject && projects[0].id === p.id) ? 'var(--primary)' : 'transparent',
                    borderRadius: 12, color: 'var(--text-main)', textAlign: 'left', cursor: 'pointer', marginBottom: 8, transition: 'all 0.2s'
                  }}
                >
                   <span style={{ fontWeight: 800, fontSize: 13 }}>{p.name}</span>
                   <ArrowRight size={14} color={activeProject === p.id || (!activeProject && projects[0].id === p.id) ? 'var(--primary)' : 'var(--text-muted)'} />
                </button>
              ))
            )}
          </div>
          
          <div className="card" style={{ padding: 16, background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
             <h3 style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-sec)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><ShieldCheck size={14}/> Legenda Hierárquica</h3>
             <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
               <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width:10, height:10, borderRadius:2, background:'var(--danger)'}}/> <strong>Diretoria / C-Level</strong></li>
               <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width:10, height:10, borderRadius:2, background:'var(--primary)'}}/> <strong>Gestor de Conta</strong></li>
               <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width:10, height:10, borderRadius:2, background:'var(--warning)'}}/> <strong>Executores (Design/Tráfego)</strong></li>
             </ul>
          </div>
        </div>

        {/* View do Diagrama */}
        <div className="card" style={{ minHeight: 600, padding: 32, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {!activeProj ? (
             <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Selecione um projeto para ver o organograma.</div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40, borderBottom: '1px solid var(--border)', paddingBottom: 24 }}>
                <div>
                  <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>Escopo: {activeProj.name}</h2>
                  <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 500 }}>
                    {(activeProj as any).resumo || 'Nenhum resumo comercial no momento.'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span className="badge badge-primary"><MonitorPlay size={12}/> {activeProj.type}</span>
                  <span className="badge badge-success"><Eye size={12}/> {activeProj.status}</span>
                </div>
              </div>

              {/* Informações Extraídas do "Briefing Master" (Tabela Project modificada) */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 40 }}>
                <div style={{ flex: 1, padding: 16, background: 'var(--bg-card)', border: '1px dashed var(--border)', borderRadius: 12 }}>
                   <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}><Hexagon size={12} style={{ display:'inline', marginBottom:-2}}/> Core Colors</p>
                   <div style={{ display: 'flex', gap: 6 }}>
                     {((activeProj as any).coreColors || '#1E1E2E,#6366F1').split(',').map((h:string) => (
                       <div key={h} style={{ width: 24, height: 24, borderRadius: '50%', background: h.trim(), border: '2px solid rgba(255,255,255,0.1)' }} title={h.trim()} />
                     ))}
                   </div>
                </div>
                <div style={{ flex: 1, padding: 16, background: 'var(--bg-card)', border: '1px dashed var(--border)', borderRadius: 12 }}>
                   <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}><Hash size={12} style={{ display:'inline', marginBottom:-2}}/> FontFamily</p>
                   <p style={{ fontSize: 14, fontWeight: 800 }}>{(activeProj as any).fontFamily || 'Inter, Sans-serif'}</p>
                </div>
                <div style={{ flex: 2, padding: 16, background: 'var(--bg-card)', border: '1px dashed var(--border)', borderRadius: 12 }}>
                   <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}><Component size={12} style={{ display:'inline', marginBottom:-2}}/> Regras Obrigatórias</p>
                   <p style={{ fontSize: 12, color: 'var(--text-sec)' }}>{(activeProj as any).mandatoryRules || 'Nenhuma regra estrita definida no briefing.'}</p>
                </div>
              </div>

              {/* Árvore de Responsabilidade Simulada */}
              <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: 40 }}>
                 
                 {/* Master Node */}
                 <div style={{ padding: '12px 24px', background: 'var(--danger-glow)', border: '2px solid var(--danger)', borderRadius: 12, textAlign: 'center', zIndex: 2 }}>
                    <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--danger)', textTransform: 'uppercase' }}>Account Manager (Master)</p>
                    <p style={{ fontSize: 15, fontWeight: 900, color: '#fff' }}>Admin Master</p>
                 </div>

                 {/* Linha Central */}
                 <div style={{ width: 2, height: 40, background: 'var(--border)' }} />

                 {/* Gestão Nível 2 */}
                 <div style={{ display: 'flex', gap: 60, position: 'relative' }}>
                    {/* Linha Horizontal distribuidora */}
                    <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 100px)', height: 2, background: 'var(--border)' }} />

                    {/* Node 1 */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                       <div style={{ width: 2, height: 20, background: 'var(--border)' }} />
                       <div style={{ padding: '12px 24px', background: 'var(--primary-glow)', border: '2px solid var(--primary)', borderRadius: 12, textAlign: 'center', zIndex: 2, minWidth: 160 }}>
                          <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }}>Atendimento N1 / Estratégia</p>
                          <p style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>{team.find(t => t.sector === 'Comercial')?.name || 'Designar'}</p>
                       </div>
                    </div>

                    {/* Node 2 */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                       <div style={{ width: 2, height: 20, background: 'var(--border)' }} />
                       <div style={{ padding: '12px 24px', background: 'var(--warning-glow)', border: '2px solid var(--warning)', borderRadius: 12, textAlign: 'center', zIndex: 2, minWidth: 160 }}>
                          <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--warning)', textTransform: 'uppercase' }}>Execução Técnica / Tráfego</p>
                          <p style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>{team.find(t => t.sector === 'Marketing')?.name || 'Equipe Ágil'}</p>
                       </div>
                    </div>
                 </div>

              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
