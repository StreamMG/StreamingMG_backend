#!/bin/bash

# --- CONFIGURATION ---
APP_NAME="server.js"
LOG_FILE="./logs/console.log"

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

start_server() {
    echo -e "${GREEN}Démarrage du serveur Node.js...${NC}"

    # IMPORTANT: Alwaysdata fournit PORT automatiquement
    export NODE_ENV=production

    # On ne fixe PAS de port, on laisse process.env.PORT
    npm start > "$LOG_FILE" 2>&1 &

    echo -e "${GREEN}Serveur lancé.${NC}"
    echo "Logs: tail -f $LOG_FILE"
}

stop_server() {
    echo -e "${RED}Arrêt du serveur...${NC}"

    PID=$(pgrep -f "$APP_NAME")

    if [ -z "$PID" ]; then
        echo "Aucun processus trouvé."
    else
        kill -9 $PID
        echo -e "${GREEN}Serveur arrêté (PID: $PID)${NC}"
    fi
}

status_server() {
    echo "=== STATUS NODE ==="
    pgrep -fl "$APP_NAME" || echo "Aucun serveur actif"
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
        status_server
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        exit 1
esac
