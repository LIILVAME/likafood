#!/bin/bash

# Script de déploiement Vercel pour LikaFood MVP Frontend
# Usage: ./deploy-vercel.sh

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

echo "🚀 Déploiement Frontend LikaFood sur Vercel"
echo "==========================================="

# Vérifier que Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    log_warning "Vercel CLI n'est pas installé. Installation..."
    npm install -g vercel
    log_success "Vercel CLI installé avec succès"
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
    git commit -m "Deploy: Update before Vercel deployment"
    git push origin main
    log_success "Code poussé vers GitHub"
fi

# Vérifier les dépendances
log_info "Vérification des dépendances..."
if [ ! -d "node_modules" ]; then
    log_info "Installation des dépendances..."
    npm install
    log_success "Dépendances installées"
fi

# Test de build local
log_info "Test de build local..."
npm run build
log_success "Build local réussi"

log_info "Configuration des variables d'environnement..."
echo ""
echo "⚠️  IMPORTANT: Configurez ces variables dans Vercel Dashboard:"
echo "   - REACT_APP_API_URL=https://votre-backend.onrender.com/api"
echo "   - REACT_APP_ENVIRONMENT=production"
echo ""
read -p "Appuyez sur Entrée quand les variables sont configurées..."

log_info "Connexion à Vercel..."
vercel login

log_info "Déploiement en cours..."
vercel --prod

log_success "🎉 Déploiement frontend terminé !"
echo ""
log_info "Prochaines étapes:"
echo "1. Vérifiez que votre app fonctionne sur Vercel"
echo "2. Testez toutes les fonctionnalités"
echo "3. Configurez un domaine personnalisé si nécessaire"
echo "4. Activez les analytics Vercel"
echo ""
log_success "Votre frontend LikaFood est maintenant en ligne ! 🚀"

# Afficher l'URL de déploiement
echo ""
log_info "Pour voir votre app:"
echo "🌐 URL de production: https://votre-app.vercel.app"
echo "📊 Dashboard Vercel: https://vercel.com/dashboard"