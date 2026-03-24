// ─────────────────────────────────────────────────────────────
//  services/content.service.js — catalogue, view count
// ─────────────────────────────────────────────────────────────
const Content = require('../models/Content.model');

exports.getCatalog = async ({ page = 1, limit = 20, type, category, accessType, search }) => {
  const filter = { isPublished: true };
  if (type)       filter.type       = type;
  if (category)   filter.category   = category;
  if (accessType) filter.accessType = accessType;
  if (search)     filter.$text      = { $search: search };

  const skip  = (parseInt(page) - 1) * parseInt(limit);
  const total = await Content.countDocuments(filter);
  const docs  = await Content.find(filter)
    .select('-lessons -subtitles')
    .sort(search ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  return { docs, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) };
};

exports.incrementView = async (contentId) => {
  await Content.findByIdAndUpdate(contentId, { $inc: { viewCount: 1 } });
};
