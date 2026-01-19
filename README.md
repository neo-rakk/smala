# Famille DZ en Or - Supabase Migration

Ce projet a été migré pour utiliser **Supabase** comme backend (Base de données, Temps réel, et Authentification personnalisée).

## 🚀 Déploiement sur Vercel

1.  **Créer un projet sur Supabase** :
    *   Allez sur [supabase.com](https://supabase.com/) et créez un nouveau projet.
    *   Récupérez votre **Project URL** et votre **anon Key** dans les paramètres API.
2.  **Initialiser la base de données** :
    *   Option A (Automatique) : Si vous avez accès à une base Postgres directe (ex: Vercel Postgres), vous pouvez configurer `POSTGRES_URL`.
    *   Option B (Manuel - Recommandé pour Supabase) : Copiez le contenu du fichier `supabase_schema.sql` (généré à la racine) et exécutez-le dans le **SQL Editor** de votre tableau de bord Supabase.
3.  **Configurer Vercel** :
    *   Liez votre dépôt GitHub à Vercel.
    *   Importez les variables d'environnement en utilisant le fichier `.env.vercel` ou en les saisissant manuellement.
    *   Le domaine de redirection configuré est `smala.vercel.app`.

## 🔑 Authentification Personnalisée

Le projet utilise désormais un système d'authentification par **Pseudo / Mot de passe** stocké dans la table `user_accounts`. Cela évite les limitations d'envoi d'emails de Supabase Auth.

*   **Inscription** : Crée un compte et un profil joueur.
*   **Connexion** : Utilise le pseudo et le mot de passe choisis.
*   **Session** : Gérée via `localStorage` pour une expérience fluide.

## 🛠️ Fonctionnalités Admin

Pour accéder aux fonctions de modération (suppression des scores sur le leaderboard) :
1.  Connectez-vous avec votre compte.
2.  Dans l'onglet "Classement", cliquez sur le bouton "Admin" (en bas ou via une icône).
3.  Entrez le code PIN : `2985`.
4.  Des icônes de suppression (🗑️) apparaîtront à côté de chaque score.

## 📁 Variables d'Environnement (.env)

| Variable | Description |
| :--- | :--- |
| `VITE_SUPABASE_URL` | URL de votre projet Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clé "anon" publique de Supabase |
| `VITE_ADMIN_PIN` | Code PIN pour la modération (par défaut: 2985) |

## 📦 Scripts

*   `npm run dev` : Lance le serveur de développement.
*   `npm run build` : Compile l'application pour la production.
*   `npm run db:init` : Tente d'initialiser la base de données (nécessite `POSTGRES_URL`).
