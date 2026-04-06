import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, FileText, Briefcase, Receipt, Phone, Mail,
  CheckSquare, PenTool, UserCircle, MessageSquare,
  CheckCircle2, Clock, XCircle, MapPin
} from 'lucide-react';
import { useData } from '../contexts/DataContext';

function fmt(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function fmtDate(dateStr?: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function SectionHeader({ icon, title, count }: { icon: React.ReactNode; title: string; count?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
        {icon}
      </div>
      <h3 style={{ fontSize: 15, fontWeight: 700, flex: 1 }}>{title}</h3>
      {count !== undefined && (
        <span className="badge" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', fontSize: 11, fontWeight: 700 }}>
          {count}
        </span>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p style={{ color: 'var(--text-light)', fontSize: 13, textAlign: 'center', padding: '20px 0', fontStyle: 'italic' }}>
      {message}
    </p>
  );
}

export default function ClienteHub() {
  const { clienteId } = useParams<{ clienteId: string }>();
  const navigate = useNavigate();
  const { clients, contracts, projects, transactions, kanban, content } = useData();

  const cliente = clients.find(c => c.id === clienteId);

  if (!cliente) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 10 }}>Cliente não encontrado</h2>
        <button className="btn btn-secondary" onClick={() => navigate('/admin/crm')}>Voltar ao CRM</button>
      </div>
    );
  }

  // Related data
  const clienteContracts = contracts.filter(c => c.clientId === clienteId);
  const contratoAtivo = clienteContracts.find(c => c.status === 'ativo' || c.status === 'vencendo') || null;
  const clienteProjects = projects.filter(p => p.clientId === clienteId);
  
  // Transactions associated with the active contract
  const faturas = transactions.filter(t => t.type === 'income' && t.category === 'Contrato' && (!t.contractId || t.contractId === contratoAtivo?.id));
  
  // Tasks from kanban associated with the client's projects or named with the client's name (approximate)
  const projIds = clienteProjects.map(p => p.id);
  const tarefas = kanban.flatMap(c => c.tasks).filter(t => t.projectId && projIds.includes(t.projectId));

  // Content related to client
  const conteudos = content.filter(c => c.clientId === clienteId);

  const hue = (cliente.name.charCodeAt(0) * 40) % 360;

  return (
    <div className="animate-in" style={{ paddingBottom: 40, maxWidth: 1100, margin: '0 auto' }}>
      {/* ─── HEADER HUB ──────────────────────────────────────────────────────── */}
      <button 
        className="btn-icon" 
        style={{ marginBottom: 20, display: 'inline-flex', gap: 6, width: 'auto', padding: '0 12px' }}
        onClick={() => navigate('/admin/crm')}
      >
        <ArrowLeft size={16} /> Voltar ao CRM
      </button>

      <div className="card" style={{ padding: '0', overflow: 'hidden', marginBottom: 24, display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 120, background: `linear-gradient(135deg, hsl(${hue}, 60%, 40%) 0%, var(--indigo) 100%)`, position: 'relative' }}>
           <div style={{ position: 'absolute', bottom: -40, left: 32, width: 80, height: 80, borderRadius: '50%', background: `hsl(${hue}, 60%, 50%)`, border: '4px solid var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24, fontWeight: 900, boxShadow: 'var(--shadow-md)' }}>
              {cliente.name.substring(0, 2).toUpperCase()}
           </div>
        </div>
        <div style={{ padding: '48px 32px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 24 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 4 }}>{cliente.company || cliente.name}</h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
               <UserCircle size={14} /> Contato: {cliente.name} · Desde {fmtDate(cliente.createdAt)}
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
               {cliente.whatsapp ? (
                 <a href={`https://wa.me/${cliente.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="badge" style={{ background: 'var(--success-glow)', color: 'var(--success)', border: '1px solid rgba(37,211,102,0.3)' }}><MessageSquare size={12}/> WhatsApp</a>
               ) : cliente.phone ? (
                 <span className="badge" style={{ background: 'var(--bg-subtle)' }}><Phone size={12}/> {cliente.phone}</span>
               ) : null}
               {cliente.email && <span className="badge" style={{ background: 'var(--bg-subtle)' }}><Mail size={12}/> {cliente.email}</span>}
               {cliente.segment && <span className="badge" style={{ background: 'var(--purple-glow)', color: 'var(--purple)' }}><MapPin size={12}/> {cliente.segment}</span>}
            </div>
          </div>
          <div style={{ background: 'var(--bg-subtle)', padding: '16px 24px', borderRadius: 16, border: '1px solid var(--border)', minWidth: 200 }}>
             <p style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>Status do Cliente</p>
             <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                 <div style={{ width: 8, height: 8, borderRadius: '50%', background: cliente.status === 'ativo' ? 'var(--success)' : cliente.status === 'prospect' ? 'var(--warning)' : 'var(--danger)' }} />
                 <span style={{ fontSize: 16, fontWeight: 900, textTransform: 'capitalize' }}>{cliente.status}</span>
             </div>
          </div>
        </div>
      </div>

      {/* ─── GRID DE MÓDULOS ─────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        
        {/* Contrato e Faturamento */}
        <div className="card" style={{ padding: 24 }}>
          <SectionHeader icon={<FileText size={18} />} title="Contrato Vigente" />
          {contratoAtivo ? (
            <div style={{ border: '1px solid var(--primary-glow)', background: 'var(--bg-subtle)', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontWeight: 800 }}>{contratoAtivo.title}</span>
                <span className="badge badge-success">{contratoAtivo.status}</span>
              </div>
              <p style={{ fontSize: 22, fontWeight: 900, color: 'var(--primary)', marginBottom: 12 }}>{fmt(contratoAtivo.value)} <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>/ {contratoAtivo.recurrence || 'mês'}</span></p>
              <div style={{ fontSize: 12, color: 'var(--text-sec)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Início: {fmtDate(contratoAtivo.startDate)}</span>
                {contratoAtivo.endDate && <span>Fim: {fmtDate(contratoAtivo.endDate)}</span>}
              </div>
            </div>
          ) : (
             <EmptyState message="Nenhum contrato ativo." />
          )}

          <div style={{ marginTop: 24 }}>
            <SectionHeader icon={<Receipt size={18} />} title="Status Financeiro" count={faturas.length} />
            {faturas.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {faturas.slice(0, 3).map(f => (
                  <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--bg-subtle)', borderRadius: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                       {f.status === 'pago' ? <CheckCircle2 size={14} color="var(--success)" /> : f.status === 'atrasado' ? <XCircle size={14} color="var(--danger)" /> : <Clock size={14} color="var(--warning)" />}
                       <div>
                         <p style={{ fontSize: 13, fontWeight: 700 }}>{fmt(f.amount)}</p>
                         <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Venc: {fmtDate(f.date)}</p>
                       </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: f.status === 'pago' ? 'var(--success)' : f.status === 'atrasado' ? 'var(--danger)' : 'var(--warning)' }}>{f.status}</span>
                  </div>
                ))}
              </div>
            ) : <EmptyState message="Nenhuma fatura registrada." />}
          </div>
        </div>

        {/* Projetos e Conteúdo */}
        <div className="card" style={{ padding: 24 }}>
          <SectionHeader icon={<Briefcase size={18} />} title="Projetos" count={clienteProjects.length} />
          {clienteProjects.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {clienteProjects.map(p => (
                <div key={p.id} style={{ padding: 14, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontWeight: 800, fontSize: 14 }}>{p.name}</span>
                    <span className="badge" style={{ background: 'var(--bg-card)' }}>{p.status}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 4, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ width: `${p.progress}%`, height: '100%', background: 'var(--primary)', borderRadius: 99 }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 800 }}>{p.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : <EmptyState message="Nenhum projeto associado." />}

          <div style={{ marginTop: 24 }}>
            <SectionHeader icon={<PenTool size={18} />} title="Conteúdos (Social Media)" count={conteudos.length} />
            {conteudos.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {conteudos.slice(0, 4).map(c => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--bg-subtle)', borderRadius: 8 }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.caption}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.platform} · {fmtDate(c.date)}</p>
                    </div>
                    <span className="badge" style={{ fontSize: 10, textTransform: 'uppercase' }}>{c.status}</span>
                  </div>
                ))}
              </div>
            ) : <EmptyState message="Sem cronograma de conteúdo." />}
          </div>
        </div>

        {/* Tarefas Operacionais */}
        <div className="card" style={{ padding: 24 }}>
          <SectionHeader icon={<CheckSquare size={18} />} title="Tarefas e Backlog" count={tarefas.length} />
          {tarefas.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {tarefas.slice(0, 6).map(t => (
                <div key={t.id} style={{ display: 'flex', gap: 10, padding: 12, border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg-subtle)', alignItems: 'center' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.priority === 'urgent' ? 'var(--primary)' : t.priority === 'high' ? 'var(--danger)' : t.priority === 'medium' ? 'var(--warning)' : 'var(--success)', flexShrink: 0 }} />
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <p style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{t.title}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Membro: {t.assignee || 'X'}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <EmptyState message="Nenhuma pendência na produção." />}
        </div>

      </div>
    </div>
  );
}
