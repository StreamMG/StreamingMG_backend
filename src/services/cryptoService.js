// ============================================================
// services/cryptoService.js — Service de cryptographie
// S4 (HLS + Fingerprint) · S6 (AES-256-GCM + URL signée)
// ============================================================
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// ── FINGERPRINT ─────────────────────────────────────────────
const computeFingerprint = (req) => {
  const components = [
    req.headers['user-agent'] || '',
    req.ip || '',
    req.cookies?.sessionId || ''
  ].join('|');
  return crypto.createHash('sha256').update(components).digest('hex');
};

// ── TOKENS HLS ──────────────────────────────────────────────
const generateHlsToken = (contentId, userId, fingerprint) => {
  return jwt.sign(
    { contentId, userId, fingerprint },
    process.env.HLS_TOKEN_SECRET,
    { expiresIn: parseInt(process.env.HLS_TOKEN_EXPIRY) || 600 }
  );
};

const verifyHlsToken = (token, req) => {
  const payload = jwt.verify(token, process.env.HLS_TOKEN_SECRET);
  const currentFingerprint = computeFingerprint(req);
  if (payload.fingerprint !== currentFingerprint) {
    const err = new Error('Fingerprint mismatch');
    err.status = 403;
    throw err;
  }
  return payload;
};

// ── AES-256-GCM ─────────────────────────────────────────────
const generateAesKey = () => crypto.randomBytes(32); // 256 bits
const generateIv = () => crypto.randomBytes(16);      // 128 bits

const encryptAes256Gcm = (data, key, iv) => {
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return { encrypted, authTag };
};

const decryptAes256Gcm = (encryptedData, key, iv, authTag) => {
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encryptedData), decipher.final()]);
};

// ── URLs SIGNÉES ─────────────────────────────────────────────
const signDownloadUrl = (filePath, contentId, expirySeconds) => {
  const secs   = expirySeconds || parseInt(process.env.SIGNED_URL_EXPIRY) || 900;
  const expiry = Date.now() + secs * 1000;
  const signature = crypto
    .createHmac('sha256', process.env.SIGNED_URL_SECRET)
    .update(`${filePath}|${expiry}`)
    .digest('hex');
  const rawBase = process.env.BASE_URL || 'http://localhost:3001';
  const baseUrl = rawBase.split(',')[0].trim();
  const signedUrl =
    `${baseUrl}/private/${contentId}` +
    `?expires=${expiry}&sig=${signature}`;
  return { signedUrl, expiry };
};

const verifySignedUrl = (contentId, expires, sig) => {
  if (Date.now() > parseInt(expires)) return false;
  const filePath = `uploads/private/${contentId}_src.mp4`;
  const expectedSig = crypto
    .createHmac('sha256', process.env.SIGNED_URL_SECRET)
    .update(`${filePath}|${expires}`)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expectedSig, 'hex'));
  } catch {
    return false;
  }
};

module.exports = {
  computeFingerprint,
  generateHlsToken,
  verifyHlsToken,
  generateAesKey,
  generateIv,
  encryptAes256Gcm,
  decryptAes256Gcm,
  signDownloadUrl,
  verifySignedUrl
};
