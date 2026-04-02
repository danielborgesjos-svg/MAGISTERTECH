@echo off
echo Iniciando Magister Tech Backend (Porta 3001) e Frontend (Vite)...

start cmd /k "cd magister_tech_backend && npx ts-node src/server.ts"
start cmd /k "cd magister_tech_app && npm run dev"

echo Tudo ligado! Acesse http://localhost:5173 na Landing ou http://localhost:5173/admin
