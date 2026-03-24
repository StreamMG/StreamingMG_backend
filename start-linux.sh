#!/bin/bash
# Script de demarrage strict pour Linux/macOS (Sans Docker)

echo "================================================="
echo "🚀 Demarrage du Backend StreamMG (Linux/macOS)  "
echo "================================================="

# Vérification du fichier .env
if [ ! -f .env ]; then
    echo "❌ Erreur : Le fichier .env est introuvable !"
    echo "⚠️ Veuillez créer un fichier .env basé sur .env.example avant de démarrer."
    exit 1
fi

echo "📦 1. Verification/Installation des dependances NPM..."
npm install --no-audit

echo "▶️ 2. Lancement du serveur Node.js..."
npm run start
