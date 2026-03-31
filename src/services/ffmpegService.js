// ─────────────────────────────────────────────────────────────
//  services/ffmpegService.js — Pipeline transcoding HLS (WINDOWS FIX)
// ─────────────────────────────────────────────────────────────
const ffmpeg = require('fluent-ffmpeg');
const path   = require('path');
const fs     = require('fs');

/**
 * Transcode un fichier MP4 en flux HLS (segments .ts de 10s)
 * * Génère dans /uploads/hls/<contentId>/ :
 * - index.m3u8     (manifest)
 * - seg000.ts      (segments)
 */
const transcodeToHls = (inputPath, contentId) => {
  return new Promise((resolve, reject) => {
    // FIX WINDOWS : On utilise path.resolve et process.cwd() pour pointer 
    // vers la racine réelle du projet, peu importe où se trouve ce fichier service.
    const rootDir = process.cwd();
    const outputDir = path.resolve(rootDir, 'uploads', 'hls', contentId);
    
    // Création récursive du dossier de destination
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputManifest = path.join(outputDir, 'index.m3u8');
    const segmentPattern = path.join(outputDir, 'seg%03d.ts');

    console.log(`🎬 Démarrage Transcoding [${contentId}]`);
    console.log(`📂 Destination : ${outputDir}`);

    ffmpeg(inputPath)
      .outputOptions([
        '-codec: copy',         // Pas de ré-encodage (Ultra rapide)
        '-start_number 0',
        '-hls_time 10',         // Segments de 10 secondes
        '-hls_list_size 0',     // Playlist complète (VOD)
        '-hls_segment_filename', segmentPattern, // Chemin absolu des segments
        '-f hls'
      ])
      .output(outputManifest)
      .on('start', (commandLine) => {
        // Optionnel : décommenter pour voir la commande ffmpeg réelle en cas de pépin
        // console.log('Spawned Ffmpeg with command: ' + commandLine);
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          process.stdout.write(`\r   Progression: ${Math.round(progress.percent)}%`);
        }
      })
      .on('end', () => {
        console.log(`\n✅ HLS terminé avec succès : ${contentId}`);
        // Retourne le chemin relatif pour la base de données
        resolve(`/hls/${contentId}/index.m3u8`);
      })
      .on('error', (err) => {
        console.error(`\n❌ Erreur ffmpeg [${contentId}]:`, err.message);
        reject(err);
      })
      .run();
  });
};

/**
 * Obtient la durée d'une vidéo via ffprobe
 */
const getVideoDuration = (inputPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) return reject(err);
      resolve(Math.floor(metadata.format.duration || 0));
    });
  });
};

/**
 * Supprime les fichiers HLS d'un contenu
 */
const deleteHlsFiles = (contentId) => {
  const rootDir = process.cwd();
  const dir = path.resolve(rootDir, 'uploads', 'hls', contentId);
  
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
    console.log(`🗑️  HLS supprimé physiquement : ${contentId}`);
  }
};

module.exports = { transcodeToHls, getVideoDuration, deleteHlsFiles };