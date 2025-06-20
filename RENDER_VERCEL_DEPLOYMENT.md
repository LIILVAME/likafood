# 🚀 Guide de Déploiement LikaFood MVP

## Render (Backend) + Vercel (Frontend)

Ce guide vous explique comment déployer votre application LikaFood avec Render pour le backend et Vercel pour le frontend.

## 📋 Prérequis

- Compte GitHub configuré
- Compte Render configuré
- Compte Vercel configuré
- MongoDB Atlas configuré
- Compte Twilio configuré (pour SMS)

## 🛠️ Configuration Backend (Render)

### 1. Variables d'Environnement Render

Configurer les variables suivantes dans Render :

```bash
# Base de données
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/likafood

# Authentification
JWT_SECRET=votre_jwt_secret_super_securise_minimum_32_caracteres

# SMS/OTP (Twilio)
TWILIO_ACCOUNT_SID=votre_twilio_account_sid
TWILIO_AUTH_TOKEN=votre_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Configuration
NODE_ENV=production
PORT=10000
CORS_ORIGIN=https://votre-frontend.vercel.app

# Optionnel
LOG_LEVEL=info
```

### 2. Déploiement sur Render

1. **Connecter votre repository GitHub à Render**
2. **Créer un nouveau Web Service**
3. **Configurer le service :**
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node

### 3. Test du Backend

```bash
# Test de santé
curl https://votre-backend.onrender.com/api/health

# Test d'authentification
curl -X POST https://votre-backend.onrender.com/api/auth/login-or-register \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+33123456789"}'
```

## 🌐 Configuration Frontend (Vercel)

### 1. Variables d'Environnement Vercel

Configurer dans Vercel :

```bash
REACT_APP_API_URL=https://votre-backend.onrender.com/api
```

### 2. Déploiement sur Vercel

```bash
# Installation Vercel CLI
npm install -g vercel

# Déploiement
vercel --prod
```

Ou connecter directement votre repository GitHub à Vercel.

## 📁 Structure des Fichiers de Configuration

### Backend - render.yaml

Créez `render.yaml` à la racine :

```yaml
services:
  - type: web
    name: likafood-backend
    env: node
    buildCommand: cd backend && npm install
    startCommand: cd backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
```

### Frontend - vercel.json

Créez `vercel.json` à la racine :

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
  ]
}
```

## 🔧 Scripts de Déploiement

### Script de Déploiement Render

Créez `deploy-render.sh` :

```bash
#!/bin/bash

echo "🚀 Déploiement Backend sur Render..."

# Vérifier que le code est à jour
git add .
git commit -m "Deploy: Update before Render deployment" || true
git push origin main

echo "✅ Code poussé vers GitHub"
echo "📡 Render va automatiquement déployer le backend"
echo "🌐 Vérifiez le déploiement sur https://dashboard.render.com"
```

### Script de Déploiement Vercel

Créez `deploy-vercel.sh` :

```bash
#!/bin/bash

echo "🚀 Déploiement Frontend sur Vercel..."

# Vérifier que Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo "Installation de Vercel CLI..."
    npm install -g vercel
fi

# Build et déploiement
npm run build
vercel --prod

echo "✅ Déploiement Vercel terminé"
```

## 🧪 Tests de Déploiement

### Test Backend (Render)

```bash
# Test de santé
curl https://votre-backend.onrender.com/api/health

# Test d'authentification
curl -X POST https://votre-backend.onrender.com/api/auth/login-or-register \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+33123456789"}'
```

### Test Frontend (Vercel)

```bash
# Test de chargement
curl -I https://votre-frontend.vercel.app
```

## 🔍 Debugging

### Logs Render

1. Accédez à votre dashboard Render
2. Sélectionnez votre service
3. Consultez l'onglet "Logs"

### Logs Vercel

```bash
vercel logs
```

## 🚨 Résolution de Problèmes

### Backend ne démarre pas

- Vérifier les variables d'environnement dans Render
- Vérifier que `NODE_ENV=production`
- Consulter les logs Render pour plus de détails

### Frontend ne se connecte pas au Backend

- Vérifier `REACT_APP_API_URL` dans Vercel
- Vérifier `CORS_ORIGIN` dans Render
- Tester l'endpoint backend directement

## 📊 Monitoring

### Render

- Monitoring intégré dans le dashboard
- Alertes sur erreurs 5xx
- Métriques de performance

### Vercel

- Analytics intégrées
- Core Web Vitals
- Monitoring des erreurs

## 🔒 Sécurité

- ✅ HTTPS activé (automatique sur Render/Vercel)
- ✅ Variables d'environnement sécurisées
- ✅ CORS configuré correctement
- ✅ JWT avec secret sécurisé

## 📈 Performance

### Optimisations Render

1. **Caching** : Headers de cache appropriés
2. **Compression** : Gzip activé automatiquement
3. **CDN** : Distribution globale

### Optimisations Vercel

1. **Edge Functions** : Traitement à la périphérie
2. **Image Optimization** : Optimisation automatique des images
3. **Static Generation** : Pages pré-générées

## 🎯 Checklist de Déploiement

### Backend (Render)

- [ ] Repository connecté à Render
- [ ] Variables d'environnement configurées
- [ ] Build et déploiement réussis
- [ ] Endpoint `/api/health` accessible
- [ ] Tests d'authentification passants

### Frontend (Vercel)

- [ ] Repository connecté à Vercel
- [ ] `REACT_APP_API_URL` configurée
- [ ] Build et déploiement réussis
- [ ] Application accessible
- [ ] Connexion backend fonctionnelle

## 🔄 Workflow de Déploiement

1. **Développement local** → Tests
2. **Push vers GitHub** → Déclenchement automatique
3. **Render** → Déploiement backend
4. **Vercel** → Déploiement frontend
5. **Tests de production** → Validation

## 📞 Support

En cas de problème :

1. Consulter les logs Render/Vercel
2. Vérifier les variables d'environnement
3. Tester les endpoints individuellement
4. Consulter la documentation Render/Vercel

---

**Note** : Ce guide remplace complètement l'ancien déploiement Railway. Render offre une meilleure stabilité et des fonctionnalités plus avancées pour les applications Node.js.