@echo off
echo ========================================
echo    CONTROLE FINANCEIRO - GERAR APK
echo ========================================
echo.

echo Este script gera o APK do app de controle financeiro
echo.

echo Verificando se voce esta logado...
call npx eas whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ERRO: Voce precisa estar logado no Expo
    echo Execute: npx eas login
    echo.
    pause
    exit /b 1
)

echo [OK] Logado no Expo
echo.

echo Corrigindo dependencias...
call npx expo install --fix

echo.
echo Configurando projeto no Expo...
call npx expo register

echo.
echo Iniciando build do APK...
echo.
echo INSTRUCOES:
echo - O build pode demorar 10-15 minutos
echo - Voce recebera um email quando estiver pronto
echo - O APK sera baixavel do link no email
echo.

echo Gerando APK...
call npx eas build --platform android --profile preview

if %errorlevel% neq 0 (
    echo.
    echo ========================================
    echo    ERRO NO BUILD
    echo ========================================
    echo.
    echo Possiveis causas:
    echo 1. Problema de conexao com internet
    echo 2. Conta Expo nao configurada
    echo 3. Projeto nao configurado
    echo.
    echo Solucoes:
    echo 1. Verifique sua conexao
    echo 2. Execute: npx eas login
    echo 3. Tente novamente
    echo.
) else (
    echo.
    echo ========================================
    echo    BUILD INICIADO COM SUCESSO!
    echo ========================================
    echo.
    echo O APK sera gerado em alguns minutos
    echo Voce recebera um email quando estiver pronto
    echo.
    echo Para acompanhar o progresso:
    echo https://expo.dev/accounts/[seu-usuario]/projects/controle-financeiro
    echo.
)

pause 