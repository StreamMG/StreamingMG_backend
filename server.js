// ─────────────────────────────────────────────────────────────
//  server.js — Point d'entrée StreamMG Backend
// ─────────────────────────────────────────────────────────────
require('dotenv').config();
const app = require('./app');
const connectDB = require('./src/config/database');

const PORT = process.env.PORT || 3001;

// Connexion MongoDB puis démarrage du serveur
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 StreamMG Backend démarré`);
    console.log(`   ► http://localhost:${PORT}/api`);
    console.log(`   ► Environnement : ${process.env.NODE_ENV || 'development'}\n`);
  });
}).catch((err) => {
  console.error('❌ Échec connexion MongoDB :', err.message);
  process.exit(1);
});
