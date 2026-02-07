# Quiz Biblique - Application Interactive

Application web complète pour organiser des quiz bibliques interactifs en temps réel, inspirée de Kahoot. Parfaite pour les églises, groupes de jeunes, écoles du dimanche et événements chrétiens.

## 🌟 Fonctionnalités

### Interface Animateur
- ✏️ Création et édition illimitée de quiz
- 📝 Questions avec 2 à 4 réponses possibles
- ⏱️ Temps limite configurable (10-60 secondes)
- 📖 Références bibliques optionnelles
- 💾 Sauvegarde locale automatique (localStorage)
- 📥 Import/Export de quiz en JSON
- 🎮 Lancement de parties avec code PIN à 6 chiffres
- 📊 Statistiques en temps réel pendant le jeu
- 🏆 Classement et podium final animé

### Interface Participant
- 🔢 Connexion simple avec code PIN
- 👤 Choix de pseudo personnalisé
- 🎯 Interface de réponse intuitive (4 boutons colorés)
- ⚡ Feedback immédiat sur les réponses
- 📈 Visualisation du classement personnel
- 🎉 Résultats finaux avec médailles

### Système de Points
- 1000 points de base pour une réponse correcte
- Bonus de vitesse jusqu'à +500 points
- Classement en temps réel
- Podium top 3 final

## 🚀 Installation et Lancement

### Option 1 : Ouverture Directe (Recommandé pour débuter)

1. **Téléchargez tous les fichiers** dans un dossier
2. **Double-cliquez** sur `index.html`
3. L'application s'ouvre dans votre navigateur par défaut

⚠️ **Note** : Pour que la connexion temps réel fonctionne entre plusieurs appareils, vous devez utiliser l'Option 2 (serveur local).

### Option 2 : Serveur Local (Pour jouer en réseau)

#### Avec Python (recommandé)

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

Puis ouvrez : `http://localhost:8000`

#### Avec Node.js

```bash
# Installer http-server globalement
npm install -g http-server

# Lancer le serveur
http-server -p 8000
```

Puis ouvrez : `http://localhost:8000`

#### Avec PHP

```bash
php -S localhost:8000
```

Puis ouvrez : `http://localhost:8000`

### Pour jouer sur plusieurs appareils (même réseau WiFi)

1. Lancez le serveur sur un ordinateur (Option 2)
2. Trouvez l'adresse IP locale de cet ordinateur :
   - **Windows** : `ipconfig` dans cmd
   - **Mac/Linux** : `ifconfig` ou `ip addr` dans le terminal
   - Exemple : `192.168.1.100`
3. Sur les autres appareils, ouvrez : `http://192.168.1.100:8000`

## 📖 Guide d'Utilisation

### 1. Créer un Quiz

1. Ouvrez l'application et cliquez sur **"Animateur"**
2. Cliquez sur **"+ Nouveau Quiz"**
3. Entrez le titre du quiz
4. Cliquez sur **"+ Ajouter Question"** pour chaque question
5. Pour chaque question :
   - Saisissez le texte de la question
   - Ajoutez 2 à 4 réponses
   - Cochez la case radio de la réponse correcte
   - Définissez le temps limite (10-60 secondes)
   - (Optionnel) Ajoutez une référence biblique
6. Cliquez sur **"💾 Enregistrer"**

### 2. Lancer une Partie

1. Dans la liste des quiz, cliquez sur **"▶ Lancer"**
2. Un code PIN à 6 chiffres s'affiche
3. Partagez ce code avec les participants
4. Attendez que les participants se connectent
5. Cliquez sur **"🚀 Démarrer le Quiz"** quand vous êtes prêt

### 3. Rejoindre une Partie (Participants)

1. Ouvrez l'application et cliquez sur **"Participant"**
2. Entrez le code PIN à 6 chiffres
3. Choisissez votre pseudo
4. Cliquez sur **"Rejoindre"**
5. Attendez le démarrage du quiz

### 4. Jouer

**Animateur :**
- La question s'affiche automatiquement avec un compte à rebours
- Suivez les statistiques en temps réel
- Cliquez sur **"Prochaine Question"** après chaque question
- Visualisez le classement entre chaque question
- Admirez le podium final ! 🏆

**Participant :**
- Lisez la question
- Cliquez sur le bouton de votre réponse (rouge/bleu/jaune/vert)
- Recevez un feedback immédiat
- Consultez votre classement
- Célébrez vos résultats ! 🎉

### 5. Importer/Exporter des Quiz

**Exporter :**
1. Dans la liste des quiz, cliquez sur **"📥 Exporter"**
2. Le fichier JSON est téléchargé automatiquement

**Importer :**
1. Cliquez sur **"📥 Importer"**
2. Sélectionnez un fichier JSON de quiz
3. Le quiz est ajouté à votre liste

## 📋 Format JSON des Quiz

```json
{
  "title": "Titre du Quiz",
  "questions": [
    {
      "question": "Texte de la question?",
      "answers": [
        { "text": "Réponse 1", "isCorrect": true },
        { "text": "Réponse 2", "isCorrect": false },
        { "text": "Réponse 3", "isCorrect": false },
        { "text": "Réponse 4", "isCorrect": false }
      ],
      "timeLimit": 30,
      "reference": "Jean 3:16"
    }
  ]
}
```

### Règles de Format
- **title** : Obligatoire, chaîne de caractères
- **questions** : Obligatoire, tableau de questions
- **question** : Obligatoire, texte de la question
- **answers** : Obligatoire, 2 à 4 réponses
- **isCorrect** : Exactement UNE réponse doit être `true`
- **timeLimit** : Obligatoire, entre 10 et 60 secondes
- **reference** : Optionnel, référence biblique

## 🎨 Personnalisation

### Mode Sombre
Cliquez sur l'icône 🌙/☀️ en haut à droite pour basculer entre les modes clair et sombre.

### Couleurs des Réponses
Les réponses sont codées par couleur (style Kahoot) :
- 🔴 Rouge
- 🔵 Bleu
- 🟡 Jaune
- 🟢 Vert

## 🔧 Technologies Utilisées

- **HTML5** : Structure de l'application
- **CSS3** : Design moderne et responsive
- **JavaScript (ES6+)** : Logique de l'application
- **PeerJS** : Connexion P2P temps réel (gratuit, sans serveur backend)
- **localStorage** : Persistance des quiz côté animateur

## 📱 Compatibilité

- ✅ Chrome/Edge (recommandé)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile (iOS/Android)
- ✅ Tablette

**Résolution minimale** : 320px (mobile)

## 🛠️ Dépannage

### Le code PIN ne fonctionne pas
- Vérifiez que l'animateur et les participants sont sur le **même réseau WiFi**
- Utilisez un **serveur local** (Option 2) au lieu d'ouvrir directement le fichier HTML
- Attendez quelques secondes après avoir cliqué sur "Rejoindre"
- Vérifiez que vous avez bien entré les **6 chiffres** du code PIN

### Les joueurs ne se connectent pas
- Assurez-vous que tous les appareils sont sur le **même réseau**
- Vérifiez que le **pare-feu** n'est pas bloquant
- Testez avec l'adresse IP locale de l'animateur (ex: `http://192.168.1.100:8000`)
- Rechargez la page et réessayez

### Le quiz ne démarre pas
- Vérifiez qu'au moins **1 joueur** est connecté
- Vérifiez que le quiz contient au moins **1 question valide**

### Les quiz ne se sauvegardent pas
- Vérifiez que le **localStorage** est activé dans votre navigateur
- Ne naviguez pas en mode **navigation privée**
- Vérifiez l'espace de stockage disponible

## 📚 Quiz de Démonstration Inclus

L'application inclut un quiz de démonstration **"Les Miracles de Jésus"** avec 10 questions sur les miracles accomplis par Jésus-Christ, avec références bibliques.

## 🤝 Contribution

N'hésitez pas à créer vos propres quiz et à les partager avec votre communauté ! Vous pouvez :
- Créer des quiz sur différents thèmes bibliques
- Adapter les questions à différents niveaux (enfants, adolescents, adultes)
- Exporter et partager vos quiz en JSON

## 📄 Licence

Ce projet est libre d'utilisation pour des fins éducatives et religieuses.

## 💡 Conseils d'Utilisation

### Pour les Animateurs
- **Testez** votre quiz avant l'événement
- **Projetez** l'écran de l'animateur pour que tous voient les questions
- Utilisez des **questions variées** (faciles et difficiles)
- Ajoutez des **références bibliques** pour encourager l'apprentissage
- Préparez des **petits prix** pour les gagnants 🎁

### Pour les Événements
- Installez l'application sur un **ordinateur portable** pour l'animateur
- Les participants utilisent leurs **smartphones/tablettes**
- Assurez-vous d'avoir un **réseau WiFi stable**
- Prévoyez **15-30 minutes** pour un quiz de 10 questions
- Créez une **ambiance festive** avec de la musique entre les questions

## 🙏 Support Spirituel

> *"Toute Écriture est inspirée de Dieu, et utile pour enseigner, pour convaincre, pour corriger, pour instruire dans la justice."* - 2 Timothée 3:16

Que cette application aide votre communauté à grandir dans la connaissance de la Parole de Dieu de manière ludique et interactive !

---

**Que Dieu vous bénisse ! ✝️**
