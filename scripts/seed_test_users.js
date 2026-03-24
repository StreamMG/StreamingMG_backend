#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
//  scripts/seed_test_users.js — Pré-peuple les users provider+admin
//  Exécuter AVANT test_complet.js : node scripts/seed_test_users.js
// ═══════════════════════════════════════════════════════════════
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  const User = require('../src/models/User.model');

  // Provider test
  const provEmail = 'provider_test@streammg.mg';
  let prov = await User.findOne({ email: provEmail });
  if (!prov) {
    prov = await User.create({
      username: 'provider_test',
      email: provEmail,
      passwordHash: await bcrypt.hash('ProvTest123!', 12),
      role: 'provider',
    });
    console.log('✅ Provider créé:', prov.email);
  } else {
    await User.findByIdAndUpdate(prov._id, { role: 'provider' });
    console.log('✅ Provider déjà existant, rôle mis à jour');
  }

  // Admin test
  const admEmail = 'admin_test@streammg.mg';
  let adm = await User.findOne({ email: admEmail });
  if (!adm) {
    adm = await User.create({
      username: 'admin_test',
      email: admEmail,
      passwordHash: await bcrypt.hash('AdminTest123!', 12),
      role: 'admin',
    });
    console.log('✅ Admin créé:', adm.email);
  } else {
    await User.findByIdAndUpdate(adm._id, { role: 'admin' });
    console.log('✅ Admin déjà existant, rôle mis à jour');
  }

  await mongoose.disconnect();
  console.log('✅ Seed terminé');
}

seed().catch(e => { console.error('ERREUR:', e.message); process.exit(1); });
