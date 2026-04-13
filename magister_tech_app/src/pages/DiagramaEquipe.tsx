import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import {
  Crown, Briefcase, Code2, PenTool, Megaphone,
  X, Mail, ChevronRight,
  ShieldCheck, Zap, Users, Target, Network
} from 'lucide-react';

/* ─── Estrutura fixa do organograma ────────────────────────────────────── */
interface OrgMember {
  id: string;
  name: string;
  role: string;
  sector: string;
  level: 'ceo' | 'gestao' | 'operacional';
  color: string;
  glow: string;
  border: string;
  icon: React.ElementType;
  initials: string;
  email: string;
  description: string;
  contracts?: string[];
  responsibilities: string[];
}

/* ─── MemberCard ────────────────────────────────────────────────────────── */
function MemberCard({ member, onClick, size = 'md' }: {
  member: OrgMember;
  onClick: () => void;
  size?: 'lg' | 'md' | 'sm';
}) {
  const [hover, setHover] = useState(false);
  const Icon = member.icon;

  if (size === 'lg') {
    return (
      <div
        onClick={onClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          cursor: 'pointer', textAlign: 'center',
          background: hover ? member.glow : 'var(--bg-card)',
          border: `2px solid ${hover ? member.color : member.border}`,
          borderRadius: 20, padding: '28px 36px',
          minWidth: 240, transition: 'all 0.25s',
          boxShadow: hover ? `0 16px 48px ${member.glow}, var(--shadow)` : 'var(--shadow-sm)',
          transform: hover ? 'translateY(-6px)' : 'none',
          position: 'relative', overflow: 'hidden',
        }}
      >
        {/* Glow blob */}
        <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: member.glow, filter: 'blur(30px)', pointerEvents: 'none' }} />
        
        {/* Avatar */}
        <div style={{
          width: 72, height: 72, borderRadius: 20, margin: '0 auto 16px',
          background: `linear-gradient(135deg, ${member.color}, ${member.color}bb)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 8px 24px ${member.glow}`,
          fontSize: 24, fontWeight: 900, color: '#fff',
          position: 'relative',
        }}>
          {member.initials}
          <div style={{
            position: 'absolute', bottom: -4, right: -4,
            width: 22, height: 22, borderRadius: 6,
            background: member.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid var(--bg-card)',
          }}>
            <Icon size={11} color="#fff" />
          </div>
        </div>

        <p style={{ fontSize: 11, fontWeight: 800, color: member.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
          {member.sector}
        </p>
        <p style={{ fontSize: 17, fontWeight: 900, color: 'var(--text-main)', margin: '0 0 4px', lineHeight: 1.2 }}>
          {member.name}
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
          {member.role}
        </p>

        {member.contracts && (
          <div style={{ marginTop: 12, display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
            {member.contracts.map(c => (
              <span key={c} style={{
                fontSize: 10, fontWeight: 800, color: member.color,
                background: member.glow, border: `1px solid ${member.border}`,
                padding: '2px 8px', borderRadius: 6,
              }}>{c}</span>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (size === 'md') {
    return (
      <div
        onClick={onClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          cursor: 'pointer',
          background: hover ? member.glow : 'var(--bg-card)',
          border: `1.5px solid ${hover ? member.color : 'var(--border)'}`,
          borderRadius: 16, padding: '20px 24px', textAlign: 'center',
          minWidth: 190, transition: 'all 0.22s',
          boxShadow: hover ? `0 12px 36px ${member.glow}` : 'var(--shadow-sm)',
          transform: hover ? 'translateY(-4px)' : 'none',
        }}
      >
        <div style={{
          width: 56, height: 56, borderRadius: 16, margin: '0 auto 12px',
          background: `linear-gradient(135deg, ${member.color}, ${member.color}aa)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, fontWeight: 900, color: '#fff',
          boxShadow: `0 6px 18px ${member.glow}`,
        }}>{member.initials}</div>
        <p style={{ fontSize: 10, fontWeight: 800, color: member.color, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{member.sector}</p>
        <p style={{ fontSize: 14, fontWeight: 900, color: 'var(--text-main)', margin: '0 0 2px' }}>{member.name}</p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{member.role}</p>
      </div>
    );
  }

  // sm
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px',
        background: hover ? member.glow : 'var(--bg-card)',
        border: `1.5px solid ${hover ? member.color : 'var(--border)'}`,
        borderRadius: 12, transition: 'all 0.2s',
        transform: hover ? 'translateX(4px)' : 'none',
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
        background: `linear-gradient(135deg, ${member.color}, ${member.color}aa)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 900, color: '#fff',
      }}>{member.initials}</div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>{member.name}</p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, margin: 0 }}>{member.role}</p>
      </div>
      <Icon size={14} color={member.color} />
    </div>
  );
}

/* ─── Connector ─────────────────────────────────────────────────────────── */
function VLine({ color = 'var(--border)', height = 40 }: { color?: string; height?: number }) {
  return <div style={{ width: 2, height, background: color, margin: '0 auto', borderRadius: 2 }} />;
}
function HLineGroup({ count, color = 'var(--border)' }: { count: number; color?: string }) {
  if (count <= 1) return null;
  return (
    <div style={{ position: 'relative', height: 2, width: '80%', margin: '0 auto', background: color, borderRadius: 2 }} />
  );
}

/* ─── Detail Modal ──────────────────────────────────────────────────────── */
function MemberModal({ member, onClose }: { member: OrgMember; onClose: () => void }) {
  const Icon = member.icon;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ padding: 0, overflow: 'hidden', maxWidth: 580 }}>
        {/* Header premium */}
        <div style={{
          padding: '28px 32px',
          background: `linear-gradient(135deg, ${member.glow}, var(--bg-subtle))`,
          borderBottom: `1px solid ${member.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 18,
              background: `linear-gradient(135deg, ${member.color}, ${member.color}bb)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 900, color: '#fff',
              boxShadow: `0 8px 24px ${member.glow}`,
              position: 'relative', flexShrink: 0,
            }}>
              {member.initials}
              <div style={{
                position: 'absolute', bottom: -5, right: -5,
                width: 24, height: 24, borderRadius: 7,
                background: member.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid var(--bg-card)',
              }}>
                <Icon size={12} color="#fff" />
              </div>
            </div>
            <div>
              <p style={{ fontSize: 10, fontWeight: 800, color: member.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                {member.sector}
              </p>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-main)', margin: '0 0 4px', lineHeight: 1.1 }}>
                {member.name}
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, margin: 0 }}>
                {member.role}
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Descrição */}
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, borderLeft: `3px solid ${member.color}`, paddingLeft: 14, margin: 0 }}>
            {member.description}
          </p>

          {/* Contatos */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Mail size={14} color={member.color} />
              <div>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 2px' }}>Email</p>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>{member.email}</p>
              </div>
            </div>
            <div className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Briefcase size={14} color={member.color} />
              <div>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 2px' }}>Setor</p>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>{member.sector}</p>
              </div>
            </div>
          </div>

          {/* Contratos */}
          {member.contracts && member.contracts.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 12, background: member.glow, border: `1px solid ${member.border}` }}>
              <ShieldCheck size={16} color={member.color} />
              <div>
                <p style={{ fontSize: 10, fontWeight: 800, color: member.color, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>
                  Contratos sob responsabilidade
                </p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {member.contracts.map(c => (
                    <span key={c} style={{ fontSize: 12, fontWeight: 800, color: member.color, background: 'var(--bg-card)', padding: '2px 10px', borderRadius: 6, border: `1px solid ${member.border}` }}>{c}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Responsabilidades */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
              Responsabilidades
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {member.responsibilities.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <ChevronRight size={14} color={member.color} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 13, color: 'var(--text-main)', lineHeight: 1.5 }}>{r}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────────── */
export default function DiagramaEquipe() {
  const { team, projects } = useData();
  const [selected, setSelected] = useState<OrgMember | null>(null);

  const getTeamIcon = (sector: string) => {
    switch ((sector || '').toLowerCase().trim()) {
      case 'diretoria': return Crown;
      case 'comercial': return Target;
      case 'criativo': return PenTool;
      case 'tecnologia': return Code2;
      case 'conteúdo': return Megaphone;
      default: return Users;
    }
  };

  const dynamicOrg: OrgMember[] = team.map(t => {
     const hue = (t.initials.charCodeAt(0) * 37 + (t.initials[1]?.charCodeAt(0) || 20) * 360) % 360;
     const color = t.profileColor || `hsl(${hue}, 60%, 45%)`;
     
     const prefs = (t as any).preferences || {};
     const linkedProjectIds = prefs.linkedProjects || [];
     const linkedNames = linkedProjectIds.map((id: string) => projects.find(p => p.id === id)?.name).filter(Boolean);

     return {
       id: t.id,
       name: t.name,
       role: t.role,
       sector: t.sector,
       level: (t.role || '').toUpperCase().includes('CEO') ? 'ceo' : (t.role || '').toUpperCase().includes('GESTOR') ? 'gestao' : 'operacional',
       color: color,
       glow: `${color}20`,
       border: `${color}40`,
       icon: getTeamIcon(t.sector),
       initials: t.initials,
       email: t.email,
       description: t.bio || 'Sem descrição cadastrada.',
       contracts: linkedNames.length > 0 ? linkedNames : undefined,
       responsibilities: []
     };
  });

  const ceo      = dynamicOrg.filter(m => m.level === 'ceo');
  const gestao   = dynamicOrg.filter(m => m.level === 'gestao');
  const operacional = dynamicOrg.filter(m => m.level === 'operacional');

  // Agrupar operacional por setor
  const sectors = [...new Set(operacional.map(m => m.sector))];
  const sectorGroups = sectors.map(s => ({
    sector: s,
    members: operacional.filter(m => m.sector === s),
  }));

  return (
    <div className="animate-in" style={{ paddingBottom: 60 }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'var(--primary-glow)', border: '1px solid var(--border-strong)', borderRadius: 100, fontSize: 11, fontWeight: 700, color: 'var(--primary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          <Network size={12} /> Estrutura Organizacional
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-main)', margin: 0 }}>
              Organograma Magister Tech
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 6, margin: '6px 0 0' }}>
              Hierarquia, responsabilidades e fluxo de gestão da agência
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'var(--success-glow)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10 }}>
            <Users size={14} color="var(--success)" />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--success)' }}>{dynamicOrg.length} colaboradores</span>
          </div>
        </div>
      </div>

      {/* ── Organograma Visual ── */}
      <div className="card" style={{ padding: '48px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', overflowX: 'auto', minHeight: 600 }}>

        {/* NÍVEL 1 — CEO */}
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center' }}>
          {ceo.map(m => (
            <MemberCard key={m.id} member={m} size="lg" onClick={() => setSelected(m)} />
          ))}
        </div>

        {/* Conector CEO → Gestão */}
        <VLine color="var(--border-strong)" height={40} />

        {/* NÍVEL 2 — Gestão */}
        <div style={{ display: 'flex', gap: 28, justifyContent: 'center' }}>
          {gestao.map(m => (
            <MemberCard key={m.id} member={m} size="md" onClick={() => setSelected(m)} />
          ))}
        </div>

        {/* Conector Gestão → Operacional */}
        <VLine color="var(--border-strong)" height={40} />
        <HLineGroup count={sectorGroups.length} color="var(--border-strong)" />

        {/* NÍVEL 3 — Operacional por Setor */}
        <div style={{ display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap', marginTop: 2, width: '100%' }}>
          {sectorGroups.map(({ sector, members }) => {
            const sectorColor = members[0]?.color || 'var(--primary)';
            const sectorGlow  = members[0]?.glow  || 'var(--primary-glow)';
            return (
              <div key={sector} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <VLine color={sectorColor} height={30} />

                {/* Setor header */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '5px 14px',
                  background: sectorGlow, border: `1px solid ${members[0]?.border || 'var(--border)'}`,
                  borderRadius: 8, marginBottom: 12,
                  fontSize: 10, fontWeight: 800, color: sectorColor, textTransform: 'uppercase', letterSpacing: '0.07em',
                }}>
                  <Zap size={10} /> {sector}
                </div>

                {/* Members */}
                <div style={{
                  background: 'var(--bg-subtle)', border: '1px solid var(--border)',
                  borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 230,
                }}>
                  {members.map(m => (
                    <MemberCard key={m.id} member={m} size="sm" onClick={() => setSelected(m)} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Legenda / Cards resumo ── */}
      <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {ORG.map(m => {
          const Icon = m.icon;
          return (
            <div
              key={m.id}
              className="card"
              onClick={() => setSelected(m)}
              style={{ cursor: 'pointer', padding: '18px 20px', borderLeft: `3px solid ${m.color}`, transition: 'var(--transition)' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: `linear-gradient(135deg, ${m.color}, ${m.color}aa)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 900, color: '#fff',
                  boxShadow: `0 4px 14px ${m.glow}`,
                }}>{m.initials}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>{m.name}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, margin: '2px 0 0' }}>{m.role}</p>
                </div>
                <Icon size={16} color={m.color} />
              </div>

              <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {m.responsibilities.slice(0, 2).map((r, i) => (
                  <span key={i} style={{ fontSize: 10, background: 'var(--bg-subtle)', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 8px', fontWeight: 600 }}>
                    {r}
                  </span>
                ))}
                {m.responsibilities.length > 2 && (
                  <span style={{ fontSize: 10, color: m.color, fontWeight: 700 }}>+{m.responsibilities.length - 2} mais</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Modal ── */}
      {selected && <MemberModal member={selected} onClose={() => setSelected(null)} />}

      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}
