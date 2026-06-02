# Évaluation Financière, Balance Économique et Cadrage des Coûts — StreamMG

**Document :** Modélisation financière, budget d'infrastructure et coût de développement  
**Projet :** StreamMG — Plateforme de streaming audiovisuel et éducatif malagasy  
**Date :** Mai 2026  
**Niveau :** Licence 3 Génie Logiciel  
**Norme de Cadrage :** Analyse économique pour ingénierie logicielle publique et privée  

---

## 1. Vision Stratégique et Choix Technico-Économiques

La viabilité commerciale et la pérennité technique de **StreamMG** reposent sur l'adaptation stricte de la plateforme aux réalités socio-économiques de Madagascar. Deux décisions architecturales majeures guident ce modèle financier :

1. **L'exclusion des DRM commerciaux tiers (Widevine, FairPlay, PlayReady) :** L'intégration de ces technologies imposerait des frais de licence fixes d'environ **300 $ / mois** (~1 350 000 Ar), un coût prohibitif pour une phase de lancement à Madagascar. La sécurité est donc entièrement déléguée à l'ingénierie interne de l'équipe : des tokens HLS éphémères signés avec empreinte numérique (*fingerprint*) pour l'application Web, et un système de téléchargement binaire chiffré en **AES-256-GCM** avec stockage des clés dans `expo-secure-store` pour l'application mobile.
2. **La suppression de la location de courte durée au profit de l'achat définitif à vie :** À Madagascar, la connectivité internet représente le principal poste de dépense pour l'utilisateur (coût élevé de la data mobile 4G/Fibre). En proposant un modèle d'**Achat à vie**, l'utilisateur acquiert un droit permanent sur l'œuvre culturelle ou le contenu éducatif. Il peut ainsi optimiser sa data en téléchargeant le fichier de manière sécurisée une seule fois depuis un point d'accès Wi-Fi gratuit (université, bureau, cybercafé) pour ensuite le consommer indéfiniment en mode hors-ligne sans frais supplémentaires.

---

## 2. Évaluation du Coût de Développement du Projet (Valorisation Logicielle)

Cette section comptabilise la valeur financière brute du travail de conception logicielle fourni par l'équipe de développement (3 ingénieurs logiciels) sur une période de 10 semaines. Ce montant représente la valeur théorique du livrable si le projet était commandé par une entreprise privée ou une institution publique à Madagascar.

### 2.1 Paramètres de calcul de l'effort de développement
* **Composition de l'équipe :** 3 développeurs spécialisés (Mobile, Web, Backend/DevOps).
* **Durée du cycle de production :** 10 semaines (Sprint S1 à S10).
* **Charge de travail hebdomadaire par membre :** 40 heures de conception, codage, intégration et tests.
* **Volume horaire global cumulé :** $3 \times 10 \times 40 = 1\ 200 \text{ heures}$.
* **Taux horaire moyen retenu (Tarif Ingénieur Junior / Freelance Mada) :** 10 $ / heure (~45 000 Ar / heure).

### 2.2 Répartition budgétaire par composant technique

| Composant / Couche Logicielle | Responsable | Activités Clés | Volume Horaire | Coût Estimé ($) | Coût Estimé (Ariary) |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **Application Mobile Native** | Membre 1 | React Native, Expo SDK 52, Expo Router, Lecteur `expo-av`, gestionnaire de téléchargement local chiffré AES-256-GCM, intégration Stripe SDK Natif. | 450 h | 4 500 $ | 20 250 000 Ar |
| **Application Web & Back-Office** | Membre 2 | React.js 18, Vite 5, lecteur HLS adaptatif (`hls.js`), intégration Stripe Elements, Service Worker PWA pour cache audio, tableau de bord administration. | 400 h | 4 000 $ | 18 000 000 Ar |
| **Backend API & Infrastructure** | Membre 3 | Node.js, Express, Base de données MongoDB (Mongoose), Middleware de sécurité, génération de tokens HLS avec fingerprint, Webhooks Stripe, DevOps. | 350 h | 3 500 $ | 15 750 000 Ar |
| **TOTAL VALEUR PROJET** | **Équipe** | **Architecture globale, Contrats d'API, Intégration de bout en bout et Recette** | **1 200 h** | **12 000 $** | **54 000 000 Ar** |

---

## 3. Coûts Réels de Fonctionnement et d'Infrastructure (Mensuel au Lancement)

Grâce à l'absence de frais de DRM commerciaux et à l'utilisation d'une infrastructure cloud élastique distribuée, les coûts d'exploitation mensuels au démarrage sont minimisés.

### 3.1 Détail des postes de dépenses techniques
1. **Hébergement API Backend & Serveur d'applications :** Déploiement de l'instance Node.js/Express sur un serveur VPS optimisé (ex: Railway ou fournisseur local type Tranokala) $\rightarrow$ **25 $ / mois** (~112 500 Ar).
2. **Base de données Cloud :** Cluster managé MongoDB Atlas (hébergé en Tier partagé/dédié selon la montée en charge, incluant sauvegardes automatiques) $\rightarrow$ Inclus dans le palier initial ou **0 $à 10$ / mois**.
3. **Stockage et Distribution Vidéo/Audio (CDN) :** Utilisation d'un stockage objet optimisé couplé à un réseau de diffusion de contenu décentralisé (ex: Bunny.net avec serveurs Edge en Afrique du Sud pour une latence minimale à Madagascar). Tarification à l'usage sur la base de 500 Go de catalogue stocké et 1 To de trafic sortant $\rightarrow$ **20 $ / mois** (~90 000 Ar).

### 3.2 Synthèse des coûts d'exploitation
* **Total mensuel récurrent :** **~45 $ / mois** (soit environ **202 500 Ariary / mois**).

---

## 4. Tableau Unifié : Consommation, Infrastructure et Revenu (Modèle Sans DRM, Achat à vie)

Ce tableau croise le comportement technique de l'utilisateur (impact sur la data et la bande passante), le coût d'infrastructure réel généré côté serveur, et le flux financier généré via les passerelles de paiement de Mobile Money (MVola, Orange Money, Airtel Money).

| Profil / Type d'Offre | Règle d'Accès Clé | Comportement Data (Utilisateur - Contexte Mada) | Prix de l'Offre (Revenu Brut par Transaction) | Coût Infrastructure Équivalent (Impact CDN / API) | Marge et Rentabilité Nette |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **Visiteur / Gratuit (Freemium)** | **Niveau 1 :** Accès libre aux bandes-annonces, extraits et contenus promotionnels. Affichage obligatoire des vignettes. | **Consommation minimale :** Navigation textuelle dans le catalogue et visionnage de vidéos courtes de moins de 2 minutes. | **0 Ar** | **~ 50 Ar / mois** (Requêtes API REST + bande passante pour le chargement des images d'illustration) | **Déficitaire (Investissement) :** Sert d'outil d'acquisition marketing pour convertir l'audience vers les offres payantes. |
| **Pass Journalier (Pass 24h)** | **Niveau 2 :** Accès illimité à l'intégralité du catalogue Premium pendant une durée stricte de 24 heures. | **Consommation intensive ponctuelle :** Visionnage direct de films ou de séries durant le week-end, configuré par défaut en basse résolution (360p/480p) pour préserver le forfait de l'utilisateur. | **1 000 Ar / 24h** | **~ 150 Ar / jour** (Bande passante CDN sollicitée directement lors des requêtes HTTP Live Streaming) | **Très Élevée (~85%) :** Modèle d'achat impulsif adapté au mode de vie malgache (achat de crédit mobile au jour le jour). |
| **Abonné Mensuel Étudiant** | **Niveaux 2 & 4 :** Accès complet au catalogue général et suivi pédagogique exhaustif des séries de tutoriels de Mathématiques. | **Consommation optimisée :** L'étudiant utilise le Wi-Fi de son établissement pour télécharger ses séries de leçons à l'avance, puis travaille hors-ligne à la maison. | **4 900 Ar / mois** | **~ 100 Ar / mois** (Le CDN n'est sollicité qu'au premier téléchargement, puis le fichier chiffré AES est lu localement) | **Exceptionnelle (~98%) :** Volume de masse hautement prévisible. Offre conçue pour s'insérer sous le budget mensuel moyen d'un lycéen/étudiant. |
| **Abonné Mensuel Standard** | **Niveau 2 :** Accès complet illimité pendant 30 jours à toutes les productions vidéo et audio (Films, Salegy, Hira Gasy). | **Consommation mixte :** Alternance entre streaming direct en zone urbaine (4G/Wi-Fi) et mode de téléchargement sécurisé pour les déplacements interprovinciaux. | **9 900 Ar / mois** | **~ 500 Ar / mois** (Moyenne lissée comprenant les lectures HLS directes et les flux de stockage temporaires) | **Optimale (~95%) :** Pilier financier de la plateforme. Positionné stratégiquement sous le seuil des 10 000 Ar pour s'aligner sur les offres musicales concurrentes (*Moozik*). |
| **Acheteur Unitaire (À VIE)** | **Niveau 3 :** Accès permanent, illimité et sans abonnement à une œuvre exclusive (gros film de cinéma malgache ou Masterclass avancée). | **Téléchargement unique et définitif :** L'utilisateur télécharge l'œuvre complète sur son appareil. Le contenu lui appartenant à vie, l'infrastructure ne subit aucune charge récurrente ultérieure. | **5 000 Ar à 15 000 Ar** *(Achat définitif unique)* | **~ 300 Ar au moment de l'achat** (Frais uniques de transfert du bloc binaire via les serveurs Edge du CDN Bunny) | **Maximale (~97%) :** Valeur perçue maximale. L'utilisateur accepte un prix plus élevé car il élimine le sentiment de dépendance à un abonnement expirant. |

---

## 5. Analyse du Seuil de Rentabilité (Point Mort)

L'équilibre financier de l'infrastructure est calculé à partir des frais fixes d'exploitation évalués à **45 $ / mois (soit 202 500 Ariary / mois)**. Le graphique théorique du point mort démontre que la plateforme atteint son indépendance financière avec un volume d'utilisateurs extrêmement restreint.

### 5.1 Scénarios d'indépendance financière exclusive (hors taxes et frais de passerelle Mobile Money)
Pour couvrir l'intégralité des 202 500 Ar de charges techniques mensuelles, la plateforme doit valider l'un des objectifs indépendants suivants :
* **Scénario Abonnement Standard uniquement :** $$\text{Seuil} = \frac{202\ 500 \text{ Ar}}{9\ 900 \text{ Ar}} \approx 20,45 \rightarrow \mathbf{21 \text{ abonnés mensuels Premium}}$$
* **Scénario Enseignement / Étudiant uniquement :** $$\text{Seuil} = \frac{202\ 500 \text{ Ar}}{4\ 900 \text{ Ar}} \approx 41,32 \rightarrow \mathbf{42 \text{ abonnés mensuels Étudiants}}$$
* **Scénario Achat Unitaire à vie uniquement (Hypothèse moyenne de 15 000 Ar par contenu exclusif) :** $$\text{Seuil} = \frac{202\ 500 \text{ Ar}}{15\ 000 \text{ Ar}} = 13,5 \rightarrow \mathbf{14 \text{ achats à vie par mois}}$$

En combinant ces différents profils au sein d'une communauté d'utilisateurs mixtes, le risque financier de StreamMG au lancement est quasi nul, ouvrant la voie à une redistribution équitable des revenus générés aux créateurs de contenus et producteurs malgaches partenaires.

---

## 6. Références Bibliographiques

Anderson, C. (2009). *Free: The Future of a Radical Price*. Hyperion. ISBN 978-1401322908.

Banque Mondiale. (2024). *Rapport sur le développement numérique à Madagascar*. Groupe Banque Mondiale. https://www.worldbank.org/mg

DataReportal. (2025). *Digital 2025: Madagascar — Global Digital Insights*. Kepios Analysis. https://datareportal.com/reports/digital-2025-madagascar

Kumar, V. (2014). Making "Freemium" Work. *Harvard Business Review*, 92(5), 27–29.

Stripe Inc. (2026). *Stripe API Reference — PaymentIntents and Webhook architecture*. https://stripe.com/docs/api
