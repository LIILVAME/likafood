#!/bin/bash

# Script d'arrêt pour l'environnement de développement LikaFood

echo "🛑 Arrêt de l'environnement de développement LikaFood..."

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

# Arrêter les processus via les fichiers PID
if [ -f backend.pid ]; then
    echo -e "${YELLOW}🔧 Arrêt du backend...${NC}"
    kill $(cat backend.pid) 2>/dev/null || true
    rm backend.pid
    echo -e "${GREEN}✅ Backend arrêté${NC}"
fi

if [ -f frontend.pid ]; then
    echo -e "${YELLOW}🎨 Arrêt du frontend...${NC}"
    kill $(cat frontend.pid) 2>/dev/null || true
    rm frontend.pid
    echo -e "${GREEN}✅ Frontend arrêté${NC}"
fi

# Forcer l'arrêt des processus sur les ports si nécessaire
if check_port 5001; then
    echo -e "${YELLOW}⚠️  Forçage de l'arrêt du processus sur le port 5001...${NC}"
    lsof -ti:5001 | xargs kill -9 2>/dev/null || true
fi

if check_port 3000; then
    echo -e "${YELLOW}⚠️  Forçage de l'arrêt du processus sur le port 3000...${NC}"
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
fi

# Nettoyer les fichiers de log si souhaité
read -p "Voulez-vous supprimer les fichiers de log ? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -f backend.log frontend.log
    echo -e "${GREEN}✅ Fichiers de log supprimés${NC}"
fi

echo -e "\n${GREEN}🎉 Environnement de développement arrêté avec succès !${NC}"
echo -e "${BLUE}💡 Pour redémarrer, utilisez: ${GREEN}./start-dev-environment.sh${NC}"