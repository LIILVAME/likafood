# 🚨 Résolution des Erreurs de Déploiement Railway

## 🔍 Problème Identifié

D'après les logs Railway, le problème principal est que Railway essaie de construire le projet depuis la racine qui contient le frontend React, au lieu du dossier `backend` qui contient l'API Node.js.

### Erreurs Observées
- `React Hook useEffect has missing dependencies`
- `npm error path /usr/src/app`
- `npm error command failed`
- Problèmes avec `react-hooks/exhaustive-deps`

## ✅ Solutions Appliquées

### 1. Configuration Railway Corrigée

J'ai mis à jour le fichier `railway.json` pour spécifier le contexte Docker correct :

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "backend/Dockerfile",
    "dockerContext": "backend"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**Changement clé** : Ajout de `"dockerContext": "backend"` pour que Railway utilise le dossier backend comme contexte de construction.

## 🛠️ Étapes de Résolution

### Option 1 : Redéploiement Automatique

1. **Commit les changements** :
   ```bash
   git add railway.json
   git commit -m "fix: correct Railway docker context for backend deployment"
   git push
   ```

2. **Railway redéploiera automatiquement** avec la nouvelle configuration.

### Option 2 : Déploiement Manuel via CLI

```bash
# Installer Railway CLI si pas déjà fait
npm install -g @railway/cli

# Se connecter
railway login

# Lier le projet
railway link

# Déployer
railway up
```

### Option 3 : Configuration Alternative (Si le problème persiste)

Si Railway continue à avoir des problèmes, vous pouvez créer un `railway.toml` dans le dossier `backend` :

```toml
[build]
builder = "dockerfile"
dockerfilePath = "Dockerfile"

[deploy]
startCommand = "npm start"
healthcheckPath = "/api/health"
healthcheckTimeout = 100
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

## 🔧 Vérifications Supplémentaires

### 1. Variables d'Environnement Railway

Assurez-vous que ces variables sont configurées dans Railway :

```bash
# Base de données
MONGODB_URI=mongodb+srv://...

# JWT
JWT_SECRET=votre_secret_jwt_long_et_securise
JWT_REFRESH_SECRET=votre_refresh_secret_long_et_securise

# Twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# Application
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://votre-frontend.vercel.app
CORS_ORIGIN=https://votre-frontend.vercel.app
```

### 2. Test du Dockerfile Backend

Pour tester localement :

```bash
# Aller dans le dossier backend
cd backend

# Construire l'image Docker
docker build -t likafood-backend .

# Tester l'image
docker run -p 5000:3000 likafood-backend
```

### 3. Vérification des Dépendances

Vérifier que le `package.json` du backend est correct :

```bash
cd backend
npm install
npm start
```

## 🚨 Si le Problème Persiste

### Solution Alternative : Déploiement Séparé

1. **Créer un nouveau service Railway** uniquement pour le backend
2. **Connecter directement le dossier backend** au lieu de la racine
3. **Utiliser le Dockerfile sans configuration JSON**

### Commandes de Debug

```bash
# Voir les logs Railway en temps réel
railway logs

# Voir les logs avec filtre d'erreur
railway logs --filter="error"

# Redéployer manuellement
railway up --detach
```

## 📋 Checklist de Vérification

- [ ] `railway.json` mis à jour avec `dockerContext`
- [ ] Variables d'environnement configurées dans Railway
- [ ] Dockerfile backend fonctionnel
- [ ] Pas de fichiers frontend dans le contexte de build
- [ ] Port 3000 exposé dans le Dockerfile
- [ ] Healthcheck configuré sur `/api/health`

## 🎯 Résultat Attendu

Après ces corrections, Railway devrait :
1. ✅ Construire uniquement le backend Node.js
2. ✅ Ignorer les fichiers React du frontend
3. ✅ Démarrer l'API sur le port correct
4. ✅ Répondre au healthcheck `/api/health`

## 📞 Support

Si le problème persiste après ces corrections :
1. Vérifiez les logs Railway pour de nouveaux messages d'erreur
2. Testez le Dockerfile localement
3. Vérifiez que toutes les variables d'environnement sont définies

---

**Note** : Cette correction sépare clairement le backend du frontend pour éviter les conflits de dépendances React lors du déploiement Railway.