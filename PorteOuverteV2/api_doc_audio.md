# 🎵 Documentation API Audio - StreamMG

Ce document centralise les informations nécessaires pour intégrer la lecture audio standard (MP3/WAV) dans les clients **Web** et **Mobile** de StreamMG.

---

## 🚀 1. Référence de l'API

### Obtenir l'URL de lecture
Récupère le chemin d'accès au fichier audio physique stocké sur le serveur.

*   **URL :** `/api/audio/:contentId/url`
*   **Méthode :** `GET`
*   **Authentification :** Optionnelle (selon la visibilité du contenu)
*   **Format de réponse :** `JSON`

#### Paramètres (Path)
| Paramètre | Type | Description |
| :--- | :--- | :--- |
| `contentId` | `string` | ID MongoDB unique du contenu audio. |

#### Réponses types

**✅ 200 OK (Succès)**
```json
{
    "url": "/uploads/audio/fc8093da542c2869.mp3"
}
```

**🔵 304 Not Modified (Cache)**
Indique que le client possède déjà la version la plus récente de cette URL. Très utile pour économiser la bande passante.

**❌ 404 Not Found**
```json
{ "error": "Contenu audio introuvable." }
```

---

## 🌐 2. Guide d'intégration Web (React)

Pour le Web, on utilise la puissance de la balise HTML5 `<audio>`.

**Logique métier :**
1. Appeler l'API avec le `contentId`.
2. Concaténer le `BASE_URL` avec la propriété `url` reçue.
3. Injecter le résultat dans l'attribut `src`.

```javascript
import React, { useState, useEffect } from 'react';

const WebAudioPlayer = ({ contentId }) => {
  const [source, setSource] = useState(null);
  const BASE_URL = "https://streammg.alwaysdata.net";

  useEffect(() => {
    fetch(`${BASE_URL}/api/audio/${contentId}/url`)
      .then(res => res.json())
      .then(data => setSource(`${BASE_URL}${data.url}`))
      .catch(err => console.error("Erreur API:", err));
  }, [contentId]);

  return (
    <div className="audio-container">
      {source ? (
        <audio controls src={source} style={{ width: '100%' }}>
          Lecteur non supporté.
        </audio>
      ) : (
        <p>Chargement du flux...</p>
      )}
    </div>
  );
};
```

---

## 📱 3. Guide d'intégration Mobile (React Native / Expo)

Sur mobile, nous utilisons `expo-av` pour une gestion optimale des ressources système et de la mise en cache.

```javascript
import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Audio } from 'expo-av';

const MobilePlayer = ({ contentId }) => {
  const [sound, setSound] = useState();
  const BASE_URL = "https://streammg.alwaysdata.net";

  async function loadAndPlay() {
    try {
      // 1. Appel API
      const res = await fetch(`${BASE_URL}/api/audio/${contentId}/url`);
      const data = await res.json();

      // 2. Chargement du son
      const { sound } = await Audio.Sound.createAsync(
        { uri: `${BASE_URL}${data.url}` },
        { shouldPlay: true }
      );
      setSound(sound);
    } catch (e) {
      console.log("Erreur de lecture mobile", e);
    }
  }

  // Nettoyage de la mémoire (Memory Management)
  useEffect(() => {
    return sound ? () => sound.unloadAsync() : undefined;
  }, [sound]);

  return (
    <View style={{ padding: 20 }}>
      <TouchableOpacity onPress={loadAndPlay} style={{ backgroundColor: '#1DB954', padding: 15 }}>
        <Text style={{ color: 'white', textAlign: 'center' }}>▶️ JOUER LA MUSIQUE</Text>
      </TouchableOpacity>
    </View>
  );
};
```

---

## 💡 4. Bonnes Pratiques & Sécurité

> [!IMPORTANT]
> **Base URL :** Ne codez jamais l'URL `[https://streammg.alwaysdata.net](https://streammg.alwaysdata.net)` en dur partout. Utilisez une variable d'environnement (`.env`) côté Frontend pour pouvoir basculer entre votre serveur local et celui d'Alwaysdata.

*   **Gestion du HTTPS :** Android et iOS bloquent par défaut le trafic `http`. Assurez-vous que votre serveur Alwaysdata est bien configuré avec son certificat SSL.
*   **Optimisation Data :** L'utilisation des codes **304** (visibles dans tes logs) est cruciale à Madagascar. Elle permet à l'application mobile de ne pas retélécharger les métadonnées si elles n'ont pas changé.
*   **Nettoyage (Cleanup) :** Sur mobile, n'oubliez jamais d'appeler `unloadAsync()`. Si vous ne le faites pas, l'application continuera de consommer de la RAM même si l'utilisateur a quitté le lecteur.

