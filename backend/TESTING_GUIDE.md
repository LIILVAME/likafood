# Guide de Test - LikaFood MVP

## Configuration des Tests

### Dépendances Installées
- **Jest**: Framework de test principal
- **Supertest**: Pour tester les API HTTP
- **mongodb-memory-server**: Base de données MongoDB en mémoire pour les tests

### Structure des Tests
```
__tests__/
├── setup.js              # Configuration globale des tests
└── routes/
    ├── basic.test.js      # Tests basiques d'existence des routes
    ├── auth.test.js       # Tests d'authentification (simplifiés)
    └── dishes.test.js     # Tests des plats (simplifiés)
```

## Scripts de Test Disponibles

```bash
# Exécuter tous les tests
npm test

# Exécuter les tests en mode watch
npm run test:watch

# Exécuter les tests avec couverture de code
npm run test:coverage
```

## État Actuel des Tests

### Tests Fonctionnels ✅
- **basic.test.js**: Tests d'existence des routes
  - Vérifie que les routes ne retournent pas 404
  - Vérifie le format JSON des réponses
  - Vérifie la structure de base des réponses

### Tests Partiels ⚠️
- **auth.test.js**: Tests d'authentification simplifiés
- **dishes.test.js**: Tests des plats simplifiés

## Améliorations Recommandées

### 1. Configuration de l'Environnement de Test
```javascript
// Dans .env.test
NODE_ENV=test
JWT_SECRET=test_secret_key
MONGODB_URI=mongodb://localhost:27017/likafood_test
PORT=3001
```

### 2. Mocking des Services Externes
```javascript
// Mock pour les services SMS/Email
jest.mock('../services/smsService', () => ({
  sendOTP: jest.fn().mockResolvedValue({ success: true })
}));
```

### 3. Tests d'Intégration Complets
```javascript
// Exemple de test d'intégration
describe('User Registration Flow', () => {
  it('should register, request OTP, and verify successfully', async () => {
    // 1. Register user
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(validUserData);
    
    // 2. Request OTP
    const otpResponse = await request(app)
      .post('/api/auth/request-otp')
      .send({ phoneNumber: validUserData.phoneNumber });
    
    // 3. Verify OTP (with mocked OTP)
    const verifyResponse = await request(app)
      .post('/api/auth/verify-otp')
      .send({ phoneNumber: validUserData.phoneNumber, otp: '123456' });
    
    expect(verifyResponse.status).toBe(200);
  });
});
```

### 4. Tests de Performance
```javascript
// Test de charge basique
describe('Performance Tests', () => {
  it('should handle multiple concurrent requests', async () => {
    const promises = Array(10).fill().map(() => 
      request(app).get('/api/dishes')
    );
    
    const responses = await Promise.all(promises);
    responses.forEach(response => {
      expect(response.status).toBe(200);
    });
  });
});
```

### 5. Tests de Sécurité
```javascript
// Tests de sécurité
describe('Security Tests', () => {
  it('should prevent SQL injection attempts', async () => {
    const maliciousData = {
      email: "test'; DROP TABLE users; --",
      password: 'password'
    };
    
    const response = await request(app)
      .post('/api/auth/login')
      .send(maliciousData);
    
    expect(response.status).toBe(400);
  });
});
```

## Prochaines Étapes

1. **Configurer les mocks** pour les services externes (SMS, Email)
2. **Implémenter les tests d'intégration** complets
3. **Ajouter les tests de validation** des données
4. **Créer les tests de performance** et de charge
5. **Implémenter les tests de sécurité**
6. **Configurer la couverture de code** avec des seuils minimums

## Commandes Utiles

```bash
# Exécuter un fichier de test spécifique
npm test basic.test.js

# Exécuter les tests en mode verbose
npm test -- --verbose

# Exécuter les tests avec un pattern spécifique
npm test -- --testNamePattern="Auth"

# Générer un rapport de couverture HTML
npm run test:coverage -- --coverageReporters=html
```

## Notes Importantes

- Les tests actuels sont simplifiés pour éviter les dépendances externes
- La base de données en mémoire est configurée mais nécessite une configuration complète
- Les services externes (SMS, Email) doivent être mockés pour les tests
- La configuration JWT doit être adaptée pour l'environnement de test