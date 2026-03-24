// ─────────────────────────────────────────────────────────────
//  services/aes.service.js — Génération AES-256-GCM
//  RÈGLE-06 : La clé ne doit JAMAIS être stockée en BDD
// ─────────────────────────────────────────────────────────────
const { generateAesKey } = require('../utils/crypto.utils');

exports.generateKey = () => generateAesKey();
// Usage : const { aesKeyHex, ivHex } = aesService.generateKey();
// → renvoyer au client mobile, qui l'utilise pour le déchiffrement local
