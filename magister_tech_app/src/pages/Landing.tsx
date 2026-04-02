import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Code, Zap, Globe, TrendingUp, 
  Target, Star, Brain, CheckCircle2 
} from 'lucide-react';
import './Landing.css';

const WPP_LINK = "https://wa.me/5541987225702?text=Olá!%20Gostaria%20de%20solicitar%20um%20orçamento%20para%20minha%20empresa.";

const Landing = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // Força a remoção de classes dark-mode caso venham do cache ERP
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
    { name: 'Diferenciais', href: '#diferenciais' },
    { name: 'Cases', href: '#cases' },
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

  return (
    <div className="lp-wrapper">
      {/* ─── HEADER ────────────────────────────────────────────────────────── */}
      <header className={`lp-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="lp-container lp-header-content">
          {/* Logo Oficial */}
          <Link to="/" className="lp-logo">
            <img src="https://i.imgur.com/jqwwNLv.png" alt="Magister Tech" />
          </Link>

          {/* Desktop Nav */}
          <nav className="lp-nav">
            {navLinks.map((link) => (
              <a key={link.name} href={link.href}>{link.name}</a>
            ))}
          </nav>

          {/* Ações Desktop */}
          <div className="lp-header-actions" style={{ display: 'none' }}>
             {/* Hidden in mobile */}
          </div>
          
          <div className="lp-header-actions" style={{ display: 'flex' }}>
            <Link to="/login" className="lp-btn lp-btn-ghost">
              Acesso Cliente
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
            <div className="lp-badge">Evolução Digital Exclusiva</div>
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
                      <div className="lp-fake-big-card" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
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

      {/* ─── SERVIÇOS ──────────────────────────────────────────────────────── */}
      <section id="solucoes" className="lp-services">
        <div className="lp-container">
          <div className="lp-section-header">
            <h2 className="lp-h2">Nossas Soluções</h2>
            <p className="lp-p">A tecnologia certa transforma a forma como sua empresa cresce e opera no cenário global.</p>
          </div>

          <motion.div 
            className="lp-grid-4"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {/* 1 */}
            <motion.div variants={fadeUp} className="lp-service-card">
              <div className="lp-icon-wrap"><Code size={24} /></div>
              <h4>Sistemas personalizados</h4>
              <p>Criamos soluções sob medida, exclusivas para a sua lógica de negócio, visando automatizar e organizar sua operação.</p>
            </motion.div>
            
            {/* 2 */}
            <motion.div variants={fadeUp} className="lp-service-card">
              <div className="lp-icon-wrap"><Zap size={24} /></div>
              <h4>Automação de processos</h4>
              <p>Reduza drasticamente tarefas manuais, integre softwares distantes e aumente a eficiência liquída do seu time.</p>
            </motion.div>
            
            {/* 3 */}
            <motion.div variants={fadeUp} className="lp-service-card">
              <div className="lp-icon-wrap"><Globe size={24} /></div>
              <h4>Sites e landing pages</h4>
              <p>Presença digital esteticamente profissional, veloz e otimizada que gera confiança e atrai os clientes certos.</p>
            </motion.div>
            
            {/* 4 */}
            <motion.div variants={fadeUp} className="lp-service-card">
              <div className="lp-icon-wrap"><TrendingUp size={24} /></div>
              <h4>Crescimento digital</h4>
              <p>Estratégias para escalar sua empresa com tráfego pago, análise de dados de funil e consultoria em tecnologia.</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── DIFERENCIAIS & PROVAS SOCIAIS ─────────────────────────────────── */}
      <section id="diferenciais" className="lp-diferenciais">
        <div className="lp-container">
          <div className="lp-section-header" style={{ marginBottom: 40 }}>
            <h2 className="lp-h2">Diferenciais Competitivos</h2>
            <p className="lp-p">Por que empresas maduras escolhem a Magister Tech.</p>
          </div>

          <div className="lp-feat-list">
            <div className="lp-feat-item"><CheckCircle2 className="lp-feat-icon" size={20}/> Foco em resultado real</div>
            <div className="lp-feat-item"><CheckCircle2 className="lp-feat-icon" size={20}/> Soluções personalizadas</div>
            <div className="lp-feat-item"><CheckCircle2 className="lp-feat-icon" size={20}/> Atendimento rápido (SLA)</div>
            <div className="lp-feat-item"><CheckCircle2 className="lp-feat-icon" size={20}/> Tecnologia de última geração</div>
            <div className="lp-feat-item"><CheckCircle2 className="lp-feat-icon" size={20}/> Experiência prática SaaS</div>
            <div className="lp-feat-item"><CheckCircle2 className="lp-feat-icon" size={20}/> Visão de negócio estratégica</div>
          </div>

          <div id="cases" className="lp-stats">
            <div className="lp-stat-box">
              <div className="lp-stat-num">+80</div>
              <div className="lp-stat-label">Projetos entregues</div>
            </div>
            <div className="lp-stat-box">
              <div className="lp-stat-num">+50</div>
              <div className="lp-stat-label">Clientes satisfeitos</div>
            </div>
            <div className="lp-stat-box">
              <div className="lp-stat-num">99%</div>
              <div className="lp-stat-label">Taxa de Aprovação</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── EQUIPE ────────────────────────────────────────────────────────── */}
      <section id="equipe" className="lp-team">
        <div className="lp-container">
          <div className="lp-section-header">
            <h2 className="lp-h2">Quem Lidera a Tecnologia</h2>
            <p className="lp-p">O cérebro estratégico e técnico por trás de cada entrega de alto nível.</p>
          </div>

          <motion.div 
            className="lp-team-grid"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[
              { name: 'Daniel', role: 'CEO', icon: Brain },
              { name: 'Ester Ferreira', role: 'Comercial & Estratégia', icon: Target },
              { name: 'Cristiano Ferreira', role: 'Designer & Audiovisual', icon: Star },
              { name: 'Gustavo', role: 'Designer Gráfico', icon: Globe },
              { name: 'Lívia', role: 'Mídias Sociais', icon: TrendingUp },
              { name: 'Lucas Larroca', role: 'Desenvolvedor Full Stack', icon: Code },
            ].map((member) => (
              <motion.div key={member.name} variants={fadeUp} className="lp-team-card">
                <div className="lp-avatar">
                   <member.icon size={32} />
                </div>
                <h4 className="lp-team-name">{member.name}</h4>
                <div className="lp-team-role">{member.role}</div>
              </motion.div>
            ))}
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
            <a href={WPP_LINK} target="_blank" rel="noreferrer" className="lp-btn lp-btn-ghost" style={{ padding: '18px 40px', fontSize: 18, color: '#fff' }}>
              Falar no WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ────────────────────────────────────────────────────────── */}
      <footer id="contato" className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer-grid">
            <div className="lp-footer-brand">
              <div className="lp-footer-logo">
                <img src="https://i.imgur.com/jqwwNLv.png" alt="Magister Tech" style={{ filter: 'grayscale(100%) opacity(0.8)' }}/>
              </div>
              <p className="lp-footer-desc">
                Especialistas em sistemas, automação e crescimento digital para empresas consolidadas.
              </p>
            </div>
            
            <div className="lp-footer-links">
              <h5>Magister Tech</h5>
              <ul>
                <li><a href="#solucoes" style={{color: 'inherit', textDecoration: 'none'}}>Soluções</a></li>
                <li><a href="#cases" style={{color: 'inherit', textDecoration: 'none'}}>Cases</a></li>
                <li><a href="#equipe" style={{color: 'inherit', textDecoration: 'none'}}>Nossa Equipe</a></li>
              </ul>
            </div>
            
            <div className="lp-footer-links">
              <h5>Contato Direto</h5>
              <ul>
                <li>Curitiba, PR - Brasil</li>
                <li>(41) 98722-5702</li>
                <li>atendimento@magistertech.com.br</li>
              </ul>
            </div>
          </div>
          
          <div className="lp-footer-bottom">
            &copy; {new Date().getFullYear()} Magister Tech. Todos os direitos reservados. Tecnologias de Alto Nível.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
