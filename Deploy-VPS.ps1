param (
    [string]$VPS_IP = ""
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " MAGISTER TECH - SAFE DEPLOY PROTOCOL (JARVIS v4.1)       " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

$confirmation = Read-Host "CUIDADO: Deseja iniciar a transferencia do Magister ERP para VPS de Producao? (S/N)"
if ($confirmation -notmatch "^[Ss]$") {
    Write-Host "Deploy Abortado pelo operador." -ForegroundColor Red
    exit
}

if ([string]::IsNullOrWhiteSpace($VPS_IP)) {
    $VPS_IP = Read-Host "Digite o IP da VPS (ex: 187.127.11.172)"
}

$WORKSPACE_DIR = $PSScriptRoot
$ARCHIVE_NAME = "magister_deploy.tar.gz"

Write-Host "`n[1/3] Identificando pasta do projeto... ($WORKSPACE_DIR)" -ForegroundColor Yellow
cd $WORKSPACE_DIR

# Exclusao de persistencia obrigatoria via Rule
$EXCLUDES = @(
    "--exclude=node_modules",
    "--exclude=dist",
    "--exclude=dev.db",
    "--exclude=.env",
    "--exclude=.wa_session",
    "--exclude=.wwebjs_auth",
    "--exclude=.wwebjs_cache",
    "--exclude=logs",
    "--exclude=.git",
    "--exclude=magister_deploy.tar.gz",
    "--exclude=magister_deploy.zip"
)

Write-Host "[2/3] Compactando Arquivos Ignorando Persistencia (Isolamento de Banco)..." -ForegroundColor Yellow
if (Test-Path $ARCHIVE_NAME) { Remove-Item $ARCHIVE_NAME -Force }

# Uso do tar nativo do Windows
$tarArgs = @("czf", $ARCHIVE_NAME) + $EXCLUDES + @("magister_tech_app", "magister_tech_backend", "deploy.sh")
& tar $tarArgs

if (-not (Test-Path $ARCHIVE_NAME)) {
    Write-Host "Erro fatal ao criar empacotamento!" -ForegroundColor Red
    exit
}

Write-Host "[3/3] Iniciando transferencia para root@$VPS_IP via SCP..." -ForegroundColor Yellow
Write-Host ">> Sera solicitada a senha da VPS <<<" -ForegroundColor Magenta

# Comando SCP
scp -r ./$ARCHIVE_NAME root@$($VPS_IP):/opt/$ARCHIVE_NAME

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n==========================================================" -ForegroundColor Green
    Write-Host " DEPLOY ENVIADO COM SUCESSO A VPS!" -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host "`n=> Para aplicar na nuvem, rode os comandos la dentro:"
    Write-Host "   ssh root@$VPS_IP"
    Write-Host "   mkdir -p /opt/magister && tar -xzf /opt/magister_deploy.tar.gz -C /opt/magister"
    Write-Host "   cd /opt/magister && bash deploy.sh"
    Write-Host "`nA maquina local esta sincronizada." -ForegroundColor Cyan
} else {
    Write-Host "Falha na transferencia SCP. Verifique a senha ou conexao SSH." -ForegroundColor Red
}
