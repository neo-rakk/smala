# Famille DZ en Or - Guide de Déploiement

Ce projet est une adaptation du jeu "Une Famille en Or" (Family Feud) pour la culture algérienne, optimisé pour une diffusion en direct (ex: TikTok Live) avec une synchronisation en temps réel via Supabase.

## 🚀 Déploiement Rapide sur Vercel

1. **Préparer Supabase** :
   - Créez un projet sur [Supabase](https://supabase.com/).
   - **Note :** La création des tables et la configuration du Realtime sont désormais **automatiques** lors du premier déploiement sur Vercel, grâce au script `db:init`.

2. **Déployer sur Vercel** :
   - Connectez votre dépôt à Vercel.
   - Lors de la configuration des variables d'environnement, utilisez le bouton d'importation pour uploader le fichier `.env` qui se trouve à la racine du projet.
   - Cliquez sur **Deploy**.

## 🛠 Configuration Technique

Les variables d'environnement nécessaires sont :
- `VITE_SUPABASE_URL` : L'URL de votre projet Supabase.
- `VITE_SUPABASE_ANON_KEY` : La clé API anonyme de votre projet.
- `VITE_ADMIN_PIN` : Le code PIN pour accéder à la régie (ex: `2985`).

## 🎮 Comment Jouer

1. Accédez à l'URL déployée.
2. Cliquez sur l'icône de réglages (en bas à droite) pour accéder à la régie.
3. Entrez le code PIN : `2985`.
4. Gérez les scores, révélez les réponses et contrôlez le jeu en direct !

---
Développé avec ❤️ pour la communauté DZ.
