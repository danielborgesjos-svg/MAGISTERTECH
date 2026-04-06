#!/bin/bash
# =============================================================================
# MAGISTER TECH — Enviar código e configurar VPS remotamente
# Rode na sua máquina local (Windows/Git Bash):  bash push_to_vps.sh
# =============================================================================
VPS_IP="187.127.11.1"
VPS_USER="root"
VPS_DIR="/opt/magister"
SSH_KEY="$USERPROFILE/.ssh/magister_vps"
LOCAL_DIR="$(cd "$(dirname "$0")" && pwd)"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log()   { echo -e "${GREEN}[✓]${NC} $1"; }
info()  { echo -e "${BLUE}[→]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }

SSH_OPTS="-o StrictHostKeyChecking=accept-new -o ConnectTimeout=15"
# Se a chave SSH existe, usa ela — senão pede senha normalmente
[ -f "$SSH_KEY" ] && SSH_OPTS="$SSH_OPTS -i $SSH_KEY"

ssh_run() { ssh $SSH_OPTS "$VPS_USER@$VPS_IP" "$1"; }

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║    MAGISTER TECH — Push → VPS Hostinger     ║${NC}"
echo -e "${BLUE}║    $VPS_IP                     ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════╝${NC}"
echo ""

# ─── 1. Instalar chave SSH (se ainda não tiver) ───────────────────────────────
if [ -f "$SSH_KEY" ]; then
  info "Instalando chave SSH na VPS (vai pedir senha UMA VEZ)..."
  ssh-copy-id -o StrictHostKeyChecking=accept-new -i "${SSH_KEY}.pub" "$VPS_USER@$VPS_IP" 2>/dev/null || true
  log "Chave SSH instalada — próximos acessos sem senha."
fi

# ─── 2. Criar pasta na VPS ────────────────────────────────────────────────────
info "Criando $VPS_DIR na VPS..."
ssh_run "mkdir -p $VPS_DIR"
log "Diretório criado."

# ─── 3. Enviar código via rsync/scp ──────────────────────────────────────────
info "Enviando código para a VPS (isso pode levar 1-2 min)..."

# Usa rsync se disponível (mais rápido em atualizações), senão scp
if command -v rsync &>/dev/null; then
  rsync -az --progress \
    --exclude="node_modules" \
    --exclude=".git" \
    --exclude="dist" \
    --exclude="*.db" \
    --exclude="*.db-journal" \
    --exclude=".env" \
    -e "ssh $SSH_OPTS" \
    "$LOCAL_DIR/" "$VPS_USER@$VPS_IP:$VPS_DIR/"
else
  # Cria tar excluindo node_modules e envia
  info "rsync não disponível — usando tar+scp..."
  TMPTAR="/tmp/magister_deploy.tar.gz"
  tar --exclude="*/node_modules" \
      --exclude="*/.git" \
      --exclude="*/dist" \
      --exclude="*.db" \
      --exclude="*.db-journal" \
      --exclude="*/.env" \
      -czf "$TMPTAR" -C "$LOCAL_DIR" .
  scp $SSH_OPTS "$TMPTAR" "$VPS_USER@$VPS_IP:/tmp/magister_deploy.tar.gz"
  ssh_run "tar -xzf /tmp/magister_deploy.tar.gz -C $VPS_DIR && rm /tmp/magister_deploy.tar.gz"
  rm -f "$TMPTAR"
fi
log "Código enviado."

# ─── 4. Setup inicial (só se for a primeira vez) ─────────────────────────────
SETUP_FLAG=$(ssh_run "[ -f $VPS_DIR/.setup_done ] && echo yes || echo no")
if [ "$SETUP_FLAG" = "no" ]; then
  info "Primeira execução — rodando setup inicial..."
  ssh_run "bash $VPS_DIR/setup_vps.sh"
  ssh_run "touch $VPS_DIR/.setup_done"
  log "Setup inicial concluído."
else
  log "Setup já foi feito antes — pulando."
fi

# ─── 5. Deploy ────────────────────────────────────────────────────────────────
info "Rodando deploy na VPS..."
ssh_run "bash $VPS_DIR/deploy.sh"

# ─── 6. Resultado ────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     Tudo pronto! Sistema no ar.             ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  🌐 Acesse: ${BLUE}http://$VPS_IP${NC}"
echo ""
echo -e "  Login:  admin@magistertech.com.br / admin123"
echo ""
warn "Para reatualizar no futuro, basta rodar:"
echo -e "  ${BLUE}bash push_to_vps.sh${NC}"
echo ""
