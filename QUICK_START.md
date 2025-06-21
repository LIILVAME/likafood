# 🚀 Guide de Démarrage Rapide - LikaFood MVP

## ⚡ Démarrage en 5 Minutes

### 1. Installation des Dépendances
```bash
# Installer les dépendances frontend
npm install

# Installer les dépendances backend
cd backend && npm install && cd ..
```

### 2. Configuration Rapide
```bash
# Copier les fichiers d'environnement
cp backend/.env.example backend/.env
cp .env.example .env

# Éditer backend/.env avec vos valeurs
# Les valeurs par défaut fonctionnent pour le développement local
```

### 3. Démarrage des Services

#### Option A: Démarrage Séparé (Recommandé pour le debug)
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
npm start
```

#### Option B: Démarrage Simultané
```bash
# Un seul terminal
npm run dev:full
```

### 4. Vérification
- **Backend**: http://localhost:5001/api/health
- **Frontend**: http://localhost:3000
- **API Docs**: http://localhost:5001/api-docs

## 🧪 Tests Rapides

```bash
# Tests backend
cd backend && npm test

# Tests frontend
npm test

# Test complet de l'environnement
npm run test:dev-env
```

## 🔧 Commandes Utiles

```bash
# Formatage du code
npm run format

# Vérification du code
npm run lint

# Tests E2E
npm run cypress:open

# Nettoyage
npm run clean
```

## 🐛 Résolution Rapide des Problèmes

### Port déjà utilisé
```bash
# Tuer les processus sur les ports
lsof -ti:3000 | xargs kill -9
lsof -ti:5001 | xargs kill -9
```

### Erreurs de dépendances
```bash
# Réinstaller les dépendances
rm -rf node_modules package-lock.json
npm install

cd backend
rm -rf node_modules package-lock.json
npm install
```

### Base de données
```bash
# Vérifier MongoDB
mongo --eval "db.adminCommand('ismaster')"

# Ou utiliser MongoDB Atlas (recommandé)
# Mettre à jour MONGODB_URI dans backend/.env
```

## 📋 Checklist de Validation

- [ ] ✅ Backend démarre sur port 5001
- [ ] ✅ Frontend démarre sur port 3000
- [ ] ✅ API accessible depuis le frontend
- [ ] ✅ Tests backend passent
- [ ] ✅ Tests frontend passent
- [ ] ✅ Base de données connectée

## 🎯 Prêt pour le Développement !

Votre environnement est maintenant configuré pour un développement sans bugs. Consultez `DEV_ENVIRONMENT_SETUP.md` pour plus de détails.

---

**Besoin d'aide ?** Consultez les logs d'erreur ou exécutez `npm run test:dev-env` pour un diagnostic complet.