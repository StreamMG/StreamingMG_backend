// scripts/generate-hls.js
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

const contentId = '69c388d4af6d7f7c64be3294';
const inputPath = path.join(__dirname, '../uploads/private/test-video.mp4');
const outputDir = path.join(__dirname, `../uploads/hls/${contentId}`);
// D:\StreamingMG_backend\uploads\private

// Créer le dossier de sortie
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Générer les fichiers HLS
ffmpeg(inputPath)
  .outputOptions([
    '-codec: copy',
    '-start_number 0',
    '-hls_time 10',
    '-hls_list_size 0',
    '-f hls'
  ])
  .output(path.join(outputDir, 'index.m3u8'))
  .on('end', () => {
    console.log('✅ Fichiers HLS générés avec succès !');
    
    // Mettre à jour la base de données
    // UPDATE contents SET hlsPath = '/uploads/hls/69c388d4af6d7f7c64be3294/index.m3u8' WHERE _id = '69c388d4af6d7f7c64be3294'
  })
  .on('error', (err) => {
    console.error('❌ Erreur lors de la génération HLS:', err);
  })
  .run();