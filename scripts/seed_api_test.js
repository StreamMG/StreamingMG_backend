/**
 * 🛠️ Seed Test Data for Endpoint Testing
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../src/models/User.model');
const Content = require('../src/models/Content.model');

async function sedTestData() {
  console.log('🌱 Seeding data for API tests...\n');
  await mongoose.connect(process.env.MONGODB_URI);

  // 1. Create Users
  const passwordHash = await bcrypt.hash('password123', 12);
  
  const users = [
    { username: 'tester_user', email: 'user@test.com', passwordHash, role: 'user' },
    { username: 'tester_premium', email: 'premium@test.com', passwordHash, role: 'premium', isPremium: true, premiumExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    { username: 'tester_provider', email: 'provider@test.com', passwordHash, role: 'provider' },
    { username: 'tester_admin', email: 'admin@test.com', passwordHash, role: 'admin' },
  ];

  for (const u of users) {
    await User.findOneAndUpdate({ email: u.email }, u, { upsert: true, new: true });
    console.log(`👤 User ${u.username} ready.`);
  }

  const provider = await User.findOne({ email: 'provider@test.com' });

  // 2. Create Contents
  const contents = [
    {
      title: 'Free Salegy',
      description: 'Test Free Audio',
      type: 'audio',
      category: 'salegy',
      language: 'mg',
      thumbnail: '/uploads/thumbnails/test-audio.jpg',
      audioPath: '/uploads/audio/4a618355f70f5895.mp3',
      accessType: 'free',
      isPublished: true,
      uploadedBy: provider._id
    },
    {
      title: 'Premium Film',
      description: 'Test Premium Video',
      type: 'video',
      category: 'film',
      language: 'mg',
      thumbnail: '/uploads/thumbnails/test-video.jpg',
      hlsPath: '/hls/69c2c2e633554c87d9a119d9/index.m3u8',
      accessType: 'premium',
      isPublished: true,
      uploadedBy: provider._id
    },
    {
      title: 'Paid Masterclass',
      description: 'Test Paid Content',
      type: 'video',
      category: 'documentaire',
      language: 'mg',
      thumbnail: '/uploads/thumbnails/test-video.jpg',
      hlsPath: '/hls/69c2cb67d41e0d3a19548545/index.m3u8',
      accessType: 'paid',
      price: 1500,
      isPublished: true,
      uploadedBy: provider._id
    }
  ];

  for (const c of contents) {
    await Content.findOneAndUpdate({ title: c.title }, c, { upsert: true, new: true });
    console.log(`🎬 Content ${c.title} ready.`);
  }

  console.log('\n✅ Data seed completed.');
  process.exit(0);
}

sedTestData();
