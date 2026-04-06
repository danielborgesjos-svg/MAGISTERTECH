#!/bin/bash
# =============================================================================
# Cole este script INTEIRO no terminal da VPS (Hostinger Browser Terminal)
# Faz tudo: instala dependências, Node, PM2, Nginx, clona e sobe o sistema
# =============================================================================
set -e
export DEBIAN_FRONTEND=noninteractive

# ─── Adiciona chave SSH da máquina local (para acesso futuro sem senha) ───────
mkdir -p ~/.ssh && chmod 700 ~/.ssh
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIMU77CoXKpgi6ORs+4G1TWWy3dbwdqXux+gSELuAOIxJ magister-deploy" >> ~/.ssh/authorized_keys
sort -u ~/.ssh/authorized_keys -o ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
echo "[✓] Chave SSH instalada"

# ─── Atualizar sistema ────────────────────────────────────────────────────────
echo "[→] Atualizando sistema..."
apt-get update -qq
apt-get upgrade -y -qq -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold"

# ─── Dependências ─────────────────────────────────────────────────────────────
apt-get install -y -qq curl git nginx ufw openssl build-essential rsync

# ─── Node.js 20 LTS ──────────────────────────────────────────────────────────
echo "[→] Instalando Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null 2>&1
apt-get install -y -qq nodejs
echo "[✓] Node.js $(node --version)"

# ─── PM2 ──────────────────────────────────────────────────────────────────────
npm install -g pm2 --silent
pm2 startup systemd -u root --hp /root 2>/dev/null | grep "^systemctl" | bash 2>/dev/null || true
echo "[✓] PM2 $(pm2 --version)"

# ─── Nginx ────────────────────────────────────────────────────────────────────
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
cat > /etc/nginx/sites-available/magister << 'NGINX'
server {
    listen 80; listen [::]:80; server_name _;
    access_log /var/log/nginx/magister.log;
    client_max_body_size 20M;
    gzip on; gzip_types text/plain text/css application/json application/javascript;
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX
ln -sf /etc/nginx/sites-available/magister /etc/nginx/sites-enabled/magister
nginx -t && systemctl enable nginx && systemctl restart nginx
echo "[✓] Nginx configurado"

# ─── Firewall ─────────────────────────────────────────────────────────────────
ufw allow OpenSSH >/dev/null 2>&1 && ufw allow 'Nginx Full' >/dev/null 2>&1
ufw --force enable >/dev/null 2>&1
echo "[✓] Firewall ativo"

echo ""
echo "================================================"
echo "  Setup concluído!"
echo "  Agora o deploy pode ser feito da sua máquina"
echo "  Execute: bash push_to_vps.sh"
echo "================================================"
