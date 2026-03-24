// ─────────────────────────────────────────────────────────────
//  services/auth.service.js
//  RÈGLE-07 : Rotation systématique du refresh token
// ─────────────────────────────────────────────────────────────
const bcrypt       = require('bcryptjs');
const crypto       = require('crypto');
const User         = require('../models/User.model');
const RefreshToken = require('../models/RefreshToken.model');
const { generateJWT } = require('../utils/jwt.utils');

exports.register = async ({ username, email, password }) => {
  const dup = await User.findOne({ $or: [{ email }, { username }] });
  if (dup) {
    const field = dup.email === email ? 'email' : 'username';
    const e = new Error(field === 'email' ? 'Email déjà utilisé' : 'Username déjà utilisé');
    e.statusCode = 409;
    e.code = field === 'email' ? 'EMAIL_DUPLICATE' : 'USERNAME_DUPLICATE';
    throw e;
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ username, email, passwordHash, role: 'user' });
  return _buildResult(user);
};

exports.login = async ({ email, password }) => {
  const user = await User.findOne({ email, isActive: true });
  const ok = user && await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    const e = new Error('Identifiants incorrects');
    e.statusCode = 401; e.code = 'INVALID_CREDENTIALS'; throw e;
  }
  return _buildResult(user);
};

// RÈGLE-07 : Rotation — supprimer AVANT d'émettre le nouveau
exports.refresh = async (rawToken) => {
  const docs = await RefreshToken.find({ expiresAt: { $gt: new Date() } });
  let found = null;
  for (const doc of docs) {
    if (await bcrypt.compare(rawToken, doc.tokenHash)) { found = doc; break; }
  }
  if (!found) {
    const e = new Error('Session expirée'); e.statusCode = 401; e.code = 'INVALID_REFRESH_TOKEN'; throw e;
  }
  await RefreshToken.deleteOne({ _id: found._id }); // ← ROTATION
  const user = await User.findById(found.userId).select('username role isPremium premiumExpiry');
  return _buildResult(user);
};

exports.logout = async (rawToken) => {
  const docs = await RefreshToken.find({});
  for (const doc of docs) {
    if (await bcrypt.compare(rawToken, doc.tokenHash)) {
      await RefreshToken.deleteOne({ _id: doc._id }); break;
    }
  }
};

async function _buildResult(user) {
  const token = generateJWT({ id: user._id, role: user.role });
  const raw   = crypto.randomBytes(64).toString('hex');
  const hash  = await bcrypt.hash(raw, 10);
  await RefreshToken.create({
    userId: user._id,
    tokenHash: hash,
    expiresAt: new Date(Date.now() + 7 * 86400000),
  });
  return {
    token,
    refreshToken: raw,
    user: { _id: user._id, username: user.username, role: user.role,
            isPremium: user.isPremium, premiumExpiry: user.premiumExpiry },
  };
}
