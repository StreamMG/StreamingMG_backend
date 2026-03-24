// ─────────────────────────────────────────────────────────────
//  services/history.service.js
// ─────────────────────────────────────────────────────────────
const WatchHistory = require('../models/WatchHistory.model');

exports.upsert = async (userId, contentId, progressSeconds) => {
  return WatchHistory.findOneAndUpdate(
    { userId, contentId },
    { $set: { progressSeconds, lastWatchedAt: new Date() } },
    { upsert: true, new: true }
  );
};

exports.getForUser = async (userId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const total = await WatchHistory.countDocuments({ userId });
  const items = await WatchHistory.find({ userId })
    .populate('contentId', 'title thumbnail type duration')
    .sort({ lastWatchedAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  return { items, total };
};
