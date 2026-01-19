
import React, { useState } from 'react';
import { GameRoom, GameState, Team, User } from '../types';
import SoundService from '../services/SoundService';

interface AdminPanelProps {
  room: GameRoom;
  onAction: (type: string, payload: any) => void;
  isPaused: boolean;
  onTogglePause: () => void;
  onLogout: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ room, onAction, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'JEU' | 'JOUEURS' | 'SCORES' | 'QUIZ'>('JEU');
  const [newPlayerName, setNewPlayerName] = useState('');
  
  const currentQuestion = room.activeQuestions.find(q => q.id === room.currentQuestionId);

  const addPlayer = () => {
    if (!newPlayerName.trim()) return;
    const newUser: User = {
      id: 'u-' + Date.now(),
      nickname: newPlayerName.toUpperCase(),
      team: Team.NONE,
      isCaptain: false,
      isHost: false,
      score: 0
    };
    onAction('ADD_PLAYER', { user: newUser });
    setNewPlayerName('');
  };

  return (
    <div className="flex flex-col h-full space-y-4 font-sans">
      {/* Header Régie */}
      <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 flex justify-between items-center shadow-xl">
        <div>
          <h2 className="text-sm font-black text-yellow-500 uppercase">Régie Animateur</h2>
          <div className="flex gap-2 mt-1">
             <span className="text-[10px] px-2 bg-emerald-600 text-white rounded-full font-bold">{room.teamAScore}</span>
             <span className="text-[10px] px-2 bg-red-600 text-white rounded-full font-bold">{room.teamBScore}</span>
          </div>
        </div>
        <button onClick={onLogout} className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors">
          <i className="fas fa-power-off"></i>
        </button>
      </div>

      {/* Onglets */}
      <div className="flex bg-slate-900 p-1 rounded-xl gap-1 border border-slate-800">
        {['JEU', 'JOUEURS', 'SCORES', 'QUIZ'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${activeTab === tab ? 'bg-yellow-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {activeTab === 'JEU' && (
          <div className="space-y-4">
            {/* Flux de Jeu */}
            <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700 space-y-3">
              <p className="text-[10px] font-black text-slate-500 uppercase">Contrôle du Flux</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => onAction('START_GAME', {})} className="p-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black hover:bg-emerald-500 active:scale-95 transition-all col-span-2">
                  LANCER LA MANCHE {room.currentQuestionId}
                </button>
                <button onClick={() => onAction('PICK_RANDOM_TEAM', {})} className="p-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black hover:bg-indigo-500 active:scale-95 transition-all col-span-2">
                  <i className="fas fa-random mr-2"></i> TIRER UNE ÉQUIPE AU SORT
                </button>
                <button 
                  onClick={() => onAction('SET_ACTIVE_TEAM', { team: Team.A })}
                  className={`p-3 rounded-xl text-[10px] font-black border-2 transition-all ${room.activeTeam === Team.A ? 'bg-green-600 border-green-400 text-white' : 'bg-slate-900 border-slate-700 text-slate-500'}`}
                >
                  MAIN À FAMILLE A
                </button>
                <button 
                  onClick={() => onAction('SET_ACTIVE_TEAM', { team: Team.B })}
                  className={`p-3 rounded-xl text-[10px] font-black border-2 transition-all ${room.activeTeam === Team.B ? 'bg-red-600 border-red-400 text-white' : 'bg-slate-900 border-slate-700 text-slate-500'}`}
                >
                  MAIN À FAMILLE B
                </button>
              </div>
            </div>

            {/* Réponses Quiz */}
            {currentQuestion && (
              <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                  <p className="text-[10px] font-black text-slate-500 uppercase">Réponses du Quiz</p>
                  <span className="text-yellow-500 text-[10px] font-bold">{room.roundScore} PTS EN JEU</span>
                </div>
                <div className="space-y-2">
                  {currentQuestion.answers.map(ans => (
                    <button 
                      key={ans.id}
                      onClick={() => onAction('REVEAL_ANSWER', { answerId: ans.id })}
                      className={`w-full p-3 rounded-xl text-left flex justify-between items-center transition-all border ${ans.revealed ? 'bg-emerald-600/20 border-emerald-500/50' : 'bg-slate-900 border-slate-800'}`}
                    >
                      <span className={`text-[11px] font-bold uppercase ${ans.revealed ? 'text-emerald-400' : 'text-slate-400'}`}>{ans.text}</span>
                      <span className="text-[10px] font-game text-yellow-500">{ans.points} PTS</span>
                    </button>
                  ))}
                </div>
                
                <div className="pt-2 grid grid-cols-1 gap-2">
                  <button onClick={() => onAction('ADD_STRIKE', {})} className="bg-red-600 p-3 rounded-xl text-xs font-black text-white flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
                    <i className="fas fa-times-circle"></i> AJOUTER UNE FAUTE ({room.strikes}/3)
                  </button>
                  
                  {room.state !== GameState.STEAL && room.strikes >= 3 && (
                    <button 
                      onClick={() => onAction('ACTIVATE_STEAL', {})} 
                      className="bg-orange-600 p-3 rounded-xl text-[10px] font-black text-white animate-pulse shadow-[0_0_15px_rgba(234,88,12,0.5)] border border-orange-400"
                    >
                      DÉCLENCHER LE VOL (3 FAUTES !)
                    </button>
                  )}
                  
                  {room.state === GameState.STEAL && (
                    <div className="bg-orange-950/30 border border-orange-500/50 p-3 rounded-xl text-center">
                      <p className="text-[9px] font-black text-orange-500 uppercase animate-pulse">Mode VOL ACTIF</p>
                      <p className="text-[8px] text-slate-400 font-bold uppercase mt-1">Cliquer sur une réponse correcte = Vol réussi</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700">
                   <button onClick={() => onAction('END_ROUND', { winnerTeam: Team.A })} className="bg-green-900/40 border border-green-600 p-3 rounded-xl text-[9px] font-black text-green-400 hover:bg-green-600 hover:text-white transition-all">TERMINER & POINTS À A</button>
                   <button onClick={() => onAction('END_ROUND', { winnerTeam: Team.B })} className="bg-red-900/40 border border-red-600 p-3 rounded-xl text-[9px] font-black text-red-400 hover:bg-red-600 hover:text-white transition-all">TERMINER & POINTS À B</button>
                </div>
              </div>
            )}
          </div>
        )}
        {activeTab === 'JOUEURS' && (
          <div className="space-y-4">
            <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700 space-y-3">
              <p className="text-[10px] font-black text-slate-500 uppercase">Ajouter un Joueur</p>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newPlayerName}
                  onChange={e => setNewPlayerName(e.target.value)}
                  placeholder="NOM DU JOUEUR..."
                  className="flex-1 bg-black border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-yellow-500 outline-none"
                />
                <button onClick={addPlayer} className="bg-yellow-600 text-white px-4 py-2 rounded-xl text-xs font-black hover:bg-yellow-500 transition-all">OK</button>
              </div>
            </div>
            <div className="space-y-2">
              {room.users.map(u => (
                <div key={u.id} className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${u.team === Team.A ? 'bg-green-500' : u.team === Team.B ? 'bg-red-500' : 'bg-slate-700'}`}></div>
                    <div>
                      <p className="text-xs font-black text-white uppercase">{u.nickname}</p>
                      <p className="text-[8px] text-slate-500 font-bold uppercase">{u.isCaptain ? 'CAPITAINE' : 'JOUEUR'}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onAction('SET_PLAYER_TEAM', { userId: u.id, team: Team.A })} className="w-6 h-6 rounded bg-green-900/40 text-green-500 text-[8px] font-bold hover:bg-green-600 hover:text-white transition-colors">A</button>
                    <button onClick={() => onAction('SET_PLAYER_TEAM', { userId: u.id, team: Team.B })} className="w-6 h-6 rounded bg-red-900/40 text-red-500 text-[8px] font-bold hover:bg-red-600 hover:text-white transition-colors">B</button>
                    <button onClick={() => onAction('SET_PLAYER_TEAM', { userId: u.id, team: Team.NONE })} className="w-6 h-6 rounded bg-slate-800 text-slate-400 text-[8px] font-bold hover:bg-slate-700 hover:text-white transition-colors">SB</button>
                    <button onClick={() => onAction('SET_CAPTAIN', { userId: u.id })} className="w-6 h-6 rounded bg-yellow-900/40 text-yellow-500 text-[8px] hover:bg-yellow-600 hover:text-white transition-colors"><i className="fas fa-crown"></i></button>
                    <button onClick={() => onAction('REMOVE_PLAYER', { userId: u.id })} className="w-6 h-6 rounded bg-red-900/20 text-red-400 text-[8px] hover:bg-red-600 hover:text-white transition-colors"><i className="fas fa-trash"></i></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === 'SCORES' && (
          <div className="space-y-4">
            <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700 space-y-4">
              <p className="text-[10px] font-black text-slate-500 uppercase">Configuration Noms</p>
              <div className="grid grid-cols-1 gap-3">
                <input 
                  className="bg-black border border-slate-700 rounded-xl p-3 text-xs text-white uppercase font-bold" 
                  value={room.teamAName} 
                  onChange={e => onAction('SET_TEAM_NAME', { team: Team.A, name: e.target.value })}
                  placeholder="NOM FAMILLE A"
                />
                <input 
                  className="bg-black border border-slate-700 rounded-xl p-3 text-xs text-white uppercase font-bold" 
                  value={room.teamBName} 
                  onChange={e => onAction('SET_TEAM_NAME', { team: Team.B, name: e.target.value })}
                  placeholder="NOM FAMILLE B"
                />
              </div>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700 space-y-4">
              <p className="text-[10px] font-black text-slate-500 uppercase">Ajustement Manuel des Points</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-[9px] font-bold text-center text-green-500">{room.teamAName}</p>
                  <div className="text-xl font-game text-center text-white bg-black py-2 rounded-lg border border-slate-700 mb-2">{room.teamAScore}</div>
                  <button onClick={() => onAction('UPDATE_SCORE', { team: Team.A, value: room.teamAScore + 10 })} className="w-full py-2 bg-slate-900 rounded-lg text-xs font-bold">+10</button>
                  <button onClick={() => onAction('UPDATE_SCORE', { team: Team.A, value: Math.max(0, room.teamAScore - 10) })} className="w-full py-2 bg-slate-900 rounded-lg text-xs font-bold text-slate-500">-10</button>
                </div>
                <div className="space-y-2">
                  <p className="text-[9px] font-bold text-center text-red-500">{room.teamBName}</p>
                  <div className="text-xl font-game text-center text-white bg-black py-2 rounded-lg border border-slate-700 mb-2">{room.teamBScore}</div>
                  <button onClick={() => onAction('UPDATE_SCORE', { team: Team.B, value: room.teamBScore + 10 })} className="w-full py-2 bg-slate-900 rounded-lg text-xs font-bold">+10</button>
                  <button onClick={() => onAction('UPDATE_SCORE', { team: Team.B, value: Math.max(0, room.teamBScore - 10) })} className="w-full py-2 bg-slate-900 rounded-lg text-xs font-bold text-slate-500">-10</button>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'QUIZ' && (
          <div className="space-y-4">
            <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700 space-y-4">
              <p className="text-[10px] font-black text-slate-500 uppercase">Paramètres du Match</p>
              <div className="flex gap-2">
                {[3, 5, 7].map(n => (
                  <button 
                    key={n} 
                    onClick={() => onAction('SET_MAX_ROUNDS', { count: n })}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-bold border ${room.maxRounds === n ? 'bg-yellow-600 border-yellow-400 text-white' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
                  >
                    {n} MANCHES
                  </button>
                ))}
              </div>
              <button 
                onClick={() => { if(confirm("Réinitialiser tout ?")) onAction('RESET_GAME', {}); }}
                className="w-full py-4 bg-red-600/20 text-red-500 border border-red-500/30 rounded-2xl text-[10px] font-black hover:bg-red-600 hover:text-white transition-all"
              >
                <i className="fas fa-sync-alt mr-2"></i> RÉINITIALISER LE SHOW
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="grid grid-cols-4 gap-2 pt-4 border-t border-slate-800">
        <button onClick={() => SoundService.play('ding')} className="py-2 bg-slate-900 rounded-lg text-[8px] font-black text-slate-500 hover:text-white active:bg-yellow-600 transition-all">DING</button>
        <button onClick={() => SoundService.play('buzzer')} className="py-2 bg-slate-900 rounded-lg text-[8px] font-black text-slate-500 hover:text-white active:bg-red-600 transition-all">FAUTE</button>
        <button onClick={() => SoundService.play('tada')} className="py-2 bg-slate-900 rounded-lg text-[8px] font-black text-slate-500 hover:text-white active:bg-indigo-600 transition-all">FIN</button>
        <button onClick={() => SoundService.play('dice_roll')} className="py-2 bg-slate-900 rounded-lg text-[8px] font-black text-slate-500 hover:text-white active:bg-purple-600 transition-all">DÉS</button>
      </div>
    </div>
  );
};

export default AdminPanel;
