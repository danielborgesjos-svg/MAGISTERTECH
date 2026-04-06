#!/bin/bash
# =============================================================================
# MAGISTER TECH — Deploy / Redeploy
# Execute sempre que quiser atualizar o sistema na VPS:  bash deploy.sh
# =============================================================================
set -e

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$APP_DIR/magister_tech_backend"
FRONTEND_DIR="$APP_DIR/magister_tech_app"
ENV_FILE="$BACKEND_DIR/.env"

echo ""
log "=== MAGISTER TECH — Deploy ==="
echo "    Diretório: $APP_DIR"
echo ""

# ─── 1. Verificar .env do backend ────────────────────────────────────────────
if [ ! -f "$ENV_FILE" ]; then
  warn ".env não encontrado. Criando com valores padrão..."
  # Gera JWT_SECRET aleatório de 64 chars
  JWT_SECRET=$(openssl rand -base64 48 | tr -d '/+=' | head -c 64)
  cat > "$ENV_FILE" << EOF
DATABASE_URL="file:./dev.db"
JWT_SECRET="$JWT_SECRET"
PORT=3001
NODE_ENV=production
EOF
  log ".env criado em $ENV_FILE"
  warn "IMPORTANTE: Anote o JWT_SECRET gerado — necessário se trocar de servidor."
else
  log ".env encontrado."
  # Garante que PORT e NODE_ENV estão no .env
  grep -q "^PORT=" "$ENV_FILE"      || echo "PORT=3001"           >> "$ENV_FILE"
  grep -q "^NODE_ENV=" "$ENV_FILE"  || echo "NODE_ENV=production" >> "$ENV_FILE"
fi

# ─── 2. Instalar dependências do backend ─────────────────────────────────────
log "Instalando dependências do backend..."
cd "$BACKEND_DIR"
npm install --silent --production=false

# ─── 3. Gerar Prisma Client ──────────────────────────────────────────────────
log "Sincronizando schema Prisma com o banco..."
npx prisma db push --accept-data-loss
log "Prisma Client gerado."

# ─── 4. Verificar se banco precisa de seed ───────────────────────────────────
USER_COUNT=$(node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.count().then(n => { console.log(n); p.\$disconnect(); }).catch(() => { console.log(0); p.\$disconnect(); });
" 2>/dev/null || echo "0")

if [ "$USER_COUNT" = "0" ]; then
  warn "Banco vazio. Rodando seed com dados iniciais..."
  npm run seed
  log "Seed executado. Credenciais:"
  echo "    admin@magistertech.com.br / admin123"
  echo "    gestor@magistertech.com.br / gestor123"
else
  log "Banco já tem $USER_COUNT usuário(s). Seed ignorado."
fi

# ─── 5. Compilar backend TypeScript ──────────────────────────────────────────
log "Compilando TypeScript do backend..."
cd "$BACKEND_DIR"
npx tsc
log "Backend compilado em dist/"

# ─── 6. Build do frontend ────────────────────────────────────────────────────
log "Fazendo build do frontend (Vite)..."
cd "$FRONTEND_DIR"
npm install --silent
npm run build
log "Frontend buildado em dist/"

# ─── 7. Iniciar/Reiniciar com PM2 ────────────────────────────────────────────
log "Reiniciando aplicação com PM2..."
cd "$APP_DIR"
pm2 delete magister-backend 2>/dev/null || true
pm2 start "$BACKEND_DIR/dist/server.js" \
  --name "magister-backend" \
  --cwd "$BACKEND_DIR" \
  --env production \
  --restart-delay=3000 \
  --max-restarts=10 \
  --log "$BACKEND_DIR/pm2.log" \
  --time
pm2 save

# ─── 8. Verificar se subiu ────────────────────────────────────────────────────
sleep 3
if pm2 list | grep -q "magister-backend.*online"; then
  log "Servidor online!"
else
  err "Servidor NÃO subiu. Verifique: pm2 logs magister-backend"
fi

# ─── 9. Recarregar Nginx ─────────────────────────────────────────────────────
if command -v nginx &>/dev/null; then
  systemctl reload nginx 2>/dev/null || true
  log "Nginx recarregado."
fi

# ─── 10. Status final ────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════════════"
log "Deploy CONCLUÍDO!"
VPS_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
echo ""
echo "  Acesse: http://$VPS_IP"
echo ""
echo "  Comandos úteis:"
echo "    pm2 logs magister-backend   # ver logs em tempo real"
echo "    pm2 status                  # status dos processos"
echo "    bash deploy.sh              # reatualizar"
echo "════════════════════════════════════════════════════════"
