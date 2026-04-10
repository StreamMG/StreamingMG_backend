const logger = require('../utils/logger');

module.exports = (req, res, next) => {
  if (process.env.ENABLE_DETAILED_LOGS === 'true') {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      let userId = 'anonymous';
      if (req.user && req.user.id) userId = req.user.id;
      else if (req.hlsPayload && req.hlsPayload.userId) userId = req.hlsPayload.userId;

      logger.info(`[HTTP] ${req.method} ${req.originalUrl} | Status: ${res.statusCode} | ${duration}ms`, {
        ip: req.ip,
        user: userId,
        userAgent: req.headers['user-agent']
      });
    });
  }
  next();
};
