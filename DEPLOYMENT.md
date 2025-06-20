# 🚀 Guide de Déploiement LikaFood MVP

Ce guide vous accompagne dans le déploiement professionnel de l'application LikaFood MVP.

## 📋 Prérequis

### Outils Requis
- **Git**
- **Node.js** (v18+)
- **npm** ou **yarn**

### Comptes Nécessaires
- **GitHub** (pour le code source)
- **Render** (pour le backend)
- **Vercel** (pour le frontend)
- **Twilio** (pour l'authentification SMS)
- **MongoDB Atlas** (pour la base de données en production)

## 🔧 Configuration Initiale

### 1. Variables d'Environnement

Copiez et configurez les fichiers d'environnement :

```bash
# Fichier principal .env
cp .env.example .env

# Fichier backend .env
cp backend/.env.example backend/.env
```

### 2. Configuration Twilio

1. Créez un compte sur [Twilio](https://www.twilio.com/)
2. Obtenez vos identifiants :
   - Account SID
   - Auth Token
   - Numéro de téléphone Twilio
3. Ajoutez-les dans `backend/.env`

### 3. Configuration MongoDB

#### Développement Local
```env
MONGODB_URI=mongodb://localhost:27017/likafood
```

#### Production (MongoDB Atlas)
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/likafood
```

## 🏠 Déploiement Local

### Méthode 1: Script de Déploiement (Recommandé)

```bash
# Démarrer tous les services
./deploy.sh local start

# Voir les logs
./deploy.sh local logs

# Arrêter les services
./deploy.sh local stop

# Nettoyer complètement
./deploy.sh local clean
```

### Méthode 2: Développement Local

```bash
# Terminal 1: Backend
cd backend
npm install
npm run dev

# Terminal 2: Frontend
npm install
npm start

# Terminal 3: MongoDB (si local)
mongod
```

## ☁️ Déploiement en Production

### 1. Préparation GitHub

```bash
# Initialiser le dépôt (déjà fait)
git add .
git commit -m "Initial commit: LikaFood MVP ready for production"
git branch -M main
git remote add origin https://github.com/VOTRE_USERNAME/likafood-mvp.git
git push -u origin main
```

### 2. Configuration des Secrets GitHub

Dans votre dépôt GitHub, allez dans **Settings > Secrets and variables > Actions** et ajoutez :

```
JWT_SECRET=votre_secret_jwt_super_securise
TWILIO_ACCOUNT_SID=votre_twilio_sid
TWILIO_AUTH_TOKEN=votre_twilio_token
TWILIO_PHONE_NUMBER=votre_numero_twilio
MONGODB_URI=votre_uri_mongodb_atlas
```

### 3. Déploiement Automatique

Le pipeline CI/CD se déclenche automatiquement :
- **Push sur `main`** → Tests + Build + Deploy staging
- **Tag `v*`** → Deploy production
- **Manual trigger** → Deploy sur environnement choisi

### 4. Déploiement sur Render et Vercel

Pour le déploiement en production, consultez le guide détaillé :
- [Guide de déploiement Render/Vercel](./RENDER_VERCEL_DEPLOYMENT.md)
- [Migration Railway vers Render](./MIGRATION_RAILWAY_TO_RENDER.md)

#### Scripts de déploiement

```bash
# Déployer le backend sur Render
./deploy-render.sh

# Déployer le frontend sur Vercel
./deploy-vercel.sh

# Tester le déploiement Render
./test-render-deployment.sh
```

## 🔍 Monitoring et Maintenance

### Vérification de Santé

```bash
# Health check local (développement)
curl http://localhost:3000/api/health

# Health check production Render
curl https://votre-app.onrender.com/api/health

# Tester le déploiement Render
./test-render-deployment.sh
```

### Sauvegarde MongoDB

Pour MongoDB Atlas (production), utilisez les outils de sauvegarde intégrés :
- Sauvegarde automatique activée par défaut
- Point-in-time recovery disponible
- Export manuel via MongoDB Compass ou CLI

### Mise à Jour

```bash
# Pull dernières modifications
git pull origin main

# Redéployer
./deploy.sh production restart
```

## 🛡️ Sécurité

### Checklist Sécurité

- [ ] Variables d'environnement sécurisées
- [ ] JWT secret fort (32+ caractères)
- [ ] HTTPS activé en production
- [ ] MongoDB avec authentification
- [ ] Rate limiting activé
- [ ] Headers de sécurité configurés
- [ ] Logs de sécurité activés

### Bonnes Pratiques

1. **Jamais de secrets dans le code**
2. **Rotation régulière des clés**
3. **Monitoring des accès**
4. **Sauvegardes automatiques**
5. **Tests de sécurité réguliers**

## 🚨 Dépannage

### Problèmes Courants

#### Port déjà utilisé
```bash
# Trouver le processus
lsof -i :3000

# Tuer le processus
kill -9 PID
```

#### Problème MongoDB Atlas
```bash
# Vérifier la connexion
ping cluster0.xxxxx.mongodb.net

# Tester la connexion depuis l'application
node -e "const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI).then(() => console.log('Connected')).catch(err => console.error(err))"
```

#### Problèmes de déploiement
```bash
# Vérifier les logs Render
# Aller sur dashboard.render.com > votre service > Logs

# Vérifier les logs Vercel
# Aller sur vercel.com/dashboard > votre projet > Functions
```

### Logs Utiles

```bash
# Logs locaux
npm run dev:backend  # Backend logs
npm run dev:frontend # Frontend logs

# Logs production : consultez les dashboards Render et Vercel
```

## 📊 Performance

### Optimisations Recommandées

1. **CDN** pour les assets statiques
2. **Redis** pour le cache
3. **Load balancer** pour la haute disponibilité
4. **Monitoring** avec Prometheus/Grafana
5. **Alertes** automatiques

### Métriques à Surveiller

- Temps de réponse API
- Utilisation CPU/RAM
- Connexions MongoDB
- Erreurs 4xx/5xx
- Uptime des services

## 🎯 Prochaines Étapes

1. **Domaine personnalisé** + SSL
2. **Monitoring avancé**
3. **Sauvegardes automatiques**
4. **Tests de charge**
5. **Documentation API**
6. **Analytics utilisateur**

---

## 📞 Support

Pour toute question ou problème :
1. Vérifiez les logs
2. Consultez ce guide
3. Ouvrez une issue GitHub
4. Contactez l'équipe technique

**Bonne mise en production ! 🚀**