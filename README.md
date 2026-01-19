# FAMILLE DZ EN OR - Version Supabase

Cette application est une version web du célèbre jeu "Une Famille en Or", adaptée pour un déploiement sur Vercel avec une base de données Supabase.

## 🚀 Déploiement Rapide sur Vercel

1. **Préparer Supabase :**
   - Créez un projet sur [Supabase](https://supabase.com/).
   - Récupérez votre **URL de projet** et votre **Clé Anon public**.
   - Récupérez votre **ConnectionString (URI)** dans Settings > Database (nécessaire pour `POSTGRES_URL`).

2. **Configurer Vercel :**
   - Importez votre repo sur Vercel.
   - Dans la fenêtre "Environment Variables", utilisez le bouton **Import .env** et uploadez le fichier `.env` fourni à la racine de ce projet.
   - **IMPORTANT :** Remplissez la variable `POSTGRES_URL` avec votre URI de base de données (format: `postgresql://postgres:[PASSWORD]@db.xxxx.supabase.co:5432/postgres`) pour que les tables soient créées automatiquement lors du déploiement.

3. **Déployer :**
   - Cliquez sur **Deploy**. Le script `scripts/init-db.mjs` s'exécutera automatiquement pour configurer les tables et activer le Realtime.

---

## 🛠 Configuration Manuelle de la Base de Données

Si vous préférez configurer la base de données manuellement via l'éditeur SQL de Supabase, exécutez le script suivant :

```sql
-- 1. Table de l'état du jeu
CREATE TABLE IF NOT EXISTS game_state (
  id text PRIMARY KEY,
  payload jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT now()
);

-- 2. Table des profils utilisateurs
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  nickname text,
  avatar_url text,
  updated_at timestamp with time zone DEFAULT now()
);

-- 3. Table du classement
CREATE TABLE IF NOT EXISTS leaderboard (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name text NOT NULL,
  score integer NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- 4. Désactiver RLS pour la démo (Optionnel - à configurer selon vos besoins de sécurité)
ALTER TABLE game_state DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard DISABLE ROW LEVEL SECURITY;

-- 5. Activer le Realtime pour la synchronisation en direct
-- Assurez-vous que la publication 'supabase_realtime' existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE game_state;
ALTER PUBLICATION supabase_realtime ADD TABLE leaderboard;
```

---

## 🎮 Instructions du Jeu

### Régie Animateur
- Accédez à la régie via l'icône ⚙️ en bas à droite.
- **PIN par défaut : `2985`**
- Contrôlez le flux du jeu, révélez les réponses et gérez les points.

### Joueurs
- Connectez-vous via le bouton "CONNEXION JOUEUR".
- Choisissez votre équipe (Famille A ou B).
- Le premier joueur de chaque équipe peut devenir **Capitaine** pour changer le nom de la famille.

---

## 📦 Structure du Projet

- `App.tsx` : Logique principale et routage.
- `services/supabase.ts` : Client Supabase.
- `services/LocalDB.ts` : Adaptateur pour la synchronisation Supabase (remplace localStorage).
- `scripts/init-db.mjs` : Script d'initialisation automatique des tables.
- `constants.tsx` : Liste des questions (10 questions incluses par défaut).

---

## 📝 Notes
- La logique du jeu est entièrement gérée côté client et synchronisée en temps réel pour tous les participants.
- En cas de réinitialisation du jeu (`RESET`), le score final est automatiquement archivé dans le classement (`leaderboard`).
