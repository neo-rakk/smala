# 🇩🇿 Famille DZ en Or - Plateforme Live

Une interface web interactive pour le jeu "Famille en Or" (version Algérienne), conçue pour être jouée en direct sur TikTok ou Discord.

## 🚀 Fonctionnalités

- **Contrôle Centralisé (Animateur) :** Un mode administrateur complet pour gérer les questions, les scores, le chrono et même lancer les dés pour les équipes.
- **Synchronisation Temps Réel :** Utilise Supabase pour synchroniser l'état du jeu instantanément entre l'animateur et les spectateurs/joueurs.
- **Affichage Joueur Simplifié :** Les joueurs voient l'évolution du jeu en temps réel sans avoir besoin d'interagir (idéal pour le streaming).
- **Anti-Blocage :** Remplace l'ancien système P2P par une base de données cloud pour éviter les blocages de navigateurs.

## 🛠 Configuration Supabase (Indispensable)

Pour que la synchronisation fonctionne, vous devez configurer votre projet Supabase :

1.  Allez dans votre **Table Editor** sur Supabase.
2.  Créez une table nommée `rooms` avec la structure suivante (ou utilisez le SQL ci-dessous dans l'**SQL Editor**) :

```sql
-- 1. Créer la table des salons
create table public.rooms (
  code text primary key,
  state jsonb not null,
  updated_at timestamp with time zone default now()
);

-- 2. Activer la réplication en temps réel
alter publication supabase_realtime add table rooms;
```

3.  Allez dans **Project Settings > API** pour récupérer votre URL et votre clé `anon`.

## 📦 Installation et Déploiement

### 1. Variables d'Environnement
Créez un fichier `.env` à la racine du projet (ou configurez-les sur Vercel/CodeSandbox) :

```env
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_cle_anon_supabase
```

### 2. Déploiement Local
```bash
pnpm install
pnpm dev
```

### 3. Déploiement Vercel / Netlify
Connectez votre dépôt GitHub et ajoutez les deux variables d'environnement ci-dessus dans les paramètres de déploiement. Le projet sera automatiquement construit et déployé.

## 🎮 Comment Jouer

1.  **Animateur :** 
    - Cliquez sur "MODE ANIMATEUR".
    - Créez un salon avec un code (ex: `DZ-2024`).
    - Gérez le jeu depuis le panneau de contrôle. Vous pouvez maintenant lancer les dés pour l'équipe A ou B directement.
2.  **Joueurs / Spectateurs :**
    - Entrez le code du salon créé par l'animateur.
    - Suivez le live ! Aucune interaction n'est requise de leur part.

## 📝 Notes Techniques
Le projet utilise **Vite**, **React**, **Tailwind CSS** et **Supabase**. L'ancien système PeerJS a été retiré pour garantir une fiabilité maximale sur tous les réseaux.
