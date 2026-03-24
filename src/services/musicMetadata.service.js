// ─────────────────────────────────────────────────────────────
//  services/musicMetadata.service.js — parsing ID3 audio
// ─────────────────────────────────────────────────────────────
exports.parse = async (filePath) => {
  try {
    const mm = await import('music-metadata');
    const meta = await mm.parseFile(filePath);
    return {
      duration:    Math.floor(meta.format.duration || 0),
      artist:      meta.common.artist || null,
      album:       meta.common.album  || null,
      trackNumber: meta.common.track?.no  || null,
    };
  } catch {
    return { duration: 0, artist: null, album: null, trackNumber: null };
  }
};
