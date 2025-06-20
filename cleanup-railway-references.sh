#!/bin/bash

# Script de nettoyage des références Railway
# Ce script vérifie qu'aucune référence Railway ne subsiste dans le projet

echo "🔍 Vérification des références Railway restantes..."

# Recherche de toutes les références Railway (insensible à la casse)
echo "\n📋 Recherche de références Railway :"
grep -r -i "railway" . --exclude-dir=node_modules --exclude-dir=.git --exclude="*.log" --exclude="cleanup-railway-references.sh" --exclude="MIGRATION_RAILWAY_TO_RENDER.md" || echo "✅ Aucune référence Railway trouvée"

# Vérification des fichiers de configuration
echo "\n🔧 Vérification des fichiers de configuration :"
files_to_check=(
    "package.json"
    "backend/package.json"
    "frontend/package.json"
    ".env"
    ".env.local"
    ".env.production"
    "backend/.env"
    "frontend/.env"
)

for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        if grep -i "railway" "$file" > /dev/null 2>&1; then
            echo "⚠️  Référence Railway trouvée dans $file"
        else
            echo "✅ $file - OK"
        fi
    fi
done

# Vérification des scripts de déploiement
echo "\n🚀 Vérification des scripts de déploiement :"
if [ -f "deploy-render.sh" ]; then
    echo "✅ deploy-render.sh existe"
else
    echo "❌ deploy-render.sh manquant"
fi

if [ -f "deploy-vercel.sh" ]; then
    echo "✅ deploy-vercel.sh existe"
else
    echo "❌ deploy-vercel.sh manquant"
fi

if [ -f "test-render-deployment.sh" ]; then
    echo "✅ test-render-deployment.sh existe"
else
    echo "❌ test-render-deployment.sh manquant"
fi

# Vérification des fichiers de configuration Render/Vercel
echo "\n⚙️  Vérification des configurations Render/Vercel :"
config_files=(
    "render.yaml"
    "vercel.json"
    "backend/.env.render"
    "frontend/.env.vercel"
    "RENDER_VERCEL_DEPLOYMENT.md"
)

for file in "${config_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file existe"
    else
        echo "❌ $file manquant"
    fi
done

echo "\n🎉 Vérification terminée !"
echo "\n📖 Consultez RENDER_VERCEL_DEPLOYMENT.md pour les instructions de déploiement."
echo "📖 Consultez MIGRATION_RAILWAY_TO_RENDER.md pour le résumé de la migration."