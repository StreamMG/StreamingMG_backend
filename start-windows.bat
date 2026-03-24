@echo off
REM Script de demarrage strict pour Windows (Sans Docker)
chcp 65001 >nul

echo =================================================
echo 🚀 Demarrage du Backend StreamMG (Windows)
echo =================================================

REM Vérification du fichier .env
if not exist ".env" (
    echo ❌ Erreur : Le fichier .env est introuvable !
    echo ⚠️ Veuillez créer un fichier .env basé sur .env.example avant de démarrer.
    pause
    exit /b 1
)

echo 📦 1. Verification/Installation des dependances NPM...
call npm install --no-audit

echo ▶️ 2. Lancement du serveur Node.js...
call npm run start

pause
