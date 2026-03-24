#!/bin/bash
echo "Démarrage du serveur..."
node server.js > server.log 2>&1 &
SERVER_PID=$!

echo "Attente du démarrage (8s)..."
sleep 8

echo "Lancement des uploads..."
node scripts/test_upload.js

echo "Attente de la fin des transcodages ffmpeg (HLS)..."
while pgrep -f ffmpeg > /dev/null; do
  sleep 5
done

echo "Transcodage terminé."
# Attendre 2 secondes supplémentaires pour que le .then() de la DB s'exécute
sleep 2

echo "Arrêt du serveur."
kill $SERVER_PID
echo "Test terminé avec succès!"
