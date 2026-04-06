#!/bin/bash
# =============================================================================
# MAGISTER TECH — SSL com Let's Encrypt (HTTPS)
# Uso: bash ssl.sh meudominio.com.br
# Pré-requisito: domínio já apontando para o IP desta VPS (DNS propagado)
# =============================================================================
set -e

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31d'; NC='\033[0m'
log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }

DOMAIN="$1"
[ -z "$DOMAIN" ] && err "Informe o domínio: bash ssl.sh meudominio.com.br"

# ─── Instalar Certbot ────────────────────────────────────────────────────────
if ! command -v certbot &>/dev/null; then
  log "Instalando Certbot..."
  apt-get install -y -qq certbot python3-certbot-nginx
fi

# ─── Atualizar config do Nginx com domínio ───────────────────────────────────
log "Atualizando Nginx para o domínio $DOMAIN..."
cat > /etc/nginx/sites-available/magister << NGINX_CONF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;

    access_log /var/log/nginx/magister_access.log;
    error_log  /var/log/nginx/magister_error.log;

    location / {
        proxy_pass         http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade \$http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host \$host;
        proxy_set_header   X-Real-IP \$remote_addr;
        proxy_set_header   X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        client_max_body_size 20M;
    }
}
NGINX_CONF

nginx -t && systemctl reload nginx

# ─── Obter certificado SSL ───────────────────────────────────────────────────
log "Obtendo certificado SSL para $DOMAIN..."
certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" \
  --non-interactive --agree-tos \
  --register-unsafely-without-email \
  --redirect

log "SSL ativado! Renovação automática configurada pelo Certbot."

# ─── Testar renovação ────────────────────────────────────────────────────────
certbot renew --dry-run 2>&1 | grep -E "success|failed" || true

echo ""
echo "════════════════════════════════════════════════════════"
log "HTTPS ativado!"
echo "  Acesse: https://$DOMAIN"
echo "════════════════════════════════════════════════════════"
