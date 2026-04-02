import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Server, PieChart, ShieldCheck, Terminal, Code, ArrowRight, LayoutDashboard } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Landing.css';

const Landing = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="landing-page">
      {/* Header Corporativo */}
      <header className={`landing-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="container header-container">
          <a href="#" className="logo">
            <Terminal className="logo-icon" /> Magister Tech
          </a>
          
          <nav className="desktop-nav">
            <ul>
              <li><a href="#inicio">Início</a></li>
              <li><a href="#solucoes">Soluções</a></li>
              <li><a href="#sobre">Sobre Nós</a></li>
              <li><a href="#contato">Contato</a></li>
            </ul>
          </nav>

          <Link to="/admin" className="btn btn-primary portal-btn">
            Acessar Portal <LayoutDashboard size={18} />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section id="inicio" className="hero-section">
        <div className="hero-pattern"></div>
        <div className="container hero-content">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="hero-text"
          >
            <div className="hero-badge">Sistemas Inteligentes & Gestão Integrada</div>
            <h1 className="hero-title">
              Evolua a forma como sua empresa <span className="highlight">opera o futuro</span>.
            </h1>
            <p className="hero-description">
              A Magister Tech oferece terceirização de TI, desenvolvimento de sistemas corporativos (SaaS) e 
              consultoria técnica para alavancar a eficiência do seu negócio.
            </p>
            <div className="hero-actions">
              <a href="#solucoes" className="btn btn-primary btn-large">Explorar Soluções</a>
              <Link to="/admin" className="btn btn-outline btn-large">Conhecer Painel ERP</Link>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hero-image-wrapper"
          >
            <div className="hero-dashboard-mockup glass-panel">
              {/* Fake Dashboard Mockup */}
              <div className="mockup-header">
                <div className="mockup-dots"><span></span><span></span><span></span></div>
                <div className="mockup-title">magister-tech-erp.com</div>
              </div>
              <div className="mockup-body">
                <div className="mockup-sidebar"></div>
                <div className="mockup-content">
                  <div className="mockup-card line"></div>
                  <div className="mockup-row">
                     <div className="mockup-box"></div>
                     <div className="mockup-box"></div>
                     <div className="mockup-box"></div>
                  </div>
                  <div className="mockup-card graph"></div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Serviços Section */}
      <section id="solucoes" className="services-section">
        <div className="container">
          <div className="section-header text-center">
            <h2 className="section-title">Nossas Soluções</h2>
            <p className="section-subtitle">Tecnologia avançada para empresas modernas</p>
          </div>

          <div className="services-grid">
            <motion.div whileHover={{ y: -5 }} className="service-card glass-panel">
              <div className="service-icon-wrapper"><Server /></div>
              <h3>Infraestrutura de TI</h3>
              <p>Gerenciamento de redes, servidores, cloud e segurança em tempo integral para sua estabilidade.</p>
            </motion.div>

            <motion.div whileHover={{ y: -5 }} className="service-card glass-panel">
              <div className="service-icon-wrapper"><Code /></div>
              <h3>Sistemas e ERP</h3>
              <p>Desenvolvimento de plataformas web, aplicativos mobile e sistemas sob medida para o seu nicho.</p>
            </motion.div>

            <motion.div whileHover={{ y: -5 }} className="service-card glass-panel">
              <div className="service-icon-wrapper"><PieChart /></div>
              <h3>Marketing Data-Driven</h3>
              <p>Estratégias digitais com base em análise de dados, SEO avançado e automação de conversão.</p>
            </motion.div>

            <motion.div whileHover={{ y: -5 }} className="service-card glass-panel">
              <div className="service-icon-wrapper"><ShieldCheck /></div>
              <h3>Consultoria Técnica</h3>
              <p>Diagnósticos precisos para segurança da informação e auditoria de processos tecnológicos.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Portal CTA Section */}
      <section className="portal-cta">
        <div className="container portal-flex">
          <div className="portal-cta-info">
            <h2>Gestão Centralizada: <br/>O Novo Painel Magister</h2>
            <p>
              Agora clientes e colaboradores possuem uma área unificada. Acompanhe seus contratos, aprove designs, veja cronogramas no Kanban e acesse dashboards financeiros em tempo real.
            </p>
            <ul className="portal-features">
              <li><ArrowRight size={16}/> Controle de Acessos (Admin, Colaborador, Cliente)</li>
              <li><ArrowRight size={16}/> Kanban integrado (Estilo Trello) para projetos</li>
              <li><ArrowRight size={16}/> Central de Documentos e Faturamento</li>
            </ul>
            <Link to="/admin" className="btn btn-primary mt-4">Acessar Meu Painel</Link>
          </div>
          <div className="portal-cta-visual">
            {/* Abstraction of a Kanban */}
            <div className="kanban-mock glass-panel">
               <div className="k-col"><div className="k-header">A Fazer</div><div className="k-card"></div><div className="k-card"></div></div>
               <div className="k-col"><div className="k-header">Em Progresso</div><div className="k-card active"></div></div>
               <div className="k-col"><div className="k-header">Concluído</div><div className="k-card done"></div><div className="k-card done"></div></div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Minimalista */}
      <footer id="contato" className="landing-footer">
        <div className="container footer-flex">
          <div className="footer-brand">
             <div className="logo"><Terminal size={24}/> Magister Tech</div>
             <p className="mt-4 text-muted">A tecnologia que eleva seu negócio a um novo padrão corporativo.</p>
          </div>
          <div className="footer-links">
             <h4>Contato</h4>
             <ul>
               <li>atendimento@magistertech.com.br</li>
               <li>(41) 98722-5702</li>
               <li>Curitiba, PR</li>
             </ul>
          </div>
        </div>
        <div className="container copyright text-center text-muted">
          &copy; 2026 Magister Tech. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
};

export default Landing;
