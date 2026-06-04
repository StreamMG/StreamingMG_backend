#!/bin/bash

echo "📥 Téléchargement des fichiers de test..."

# Téléchargement d'une vidéo courte (échantillon de 5 secondes)
curl -L -o test-movie.mp4 https://github.com/intel-iot-devkit/sample-videos/raw/master/classroom.mp4

# Téléchargement d'une image de couverture
curl -L -o test-poster.jpg https://picsum.photos/400/600

echo "✅ Fichiers prêts : test-movie.mp4 et test-poster.jpg"

# Vérification des dépendances Node.js avant de lancer l'upload
if [ ! -d "node_modules/axios" ]; then
    echo "📦 Installation des dépendances JS..."
    npm install axios form-data
fi

echo "🚀 Lancement de l'upload via Node.js..."
node upload-test.js
