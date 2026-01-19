import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { LeaderboardEntry } from '../types';
import { Link } from 'react-router-dom';

interface LeaderboardProps {
  isAdmin?: boolean;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ isAdmin }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const handleDeleteScore = async (id: string) => {
    if (!window.confirm('Supprimer ce score définitivement ?')) return;

    const { error } = await supabase
      .from('leaderboard')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting score:', error);
      alert('Erreur lors de la suppression');
    }
  };

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order('score', { ascending: false });

      if (error) {
        console.error('Error fetching leaderboard:', error);
      } else {
        setEntries(data || []);
      }
      setLoading(false);
    };

    fetchLeaderboard();

    // Subscribe to changes
    const channel = supabase
      .channel('leaderboard-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leaderboard' }, () => {
        fetchLeaderboard();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl space-y-8">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-yellow-500 hover:text-yellow-400 flex items-center gap-2 transition-colors">
            <i className="fas fa-arrow-left"></i> Retour au jeu
          </Link>
          <h1 className="text-4xl md:text-6xl font-game text-yellow-500 tracking-tighter drop-shadow-2xl text-center">
            LEADERBOARD - MEILLEURS SCORES
          </h1>
          <div className="w-20"></div> {/* Spacer */}
        </div>

        <div className="bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/50 text-yellow-500 uppercase text-xs md:text-sm font-black tracking-widest">
                <th className="p-4 md:p-6">Rang</th>
                <th className="p-4 md:p-6">Équipe</th>
                <th className="p-4 md:p-6 text-center">Score</th>
                <th className="p-4 md:p-6 text-right">Date</th>
                {isAdmin && <th className="p-4 md:p-6 text-center">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-500 animate-pulse">Chargement des champions...</td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-500">Aucun score enregistré pour le moment.</td>
                </tr>
              ) : (
                entries.map((entry, index) => (
                  <tr key={entry.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4 md:p-6">
                      <span className={`
                        w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-black
                        ${index === 0 ? 'bg-yellow-500 text-black scale-110' :
                          index === 1 ? 'bg-slate-300 text-black' :
                          index === 2 ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-400'}
                      `}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="p-4 md:p-6">
                      <div className="font-bold text-white group-hover:text-yellow-500 transition-colors uppercase">
                        {entry.team_name}
                      </div>
                    </td>
                    <td className="p-4 md:p-6 text-center">
                      <div className="text-2xl md:text-3xl font-game text-white gold-glow">
                        {entry.score}
                      </div>
                    </td>
                    <td className="p-4 md:p-6 text-right text-slate-500 text-xs md:text-sm">
                      {new Date(entry.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    {isAdmin && (
                      <td className="p-4 md:p-6 text-center">
                        <button
                          onClick={() => handleDeleteScore(entry.id)}
                          className="text-slate-600 hover:text-red-500 transition-colors p-2"
                          title="Supprimer le score"
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
