/**
 * Retourne { skip, limit, page, pages } pour la pagination standard.
 */
exports.paginate = (query, total) => {
  const page  = Math.max(1, parseInt(query.page)  || 1);
  const limit = Math.min(100, parseInt(query.limit) || 20);
  const skip  = (page - 1) * limit;
  const pages = Math.ceil(total / limit);
  return { page, limit, skip, pages };
};
