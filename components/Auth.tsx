import React, { useState } from 'react';
import { supabase } from '../services/supabase';

interface AuthProps {
  onSuccess: () => void;
}

const Auth: React.FC<AuthProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Helper to generate a dummy email from the nickname
  // This allows us to use Supabase Auth (which requires email)
  // while only asking the user for a nickname.
  const getDummyEmail = (pseudo: string) => {
    // Remove spaces and special chars to make it email-safe
    const safePseudo = pseudo.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    return `${safePseudo}@familledz.game`;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const email = getDummyEmail(nickname);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nickname: nickname.toUpperCase(),
            },
          },
        });
        if (error) throw error;

        // Profile is created automatically via Database Trigger (handle_new_user)

        alert('Compte créé ! Vous êtes connecté.');
        // Sign up automatically signs in if email confirmation is disabled (which is typical for this setup)
        // If 'data.session' exists, we are logged in.
        if (data.session) {
           onSuccess();
        } else {
           // If email confirmation is required, this might happen.
           // Assuming "Enable Email Confirmations" is OFF in Supabase.
           // Or we can try to sign in explicitly.
           const { error: signInError } = await supabase.auth.signInWithPassword({
              email,
              password
           });
           if (!signInError) onSuccess();
        }

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
      console.error(error);
      let msg = error.message || 'Une erreur est survenue';
      if (msg.includes('Invalid login credentials')) msg = 'Pseudo ou mot de passe incorrect.';
      if (msg.includes('User already registered')) msg = 'Ce pseudo est déjà pris.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border-2 border-yellow-500 p-8 rounded-3xl w-full max-w-sm text-center space-y-6 shadow-2xl relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none"></div>

      <h2 className="text-3xl font-game text-yellow-500 uppercase drop-shadow-md">
        {isSignUp ? 'Créer un compte' : 'Connexion Joueur'}
      </h2>

      {errorMsg && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 text-xs p-3 rounded-lg animate-pulse">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleAuth} className="space-y-4 relative z-10">
        <div>
          <label className="block text-left text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Pseudo</label>
          <input
            type="text"
            className="w-full bg-black/50 border-2 border-slate-700 rounded-xl p-3 text-white focus:border-yellow-500 outline-none transition-all font-bold tracking-wide"
            placeholder="Votre pseudo..."
            required
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        </div>

        <div>
           <label className="block text-left text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Mot de passe</label>
           <input
            type="password"
            className="w-full bg-black/50 border-2 border-slate-700 rounded-xl p-3 text-white focus:border-yellow-500 outline-none transition-all font-bold tracking-wide"
            placeholder="••••••••"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-yellow-600 rounded-xl text-white font-game text-xl hover:bg-yellow-500 shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
        >
          {loading ? (
             <span className="flex items-center justify-center gap-2">
               <i className="fas fa-circle-notch fa-spin"></i> CHARGEMENT...
             </span>
          ) : (
             isSignUp ? 'REJOINDRE LE JEU' : 'SE CONNECTER'
          )}
        </button>
      </form>

      <div className="relative z-10 pt-2 border-t border-white/10">
        <button
            onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(''); }}
            className="text-slate-400 text-xs font-bold hover:text-yellow-400 transition-colors uppercase tracking-widest"
        >
            {isSignUp ? 'Déjà un compte ? Connectez-vous' : 'Nouveau joueur ? Créer un compte'}
        </button>
      </div>
    </div>
  );
};

export default Auth;
