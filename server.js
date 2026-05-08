// ─────────────────────────────────────────────────────────────
//  server.js — Point d'entrée StreamMG Backend
// ─────────────────────────────────────────────────────────────
require('dotenv').config();
const app = require('./app');
const connectDB = require('./src/config/database');

const PORT = process.env.PORT || 3001;

// Connexion MongoDB puis démarrage du serveur
connectDB().then(() => {
  // Remplace la ligne du listen par celle-ci :
const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n🚀 StreamMG Backend démarré`);
    console.log(`   ► Accessible sur le port : ${PORT}`);
    console.log(`   ► Environnement : ${process.env.NODE_ENV || 'development'}\n`);
});
  // ⏱️ Pas de timeout HTTP : pour les uploads de gros fichiers (>1Go)
  // Le client a tout le temps nécessaire pour envoyer son fichier
  server.timeout = 0;         // TCP socket inactivity timeout
  server.requestTimeout = 0;  // HTTP/1.1 request parsing timeout
  server.keepAliveTimeout = 5000;

}).catch((err) => {
  console.error('❌ Échec connexion MongoDB :', err.message);
  process.exit(1);
});
