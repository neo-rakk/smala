import React, { useState } from 'react';
import { supabase } from '../services/supabase';

interface AuthProps {
  onSuccess: () => void;
}

const Auth: React.FC<AuthProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: 'https://smala.vercel.app',
          },
        });
        if (error) throw error;

        if (data.user) {
          // Create profile
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert([{ id: data.user.id, nickname: nickname.toUpperCase() }]);
          if (profileError) throw profileError;
        }
        alert('Compte créé ! Vous pouvez vous connecter.');
        setIsSignUp(false);
      } else {
        // Try sign out first to clear any stale state
        await supabase.auth.signOut();

        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
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
      <h2 className="text-2xl font-game text-yellow-500 uppercase">
        {isSignUp ? 'Créer un compte' : 'Connexion Joueur'}
      </h2>
      <form onSubmit={handleAuth} className="space-y-4">
        {isSignUp && (
          <div className="mb-2">
            <button
              type="button"
              onClick={() => window.open('https://yopmail.com/fr/email-generator', '_blank')}
              className="w-full py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-[10px] font-bold uppercase hover:bg-slate-700 hover:text-white transition-all flex items-center justify-center gap-2"
            >
              <i className="fas fa-magic text-yellow-500"></i>
              Générer un email jetable (YOPmail)
            </button>
          </div>
        )}
        {isSignUp && (
          <input
            type="text"
            className="w-full bg-black border-2 border-slate-700 rounded-xl p-3 text-white focus:border-yellow-500 outline-none transition-all"
            placeholder="Pseudo"
            required
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        )}
        <input
          type="email"
          className="w-full bg-black border-2 border-slate-700 rounded-xl p-3 text-white focus:border-yellow-500 outline-none transition-all"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
