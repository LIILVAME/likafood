#!/usr/bin/env node

/**
 * Script de test complet pour l'environnement de développement
 * Vérifie que tous les composants fonctionnent correctement
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

class DevEnvironmentTester {
  constructor() {
    this.results = {
      environment: [],
      backend: [],
      frontend: [],
      database: [],
      tests: []
    };
    this.backendProcess = null;
    this.frontendProcess = null;
  }

  log(category, message, status = 'info') {
    const timestamp = new Date().toISOString();
    const statusIcon = {
      'success': '✅',
      'error': '❌',
      'warning': '⚠️',
      'info': 'ℹ️'
    }[status] || 'ℹ️';
    
    console.log(`[${timestamp}] ${statusIcon} ${message}`);
    this.results[category].push({ message, status, timestamp });
  }

  async checkEnvironmentVariables() {
    this.log('environment', 'Vérification des variables d\'environnement...');
    
    const requiredEnvVars = [
      'NODE_ENV',
      'PORT',
      'MONGODB_URI',
      'JWT_ACCESS_SECRET',
      'JWT_REFRESH_SECRET',
      'FRONTEND_URL'
    ];

    const envPath = path.join(__dirname, 'backend', '.env');
    
    if (!fs.existsSync(envPath)) {
      this.log('environment', 'Fichier .env manquant dans le backend', 'error');
      return false;
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        envVars[key.trim()] = value.trim();
      }
    });

    let allPresent = true;
    requiredEnvVars.forEach(varName => {
      if (!envVars[varName]) {
        this.log('environment', `Variable manquante: ${varName}`, 'error');
        allPresent = false;
      } else {
        this.log('environment', `Variable présente: ${varName}`, 'success');
      }
    });

    return allPresent;
  }

  async checkDependencies() {
    this.log('environment', 'Vérification des dépendances...');
    
    const checkPackageJson = (dir, name) => {
      const packagePath = path.join(__dirname, dir, 'package.json');
      if (!fs.existsSync(packagePath)) {
        this.log('environment', `package.json manquant dans ${name}`, 'error');
        return false;
      }
      
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      const nodeModulesPath = path.join(__dirname, dir, 'node_modules');
      
      if (!fs.existsSync(nodeModulesPath)) {
        this.log('environment', `node_modules manquant dans ${name}`, 'warning');
        return false;
      }
      
      this.log('environment', `Dépendances ${name} installées`, 'success');
      return true;
    };

    const backendDeps = checkPackageJson('backend', 'backend');
    const frontendDeps = checkPackageJson('.', 'frontend');
    
    return backendDeps && frontendDeps;
  }

  async startBackend() {
    return new Promise((resolve, reject) => {
      this.log('backend', 'Démarrage du serveur backend...');
      
      const backendPath = path.join(__dirname, 'backend');
      this.backendProcess = spawn('npm', ['run', 'dev'], {
        cwd: backendPath,
        stdio: 'pipe'
      });

      let started = false;
      const timeout = setTimeout(() => {
        if (!started) {
          this.log('backend', 'Timeout lors du démarrage du backend', 'error');
          reject(new Error('Backend startup timeout'));
        }
      }, 30000);

      this.backendProcess.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Server running on port') || output.includes('ready to accept connections')) {
          clearTimeout(timeout);
          if (!started) {
            started = true;
            this.log('backend', 'Backend démarré avec succès', 'success');
            resolve();
          }
        }
      });

      this.backendProcess.stderr.on('data', (data) => {
        const error = data.toString();
        if (error.includes('Error') || error.includes('EADDRINUSE')) {
          clearTimeout(timeout);
          this.log('backend', `Erreur backend: ${error}`, 'error');
          if (!started) {
            reject(new Error(error));
          }
        }
      });

      this.backendProcess.on('error', (error) => {
        clearTimeout(timeout);
        this.log('backend', `Erreur de processus backend: ${error.message}`, 'error');
        if (!started) {
          reject(error);
        }
      });
    });
  }

  async testBackendEndpoints() {
    this.log('backend', 'Test des endpoints backend...');
    
    const baseURL = 'http://localhost:5001/api';
    const endpoints = [
      { path: '/health', method: 'GET', expectedStatus: 200 },
      { path: '/auth/register', method: 'POST', expectedStatus: 400, data: {} },
      { path: '/dishes', method: 'GET', expectedStatus: 200 }
    ];

    for (const endpoint of endpoints) {
      try {
        const config = {
          method: endpoint.method,
          url: `${baseURL}${endpoint.path}`,
          timeout: 5000,
          validateStatus: () => true // Accept all status codes
        };

        if (endpoint.data) {
          config.data = endpoint.data;
        }

        const response = await axios(config);
        
        if (response.status === endpoint.expectedStatus) {
          this.log('backend', `✓ ${endpoint.method} ${endpoint.path} - Status: ${response.status}`, 'success');
        } else {
          this.log('backend', `✗ ${endpoint.method} ${endpoint.path} - Expected: ${endpoint.expectedStatus}, Got: ${response.status}`, 'warning');
        }
      } catch (error) {
        this.log('backend', `✗ ${endpoint.method} ${endpoint.path} - Error: ${error.message}`, 'error');
      }
    }
  }

  async startFrontend() {
    return new Promise((resolve, reject) => {
      this.log('frontend', 'Démarrage du serveur frontend...');
      
      this.frontendProcess = spawn('npm', ['start'], {
        cwd: __dirname,
        stdio: 'pipe',
        env: { ...process.env, BROWSER: 'none' }
      });

      let started = false;
      const timeout = setTimeout(() => {
        if (!started) {
          this.log('frontend', 'Timeout lors du démarrage du frontend', 'error');
          reject(new Error('Frontend startup timeout'));
        }
      }, 60000);

      this.frontendProcess.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('webpack compiled') || output.includes('Local:')) {
          clearTimeout(timeout);
          if (!started) {
            started = true;
            this.log('frontend', 'Frontend démarré avec succès', 'success');
            resolve();
          }
        }
      });

      this.frontendProcess.stderr.on('data', (data) => {
        const error = data.toString();
        if (error.includes('Error') && !error.includes('warning')) {
          this.log('frontend', `Erreur frontend: ${error}`, 'error');
        }
      });

      this.frontendProcess.on('error', (error) => {
        clearTimeout(timeout);
        this.log('frontend', `Erreur de processus frontend: ${error.message}`, 'error');
        if (!started) {
          reject(error);
        }
      });
    });
  }

  async testFrontendAccess() {
    this.log('frontend', 'Test d\'accès au frontend...');
    
    try {
      const response = await axios.get('http://localhost:3000', { timeout: 10000 });
      if (response.status === 200) {
        this.log('frontend', 'Frontend accessible', 'success');
        return true;
      }
    } catch (error) {
      this.log('frontend', `Frontend inaccessible: ${error.message}`, 'error');
      return false;
    }
  }

  async runBackendTests() {
    return new Promise((resolve) => {
      this.log('tests', 'Exécution des tests backend...');
      
      const backendPath = path.join(__dirname, 'backend');
      const testProcess = spawn('npm', ['test'], {
        cwd: backendPath,
        stdio: 'pipe'
      });

      let output = '';
      testProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      testProcess.stderr.on('data', (data) => {
        output += data.toString();
      });

      testProcess.on('close', (code) => {
        if (code === 0) {
          this.log('tests', 'Tests backend réussis', 'success');
        } else {
          this.log('tests', 'Tests backend échoués', 'error');
        }
        
        // Parse test results
        const lines = output.split('\n');
        lines.forEach(line => {
          if (line.includes('✓') || line.includes('✗') || line.includes('PASS') || line.includes('FAIL')) {
            this.log('tests', line.trim(), line.includes('✓') || line.includes('PASS') ? 'success' : 'error');
          }
        });
        
        resolve(code === 0);
      });
    });
  }

  async runFrontendTests() {
    return new Promise((resolve) => {
      this.log('tests', 'Exécution des tests frontend...');
      
      const testProcess = spawn('npm', ['test', '--', '--watchAll=false'], {
        cwd: __dirname,
        stdio: 'pipe',
        env: { ...process.env, CI: 'true' }
      });

      let output = '';
      testProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      testProcess.stderr.on('data', (data) => {
        output += data.toString();
      });

      testProcess.on('close', (code) => {
        if (code === 0) {
          this.log('tests', 'Tests frontend réussis', 'success');
        } else {
          this.log('tests', 'Tests frontend échoués', 'error');
        }
        resolve(code === 0);
      });
    });
  }

  cleanup() {
    this.log('environment', 'Nettoyage des processus...');
    
    if (this.backendProcess) {
      this.backendProcess.kill('SIGTERM');
    }
    
    if (this.frontendProcess) {
      this.frontendProcess.kill('SIGTERM');
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('           RAPPORT DE TEST ENVIRONNEMENT DEV');
    console.log('='.repeat(60));
    
    Object.entries(this.results).forEach(([category, results]) => {
      console.log(`\n📋 ${category.toUpperCase()}:`);
      
      const success = results.filter(r => r.status === 'success').length;
      const errors = results.filter(r => r.status === 'error').length;
      const warnings = results.filter(r => r.status === 'warning').length;
      
      console.log(`   ✅ Succès: ${success}`);
      console.log(`   ❌ Erreurs: ${errors}`);
      console.log(`   ⚠️  Avertissements: ${warnings}`);
      
      if (errors > 0) {
        console.log('   Erreurs détaillées:');
        results.filter(r => r.status === 'error').forEach(r => {
          console.log(`     - ${r.message}`);
        });
      }
    });
    
    const totalErrors = Object.values(this.results)
      .flat()
      .filter(r => r.status === 'error').length;
    
    console.log('\n' + '='.repeat(60));
    if (totalErrors === 0) {
      console.log('🎉 ENVIRONNEMENT DE DÉVELOPPEMENT PRÊT!');
      console.log('Toutes les vérifications sont passées avec succès.');
    } else {
      console.log('⚠️  PROBLÈMES DÉTECTÉS');
      console.log(`${totalErrors} erreur(s) doivent être corrigées.`);
    }
    console.log('='.repeat(60));
  }

  async run() {
    try {
      console.log('🚀 Démarrage des tests d\'environnement de développement...\n');
      
      // 1. Vérifications préliminaires
      await this.checkEnvironmentVariables();
      await this.checkDependencies();
      
      // 2. Démarrage des services
      await this.startBackend();
      await new Promise(resolve => setTimeout(resolve, 3000)); // Attendre que le backend soit stable
      
      // 3. Tests backend
      await this.testBackendEndpoints();
      
      // 4. Démarrage frontend
      await this.startFrontend();
      await new Promise(resolve => setTimeout(resolve, 5000)); // Attendre que le frontend soit stable
      
      // 5. Tests frontend
      await this.testFrontendAccess();
      
      // 6. Tests unitaires
      await this.runBackendTests();
      await this.runFrontendTests();
      
    } catch (error) {
      this.log('environment', `Erreur critique: ${error.message}`, 'error');
    } finally {
      this.cleanup();
      this.generateReport();
    }
  }
}

// Gestion des signaux pour cleanup
process.on('SIGINT', () => {
  console.log('\n🛑 Interruption détectée, nettoyage...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Terminaison détectée, nettoyage...');
  process.exit(0);
});

// Exécution du test
if (require.main === module) {
  const tester = new DevEnvironmentTester();
  tester.run().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Erreur fatale:', error.message);
    process.exit(1);
  });
}

module.exports = DevEnvironmentTester;