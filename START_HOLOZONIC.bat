@echo off
echo ==============================================
echo     INICIANDO O ECOSSISTEMA HOLOZONIC
echo ==============================================
echo.
echo Certifique-se de que o servico do PostgreSQL
echo esta ativo na porta 5432.
echo.

:: Inicia o Backend em uma nova janela
echo Iniciando Holozonic Backend (Porta 3333)...
start "Holozonic Backend" cmd /k "cd holozonic_backend && npx prisma db push && npm run dev"

:: Inicia o Frontend em uma nova janela
echo Iniciando Holozonic Admin (Porta 5173)...
start "Holozonic Admin" cmd /k "cd holozonic_admin && npm run dev"

echo.
echo Tudo iniciado! O painel deve abrir em seu navegador em instantes.
echo Em caso de erro do Prisma, confirme se seu 'postgres' local esta sendo executado.
pause
