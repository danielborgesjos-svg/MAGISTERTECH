// Initialize Lucide Icons
lucide.createIcons();

// --- UI & ANIMATIONS ---

// Navbar Scroll Effect
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Intersection Observer for Scroll Animations
const observeElements = () => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    document.querySelectorAll('.fade-up').forEach(element => {
        observer.observe(element);
    });
};

// Smooth Scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if(targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if(targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 100,
                behavior: 'smooth'
            });
        }
    });
});

// --- RIMA IMÓVEIS DYNAMIC LOGIC ---

const API_BASE = '/api/rima';
let allImoveisStore = []; 

async function fetchProperties() {
    const grid = document.getElementById('property-grid');
    try {
        const res = await fetch(`${API_BASE}/imoveis`);
        allImoveisStore = await res.json();
        
        if (allImoveisStore.length === 0) {
            grid.innerHTML = '<p class="loading-state">Coleção em curadoria...</p>';
            return;
        }

        grid.innerHTML = allImoveisStore.map((i, idx) => `
            <div class="property-card fade-up" style="transition-delay: ${idx * 0.1}s">
                <div class="card-img-wrapper">
                    <img src="${i.imagem}" alt="${i.titulo}" loading="lazy">
                    <div class="card-tag">${i.tag}</div>
                </div>
                <div class="card-content">
                    <h3 class="card-title">${i.titulo}</h3>
                    <p class="card-location">${i.localizacao}</p>
                    <div class="card-features">
                        <span class="feature">
                            <span class="feature-val">${i.suites}</span>
                            <span class="feature-label">Suítes</span>
                        </span>
                        <span class="feature">
                            <span class="feature-val">${i.area}</span>
                            <span class="feature-label">m²</span>
                        </span>
                        <span class="feature">
                            <span class="feature-val">${i.vagas}</span>
                            <span class="feature-label">Vagas</span>
                        </span>
                    </div>
                    <div class="card-footer">
                        <span class="card-price">R$ ${i.preco.toLocaleString('pt-BR')}</span>
                        <button onclick="openPropertyModal('${i.id}')" class="btn-outline">Explorar</button>
                    </div>
                </div>
            </div>
        `).join('');
        
        observeElements();
        lucide.createIcons();
    } catch (error) {
        console.error("API Offline:", error);
    }
}

function openPropertyModal(id) {
    const imovel = allImoveisStore.find(i => i.id === id);
    if (!imovel) return;

    const modal = document.getElementById('property-modal');
    const content = document.getElementById('modal-content');

    content.innerHTML = `
        <div class="modal-img-wrapper">
            <img src="${imovel.imagem}" alt="${imovel.titulo}">
        </div>
        <div class="modal-info-col">
            <span class="hero-pre-title">Luxury Asset</span>
            <h2>${imovel.titulo}</h2>
            <p class="modal-location">${imovel.localizacao}</p>
            
            <div class="modal-specs">
                <div class="spec-item"><span class="spec-val">${imovel.suites}</span><span class="spec-label">Suítes Master</span></div>
                <div class="spec-item"><span class="spec-val">${imovel.area}m²</span><span class="spec-label">Área Privativa</span></div>
                <div class="spec-item"><span class="spec-val">${imovel.vagas}</span><span class="spec-label">Vagas</span></div>
            </div>

            <div class="modal-description mb-10">
                <p class="text-muted leading-relaxed font-light">
                    Uma joia rara da arquitetura contemporânea. Esta propriedade redefine o conceito de bem-viver, 
                    unindo materiais nobres, tecnologia de ponta e uma vista inigualável. Criada para quem não aceita nada menos que a perfeição.
                </p>
            </div>

            <p class="modal-price">R$ ${imovel.preco.toLocaleString('pt-BR')}</p>
            
            <div class="flex flex-col sm:flex-row gap-6 mt-10">
                <a href="https://wa.me/5511999999999?text=Interesse Exclusivo: ${imovel.titulo}" target="_blank" class="flex-1 bg-[#25d366] text-white py-5 px-8 font-bold text-center flex items-center justify-center gap-3 transition hover:brightness-110">
                    <i data-lucide="message-circle" class="w-5 h-5"></i> Agendar Private View
                </a>
                <button onclick="closePropertyModal(); document.getElementById('contato').scrollIntoView({behavior:'smooth'});" class="flex-1 btn-primary">
                    Protocolo de Interesse
                </button>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; 
    lucide.createIcons();
}

function closePropertyModal() {
    document.getElementById('property-modal').classList.add('hidden');
    document.body.style.overflow = '';
}

// Lead Capture
const leadForm = document.getElementById('lead-form');
if (leadForm) {
    leadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            nome: document.getElementById('lead-nome').value,
            email: document.getElementById('lead-email').value,
            telefone: document.getElementById('lead-tel').value,
            interesse: document.getElementById('lead-interesse').value
        };

        try {
            const res = await fetch(`${API_BASE}/leads`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert("Protocolo registrado. Um concierge especializado entrará em contato em breve.");
                leadForm.reset();
            }
        } catch (error) {
            alert("Erro na conexão segura. Tente novamente.");
        }
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchProperties();
    observeElements();
});
