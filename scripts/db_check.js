/**
 * scripts/db_check.js — Consultation BDD + Diagnostic serveur
 * Usage : node scripts/db_check.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const net      = require('net');

async function checkPort(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1500);
    socket.on('connect', () => { socket.destroy(); resolve(true); });
    socket.on('timeout', () => { socket.destroy(); resolve(false); });
    socket.on('error', () => resolve(false));
    socket.connect(port, '127.0.0.1');
  });
}

async function main() {
  console.log('\n🔍 DIAGNOSTIC STREAMMING BACKEND\n');

  // ── 1. Port check ─────────────────────────────────────────
  const port = parseInt(process.env.PORT) || 3001;
  const serverUp = await checkPort(port);
  console.log(`Serveur HTTP  :${port}  → ${serverUp ? '✅ UP' : '❌ DOWN (non accessible)'}`);

  if (!serverUp) {
    console.log(`\n⚠️  Le serveur n'écoute pas sur :${port}.`);
    console.log('   Vérifiez le terminal npm run dev pour voir les erreurs de démarrage.\n');
  }

  // ── 2. MongoDB connection ─────────────────────────────────
  console.log(`\nMongoDB URI   : ${process.env.MONGODB_URI}`);
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 4000 });
    console.log('MongoDB       : ✅ connecté\n');
  } catch (err) {
    console.log(`MongoDB       : ❌ ERREUR — ${err.message}\n`);
    process.exit(1);
  }

  // ── 3. Schémas légers ─────────────────────────────────────
  const User = mongoose.model('User', new mongoose.Schema({
    username: String, email: String, role: String,
    isActive: Boolean, isPremium: Boolean
  }, { strict: false }));

  const Content = mongoose.model('Content', new mongoose.Schema({
    title: String, type: String, accessType: String,
    isPublished: Boolean, filePath: String, audioPath: String,
    hlsPath: String
  }, { strict: false }));

  // ── 4. Utilisateurs ───────────────────────────────────────
  console.log('══════════ UTILISATEURS ══════════');
  const users = await User.find({}).select('username email role isActive isPremium').lean();
  if (!users.length) {
    console.log('  ⚠️  Aucun utilisateur en base !');
  } else {
    users.forEach(u => {
      console.log(`  • ${u.email.padEnd(30)} role=${u.role.padEnd(10)} active=${u.isActive} premium=${u.isPremium}`);
    });
  }

  // ── 5. Contenus ───────────────────────────────────────────
  console.log('\n══════════ CONTENUS ══════════');
  const contents = await Content.find({}).select('title type accessType isPublished filePath audioPath hlsPath').lean();
  if (!contents.length) {
    console.log('  ⚠️  Aucun contenu en base !');
  } else {
    const byAccess = { free: [], premium: [], paid: [] };
    contents.forEach(c => {
      const a = c.accessType || 'free';
      if (!byAccess[a]) byAccess[a] = [];
      byAccess[a].push(c);
    });

    ['free', 'premium', 'paid'].forEach(type => {
      const list = byAccess[type] || [];
      console.log(`\n  [${type.toUpperCase()}] — ${list.length} contenu(s)`);
      list.slice(0, 3).forEach(c => {
        const file = c.audioPath || c.filePath || c.hlsPath || '—';
        console.log(`    • ${String(c._id)} | ${c.type.padEnd(6)} | pub=${c.isPublished} | file=${file}`);
      });
    });
  }

  // ── 6. Fichiers physiques ─────────────────────────────────
  const fs   = require('fs');
  const path = require('path');
  console.log('\n══════════ FICHIERS DISQUE ══════════');
  ['uploads/audio', 'uploads/private', 'uploads/hls', 'uploads/thumbnails'].forEach(dir => {
    const abs = path.resolve(process.cwd(), dir);
    if (fs.existsSync(abs)) {
      const files = fs.readdirSync(abs).filter(f => !fs.statSync(path.join(abs, f)).isDirectory());
      console.log(`  ${dir.padEnd(25)} : ${files.length} fichier(s)`);
      files.slice(0, 2).forEach(f => console.log(`    - ${f}`));
    } else {
      console.log(`  ${dir.padEnd(25)} : ❌ dossier absent`);
    }
  });

  // ── 7. Résumé pour le test ────────────────────────────────
  console.log('\n══════════ CREDENTIALS POUR TEST ══════════');
  const admin   = users.find(u => u.role === 'admin');
  const premium = users.find(u => u.role === 'premium');
  const regular = users.find(u => u.role === 'user');

  console.log(`  admin   : ${admin?.email   || 'AUCUN'}`);
  console.log(`  premium : ${premium?.email || 'AUCUN'}`);
  console.log(`  user    : ${regular?.email || 'AUCUN'}`);

  await mongoose.disconnect();
  console.log('\n✅ Diagnostic terminé.\n');
}

main().catch(err => { console.error('❌ Fatal:', err.message); process.exit(1); });
