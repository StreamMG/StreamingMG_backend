const Content = require('../models/Content.model');

// ─────────────────────────────────────────────────────────────
//  GET /api/audio/:contentId/url
//  checkAccess déjà validé → l'utilisateur a le droit
// ─────────────────────────────────────────────────────────────
exports.getAudioUrl = async (req, res, next) => {
  try {
    const { id } = req.params;

    const content = await Content.findById(id);
    if (!content) return res.status(404).json({ message: 'Contenu introuvable' });

    // Selon le modèle, l'audio est dans audioPath ou filePath
    const path = content.audioPath || content.filePath;
    
    if (!path) {
      return res.status(404).json({ message: 'Fichier audio non disponible' });
    }

    // On retourne le chemin relatif normalisé
    // Assurez-vous que le chemin commence bien par /uploads/ (ex: /uploads/audio/music.mp3)
    let url = path.startsWith('/') ? path : `/${path}`;

    return res.json({ url });
  } catch (err) {
    next(err);
  }
};
