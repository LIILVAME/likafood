# Guide de Déploiement LikaFood MVP

Ce guide vous explique comment déployer votre application LikaFood sur Railway (backend) et Vercel (frontend) avec les nouvelles fonctionnalités d'authentification unifiée.

## 🚀 Nouvelles Fonctionnalités

### Authentification Unifiée
- **Connexion/Inscription automatique** : L'utilisateur saisit son numéro, l'application détermine automatiquement s'il faut se connecter ou créer un compte
- **Interface simplifiée** : Plus besoin de choisir entre "Se connecter" ou "S'inscrire"
- **Expérience utilisateur améliorée** : Processus fluide en une seule étape

### Route API Unifiée
- Nouvelle route : `POST /api/auth/login-or-register`
- Gère automatiquement les utilisateurs existants et nouveaux
- Retourne le type d'action effectuée (`login` ou `register`)

## 📋 Prérequis

- Compte Railway configuré
- Compte Vercel configuré
- Compte Twilio pour l'envoi de SMS
- Compte MongoDB Atlas (ou autre base de données MongoDB)

## 🛠️ Configuration Backend (Railway)

### 1. Variables d'Environnement Railway

Configurer les variables suivantes dans Railway :

```bash
# Base de données
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/likafood?retryWrites=true&w=majority

# JWT
JWT_SECRET=votre_jwt_secret_tres_long_et_securise
JWT_REFRESH_SECRET=votre_jwt_refresh_secret_tres_long_et_securise

# Twilio SMS
TWILIO_ACCOUNT_SID=votre_account_sid
TWILIO_AUTH_TOKEN=votre_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Application
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://votre-app.vercel.app

# Sécurité
CORS_ORIGIN=https://votre-app.vercel.app
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 2. Déploiement sur Railway

```bash
# 1. Connecter votre repository GitHub à Railway
# 2. Railway détectera automatiquement le Dockerfile dans /backend
# 3. Configurer les variables d'environnement
# 4. Déployer

# Ou via CLI Railway :
npm install -g @railway/cli
railway login
railway link
railway up
```

### 3. Vérification du Déploiement Backend

```bash
# Tester l'API de santé
curl https://votre-backend.railway.app/api/health

# Tester la nouvelle route d'authentification
curl -X POST https://votre-backend.railway.app/api/auth/login-or-register \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+33123456789"}'
```

## 🌐 Configuration Frontend (Vercel)

### 1. Variables d'Environnement Vercel

Configurer dans Vercel Dashboard ou via CLI :

```bash
# URL de l'API backend
REACT_APP_API_URL=https://votre-backend.railway.app/api

# Environnement
REACT_APP_ENVIRONMENT=production
```

### 2. Déploiement sur Vercel

```bash
# Via CLI Vercel
npm install -g vercel
vercel login
vercel --prod

# Ou connecter votre repository GitHub à Vercel Dashboard
```

### 3. Configuration Build Vercel

Le fichier `vercel.json` est déjà configuré :

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "REACT_APP_API_URL": "@react_app_api_url",
    "REACT_APP_ENVIRONMENT": "production"
  }
}
```

## 🔧 Scripts de Déploiement Automatisé

### Script de Déploiement Railway

```bash
#!/bin/bash
# deploy-railway.sh

echo "🚀 Déploiement Backend sur Railway..."

# Vérifier que Railway CLI est installé
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI n'est pas installé"
    echo "Installation: npm install -g @railway/cli"
    exit 1
fi

# Se connecter et déployer
railway login
railway link
railway up

echo "✅ Déploiement Railway terminé"
```

### Script de Déploiement Vercel

```bash
#!/bin/bash
# deploy-vercel.sh

echo "🌐 Déploiement Frontend sur Vercel..."

# Vérifier que Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI n'est pas installé"
    echo "Installation: npm install -g vercel"
    exit 1
fi

# Build et déployer
npm run build
vercel --prod

echo "✅ Déploiement Vercel terminé"
```

## 🧪 Tests Post-Déploiement

### 1. Test de l'Authentification Unifiée

```bash
# Test avec utilisateur existant (devrait retourner action: "login")
curl -X POST https://votre-backend.railway.app/api/auth/login-or-register \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+33123456789"
  }'

# Test avec nouvel utilisateur (devrait retourner action: "register")
curl -X POST https://votre-backend.railway.app/api/auth/login-or-register \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+33987654321",
    "businessName": "Mon Restaurant",
    "ownerName": "Jean Dupont"
  }'
```

### 2. Test Frontend

1. Ouvrir https://votre-app.vercel.app
2. Saisir un numéro de téléphone
3. Vérifier que l'interface s'adapte automatiquement
4. Tester l'envoi et la vérification d'OTP

## 🔍 Monitoring et Logs

### Railway Logs
```bash
# Voir les logs en temps réel
railway logs

# Logs avec filtre
railway logs --filter="error"
```

### Vercel Logs
```bash
# Voir les logs de déploiement
vercel logs https://votre-app.vercel.app
```

## 🚨 Résolution de Problèmes

### Problèmes Courants

1. **Erreur CORS**
   - Vérifier `CORS_ORIGIN` dans Railway
   - S'assurer que l'URL Vercel est correcte

2. **Erreur de connexion API**
   - Vérifier `REACT_APP_API_URL` dans Vercel
   - Tester l'endpoint `/api/health`

3. **Erreur SMS Twilio**
   - Vérifier les credentials Twilio
   - Vérifier le numéro de téléphone Twilio

4. **Erreur Base de Données**
   - Vérifier `MONGODB_URI`
   - Tester la connexion MongoDB

### Debug en Production

```bash
# Tester la santé de l'API
curl https://votre-backend.railway.app/api/health

# Tester la nouvelle route d'authentification
curl -X POST https://votre-backend.railway.app/api/auth/login-or-register \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+33123456789"}' \
  -v
```

## 📈 Optimisations Post-Déploiement

1. **Mise en cache**
   - Configurer le cache Vercel pour les assets statiques
   - Utiliser Redis pour le cache backend (optionnel)

2. **Monitoring**
   - Configurer des alertes Railway
   - Utiliser Vercel Analytics

3. **Sécurité**
   - Configurer un domaine personnalisé avec HTTPS
   - Mettre en place des rate limits appropriés

## 🎯 Prochaines Étapes

1. Tester l'application en production
2. Configurer un domaine personnalisé
3. Mettre en place un monitoring avancé
4. Optimiser les performances
5. Ajouter des fonctionnalités supplémentaires

---

**Note** : Ce guide couvre le déploiement avec les nouvelles fonctionnalités d'authentification unifiée. L'expérience utilisateur est maintenant plus fluide et intuitive.