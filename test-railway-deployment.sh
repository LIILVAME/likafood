#!/bin/bash

# Script de test pour le déploiement Railway
# Usage: ./test-railway-deployment.sh [RAILWAY_URL]

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions utilitaires
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

# URL Railway (paramètre ou demande à l'utilisateur)
RAILWAY_URL="$1"

if [ -z "$RAILWAY_URL" ]; then
    read -p "Entrez l'URL de votre déploiement Railway (ex: https://your-app.railway.app): " RAILWAY_URL
fi

if [ -z "$RAILWAY_URL" ]; then
    print_error "URL Railway requise"
    exit 1
fi

# Supprimer le slash final si présent
RAILWAY_URL=${RAILWAY_URL%/}

print_info "🧪 Test du déploiement Railway : $RAILWAY_URL"
print_info "================================================"

# Test 1: Health Check
print_info "Test 1: Health Check de l'API..."
if curl -f -s "$RAILWAY_URL/api/health" > /dev/null; then
    print_success "Health Check réussi"
    
    # Afficher la réponse du health check
    HEALTH_RESPONSE=$(curl -s "$RAILWAY_URL/api/health")
    echo "Réponse: $HEALTH_RESPONSE"
else
    print_error "Health Check échoué"
    print_warning "Vérifiez que l'API est démarrée et accessible"
fi

echo ""

# Test 2: Route d'authentification unifiée
print_info "Test 2: Route d'authentification unifiée..."
AUTH_RESPONSE=$(curl -s -w "%{http_code}" -X POST "$RAILWAY_URL/api/auth/login-or-register" \
    -H "Content-Type: application/json" \
    -d '{"phoneNumber":"+33123456789"}' \
    -o /tmp/auth_response.json)

if [ "$AUTH_RESPONSE" = "200" ] || [ "$AUTH_RESPONSE" = "400" ] || [ "$AUTH_RESPONSE" = "422" ]; then
    print_success "Route d'authentification accessible (Code: $AUTH_RESPONSE)"
    
    # Afficher la réponse si elle existe
    if [ -f "/tmp/auth_response.json" ]; then
        echo "Réponse:"
        cat /tmp/auth_response.json
        echo ""
    fi
else
    print_error "Route d'authentification non accessible (Code: $AUTH_RESPONSE)"
fi

echo ""

# Test 3: CORS Headers
print_info "Test 3: Vérification des headers CORS..."
CORS_HEADERS=$(curl -s -I "$RAILWAY_URL/api/health" | grep -i "access-control")

if [ ! -z "$CORS_HEADERS" ]; then
    print_success "Headers CORS configurés"
    echo "$CORS_HEADERS"
else
    print_warning "Headers CORS non détectés"
fi

echo ""

# Test 4: Temps de réponse
print_info "Test 4: Mesure du temps de réponse..."
RESPONSE_TIME=$(curl -s -w "%{time_total}" -o /dev/null "$RAILWAY_URL/api/health")

if (( $(echo "$RESPONSE_TIME < 2.0" | bc -l) )); then
    print_success "Temps de réponse acceptable: ${RESPONSE_TIME}s"
else
    print_warning "Temps de réponse lent: ${RESPONSE_TIME}s"
fi

echo ""

# Test 5: Vérification SSL
print_info "Test 5: Vérification SSL..."
if [[ $RAILWAY_URL == https://* ]]; then
    SSL_INFO=$(curl -s -I "$RAILWAY_URL" | head -1)
    if [[ $SSL_INFO == *"200"* ]]; then
        print_success "SSL/HTTPS fonctionnel"
    else
        print_warning "Problème SSL détecté"
    fi
else
    print_warning "URL non HTTPS détectée"
fi

echo ""

# Test 6: Test de charge basique
print_info "Test 6: Test de charge basique (5 requêtes simultanées)..."
for i in {1..5}; do
    curl -s "$RAILWAY_URL/api/health" > /dev/null &
done
wait
print_success "Test de charge basique terminé"

echo ""

# Résumé
print_info "📊 Résumé du Test"
print_info "================="
print_info "URL testée: $RAILWAY_URL"
print_info "Temps de réponse: ${RESPONSE_TIME}s"

# Recommandations
echo ""
print_info "💡 Recommandations:"
echo "1. Vérifiez les logs Railway si des tests ont échoué"
echo "2. Configurez les variables d'environnement si nécessaire"
echo "3. Testez l'intégration avec le frontend Vercel"
echo "4. Surveillez les performances en production"

echo ""
print_success "🎉 Test de déploiement Railway terminé!"

# Nettoyage
rm -f /tmp/auth_response.json