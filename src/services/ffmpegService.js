// ─────────────────────────────────────────────────────────────
//  services/ffmpegService.js — Pipeline transcoding HLS (WINDOWS FIX)
// ─────────────────────────────────────────────────────────────
const ffmpeg = require('fluent-ffmpeg');
const path   = require('path');
const fs     = require('fs');
const logger = require('../utils/logger');

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
      .renice(10)
      .outputOptions([
        '-codec: copy',         // Pas de ré-encodage (Ultra rapide)
        '-start_number 0',
        '-hls_time 10',         // Segments de 10 secondes
        '-hls_list_size 0',     // Playlist complète (VOD)
        '-hls_segment_filename', segmentPattern, // Chemin absolu des segments
        '-f hls'
      ])
      .output(outputManifest)
      .on('start', (cmd) => {
        logger.info(`🎬 Transcoding démarré: ${contentId}`);
      })
      .on('progress', (progress) => {
        if (progress.percent && Math.round(progress.percent) % 10 === 0) {
           // Reduce log frequency to avoid spamming Winston transports
        }
      })
      .on('end', () => {
        logger.info(`✅ HLS transcoding terminé: ${contentId}`);
        resolve(`/hls/${contentId}/index.m3u8`);
      })
      .on('error', (err) => {
        logger.error(`❌ ffmpeg error [${contentId}]: ${err.message}`);
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
    logger.info(`🗑️ HLS supprimé: ${contentId}`);
  }
};

module.exports = { transcodeToHls, getVideoDuration, deleteHlsFiles };