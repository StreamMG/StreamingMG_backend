#!/bin/bash

# --- CONFIGURATION ---
PORT=3001
APP_NAME="node server.js" # Nom partiel pour identifier le processus

# Couleurs pour le terminal
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

stop_server() {
    echo -e "${RED}Arrêt du serveur sur le port $PORT...${NC}"
    # Trouve le PID utilisant le port et le tue
    PID=$(lsof -t -i:$PORT)
    if [ -z "$PID" ]; then
        # Si non trouvé par port, on cherche par nom de processus
        PID=$(ps aux | grep "$APP_NAME" | grep -v grep | awk '{print $2}')
    fi

    if [ ! -z "$PID" ]; then
        kill -9 $PID
        echo -e "${GREEN}Serveur arrêté (PID: $PID).${NC}"
    else
        echo -e "Aucun serveur en cours d'exécution."
    fi
}

start_server() {
    echo -e "${GREEN}Démarrage du serveur...${NC}"
    # On lance en arrière-plan et on redirige les logs
    nohup npm start > ./logs/console.log 2>&1 &
    echo -e "${GREEN}Serveur lancé en arrière-plan.${NC}"
    echo -e "Tu peux voir les logs avec : tail -f ./logs/console.log"
}

case "$1" in
    start)
        start_server
        ;;
    stop)
        stop_server
        ;;
    restart)
        stop_server
        sleep 2
        start_server
        ;;
    status)
        ps aux | grep "$APP_NAME" | grep -v grep
        lsof -i:$PORT
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        exit 1
esac
