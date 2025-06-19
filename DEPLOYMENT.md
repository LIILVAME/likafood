# 🚀 Guide de Déploiement LikaFood MVP

Ce guide vous accompagne dans le déploiement professionnel de l'application LikaFood MVP.

## 📋 Prérequis

### Outils Requis
- **Docker** (v20.10+)
- **Docker Compose** (v2.0+)
- **Git**
- **Node.js** (v18+) pour le développement local
- **npm** ou **yarn**

### Comptes Nécessaires
- **GitHub** (pour le code source)
- **Docker Hub** (pour les images)
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

### Méthode 2: Docker Compose Manuel

```bash
# Construire les images
docker-compose build

# Démarrer les services
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter
docker-compose down
```

### Méthode 3: Développement Sans Docker

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
DOCKER_USERNAME=votre_username_dockerhub
DOCKER_PASSWORD=votre_password_dockerhub
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

### 4. Déploiement Manuel sur Serveur

#### VPS/Serveur Dédié

```bash
# Sur le serveur
git clone https://github.com/VOTRE_USERNAME/likafood-mvp.git
cd likafood-mvp

# Configurer l'environnement
cp .env.example .env
cp backend/.env.example backend/.env
# Éditer les fichiers .env avec les vraies valeurs

# Déployer
./deploy.sh production start
```

#### Avec Reverse Proxy (Nginx)

```bash
# Activer le profil production avec SSL
docker-compose --profile production up -d
```

## 🔍 Monitoring et Maintenance

### Vérification de Santé

```bash
# Status des services
./deploy.sh local status

# Logs en temps réel
./deploy.sh local logs

# Health check manuel
curl http://localhost:3000/api/health
```

### Sauvegarde MongoDB

```bash
# Backup
docker exec likafood-mongodb mongodump --out /backup

# Restore
docker exec likafood-mongodb mongorestore /backup
```

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

#### Problème MongoDB
```bash
# Vérifier les logs
docker logs likafood-mongodb

# Redémarrer MongoDB
docker-compose restart mongodb
```

#### Images Docker corrompues
```bash
# Nettoyer complètement
./deploy.sh local clean
docker system prune -a

# Reconstruire
./deploy.sh local build
```

### Logs Utiles

```bash
# Logs application
docker logs likafood-backend
docker logs likafood-frontend

# Logs système
journalctl -u docker
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