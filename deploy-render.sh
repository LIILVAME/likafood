#!/bin/bash

# Script de déploiement Render pour LikaFood MVP
# Usage: ./deploy-render.sh

set -e

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions de logging
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

echo "🚀 Déploiement LikaFood MVP sur Render"
echo "======================================"

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    log_error "Fichier package.json non trouvé. Assurez-vous d'être dans le répertoire racine du projet."
    exit 1
fi

# Vérifier que le dossier backend existe
if [ ! -d "backend" ]; then
    log_error "Dossier backend non trouvé."
    exit 1
fi

# Vérifier que Git est configuré
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    log_error "Ce n'est pas un repository Git."
    exit 1
fi

# Vérifier les changements non commitées
if ! git diff-index --quiet HEAD --; then
    log_warning "Vous avez des changements non commitées."
    read -p "Voulez-vous les committer automatiquement? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        git commit -m "Deploy: Update before Render deployment"
        log_success "Changements commitées"
    else
        log_warning "Déploiement avec des changements non commitées"
    fi
fi

# Pousser vers GitHub
log_info "Poussée du code vers GitHub..."
git push origin main
log_success "Code poussé vers GitHub"

# Vérifier la configuration Render
if [ ! -f "render.yaml" ]; then
    log_warning "Fichier render.yaml non trouvé. Assurez-vous d'avoir configuré votre service sur Render."
else
    log_success "Configuration Render trouvée"
fi

# Instructions pour l'utilisateur
echo ""
log_info "Étapes suivantes:"
echo "1. 🌐 Accédez à https://dashboard.render.com"
echo "2. 🔗 Connectez votre repository GitHub si ce n'est pas déjà fait"
echo "3. ⚙️  Configurez les variables d'environnement suivantes:"
echo ""
echo "   Variables d'environnement requises:"
echo "   - MONGODB_URI=mongodb+srv://..."
echo "   - JWT_SECRET=votre_jwt_secret_securise"
echo "   - TWILIO_ACCOUNT_SID=votre_twilio_sid"
echo "   - TWILIO_AUTH_TOKEN=votre_twilio_token"
echo "   - TWILIO_PHONE_NUMBER=+1234567890"
echo "   - NODE_ENV=production"
echo "   - PORT=10000"
echo "   - CORS_ORIGIN=https://votre-frontend.vercel.app"
echo ""
echo "4. 🚀 Render déploiera automatiquement votre backend"
echo "5. 🧪 Testez votre déploiement:"
echo "   curl https://votre-backend.onrender.com/api/health"
echo ""

log_success "🎉 Préparation du déploiement Render terminée!"
log_info "Le déploiement se fera automatiquement via GitHub."