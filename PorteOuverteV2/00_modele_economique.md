# Modèle Économique — StreamMG

**Document :** Définition du modèle économique et règles d'accès aux contenus  
**Projet :** StreamMG — Plateforme de streaming audiovisuel et éducatif malagasy  
**Date :** Février 2026

---

## 1. Vue d'ensemble

StreamMG adopte un modèle économique **freemium multi-niveaux**. Ce modèle, utilisé par des plateformes comme Spotify ou YouTube, combine une offre gratuite accessible au plus grand nombre avec des offres monétisées qui rémunèrent les fournisseurs de contenu et assurent la viabilité économique de la plateforme. Il est particulièrement adapté au contexte malgache, où le pouvoir d'achat est variable et où l'accessibilité culturelle est un objectif explicite du projet.

---

## 2. Les quatre niveaux d'accès

### Niveau 1 — Contenu gratuit

Accessible à toute personne visitant la plateforme, inscrite ou non. C'est le fournisseur qui décide de rendre un contenu gratuit lors de l'upload — souvent pour accroître sa visibilité ou attirer une audience. Les contenus gratuits constituent la vitrine de la plateforme. **Même pour les contenus gratuits, la vignette (photo de couverture) est obligatoire** : elle est affichée dans le catalogue pour tous les visiteurs.

### Niveau 2 — Contenu premium

Accessible uniquement aux abonnés Premium. L'abonnement donne accès à l'ensemble du catalogue premium de manière illimitée pendant sa durée. Ce modèle est analogue à Netflix : un forfait mensuel ou annuel donne accès à un catalogue entier.

### Niveau 3 — Contenu payant (achat unitaire)

Accessible après un achat unitaire permanent, indépendant de tout abonnement. Un utilisateur standard **et** un utilisateur Premium doivent payer ce contenu séparément — l'abonnement ne couvre jamais les contenus payants. Une fois acheté, l'accès est permanent quelle que soit l'évolution du statut d'abonnement. Ce niveau est conçu pour des contenus à forte valeur ajoutée : avant-premières, master classes, événements exclusifs.

### Niveau 4 — Tutoriel

Les tutoriels suivent le même système d'accès (gratuit, premium ou payant) avec une logique fonctionnelle supplémentaire : ils sont organisés en séries de leçons ordonnées. La plateforme mémorise la progression de chaque utilisateur. **Chaque tutoriel dispose d'une vignette obligatoire** et chaque leçon peut disposer d'une vignette optionnelle.

---

## 3. Tableau synthétique des droits d'accès

| Type de contenu | Visiteur | Standard | Premium | Remarque |
|---|---|---|---|---|
| Gratuit | OUI | OUI | OUI | Aucune restriction |
| Premium | NON | NON | OUI | Abonnement requis |
| Payant (unitaire) | NON | ACHAT | ACHAT | Indépendant de l'abonnement |
| Tutoriel gratuit | OUI | OUI | OUI | + progression trackée |
| Tutoriel premium | NON | NON | OUI | + progression trackée |
| Tutoriel payant | NON | ACHAT | ACHAT | + progression trackée |

**Point critique :** un utilisateur Premium qui tente d'accéder à un contenu payant reçoit exactement le même écran d'achat qu'un utilisateur standard. Le middleware `checkAccess` applique cette règle côté serveur, indépendamment du rôle contenu dans le JWT.

---

## 4. Protection contre les téléchargements non autorisés

La protection des contenus est un enjeu central de la viabilité économique de la plateforme. StreamMG implémente deux mécanismes complémentaires selon la plateforme, sans recourir à un DRM complexe.

### 4.1 Protection web — protocole HLS avec tokens signés

Sur le web, les vidéos ne sont jamais servies sous forme de fichier `.mp4` téléchargeable. Elles sont découpées en segments de 10 secondes au format HLS (HTTP Live Streaming, fichiers `.ts`). Le lecteur reçoit un manifest `.m3u8` et charge les segments un à un. Aucun fichier complet n'est jamais transmis en une seule requête, rendant les outils de téléchargement (IDM, JDownloader, Video DownloadHelper) inefficaces.

À chaque demande de lecture, le backend génère un **token signé temporaire** (durée : 10 minutes) contenant le `videoId`, le `userId`, et un `fingerprint` calculé comme le hachage du User-Agent, de l'IP et du cookie httpOnly `sessionId`. Ce token est inclus dans l'URL du manifest HLS et vérifié par le middleware à **chaque requête de segment `.ts`**. Tout changement de navigateur, copie d'URL ou ouverture dans un nouvel onglet fait échouer la vérification du fingerprint (403 Forbidden).

**Limite connue et assumée** : le screen recording (enregistrement d'écran) reste possible. C'est le cas de toutes les plateformes sans DRM. Cette limite est académiquement défendable car l'implémentation d'un DRM complet (Widevine, FairPlay) est hors périmètre d'un projet de Licence.

### 4.2 Protection mobile — téléchargement chiffré AES-256-GCM

Sur mobile, le téléchargement hors-ligne est autorisé mais le fichier est chiffré localement dans le sandbox privé de l'application. Le flux est le suivant : le backend génère une **clé AES-256 et un IV** uniques pour ce téléchargement, ainsi qu'une URL signée temporaire (15 minutes) pour le fichier source. Le frontend React Native télécharge le fichier par chunks (4 à 8 Mo) via expo-file-system pour supporter les coupures réseau fréquentes en contexte malgache, puis chiffre chaque chunk avec **react-native-quick-crypto** (AES-256-GCM). Le fichier final est sauvegardé sous l'extension `.enc` dans `FileSystem.documentDirectory/offline/`. La clé AES et l'IV sont stockés dans expo-secure-store (iOS Keychain / Android Keystore).

Lors de la lecture hors-ligne, l'application lit le fichier `.enc` par chunks, déchiffre en mémoire vive uniquement, et envoie le flux déchiffré directement au lecteur. **Aucune vidéo en clair n'est jamais écrite sur le disque.** Le fichier `.enc` est totalement illisible hors de l'application, même en cas d'accès physique au stockage du téléphone.

---

## 5. Vignette obligatoire pour tous les contenus

Chaque contenu audiovisuel publié sur StreamMG doit obligatoirement disposer d'une **vignette (photo de couverture)**. Cette contrainte est technique et éditoriale :

**Côté technique :** le champ `thumbnail` est déclaré obligatoire (`required: true`) dans le schéma Mongoose de la collection `contents`. Le formulaire d'upload côté frontend déclenche une validation côté client avant soumission. Multer côté backend rejette tout formulaire d'upload ne contenant pas un fichier image valide (JPEG ou PNG, taille maximale 5 Mo, dimensions minimales recommandées 320×180 px). La vignette est stockée dans `/uploads/thumbnails/` avec un nom de fichier unique généré par UUID.

**Côté éditorial :** la vignette est le premier élément visuel que voit l'utilisateur dans le catalogue. Elle doit être représentative du contenu et de qualité suffisante. L'administrateur peut rejeter une soumission dont la vignette est absente, floue ou non conforme.

---

## 6. Rôle du fournisseur dans le modèle

Le fournisseur décide du niveau d'accès (gratuit, premium, payant) et du prix si payant. Il fournit obligatoirement une vignette. Toute modification de niveau d'accès est soumise à revalidation par l'administrateur.

---

## 7. Simulation des paiements

Tous les paiements sont simulés via Stripe en mode test. Aucune transaction réelle n'est effectuée. Cartes de test : **4242 4242 4242 4242** (succès), **4000 0000 0000 9995** (refus).

---

## 8. Références bibliographiques

Anderson, C. (2009). *Free: The Future of a Radical Price*. Hyperion. ISBN 978-1401322908.

Kumar, V. (2014). Making "Freemium" Work. *Harvard Business Review*, 92(5), 27–29.

Apple Inc. (2019). *HTTP Live Streaming — RFC 8216*. https://datatracker.ietf.org/doc/html/rfc8216

Stripe Inc. (2026). *Stripe API Reference — PaymentIntents*. https://stripe.com/docs/api/payment_intents

Stripe Inc. (2026). *Stripe Testing Documentation*. https://stripe.com/docs/testing

OWASP Foundation. (2023). *OWASP Top Ten 2023*. https://owasp.org/www-project-top-ten/
