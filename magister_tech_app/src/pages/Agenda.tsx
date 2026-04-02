import { useState } from 'react';
import { Plus, X, Trash2, ChevronLeft, ChevronRight, Activity, MapPin, Link as LinkIcon, Calendar } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import type { CalendarEvent } from '../contexts/DataContext';

const EVENT_COLORS: Record<string, string> = {
  'reunião': 'var(--primary)', 'tarefa': 'var(--warning)',
  'entrega': 'var(--danger)', 'conteúdo': 'var(--purple)', 'financeiro': 'var(--success)'
};

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
        {Object.entries(EVENT_COLORS).map(([type, color]) => {
          const count = events.filter(e => e.type === type).length;
          const upcoming = events.filter(e => e.type === type && e.date >= today).length;
          return (
            <div key={type} className="card" style={{ padding: '20px', borderTop: `3px solid ${color}`, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -30, right: -30, width: 80, height: 80, background: `${color}20`, filter: 'blur(20px)', borderRadius: '50%', pointerEvents: 'none' }} />
              <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-sec)', letterSpacing: '0.05em', marginBottom: 10, position: 'relative', zIndex: 1 }}>{type}</p>
              <p style={{ fontSize: 28, fontWeight: 900, color, letterSpacing: '-0.02em', position: 'relative', zIndex: 1 }}>{count}</p>
              {upcoming > 0 && <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, marginTop: 4 }}>{upcoming} próximos</p>}
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
              {WEEKDAYS.map(d => (
                <div key={d} style={{ textAlign: 'center', padding: '8px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{d}</div>
              ))}
              {calDays.map((day, i) => {
                if (!day) return <div key={`empty-${i}`} style={{ minHeight: 70 }} />;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayEvents = getEventsByDate(dateStr);
                const isToday = dateStr === today;
                const isSelected = dateStr === selectedDay;
                return (
                  <div key={day} onClick={() => setSelectedDay(dateStr)} style={{
                    minHeight: 70, padding: '6px 8px', borderRadius: 8, cursor: 'pointer',
                    background: isSelected ? 'var(--primary-glow)' : isToday ? 'var(--warning-glow)' : 'transparent',
                    border: isSelected ? '2px solid var(--primary)' : isToday ? '2px solid var(--warning)' : '1px solid transparent',
                    transition: 'var(--transition)'
                  }} onMouseEnter={e => {
                    if (!isSelected && !isToday) { (e.currentTarget as HTMLElement).style.background = 'var(--bg-subtle)'; }
                  }} onMouseLeave={e => {
                    if (!isSelected && !isToday) { (e.currentTarget as HTMLElement).style.background = 'transparent'; }
                  }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: isToday || isSelected ? 800 : 500,
                      background: isToday ? 'var(--warning)' : isSelected ? 'var(--primary)' : 'transparent',
                      color: isToday || isSelected ? 'white' : 'var(--text-main)'
                    }}>{day}</div>
                    <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {dayEvents.slice(0, 2).map(ev => (
                        <div key={ev.id} style={{
                          fontSize: 10, fontWeight: 600, padding: '2px 5px', borderRadius: 4,
                          background: `${ev.color}20`, color: ev.color,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                        }}>{ev.title}</div>
                      ))}
                      {dayEvents.length > 2 && <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>+{dayEvents.length - 2}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Day Detail Panel */}
          <div className="card" style={{ height: 'fit-content', position: 'sticky', top: 80, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '20px', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: 4 }}>Agenda do Dia</p>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-main)' }}>
                  {new Date(selectedDay + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}
                </h3>
              </div>
              <button className="btn btn-primary" style={{ padding: '8px 14px', fontSize: 13 }} onClick={() => { setForm(p => ({ ...p, date: selectedDay })); setShowForm(true); }}>
                <Plus size={14} /> Evento
              </button>
            </div>
            <div style={{ padding: '16px' }}>
              {selectedEvents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <Calendar size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 12 }}>Sem compromissos</p>
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(true)}>+ Marcar evento</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {selectedEvents.map(ev => {
                    const client = getClient(ev.clientId);
                    const project = getProject(ev.projectId);
                    return (
                      <div key={ev.id} style={{ padding: '14px 16px', borderRadius: 12, borderLeft: `4px solid ${ev.color}`, background: `${ev.color}08`, border: `1px solid ${ev.color}20`, borderLeftWidth: 4 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-main)' }}>{ev.title}</span>
                          <button onClick={() => deleteEvent(ev.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}><Trash2 size={14} /></button>
                        </div>
                        <div style={{ fontSize: 13, color: ev.color, fontWeight: 800, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Calendar size={14} /> {ev.time}h
                        </div>
                        {ev.location && <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12}/> {ev.location}</p>}
                        {client && <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>🏢 {client.company}</p>}
                        {project && <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>📁 {project.name}</p>}
                        <span className="badge" style={{ background: `${ev.color}15`, color: ev.color, border: `1px solid ${ev.color}30`, fontWeight: 800, marginTop: 8, textTransform: 'uppercase', fontSize: 10 }}>{ev.type}</span>
                      </div>
                    );
                  })}
                </div>
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
          <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', gap: 1 }}>
            <div />
            {weekDays.map(d => {
              const ds = d.toISOString().split('T')[0];
              return (
                <div key={ds} style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{WEEKDAYS[d.getDay()]}</p>
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%', margin: '4px auto',
                    background: ds === today ? 'var(--primary)' : 'transparent',
                    color: ds === today ? 'white' : 'var(--text-main)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: ds === today ? 800 : 500
                  }}>{d.getDate()}</div>
                </div>
              );
            })}
            {hours.map(hour => (
              <>
                <div key={`hour-${hour}`} style={{ padding: '4px 8px', fontSize: 11, color: 'var(--text-muted)', textAlign: 'right', borderTop: '1px solid var(--border)', paddingTop: 8 }}>{hour}:00</div>
                {weekDays.map(d => {
                  const ds = d.toISOString().split('T')[0];
                  const hourEvents = events.filter(e => e.date === ds && parseInt(e.time.split(':')[0]) === hour);
                  return (
                    <div key={`${ds}-${hour}`} style={{ borderTop: '1px solid var(--border)', borderLeft: '1px solid var(--border)', minHeight: 44, padding: 2, position: 'relative' }}>
                      {hourEvents.map(ev => (
                        <div key={ev.id} style={{
                          fontSize: 10, padding: '3px 6px', borderRadius: 4, fontWeight: 600,
                          background: `${ev.color}20`, color: ev.color,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                        }}>{ev.time} {ev.title}</div>
                      ))}
                    </div>
                  );
                })}
              </>
            ))}
          </div>
        </div>
      )}

      {/* ─── DIA VIEW ─────────────────────────────────────────── */}
      {view === 'dia' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>
              {currentDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-icon btn-sm" onClick={() => setCurrentDate(new Date(currentDate.getTime() - 86400000))}><ChevronLeft size={15} /></button>
              <button className="btn btn-ghost btn-sm" onClick={() => setCurrentDate(new Date())}>Hoje</button>
              <button className="btn-icon btn-sm" onClick={() => setCurrentDate(new Date(currentDate.getTime() + 86400000))}><ChevronRight size={15} /></button>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {hours.map(hour => {
              const ds = currentDate.toISOString().split('T')[0];
              const hourEvents = events.filter(e => e.date === ds && parseInt(e.time.split(':')[0]) === hour);
              return (
                <div key={hour} style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: 12, borderTop: '1px solid var(--border)', minHeight: 56, alignItems: 'flex-start', paddingTop: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right' }}>{hour}:00</span>
                  <div style={{ flex: 1, paddingBottom: 6 }}>
                    {hourEvents.map(ev => (
                      <div key={ev.id} style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8,
                        background: `${ev.color}15`, borderLeft: `4px solid ${ev.color}`, marginBottom: 4
                      }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: ev.color }}>{ev.time}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{ev.title}</span>
                        {ev.location && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ev.location}</span>}
                        <span className="badge" style={{ background: `${ev.color}20`, color: ev.color }}>{ev.type}</span>
                        <button onClick={() => deleteEvent(ev.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Trash2 size={13} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label className="form-label" style={{ fontWeight: 800 }}>Título do Compromisso *</label>
                  <input className="input" style={{ fontSize: 16, fontWeight: 700 }} placeholder="Ex: Reunião Kickoff — Cliente Magister" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label"><Calendar size={13} style={{ display: 'inline', marginBottom: -2 }}/> Data *</label>
                  <input className="input" type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Horário (Fuso de Brasília)</label>
                  <input className="input" type="time" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Categoria / Tipo</label>
                  <select className="input" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as CalendarEvent['type'] }))}>
                    {Object.keys(EVENT_COLORS).map(t => <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label"><MapPin size={13} style={{ display: 'inline', marginBottom: -2 }}/> Local / Plataforma</label>
                  <input className="input" placeholder="Ex: Google Meet, Presencial, Zoom..." value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label"><LinkIcon size={13} style={{ display: 'inline', marginBottom: -2 }}/> Vincular Cliente</label>
                  <select className="input" value={form.clientId} onChange={e => setForm(p => ({ ...p, clientId: e.target.value }))}>
                    <option value="">Nenhum cliente</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.company}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label"><LinkIcon size={13} style={{ display: 'inline', marginBottom: -2 }}/> Vincular Projeto</label>
                  <select className="input" value={form.projectId} onChange={e => setForm(p => ({ ...p, projectId: e.target.value }))}>
                    <option value="">Nenhum projeto</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ padding: '24px 32px', background: 'var(--bg-card)', justifyContent: 'flex-end' }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={handleAdd} disabled={!form.title || !form.date} style={{ padding: '10px 24px' }}>
                  <Calendar size={16} /> Confirmar Agendamento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
