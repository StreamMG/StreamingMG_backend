// ─────────────────────────────────────────────────────────────
//  services/ffmpegService.js — Pipeline transcoding HLS (FLEXIBLE)
// ─────────────────────────────────────────────────────────────
require("dotenv").config(); // Assure-toi que dotenv est chargé
const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const fs = require("fs");
const logger = require("../utils/logger");

// ⚙️ CONFIGURATION SOUPLE VIA .ENV
if (process.env.FFMPEG_PATH) {
  ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
  logger.info(`🛠️  Chemin FFmpeg forcé via .env : ${process.env.FFMPEG_PATH}`);
}

if (process.env.FFPROBE_PATH) {
  ffmpeg.setFfprobePath(process.env.FFPROBE_PATH);
}

/**
 * Transcode un fichier MP4 en flux HLS
 */
const transcodeToHls = (inputPath, contentId) => {
  return new Promise((resolve, reject) => {
    const rootDir = process.cwd();
    const outputDir = path.resolve(rootDir, "uploads", "hls", contentId);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputManifest = path.join(outputDir, "index.m3u8");
    const segmentPattern = path.join(outputDir, "seg%03d.ts");

    console.log(`🎬 Démarrage Transcoding [${contentId}]`);

    ffmpeg(inputPath)
      .outputOptions([
        "-codec: copy",
        "-start_number 0",
        "-hls_time 10",
        "-hls_list_size 0",
        "-hls_segment_filename",
        segmentPattern,
        "-f hls",
      ])
      .output(outputManifest)
      .on("start", (cmd) => {
        logger.info(`🎬 Commande FFmpeg : ${cmd}`);
      })
      .on("end", () => {
        logger.info(`✅ HLS terminé: ${contentId}`);
        resolve(`/hls/${contentId}/index.m3u8`);
      })
      .on("error", (err) => {
        logger.error(`❌ ffmpeg error [${contentId}]: ${err.message}`);
        reject(err);
      })
      .run();
  });
};

/**
 * Obtient la durée via ffprobe
 */
const getVideoDuration = (inputPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) {
        logger.error(`❌ ffprobe error: ${err.message}`);
        return reject(err);
      }
      resolve(Math.floor(metadata.format.duration || 0));
    });
  });
};

/**
 * Supprime les fichiers HLS
 */
const deleteHlsFiles = (contentId) => {
  const rootDir = process.cwd();
  const dir = path.resolve(rootDir, "uploads", "hls", contentId);

  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
    logger.info(`🗑️ HLS supprimé: ${contentId}`);
  }
};

module.exports = { transcodeToHls, getVideoDuration, deleteHlsFiles };
