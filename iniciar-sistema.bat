@echo off
title CRM Clinico Farmaceutico - Servidor Ativo (NAO FECHE ESTA JANELA)
color 0B
echo ============================================================================
echo         CRM CLINICO FARMACEUTICO ^& SUPORTE A DECISAO (CDSS 4D)
echo ============================================================================
echo.
echo [INFO] Encerrando processos Node anteriores (se houver)...
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo.
echo [1/2] Iniciando Backend (porta 3001) + Frontend (porta 5175)...
echo [2/2] Abrindo o navegador em 4 segundos...
echo.
echo ATENCAO: Mantenha esta janela aberta enquanto utilizar o sistema.
echo ============================================================================
echo.
start /min cmd /c "timeout /t 4 /nobreak >nul && start http://localhost:5175"
npm run dev
