#!/bin/bash
# =============================================================================
# MAGISTER TECH — Setup inicial da VPS (Ubuntu 20.04 / 22.04)
# Execute UMA VEZ na VPS como root:  bash setup_vps.sh
# =============================================================================
set -e

# ─── Cores ───────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }

echo ""
echo "  ███╗   ███╗ █████╗  ██████╗ ██╗███████╗████████╗███████╗██████╗ "
echo "  ████╗ ████║██╔══██╗██╔════╝ ██║██╔════╝╚══██╔══╝██╔════╝██╔══██╗"
echo "  ██╔████╔██║███████║██║  ███╗██║███████╗   ██║   █████╗  ██████╔╝"
echo "  ██║╚██╔╝██║██╔══██║██║   ██║██║╚════██║   ██║   ██╔══╝  ██╔══██╗"
echo "  ██║ ╚═╝ ██║██║  ██║╚██████╔╝██║███████║   ██║   ███████╗██║  ██║"
echo "  ╚═╝     ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝╚══════╝   ╚═╝   ╚══════╝╚═╝  ╚═╝"
echo "                        VPS Setup — ERP System"
echo ""

# ─── Variáveis ────────────────────────────────────────────────────────────────
APP_DIR="/opt/magister"
NODE_VERSION="20"

# ─── 1. Atualizar sistema ─────────────────────────────────────────────────────
log "Atualizando sistema..."
apt-get update -qq && apt-get upgrade -y -qq

# ─── 2. Instalar dependências ─────────────────────────────────────────────────
log "Instalando dependências base..."
apt-get install -y -qq curl git nginx ufw openssl

# ─── 3. Instalar Node.js 20 LTS via NodeSource ───────────────────────────────
if ! command -v node &>/dev/null || [[ "$(node -v)" != v20* ]]; then
  log "Instalando Node.js $NODE_VERSION LTS..."
  curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
  apt-get install -y -qq nodejs
else
  log "Node.js já instalado: $(node -v)"
fi

# ─── 4. Instalar PM2 ─────────────────────────────────────────────────────────
if ! command -v pm2 &>/dev/null; then
  log "Instalando PM2..."
  npm install -g pm2 --silent
  pm2 startup systemd -u root --hp /root | tail -1 | bash || true
else
  log "PM2 já instalado: $(pm2 --version)"
fi

# ─── 5. Criar diretório da aplicação ─────────────────────────────────────────
log "Criando $APP_DIR..."
mkdir -p "$APP_DIR"

# ─── 6. Configurar Firewall ───────────────────────────────────────────────────
log "Configurando UFW..."
ufw allow OpenSSH  >/dev/null 2>&1 || true
ufw allow 'Nginx Full' >/dev/null 2>&1 || true
ufw --force enable >/dev/null 2>&1 || true

# ─── 7. Configurar Nginx ─────────────────────────────────────────────────────
log "Configurando Nginx como reverse proxy..."
rm -f /etc/nginx/sites-enabled/default

cat > /etc/nginx/sites-available/magister << 'NGINX_CONF'
server {
    listen 80;
    listen [::]:80;
    server_name _;

    # Logs
    access_log /var/log/nginx/magister_access.log;
    error_log  /var/log/nginx/magister_error.log;

    # Aumentar timeout para uploads/requisições longas
    proxy_connect_timeout       60s;
    proxy_send_timeout          60s;
    proxy_read_timeout          60s;

    # Tamanho máximo de upload (ex: PDFs de contratos)
    client_max_body_size 20M;

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
}
NGINX_CONF

ln -sf /etc/nginx/sites-available/magister /etc/nginx/sites-enabled/magister
nginx -t && systemctl reload nginx
log "Nginx configurado: porta 80 → Express :3001"

# ─── 8. Mensagem final ────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════════════"
log "Setup inicial CONCLUÍDO!"
echo ""
warn "PRÓXIMOS PASSOS:"
echo "  1. Copie o código para $APP_DIR"
echo "     git clone <repo> $APP_DIR  OU  copie manualmente"
echo ""
echo "  2. Rode o script de deploy:"
echo "     cd $APP_DIR && bash deploy.sh"
echo ""
echo "  3. (Opcional) Adicionar domínio + HTTPS:"
echo "     bash ssl.sh SEU_DOMINIO"
echo "════════════════════════════════════════════════════════"
