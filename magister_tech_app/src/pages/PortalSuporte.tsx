import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { 
  Send, MessageSquare, ShieldCheck, Clock, 
  ChevronRight, CheckCircle2, 
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PortalSuporte() {
  const { addTicket } = useData();
  const navigate = useNavigate();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    clientName: '',
    clientWhastapp: '',
    subject: '',
    category: 'suporte' as any,
    priority: 'media' as any,
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName || !formData.clientWhastapp || !formData.description) return;

    setLoading(true);
    // Simulação de delay para feeling premium
    setTimeout(() => {
      addTicket(formData);
      setLoading(false);
      setSent(true);
    }, 1200);
  };

  if (sent) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fc', padding: 20 }}>
        <div className="card animate-scale-in" style={{ maxWidth: 480, textAlign: 'center', padding: '48px 32px' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--success-glow)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <CheckCircle2 size={42} />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 12 }}>Solicitação Enviada!</h2>
          <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 32 }}>
            Recebemos seu chamado. Um de nossos especialistas entrará em contato via WhatsApp em breve. 
            O número do seu protocolo é <strong>#{(Date.now() % 1000000).toString().padStart(6, '0')}</strong>.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button className="btn btn-primary" onClick={() => setSent(false)} style={{ width: '100%', height: 48 }}>
              Abrir Novo Chamado
            </button>
            <button className="btn btn-ghost" onClick={() => navigate('/')} style={{ width: '100%', height: 48 }}>
              Voltar para a Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fc', color: '#0f172a' }}>
      {/* Header Portal */}
      <header style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '16px 0' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => navigate('/')}>
            <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <ShieldCheck size={18} />
            </div>
            <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: -0.5 }}>Magister<span style={{ color: '#7c3aed' }}>.</span> Suporte</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <span style={{ fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={14} /> Atendimento 09h - 18h
            </span>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1000, margin: '40px auto', padding: '0 20px', display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 40 }}>
        
        {/* Left: Form */}
        <div className="animate-in">
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: -1, marginBottom: 8 }}>Como podemos ajudar?</h1>
            <p style={{ fontSize: 16, color: '#64748b' }}>Preencha os dados abaixo e iniciaremos seu atendimento.</p>
          </div>

          <form className="card" style={{ padding: 32, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }} onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div>
                <label className="form-label">Seu Nome *</label>
                <input 
                  required
                  className="input" 
                  placeholder="Ex: Daniel Borges" 
                  value={formData.clientName}
                  onChange={e => setFormData({...formData, clientName: e.target.value})}
                />
              </div>
              <div>
                <label className="form-label">WhatsApp (com DDD) *</label>
                <input 
                  required
                  className="input" 
                  placeholder="41999999999" 
                  value={formData.clientWhastapp}
                  onChange={e => setFormData({...formData, clientWhastapp: e.target.value})}
                />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label className="form-label">Assunto</label>
              <input 
                required
                className="input" 
                placeholder="Resuma sua solicitação..." 
                value={formData.subject}
                onChange={e => setFormData({...formData, subject: e.target.value})}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div>
                <label className="form-label">Categoria</label>
                <select 
                  className="input" 
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value as any})}
                >
                  <option value="suporte">Suporte Técnico</option>
                  <option value="financeiro">Financeiro / Faturamento</option>
                  <option value="alteracao">Alteração de Projeto</option>
                  <option value="bug">Reportar Erro / Bug</option>
                  <option value="outro">Outros Assuntos</option>
                </select>
              </div>
              <div>
                <label className="form-label">Urgência</label>
                <select 
                  className="input" 
                  value={formData.priority}
                  onChange={e => setFormData({...formData, priority: e.target.value as any})}
                >
                  <option value="baixa">Baixa - Posso aguardar</option>
                  <option value="media">Média - Preciso para hoje</option>
                  <option value="alta">Alta - Atrapalha meu trabalho</option>
                  <option value="urgente">Urgente - Sistema parado</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label className="form-label">Descrição Detalhada *</label>
              <textarea 
                required
                className="input" 
                rows={5} 
                placeholder="Descreva o que está acontecendo..."
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
              style={{ width: '100%', height: 52, fontSize: 16 }}
            >
              {loading ? 'Processando...' : <><Send size={18} style={{marginRight: 8}}/> Abrir Chamado de Suporte</>}
            </button>
            <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 16 }}>
              Ao enviar, você concorda com nossos termos de uso e política de privacidade.
            </p>
          </form>
        </div>

        {/* Right: Info & FAQ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          <div className="card" style={{ padding: 24, background: '#1e293b', color: '#fff', border: 'none' }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              <MessageSquare size={20} color="#7c3aed" /> Atendimento Humano
            </h3>
            <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6, marginBottom: 20 }}>
              Nossa equipe de Customer Success está pronta para te ajudar. O tempo médio de resposta é de <strong>45 minutos</strong>.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                <CheckCircle2 size={16} color="#10b981" /> Histórico salvo no CRM
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                <CheckCircle2 size={16} color="#10b981" /> Acompanhamento via WhatsApp
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                <CheckCircle2 size={16} color="#10b981" /> Especialistas dedicados
              </div>
            </div>
          </div>

          <div style={{ padding: '0 8px' }}>
            <h4 style={{ fontSize: 14, fontWeight: 800, color: '#334155', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>Dúvidas Comuns</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                "Como alterar meu plano anual?",
                "Esqueci minha senha de acesso",
                "Prazo para conclusão de pedidos",
                "Onde vejo minhas faturas?"
              ].map(q => (
                <div key={q} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, cursor: 'pointer', transition: '0.2s' }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{q}</span>
                  <ChevronRight size={14} color="#94a3b8" />
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: 20, background: 'rgba(124, 58, 237, 0.05)', borderRadius: 16, border: '1px dashed #7c3aed' }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <AlertCircle size={20} color="#7c3aed" />
              <div>
                <p style={{ fontSize: 13, fontWeight: 800, color: '#7c3aed', marginBottom: 4 }}>Urgência Crítica?</p>
                <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
                  Se o seu problema for bloqueante e o sistema estiver fora do ar, ligue para nosso plantão 24h.
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>

      <footer style={{ marginTop: 'auto', padding: '40px 0', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: '#94a3b8' }}>© 2026 Magister Tech ERP. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
