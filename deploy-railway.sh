#!/bin/bash

# Script de déploiement Railway pour LikaFood MVP
# Usage: ./deploy-railway.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "🚀 Déploiement LikaFood MVP sur Railway"
echo "======================================"

# Vérifier que Railway CLI est installé
if ! command -v railway &> /dev/null; then
    log_warning "Railway CLI n'est pas installé. Installation..."
    npm install -g @railway/cli
    log_success "Railway CLI installé avec succès"
fi

# Vérifier que nous sommes dans un dépôt Git
if [ ! -d ".git" ]; then
    log_error "Ce n'est pas un dépôt Git. Veuillez initialiser Git d'abord."
    exit 1
fi

# Vérifier que le code est à jour
if [ -n "$(git status --porcelain)" ]; then
    log_warning "Il y a des changements non committés. Commit en cours..."
    git add .
    git commit -m "Deploy: Update before Railway deployment"
    git push origin main
    log_success "Code poussé vers GitHub"
fi

log_info "Connexion à Railway..."
railway login

log_info "Initialisation du projet Railway..."
if [ ! -f "railway.toml" ]; then
    railway init
    log_success "Projet Railway initialisé"
else
    log_info "Projet Railway déjà configuré"
fi

log_info "Configuration des variables d'environnement..."
echo ""
echo "⚠️  IMPORTANT: Configurez ces variables dans Railway Dashboard:"
echo "   - NODE_ENV=production"
echo "   - PORT=3000"
echo "   - MONGODB_URI=<votre_uri_mongodb_atlas>"
echo "   - JWT_SECRET=<votre_secret_jwt>"
echo "   - TWILIO_ACCOUNT_SID=<votre_sid>"
echo "   - TWILIO_AUTH_TOKEN=<votre_token>"
echo "   - TWILIO_PHONE_NUMBER=<votre_numero>"
echo ""
read -p "Appuyez sur Entrée quand les variables sont configurées..."

log_info "Déploiement en cours..."
railway up

log_success "🎉 Déploiement terminé !"
echo ""
log_info "Prochaines étapes:"
echo "1. Vérifiez que votre app fonctionne sur Railway"
echo "2. Testez l'endpoint: https://votre-app.railway.app/api/health"
echo "3. Configurez le frontend pour pointer vers votre backend Railway"
echo "4. Déployez le frontend sur Vercel ou un autre service"
echo ""
log_success "Votre backend LikaFood est maintenant en ligne ! 🚀"