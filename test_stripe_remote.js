const API_URL = 'https://streammg.alwaysdata.net/api';

async function testStripe() {
    console.log("=========================================");
    console.log("🧪 TEST DE L'INTÉGRATION STRIPE (ALWAYSDATA)");
    console.log("=========================================\n");

    try {
        console.log("1️⃣ Tentative de connexion (utilisateur Admin par défaut)...");
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@test.com', password: 'password123' }) 
        });
        
        const loginData = await loginRes.json();
        
        if (!loginData.token) {
            throw new Error("Échec de connexion. La BDD ne contient pas cet utilisateur, ou l'API est injoignable.\nDétails: " + JSON.stringify(loginData));
        }

        console.log("✅ Connexion réussie ! Token obtenu.\n");
        console.log("2️⃣ Demande de création de paiement à Stripe via le backend...");
        
        // On simule une demande d'abonnement Premium mensuel
        const payRes = await fetch(`${API_URL}/payment/subscribe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${loginData.token}`
            },
            body: JSON.stringify({ plan: 'monthly' })
        });
        
        const payData = await payRes.json();

        if (payData.clientSecret) {
            console.log("✅ SUCCÈS TOTAL !");
            console.log("Votre serveur a bien communiqué avec Stripe !");
            console.log("Clé secrète de paiement générée :", payData.clientSecret.substring(0, 25) + "...\n");
        } else {
            throw new Error("Erreur inattendue depuis Stripe: " + JSON.stringify(payData));
        }

    } catch (err) {
        console.error("❌ ERREUR :", err.message);
        if (err.cause) {
            console.error("🔍 CAUSE EXACTE :", err.cause);
        }
    }
}

testStripe();
