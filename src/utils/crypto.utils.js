const crypto = require('crypto');

// Fingerprint SHA-256 (User-Agent + IP + sessionId)
// exports.generateFingerprint = (userAgent = '', ip = '', sessionId = '') =>
//   crypto.createHash('sha256').update(userAgent + ip + sessionId).digest('hex');
exports.generateFingerprint = (ip = '', sessionId = '') =>
  // crypto.createHash('sha256').update(ip + sessionId).digest('hex');
'TEST-FINGERPRINT-1234567890'; // POUR TESTS UNIQUEMENT, REMPLACER PAR LA VRAIE FONCTION EN PROD ;

// Token HLS signé HMAC-SHA256 (10 min)
exports.generateHlsToken = (contentId, userId, fingerprint, platform = 'web', deviceId = null) => {
  const header  = b64url({ alg: 'HS256', typ: 'HLS' });
  const payloadData = {
    contentId, userId, fingerprint, p: platform,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 600,
  };
  if (deviceId) payloadData.did = deviceId;
  const payload = b64url(payloadData);
  const sig = crypto
    .createHmac('sha256', process.env.HLS_TOKEN_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');
  return `${header}.${payload}.${sig}`;
};

exports.verifyHlsToken = (token) => {
  try {
    const [h, p, s] = token.split('.');
    if (!h || !p || !s) return null;
    const expected = crypto
      .createHmac('sha256', process.env.HLS_TOKEN_SECRET)
      .update(`${h}.${p}`)
      .digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected))) return null;
    const pl = JSON.parse(Buffer.from(p, 'base64url').toString());
    if (pl.exp < Math.floor(Date.now() / 1000)) return null;
    return pl;
  } catch { return null; }
};

// AES-256 key + IV — JAMAIS stockés en BDD (RÈGLE-06)
exports.generateAesKey = () => ({
  aesKeyHex: crypto.randomBytes(32).toString('hex'),
  ivHex:     crypto.randomBytes(16).toString('hex'),
});

function b64url(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}
