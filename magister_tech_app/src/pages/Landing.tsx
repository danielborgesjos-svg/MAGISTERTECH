import { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Code, Zap, Globe, TrendingUp, 
  Target, Star, Brain, CheckCircle2, ShieldCheck, Server, Headset
} from 'lucide-react';
import { DataContext } from '../contexts/DataContext';
import './Landing.css';

const WPP_LINK = "https://wa.me/5541987225702?text=Olá!%20Gostaria%20de%20solicitar%20um%20orçamento%20para%20minha%20empresa.";

const Landing = () => {
  const [scrolled, setScrolled] = useState(false);
  const { team, clients } = useContext(DataContext); // Cérebro do ERP plugado na Landing Page!

  useEffect(() => {
    document.body.classList.remove('dark-mode');
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Início', href: '#inicio' },
    { name: 'Soluções', href: '#solucoes' },
    { name: 'Vantagens', href: '#vantagens' },
    { name: 'Clientes', href: '#clientes' },
    { name: 'Equipe', href: '#equipe' },
  ];

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const stagger = {
    hidden: { opacity: 0 },
    visible: { transition: { staggerChildren: 0.1 } }
  };

  // Ícones dinâmicos para a renderização da equipe
  const getRoleIcon = (role: string) => {
    const lower = role.toLowerCase();
    if (lower.includes('ceo') || lower.includes('diretor')) return Brain;
    if (lower.includes('comercial') || lower.includes('vendas')) return Target;
    if (lower.includes('design') || lower.includes('arte')) return Star;
    if (lower.includes('dev') || lower.includes('sistema')) return Code;
    if (lower.includes('mídia') || lower.includes('marketing')) return TrendingUp;
    return Zap;
  };

  return (
    <div className="lp-wrapper">
      {/* ─── HEADER ────────────────────────────────────────────────────────── */}
      <header className={`lp-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="lp-container lp-header-content">
          <Link to="/" className="lp-logo">
            <img src="https://i.imgur.com/jqwwNLv.png" alt="Magister Tech" />
          </Link>

          <nav className="lp-nav">
            {navLinks.map((link) => (
              <a key={link.name} href={link.href}>{link.name}</a>
            ))}
          </nav>
          
          <div className="lp-header-actions" style={{ display: 'flex' }}>
            <Link to="/login" className="lp-btn lp-btn-ghost">
              Menu Restrito
            </Link>
            <a href={WPP_LINK} target="_blank" rel="noreferrer" className="lp-btn lp-btn-primary">
              Solicitar orçamento
            </a>
          </div>
        </div>
      </header>

      {/* ─── HERO SECTION ──────────────────────────────────────────────────── */}
      <section id="inicio" className="lp-hero">
        <div className="lp-hero-bg">
          <div className="lp-hero-glow-1" />
          <div className="lp-hero-glow-2" />
        </div>
        
        <div className="lp-container lp-hero-content">
          <motion.div 
            className="lp-hero-text"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
          >
            <div className="lp-badge">Especialistas em IA & Automação</div>
            <h1 className="lp-h1">
              Especialistas em sistemas, automação e <span className="lp-text-gradient">crescimento digital</span> para empresas.
            </h1>
            <p className="lp-p" style={{ fontSize: 20 }}>
              Transformamos processos manuais em soluções digitais inteligentes que aumentam produtividade, 
              reduzem custos e aceleram o crescimento da sua empresa.
            </p>
            <div className="lp-hero-actions">
              <a href={WPP_LINK} target="_blank" rel="noreferrer" className="lp-btn lp-btn-primary" style={{ padding: '16px 32px', fontSize: 16 }}>
                Solicitar orçamento
              </a>
              <a href={WPP_LINK} target="_blank" rel="noreferrer" className="lp-btn lp-btn-secondary" style={{ padding: '16px 32px', fontSize: 16 }}>
                Falar no WhatsApp
              </a>
            </div>
          </motion.div>

          <motion.div 
            className="lp-hero-visual"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* Mockup Premium Saas */}
            <div className="lp-mockup-wrapper">
              <div className="lp-mockup-screen">
                <div className="lp-fake-dash">
                  <div className="lp-fake-nav">
                    <div style={{ display: 'flex', gap: 6 }}>
                      <div className="lp-fake-dot" style={{ background: '#FF5F56' }}/>
                      <div className="lp-fake-dot" style={{ background: '#FFBD2E' }}/>
                      <div className="lp-fake-dot" style={{ background: '#27C93F' }}/>
                    </div>
                  </div>
                  <div className="lp-fake-body">
                    <div className="lp-fake-sidebar">
                      <div className="lp-fake-line" style={{ width: '80%' }} />
                      <div className="lp-fake-line" style={{ width: '60%' }} />
                      <div className="lp-fake-line" style={{ width: '70%' }} />
                    </div>
                    <div className="lp-fake-main">
                      <div className="lp-fake-cards">
                         <div className="lp-fake-card" />
                         <div className="lp-fake-card" />
                      </div>
                      <div className="lp-fake-big-card" style={{ background: 'linear-gradient(to right, #F8FAFC, #FFFFFF)' }}/>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── NOSSOS SERVIÇOS ────────────────────────────────────────────────── */}
      <section id="solucoes" className="lp-services">
        <div className="lp-container">
          <div className="lp-section-header">
            <h2 className="lp-h2">Nossos Serviços</h2>
            <p className="lp-p">Infraestrutura corporativa desenvolvida para máxima escala e performance.</p>
          </div>

          <motion.div 
            className="lp-grid-4"
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={fadeUp} className="lp-service-card">
              <div className="lp-icon-wrap"><Server size={24} /></div>
              <h4>Terceirização de TI</h4>
              <p>Equipe dedicada para suporte técnico, redes, backups, segurança e infraestrutura de TI sob demanda, garantindo a continuidade dos seus negócios.</p>
              <a href={WPP_LINK} target="_blank" rel="noreferrer" className="lp-btn-ghost" style={{ marginTop: 'auto', paddingTop: 16, fontWeight: 600 }}>Saiba mais →</a>
            </motion.div>
            
            <motion.div variants={fadeUp} className="lp-service-card">
              <div className="lp-icon-wrap"><Code size={24} /></div>
              <h4>Desenvolvimento de Sistemas</h4>
              <p>Aplicações web, sistemas sob medida, aplicativos mobile e automação de processos empresariais com tecnologias modernas e escaláveis.</p>
              <a href={WPP_LINK} target="_blank" rel="noreferrer" className="lp-btn-ghost" style={{ marginTop: 'auto', paddingTop: 16, fontWeight: 600 }}>Saiba mais →</a>
            </motion.div>
            
            <motion.div variants={fadeUp} className="lp-service-card">
              <div className="lp-icon-wrap"><TrendingUp size={24} /></div>
              <h4>Marketing Digital</h4>
              <p>Estratégias digitais completas para aumentar sua presença online, gerar leads e converter vendas através de canais digitais.</p>
              <a href={WPP_LINK} target="_blank" rel="noreferrer" className="lp-btn-ghost" style={{ marginTop: 'auto', paddingTop: 16, fontWeight: 600 }}>Saiba mais →</a>
            </motion.div>
            
            <motion.div variants={fadeUp} className="lp-service-card">
              <div className="lp-icon-wrap"><ShieldCheck size={24} /></div>
              <h4>Consultoria e Auditoria</h4>
              <p>Diagnóstico de TI, mapeamento de riscos e definição de estratégias com foco em escalabilidade, segurança e inovação tecnológica.</p>
              <a href={WPP_LINK} target="_blank" rel="noreferrer" className="lp-btn-ghost" style={{ marginTop: 'auto', paddingTop: 16, fontWeight: 600 }}>Saiba mais →</a>
            </motion.div>

            <motion.div variants={fadeUp} className="lp-service-card">
              <div className="lp-icon-wrap"><Headset size={24} /></div>
              <h4>Suporte 24/7</h4>
              <p>Monitoramento contínuo dos seus serviços com suporte técnico remoto e presencial quando necessário, garantindo máxima disponibilidade.</p>
              <a href={WPP_LINK} target="_blank" rel="noreferrer" className="lp-btn-ghost" style={{ marginTop: 'auto', paddingTop: 16, fontWeight: 600 }}>Saiba mais →</a>
            </motion.div>

            <motion.div variants={fadeUp} className="lp-service-card">
              <div className="lp-icon-wrap"><Globe size={24} /></div>
              <h4>Sites WordPress</h4>
              <p>Desenvolvimento de sites profissionais com WordPress, rápidos, seguros e otimizados para SEO, com design personalizado para seu negócio.</p>
              <a href={WPP_LINK} target="_blank" rel="noreferrer" className="lp-btn-ghost" style={{ marginTop: 'auto', paddingTop: 16, fontWeight: 600 }}>Saiba mais →</a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── VANTAGENS EM CONTRATAR ────────────────────────────────────────── */}
      <section id="vantagens" className="lp-diferenciais">
        <div className="lp-container">
          <div className="lp-section-header" style={{ marginBottom: 40 }}>
            <h2 className="lp-h2">Vantagens em Contratar Nossos Serviços</h2>
            <p className="lp-p">Projetos estruturados sob demanda para transformar seu fluxo de negócios.</p>
          </div>

          <div className="lp-grid-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
             <div className="lp-service-card" style={{ background: 'transparent' }}>
               <h4 style={{ color: 'var(--lp-indigo)'}}>Criação de Sites e Sistemas</h4>
               <p style={{ marginBottom: 16 }}>Desenvolvimento de sites institucionais, sistemas personalizados e plataformas web com tecnologia de ponta.</p>
               <a href={WPP_LINK} target="_blank" rel="noreferrer" className="lp-btn lp-btn-secondary" style={{ marginTop: 'auto' }}>Solicitar Orçamento</a>
             </div>
             
             <div className="lp-service-card" style={{ background: 'transparent' }}>
               <h4 style={{ color: 'var(--lp-indigo)'}}>Lojas Virtuais</h4>
               <p style={{ marginBottom: 16 }}>E-commerces completos com integração a gateways de pagamento e gestão de produtos escalável.</p>
               <a href={WPP_LINK} target="_blank" rel="noreferrer" className="lp-btn lp-btn-secondary" style={{ marginTop: 'auto' }}>Solicitar Orçamento</a>
             </div>

             <div className="lp-service-card" style={{ background: 'transparent' }}>
               <h4 style={{ color: 'var(--lp-indigo)'}}>Marketing e Impulsionamento</h4>
               <p style={{ marginBottom: 16 }}>Gestão de anúncios no Mercado Livre, Shopee, Magalu e outras plataformas de alto volume para aumentar vendas.</p>
               <a href={WPP_LINK} target="_blank" rel="noreferrer" className="lp-btn lp-btn-secondary" style={{ marginTop: 'auto' }}>Planos sob medida</a>
             </div>

             <div className="lp-service-card" style={{ background: 'transparent' }}>
               <h4 style={{ color: 'var(--lp-indigo)'}}>Integração de Sistemas</h4>
               <p style={{ marginBottom: 16 }}>Conectamos seus sistemas com marketplaces, ERPs e outras plataformas para automatizar processos via API.</p>
               <a href={WPP_LINK} target="_blank" rel="noreferrer" className="lp-btn lp-btn-secondary" style={{ marginTop: 'auto' }}>Sob consulta</a>
             </div>

             <div className="lp-service-card" style={{ background: 'transparent' }}>
               <h4 style={{ color: 'var(--lp-indigo)'}}>Automação de Processos</h4>
               <p style={{ marginBottom: 16 }}>Automatizamos processos manuais repetitivos para aumentar severamente a eficiência e reduzir custos operacionais.</p>
               <a href={WPP_LINK} target="_blank" rel="noreferrer" className="lp-btn lp-btn-secondary" style={{ marginTop: 'auto' }}>Sob consulta</a>
             </div>

             <div className="lp-service-card" style={{ background: 'transparent' }}>
               <h4 style={{ color: 'var(--lp-indigo)'}}>Landing Pages</h4>
               <p style={{ marginBottom: 16 }}>Páginas de conversão otimizadas para capturar leads agressivamente e impulsionar suas campanhas de tráfego.</p>
               <a href={WPP_LINK} target="_blank" rel="noreferrer" className="lp-btn lp-btn-secondary" style={{ marginTop: 'auto' }}>Solicitar Agora</a>
             </div>
          </div>
        </div>
      </section>

      {/* ─── IMPACT SECTION ────────────────────────────────────────────────── */}
      <section className="lp-impact">
        <div className="lp-container">
          <motion.h2 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="lp-impact-text"
          >
            &ldquo;Empresas que não automatizam <span className="lp-text-gradient">ficam para trás.</span>&rdquo;
          </motion.h2>
        </div>
      </section>

      {/* ─── CLIENTES ──────────────────────────────────────────────────────── */}
      {clients && clients.length > 0 && (
        <section id="clientes" className="lp-clients">
          <div className="lp-container">
            <div className="lp-section-header" style={{ marginBottom: 40 }}>
              <h2 className="lp-h2">Empresas que já atendemos</h2>
              <p className="lp-p">A confiança que o mercado deposita na Magister Tech.</p>
            </div>
            
            <div className="lp-clients-track">
              {clients.filter(c => c.status === 'ativo').map(client => (
                <div key={client.id} className="lp-client-badge">
                  {client.company || client.name}
                </div>
              ))}
              {/* Fallbacks visuais se tiver poucos clientes renderizados via state */}
              {clients.filter(c => c.status === 'ativo').length < 3 && (
                 <>
                   <div className="lp-client-badge">ELETROC</div>
                   <div className="lp-client-badge">AFPINTURAS</div>
                   <div className="lp-client-badge">CINEPASSE</div>
                 </>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ─── EQUIPE ────────────────────────────────────────────────────────── */}
      <section id="equipe" className="lp-team">
        <div className="lp-container">
          <div className="lp-section-header">
            <h2 className="lp-h2">Quem Lidera a Tecnologia</h2>
            <p className="lp-p">O ecossistema tático do seu projeto. Dados integrados diretamente do nosso Painel Administrativo.</p>
          </div>

          <motion.div 
            className="lp-team-grid"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {team.map((member) => {
              const Icon = getRoleIcon(member.role || member.sector);
              return (
                <motion.div key={member.id} variants={fadeUp} className="lp-team-card">
                  <div className="lp-avatar">
                     {/* Se tivesse foto usaria <img>, senão usa a Iniciai ou Ícone */}
                     {member.initials || <Icon size={32} />}
                  </div>
                  <h4 className="lp-team-name">{member.name}</h4>
                  <div className="lp-team-role">{member.role} {member.sector && <span style={{ opacity: 0.6 }}>| {member.sector}</span>}</div>
                  <p style={{ fontSize: 13, marginTop: 12, color: 'var(--lp-text-sec)'}}>
                    SLA e Alta Fidelidade em Entregas.
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ─── CTA FINAL ─────────────────────────────────────────────────────── */}
      <section className="lp-cta-section">
        <div className="lp-container">
          <h2 className="lp-cta-text">Pronto para levar sua empresa<br/>para o próximo nível?</h2>
          <div className="lp-cta-actions">
            <a href={WPP_LINK} target="_blank" rel="noreferrer" className="lp-btn lp-btn-secondary" style={{ padding: '18px 40px', fontSize: 18 }}>
              Solicitar orçamento
            </a>
            <a href={WPP_LINK} target="_blank" rel="noreferrer" className="lp-btn lp-btn-ghost" style={{ padding: '18px 40px', fontSize: 18, color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}>
              Falar no WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ─── FOOTER DINÂMICO ───────────────────────────────────────────────── */}
      <footer id="contato" className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer-grid">
            <div className="lp-footer-brand">
              <div className="lp-footer-logo">
                {/* Logo Branca ou com alto contraste para Footer escuro */}
                <img src="https://i.imgur.com/jqwwNLv.png" alt="Magister Tech" style={{ filter: 'brightness(0) invert(1) opacity(0.9)' }}/>
              </div>
              <p className="lp-footer-desc">
                Engenharia de Software, Cloud Computing e Automação de Negócios B2B com Inteligência Artificial e Escalabilidade global.
              </p>
            </div>
            
            <div className="lp-footer-links">
              <h5>Corporativo</h5>
              <ul>
                <li><a href="#solucoes" style={{color: 'inherit', textDecoration: 'none'}}>Nossos Serviços</a></li>
                <li><a href="#vantagens" style={{color: 'inherit', textDecoration: 'none'}}>Vantagens & Automações</a></li>
                <li><a href="#clientes" style={{color: 'inherit', textDecoration: 'none'}}>Parceiros B2B</a></li>
                <li><a href="#equipe" style={{color: 'inherit', textDecoration: 'none'}}>Quem Somos</a></li>
                <li><Link to="/login" style={{color: 'inherit', textDecoration: 'none'}}>Administrativo (ERP)</Link></li>
              </ul>
            </div>
            
            <div className="lp-footer-links">
              <h5>Atendimento</h5>
              <ul>
                <li>Curitiba, PR - Brasil</li>
                <li>(41) 98722-5702</li>
                <li>atendimento@magistertech.com.br</li>
                <li>Suporte Remoto 24/7</li>
              </ul>
            </div>
          </div>
          
          <div className="lp-footer-bottom">
            &copy; {new Date().getFullYear()} Magister Tech. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
