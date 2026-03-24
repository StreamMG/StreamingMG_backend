// ─────────────────────────────────────────────────────────────
//  services/provider.service.js — Gestion contenus fournisseur
// ─────────────────────────────────────────────────────────────
const Content = require('../models/Content.model');

exports.getMyContents = async (userId, page = 1, limit = 20) => {
  const skip  = (parseInt(page) - 1) * parseInt(limit);
  const total = await Content.countDocuments({ uploadedBy: userId });
  const docs  = await Content.find({ uploadedBy: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();
  return { docs, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) };
};
