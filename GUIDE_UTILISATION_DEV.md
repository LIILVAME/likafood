# Guide d'Utilisation - Environnement de Développement LikaFood

## 🚀 Démarrage Rapide

### Démarrage Automatique (Recommandé)

Pour démarrer l'environnement de développement complet :

```bash
./start-dev-environment.sh
```

Ce script :
- ✅ Vérifie et arrête les processus existants
- ✅ Démarre automatiquement le backend (port 5001)
- ✅ Démarre automatiquement le frontend (port 3000)
- ✅ Teste la connectivité des services
- ✅ Affiche les informations de connexion
- ✅ Surveille les services en continu

### Arrêt de l'Environnement

```bash
./stop-dev-environment.sh
```

Ou utilisez `Ctrl+C` dans le terminal où le script de démarrage est en cours.

## 🔑 Authentification en Mode Test

### OTP Générique pour les Tests

Pour faciliter les tests, un **OTP générique** a été configuré :

**Code OTP de test : `123456`**

Ce code fonctionne :
- ✅ En environnement de développement (`NODE_ENV=development`)
- ✅ En environnement de test (`NODE_ENV=test`)
- ❌ **PAS en production** (sécurité)

### Comment Tester l'Authentification

1. **Accédez au frontend** : http://localhost:3000
2. **Entrez un numéro de téléphone** (format : +33123456789)
3. **Cliquez sur "Envoyer OTP"**
4. **Entrez le code** : `123456`
5. **Validez** - Vous serez connecté automatiquement

## 🌐 URLs de l'Application

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | Interface utilisateur React |
| **Backend API** | http://localhost:5001 | API REST |
| **Health Check** | http://localhost:5001/api/health | Vérification de l'état du serveur |
| **Documentation API** | http://localhost:5001/api-docs | Documentation Swagger |
| **Monitoring** | http://localhost:5001/api/monitoring/health | Surveillance système |

## 📋 Démarrage Manuel (Alternative)

Si vous préférez démarrer les services manuellement :

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
# Dans un nouveau terminal, depuis la racine
npm install
npm start
```

## 🔧 Résolution des Problèmes

### Problème : Ports Occupés

**Symptôme** : Erreur "Port already in use"

**Solution** :
```bash
# Arrêter tous les processus
./stop-dev-environment.sh

# Ou forcer l'arrêt des ports
lsof -ti:3000 | xargs kill -9
lsof -ti:5001 | xargs kill -9

# Redémarrer
./start-dev-environment.sh
```

### Problème : Backend Non Accessible

**Symptôme** : `curl: (7) Failed to connect to localhost port 5001`

**Solutions** :
1. Vérifier les logs : `tail -f backend.log`
2. Vérifier MongoDB : Assurez-vous que MongoDB est accessible
3. Redémarrer : `./start-dev-environment.sh`

### Problème : Frontend Non Accessible

**Symptôme** : Page non trouvée sur http://localhost:3000

**Solutions** :
1. Vérifier les logs : `tail -f frontend.log`
2. Vérifier les dépendances : `npm install`
3. Redémarrer : `./start-dev-environment.sh`

### Problème : OTP Non Accepté

**Vérifications** :
- ✅ Utilisez le code `123456`
- ✅ Vérifiez que `NODE_ENV=development`
- ✅ Vérifiez les logs backend pour les messages d'erreur

## 📝 Logs et Débogage

### Fichiers de Logs

- **Backend** : `backend.log`
- **Frontend** : `frontend.log`

### Commandes Utiles

```bash
# Suivre les logs en temps réel
tail -f backend.log
tail -f frontend.log

# Voir les dernières lignes
tail -20 backend.log
tail -20 frontend.log

# Tester l'API
curl http://localhost:5001/api/health

# Vérifier les ports utilisés
lsof -i :3000
lsof -i :5001
```

## 🔄 Workflow de Développement Recommandé

1. **Démarrage** :
   ```bash
   ./start-dev-environment.sh
   ```

2. **Développement** :
   - Modifiez le code (auto-reload activé)
   - Testez avec l'OTP `123456`
   - Surveillez les logs si nécessaire

3. **Tests** :
   - Frontend : http://localhost:3000
   - API : http://localhost:5001/api/health
   - Authentification avec OTP `123456`

4. **Arrêt** :
   ```bash
   ./stop-dev-environment.sh
   ```

## ⚠️ Notes Importantes

### Sécurité
- 🔒 L'OTP générique `123456` ne fonctionne **QUE** en développement
- 🔒 En production, seuls les vrais OTP SMS sont acceptés
- 🔒 Ne jamais commiter de vraies clés API dans le code

### Performance
- 📊 Le monitoring système est activé automatiquement
- 📊 Les logs incluent les temps de réponse
- 📊 Auto-reload activé pour le développement

### Base de Données
- 🗄️ MongoDB est requis pour le backend
- 🗄️ Les données de test sont automatiquement créées
- 🗄️ Port MongoDB par défaut : 27017

## 🆘 Support

En cas de problème :

1. **Vérifiez les logs** : `tail -f backend.log frontend.log`
2. **Redémarrez l'environnement** : `./stop-dev-environment.sh && ./start-dev-environment.sh`
3. **Vérifiez les ports** : `lsof -i :3000 -i :5001`
4. **Consultez ce guide** pour les solutions communes

---

**✨ Environnement de développement optimisé pour LikaFood !**