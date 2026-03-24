// ─────────────────────────────────────────────────────────────
//  controllers/adminController.js — S8 (inclus pour complétude)
//  Stats agrégées MongoDB, gestion contenus et utilisateurs
// ─────────────────────────────────────────────────────────────
const User        = require('../models/User.model');
const Content     = require('../models/Content.model');
const Purchase    = require('../models/Purchase.model');
const Transaction = require('../models/Transaction.model');

// ─────────────────────────────────────────────────────────────
//  GET /api/admin/contents
// ─────────────────────────────────────────────────────────────
const getAllContents = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, isPublished } = req.query;
    const skip   = (parseInt(page) - 1) * parseInt(limit);
    const filter = {};
    if (isPublished !== undefined) filter.isPublished = isPublished === 'true';

    const total    = await Content.countDocuments(filter);
    const contents = await Content
      .find(filter)
      .populate('uploadedBy', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    return res.json({ contents, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────
//  PUT /api/admin/contents/:id — Modifier / publier
// ─────────────────────────────────────────────────────────────
const updateContent = async (req, res, next) => {
  try {
    const allowed = ['isPublished', 'featured', 'accessType', 'price', 'title', 'description'];
    const update  = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) update[f] = req.body[f]; });

    const content = await Content.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!content) return res.status(404).json({ message: 'Contenu introuvable' });

    return res.json({ message: 'Contenu mis à jour', content });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────
//  DELETE /api/admin/contents/:id
// ─────────────────────────────────────────────────────────────
const deleteContent = async (req, res, next) => {
  try {
    const content = await Content.findByIdAndDelete(req.params.id);
    if (!content) return res.status(404).json({ message: 'Contenu introuvable' });
    return res.json({ message: 'Contenu supprimé' });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────
//  GET /api/admin/stats — Statistiques agrégées
// ─────────────────────────────────────────────────────────────
const getStats = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      premiumUsers,
      totalContents,
      totalViewsAgg,
      topPurchasedContents,
      recentPurchasesAgg
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isPremium: true }),
      Content.countDocuments({ isPublished: true }),
      Content.aggregate([{ $group: { _id: null, total: { $sum: '$viewCount' } } }]),
      Purchase.aggregate([
        { $group: { _id: '$contentId', totalSales: { $sum: 1 }, totalRevenue: { $sum: '$amount' } } },
        { $sort: { totalSales: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'contents', localField: '_id', foreignField: '_id', as: 'content' } },
        { $unwind: '$content' },
        { $project: {
          title:        '$content.title',
          thumbnail:    '$content.thumbnail',
          totalSales:   1,
          totalRevenue: 1
        }}
      ]),
      Transaction.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo }, status: 'succeeded' } },
        { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$amount' } } }
      ])
    ]);

    const totalViews = totalViewsAgg[0]?.total || 0;
    const recentData = recentPurchasesAgg[0] || { count: 0, revenue: 0 };

    return res.json({
      totalUsers,
      premiumUsers,
      totalContents,
      totalViews,
      topPurchasedContents,
      recentPurchases30d:  recentData.count,
      revenueSimulated30d: recentData.revenue
    });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────
//  GET /api/admin/users
// ─────────────────────────────────────────────────────────────
const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role } = req.query;
    const skip   = (parseInt(page) - 1) * parseInt(limit);
    const filter = role ? { role } : {};
    const total  = await User.countDocuments(filter);

    const users = await User
      .find(filter)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    return res.json({ users, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────
//  PUT /api/admin/users/:id — Activer/désactiver
// ─────────────────────────────────────────────────────────────
const updateUser = async (req, res, next) => {
  try {
    const allowed = ['isActive', 'role'];
    const update  = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) update[f] = req.body[f]; });

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });

    return res.json({ message: 'Utilisateur mis à jour', user });
  } catch (err) { next(err); }
};

module.exports = { getAllContents, updateContent, deleteContent, getStats, getUsers, updateUser };
