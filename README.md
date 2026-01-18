# Famille DZ en Or - Guide de Déploiement

Ce projet est une adaptation du jeu "Une Famille en Or" (Family Feud) pour la culture algérienne, optimisé pour une diffusion en direct (ex: TikTok Live) avec une synchronisation en temps réel via Supabase.

## 🚀 Déploiement Rapide sur Vercel

1. **Préparer Supabase** :
   - Créez un projet sur [Supabase](https://supabase.com/).
   - Allez dans le **SQL Editor** et exécutez le script suivant :
     ```sql
     -- Table pour stocker l'état global du jeu
     create table game_state (
       id text primary key,
       payload jsonb not null,
       updated_at timestamp with time zone default now()
     );

     -- Activer le Realtime pour permettre la synchronisation instantanée
     alter publication supabase_realtime add table game_state;

     -- Row Level Security (RLS)
     -- Pour un projet de démo/privé, vous pouvez désactiver RLS :
     alter table game_state disable row level security;

     -- OU, pour plus de sécurité, activez RLS et ajoutez une politique publique :
     -- alter table game_state enable row level security;
     -- create policy "Public Access" on game_state for all using (true) with check (true);
     ```

2. **Déployer sur Vercel** :
   - Connectez votre dépôt à Vercel.
   - Lors de la configuration des variables d'environnement, utilisez le bouton d'importation pour uploader le fichier `.env` qui se trouve à la racine du projet.
   - Cliquez sur **Deploy**.

## 🛠 Configuration Technique

Les variables d'environnement nécessaires sont :
- `VITE_SUPABASE_URL` : L'URL de votre projet Supabase.
- `VITE_SUPABASE_ANON_KEY` : La clé API anonyme de votre projet.

## 🎮 Comment Jouer

1. Accédez à l'URL déployée.
2. Cliquez sur l'icône de réglages (en bas à droite) pour accéder à la régie.
3. Entrez le code PIN : `2985`.
4. Gérez les scores, révélez les réponses et contrôlez le jeu en direct !

---
Développé avec ❤️ pour la communauté DZ.
