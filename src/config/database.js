// ─────────────────────────────────────────────────────────────
//  config/database.js — Connexion MongoDB Atlas
// ─────────────────────────────────────────────────────────────
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`✅ MongoDB connecté : ${conn.connection.host}`);
  } catch (err) {
    console.error('❌ Erreur MongoDB :', err.message);
    throw err;
  }
};

module.exports = connectDB;
