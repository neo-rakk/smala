import React, { useState } from 'react';
import { supabase } from '../services/supabase';

interface AuthProps {
  onSuccess: () => void;
}

const Auth: React.FC<AuthProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        // 1. Check if username exists
        const { data: existing } = await supabase
          .from('user_accounts')
          .select('id')
          .eq('username', username.trim().toLowerCase())
          .maybeSingle();

        if (existing) {
          throw new Error('Cet identifiant est déjà utilisé');
        }

        // 2. Create account
        const { data: account, error: accountError } = await supabase
          .from('user_accounts')
          .insert([{
            username: username.trim().toLowerCase(),
            password
          }])
          .select()
          .single();

        if (accountError) throw accountError;

        // 3. Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: account.id,
            nickname: nickname.toUpperCase()
          }]);

        if (profileError) throw profileError;

        alert('Compte créé ! Vous pouvez vous connecter.');
        setIsSignUp(false);
      } else {
        // Custom login
        const { data: account, error: loginError } = await supabase
          .from('user_accounts')
          .select('*, profiles(nickname)')
          .eq('username', username.trim().toLowerCase())
          .eq('password', password)
          .maybeSingle();

        if (loginError) throw loginError;
        if (!account) {
           throw new Error('Identifiant ou mot de passe incorrect');
        }

        const profile = Array.isArray(account.profiles) ? account.profiles[0] : account.profiles;

        if (!profile) {
          throw new Error('Profil non trouvé');
        }

        // Store session in localStorage
        const sessionData = {
           userId: account.id,
           username: account.username,
           nickname: profile.nickname,
           expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
        };
        localStorage.setItem('game_session', JSON.stringify(sessionData));

        onSuccess();
      }
    } catch (error: any) {
      alert(error.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border-2 border-yellow-500 p-8 rounded-3xl w-full max-w-sm text-center space-y-6 shadow-2xl">
      <div className="space-y-2">
        <h2 className="text-2xl font-game text-yellow-500 uppercase">
            {isSignUp ? 'Créer un compte' : 'Connexion Joueur'}
        </h2>
        <p className="text-[10px] text-slate-500 uppercase tracking-widest">
            {isSignUp ? 'Aucun email requis' : 'Accès instantané'}
        </p>
      </div>

      <form onSubmit={handleAuth} className="space-y-4">
        {isSignUp && (
          <input
            type="text"
            className="w-full bg-black border-2 border-slate-700 rounded-xl p-3 text-white focus:border-yellow-500 outline-none transition-all"
            placeholder="Pseudo (Affiché en jeu)"
            required
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        )}
        <input
          type="text"
          className="w-full bg-black border-2 border-slate-700 rounded-xl p-3 text-white focus:border-yellow-500 outline-none transition-all"
          placeholder="Identifiant"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          className="w-full bg-black border-2 border-slate-700 rounded-xl p-3 text-white focus:border-yellow-500 outline-none transition-all"
          placeholder="Mot de passe"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-yellow-600 rounded-xl text-white font-game text-xl hover:bg-yellow-500 shadow-lg active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? 'Chargement...' : isSignUp ? 'S\'INSCRIRE' : 'SE CONNECTER'}
        </button>
      </form>
      <button
        onClick={() => setIsSignUp(!isSignUp)}
        className="text-slate-400 text-sm hover:text-white transition-colors"
      >
        {isSignUp ? 'Déjà un compte ? Connectez-vous' : 'Pas de compte ? Inscrivez-vous'}
      </button>
    </div>
  );
};

export default Auth;
