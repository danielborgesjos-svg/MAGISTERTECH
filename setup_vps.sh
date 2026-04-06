#!/bin/bash
# =============================================================================
# MAGISTER TECH — Setup inicial da VPS
# Testado: Ubuntu 22.04 / 24.04 LTS — Hostinger
# Execute UMA VEZ como root:  bash setup_vps.sh
# =============================================================================
set -e
export DEBIAN_FRONTEND=noninteractive

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; BLUE='\033[0;34m'; NC='\033[0m'
log()   { echo -e "${GREEN}[✓]${NC} $1"; }
info()  { echo -e "${BLUE}[→]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
err()   { echo -e "${RED}[✗]${NC} $1"; exit 1; }

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     MAGISTER TECH — VPS Setup Hostinger     ║${NC}"
echo -e "${BLUE}║       Ubuntu 24.04 · Brazil Campinas        ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo ""

APP_DIR="/opt/magister"

# ─── 1. Atualizar sistema ─────────────────────────────────────────────────────
info "Atualizando pacotes do sistema..."
apt-get update -qq
apt-get upgrade -y -qq -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold"
log "Sistema atualizado."

# ─── 2. Instalar dependências base ───────────────────────────────────────────
info "Instalando dependências base..."
apt-get install -y -qq \
  curl git nginx ufw openssl \
  ca-certificates gnupg lsb-release \
  build-essential
log "Dependências instaladas."

# ─── 3. Node.js 20 LTS via NodeSource ────────────────────────────────────────
if ! command -v node &>/dev/null || [[ "$(node --version 2>/dev/null)" != v20* ]]; then
  info "Instalando Node.js 20 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null 2>&1
  apt-get install -y -qq nodejs
  log "Node.js $(node --version) instalado."
else
  log "Node.js já OK: $(node --version)"
fi

# ─── 4. PM2 ──────────────────────────────────────────────────────────────────
if ! command -v pm2 &>/dev/null; then
  info "Instalando PM2..."
  npm install -g pm2 --silent
  pm2 startup systemd -u root --hp /root 2>/dev/null | grep -v "^\[PM2\]" | bash 2>/dev/null || true
  log "PM2 $(pm2 --version) instalado."
else
  log "PM2 já OK: $(pm2 --version)"
fi

# ─── 5. Criar diretório da aplicação ─────────────────────────────────────────
mkdir -p "$APP_DIR"
log "Diretório $APP_DIR pronto."

# ─── 6. Firewall UFW ─────────────────────────────────────────────────────────
info "Configurando UFW..."
ufw default deny incoming  >/dev/null 2>&1 || true
ufw default allow outgoing >/dev/null 2>&1 || true
ufw allow OpenSSH          >/dev/null 2>&1 || true
ufw allow 'Nginx Full'     >/dev/null 2>&1 || true
ufw --force enable         >/dev/null 2>&1 || true
log "Firewall: SSH + HTTP/HTTPS liberados."

# ─── 7. Nginx como reverse proxy ─────────────────────────────────────────────
info "Configurando Nginx → Express :3001..."
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

cat > /etc/nginx/sites-available/magister << 'NGINX_EOF'
server {
    listen 80;
    listen [::]:80;
    server_name _;

    access_log /var/log/nginx/magister_access.log;
    error_log  /var/log/nginx/magister_error.log warn;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Uploads (PDFs, imagens de contrato)
    client_max_body_size 20M;

    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout    60s;
    proxy_read_timeout    60s;

    location / {
        proxy_pass         http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Cache de assets estáticos buildados pelo Vite
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2|woff|ttf)$ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
}
NGINX_EOF

ln -sf /etc/nginx/sites-available/magister /etc/nginx/sites-enabled/magister
nginx -t
systemctl enable nginx >/dev/null 2>&1 || true
systemctl restart nginx
log "Nginx configurado e rodando."

# ─── 8. Resumo ───────────────────────────────────────────────────────────────
VPS_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          Setup CONCLUÍDO com sucesso!        ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  Node.js : $(node --version)"
echo -e "  NPM     : $(npm --version)"
echo -e "  PM2     : $(pm2 --version)"
echo -e "  Nginx   : $(nginx -v 2>&1 | grep -o '[0-9.]*' | head -1)"
echo ""
warn "PRÓXIMO PASSO — rode o deploy:"
echo ""
echo -e "  ${BLUE}cd $APP_DIR && bash deploy.sh${NC}"
echo ""
