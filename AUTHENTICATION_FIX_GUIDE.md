# Guide de Correction de l'Authentification

## Problèmes Identifiés et Corrigés

### 1. Erreur "Phone number, OTP code, and type are required"

**Problème :** Le backend attendait 3 paramètres (`phoneNumber`, `code`, `type`) mais le frontend n'envoyait que 2 (`phoneNumber`, `otp`).

**Solution :** 
- Mis à jour `authService.js` pour envoyer le bon format :
  ```javascript
  // Avant
  { phoneNumber, otp }
  
  // Après
  { phoneNumber, code: otp, type: 'login' }
  ```

### 2. Confusion entre Login et Registration OTP

**Problème :** Le même endpoint et la même méthode étaient utilisés pour la vérification OTP après inscription et après login.

**Solution :**
- Ajouté une nouvelle méthode `verifyOTP()` dans `authService.js`
- Mis à jour `AuthContext.js` pour inclure `verifyOTP`
- Modifié `Login.js` pour distinguer entre :
  - **Login existant** : utilise `login()` avec `type: 'login'`
  - **Nouvelle inscription** : utilise `verifyOTP()` avec `type: 'registration'`

### 3. Gestion des États dans le Frontend

**Ajouté :**
- État `isRegistration` pour tracker si l'utilisateur vient de s'inscrire
- Logique conditionnelle dans `handleOtpSubmit`

## Comment Tester Maintenant

### Test 1: Nouvelle Inscription
1. Entrez un **nouveau numéro** (non utilisé avant)
2. Vous devriez voir "User not found. Please register first."
3. Remplissez les informations business
4. Cliquez "S'inscrire et Envoyer OTP"
5. Entrez l'OTP reçu (vérifiez les logs backend)
6. ✅ **Devrait fonctionner maintenant**

### Test 2: Login Utilisateur Existant
1. Entrez un numéro **déjà enregistré**
2. Vous devriez passer directement à l'étape OTP
3. Entrez l'OTP reçu
4. ✅ **Devrait fonctionner maintenant**

## Vérification des Logs Backend

Pour voir les OTP générés :
```bash
cd backend
npm run dev
```

Cherchez dans les logs :
```
[SMS Service] Sending OTP XXXXXX to +XXXXXXXXXXXX for registration
```

## Endpoints Backend Utilisés

1. **Registration :** `POST /api/auth/register`
   - Crée l'utilisateur et envoie OTP
   
2. **Login Request :** `POST /api/auth/request-otp` 
   - Envoie OTP pour utilisateur existant
   
3. **OTP Verification :** `POST /api/auth/verify-otp`
   - Vérifie l'OTP et authentifie
   - Paramètres : `{ phoneNumber, code, type }`

## Fichiers Modifiés

- ✅ `src/services/authService.js` - Ajout méthode `verifyOTP` et correction paramètres
- ✅ `src/services/AuthContext.js` - Ajout `verifyOTP` au contexte
- ✅ `src/pages/Login.js` - Logique conditionnelle pour login vs registration

## Prochaines Étapes

1. **Tester les deux flux** (inscription + login)
2. **Vérifier la persistance** de la session
3. **Tester la déconnexion**
4. **Implémenter la gestion d'erreurs** plus fine
5. **Ajouter la validation côté frontend** pour les OTP

## Dépannage

Si vous voyez encore des erreurs :

1. **Vérifiez que le backend tourne :** `http://127.0.0.1:5001/api/health`
2. **Consultez les logs backend** pour voir les OTP générés
3. **Vérifiez la console browser** pour les erreurs réseau
4. **Testez avec un nouveau numéro** pour éviter les conflits

---

**Status :** ✅ Corrections appliquées - Prêt pour les tests