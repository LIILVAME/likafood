#!/bin/bash

# Script de test pour le déploiement Render
# Usage: ./test-render-deployment.sh [RENDER_URL]

set -e

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions de logging
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo -e "${BLUE}\n=== $1 ===${NC}"
}

# Configuration par défaut
RENDER_URL="https://likafood-backend.onrender.com"

# URL Render (paramètre ou demande à l'utilisateur)
if [ -n "$1" ]; then
    RENDER_URL="$1"
else
    if [ -z "$RENDER_URL" ]; then
        read -p "Entrez l'URL de votre déploiement Render (ex: https://your-app.onrender.com): " RENDER_URL
    fi
fi

if [ -z "$RENDER_URL" ]; then
    print_error "URL Render requise"
    exit 1
fi

# Nettoyer l'URL (supprimer le slash final)
RENDER_URL=${RENDER_URL%/}

print_info "🧪 Test du déploiement Render : $RENDER_URL"

# Test 1: Health Check
print_header "Test de Santé (Health Check)"
if curl -f -s "$RENDER_URL/api/health" > /dev/null; then
    print_success "Health check réussi"
    
    HEALTH_RESPONSE=$(curl -s "$RENDER_URL/api/health")
    echo "Réponse: $HEALTH_RESPONSE"
else
    print_error "Health check échoué"
    echo "Vérifiez que votre backend est déployé et accessible"
fi

# Test 2: Authentification
print_header "Test d'Authentification"
AUTH_RESPONSE=$(curl -s -w "%{http_code}" -X POST "$RENDER_URL/api/auth/login-or-register" \
    -H "Content-Type: application/json" \
    -d '{"phoneNumber":"+33123456789"}' \
    -o /tmp/auth_response.json)

if [ "$AUTH_RESPONSE" = "200" ] || [ "$AUTH_RESPONSE" = "201" ]; then
    print_success "Endpoint d'authentification accessible (HTTP $AUTH_RESPONSE)"
    echo "Réponse: $(cat /tmp/auth_response.json)"
elif [ "$AUTH_RESPONSE" = "400" ]; then
    print_warning "Endpoint d'authentification accessible mais erreur de validation (HTTP $AUTH_RESPONSE)"
    echo "Ceci est normal si Twilio n'est pas configuré"
    echo "Réponse: $(cat /tmp/auth_response.json)"
else
    print_error "Endpoint d'authentification inaccessible (HTTP $AUTH_RESPONSE)"
    echo "Réponse: $(cat /tmp/auth_response.json)"
fi

# Test 3: CORS Headers
print_header "Test des Headers CORS"
CORS_HEADERS=$(curl -s -I "$RENDER_URL/api/health" | grep -i "access-control")
if [ -n "$CORS_HEADERS" ]; then
    print_success "Headers CORS configurés"
    echo "$CORS_HEADERS"
else
    print_warning "Headers CORS non détectés"
    echo "Vérifiez la configuration CORS dans votre backend"
fi

# Test 4: Performance
print_header "Test de Performance"
RESPONSE_TIME=$(curl -s -w "%{time_total}" -o /dev/null "$RENDER_URL/api/health")
if (( $(echo "$RESPONSE_TIME < 2.0" | bc -l) )); then
    print_success "Temps de réponse acceptable: ${RESPONSE_TIME}s"
elif (( $(echo "$RESPONSE_TIME < 5.0" | bc -l) )); then
    print_warning "Temps de réponse lent: ${RESPONSE_TIME}s"
else
    print_error "Temps de réponse très lent: ${RESPONSE_TIME}s"
fi

# Test 5: HTTPS
print_header "Test HTTPS"
if [[ $RENDER_URL == https://* ]]; then
    SSL_INFO=$(curl -s -I "$RENDER_URL" | head -1)
    print_success "HTTPS activé"
    echo "$SSL_INFO"
else
    print_error "HTTPS non activé"
    echo "Render active HTTPS automatiquement, vérifiez votre URL"
fi

# Test 6: Disponibilité
print_header "Test de Disponibilité"
print_info "Test de charge légère (5 requêtes simultanées)..."
for i in {1..5}; do
    curl -s "$RENDER_URL/api/health" > /dev/null &
done
wait
print_success "Test de charge terminé"

# Résumé
print_header "Résumé des Tests"
print_info "URL testée: $RENDER_URL"
print_info "Tous les tests sont terminés"
echo ""
echo "📋 Actions recommandées:"
echo "1. Vérifiez les logs Render si des tests ont échoué"
echo "2. Configurez les variables d'environnement si nécessaire"
echo "3. Testez l'intégration avec votre frontend"
echo "4. Configurez le monitoring et les alertes"
echo "5. Documentez l'URL de production pour votre équipe"
echo ""
print_success "🎉 Test de déploiement Render terminé!"

# Nettoyage
rm -f /tmp/auth_response.json