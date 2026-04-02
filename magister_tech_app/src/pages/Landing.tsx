import { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Code, Zap, Globe, TrendingUp, Target, Star, Brain,
  ShieldCheck, Server, Headset, CheckCircle2, Megaphone,
  BarChart3, Smartphone, ShoppingCart
} from 'lucide-react';
import { DataContext } from '../contexts/DataContext';
import './Landing.css';

const WPP_LINK = "https://wa.me/5541987225702?text=Olá!%20Gostaria%20de%20solicitar%20um%20orçamento%20para%20minha%20empresa.";

const Landing = () => {
  const [scrolled, setScrolled] = useState(false);
  const { team, clients } = useContext(DataContext);

  useEffect(() => {
    document.body.classList.remove('dark-mode');
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Soluções', href: '#solucoes' },
    { name: 'Vantagens', href: '#vantagens' },
    { name: 'Clientes', href: '#clientes' },
    { name: 'Equipe', href: '#equipe' },
    { name: 'Contato', href: '#contato' },
  ];

  const fadeUp = {
    hidden: { opacity: 0, y: 28 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] } }
  };

  const stagger = {
    hidden: { opacity: 0 },
    visible: { transition: { staggerChildren: 0.08 } }
  };

  const services = [
    { icon: TrendingUp,   title: 'Marketing Digital', desc: 'Estratégias digitais completas para aumentar presença online, gerar leads qualificados e converter vendas em canais digitais.' },
    { icon: Globe,        title: 'Criação de Sites', desc: 'Sites institucionais, landing pages e portais corporativos modernos, rápidos, otimizados para SEO e altamente conversores.' },
    { icon: ShoppingCart, title: 'Loja Virtual', desc: 'E-commerces completos com integração a gateways de pagamento, estoque e gestão de produtos em escala.' },
    { icon: BarChart3,    title: 'Tráfego Pago', desc: 'Gestão profissional de anúncios no Google, Meta, TikTok, com otimização de ROI e relatórios de performance.' },
    { icon: Target,       title: 'Tráfego Mercado Livre', desc: 'Estratégias exclusivas de anúncios e posicionamento dentro do Mercado Livre para aumentar suas vendas.' },
    { icon: ShoppingCart, title: 'Tráfego Shopee & E-commerce', desc: 'Gestão de campanhas para Shopee, Magalu e outras plataformas com foco em conversão e escala de vendas.' },
    { icon: Code,         title: 'Criação de Sistemas', desc: 'Aplicações web, ERPs, CRMs e plataformas SaaS sob medida com tecnologias modernas, escaláveis e seguras.' },
    { icon: Smartphone,   title: 'Desenvolvimento de MVP', desc: 'Da ideia ao produto funcional com velocidade: construímos seu MVP para validação de mercado e captação de investidores.' },
    { icon: Server,       title: 'Terceirização de TI', desc: 'Equipe dedicada de suporte técnico, redes, backups, segurança e infraestrutura de TI para continuidade do negócio.' },
    { icon: Headset,      title: 'Suporte 24/7', desc: 'Monitoramento contínuo e suporte técnico remoto e presencial para garantir máxima disponibilidade da sua operação.' },
    { icon: ShieldCheck,  title: 'Consultoria e Auditoria', desc: 'Diagnóstico de TI, mapeamento de riscos e estratégias com foco em escalabilidade, segurança e inovação.' },
    { icon: Globe,        title: 'Sites WordPress', desc: 'Sites profissionais com WordPress, rápidos, seguros, otimizados para SEO com design personalizado e fácil de gerenciar.' },
  ];

  const diferenciais = [
    'Foco em resultado real e mensurável',
    'Soluções 100% personalizadas',
    'Atendimento rápido com SLA',
    'Tecnologia de última geração',
    'Experiência prática em SaaS e IA',
    'Visão estratégica de negócios',
    'Equipe multidisciplinar dedicada',
    'Relatórios e métricas transparentes',
    'Suporte contínuo pós-entrega',
  ];

  const getRoleIcon = (role: string) => {
    const lower = role.toLowerCase();
    if (lower.includes('ceo') || lower.includes('diretor')) return Brain;
    if (lower.includes('comercial') || lower.includes('vendas') || lower.includes('account')) return Target;
    if (lower.includes('design') || lower.includes('arte') || lower.includes('visual')) return Star;
    if (lower.includes('dev') || lower.includes('sistema') || lower.includes('full')) return Code;
    if (lower.includes('mídia') || lower.includes('marketing') || lower.includes('social')) return TrendingUp;
    if (lower.includes('gestor') || lower.includes('project')) return Megaphone;
    return Zap;
  };

  return (
    <div className="lp-wrapper">

      {/* ─── HEADER ──────────────────────────────────────────── */}
      <header className={`lp-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="lp-container lp-header-content">
          <Link to="/" className="lp-logo">
            <img src="https://i.imgur.com/jqwwNLv.png" alt="Magister Tech" />
          </Link>

          <nav className="lp-nav">
            {navLinks.map(l => <a key={l.name} href={l.href}>{l.name}</a>)}
          </nav>

          <div className="lp-header-actions">
            <Link to="/login" className="lp-btn lp-btn-ghost">Menu Restrito</Link>
            <a href={WPP_LINK} target="_blank" rel="noreferrer" className="lp-btn lp-btn-primary">
              Solicitar orçamento
            </a>
          </div>
        </div>
      </header>

      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section id="inicio" className="lp-hero">
        <div className="lp-hero-bg">
          <div className="lp-hero-glow-1" />
          <div className="lp-hero-glow-2" />
          <div className="lp-hero-glow-3" />
        </div>

        <div className="lp-container lp-hero-content">
          <motion.div className="lp-hero-text" initial="hidden" animate="visible" variants={fadeUp}>
            <div className="lp-badge">⚡ Especialistas em IA, Automação & Crescimento Digital</div>
            <h1 className="lp-h1">
              Sistemas, automação e <span className="lp-text-gradient">crescimento digital</span> para empresas que querem escalar.
            </h1>
            <p className="lp-p">
              Transformamos processos manuais em operações digitais de alta performance.
              Mais produtividade, menos custo, crescimento real e acelerado.
            </p>
            <div className="lp-hero-actions">
              <a href={WPP_LINK} target="_blank" rel="noreferrer" className="lp-btn lp-btn-primary" style={{ padding: '16px 36px', fontSize: 16 }}>
                Solicitar orçamento
              </a>
              <a href="#solucoes" className="lp-btn lp-btn-ghost" style={{ padding: '16px 36px', fontSize: 16 }}>
                Ver soluções
              </a>
            </div>

            {/* Social proof strip */}
            <div style={{ display: 'flex', gap: 32, marginTop: 40, flexWrap: 'wrap' }}>
              {[{ val: '+80', lbl: 'Projetos entregues' }, { val: '+50', lbl: 'Clientes satisfeitos' }, { val: '99%', lbl: 'Taxa de aprovação' }].map(s => (
                <div key={s.val}>
                  <span style={{ display: 'block', fontFamily: "'Outfit', sans-serif", fontSize: 28, fontWeight: 900, background: 'linear-gradient(135deg, #6366F1, #7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.val}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--lp-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.lbl}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div className="lp-hero-visual"
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.2, ease: 'easeOut' }}>
            <div className="lp-mockup-wrapper">
              <div className="lp-mockup-screen">
                <div className="lp-fake-dash">
                  <div className="lp-fake-nav">
                    <div style={{ display: 'flex', gap: 6 }}>
                      <div className="lp-fake-dot" style={{ background: '#FF5F56' }} />
                      <div className="lp-fake-dot" style={{ background: '#FFBD2E' }} />
                      <div className="lp-fake-dot" style={{ background: '#27C93F' }} />
                    </div>
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                      <div style={{ width: 100, height: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 10 }} />
                    </div>
                  </div>
                  <div className="lp-fake-body">
                    <div className="lp-fake-sidebar">
                      {[80, 55, 70, 60, 65].map((w, i) => (
                        <div key={i} className="lp-fake-line" style={{ width: `${w}%` }} />
                      ))}
                    </div>
                    <div className="lp-fake-main">
                      <div className="lp-fake-cards">
                        <div className="lp-fake-card" />
                        <div className="lp-fake-card" />
                        <div className="lp-fake-card" />
                        <div className="lp-fake-card" />
                      </div>
                      <div className="lp-fake-big-card" />
                    </div>
                  </div>
                </div>
              </div>
              {/* Floating badges */}
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                style={{ position: 'absolute', top: -16, right: -16, background: '#fff', borderRadius: 14, padding: '10px 16px', boxShadow: '0 16px 40px rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
                <span style={{ fontSize: 20 }}>🚀</span>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#0F172A' }}>+37% Crescimento</p>
                  <p style={{ fontSize: 10, color: '#64748B' }}>Este mês</p>
                </div>
              </motion.div>
              <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                style={{ position: 'absolute', bottom: -16, left: -16, background: '#fff', borderRadius: 14, padding: '10px 16px', boxShadow: '0 16px 40px rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>✅</span>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#0F172A' }}>Projeto entregue</p>
                  <p style={{ fontSize: 10, color: '#64748B' }}>Há 2h atrás</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── IMPACT QUOTE ──────────────────────────────────────── */}
      <section className="lp-impact">
        <div className="lp-container">
          <motion.h2 className="lp-impact-text"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            &ldquo;Empresas que não <span>automatizam</span> ficam para trás. Nós garantimos que você está na frente.&rdquo;
          </motion.h2>
        </div>
      </section>

      {/* ─── SERVIÇOS ─────────────────────────────────────────── */}
      <section id="solucoes" className="lp-services">
        <div className="lp-container">
          <div className="lp-section-header">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="lp-h2">Nossas <span className="lp-text-gradient">Soluções</span></h2>
              <p className="lp-p" style={{ maxWidth: 560, margin: '0 auto' }}>
                Um ecossistema completo de serviços digitais para transformar sua empresa em referência de mercado.
              </p>
            </motion.div>
          </div>
          <motion.div className="lp-grid-4" variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            {services.map(s => (
              <motion.div key={s.title} variants={fadeUp} className="lp-service-card">
                <div className="lp-icon-wrap"><s.icon size={22} /></div>
                <h4>{s.title}</h4>
                <p>{s.desc}</p>
                <a href={WPP_LINK} target="_blank" rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 20, fontSize: 13, fontWeight: 700, color: 'var(--lp-indigo)', textDecoration: 'none', transition: 'gap 0.2s' }}>
                  Saiba mais →
                </a>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── DIFERENCIAIS ─────────────────────────────────────── */}
      <section id="vantagens" className="lp-diferenciais">
        <div className="lp-container">
          <div className="lp-section-header">
            <h2 className="lp-h2">Por que empresas escolhem a <span className="lp-text-gradient">Magister Tech</span></h2>
            <p className="lp-p" style={{ maxWidth: 520, margin: '0 auto' }}>
              Comprometimento estratégico com resultados reais, não com promessas vazias.
            </p>
          </div>
          <motion.div className="lp-feat-list" variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            {diferenciais.map(d => (
              <motion.div key={d} variants={fadeUp} className="lp-feat-item">
                <CheckCircle2 className="lp-feat-icon" size={18} />
                {d}
              </motion.div>
            ))}
          </motion.div>
          <div className="lp-stats">
            {[{ val: '+80', lbl: 'Projetos entregues' }, { val: '+50', lbl: 'Clientes satisfeitos' }, { val: '99%', lbl: 'Taxa de Aprovação' }].map(s => (
              <div key={s.val} className="lp-stat-box">
                <div className="lp-stat-num">{s.val}</div>
                <div className="lp-stat-label">{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CLIENTES ATENDIDOS ─────────────────────────────────── */}
      {clients.filter(c => c.status === 'ativo').length > 0 && (
        <section id="clientes" className="lp-clients">
          <div className="lp-container">
            <div className="lp-section-header" style={{ marginBottom: 0 }}>
              <h2 className="lp-h2">Empresas que já <span className="lp-text-gradient">atendemos</span></h2>
              <p className="lp-p">A confiança que o mercado deposita na Magister Tech.</p>
            </div>
            <div className="lp-clients-track">
              {clients.filter(c => c.status === 'ativo').map(c => (
                <div key={c.id} className="lp-client-badge">{c.company || c.name}</div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── EQUIPE ────────────────────────────────────────────── */}
      <section id="equipe" className="lp-team">
        <div className="lp-container">
          <div className="lp-section-header">
            <h2 className="lp-h2">Quem <span className="lp-text-gradient">Lidera</span> a Tecnologia</h2>
            <p className="lp-p" style={{ maxWidth: 540, margin: '0 auto' }}>
              O ecossistema tático da Magister Tech. Dados integrados diretamente com nosso painel administrativo.
            </p>
          </div>
          <motion.div className="lp-team-grid" variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            {team.map(member => {
              const Icon = getRoleIcon(member.role || member.sector);
              return (
                <motion.div key={member.id} variants={fadeUp} className="lp-team-card">
                  <div className="lp-avatar">
                    {member.photoUrl
                      ? <img src={member.photoUrl} alt={member.name} />
                      : member.initials || <Icon size={28} />
                    }
                  </div>
                  <h4 className="lp-team-name">{member.name}</h4>
                  <div className="lp-team-role">{member.role}</div>
                  {member.bio && (
                    <p style={{ fontSize: 13, color: 'var(--lp-text-sec)', marginTop: 10, lineHeight: 1.6 }}>{member.bio}</p>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ─── INSTAGRAM STRIP ───────────────────────────────────── */}
      <section style={{ padding: '80px 0', background: 'var(--lp-bg-alt)', borderTop: '1px solid var(--lp-border)' }}>
        <div className="lp-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(45deg, #f09433, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', marginBottom: 24, boxShadow: '0 12px 30px rgba(220,39,67,0.3)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
          </div>
          <h2 className="lp-h2" style={{ fontSize: 32, marginBottom: 12 }}>Acompanhe nossa evolução</h2>
          <p className="lp-p" style={{ maxWidth: 540, marginBottom: 28, fontSize: 16 }}>
            Bastidores, dicas de tecnologia e novos lançamentos da Magister Tech no Instagram.
          </p>
          <a href="https://instagram.com/magister_tech" target="_blank" rel="noreferrer" className="lp-btn lp-btn-primary" style={{ borderRadius: 100, padding: '12px 32px' }}>
            @magister_tech
          </a>
        </div>
      </section>

      {/* ─── CTA FINAL ─────────────────────────────────────────── */}
      <section className="lp-cta-section">
        <div className="lp-container">
          <h2 className="lp-cta-text">Pronto para levar sua empresa<br />para o próximo nível?</h2>
          <div className="lp-cta-actions">
            <a href={WPP_LINK} target="_blank" rel="noreferrer" className="lp-btn lp-btn-primary" style={{ padding: '18px 44px', fontSize: 17 }}>
              Solicitar orçamento
            </a>
            <a href={WPP_LINK} target="_blank" rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', padding: '18px 44px', fontSize: 17, fontWeight: 700, color: 'rgba(255,255,255,0.7)', border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: 10, textDecoration: 'none', transition: 'all 0.2s', background: 'transparent' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}>
              Falar no WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ────────────────────────────────────────────── */}
      <footer id="contato" className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer-grid">
            <div>
              <div className="lp-footer-logo">
                <img src="https://i.imgur.com/jqwwNLv.png" alt="Magister Tech" />
              </div>
              <p className="lp-footer-desc">
                Especialistas em Engenharia de Software, Automação de Negócios B2B e Crescimento Digital com Inteligência Artificial.
              </p>
            </div>
            <div>
              <h5>Corporativo</h5>
              <ul>
                <li><a href="#solucoes">Nossos Serviços</a></li>
                <li><a href="#vantagens">Vantagens & Automações</a></li>
                <li><a href="#clientes">Parceiros B2B</a></li>
                <li><a href="#equipe">Quem Somos</a></li>
                <li><Link to="/login" style={{ color: 'inherit', textDecoration: 'none' }}>Administrativo</Link></li>
              </ul>
            </div>
            <div>
              <h5>Atendimento</h5>
              <ul>
                <li>Curitiba, PR — Brasil</li>
                <li>(41) 98722-5702</li>
                <li>atendimento@magistertech.com.br</li>
                <li>Suporte Remoto 24/7</li>
                <li><a href="https://instagram.com/magister_tech" target="_blank" rel="noreferrer">@magister_tech</a></li>
              </ul>
            </div>
          </div>
          <div className="lp-footer-bottom">
            © {new Date().getFullYear()} Magister Tech. Todos os direitos reservados. Tecnologia de Alto Nível.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
