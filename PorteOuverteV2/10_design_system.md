# Design System — StreamMG

**Document :** Spécifications de design — interfaces web et mobile  
**Projet :** StreamMG — Plateforme de streaming audiovisuel et éducatif malagasy  
**Version :** 1.0  
**Date :** Février 2026  
**Responsable implémentation web :** Membre 2 (React.js + Tailwind CSS)  
**Responsable implémentation mobile :** Membre 1 (React Native + NativeWind)  
**Outil de référence :** Figma (maquettes haute fidélité)  
**Fichier de référence visuelle :** `streamMG_design_system.html`

---

## 1. Direction artistique et positionnement visuel

### 1.1 Le défi : modernité internationale et ancrage malgache

StreamMG doit réconcilier deux ambitions apparemment contradictoires. D'un côté, la plateforme doit inspirer confiance et être immédiatement reconnaissable comme un produit numérique sérieux — ce qui implique une interface moderne, propre, et performante. De l'autre, elle doit affirmer une identité culturelle malgache forte, sans tomber dans un folklore de surface qui se limiterait à ajouter quelques motifs décoratifs sur une interface générique.

La direction retenue se nomme **raffinement sombre et chaleureux**. Elle s'inspire des grandes plateformes de streaming (Netflix pour la mise en scène des contenus, Spotify pour la présentation musicale) tout en introduisant deux touches identitaires distinctives : la couleur d'accent or (#e8c547), qui évoque la lumière dorée des rizières malgaches et les broderies traditionnelles, et une typographie d'affichage (Sora) aux terminaisons arrondies qui apporte chaleur sans mièvrerie.

### 1.2 Pourquoi le dark mode par défaut

Le dark mode n'est pas un choix esthétique arbitraire — c'est un choix fonctionnel adapté au contexte d'usage. Les smartphones malgaches sont fréquemment utilisés dans des conditions de luminosité variées : en extérieur sous un soleil fort, où le fond sombre réduit l'éblouissement par contraste, ou le soir dans des espaces peu éclairés, où il ménage les yeux. De plus, sur les écrans OLED (de plus en plus répandus même dans les gammes d'entrée de gamme), le dark mode consomme significativement moins de batterie, ce qui est pertinent dans un contexte où la gestion de l'énergie est souvent contrainte.

Un light mode est disponible mais non documenté comme priorité de la version MVP. Il sera conçu avec les mêmes tokens de couleur, en inversant simplement les fonds.

### 1.3 Principe de cohérence cross-platform

Les deux applications — mobile (React Native/Expo, Membre 1) et web (React.js/Vite, Membre 2) — partagent le même design system. Concrètement, cela signifie que les tokens de couleur, la typographie, les espacements, les comportements des composants, et les animations sont identiques dans leur intention et dans leurs valeurs, même si leur implémentation technique diffère (NativeWind pour le mobile, Tailwind CSS pour le web). Un utilisateur qui passe de l'application mobile au site web doit avoir le sentiment de retrouver la même plateforme.

---

## 2. Palette de couleurs

### 2.1 Couleur principale — Bleu cobalt (#3584e4)

La couleur principale de StreamMG est le bleu cobalt #3584e4. C'est la couleur d'identité de la plateforme : elle est présente sur tous les éléments d'action (boutons primaires, liens actifs, indicateurs de progression, barre du mini-player, bordure de focus). Ce bleu est directement inspiré du système de design GNOME/Adwaita, reconnu pour ses qualités d'accessibilité et sa lisibilité sur fond sombre.

Il est utile de comprendre pourquoi une seule couleur principale est suffisante. Les interfaces de streaming les plus efficaces (Spotify, Netflix) utilisent une couleur d'accent dominante et forte, plutôt qu'une palette dispersée. Cette concentration crée une clarté visuelle immédiate : tout ce qui est bleu est cliquable ou actif. Les variantes light et dark du bleu principal permettent d'exprimer les différents états d'interaction (repos, survol, pression, focus) sans introduire de nouvelles couleurs.

```
Primary       #3584e4   rgb(53, 132, 228)   — Boutons primaires, liens, indicateurs actifs
Primary Light #62a0ea   rgb(98, 160, 234)   — État hover, textes sur fond sombre
Primary Dark  #1c71d8   rgb(28, 113, 216)   — État de pression (active), accents de titre
Primary Muted #1a3d6e   rgb(26, 61, 110)    — Fonds de badges, arrière-plans colorés discrets
Primary Glow  rgba(53,132,228,0.18)         — Halo de focus, superpositions légères
```

### 2.2 Accent or — référence culturelle (#e8c547)

La teinte or est la couleur culturelle et commerciale de la plateforme. Elle est utilisée **avec parcimonie** — uniquement pour les badges Premium, les étoiles de notation, et quelques ornements — pour préserver son pouvoir d'attraction visuelle. Une couleur rare attire l'œil ; une couleur omniprésente se fond dans le décor.

```
Gold          #e8c547   rgb(232, 197, 71)   — Badge Premium, icônes étoiles
Gold Light    #f5d96c   rgb(245, 217, 108)  — État hover sur éléments or
Gold Dark     #c9a227   rgb(201, 162, 39)   — Texte sur fond or, variante sombre
Gold Muted    rgba(232,197,71,0.15)         — Fond du badge Premium (semi-transparent)
```

### 2.3 Accent teal — contenus payants à l'unité (#2ec27e)

Les contenus payants à l'unité utilisent le teal (bleu-vert) pour se distinguer clairement des contenus premium. Il était important que les trois niveaux d'accès (libre, premium, payant) soient identifiables par la couleur seule, sans que l'utilisateur ait besoin de lire le texte du badge. Le teal reste dans la famille des couleurs fraîches pour ne pas perturber la cohérence générale, tout en étant suffisamment distinct de l'or et du bleu.

```
Teal          #2ec27e   rgb(46, 194, 126)   — Badge "Achat", bouton d'achat unitaire
Teal Light    #57e389   rgb(87, 227, 137)   — Hover
Teal Dark     #1a7348   rgb(26, 115, 72)    — Variante sombre pour les fonds
Teal Muted    rgba(46,194,126,0.14)         — Fond du badge payant
```

### 2.4 Fonds — dark mode

Les fonds dark mode utilisent une famille de gris très foncés avec une légère teinte bleu-gris. Cette subtile teinte bleue, à peine perceptible, maintient la cohérence colorimétrique avec la couleur principale : l'œil perçoit l'interface comme un ensemble harmonieux plutôt qu'un mélange de bleus vifs sur des gris neutres.

```
Background Base     #0d1018   — Fond de l'application, fond des pages catalogue
Background Surface  #171b26   — Cartes de contenu, modales, panneaux latéraux
Background Raised   #202434   — Cartes au survol, éléments légèrement surélevés
Background Overlay  #2a2f42   — Tooltips, dropdowns, en-têtes de tableaux
Background Border   #2e3347   — Bordures, séparateurs, contours de champs
```

### 2.5 Texte

```
Text Primary   #eef0f6   — Titres, contenu principal, labels actifs
Text Secondary #8d96a8   — Descriptions, métadonnées, sous-titres
Text Muted     #545d6e   — Placeholders, labels désactivés, timestamps
Text On-Blue   #ffffff   — Texte sur fond bleu (boutons primaires)
```

### 2.6 Couleurs sémantiques

```
Success  #57e389   — Confirmation paiement, leçon terminée, upload réussi
Error    #ed333b   — Échec paiement, erreur API, carte refusée
Warning  #f5c211   — Premium expirant bientôt, cache sur le point d'expirer
Info     #62a0ea   — Notifications générales, info-bulles
```

---

## 3. Typographie

### 3.1 Familles de polices

StreamMG utilise deux polices complémentaires, disponibles gratuitement sur Google Fonts.

**Sora** est la police d'affichage. Elle est choisie pour sa personnalité douce et contemporaine : ses terminaisons légèrement arrondies apportent de la chaleur là où des géométriques strictes comme Futura seraient froides, tout en restant parfaitement lisible en gras sur fond sombre. Elle est utilisée pour les titres (h1 à h4), les noms de contenus dans les cartes, les CTA principaux, et le logo. Son weight 800 (ExtraBold) est particulièrement efficace pour les grands titres héros.

**DM Sans** est la police de corps. Conçue spécifiquement pour les interfaces numériques, elle offre une excellente lisibilité aux petites tailles sur écran. Son dessin neutre et fonctionnel laisse la police d'affichage exprimer la personnalité de la plateforme sans concurrence. Elle est utilisée pour les descriptions, les métadonnées, les labels de formulaires, et tout texte de plus de deux lignes.

L'implémentation mobile charge ces polices via `expo-font` avec `useFonts()`. L'implémentation web les importe via Google Fonts dans le `<head>` du fichier `index.html` ou via `@import` dans le CSS global.

### 3.2 Échelle typographique

L'échelle utilise un ratio de progression de 1.25 (Major Third), qui produit une hiérarchie claire sans sauts de taille trop abruptes entre les niveaux.

```
Display XL  39px  Sora ExtraBold 800  lh:1.08  ls:-0.035em  — Titre héro page d'accueil
Display L   31px  Sora ExtraBold 800  lh:1.10  ls:-0.030em  — Titre de section principal (h1)
Heading L   25px  Sora Bold 700       lh:1.20  ls:-0.025em  — Titres de page (h2)
Heading M   20px  Sora SemiBold 600   lh:1.25  ls:-0.020em  — Sous-titres (h3)
Heading S   16px  Sora Medium 500     lh:1.35  ls:-0.010em  — Noms de contenus dans les cartes (h4)
Body L      16px  DM Sans Regular 400 lh:1.60  ls:0          — Descriptions longues, texte principal
Body M      14px  DM Sans Regular 400 lh:1.55  ls:0          — Métadonnées, durée, catégorie
Body S      12px  DM Sans Regular 400 lh:1.50  ls:0          — Labels de badges, timestamps
Caption     11px  DM Sans Medium 500  lh:1.40  ls:+0.06em   — Section labels, mentions légales
```

---

## 4. Espacements et mise en page

### 4.1 Grille d'espacement

Tous les espacements sont des multiples de 4 pixels. Cette discipline garantit l'alignement précis entre les éléments lors de l'implémentation et la cohérence visuelle globale.

```
sp-1  :  4px   Espacement minimal — entre icône et label
sp-2  :  8px   Espacement serré — padding interne des badges
sp-3  : 12px   Espacement compact — gap entre éléments de liste mobile
sp-4  : 16px   Espacement standard — padding interne des cartes
sp-5  : 20px   Espacement moyen
sp-6  : 24px   Espacement large — gap entre cartes catalogue
sp-8  : 32px   Très large — marges de section
sp-10 : 40px   Padding vertical des pages
sp-12 : 48px   Section grande
sp-16 : 64px   Entre blocs majeurs (héro → catalogue)
```

### 4.2 Grille de mise en page — Web

Sur le web, la mise en page utilise une grille à 12 colonnes avec une gouttière de 24px. La largeur maximale du contenu est de 1 440px avec des marges latérales de 48px sur grands écrans (≥1280px), 32px sur écrans moyens (768–1279px), et 16px sur mobile web (<768px).

Le catalogue utilise une grille CSS `grid-template-columns: repeat(auto-fill, minmax(180px, 1fr))` qui ajuste automatiquement le nombre de colonnes selon la largeur disponible. Sur un écran 1440px avec 48px de marge de chaque côté, cela produit environ 7 à 8 colonnes. Sur tablette, environ 4 à 5. Sur mobile web, 2 colonnes.

### 4.3 Grille de mise en page — Mobile

Sur mobile, la largeur disponible est occupée en pleine largeur avec des paddings horizontaux de 16px. Les listes horizontales (sections "Tendances", "Continuer à regarder") utilisent des cartes de largeur fixe 140px avec aspect ratio 5:7. Les grilles verticales (catalogue, résultats de recherche) utilisent 2 colonnes avec un espacement de 12px.

### 4.4 Rayons de bord

```
Radius S    6px   — Badges, tags, chips
Radius M   10px   — Cartes de contenu, boutons, champs de formulaire
Radius L   16px   — Modales, panneaux de bas de page mobile (bottom sheet)
Radius XL  24px   — Cartes héro, panneaux d'information, frames visuels importants
Radius Full 9999px — Boutons pill, avatars ronds, points indicateurs
```

---

## 5. Composants UI

### 5.1 Boutons

StreamMG définit cinq variantes de boutons, chacune avec des états documentés pour le repos, le survol, la pression, l'état désactivé, et l'état de chargement.

Le **bouton Principal** (fond #3584e4, texte blanc) est réservé aux actions primaires les plus importantes : "Lire maintenant", "Confirmer le paiement", "S'abonner à Premium". Son ombre portée colorée (box-shadow avec de la couleur bleue) le distingue des surfaces environnantes et renforce visuellement son importance. Au survol, le fond s'éclaircit vers #62a0ea avec une transition de 180ms. À la pression, une légère mise à l'échelle (scale 0.97) simule un retour physique.

Le **bouton Secondaire** (fond transparent, bordure bleue) est utilisé pour les actions importantes mais non primaires : "Annuler", "En savoir plus", "Voir l'aperçu". Il n'attire pas l'attention autant que le bouton principal, ce qui crée une hiérarchie visuelle claire sur les pages avec plusieurs actions.

Le **bouton Teal** (fond #2ec27e) est utilisé exclusivement pour les CTA d'achat unitaire. Sa couleur distincte signale immédiatement qu'une action financière est en jeu, préparant mentalement l'utilisateur avant même qu'il lise le texte.

Le **bouton Fantôme** (fond transparent, texte bleu) est utilisé pour les actions tertiaires dans les listes et les en-têtes de section : "Voir tout", "Modifier", "Partager".

Le **bouton Danger** (fond rouge translucide, bordure rouge) est réservé aux actions destructrices : suppression d'un contenu, annulation d'un abonnement. Sa couleur distinctive avertit l'utilisateur de la gravité de l'action.

La hauteur standard est de **44px** pour les boutons normaux et **34px** pour les boutons compacts. Ces valeurs correspondent respectivement aux recommandations de cible tactile minimale d'Apple (44pt) et Google (48dp), garantissant une utilisation confortable au doigt sur mobile.

### 5.2 Cartes de contenu (ContentCard)

La carte de contenu est le composant le plus visible de toute l'interface. Sa conception doit être impeccable car elle apparaît des dizaines de fois sur chaque page.

La structure de la carte se compose de deux zones distinctes. La zone vignette occupe la totalité de la largeur de la carte avec un aspect ratio 5:7 (portrait), qui convient aussi bien aux affiches de films qu'aux pochettes musicales. Un dégradé du transparent vers le fond de carte (#171b26) est appliqué sur le tiers inférieur de la vignette via un pseudo-élément `::after`, ce qui permet d'afficher du texte en superposition sur des vignettes sombres ou claires de manière lisible. Le badge de niveau d'accès est positionné en absolu en haut à droite de la vignette. Un bouton de lecture circulaire bleu apparaît en superposition au centre lors du survol (transition d'opacité de 200ms), visible uniquement sur web puisque le mobile n'a pas d'état "hover". La zone d'information sous la vignette affiche le titre en Sora Medium 13px (tronqué après une ligne), puis la catégorie et la durée en DM Sans 11px, colorés en Text Muted. Pour les tutoriels, une barre de progression de 3px de hauteur est affichée sous les métadonnées avec le pourcentage de complétion.

L'effet de survol sur web combine trois propriétés : `transform: translateY(-5px)` pour faire monter la carte, `box-shadow` renforcé pour l'ombre portée, et `border-color` qui passe de la bordure neutre à une légère teinte bleue. Ces trois propriétés animées ensemble donnent une impression de profondeur et de réponse de l'interface.

### 5.3 Badges de niveau d'accès

Les badges sont les indicateurs visuels clés du modèle économique. Ils sont conçus pour être lisibles sur n'importe quelle couleur de vignette, ce qui est obtenu par deux mécanismes : un fond semi-transparent coloré (90% d'opacité) qui assure un minimum de contraste, et une légère ombre de texte (text-shadow) pour les cas extrêmes où le fond de la vignette serait de la même couleur que le texte du badge.

Le **badge Premium** est un rectangle arrondi (radius 6px) avec un fond bleu nuit (#1a3d6e à 90%), un texte "★ PREMIUM" en DM Sans 11px SemiBold et en couleur or (#e8c547), et une étoile de 12px. L'usage de l'étoile comme symbole est universel et transcende les barrières linguistiques.

Le **badge Payant** affiche directement le prix en ariary dans un badge teal : fond #1a7348 à 90%, texte en #2ec27e. L'affichage direct du prix est une décision fonctionnelle forte : l'utilisateur n'a pas à chercher l'information, elle est immédiatement présente sur la vignette.

### 5.4 Navigation web — Topbar

La topbar web est fixée en haut (position sticky) avec une hauteur de 60px. Elle contient de gauche à droite : le logo "StreamMG" en Sora ExtraBold 17px avec le "MG" en bleu, les liens de navigation centrés (Accueil, Explorer, Tutoriels), la barre de recherche, et à droite le bouton "★ Premium" et l'avatar utilisateur. Lors du scroll (après 20px de défilement), un effet `backdrop-filter: blur(16px)` est activé avec une légère augmentation de l'opacité du fond, donnant l'effet "verre dépoli" caractéristique des interfaces modernes.

### 5.5 Navigation mobile — Tab bar

Sur mobile, la navigation principale est une barre d'onglets fixée en bas avec une hauteur de 56px plus la hauteur de la safe area système. Elle contient quatre onglets : Accueil, Explorer, Recherche, et Profil. L'onglet actif est distingué par l'icône et le label en #62a0ea (Primary Light), les autres en Text Muted. Un point indicateur bleu de 4px de diamètre est affiché sous l'icône de l'onglet actif.

### 5.6 Mini-player audio persistant

Le mini-player est l'élément de continuité auditive. Il est présent en permanence dès qu'une lecture audio est en cours, quelle que soit la page visitée. Sa structure se décompose en deux parties : une barre de progression de 3px en haut (le seul élément interactif qui permet de scrubber en cliquant/glissant), et le corps de 68px contenant la pochette (44×44px, radius 6px), le titre et l'artiste (Sora 13px / DM Sans 12px), et les contrôles (prev, play/pause avec fond circulaire bleu, next, et favori).

Sur web, la persistance est obtenue en plaçant le composant dans `App.tsx` en dehors du `RouterProvider`, garantissant qu'il ne se démonte jamais lors des navigations. Sur mobile, il est dans le layout racine d'expo-router, positionné en absolu au-dessus de la tab bar.

### 5.7 Écrans intermédiaires (Access Gates)

Ces écrans s'affichent lorsque l'API retourne une erreur 403 avec un champ `reason`. Leur conception doit être bienveillante, pas punitive. L'utilisateur ne doit pas se sentir exclu mais invité à accéder à plus.

L'**écran premium** affiche une icône étoile dorée de 64px dans un cercle or translucide, le titre "Contenu Premium", une courte description, le prix mensuel de l'abonnement, et les deux boutons ("S'abonner à Premium" en bleu, "Fermer" en fantôme). Une ligne de dégradé or en haut du panneau rappelle subtilement la couleur premium.

L'**écran d'achat** suit la même structure mais avec des couleurs teal, une icône cadenas, le titre du contenu, le prix unitaire, la mention "Accès permanent", et les boutons ("Acheter ce contenu" en teal, "Fermer" en fantôme). Le fait d'indiquer "Accès permanent" directement sur l'écran d'achat est important : cela rassure l'utilisateur que son achat ne sera pas perdu.

### 5.8 Barre de progression des tutoriels

Sur les cartes de tutoriels, une barre de progression de 3px de hauteur est affichée sous les métadonnées. Elle utilise un dégradé de #3584e4 vers #62a0ea (gauche vers droite) sur un fond #202434, avec un rayon complet (pill). Le pourcentage est affiché en DM Sans 10px Medium, couleur Text Muted, aligné à droite.

Sur la page de détail d'un tutoriel, une version plus grande (6px de hauteur) est affichée avec le pourcentage à droite et le label "X leçons terminées sur Y" en dessous.

---

## 6. Iconographie

StreamMG utilise la librairie **Lucide** (lucide-react pour le web, @lucide/react-native pour le mobile). Lucide est un ensemble d'icônes SVG open source avec un style linéaire cohérent, un stroke-width uniforme de 1.75px, et des coins légèrement arrondis qui sont en harmonie avec les terminaisons de la police Sora.

Les icônes de navigation et d'action principales sont en taille 22–24px. Les icônes de statut inline (validations, avertissements) sont en 16px. Les icônes illustratives dans les écrans vides (état "pas de résultat") sont en 48px avec une opacité réduite à 30% pour ne pas distraire.

---

## 7. Animations et transitions

L'intention générale des animations est la réactivité fluide, pas l'entertainment. Chaque transition doit confirmer une action ou guider l'attention, jamais retarder ou distraire.

Les transitions d'état simple (hover, focus, active sur les boutons et cartes) ont une durée de 150–200ms avec une courbe `ease-out`. La courbe ease-out donne la sensation d'une réponse immédiate (la transition commence vite) qui se termine doucement (sans à-coup à la fin).

Les animations de navigation entre pages sur mobile (expo-router) utilisent un slide horizontal de 300ms avec la courbe de décélération iOS standard, ce qui est cohérent avec les conventions de la plateforme mobile et évite la désorientation de l'utilisateur.

L'apparition des sections lors du chargement initial de la page utilise un `fadeUp` de 400ms — translation verticale de 12px vers 0 avec fondu d'opacité — avec des délais échelonnés (animation-delay) entre chaque section pour créer un effet de cascade ordonné.

---

## 8. Tokens d'implémentation

### Pour le web — tailwind.config.js

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        // Couleur principale
        primary: {
          DEFAULT: '#3584e4',
          light:   '#62a0ea',
          dark:    '#1c71d8',
          muted:   '#1a3d6e',
        },
        // Accent or — contenus premium
        gold: {
          DEFAULT: '#e8c547',
          light:   '#f5d96c',
          dark:    '#c9a227',
        },
        // Accent teal — achats unitaires
        teal: {
          DEFAULT: '#2ec27e',
          light:   '#57e389',
          dark:    '#1a7348',
        },
        // Fonds dark mode
        bg: {
          base:    '#0d1018',
          surface: '#171b26',
          raised:  '#202434',
          overlay: '#2a2f42',
          border:  '#2e3347',
        },
        // Texte
        content: {
          primary:   '#eef0f6',
          secondary: '#8d96a8',
          muted:     '#545d6e',
        },
        // Sémantique
        status: {
          success: '#57e389',
          error:   '#ed333b',
          warning: '#f5c211',
          info:    '#62a0ea',
        },
      },
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        body:    ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        s:    '6px',
        m:    '10px',
        l:    '16px',
        xl:   '24px',
      },
    },
  },
};
```

### Pour le mobile — theme.ts (NativeWind + StyleSheet)

```typescript
// Ce fichier est importé dans tous les composants mobile
// qui ont besoin des valeurs numériques (StyleSheet)
export const colors = {
  primary:      '#3584e4',
  primaryLight: '#62a0ea',
  primaryDark:  '#1c71d8',
  primaryMuted: '#1a3d6e',
  gold:         '#e8c547',
  teal:         '#2ec27e',
  tealLight:    '#57e389',
  bgBase:       '#0d1018',
  bgSurface:    '#171b26',
  bgRaised:     '#202434',
  bgBorder:     '#2e3347',
  textPrimary:  '#eef0f6',
  textSecond:   '#8d96a8',
  textMuted:    '#545d6e',
  success:      '#57e389',
  error:        '#ed333b',
  warning:      '#f5c211',
};

export const spacing = {
  1:  4,   2:  8,   3: 12,  4: 16,
  5: 20,   6: 24,   8: 32, 10: 40,
  12: 48, 16: 64,
};

export const radius = {
  s:    6,
  m:   10,
  l:   16,
  xl:  24,
  full: 9999,
};

export const typography = {
  displayXL: { fontFamily: 'Sora_800ExtraBold', fontSize: 39, lineHeight: 42, letterSpacing: -1.3 },
  displayL:  { fontFamily: 'Sora_800ExtraBold', fontSize: 31, lineHeight: 34, letterSpacing: -0.9 },
  headingL:  { fontFamily: 'Sora_700Bold',      fontSize: 25, lineHeight: 30 },
  headingM:  { fontFamily: 'Sora_600SemiBold',  fontSize: 20, lineHeight: 25 },
  headingS:  { fontFamily: 'Sora_500Medium',    fontSize: 16, lineHeight: 22 },
  bodyL:     { fontFamily: 'DMSans_400Regular', fontSize: 16, lineHeight: 26 },
  bodyM:     { fontFamily: 'DMSans_400Regular', fontSize: 14, lineHeight: 22 },
  bodyS:     { fontFamily: 'DMSans_400Regular', fontSize: 12, lineHeight: 18 },
  caption:   { fontFamily: 'DMSans_500Medium',  fontSize: 11, lineHeight: 15 },
};
```

---

## 9. Accessibilité

Le design system respecte les critères WCAG 2.1 niveau AA. Le rapport de contraste entre le texte primaire (#eef0f6) et le fond de base (#0d1018) atteint 16.2:1, bien au-delà du minimum de 4.5:1 requis pour le texte courant. Le rapport de contraste entre le bleu principal (#3584e4) et le fond de base est de 5.4:1, ce qui satisfait le critère AA pour le texte normal et largement le critère AAA pour le texte large.

Tous les éléments interactifs sont navigables au clavier sur le web, avec un indicateur de focus visible (anneau de 2px en #3584e4 avec un halo translucide). Sur mobile, toutes les cibles tactiles respectent la taille minimale de 44×44 points.

Les icônes décoratives portent l'attribut `aria-hidden="true"`. Les icônes fonctionnelles portent un `aria-label` descriptif. Les images de vignettes portent un attribut `alt` avec le titre du contenu.

---

## 10. Références bibliographiques

Apple Inc. (2025). *Human Interface Guidelines*. https://developer.apple.com/design/human-interface-guidelines

Google. (2025). *Material Design 3*. https://m3.material.io

GNOME Project. (2025). *Adwaita Design System*. https://developer.gnome.org/hig

W3C. (2018). *Web Content Accessibility Guidelines (WCAG) 2.1*. https://www.w3.org/TR/WCAG21

Sora. (2025). *Sora Font — Google Fonts*. https://fonts.google.com/specimen/Sora

DM Sans. (2025). *DM Sans Font — Google Fonts*. https://fonts.google.com/specimen/DM+Sans

Lucide. (2025). *Lucide Icons*. https://lucide.dev

NativeWind. (2025). *NativeWind v4*. https://www.nativewind.dev

Expo. (2025). *expo-font*. https://docs.expo.dev/versions/latest/sdk/font

Tailwind CSS. (2025). *Tailwind CSS v3 Documentation*. https://tailwindcss.com/docs
