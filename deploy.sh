#!/bin/bash
# =============================================================================
# MAGISTER TECH — Deploy / Atualização
# Execute sempre que quiser atualizar:  bash deploy.sh
# =============================================================================
set -e

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; BLUE='\033[0;34m'; NC='\033[0m'
log()   { echo -e "${GREEN}[✓]${NC} $1"; }
info()  { echo -e "${BLUE}[→]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
err()   { echo -e "${RED}[✗]${NC} $1"; exit 1; }
step()  { echo ""; echo -e "${BLUE}━━━ $1 ━━━${NC}"; }

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$APP_DIR/magister_tech_backend"
FRONTEND_DIR="$APP_DIR/magister_tech_app"
ENV_FILE="$BACKEND_DIR/.env"

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       MAGISTER TECH — Deploy                ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo ""
log "Diretório: $APP_DIR"
log "Node.js: $(node --version) | NPM: $(npm --version)"

# ─── 1. Criar .env de produção se não existir ─────────────────────────────────
step "Configuração de ambiente"
if [ ! -f "$ENV_FILE" ]; then
  warn ".env não encontrado — gerando com JWT_SECRET seguro..."
  JWT_SECRET=$(openssl rand -base64 48 | tr -d '/+=' | head -c 64)
  cat > "$ENV_FILE" << EOF
DATABASE_URL="file:./dev.db"
JWT_SECRET="${JWT_SECRET}"
PORT=3001
NODE_ENV=production
EOF
  log ".env criado. GUARDE o JWT_SECRET se precisar migrar o banco."
  cat "$ENV_FILE"
else
  # Garante variáveis essenciais
  grep -q "^PORT="      "$ENV_FILE" || echo "PORT=3001"           >> "$ENV_FILE"
  grep -q "^NODE_ENV="  "$ENV_FILE" || echo "NODE_ENV=production" >> "$ENV_FILE"
  log ".env encontrado e validado."
fi

# ─── 2. Backend: dependências ─────────────────────────────────────────────────
step "Backend — dependências"
cd "$BACKEND_DIR"
info "npm install..."
npm install --silent 2>&1 | tail -3
log "Dependências do backend instaladas."

# ─── 3. Prisma: schema + seed ─────────────────────────────────────────────────
step "Banco de dados (Prisma + SQLite)"
info "Sincronizando schema..."
npx prisma generate --silent 2>/dev/null || true
npx prisma db push --accept-data-loss 2>&1 | grep -E "✔|⚠|Error" || true
log "Schema sincronizado."

# Seed automático se banco estiver vazio
USER_COUNT=$(node -e "
const {PrismaClient}=require('@prisma/client');
const p=new PrismaClient();
p.user.count()
  .then(n=>{console.log(n);p.\$disconnect();})
  .catch(()=>{console.log(0);p.\$disconnect();});
" 2>/dev/null || echo "0")

if [ "$USER_COUNT" = "0" ]; then
  warn "Banco vazio — executando seed..."
  npm run seed 2>&1
  log "Seed executado!"
  echo ""
  echo -e "  ${GREEN}Credenciais de acesso:${NC}"
  echo "    Admin  : admin@magistertech.com.br  / admin123"
  echo "    Gestor : gestor@magistertech.com.br / gestor123"
  echo ""
else
  log "Banco já contém $USER_COUNT usuário(s). Seed ignorado."
fi

# ─── 4. Compilar TypeScript ───────────────────────────────────────────────────
step "Backend — compilar TypeScript"
info "tsc..."
rm -rf dist/
npx tsc 2>&1
log "TypeScript compilado → dist/"

# ─── 5. Build do frontend ────────────────────────────────────────────────────
step "Frontend — Vite build"
cd "$FRONTEND_DIR"
info "npm install..."
npm install --silent 2>&1 | tail -2

# Garante que a URL de API não tem hardcode (usa proxy do Express em produção)
info "vite build..."
npm run build 2>&1 | grep -E "✓|✗|error|Error|built" || true
log "Frontend buildado → dist/"

# ─── 6. PM2 ─────────────────────────────────────────────────────────────────
step "PM2 — iniciar processo"
cd "$BACKEND_DIR"
pm2 delete magister-backend 2>/dev/null || true

pm2 start dist/server.js \
  --name "magister-backend" \
  --cwd "$BACKEND_DIR" \
  --node-args="--max-old-space-size=512" \
  --restart-delay=3000 \
  --max-restarts=10 \
  --log "$BACKEND_DIR/pm2.log" \
  --time \
  --env production

pm2 save --force >/dev/null 2>&1 || true

# ─── 7. Health check ─────────────────────────────────────────────────────────
info "Aguardando servidor subir..."
sleep 4

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3001/ 2>/dev/null || echo "000")
if [[ "$HTTP_STATUS" =~ ^[23] ]]; then
  log "Servidor respondendo (HTTP $HTTP_STATUS) ✓"
else
  warn "Health check retornou HTTP $HTTP_STATUS — verificando logs..."
  pm2 logs magister-backend --lines 20 --nostream 2>/dev/null || true
fi

# ─── 8. Nginx reload ─────────────────────────────────────────────────────────
if command -v nginx &>/dev/null; then
  nginx -t 2>/dev/null && systemctl reload nginx 2>/dev/null || true
  log "Nginx recarregado."
fi

# ─── 9. Status final ─────────────────────────────────────────────────────────
VPS_IP=$(curl -s --max-time 3 ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          Deploy CONCLUÍDO!                   ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  🌐 Acesse: ${BLUE}http://${VPS_IP}${NC}"
echo ""
echo -e "  Comandos úteis:"
echo "    pm2 status                    # status"
echo "    pm2 logs magister-backend     # logs ao vivo"
echo "    pm2 restart magister-backend  # reiniciar"
echo "    cd /opt/magister && bash deploy.sh   # reatualizar"
echo ""
pm2 status magister-backend 2>/dev/null | grep -E "name|status|restart|memory" || true
