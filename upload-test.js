const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const API_URL = 'http://localhost:3001/api';
// Utilisons le compte admin directement pour avoir tous les droits
const AUTH = { email: 'admin@test.com', password: 'password123' };

async function startProcess() {
    try {
        // 1. Login
        const login = await axios.post(`${API_URL}/auth/login`, AUTH);
        const token = login.data.token;
        console.log("🔑 Authentifié !");

        // 2. Préparation du formulaire
        const form = new FormData();
        form.append('thumbnail', fs.createReadStream('./test-poster.jpg'));
        form.append('media', fs.createReadStream('./test-movie.mp4'));
        form.append('title', 'Film Test Automatique');
        form.append('description', 'Test du pipeline HLS');
        form.append('type', 'video');
        form.append('category', 'film');
        form.append('language', 'mg');
        form.append('accessType', 'free');
        form.append('isTutorial', 'false');

        // 3. Upload
        console.log("📤 Upload en cours...");
        const upload = await axios.post(`${API_URL}/provider/contents`, form, {
            headers: { 
                ...form.getHeaders(), 
                'Authorization': `Bearer ${token}` 
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        // Extraction intelligente de l'ID (cherche dans ._id ou .content._id)
        const contentId = upload.data._id || (upload.data.content && upload.data.content._id);
        
        if (!contentId) {
            console.log("❓ Réponse reçue :", JSON.stringify(upload.data));
            throw new Error("Impossible de trouver l'ID dans la réponse du serveur");
        }

        console.log(`✅ Upload réussi ! ID: ${contentId}`);

        // 4. Approbation (Admin)
        console.log("🎬 Approbation du contenu...");
        const adminRes = await axios.put(`${API_URL}/admin/contents/${contentId}`, 
            { isPublished: true },
            { headers: { 'Authorization': `Bearer ${token}` }}
        );

        console.log("🎉 TERMINÉ : Le film est en ligne et le transcodage a commencé !");

    } catch (err) {
        console.error("❌ Erreur détailée :");
        if (err.response) {
            console.error(err.response.data);
        } else {
            console.error(err.message);
        }
    }
}

startProcess();
