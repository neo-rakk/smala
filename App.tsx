
import React, { useState, useEffect, useCallback } from 'react';
import { GameRoom, GameState, Team, User } from './types';
import { INITIAL_QUESTIONS } from './constants';
import GameBoard from './components/GameBoard';
import AdminPanel from './components/AdminPanel';
import SoundService from './services/SoundService';
import { localDB } from './services/LocalDB';

const App: React.FC = () => {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [pin, setPin] = useState('');

  useEffect(() => {
    const init = async () => {
      const state = await localDB.getState();
      if (state) setRoom(state);
    };
    init();

    const unsubscribe = localDB.subscribe((newState) => {
      setRoom(newState);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleAction = useCallback(async (type: string, payload: any) => {
    const current = room || await localDB.getState();
    
    let next: GameRoom;
    if (!current) {
        const freshQuestions = JSON.parse(JSON.stringify(INITIAL_QUESTIONS)).map((q: any) => ({
          ...q, answers: q.answers.map((a: any) => ({ ...a, revealed: false }))
        }));
        next = {
          code: "LIVE-DZ", state: GameState.LOBBY, hostId: 'admin',
          teamAName: "FAMILLE A", teamBName: "FAMILLE B", teamAScore: 0, teamBScore: 0,
          roundScore: 0, strikes: 0, currentQuestionId: 1, maxRounds: 3,
          activeTeam: Team.NONE, diceResults: {}, users: [], activeQuestions: freshQuestions
        };
    } else {
        next = JSON.parse(JSON.stringify(current));
    }

    const currentQuestion = next.activeQuestions.find(q => q.id === next.currentQuestionId);

    switch (type) {
      case 'START_GAME':
        next.state = GameState.ROUND;
        next.strikes = 0;
        next.roundScore = 0;
        if (next.activeTeam === Team.NONE) {
          next.activeTeam = Math.random() > 0.5 ? Team.A : Team.B;
        }
        break;
      
      case 'PICK_RANDOM_TEAM':
        next.activeTeam = Math.random() > 0.5 ? Team.A : Team.B;
        SoundService.play('tada');
        break;

      case 'REVEAL_ANSWER':
        if (!currentQuestion) break;
        const ans = currentQuestion.answers.find(a => a.id === payload.answerId);
        if (ans && !ans.revealed) {
          ans.revealed = true;
          next.roundScore += ans.points;
          SoundService.play('ding');
          
          // --- LOGIQUE DE VOL (STEAL) RÉUSSI ---
          if (next.state === GameState.STEAL) {
            // L'équipe qui tente le vol (activeTeam) a trouvé une réponse.
            if (next.activeTeam === Team.A) next.teamAScore += next.roundScore;
            else if (next.activeTeam === Team.B) next.teamBScore += next.roundScore;
            
            // Fin de manche automatique
            next.state = GameState.LOBBY;
            next.currentQuestionId++;
            next.roundScore = 0;
            next.strikes = 0;
            next.activeTeam = Team.NONE;
            if (next.currentQuestionId > next.maxRounds) next.state = GameState.FINISHED;
            break;
          }

          // VICTOIRE MANCHE NORMALE
          const allRevealed = currentQuestion.answers.every(a => a.revealed);
          if (allRevealed) {
            if (next.activeTeam === Team.A) next.teamAScore += next.roundScore;
            else if (next.activeTeam === Team.B) next.teamBScore += next.roundScore;
            
            next.state = GameState.LOBBY;
            next.currentQuestionId++;
            next.roundScore = 0;
            next.strikes = 0;
            next.activeTeam = Team.NONE;
            if (next.currentQuestionId > next.maxRounds) next.state = GameState.FINISHED;
          }
        }
        break;

      case 'ADD_STRIKE':
        // --- LOGIQUE DE VOL (STEAL) ÉCHOUÉ ---
        if (next.state === GameState.STEAL) {
          SoundService.play('buzzer');
          // Le vol a échoué car l'animateur a cliqué sur la croix (erreur de l'équipe voleuse).
          // Les points vont automatiquement à l'équipe adverse (celle qui s'était fait voler la main).
          const originalTeam = next.activeTeam === Team.A ? Team.B : Team.A;
          
          if (originalTeam === Team.A) next.teamAScore += next.roundScore;
          else if (originalTeam === Team.B) next.teamBScore += next.roundScore;
          
          // Fin de manche automatique après vol raté
          next.state = GameState.LOBBY;
          next.currentQuestionId++;
          next.roundScore = 0;
          next.strikes = 0;
          next.activeTeam = Team.NONE;
          if (next.currentQuestionId > next.maxRounds) next.state = GameState.FINISHED;
          break;
        }

        // Mode normal : on ajoute une croix visuelle
        next.strikes = Math.min(3, next.strikes + 1);
        SoundService.play('buzzer');
        break;

      case 'ACTIVATE_STEAL':
        next.state = GameState.STEAL;
        // On bascule la main vers l'équipe adverse pour le vol
        next.activeTeam = next.activeTeam === Team.A ? Team.B : Team.A;
        SoundService.play('tada');
        break;

      case 'END_ROUND':
        const winner = payload.winnerTeam;
        if (winner === Team.A) next.teamAScore += next.roundScore;
        else if (winner === Team.B) next.teamBScore += next.roundScore;
        
        next.state = GameState.LOBBY;
        next.currentQuestionId++;
        next.roundScore = 0;
        next.strikes = 0;
        next.activeTeam = Team.NONE;
        
        if (next.currentQuestionId > next.maxRounds) {
            next.state = GameState.FINISHED;
        }
        break;

      case 'ADD_PLAYER':
        next.users = [...next.users, payload.user];
        break;

      case 'REMOVE_PLAYER':
        next.users = next.users.filter(u => u.id !== payload.userId);
        break;

      case 'SET_PLAYER_TEAM':
        next.users = next.users.map(u => u.id === payload.userId ? { ...u, team: payload.team } : u);
        break;

      case 'SET_CAPTAIN':
        const targetPlayer = next.users.find(u => u.id === payload.userId);
        if (targetPlayer) {
          next.users = next.users.map(u => (u.team === targetPlayer.team) ? { ...u, isCaptain: u.id === targetPlayer.id } : u);
        }
        break;

      case 'RESET_GAME':
        await localDB.reset();
        window.location.reload();
        return;

      case 'SET_TEAM_NAME':
        if (payload.team === Team.A) next.teamAName = payload.name.toUpperCase();
        else next.teamBName = payload.name.toUpperCase();
        break;
      
      case 'UPDATE_SCORE':
        if (payload.team === Team.A) next.teamAScore = payload.value;
        else next.teamBScore = payload.value;
        break;

      case 'SET_MAX_ROUNDS':
        next.maxRounds = payload.count;
        break;
        
      case 'SET_ACTIVE_TEAM':
        next.activeTeam = payload.team;
        break;
    }
    
    await localDB.saveState(next);
    setRoom(next);
  }, [room]);

  const handleAdminLogin = () => {
    if (pin === '2985') {
      setIsAdmin(true);
      setShowLogin(false);
      SoundService.unlockAudio();
      if (!room) handleAction('INIT', {});
    } else {
      alert("PIN Incorrect");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row overflow-hidden relative font-sans">
      {!isAdmin && (
        <button 
          onClick={() => setShowLogin(true)}
          className="fixed bottom-4 right-4 w-10 h-10 rounded-full bg-white/5 hover:bg-yellow-600/20 flex items-center justify-center transition-all z-[200] border border-white/10"
        >
          <i className="fas fa-cog text-white/40 text-sm"></i>
        </button>
      )}

      {showLogin && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[300] flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-yellow-500 p-8 rounded-3xl w-full max-w-sm text-center space-y-6 shadow-2xl">
            <h2 className="text-2xl font-game text-yellow-500 uppercase">Accès Régie Live</h2>
            <input 
              type="password" 
              className="w-full bg-black border-2 border-slate-700 rounded-xl p-4 text-center text-3xl font-black tracking-widest text-white focus:border-yellow-500 outline-none transition-all"
              placeholder="PIN"
              maxLength={4}
              value={pin}
              autoFocus
              onChange={e => setPin(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdminLogin()}
            />
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowLogin(false)} className="flex-1 py-3 text-slate-500 font-bold uppercase text-xs hover:text-white transition-colors">Fermer</button>
              <button onClick={handleAdminLogin} className="flex-1 py-3 bg-yellow-600 rounded-xl text-white font-game text-xl hover:bg-yellow-500 shadow-lg active:scale-95 transition-all">VALIDER</button>
            </div>
          </div>
        </div>
      )}

      {isAdmin && room && (
        <div className="md:w-[380px] lg:w-[420px] bg-slate-900 border-r border-slate-800 p-4 overflow-y-auto shadow-2xl z-20 shrink-0">
          <AdminPanel room={room} onAction={handleAction} isPaused={false} onTogglePause={() => {}} onLogout={() => setIsAdmin(false)} />
        </div>
      )}

      <div className="flex-1 p-4 md:p-8 overflow-y-auto flex flex-col items-center justify-center bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black relative">
        {!room ? (
          <div className="text-center space-y-6 animate-pulse">
            <h1 className="text-6xl md:text-8xl font-game text-yellow-500 tracking-tighter drop-shadow-2xl">FAMILLE DZ EN OR</h1>
            <p className="text-slate-500 font-black uppercase tracking-[0.5em] text-xs md:text-sm">En attente de la régie...</p>
          </div>
        ) : (
          <GameBoard room={room} user={{isHost: isAdmin} as any} onRoll={() => {}} onLogout={() => {}} />
        )}
      </div>

      <footer className="fixed bottom-0 left-0 w-full py-2 px-4 flex justify-center items-center pointer-events-none z-[100]">
        <div className="bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/5 shadow-2xl">
          <p className="text-[9px] font-black tracking-widest text-slate-500 uppercase flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
            <span className="text-yellow-500/90">DZ EN OR</span> 
            <span className="opacity-20">|</span> 
            REGIE DIRECTE ACTIF
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
