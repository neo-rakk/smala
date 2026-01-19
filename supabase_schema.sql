-- Schema pour Famille DZ en Or

-- 1. Table des comptes utilisateurs (Auth personnalisée)
CREATE TABLE IF NOT EXISTS user_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table des profils joueurs
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY, -- Référence user_accounts.id
    nickname TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'player',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Table de l'état du jeu (Temps Réel)
CREATE TABLE IF NOT EXISTS game_state (
    id TEXT PRIMARY KEY,
    payload JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Table du classement (Leaderboard)
CREATE TABLE IF NOT EXISTS leaderboard (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID REFERENCES profiles(id),
    nickname TEXT NOT NULL,
    score INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Activer le Realtime pour game_state et leaderboard
-- Note: Exécutez ces lignes individuellement si elles échouent en bloc
ALTER PUBLICATION supabase_realtime ADD TABLE game_state;
ALTER PUBLICATION supabase_realtime ADD TABLE leaderboard;

-- 6. Désactiver RLS (Optionnel, pour faciliter le développement)
ALTER TABLE game_state DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard DISABLE ROW LEVEL SECURITY;

-- 7. Insertion de l'état initial du jeu
INSERT INTO game_state (id, payload)
VALUES ('live-dz', '{"currentQuestionIndex": 0, "status": "waiting", "teams": {"A": {"name": "Équipe 1", "score": 0, "strikes": 0}, "B": {"name": "Équipe 2", "score": 0, "strikes": 0}}, "revealedAnswers": []}')
ON CONFLICT (id) DO NOTHING;
