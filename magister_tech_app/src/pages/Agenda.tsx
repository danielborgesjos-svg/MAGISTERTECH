import { useState, useMemo } from 'react';
import { Plus, X, Trash2, ChevronLeft, ChevronRight, Activity, MapPin, Link as LinkIcon, Calendar, Clock, Users, Video, Map, Bell } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import type { CalendarEvent } from '../contexts/DataContext';

const EVENT_CONFIG: Record<string, { color: string; bg: string; icon: any }> = {
  'reunião': { color: 'var(--primary)', bg: 'var(--primary-glow)', icon: Video },
  'reuniao': { color: 'var(--primary)', bg: 'var(--primary-glow)', icon: Video },
  'tarefa': { color: 'var(--warning)', bg: 'var(--warning-glow)', icon: Activity },
  'entrega': { color: 'var(--danger)', bg: 'var(--danger-glow)', icon: Calendar },
  'conteúdo': { color: 'var(--purple)', bg: 'var(--purple-glow)', icon: MapPin },
  'conteudo': { color: 'var(--purple)', bg: 'var(--purple-glow)', icon: MapPin },
  'financeiro': { color: 'var(--success)', bg: 'var(--success-glow)', icon: LinkIcon },
  'interno': { color: 'var(--primary)', bg: 'var(--primary-glow)', icon: Users },
};

const EVENT_COLORS: Record<string, string> = Object.entries(EVENT_CONFIG).reduce((acc, [k, v]) => ({ ...acc, [k]: v.color }), {});

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function Agenda() {
  const { events, clients, projects, addEvent, deleteEvent } = useData();
  const [view, setView] = useState<'dia' | 'semana' | 'mes'>('mes');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '', date: new Date().toISOString().split('T')[0], time: '09:00',
    type: 'reunião' as CalendarEvent['type'], location: '', clientId: '', projectId: ''
  });

  const handleAdd = () => {
    if (!form.title || !form.date) return;
    addEvent({
      title: form.title, date: form.date, time: form.time,
      type: form.type, location: form.location,
      clientId: form.clientId || undefined, projectId: form.projectId || undefined,
      color: EVENT_COLORS[form.type] || 'var(--primary)'
    });
    setForm({ title: '', date: new Date().toISOString().split('T')[0], time: '09:00', type: 'reunião', location: '', clientId: '', projectId: '' });
    setShowForm(false);
  };

  // Calendar helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calDays: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const today = new Date().toISOString().split('T')[0];

  const getEventsByDate = (dateStr: string) => events.filter(e => e.date === dateStr);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const selectedEvents = getEventsByDate(selectedDay).sort((a, b) => a.time.localeCompare(b.time));

  // Week view helper
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });
  const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8h to 20h

  const getClient = (id?: string) => clients.find(c => c.id === id);
  const getProject = (id?: string) => projects.find(p => p.id === id);

  return (
    <div className="animate-in" style={{ paddingBottom: 40 }}>
      {/* ─── HEADER COCKPIT ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 100, fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Activity size={12} color="var(--primary)" /> Calendário · Agenda & Compromissos
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-main)', margin: 0, lineHeight: 1.1 }}>Agenda Corporativa</h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8 }}>Compromissos, reuniões, entregas e eventos da equipe.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="tab-list">
            {(['dia', 'semana', 'mes'] as const).map(v => (
              <button key={v} className={`tab-btn ${view === v ? 'active' : ''}`} onClick={() => setView(v)} style={{ textTransform: 'capitalize' }}>{v === 'mes' ? 'Mês' : v.charAt(0).toUpperCase() + v.slice(1)}</button>
            ))}
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Marcar Evento</button>
        </div>
      </div>

      {/* ─── KPI STRIP ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 28 }}>
        {Object.entries(EVENT_CONFIG).map(([type, cfg]) => {
          if (['reuniao', 'conteudo', 'interno'].includes(type) && type !== 'reuniao' && type !== 'conteudo') return null;
          const variants = type === 'reuniao' ? ['reunião', 'reuniao', 'interno'] : ['conteúdo', 'conteudo'];
          const counts = events.filter(e => variants.includes(e.type.toLowerCase()));
          const upcoming = counts.filter(e => e.date >= today).length;
          
          return (
            <div key={type} className="card" style={{ padding: '20px', borderTop: `3px solid ${cfg.color}`, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -10, right: -10, width: 60, height: 60, background: `${cfg.color}15`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <cfg.icon size={24} color={cfg.color} style={{ opacity: 0.3 }} />
              </div>
              <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 8 }}>{type}</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-main)' }}>{counts.length}</span>
                {upcoming > 0 && <span style={{ fontSize: 11, color: cfg.color, fontWeight: 700 }}>+{upcoming} prox</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── MÊS VIEW ────────────────────────────────────────── */}
      {view === 'mes' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
          {/* Calendar Grid */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>{MONTHS[month]} {year}</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-icon btn-sm" onClick={prevMonth}><ChevronLeft size={15} /></button>
                <button className="btn btn-ghost btn-sm" onClick={() => setCurrentDate(new Date())}>Hoje</button>
                <button className="btn-icon btn-sm" onClick={nextMonth}><ChevronRight size={15} /></button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
              {WEEKDAYS.map(d => (
                <div key={d} style={{ textAlign: 'center', padding: '12px', fontSize: 10, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', background: 'var(--bg-card)' }}>{d}</div>
              ))}
              {calDays.map((day, i) => {
                if (!day) return <div key={`empty-${i}`} style={{ minHeight: 100, background: 'var(--bg-subtle)', opacity: 0.3 }} />;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayEvents = getEventsByDate(dateStr);
                const isToday = dateStr === today;
                const isSelected = dateStr === selectedDay;
                
                return (
                  <div key={day} onClick={() => setSelectedDay(dateStr)} style={{
                    minHeight: 100, padding: '10px', cursor: 'pointer',
                    background: isSelected ? 'var(--bg-card)' : isToday ? 'var(--warning-glow)' : 'var(--bg-card)',
                    position: 'relative', transition: 'all 0.2s ease',
                    border: isSelected ? '2px inset var(--primary)' : 'none'
                  }} onMouseEnter={e => {
                    if (!isSelected && !isToday) { e.currentTarget.style.background = 'var(--bg-subtle)'; }
                  }} onMouseLeave={e => {
                    if (!isSelected && !isToday) { e.currentTarget.style.background = 'var(--bg-card)'; }
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 900, marginBottom: 8,
                      background: isToday ? 'var(--warning)' : isSelected ? 'var(--primary)' : 'transparent',
                      color: isToday || isSelected ? 'white' : 'var(--text-main)',
                      boxShadow: isToday ? '0 4px 12px var(--warning-glow)' : isSelected ? '0 4px 12px var(--primary-glow)' : 'none'
                    }}>{day}</div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {dayEvents.slice(0, 3).map(ev => {
                        const cfg = EVENT_CONFIG[ev.type.toLowerCase()] || EVENT_CONFIG['reuniao'];
                        return (
                          <div key={ev.id} style={{
                            fontSize: 9, fontWeight: 800, padding: '3px 6px', borderRadius: 4,
                            background: `${cfg.color}15`, color: cfg.color, borderLeft: `2px solid ${cfg.color}`,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                          }}>{ev.time} {ev.title}</div>
                        );
                      })}
                      {dayEvents.length > 3 && (
                        <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 800, paddingLeft: 6 }}>
                          + {dayEvents.length - 3} mais
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Day Detail Panel */}
          <div className="card" style={{ height: 'fit-content', position: 'sticky', top: 80, padding: 0, overflow: 'hidden', border: '1px solid var(--border-strong)', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ padding: '24px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', backgroundGradient: 'linear-gradient(to bottom right, var(--bg-subtle), var(--bg-card))' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.1em', marginBottom: 4 }}>Destaques do Dia</p>
                  <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                    {new Date(selectedDay + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                  </h3>
                </div>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                    <Bell size={18} color="var(--text-muted)" />
                </div>
              </div>
              <button className="btn btn-primary w-full" style={{ padding: '12px', fontSize: 13, fontWeight: 700, borderRadius: 12 }} onClick={() => { setForm(p => ({ ...p, date: selectedDay })); setShowForm(true); }}>
                <Plus size={16} /> Novo Compromisso
              </button>
            </div>
            
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16, maxHeight: 'calc(100vh - 400px)', overflowY: 'auto' }}>
              {selectedEvents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', opacity: 0.5 }}>
                     <Calendar size={28} color="var(--text-muted)" />
                  </div>
                  <p style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 700 }}>Dia livre de reuniões</p>
                </div>
              ) : (
                selectedEvents.map(ev => {
                  const client = getClient(ev.clientId);
                  const project = getProject(ev.projectId);
                  const cfg = EVENT_CONFIG[ev.type.toLowerCase()] || EVENT_CONFIG['reuniao'];
                  
                  return (
                    <div key={ev.id} className="event-card-premium" style={{ 
                      padding: '16px', borderRadius: 16, background: 'var(--bg-card)', border: '1px solid var(--border)',
                      position: 'relative', transition: 'all 0.3s ease', cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                    }}>
                      <div style={{ display: 'flex', gap: 14 }}>
                        <div style={{ 
                          width: 44, height: 44, borderRadius: 12, background: cfg.bg, 
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
                        }}>
                           <cfg.icon size={20} color={cfg.color} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                            <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.title}</h4>
                            <button onClick={(e) => { e.stopPropagation(); deleteEvent(ev.id); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', opacity: 0.5 }}><Trash2 size={13} /></button>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                             <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: cfg.color }}>
                               <Clock size={12} /> {ev.time}
                             </div>
                             {ev.location && (
                               <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                                 <MapPin size={11} /> 
                                 <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 100 }}>{ev.location}</span>
                               </div>
                             )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
                             {client && (
                               <div title={client.company} style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--bg-subtle)', border: '1px solid var(--border)', fontSize: 9, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                 {client.company.substring(0, 1)}
                               </div>
                             )}
                             {project && (
                               <div title={project.name} style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-sec)', background: 'var(--bg-subtle)', padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border)' }}>
                                 {project.name}
                               </div>
                             )}
                             {!client && !project && <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>Compromisso Interno</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── SEMANA VIEW ──────────────────────────────────────── */}
      {view === 'semana' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Semana de {weekDays[0].toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-icon btn-sm" onClick={() => setCurrentDate(new Date(currentDate.getTime() - 7 * 86400000))}><ChevronLeft size={15} /></button>
              <button className="btn-icon btn-sm" onClick={() => setCurrentDate(new Date(currentDate.getTime() + 7 * 86400000))}><ChevronRight size={15} /></button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(7, 1fr)', gap: 1, background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ background: 'var(--bg-subtle)' }} />
            {weekDays.map(d => {
              const ds = d.toISOString().split('T')[0];
              const isToday = ds === today;
              return (
                <div key={ds} style={{ textAlign: 'center', padding: '16px 8px', background: isToday ? 'var(--warning-glow)' : 'var(--bg-card)', borderBottom: '2px solid var(--border)' }}>
                  <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 900, textTransform: 'uppercase', marginBottom: 8 }}>{WEEKDAYS[d.getDay()]}</p>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, margin: '0 auto',
                    background: isToday ? 'var(--warning)' : 'var(--bg-subtle)',
                    color: isToday ? 'white' : 'var(--text-main)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 900, border: '1px solid var(--border)'
                  }}>{d.getDate()}</div>
                </div>
              );
            })}
            {hours.map(hour => (
              <React.Fragment key={hour}>
                <div style={{ padding: '20px 12px', fontSize: 11, color: 'var(--text-muted)', fontWeight: 800, textAlign: 'right', background: 'var(--bg-subtle)', borderTop: '1px solid var(--border)' }}>{hour}:00</div>
                {weekDays.map(d => {
                  const ds = d.toISOString().split('T')[0];
                  const hourEvents = events.filter(e => e.date === ds && parseInt(e.time.split(':')[0]) === hour);
                  return (
                    <div key={`${ds}-${hour}`} style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)', borderLeft: '1px solid var(--border)', minHeight: 60, padding: 6, position: 'relative' }}>
                      {hourEvents.map(ev => {
                        const cfg = EVENT_CONFIG[ev.type.toLowerCase()] || EVENT_CONFIG['reuniao'];
                        return (
                          <div key={ev.id} style={{
                            fontSize: 10, padding: '6px 10px', borderRadius: 8, fontWeight: 800,
                            background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30`,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: 4
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                               <cfg.icon size={10} />
                               <span>{ev.time}</span>
                            </div>
                            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.title}</div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* ─── DIA VIEW ─────────────────────────────────────────── */}
      {view === 'dia' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 24, alignItems: 'start' }}>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '24px 32px', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                 <div style={{ width: 50, height: 50, borderRadius: 14, background: 'var(--primary)', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px var(--primary-glow)' }}>
                    <span style={{ fontSize: 18, fontWeight: 900, lineHeight: 1 }}>{currentDate.getDate()}</span>
                    <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase' }}>{WEEKDAYS[currentDate.getDay()]}</span>
                 </div>
                 <div>
                    <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>{MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Carga horária detalhada</p>
                 </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-icon" onClick={() => setCurrentDate(new Date(currentDate.getTime() - 86400000))}><ChevronLeft size={18} /></button>
                <button className="btn btn-ghost" onClick={() => setCurrentDate(new Date())} style={{ fontWeight: 800 }}>Hoje</button>
                <button className="btn-icon" onClick={() => setCurrentDate(new Date(currentDate.getTime() + 86400000))}><ChevronRight size={18} /></button>
              </div>
            </div>
            
            <div style={{ padding: '0 32px 32px' }}>
              {hours.map(hour => {
                const ds = currentDate.toISOString().split('T')[0];
                const hourEvents = events.filter(e => e.date === ds && parseInt(e.time.split(':')[0]) === hour);
                return (
                  <div key={hour} style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 24, borderTop: '1px solid var(--border)', minHeight: 80, position: 'relative' }}>
                    <div style={{ padding: '20px 0', fontSize: 13, fontWeight: 800, color: 'var(--text-muted)', textAlign: 'right' }}>{hour}:00</div>
                    <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {hourEvents.map(ev => {
                        const cfg = EVENT_CONFIG[ev.type.toLowerCase()] || EVENT_CONFIG['reuniao'];
                        return (
                          <div key={ev.id} className="glass-card" style={{ 
                            display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderRadius: 16,
                            background: `linear-gradient(135deg, ${cfg.bg}, transparent)`, border: `1px solid ${cfg.color}15`,
                            boxShadow: `0 4px 15px ${cfg.color}05`, position: 'relative'
                          }}>
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--bg-card)', border: `1px solid ${cfg.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                               <cfg.icon size={18} color={cfg.color} />
                            </div>
                            <div style={{ flex: 1 }}>
                               <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                                  <span style={{ fontSize: 11, fontWeight: 900, color: cfg.color, textTransform: 'uppercase' }}>{ev.time}</span>
                                  <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-main)' }}>{ev.title}</span>
                               </div>
                               {ev.location && <p style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12}/> {ev.location}</p>}
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                               <button onClick={() => deleteEvent(ev.id)} className="btn-icon btn-sm" style={{ color: 'var(--danger)', background: 'transparent' }}><Trash2 size={14} /></button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lateral Info */}
          <div style={{ position: 'sticky', top: 80, display: 'flex', flexDirection: 'column', gap: 20 }}>
             <div className="card" style={{ background: 'var(--primary-glow)', border: '1px solid var(--primary-border)' }}>
                <Activity size={24} color="var(--primary)" style={{ marginBottom: 16 }} />
                <h4 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-main)', marginBottom: 8 }}>Performance do Dia</h4>
                <p style={{ fontSize: 13, color: 'var(--text-sec)', lineHeight: 1.5 }}>
                   Você tem <strong>{events.filter(e => e.date === currentDate.toISOString().split('T')[0]).length} compromissos</strong> agendados para este período.
                </p>
             </div>
             <div className="card">
                <h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                   <Clock size={16} color="var(--warning)" /> Lembretes Rápidos
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                   <div style={{ padding: 12, borderRadius: 10, background: 'var(--bg-subtle)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-sec)' }}>
                      Preparar deck para reunião com cliente.
                   </div>
                   <div style={{ padding: 12, borderRadius: 10, background: 'var(--bg-subtle)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-sec)' }}>
                      Enviar ata de reunião.
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* ─── ADD EVENT MODAL PREMIUM ─────────────────────────────────── */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" style={{ maxWidth: 640, padding: 0 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ padding: '24px 32px', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={24} color="var(--primary)"/>
                </div>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>Marcar Compromisso</h2>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Registre reunião, entrega ou evento na linha do tempo.</p>
                </div>
              </div>
              <button className="btn-icon" style={{ background: 'var(--bg-card)' }} onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ padding: 32 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label className="form-label" style={{ fontWeight: 800, fontSize: 13, marginBottom: 8 }}>Título do Compromisso Corporativo *</label>
                  <div style={{ position: 'relative' }}>
                    <input className="input" style={{ fontSize: 16, fontWeight: 800, height: 48, paddingLeft: 44, background: 'var(--bg-subtle)' }} placeholder="Ex: Reunião Kickoff — Cliente Magister" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
                    <Activity size={18} color="var(--primary)" style={{ position: 'absolute', left: 16, top: 15 }} />
                  </div>
                </div>

                <div style={{ gridColumn: '1/-1', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                  <div className="card" style={{ padding: 12, background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                    <label className="form-label" style={{ fontSize: 11, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={12}/> Data</label>
                    <input className="input" type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} style={{ border: 'none', background: 'transparent', padding: 0, fontWeight: 700 }} />
                  </div>
                  <div className="card" style={{ padding: 12, background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                    <label className="form-label" style={{ fontSize: 11, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={12}/> Horário</label>
                    <input className="input" type="time" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} style={{ border: 'none', background: 'transparent', padding: 0, fontWeight: 700 }} />
                  </div>
                   <div className="card" style={{ padding: 12, background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                    <label className="form-label" style={{ fontSize: 11, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><Users size={12}/> Tipo</label>
                    <select className="input" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as CalendarEvent['type'] }))} style={{ border: 'none', background: 'transparent', padding: 0, fontWeight: 700, textTransform: 'capitalize' }}>
                      {Object.keys(EVENT_CONFIG).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ gridColumn: '1/-1' }}>
                  <label className="form-label" style={{ fontWeight: 800, fontSize: 13, marginBottom: 8 }}><MapPin size={13} style={{ display: 'inline', marginBottom: -2 }}/> Local / Plataforma Digital</label>
                  <input className="input" style={{ background: 'var(--bg-subtle)' }} placeholder="Ex: Google Meet, Zoom, Sala de Reunião N1..." value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
                </div>

                <div>
                   <label className="form-label" style={{ fontWeight: 800, fontSize: 13, marginBottom: 8 }}><LinkIcon size={13} style={{ display: 'inline', marginBottom: -2 }}/> Vincular Cliente</label>
                   <select className="input" style={{ background: 'var(--bg-subtle)' }} value={form.clientId} onChange={e => setForm(p => ({ ...p, clientId: e.target.value }))}>
                     <option value="">Nenhum cliente</option>
                     {clients.map(c => <option key={c.id} value={c.id}>{c.company}</option>)}
                   </select>
                </div>
                <div>
                   <label className="form-label" style={{ fontWeight: 800, fontSize: 13, marginBottom: 8 }}><LinkIcon size={13} style={{ display: 'inline', marginBottom: -2 }}/> Vincular Projeto</label>
                   <select className="input" style={{ background: 'var(--bg-subtle)' }} value={form.projectId} onChange={e => setForm(p => ({ ...p, projectId: e.target.value }))}>
                     <option value="">Nenhum projeto</option>
                     {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                   </select>
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ padding: '24px 32px', background: 'var(--bg-card)', borderTop: '1px solid var(--border)' }}>
               <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Descartar</button>
               <button className="btn btn-primary" onClick={handleAdd} disabled={!form.title || !form.date} style={{ padding: '12px 32px', borderRadius: 12, fontWeight: 900 }}>
                  Agendar Evento Corporativo
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
