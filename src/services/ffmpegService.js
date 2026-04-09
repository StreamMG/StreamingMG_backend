// ─────────────────────────────────────────────────────────────
//  services/ffmpegService.js — Pipeline transcoding HLS
//  MP4 → segments .ts de 10 secondes via fluent-ffmpeg
// ─────────────────────────────────────────────────────────────
const ffmpeg = require('fluent-ffmpeg');
const path   = require('path');
const fs     = require('fs');
const logger = require('../utils/logger');

/**
 * Transcode un fichier MP4 en flux HLS (segments .ts de 10s)
 * 
 * Génère dans /uploads/hls/<contentId>/ :
 *   - index.m3u8    (manifest)
 *   - seg000.ts     (segment 0-10s)
 *   - seg001.ts     ...
 *
 * @param {string} inputPath  - Chemin absolu vers le .mp4 source
 * @param {string} contentId  - ID MongoDB du contenu
 * @returns {Promise<string>} - Chemin relatif vers le manifest
 */
const transcodeToHls = (inputPath, contentId) => {
  return new Promise((resolve, reject) => {
    const outputDir = path.join(__dirname, `../../uploads/hls/${contentId}`);
    fs.mkdirSync(outputDir, { recursive: true });

    const outputManifest = path.join(outputDir, 'index.m3u8');

    ffmpeg(inputPath)
      .renice(10)
      .outputOptions([
        '-codec: copy',      // Pas de re-encodage → rapide
        '-start_number 0',
        '-hls_time 10',      // ← Segments de 10 secondes
        '-hls_list_size 0',  // Tous les segments dans le manifest
        '-hls_segment_filename', path.join(outputDir, 'seg%03d.ts'),
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
 * 
 * @param {string} inputPath - Chemin absolu vers le fichier
 * @returns {Promise<number>} - Durée en secondes (entier)
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
 * Supprime les fichiers HLS d'un contenu (lors de la suppression)
 *
 * @param {string} contentId
 */
const deleteHlsFiles = (contentId) => {
  const dir = path.join(__dirname, `../../uploads/hls/${contentId}`);
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
    logger.info(`🗑️ HLS supprimé: ${contentId}`);
  }
};

module.exports = { transcodeToHls, getVideoDuration, deleteHlsFiles };
