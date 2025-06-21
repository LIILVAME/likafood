#!/bin/bash

# Script de démarrage automatique pour l'environnement de développement LikaFood
# Ce script lance automatiquement le backend et le frontend

echo "🚀 Démarrage de l'environnement de développement LikaFood..."

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour vérifier si un port est utilisé
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        return 0
    else
        return 1
    fi
}

# Fonction pour arrêter les processus existants
stop_existing_processes() {
    echo -e "${YELLOW}🔍 Vérification des processus existants...${NC}"
    
    # Arrêter les processus sur le port 5001 (backend)
    if check_port 5001; then
        echo -e "${YELLOW}⚠️  Port 5001 occupé, arrêt du processus...${NC}"
        lsof -ti:5001 | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
    
    # Arrêter les processus sur le port 3000 (frontend)
    if check_port 3000; then
        echo -e "${YELLOW}⚠️  Port 3000 occupé, arrêt du processus...${NC}"
        lsof -ti:3000 | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
}

# Fonction pour démarrer le backend
start_backend() {
    echo -e "${BLUE}🔧 Démarrage du backend...${NC}"
    cd backend
    
    # Vérifier si node_modules existe
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}📦 Installation des dépendances backend...${NC}"
        npm install
    fi
    
    # Démarrer le backend en arrière-plan
    npm run dev > ../backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../backend.pid
    
    # Attendre que le backend soit prêt
    echo -e "${YELLOW}⏳ Attente du démarrage du backend...${NC}"
    for i in {1..30}; do
        if check_port 5001; then
            echo -e "${GREEN}✅ Backend démarré avec succès sur le port 5001${NC}"
            break
        fi
        sleep 1
        if [ $i -eq 30 ]; then
            echo -e "${RED}❌ Échec du démarrage du backend${NC}"
            exit 1
        fi
    done
    
    cd ..
}

# Fonction pour démarrer le frontend
start_frontend() {
    echo -e "${BLUE}🎨 Démarrage du frontend...${NC}"
    
    # Vérifier si node_modules existe
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}📦 Installation des dépendances frontend...${NC}"
        npm install
    fi
    
    # Démarrer le frontend en arrière-plan
    npm start > frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > frontend.pid
    
    # Attendre que le frontend soit prêt
    echo -e "${YELLOW}⏳ Attente du démarrage du frontend...${NC}"
    for i in {1..60}; do
        if check_port 3000; then
            echo -e "${GREEN}✅ Frontend démarré avec succès sur le port 3000${NC}"
            break
        fi
        sleep 1
        if [ $i -eq 60 ]; then
            echo -e "${RED}❌ Échec du démarrage du frontend${NC}"
            exit 1
        fi
    done
}

# Fonction pour tester les services
test_services() {
    echo -e "${BLUE}🧪 Test des services...${NC}"
    
    # Test du backend
    if curl -s http://localhost:5001/api/health > /dev/null; then
        echo -e "${GREEN}✅ Backend API accessible${NC}"
    else
        echo -e "${RED}❌ Backend API non accessible${NC}"
    fi
    
    # Test du frontend
    if curl -s http://localhost:3000 > /dev/null; then
        echo -e "${GREEN}✅ Frontend accessible${NC}"
    else
        echo -e "${RED}❌ Frontend non accessible${NC}"
    fi
}

# Fonction pour afficher les informations de connexion
show_connection_info() {
    echo -e "\n${GREEN}🎉 Environnement de développement démarré avec succès !${NC}"
    echo -e "\n${BLUE}📋 Informations de connexion :${NC}"
    echo -e "   🌐 Frontend: ${GREEN}http://localhost:3000${NC}"
    echo -e "   🔧 Backend API: ${GREEN}http://localhost:5001${NC}"
    echo -e "   🏥 Health Check: ${GREEN}http://localhost:5001/api/health${NC}"
    echo -e "\n${YELLOW}🔑 Pour les tests, utilisez l'OTP générique: ${GREEN}123456${NC}"
    echo -e "\n${BLUE}📝 Logs disponibles :${NC}"
    echo -e "   📄 Backend: ${GREEN}backend.log${NC}"
    echo -e "   📄 Frontend: ${GREEN}frontend.log${NC}"
    echo -e "\n${YELLOW}⚠️  Pour arrêter l'environnement, utilisez: ${GREEN}./stop-dev-environment.sh${NC}"
}

# Fonction de nettoyage en cas d'interruption
cleanup() {
    echo -e "\n${YELLOW}🛑 Arrêt de l'environnement de développement...${NC}"
    if [ -f backend.pid ]; then
        kill $(cat backend.pid) 2>/dev/null || true
        rm backend.pid
    fi
    if [ -f frontend.pid ]; then
        kill $(cat frontend.pid) 2>/dev/null || true
        rm frontend.pid
    fi
    exit 0
}

# Capturer les signaux d'interruption
trap cleanup SIGINT SIGTERM

# Exécution principale
stop_existing_processes
start_backend
start_frontend
test_services
show_connection_info

# Garder le script en vie
echo -e "\n${BLUE}🔄 Environnement en cours d'exécution... Appuyez sur Ctrl+C pour arrêter${NC}"
while true; do
    sleep 10
    # Vérifier que les services sont toujours actifs
    if ! check_port 5001; then
        echo -e "${RED}❌ Backend arrêté de manière inattendue${NC}"
        break
    fi
    if ! check_port 3000; then
        echo -e "${RED}❌ Frontend arrêté de manière inattendue${NC}"
        break
    fi
done

cleanup