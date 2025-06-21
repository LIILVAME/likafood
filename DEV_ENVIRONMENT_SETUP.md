# Guide de Configuration de l'Environnement de Développement

## 🎯 Objectif

Ce guide vous aide à configurer un environnement de développement robuste pour LikaFood MVP, garantissant que tous les tests fonctionnent sans bugs.

## 📋 Prérequis

### Logiciels Requis
- **Node.js** >= 14.0.0
- **npm** >= 6.0.0
- **MongoDB** (local ou Atlas)
- **Git**

### Vérification des Prérequis
```bash
node --version
npm --version
mongod --version  # Si MongoDB local
git --version
```

## 🚀 Installation Rapide

### 1. Cloner et Installer les Dépendances
```bash
# Cloner le projet
git clone <repository-url>
cd likafood-mvp

# Installer les dépendances frontend
npm install

# Installer les dépendances backend
cd backend
npm install
cd ..
```

### 2. Configuration des Variables d'Environnement

#### Backend (.env)
Créer `backend/.env` avec :
```env
# Serveur
PORT=5001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Base de données
MONGODB_URI=mongodb://localhost:27017/likafood-dev
# Ou pour MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/likafood-dev

# JWT Secrets
JWT_ACCESS_SECRET=your-super-secret-access-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# OTP/SMS (Développement)
OTP_EXPIRY_MINUTES=5
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=your-twilio-phone

# Pour les tests, désactiver Twilio
DISABLE_SMS=true
```

#### Frontend (.env)
Créer `.env` avec :
```env
REACT_APP_API_URL=http://localhost:5001/api
REACT_APP_ENV=development
```

### 3. Configuration de la Base de Données

#### Option A: MongoDB Local
```bash
# Démarrer MongoDB
mongod

# Dans un autre terminal, créer la base de données
mongo
use likafood-dev
db.createCollection("users")
exit
```

#### Option B: MongoDB Atlas
1. Créer un compte sur [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Créer un cluster gratuit
3. Obtenir la chaîne de connexion
4. Remplacer `MONGODB_URI` dans `.env`

## 🧪 Configuration des Tests

### 1. Tests Backend

Le backend utilise Jest avec une base de données en mémoire :

```bash
cd backend

# Exécuter tous les tests
npm test

# Tests avec couverture
npm run test:coverage

# Tests en mode watch
npm run test:watch

# Tests spécifiques
npm run test:auth
npm run test:dishes
```

### 2. Tests Frontend

```bash
# Tests unitaires
npm test

# Tests avec couverture
npm run test:coverage

# Tests E2E avec Cypress
npx cypress open
# ou
npx cypress run
```

### 3. Configuration des Tests E2E

Cypress est configuré pour :
- Base URL: `http://localhost:3000`
- API URL: `http://localhost:5001/api`
- Nettoyage automatique de la base de données
- Données de test prédéfinies

## 🔧 Scripts de Développement

### Scripts Principaux

```bash
# Démarrer le backend (depuis /backend)
npm run dev

# Démarrer le frontend (depuis /)
npm start

# Démarrer les deux simultanément
npm run dev:full  # Si configuré
```

### Script de Test Complet

```bash
# Tester tout l'environnement
node test-dev-environment.js
```

Ce script vérifie :
- ✅ Variables d'environnement
- ✅ Dépendances installées
- ✅ Démarrage backend/frontend
- ✅ Connectivité API
- ✅ Tests unitaires
- ✅ Tests d'intégration

## 🐛 Résolution des Problèmes Courants

### Problème: Port déjà utilisé
```bash
# Trouver le processus utilisant le port
lsof -i :5001
lsof -i :3000

# Tuer le processus
kill -9 <PID>
```

### Problème: Erreurs de connexion MongoDB
```bash
# Vérifier que MongoDB fonctionne
mongo --eval "db.adminCommand('ismaster')"

# Redémarrer MongoDB
sudo service mongod restart  # Linux
brew services restart mongodb-community  # macOS
```

### Problème: Tests qui échouent
```bash
# Nettoyer les caches
npm run clean
rm -rf node_modules package-lock.json
npm install

# Réinitialiser la base de données de test
npm run test:reset-db
```

### Problème: Variables d'environnement
```bash
# Vérifier que les fichiers .env existent
ls -la backend/.env
ls -la .env

# Vérifier le contenu
cat backend/.env
```

## 📊 Monitoring et Debugging

### 1. Logs de Développement

```bash
# Backend logs
cd backend && npm run dev

# Frontend logs
npm start

# Logs détaillés
DEBUG=* npm run dev  # Backend
```

### 2. Outils de Debug

- **Backend**: Utiliser `console.log()` ou debugger Node.js
- **Frontend**: React DevTools + Chrome DevTools
- **Base de données**: MongoDB Compass ou Studio 3T
- **API**: Postman ou Insomnia

### 3. Tests de Performance

```bash
# Test de charge API
npm run test:load

# Analyse bundle frontend
npm run analyze
```

## 🔒 Sécurité en Développement

### Variables Sensibles
- ❌ **Jamais** commiter les fichiers `.env`
- ✅ Utiliser des valeurs de test pour les clés API
- ✅ Générer des JWT secrets uniques
- ✅ Utiliser HTTPS en production

### Exemple de génération de secrets
```bash
# Générer des secrets JWT
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 📝 Checklist de Validation

### Avant de Commencer le Développement
- [ ] Node.js et npm installés
- [ ] MongoDB accessible
- [ ] Fichiers `.env` configurés
- [ ] Dépendances installées
- [ ] Tests backend passent
- [ ] Tests frontend passent
- [ ] Backend démarre sur port 5001
- [ ] Frontend démarre sur port 3000
- [ ] API accessible depuis le frontend

### Avant de Pousser du Code
- [ ] Tous les tests passent
- [ ] Pas de console.log oubliés
- [ ] Code formaté (Prettier)
- [ ] Linting passé (ESLint)
- [ ] Variables sensibles supprimées
- [ ] Documentation mise à jour

## 🚀 Workflow de Développement Recommandé

### 1. Démarrage Quotidien
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
npm start

# Terminal 3: Tests en watch mode
npm run test:watch
```

### 2. Développement de Nouvelles Fonctionnalités
1. Créer une branche feature
2. Écrire les tests d'abord (TDD)
3. Implémenter la fonctionnalité
4. Vérifier que tous les tests passent
5. Tester manuellement
6. Créer une Pull Request

### 3. Debugging
1. Reproduire le bug
2. Écrire un test qui échoue
3. Corriger le code
4. Vérifier que le test passe
5. Vérifier la régression

## 📚 Ressources Supplémentaires

- [Documentation Jest](https://jestjs.io/docs/getting-started)
- [Documentation Cypress](https://docs.cypress.io/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

## 🆘 Support

En cas de problème :
1. Consulter ce guide
2. Vérifier les logs d'erreur
3. Exécuter `node test-dev-environment.js`
4. Consulter la documentation des outils
5. Demander de l'aide à l'équipe

---

**Note**: Ce guide est maintenu à jour. Signalez tout problème ou amélioration possible.