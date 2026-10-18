# NORA — Application IA Conversationnelle Complète

Application web d'intelligence artificielle conversationnelle moderne inspirée de **NORA**, entièrement responsive sur **Mobile, Tablette et PC**, avec intégration directe de l'API **Google Gemini** et d'un écosystème de **Plugins & Applications** (Mail, WhatsApp, Notion, Google Drive, etc.).

---

## 🌟 Fonctionnalités Clés

1. **Écosystème de Plugins & Applications (Style ChatGPT)** :
   - Accès direct depuis le menu hamburger via le bouton **`🧩 Plugins & Applications`** (avec badge compteur en temps réel).
   - Accès également via l'onglet **`Plugins & Apps`** de la fenêtre des Paramètres.
   - Catalogue complet d'intégrations :
     - **Gmail / Mail** : Clé API Google / Client ID, adresse email.
     - **WhatsApp Business** : Access Token (Bearer), Phone Number ID, WABA ID.
     - **Notion** : Internal Integration Token (`secret_...`), Database ID.
     - **Google Drive** : Clé API Drive, ID de dossier racine.
     - **Google Calendar** : Clé API agenda.
     - **Slack** : Bot User OAuth Token (`xoxb-...`), canal par défaut.
     - **GitHub** : Personal Access Token (`ghp_...`), dépôt principal.
   - Fenêtre de configuration dédiée pour chaque outil : saisie des clés API, liens d'aide vers les documentations officielles, activation/désactivation et bouton de déconnexion.
   - Les plugins actifs sont automatiquement injectés dans les capacités de NORA pour exécuter les demandes de l'utilisateur !

2. **Menu Hamburger & Navigation Latérale** :
   - **Recherche de discussion** : icône loupe ouvrant une barre de recherche en direct pour filtrer vos échanges.
   - **Retirer la fenêtre** : icône panneau rectangulaire pour masquer/replier la barre latérale.
   - **Discussions récentes synchronisées** : chargement instantané, suppression avec 🗑️, synchronisées avec Supabase Cloud (`public.ai_conversations`).
   - **Compte & Profil utilisateur dynamique** : affichage du nom réel, initiales et forfait avec bouton `Mettre à niveau`.
   - **Fenêtre Popover Compte** : menu contextuel flottant avec *Connexion / Inscription*, *Changer de forfait*, *Personnalisation*, *Profil*, *Paramètres*, *Aide*, *Se déconnecter*.

3. **Grande Fenêtre de Paramètres Complète (Inspirée de ChatGPT au Thème NORA)** :
   - 2 colonnes avec barre de recherche d'options, bouton de fermeture flottant en haut à gauche `[ ✕ ]`.
   - Onglets :
     - `⚙️ Général` : Version, thème, couleur d'accentuation, taille du texte, langue, dictée vocale.
     - `🔑 Clé API & Modèle` : Clé Google Gemini (`gemini-flash-latest`, `gemini-3.8-flash`, `gemini-2.5-pro`).
     - `🧩 Plugins & Apps` : Catalogue et gestion des connexions d'outils externes.
     - `⏱️ Personnalisation` : Instructions personnalisées (*Custom Instructions*).
     - `👤 Compte & Supabase Cloud` : Gestion du profil utilisateur, synchronisation en temps réel avec la table `ai_conversations` de Supabase.
     - `🎙️ Voix` : Personnalité vocale et vitesse d'élocution.
     - `💾 Gestion des données` : Historique et suppression.
     - `⌨️ Raccourcis clavier` : Liste des touches de raccourci.

4. **Design NORA & Typographie Font Awesome** :
   - Orbe 3D ambré lumineux animé en pur SCSS.
   - 100% vectoriel avec la bibliothèque **Font Awesome 6** (zéro émoji parasite).
   - Barre de recherche épurée avec textarea auto-extensible et bouton circulaire noir `↑`.
   - Carrousel de cartes professionnelles (photographes, prestataires) avec notes ★, tarifs et modale détaillée.

---

## 🛠️ Démarrage Local

```bash
# Lancer le serveur de développement local
npm run dev

# Compiler pour la production
npm run build
```

Accédez à l'application dans votre navigateur : **http://localhost:5173/**
