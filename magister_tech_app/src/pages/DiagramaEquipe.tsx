import { useState, useContext, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { AuthContext } from '../contexts/AuthContext';
import {
  Crown, Briefcase, Code2, PenTool, Megaphone,
  X, Mail, Phone, ChevronRight, ShieldCheck,
  Zap, Users, Target, Network,
  Edit2, FileText, GitBranch, LayoutDashboard,
  Save, Building2, Globe, Award, Calendar,
  Trash2, AlertTriangle, Plus, Lock
} from 'lucide-react';
import { apiFetch } from '../lib/api';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getColor(seed: string) {
  const colors = ['#7c3aed', '#2563eb', '#10b981', '#f59e0b', '#e11d48', '#0891b2', '#4f46e5', '#be185d', '#0d9488', '#b45309'];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function getSectorIcon(sector: string) {
  const s = (sector || '').toLowerCase();
  if (s.includes('ceo') || s.includes('dire')) return Crown;
  if (s.includes('gest') || s.includes('coord')) return Award;
  if (s.includes('criativ') || s.includes('design')) return PenTool;
  if (s.includes('tecno') || s.includes('dev')) return Code2;
  if (s.includes('market') || s.includes('cont')) return Megaphone;
  if (s.includes('comerc') || s.includes('vend')) return Target;
  return Briefcase;
}

type MainTab = 'equipe' | 'clientes';
type ViewMode = 'organograma' | 'fluxograma';

// ─── Descrições de Funções por Colaborador ────────────────────────────────────
const MEMBER_FUNCTIONS: Record<string, { cargo: string; resumo: string; responsabilidades: string[]; contratos?: string[] }> = {
  DANIEL: {
    cargo: 'CEO / Sócio-Administrador',
    resumo: 'Responsável pela organização geral, planejamento estratégico e direção da Magister Tech, atuando como principal pilar da empresa.',
    responsabilidades: [
      'Fechamento de contratos e parcerias estratégicas',
      'Contratação e desligamento de colaboradores',
      'Liberação e aprovação de gastos e receitas',
      'Planejamento de metas e estratégias de crescimento',
      'Definição de ações para escalabilidade da empresa',
      'Supervisão geral das operações e tomada de decisões',
    ],
    contratos: ['JR Kingdom — Gestão de tráfego, postagens e reuniões estratégicas'],
  },
  ESTER: {
    cargo: 'Comercial / Gestão',
    resumo: 'Responsável pela gestão comercial e operacional, garantindo alinhamento entre equipe, clientes e entregas.',
    responsabilidades: [
      'Planejamento, análise e controle de desempenho dos colaboradores',
      'Acompanhamento de resultados e performance dos clientes',
      'Coordenação da equipe para atingimento de metas',
      'Alinhamento interno entre setores e acompanhamento de demandas',
      'Briefing após fechamento do contrato',
      'Contato com clientes, planejamento e desenvolvimento de estratégias comerciais',
    ],
  },
  LUCAS: {
    cargo: 'Desenvolvedor Sênior',
    resumo: 'Responsável pelo desenvolvimento de sistemas e soluções tecnológicas da Magister Tech, contribuindo para inovação e automação.',
    responsabilidades: [
      'Desenvolvimento de sistemas operacionais e plataformas internas',
      'Criação e manutenção de soluções personalizadas para clientes',
      'Correção de falhas, testes e suporte técnico',
      'Integração entre sistemas e automação de processos internos',
      'Planejamento técnico de novos projetos',
      'Garantia de desempenho, funcionalidade e segurança dos sistemas',
    ],
  },
  GUSTAVO: {
    cargo: 'Designer',
    resumo: 'Responsável pela criação de materiais visuais e peças gráficas para campanhas, divulgação e identidade visual dos clientes.',
    responsabilidades: [
      'Criação de artes, designs, layouts e anúncios',
      'Produção de peças para postagens e campanhas publicitárias',
      'Produção de banners e materiais promocionais',
      'Edição de fotos e vídeos',
      'Adaptação de materiais conforme identidade visual de cada cliente',
    ],
  },
  CRISTIANO: {
    cargo: 'Designer',
    resumo: 'Responsável pela produção de materiais gráficos e visuais para clientes, com foco em comunicação, divulgação e campanhas.',
    responsabilidades: [
      'Criação de artes, designs e layouts',
      'Produção de postagens para redes sociais',
      'Desenvolvimento de anúncios e campanhas',
      'Criação de banners e materiais promocionais',
      'Edição de fotos e vídeos',
      'Ajustes e adaptações gráficas conforme necessidade dos clientes',
    ],
  },
  LIVIA: {
    cargo: 'Social Media',
    resumo: 'Responsável pela gestão de mídias sociais, planejamento de conteúdo e acompanhamento de desempenho das redes dos clientes.',
    responsabilidades: [
      'Planejamento e organização de postagens para Instagram, Facebook, LinkedIn e TikTok',
      'Criação de conteúdos: posts, reels, shorts e lives',
      'Organização de calendário editorial',
      'Monitoramento do desempenho das publicações',
      'Análise de métricas e resultados das redes sociais',
      'Acompanhamento de tendências para aplicação nas estratégias de conteúdo',
    ],
  },
};

function getMemberFunctions(name: string) {
  const upper = (name || '').toUpperCase();
  const key = Object.keys(MEMBER_FUNCTIONS).find(k => upper.includes(k));
  return key ? MEMBER_FUNCTIONS[key] : null;
}

// ─── Connector Lines ──────────────────────────────────────────────────────────
function VLine({ color = 'var(--border)', height = 32 }: { color?: string; height?: number }) {
  return <div style={{ width: 2, height, background: color, margin: '0 auto', borderRadius: 2 }} />;
}

function HConnector({ count }: { count: number }) {
  if (count <= 1) return null;
  return <div style={{ height: 2, background: 'var(--border)', width: '65%', margin: '0 auto', borderRadius: 2 }} />;
}

// ─── Member Avatar ─────────────────────────────────────────────────────────────
function Avatar({ name, color, size = 44 }: { name: string; color: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.28,
      background: `linear-gradient(135deg, ${color}, ${color}bb)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.33, fontWeight: 900, color: '#fff', flexShrink: 0,
      boxShadow: `0 4px 16px ${color}30`,
    }}>
      {(name || '?').substring(0, 2).toUpperCase()}
    </div>
  );
}

// ─── MemberCard (Organogram) ──────────────────────────────────────────────────
function MemberCard({ member, onClick, size = 'md' }: {
  member: any; onClick: () => void; size?: 'xl' | 'md' | 'sm';
}) {
  const [hov, setHov] = useState(false);
  const color = getColor(member.sector || member.id || 'default');
  const Icon = getSectorIcon(member.sector || '');

  if (size === 'xl') return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        cursor: 'pointer', textAlign: 'center',
        background: hov ? `${color}10` : 'var(--bg-card)',
        border: `2px solid ${hov ? color : `${color}35`}`,
        borderRadius: 24, padding: '32px 44px', minWidth: 240,
        transition: 'all 0.3s', transform: hov ? 'translateY(-6px)' : 'none',
        boxShadow: hov ? `0 20px 52px ${color}25` : 'var(--shadow-sm)',
      }}
    >
      <div style={{ position: 'relative', display: 'inline-block', marginBottom: 14 }}>
        <Avatar name={member.name} color={color} size={76} />
        <div style={{ position: 'absolute', bottom: -6, right: -6, width: 28, height: 28, borderRadius: 9, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid var(--bg-card)' }}>
          <Icon size={13} color="#fff" />
        </div>
      </div>
      <p style={{ fontSize: 11, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{member.sector || 'CEO'}</p>
      <p style={{ fontSize: 19, fontWeight: 900, color: 'var(--text-main)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>{member.name}</p>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>{member.role}</p>
      {member.bio && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10, fontStyle: 'italic', lineHeight: 1.5, opacity: 0.8 }}>"{member.bio.substring(0, 70)}{member.bio.length > 70 ? '…' : ''}"</p>
      )}
    </div>
  );

  if (size === 'md') return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14,
        padding: '16px 22px', borderRadius: 18,
        background: hov ? `${color}10` : 'var(--bg-card)',
        border: `2px solid ${hov ? color : `${color}30`}`,
        minWidth: 230, transition: 'all 0.25s',
        transform: hov ? 'translateY(-4px)' : 'none',
        boxShadow: hov ? `0 10px 28px ${color}20` : 'var(--shadow-sm)',
      }}
    >
      <Avatar name={member.name} color={color} size={48} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>{member.name}</p>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 0' }}>{member.role}</p>
        {member.bio && (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', opacity: 0.7 }}>{member.bio}</p>
        )}
      </div>
    </div>
  );

  // sm
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
        padding: '11px 14px', borderRadius: 12,
        background: hov ? `${color}10` : 'var(--bg-subtle)',
        border: `1.5px solid ${hov ? color : 'var(--border)'}`,
        transition: 'all 0.2s',
      }}
    >
      <Avatar name={member.name} color={color} size={34} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.name}</p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>{member.sector || member.role}</p>
      </div>
    </div>
  );
}

// ─── Member Detail Modal ──────────────────────────────────────────────────────
function MemberModal({ member, onClose, onEdit, onDelete, isAdmin }: {
  member: any; onClose: () => void; onEdit: (m: any) => void;
  onDelete: (m: any) => void; isAdmin: boolean;
}) {
  const color = getColor(member.sector || member.id || 'default');
  const Icon = getSectorIcon(member.sector || '');
  const contracts: string[] = member.contracts || [];
  const fn = getMemberFunctions(member.name);
  const [showFull, setShowFull] = useState(false);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="card animate-scale-in"
        onClick={e => e.stopPropagation()}
        style={{ padding: 0, maxWidth: 600, width: '100%', overflow: 'hidden', borderTop: `5px solid ${color}`, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header do Modal */}
        <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 16, alignItems: 'flex-start', flexShrink: 0 }}>
          <div style={{ position: 'relative' }}>
            <Avatar name={member.name} color={color} size={64} />
            <div style={{ position: 'absolute', bottom: -5, right: -5, width: 24, height: 24, borderRadius: 7, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid var(--bg-card)' }}>
              <Icon size={11} color="#fff" />
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{fn?.cargo || member.sector || 'Equipe Magister'}</p>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-main)', margin: '0 0 3px', letterSpacing: '-0.02em' }}>{member.name}</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>{member.email || 'Magister Tech'}</p>
          </div>
          <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start', flexShrink: 0 }}>
            {isAdmin && (
              <>
                <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, height: 34, borderColor: 'var(--primary)', color: 'var(--primary)' }} onClick={() => { onClose(); onEdit(member); }}>
                  <Edit2 size={12} /> Editar
                </button>
                <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, height: 34, borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={() => { onClose(); onDelete(member); }}>
                  <Trash2 size={12} />
                </button>
              </>
            )}
            <button className="btn-icon" onClick={onClose} style={{ width: 34, height: 34 }}><X size={17} /></button>
          </div>
        </div>

        {/* Corpo rolável */}
        <div style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
          {/* Info Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { icon: <Mail size={13} color={color} />, label: 'Email', value: member.email || 'Não informado' },
              { icon: <Phone size={13} color={color} />, label: 'Telefone', value: member.phone || 'Não informado' },
              { icon: <Building2 size={13} color={color} />, label: 'Setor', value: member.sector || 'Magister Tech' },
              { icon: <Lock size={13} color={color} />, label: 'Perfil de Acesso', value: member.role || 'COLABORADOR' },
            ].map(item => (
              <div key={item.label} style={{ padding: '12px 14px', background: 'var(--bg-subtle)', borderRadius: 10, border: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {item.icon}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', margin: '0 0 2px', letterSpacing: '0.07em' }}>{item.label}</p>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-main)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Resumo da Função (do mapa estático) */}
          {fn && (
            <div style={{ padding: '16px 18px', background: `${color}08`, borderLeft: `4px solid ${color}`, borderRadius: '0 12px 12px 0' }}>
              <p style={{ fontSize: 11, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <FileText size={12} /> Função na Empresa
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>{fn.resumo}</p>
            </div>
          )}

          {/* Responsabilidades */}
          {fn && (
            <div>
              <button
                onClick={() => setShowFull(!showFull)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 10px' }}
              >
                <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ShieldCheck size={13} color={color} /> Responsabilidades
                </p>
                <span style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 700 }}>{showFull ? '▲ Recolher' : '▼ Ver todas'}</span>
              </button>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(showFull ? fn.responsabilidades : fn.responsabilidades.slice(0, 3)).map((r, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 12px', background: 'var(--bg-subtle)', borderRadius: 9, border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 12, color, fontWeight: 900, flexShrink: 0 }}>→</span>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{r}</span>
                  </div>
                ))}
                {!showFull && fn.responsabilidades.length > 3 && (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', margin: '4px 0 0', cursor: 'pointer' }} onClick={() => setShowFull(true)}>
                    + {fn.responsabilidades.length - 3} responsabilidades — clique em "Ver todas"
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Contratos estáticos do mapa + contratos do DB */}
          {((fn?.contratos?.length ?? 0) > 0 || contracts.length > 0) && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShieldCheck size={13} color={color} /> Contratos Sob Responsabilidade
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[...(fn?.contratos || []), ...contracts].map((c: string) => (
                  <span key={c} style={{ fontSize: 12, fontWeight: 700, color, background: `${color}12`, padding: '6px 14px', borderRadius: 10, border: `1px solid ${color}30` }}>{c}</span>
                ))}
              </div>
            </div>
          )}

          {/* Bio do DB (se diferente do resumo da função) */}
          {member.bio && member.bio !== fn?.resumo && (
            <div style={{ padding: '14px 16px', background: 'var(--bg-subtle)', borderRadius: 12, border: '1px solid var(--border)' }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 6px' }}>Nota Pessoal</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>{member.bio}</p>
            </div>
          )}
        </div>

        <div style={{ padding: '16px 28px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <button className="btn btn-primary" style={{ width: '100%', height: 42, fontWeight: 700 }} onClick={onClose}>Fechar Perfil</button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Member Modal (Admin) ────────────────────────────────────────────────
function EditMemberModal({ member, allClients, onClose, onSave }: {
  member: any; allClients: any[]; onClose: () => void; onSave: () => void;
}) {
  const [form, setForm] = useState({
    name: member.name || '',
    sector: member.sector || '',
    bio: member.bio || '',
    phone: member.phone || '',
    contracts: member.contracts || [] as string[],
  });
  const [saving, setSaving] = useState(false);
  const color = getColor(member.sector || member.id);

  const toggleContract = (name: string) =>
    setForm(prev => ({ ...prev, contracts: prev.contracts.includes(name) ? prev.contracts.filter((c: string) => c !== name) : [...prev.contracts, name] }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const prefs = { ...(member.preferences || {}), contracts: form.contracts };
      await apiFetch(`/api/users/${member.id}`, {
        method: 'PUT',
        body: JSON.stringify({ sector: form.sector, bio: form.bio, phone: form.phone, preferences: JSON.stringify(prefs) }),
      });
      onSave();
      onClose();
    } catch { alert('Erro ao salvar. Verifique a conexão.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="card animate-scale-in" onClick={e => e.stopPropagation()} style={{ padding: 0, maxWidth: 520, width: '100%', overflow: 'hidden', borderTop: `4px solid ${color}` }}>
        <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar name={member.name} color={color} size={42} />
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 900, margin: 0, color: 'var(--text-main)' }}>Editar: {member.name}</h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 0' }}>Apenas Admin pode atualizar o perfil</p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="form-label">Setor</label>
              <input className="input" value={form.sector} onChange={e => setForm({ ...form, sector: e.target.value })} placeholder="Ex: Criativo, Tecnologia..." style={{ width: '100%' }} />
            </div>
            <div>
              <label className="form-label">Telefone</label>
              <input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(65) 99999-9999" style={{ width: '100%' }} />
            </div>
          </div>
          <div>
            <label className="form-label">Bio / Descrição Profissional</label>
            <textarea className="input" value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Responsabilidades e diferenciais..." rows={3} style={{ resize: 'vertical', width: '100%' }} />
          </div>
          <div>
            <label className="form-label">Contratos Sob Responsabilidade</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto', padding: '2px 0' }}>
              {allClients.map((c: any) => (
                <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 14px', borderRadius: 10, background: form.contracts.includes(c.name) ? 'var(--primary-glow)' : 'var(--bg-subtle)', border: `1px solid ${form.contracts.includes(c.name) ? 'var(--primary)' : 'var(--border)'}`, transition: 'all 0.15s' }}>
                  <input type="checkbox" checked={form.contracts.includes(c.name)} onChange={() => toggleContract(c.name)} style={{ accentColor: 'var(--primary)', width: 15, height: 15 }} />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>{c.name}</p>
                    {c.company && <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>{c.company}</p>}
                  </div>
                </label>
              ))}
              {allClients.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Nenhum cliente no sistema.</p>}
            </div>
          </div>
        </div>
        <div style={{ padding: '20px 28px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} onClick={handleSave} disabled={saving}>
            <Save size={15} /> {saving ? 'Salvando...' : 'Salvar Perfil'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteMemberModal({ member, onClose, onConfirm }: { member: any; onClose: () => void; onConfirm: () => void }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="card animate-scale-in" onClick={e => e.stopPropagation()} style={{ maxWidth: 400, padding: 36, textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--danger-glow)', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(239,68,68,0.3)' }}>
          <AlertTriangle size={30} color="var(--danger)" />
        </div>
        <h3 style={{ fontSize: 19, fontWeight: 900, marginBottom: 10, color: 'var(--text-main)' }}>Remover {member.name}?</h3>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 28, lineHeight: 1.6 }}>
          Esta ação desativará o acesso do usuário ao sistema. O registro pode ser restaurado pelo gerenciamento de equipe.
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
          <button className="btn btn-danger" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} onClick={onConfirm}>
            <Trash2 size={15} /> Confirmar Remoção
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Fluxograma ───────────────────────────────────────────────────────────────
function Fluxograma({ sectorGroups }: { sectorGroups: { sector: string; members: any[] }[] }) {
  const steps = [
    { label: 'Lead & Prospecção', icon: Target, color: '#f59e0b', desc: 'Identificação via WhatsApp ou indicação. Daniel (CEO) qualifica o potencial do lead.' },
    { label: 'Reunião & Proposta', icon: Briefcase, color: '#2563eb', desc: 'Apresentação dos serviços Magister. Elaboração da proposta personalizada.' },
    { label: 'Onboarding & Contrato', icon: ShieldCheck, color: '#7c3aed', desc: 'Ester (Gestão) coordena o onboarding e integra o cliente ao ERP.' },
    { label: 'Criação & Branding', icon: PenTool, color: '#e11d48', desc: 'Setor Criativo desenvolve identidade visual, briefing e calendário editorial.' },
    { label: 'Tecnologia & Deploy', icon: Code2, color: '#10b981', desc: 'Desenvolvimento de landing pages, dashboards e integrações técnicas.' },
    { label: 'Gestão de Conteúdo', icon: Megaphone, color: '#0891b2', desc: 'Calendário editorial ativo, aprovações de criativos e publicações programadas.' },
    { label: 'Relatório & Renovação', icon: FileText, color: '#4f46e5', desc: 'KPIs, DRE e análise de resultados. Negociação de renovação de contrato.' },
  ];

  return (
    <div style={{ padding: '40px' }}>
      <h2 style={{ fontSize: 20, fontWeight: 900, margin: '0 0 36px', display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-main)', letterSpacing: '-0.03em' }}>
        <GitBranch size={24} color="var(--primary)" /> Fluxo Operacional Magister Tech
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 40, alignItems: 'start' }}>
        {/* Timeline */}
        <div>
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} style={{ display: 'flex', gap: 24, marginBottom: i < steps.length - 1 ? 0 : 0 }}>
                {/* Icon + Connector */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: `${step.color}15`, border: `2px solid ${step.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 16px ${step.color}20`, flexShrink: 0 }}>
                    <Icon size={22} color={step.color} />
                  </div>
                  {i < steps.length - 1 && (
                    <div style={{ width: 2, height: 56, background: `linear-gradient(${step.color}50, ${steps[i + 1].color}20)`, borderRadius: 2, marginTop: 4 }} />
                  )}
                </div>
                {/* Content */}
                <div style={{ paddingTop: 12, paddingBottom: i < steps.length - 1 ? 40 : 0 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 900, color: step.color, background: `${step.color}15`, padding: '3px 10px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>fase {i + 1}</span>
                    <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>{step.label}</p>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sector Grid */}
        <div style={{ minWidth: 260 }}>
          <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 16px', display: 'flex', gap: 6, alignItems: 'center' }}>
            <Users size={14} /> Equipe por Setor
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sectorGroups.map(({ sector, members }) => {
              const color = getColor(sector);
              const Icon = getSectorIcon(sector);
              return (
                <div key={sector} style={{ padding: '14px 16px', background: 'var(--bg-subtle)', borderRadius: 14, border: '1px solid var(--border)', borderLeft: `3px solid ${color}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={13} color={color} />
                    </div>
                    <span style={{ fontWeight: 800, fontSize: 13, color: 'var(--text-main)' }}>{sector}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {members.map(m => (
                      <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)' }}>
                        <div style={{ width: 20, height: 20, borderRadius: 5, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: '#fff' }}>
                          {m.name.charAt(0)}
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-main)' }}>{m.name.split(' ')[0]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function DiagramaEquipe() {
  const { team, clients, refreshTeam } = useData();
  const { user } = useContext(AuthContext);
  const isAdmin = ['ADMIN', 'CEO'].includes(user?.role || '');

  const [mainTab, setMainTab] = useState<MainTab>('equipe');
  const [viewMode, setViewMode] = useState<ViewMode>('organograma');
  const [selected, setSelected] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleting, setDeleting] = useState<any | null>(null);

  // ── Filtragem: membros internos (inclui Cristiano) ─────────────────────────
  const INTERNAL_NAMES = ['DANIEL', 'ESTER', 'LUCAS', 'LIVIA', 'GUSTAVO', 'CRISTIANO'];

  const enrichedTeam = useMemo(() => {
    return team
      .filter(t => INTERNAL_NAMES.some(n => t.name.toUpperCase().includes(n)))
      .map(t => ({
        ...t,
        contracts: (t as any).contracts || [],
        phone: (t as any).phone || '',
      }));
  }, [team]);

  const ceos = enrichedTeam.filter(m => m.name.toUpperCase().includes('DANIEL'));
  const gestores = enrichedTeam.filter(m => m.name.toUpperCase().includes('ESTER'));
  const operacional = enrichedTeam.filter(m =>
    !m.name.toUpperCase().includes('DANIEL') &&
    !m.name.toUpperCase().includes('ESTER')
  );

  const sectorGroups = useMemo(() => {
    const map: Record<string, any[]> = {};
    [...gestores, ...operacional].forEach(m => {
      const s = m.sector || 'Operacional';
      if (!map[s]) map[s] = [];
      map[s].push(m);
    });
    return Object.entries(map).map(([sector, members]) => ({ sector, members }));
  }, [gestores, operacional]);

  // ── Agrupamento por empresa (Clientes) ────────────────────────────────
  const clientGroups = useMemo(() => {
    const groups: Record<string, any[]> = {};
    clients.forEach(c => {
      const g = c.company || 'Clientes Avulsos';
      if (!groups[g]) groups[g] = [];
      groups[g].push(c);
    });
    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([company, members]) => ({ company, members, id: company }));
  }, [clients]);

  const handleDelete = async (member: any) => {
    try {
      await apiFetch(`/api/users/${member.id}`, { method: 'DELETE' });
      await refreshTeam?.();
    } catch {
      alert('Erro ao remover usuário.');
    }
    setDeleting(null);
  };

  return (
    <div className="animate-in" style={{ paddingBottom: 60 }}>

      {/* ── PAGE HEADER ─────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'var(--primary-glow)', border: '1px solid var(--border-strong)', borderRadius: 100, fontSize: 11, fontWeight: 700, color: 'var(--primary)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          <Network size={12} /> Estrutura Organizacional
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-main)', margin: 0 }}>Hub de Equipe & Portfólio</h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 6 }}>Visão executiva da Magister Tech — {enrichedTeam.length} colaboradores · {clientGroups.length} grupos de clientes</p>
          </div>
          {/* Main Tab Switcher */}
          <div style={{ display: 'flex', background: 'var(--bg-card)', padding: 5, borderRadius: 14, border: '1px solid var(--border)', gap: 4 }}>
            {[
              { key: 'equipe', label: 'Time Magister', icon: Users },
              { key: 'clientes', label: 'Portfólio Clientes', icon: Building2 },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setMainTab(key as MainTab)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '9px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  fontWeight: 700, fontSize: 13, transition: 'all 0.2s',
                  background: mainTab === key ? 'var(--primary)' : 'transparent',
                  color: mainTab === key ? '#fff' : 'var(--text-muted)',
                  boxShadow: mainTab === key ? '0 4px 12px var(--primary-glow)' : 'none',
                }}
              >
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══ TAB: EQUIPE ══════════════════════════════════════════ */}
      {mainTab === 'equipe' && (
        <>
          {/* View Switcher */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {[
              { key: 'organograma', label: 'Organograma', icon: Network },
              { key: 'fluxograma', label: 'Fluxograma', icon: GitBranch },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setViewMode(key as ViewMode)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '9px 18px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13,
                  border: `2px solid ${viewMode === key ? 'var(--primary)' : 'var(--border)'}`,
                  background: viewMode === key ? 'var(--primary-glow)' : 'var(--bg-card)',
                  color: viewMode === key ? 'var(--primary)' : 'var(--text-muted)',
                  transition: 'all 0.2s',
                }}
              >
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>

          {/* Organograma */}
          {viewMode === 'organograma' && (
            <div className="card" style={{ padding: '56px 24px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', overflowX: 'auto', minHeight: 520 }}>
              {enrichedTeam.length === 0 ? (
                <div style={{ padding: 80, textAlign: 'center' }}>
                  <Users size={52} color="var(--border)" style={{ marginBottom: 16 }} />
                  <p style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: 16 }}>Nenhum colaborador encontrado</p>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', opacity: 0.6 }}>Cadastre usuários (Daniel, Ester, Lucas, Gustavo, Cristiano, Livia) no módulo Equipe.</p>
                </div>
              ) : (
                <>
                  {/* ── NÍVEL 1: DIRETORIA ── */}
                  {ceos.length > 0 && (
                    <>
                      <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'center' }}>
                        <span style={{ fontSize: 10, fontWeight: 900, color: 'var(--primary)', background: 'var(--primary-glow)', padding: '4px 14px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: '0.12em', border: '1px solid var(--primary)' }}>Diretoria</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
                        {ceos.map(m => <MemberCard key={m.id} member={m} size="xl" onClick={() => setSelected(m)} />)}
                      </div>
                      {(gestores.length > 0 || operacional.length > 0) && <VLine color="var(--primary)" height={36} />}
                    </>
                  )}

                  {/* ── NÍVEL 2: GESTÃO ── */}
                  {gestores.length > 0 && (
                    <>
                      <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'center' }}>
                        <span style={{ fontSize: 10, fontWeight: 900, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '4px 14px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: '0.12em', border: '1px solid rgba(245,158,11,0.4)' }}>Gestão</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
                        {gestores.map(m => <MemberCard key={m.id} member={m} size="md" onClick={() => setSelected(m)} />)}
                      </div>
                      {sectorGroups.length > 0 && <><VLine color="#f59e0b" height={32} /><HConnector count={sectorGroups.length} /></>}
                    </>
                  )}

                  {/* ── NÍVEL 3: OPERACIONAL ── */}
                  {sectorGroups.length > 0 && (
                    <>
                      <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'center' }}>
                        <span style={{ fontSize: 10, fontWeight: 900, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '4px 14px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: '0.12em', border: '1px solid rgba(16,185,129,0.3)' }}>Operacional</span>
                      </div>
                      <div style={{ display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap', width: '100%' }}>
                        {sectorGroups.map(({ sector, members }) => {
                          const color = getColor(sector);
                          const Icon = getSectorIcon(sector);
                          return (
                            <div key={sector} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <VLine color={color} height={20} />
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: `${color}15`, border: `1px solid ${color}40`, borderRadius: 8, marginBottom: 10, fontSize: 10, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                                <Icon size={10} /> {sector}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--bg-subtle)', padding: 14, borderRadius: 16, border: '1px solid var(--border)', minWidth: 210 }}>
                                {members.map(m => <MemberCard key={m.id} member={m} size="sm" onClick={() => setSelected(m)} />)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* Fluxograma */}
          {viewMode === 'fluxograma' && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <Fluxograma sectorGroups={sectorGroups} />
            </div>
          )}

          {/* Cards de acesso rápido — apenas operacional (sem CEO/Gestora que já estão no organograma) */}
          {viewMode === 'organograma' && operacional.length > 0 && (
            <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {operacional.map(m => {
                const color = getColor(m.sector || m.id);
                return (
                  <div
                    key={m.id}
                    className="card"
                    onClick={() => setSelected(m)}
                    style={{ cursor: 'pointer', padding: '16px 18px', borderLeft: `3px solid ${color}`, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 14 }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
                  >
                    <Avatar name={m.name} color={color} size={44} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>{m.name}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 0' }}>{getMemberFunctions(m.name)?.cargo || m.role} · {m.sector || 'Operacional'}</p>
                    </div>
                    {isAdmin && (
                      <button className="btn-icon" style={{ width: 30, height: 30, flexShrink: 0 }} onClick={e => { e.stopPropagation(); setEditing(m); }}>
                        <Edit2 size={13} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ══ TAB: CLIENTES ════════════════════════════════════════ */}
      {mainTab === 'clientes' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>{clients.length} clientes ativos · agrupados por empresa</p>
          </div>
          {clientGroups.length === 0 ? (
            <div className="card" style={{ padding: 60, textAlign: 'center' }}>
              <Building2 size={48} color="var(--border)" style={{ marginBottom: 16 }} />
              <p style={{ fontWeight: 700, color: 'var(--text-muted)' }}>Nenhum cliente cadastrado</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
              {clientGroups.map(group => {
                const color = getColor(group.company);
                return (
                  <div key={group.company} className="card" style={{ padding: 24, borderTop: `4px solid ${color}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 46, height: 46, borderRadius: 14, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Building2 size={22} color={color} />
                        </div>
                        <div>
                          <h3 style={{ fontSize: 17, fontWeight: 900, margin: 0, color: 'var(--text-main)' }}>{group.company}</h3>
                          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>Representante: {group.members[0]?.name}</p>
                        </div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 800, color, background: `${color}12`, padding: '4px 10px', borderRadius: 8, flexShrink: 0 }}>{group.members.length} {group.members.length === 1 ? 'projeto' : 'projetos'}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {group.members.map(m => (
                        <div
                          key={m.id}
                          onClick={() => setSelected(m)}
                          style={{ padding: '11px 14px', borderRadius: 12, background: 'var(--bg-subtle)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = `${color}10`; e.currentTarget.style.borderColor = `${color}40`; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-subtle)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                        >
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: m.status === 'ativo' || m.status === 'ATIVO' ? 'var(--success)' : 'var(--warning)', flexShrink: 0 }} />
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)', flex: 1 }}>{m.name}</span>
                          <ChevronRight size={14} color="var(--text-muted)" />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── MODAIS ─────────────────────────────────────────────── */}
      {selected && !editing && !deleting && (
        <MemberModal
          member={selected}
          isAdmin={isAdmin}
          onClose={() => setSelected(null)}
          onEdit={m => setEditing(m)}
          onDelete={m => setDeleting(m)}
        />
      )}

      {editing && (
        <EditMemberModal
          member={editing}
          allClients={clients}
          onClose={() => setEditing(null)}
          onSave={async () => { await refreshTeam?.(); }}
        />
      )}

      {deleting && (
        <DeleteMemberModal
          member={deleting}
          onClose={() => setDeleting(null)}
          onConfirm={() => handleDelete(deleting)}
        />
      )}
    </div>
  );
}
