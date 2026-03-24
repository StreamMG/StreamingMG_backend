// ─────────────────────────────────────────────────────────────
//  services/hls.service.js — Token HLS + fingerprint
// ─────────────────────────────────────────────────────────────
const { generateHlsToken, generateFingerprint, verifyHlsToken } = require('../utils/crypto.utils');

exports.issueHlsToken = (contentId, userId, req) => {
  const fingerprint = generateFingerprint(
    req.headers['user-agent'] || '',
    req.ip || '',
    req.cookies?.sessionId || ''
  );
  return { token: generateHlsToken(contentId, userId, fingerprint), fingerprint };
};

exports.validateToken = (token, req) => {
  const fingerprint = generateFingerprint(
    req.headers['user-agent'] || '',
    req.ip || '',
    req.cookies?.sessionId || ''
  );
  return verifyHlsToken(token, fingerprint);
};
