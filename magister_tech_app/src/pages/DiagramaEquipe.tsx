import { useState, useContext } from 'react';
import { useData } from '../contexts/DataContext';
import { AuthContext } from '../contexts/AuthContext';
import {
  Crown, Briefcase, Code2, PenTool, Megaphone,
  X, Mail, ChevronRight, ChevronDown,
  ShieldCheck, Zap, Users, Target, Network,
  Edit2, FileText, GitBranch,
  LayoutDashboard, Save
} from 'lucide-react';
import { apiFetch } from '../lib/api';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getColor(seed: string) {
  const colors = [
    '#7c3aed','#2563eb','#10b981','#f59e0b','#e11d48',
    '#0891b2','#7c2d12','#4f46e5','#be123c','#065f46',
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function getSectorIcon(sector: string) {
  const s = (sector || '').toLowerCase().trim();
  if (s.includes('diret') || s.includes('ceo')) return Crown;
  if (s.includes('comerc') || s.includes('vend')) return Target;
  if (s.includes('criativ')) return PenTool;
  if (s.includes('tecno') || s.includes('dev')) return Code2;
  if (s.includes('conte') || s.includes('market')) return Megaphone;
  return Briefcase;
}

// ─── Tipos ───────────────────────────────────────────────────────────────────
type ViewMode = 'organograma' | 'fluxograma' | 'lista';

// ─── VLine ───────────────────────────────────────────────────────────────────
function VLine({ color = 'var(--border-strong)', height = 40 }: { color?: string; height?: number }) {
  return <div style={{ width: 2, height, background: color, margin: '0 auto', borderRadius: 1 }} />;
}

// ─── HLineGroup ──────────────────────────────────────────────────────────────
function HLineGroup({ count, color = 'var(--border-strong)' }: { count: number; color?: string }) {
  if (count <= 1) return null;
  return (
    <div style={{ width: '70%', height: 2, background: color, margin: '0 auto', borderRadius: 1 }} />
  );
}

// ─── MemberCard ──────────────────────────────────────────────────────────────
function MemberCard({ member, onClick, size = 'md' }: {
  member: any; onClick: () => void; size?: 'lg' | 'md' | 'sm';
}) {
  const [hover, setHover] = useState(false);
  const Icon = getSectorIcon(member.sector);
  const color = getColor(member.sector || member.id);
  const glow = `${color}20`;

  if (size === 'lg') return (
    <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        cursor: 'pointer', textAlign: 'center', background: hover ? glow : 'var(--bg-card)',
        border: `2px solid ${hover ? color : `${color}40`}`, borderRadius: 20, padding: '28px 36px',
        minWidth: 220, transition: 'all 0.25s', boxShadow: hover ? `0 16px 48px ${glow}` : 'var(--shadow-sm)',
        transform: hover ? 'translateY(-6px)' : 'none', position: 'relative', overflow: 'hidden',
      }}>
      <div style={{ width: 68, height: 68, borderRadius: 18, margin: '0 auto 14px', background: `linear-gradient(135deg, ${color}, ${color}bb)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: '#fff', boxShadow: `0 8px 24px ${glow}`, position: 'relative' }}>
        {(member.name || '?').substring(0, 2).toUpperCase()}
        <div style={{ position: 'absolute', bottom: -4, right: -4, width: 22, height: 22, borderRadius: 6, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg-card)' }}>
          <Icon size={11} color="#fff" />
        </div>
      </div>
      <p style={{ fontSize: 10, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{member.sector}</p>
      <p style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-main)', margin: '0 0 4px' }}>{member.name}</p>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>{member.role}</p>
    </div>
  );

  if (size === 'md') return (
    <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 18px', borderRadius: 14, transition: 'all 0.2s',
        background: hover ? glow : 'var(--bg-card)', border: `1.5px solid ${hover ? color : `${color}40`}`,
        boxShadow: hover ? `0 8px 24px ${glow}` : 'var(--shadow-sm)', minWidth: 200,
      }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg, ${color}, ${color}bb)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
        {(member.name || '?').substring(0, 2).toUpperCase()}
      </div>
      <div>
        <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>{member.name}</p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>{member.role}</p>
      </div>
    </div>
  );

  // sm
  return (
    <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px', borderRadius: 10, transition: 'all 0.2s',
        background: hover ? glow : 'var(--bg-subtle)', border: `1px solid ${hover ? color : 'var(--border)'}`,
      }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
        {(member.name || '?').substring(0, 2).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-main)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.name}</p>
        <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0 }}>{member.role}</p>
      </div>
    </div>
  );
}

// ─── Modal de membro ─────────────────────────────────────────────────────────
function MemberModal({ member, onClose, onEdit, isAdmin }: {
  member: any; onClose: () => void; onEdit: (m: any) => void; isAdmin: boolean;
}) {
  const color = getColor(member.sector || member.id);
  const contracts = member.contracts || [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ padding: 0, maxWidth: 540 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg, ${color}, ${color}bb)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
              {(member.name || '?').substring(0, 2).toUpperCase()}
            </div>
            <div>
              <p style={{ fontSize: 10, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{member.sector}</p>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>{member.name}</h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>{member.role}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {isAdmin && (
              <button className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }} onClick={() => onEdit(member)}>
                <Edit2 size={13} /> Editar
              </button>
            )}
            <button className="btn-icon" onClick={onClose}><X size={16} /></button>
          </div>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Mail size={14} color={color} />
              <div>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 2px' }}>Email</p>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>{member.email || '—'}</p>
              </div>
            </div>
            <div className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Briefcase size={14} color={color} />
              <div>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 2px' }}>Setor</p>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>{member.sector || '—'}</p>
              </div>
            </div>
          </div>

          {contracts.length > 0 && (
            <div style={{ padding: '12px 16px', borderRadius: 12, background: `${color}10`, border: `1px solid ${color}40` }}>
              <p style={{ fontSize: 10, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShieldCheck size={12} /> Contratos sob responsabilidade
              </p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {contracts.map((c: string) => (
                  <span key={c} style={{ fontSize: 12, fontWeight: 800, color, background: 'var(--bg-card)', padding: '3px 10px', borderRadius: 6, border: `1px solid ${color}40` }}>{c}</span>
                ))}
              </div>
            </div>
          )}

          {member.bio && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, borderLeft: `3px solid ${color}`, paddingLeft: 14, margin: 0 }}>
              {member.bio}
            </p>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal de Edição (Admin) ─────────────────────────────────────────────────
function EditMemberModal({ member, allClients, onClose, onSave }: {
  member: any; allClients: any[]; onClose: () => void; onSave: () => void;
}) {
  const [sector, setSector] = useState(member.sector || '');
  const [bio, setBio] = useState(member.bio || '');
  const [selectedContracts, setSelectedContracts] = useState<string[]>(member.contracts || []);
  const [saving, setSaving] = useState(false);

  const toggleContract = (name: string) => {
    setSelectedContracts(prev => prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiFetch(`/api/users/${member.id}`, {
        method: 'PUT',
        body: JSON.stringify({ sector, bio, contracts: selectedContracts }),
      });
      onSave();
      onClose();
    } catch (e) {
      alert('Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ padding: 0, maxWidth: 500 }}>
        <div className="modal-header">
          <h2 style={{ fontSize: 16, fontWeight: 900, margin: 0 }}>Editar: {member.name}</h2>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="form-label">Setor</label>
            <input className="input" value={sector} onChange={e => setSector(e.target.value)} placeholder="Ex: Criativo, Tecnologia, Comercial..." />
          </div>
          <div>
            <label className="form-label">Bio / Descrição</label>
            <textarea className="input" value={bio} onChange={e => setBio(e.target.value)} placeholder="Descreva as responsabilidades desta pessoa..." rows={3} style={{ resize: 'vertical' }} />
          </div>
          <div>
            <label className="form-label">Contratos sob responsabilidade</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto', padding: '4px 0' }}>
              {allClients.map(c => (
                <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '8px 12px', borderRadius: 8, background: selectedContracts.includes(c.name) ? 'var(--primary-glow)' : 'var(--bg-subtle)', border: `1px solid ${selectedContracts.includes(c.name) ? 'var(--primary)' : 'var(--border)'}`, transition: 'all 0.15s' }}>
                  <input type="checkbox" checked={selectedContracts.includes(c.name)} onChange={() => toggleContract(c.name)} style={{ accentColor: 'var(--primary)' }} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>{c.name}</p>
                    {c.company && <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>{c.company}</p>}
                  </div>
                </label>
              ))}
              {allClients.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Nenhum cliente no sistema ainda.</p>}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Save size={14} /> {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Fluxograma ──────────────────────────────────────────────────────────────
function Fluxograma({ sectors }: { sectors: { sector: string; members: any[] }[] }) {
  const steps = [
    { label: 'Lead / Prospect', icon: Target, color: '#f59e0b', desc: 'Novo contato identificado via WhatsApp ou indicação' },
    { label: 'Reunião Comercial', icon: Briefcase, color: '#2563eb', desc: 'Apresentação dos serviços e proposta personalizada' },
    { label: 'Aprovação do Escopo', icon: ShieldCheck, color: '#7c3aed', desc: 'CEO aprova o contrato e define responsáveis' },
    { label: 'Onboarding Criativo', icon: PenTool, color: '#e11d48', desc: 'Briefing, identidade visual e planejamento editorial' },
    { label: 'Produção & Entrega', icon: Zap, color: '#10b981', desc: 'Execução dos serviços pelos setores operacionais' },
    { label: 'Aprovação do Cliente', icon: ChevronRight, color: '#0891b2', desc: 'Cliente valida materiais via Portal de Aprovações' },
    { label: 'Relatório & Renovação', icon: FileText, color: '#4f46e5', desc: 'Análise de resultados e renovação do contrato' },
  ];

  return (
    <div style={{ padding: '32px 24px' }}>
      <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
        <GitBranch size={20} color="var(--primary)" /> Fluxo Operacional da Agência
      </h2>

      {/* Flow principal */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxWidth: 640 }}>
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={i}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
                {/* Linha vertical + ponto */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: `${step.color}20`, border: `2px solid ${step.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={18} color={step.color} />
                  </div>
                  {i < steps.length - 1 && <div style={{ width: 2, height: 48, background: `${step.color}40`, marginTop: 4 }} />}
                </div>

                {/* Conteúdo */}
                <div style={{ paddingTop: 10, paddingBottom: i < steps.length - 1 ? 0 : 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: step.color, background: `${step.color}15`, padding: '2px 8px', borderRadius: 6 }}>ETAPA {i + 1}</span>
                    <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>{step.label}</p>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5, paddingBottom: i < steps.length - 1 ? 28 : 0 }}>{step.desc}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid de setores */}
      <div style={{ marginTop: 40 }}>
        <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users size={16} color="var(--primary)" /> Divisão por Setores
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {sectors.map(({ sector, members }) => {
            const color = getColor(sector);
            const Icon = getSectorIcon(sector);
            return (
              <div key={sector} className="card" style={{ padding: 20, borderTop: `3px solid ${color}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={18} color={color} />
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 900, margin: 0 }}>{sector}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>{members.length} membro(s)</p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {members.map(m => (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8, background: 'var(--bg-subtle)' }}>
                      <div style={{ width: 26, height: 26, borderRadius: 6, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                        {(m.name || '?').substring(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 700, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</p>
                        <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0 }}>{m.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Lista ───────────────────────────────────────────────────────────────────
function ListaView({ members, onSelect, isAdmin, onEdit }: {
  members: any[]; onSelect: (m: any) => void; isAdmin: boolean; onEdit: (m: any) => void;
}) {
  const sectors = [...new Set(members.map(m => m.sector || 'Sem Setor'))];
  const [expanded, setExpanded] = useState<string[]>(sectors);

  const toggle = (s: string) => setExpanded(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {sectors.map(sector => {
        const sectorMembers = members.filter(m => (m.sector || 'Sem Setor') === sector);
        const color = getColor(sector);
        const Icon = getSectorIcon(sector);
        const isOpen = expanded.includes(sector);

        return (
          <div key={sector} className="card" style={{ padding: 0, overflow: 'hidden', borderLeft: `4px solid ${color}` }}>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', cursor: 'pointer', background: isOpen ? `${color}08` : 'transparent', transition: 'background 0.2s' }}
              onClick={() => toggle(sector)}
            >
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={18} color={color} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 900, margin: 0, color: 'var(--text-main)' }}>{sector}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>{sectorMembers.length} membro(s)</p>
              </div>
              <ChevronDown size={16} color="var(--text-muted)" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </div>

            {isOpen && (
              <div style={{ borderTop: '1px solid var(--border)' }}>
                {sectorMembers.map(m => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-subtle)'}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
                    onClick={() => onSelect(m)}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${color}, ${color}aa)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                      {(m.name || '?').substring(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>{m.name}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>{m.role}</p>
                    </div>
                    {(m.contracts || []).length > 0 && (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: 240 }}>
                        {(m.contracts || []).slice(0, 2).map((c: string) => (
                          <span key={c} style={{ fontSize: 10, fontWeight: 700, color, background: `${color}15`, padding: '2px 8px', borderRadius: 5, border: `1px solid ${color}30` }}>{c}</span>
                        ))}
                        {(m.contracts || []).length > 2 && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>+{(m.contracts || []).length - 2}</span>}
                      </div>
                    )}
                    {isAdmin && (
                      <button className="btn-icon" onClick={e => { e.stopPropagation(); onEdit(m); }} style={{ flexShrink: 0 }}>
                        <Edit2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function DiagramaEquipe() {
  const { team, clients, refreshTeam } = useData();
  const { user } = useContext(AuthContext);
  const isAdmin = ['ADMIN', 'CEO'].includes(user?.role || '');

  const [selected, setSelected] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('organograma');

  // Enriquecer membros da equipe com contratos (guardados em preferences.contracts)
  const enrichedTeam = team.map(t => {
    let contracts: string[] = (t as any).contracts || [];
    return { ...t, contracts };
  });

  const ceo = enrichedTeam.filter(m => ['CEO', 'ADMIN'].includes(m.role || ''));
  const gestores = enrichedTeam.filter(m => (m.role || '').toUpperCase().includes('GESTOR'));
  const operacional = enrichedTeam.filter(m => !['CEO', 'ADMIN'].includes(m.role || '') && !(m.role || '').toUpperCase().includes('GESTOR'));

  const allSectorMembers = [...gestores, ...operacional];
  const sectors = [...new Set(allSectorMembers.map(m => m.sector || 'Geral'))];
  const sectorGroups = sectors.map(s => ({
    sector: s,
    members: allSectorMembers.filter(m => (m.sector || 'Geral') === s),
  }));

  const viewBtns: { key: ViewMode; label: string; icon: React.ElementType }[] = [
    { key: 'organograma', label: 'Organograma', icon: Network },
    { key: 'fluxograma', label: 'Fluxograma', icon: GitBranch },
    { key: 'lista', label: 'Lista por Setor', icon: LayoutDashboard },
  ];

  // ─── Handler de salvar edição ─────────────────────────────────────────────
  const handleSaveEdit = async () => {
    await refreshTeam?.();
  };

  return (
    <div className="animate-in" style={{ paddingBottom: 60 }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'var(--primary-glow)', border: '1px solid var(--border-strong)', borderRadius: 100, fontSize: 11, fontWeight: 700, color: 'var(--primary)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          <Network size={12} /> Estrutura Organizacional
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-main)', margin: 0 }}>
              Organograma Magister Tech
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 6 }}>
              Hierarquia, setores, responsáveis e contratos da agência
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'var(--success-glow)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10 }}>
              <Users size={14} color="var(--success)" />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--success)' }}>{enrichedTeam.length} colaboradores</span>
            </div>
          </div>
        </div>
      </div>

      {/* View Switcher */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, padding: '10px 14px', background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', flexWrap: 'wrap' }}>
        {viewBtns.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setViewMode(key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: 13, transition: 'all 0.2s',
              background: viewMode === key ? 'var(--primary)' : 'var(--bg-subtle)',
              color: viewMode === key ? '#fff' : 'var(--text-muted)',
              boxShadow: viewMode === key ? '0 4px 12px var(--primary-glow)' : 'none',
            }}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* ── Organograma ── */}
      {viewMode === 'organograma' && (
        <div className="card" style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', overflowX: 'auto', minHeight: 500 }}>
          {enrichedTeam.length === 0 ? (
            <div style={{ padding: 80, textAlign: 'center' }}>
              <Users size={48} color="var(--text-light)" style={{ marginBottom: 16 }} />
              <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-muted)' }}>Nenhum colaborador cadastrado</p>
              <p style={{ fontSize: 13, color: 'var(--text-light)' }}>Adicione usuários no módulo de Equipe</p>
            </div>
          ) : (
            <>
              {/* CEO */}
              {ceo.length > 0 && (
                <>
                  <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {ceo.map(m => <MemberCard key={m.id} member={m} size="lg" onClick={() => setSelected(m)} />)}
                  </div>
                  {(gestores.length > 0 || operacional.length > 0) && <VLine height={40} />}
                </>
              )}

              {/* Gestores */}
              {gestores.length > 0 && (
                <>
                  <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {gestores.map(m => <MemberCard key={m.id} member={m} size="md" onClick={() => setSelected(m)} />)}
                  </div>
                  {sectorGroups.length > 0 && (
                    <>
                      <VLine height={40} />
                      <HLineGroup count={sectorGroups.length} />
                    </>
                  )}
                </>
              )}

              {/* Operacional por setor */}
              {sectorGroups.length > 0 && (
                <div style={{ display: 'flex', gap: 28, justifyContent: 'center', flexWrap: 'wrap', marginTop: 8, width: '100%' }}>
                  {sectorGroups.map(({ sector, members: sm }) => {
                    const color = getColor(sector);
                    const Icon = getSectorIcon(sector);
                    return (
                      <div key={sector} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <VLine color={color} height={30} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: `${color}15`, border: `1px solid ${color}40`, borderRadius: 8, marginBottom: 10, fontSize: 10, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                          <Icon size={10} /> {sector}
                        </div>
                        <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 200 }}>
                          {sm.map(m => <MemberCard key={m.id} member={m} size="sm" onClick={() => setSelected(m)} />)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Fluxograma ── */}
      {viewMode === 'fluxograma' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <Fluxograma sectors={sectorGroups} />
        </div>
      )}

      {/* ── Lista ── */}
      {viewMode === 'lista' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <ListaView members={enrichedTeam} onSelect={setSelected} isAdmin={isAdmin} onEdit={setEditing} />
        </div>
      )}

      {/* Card legenda mesmo no organograma */}
      {viewMode === 'organograma' && enrichedTeam.length > 0 && (
        <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {enrichedTeam.map(m => {
            const color = getColor(m.sector || m.id);
            return (
              <div key={m.id} className="card" onClick={() => setSelected(m)}
                style={{ cursor: 'pointer', padding: '16px 18px', borderLeft: `3px solid ${color}`, transition: 'var(--transition)', display: 'flex', alignItems: 'center', gap: 12 }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'none')}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: `linear-gradient(135deg, ${color}, ${color}aa)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                  {(m.name || '?').substring(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 800, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>{m.role} · {m.sector}</p>
                </div>
                {isAdmin && (
                  <button className="btn-icon" style={{ flexShrink: 0 }} onClick={e => { e.stopPropagation(); setEditing(m); }}>
                    <Edit2 size={13} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modais */}
      {selected && !editing && (
        <MemberModal member={selected} onClose={() => setSelected(null)} onEdit={m => { setSelected(null); setEditing(m); }} isAdmin={isAdmin} />
      )}
      {editing && (
        <EditMemberModal member={editing} allClients={clients} onClose={() => setEditing(null)} onSave={handleSaveEdit} />
      )}
    </div>
  );
}
