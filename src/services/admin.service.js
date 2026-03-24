// ─────────────────────────────────────────────────────────────
//  services/admin.service.js — statistiques agrégées
// ─────────────────────────────────────────────────────────────
const User        = require('../models/User.model');
const Content     = require('../models/Content.model');
const Purchase    = require('../models/Purchase.model');
const Transaction = require('../models/Transaction.model');

exports.getStats = async () => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [totalUsers, premiumUsers, totalContents, viewsAgg, topPurchases, recentAgg] =
    await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isPremium: true }),
      Content.countDocuments({ isPublished: true }),
      Content.aggregate([{ $group: { _id: null, total: { $sum: '$viewCount' } } }]),
      Purchase.aggregate([
        { $group: { _id: '$contentId', totalSales: { $sum: 1 }, revenue: { $sum: '$amount' } } },
        { $sort: { totalSales: -1 } }, { $limit: 5 },
        { $lookup: { from: 'contents', localField: '_id', foreignField: '_id', as: 'content' } },
        { $unwind: '$content' },
        { $project: { title: '$content.title', thumbnail: '$content.thumbnail', totalSales: 1, revenue: 1 } }
      ]),
      Transaction.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo }, status: 'succeeded' } },
        { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$amount' } } }
      ])
    ]);
  return {
    totalUsers, premiumUsers, totalContents,
    totalViews: viewsAgg[0]?.total || 0,
    topPurchases,
    last30d: recentAgg[0] || { count: 0, revenue: 0 }
  };
};
