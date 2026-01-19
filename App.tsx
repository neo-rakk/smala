
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { GameRoom, GameState, Team, User, Profile } from './types';
import { INITIAL_QUESTIONS } from './constants';
import GameBoard from './components/GameBoard';
import AdminPanel from './components/AdminPanel';
import SoundService from './services/SoundService';
import { localDB } from './services/LocalDB';
import { supabase } from './services/supabase';
import Auth from './components/Auth';
import Leaderboard from './components/Leaderboard';

const TeamEditSection: React.FC<{
  team: Team,
  room: GameRoom,
  user: User,
  handleAction: (type: string, payload: any) => Promise<void>
}> = ({ team, room, user, handleAction }) => {
  const [input, setInput] = useState('');
  const isTeamA = team === Team.A;
  const teamName = isTeamA ? room.teamAName : room.teamBName;
  const players = room.users.filter(u => u.team === team);
  const colorClass = isTeamA ? 'emerald' : 'red';

  const onUpdate = () => {
    if (!input.trim()) return;
    handleAction('SET_TEAM_NAME', { team, name: input.trim() });
    setInput('');
  };

  const cardStyle = isTeamA
    ? (user.team === team ? 'bg-emerald-600/20 border-emerald-500' : 'bg-black/40 border-white/5')
    : (user.team === team ? 'bg-red-600/20 border-red-500' : 'bg-black/40 border-white/5');

  const titleStyle = isTeamA ? 'text-emerald-400' : 'text-red-400';
  const buttonStyle = isTeamA ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500';
  const borderStyle = isTeamA ? 'border-emerald-500 text-emerald-500 hover:bg-emerald-500' : 'border-red-500 text-red-500 hover:bg-red-500';
  const inputStyle = isTeamA ? 'border-emerald-500/30 focus:border-emerald-500' : 'border-red-500/30 focus:border-red-500';

  return (
    <div className={`p-6 rounded-2xl border-2 transition-all ${cardStyle}`}>
      <h3 className={`font-game text-2xl mb-4 uppercase ${titleStyle}`}>{teamName}</h3>
      <div className="space-y-2 mb-4">
        {players.map(u => (
          <div key={u.id} className="text-xs text-white flex justify-between items-center bg-white/5 p-2 rounded-lg">
            <span>{u.nickname} {u.isCaptain && <i className="fas fa-crown text-yellow-500 ml-1"></i>}</span>
          </div>
        ))}
        {[...Array(Math.max(0, 4 - players.length))].map((_, i) => (
          <div key={i} className="text-[10px] text-slate-600 border border-dashed border-slate-800 p-2 rounded-lg text-center">Place libre</div>
        ))}
      </div>

      {user.team !== team && players.length < 4 && (
        <button onClick={() => handleAction('SET_PLAYER_TEAM', { userId: user.id, team })} className={`w-full py-2 rounded-lg font-bold text-xs uppercase transition-colors text-white ${buttonStyle}`}>Rejoindre</button>
      )}

      {user.team === team && !user.isCaptain && (
        <button onClick={() => handleAction('SET_CAPTAIN', { userId: user.id })} className={`w-full py-2 border rounded-lg font-bold text-xs uppercase hover:text-white transition-all mt-2 ${borderStyle}`}>Devenir Capitaine</button>
      )}

      {user.team === team && user.isCaptain && (
        <div className="mt-2 flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Nouveau nom..."
            className={`flex-1 bg-black border rounded-lg px-2 text-xs text-white outline-none ${inputStyle}`}
          />
          <button onClick={onUpdate} className={`p-2 rounded-lg transition-colors ${buttonStyle}`}><i className="fas fa-check text-xs text-white"></i></button>
        </div>
      )}
    </div>
  );
};

const GamePage: React.FC<{
  room: GameRoom | null,
  user: User | null,
  isAdmin: boolean,
  handleAction: (type: string, payload: any) => Promise<void>,
  setShowLogin: (show: boolean) => void,
  onLogoutAdmin: () => void
}> = ({ room, user, isAdmin, handleAction, setShowLogin, onLogoutAdmin }) => {
  const [showLobby, setShowLobby] = useState(true);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row overflow-hidden relative font-sans">
      <div className="fixed bottom-4 right-4 flex gap-2 z-[200]">
          {room?.state === GameState.LOBBY && user && !showLobby && (
            <button
              onClick={() => setShowLobby(true)}
              className="px-4 h-10 rounded-full bg-yellow-600 hover:bg-yellow-500 text-white flex items-center justify-center transition-all border border-white/10 text-[10px] font-black uppercase tracking-tighter"
            >
              GESTION ÉQUIPE
            </button>
          )}
          <Link to="/leaderboard" className="w-10 h-10 rounded-full bg-white/5 hover:bg-yellow-600/20 flex items-center justify-center transition-all border border-white/10" title="Leaderboard">
            <i className="fas fa-trophy text-yellow-500/40 text-sm"></i>
          </Link>
          {!isAdmin && (
            <button
              onClick={() => setShowLogin(true)}
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-yellow-600/20 flex items-center justify-center transition-all border border-white/10"
              title="Régie"
            >
              <i className="fas fa-cog text-white/40 text-sm"></i>
            </button>
          )}
      </div>

      {isAdmin && room && (
        <div className="md:w-[380px] lg:w-[420px] bg-slate-900 border-r border-slate-800 p-4 overflow-y-auto shadow-2xl z-20 shrink-0">
          <AdminPanel
            room={room}
            onAction={handleAction}
            isPaused={false}
            onTogglePause={() => {}}
            onLogout={onLogoutAdmin}
          />
        </div>
      )}

      <div className="flex-1 p-4 md:p-8 overflow-y-auto flex flex-col items-center justify-center bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black relative">
        {!room ? (
          <div className="text-center space-y-6 animate-pulse">
            <h1 className="text-6xl md:text-8xl font-game text-yellow-500 tracking-tighter drop-shadow-2xl">FAMILLE DZ EN OR</h1>
            <p className="text-slate-500 font-black uppercase tracking-[0.5em] text-xs md:text-sm">En attente de la régie...</p>
          </div>
        ) : (
          <>
            {room.state === GameState.LOBBY && user && showLobby && (
              <div className="z-[300] fixed inset-0 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
                <div className="bg-slate-900/95 backdrop-blur-xl p-8 rounded-[2rem] border-2 border-white/5 shadow-2xl w-full max-w-2xl space-y-8 animate-in zoom-in duration-500">
                  <div className="text-center">
                    <h2 className="text-4xl font-game text-yellow-500 uppercase">Préparation du Match</h2>
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-2">Bienvenue, {user.nickname}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <TeamEditSection team={Team.A} room={room} user={user} handleAction={handleAction} />
                    <TeamEditSection team={Team.B} room={room} user={user} handleAction={handleAction} />
                  </div>

                  <div className="text-center space-y-4">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">Seulement 4 joueurs par équipe. Les autres peuvent observer.</p>
                    <button
                      onClick={() => setShowLobby(false)}
                      className="px-12 py-3 bg-yellow-600 hover:bg-yellow-500 text-white font-game text-xl rounded-xl shadow-xl transition-all active:scale-95"
                    >
                      OK, JE SUIS PRÊT !
                    </button>
                  </div>
                </div>
              </div>
            )}
            <GameBoard room={room} user={user || {isHost: isAdmin} as any} onRoll={() => {}} onLogout={() => {}} />
          </>
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

const App: React.FC = () => {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [pin, setPin] = useState('');

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error) {
      console.warn('Profile not found, attempting to create one...');
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const nickname = user.email?.split('@')[0].toUpperCase() || 'JOUEUR';
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert([{ id: user.id, nickname }])
          .select()
          .single();

        if (!insertError && newProfile) {
          setProfile(newProfile);
        }
      }
    } else if (data) {
      setProfile(data);
    }
  };

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
      case 'INIT':
        // Initialization handled by the 'if (!current)' block above
        break;

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
          
          if (next.state === GameState.STEAL) {
            if (next.activeTeam === Team.A) next.teamAScore += next.roundScore;
            else if (next.activeTeam === Team.B) next.teamBScore += next.roundScore;
            
            next.state = GameState.LOBBY;
            next.currentQuestionId++;
            next.roundScore = 0;
            next.strikes = 0;
            next.activeTeam = Team.NONE;
            if (next.currentQuestionId > next.maxRounds || next.currentQuestionId > next.activeQuestions.length) {
              next.state = GameState.FINISHED;
            }
            break;
          }

          const allRevealed = currentQuestion.answers.every(a => a.revealed);
          if (allRevealed) {
            if (next.activeTeam === Team.A) next.teamAScore += next.roundScore;
            else if (next.activeTeam === Team.B) next.teamBScore += next.roundScore;
            
            next.state = GameState.LOBBY;
            next.currentQuestionId++;
            next.roundScore = 0;
            next.strikes = 0;
            next.activeTeam = Team.NONE;
            if (next.currentQuestionId > next.maxRounds || next.currentQuestionId > next.activeQuestions.length) {
              next.state = GameState.FINISHED;
            }
          }
        }
        break;

      case 'ADD_STRIKE':
        if (next.state === GameState.STEAL) {
          SoundService.play('buzzer');
          const originalTeam = next.activeTeam === Team.A ? Team.B : Team.A;
          if (originalTeam === Team.A) next.teamAScore += next.roundScore;
          else if (originalTeam === Team.B) next.teamBScore += next.roundScore;
          
          next.state = GameState.LOBBY;
          next.currentQuestionId++;
          next.roundScore = 0;
          next.strikes = 0;
          next.activeTeam = Team.NONE;
          if (next.currentQuestionId > next.maxRounds || next.currentQuestionId > next.activeQuestions.length) {
            next.state = GameState.FINISHED;
          }
          break;
        }
        next.strikes = Math.min(3, next.strikes + 1);
        SoundService.play('buzzer');
        break;

      case 'ACTIVATE_STEAL':
        next.state = GameState.STEAL;
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
        if (next.currentQuestionId > next.maxRounds || next.currentQuestionId > next.activeQuestions.length) {
          next.state = GameState.FINISHED;
        }
        break;

      case 'SET_PLAYER_TEAM':
        next.users = next.users.map(u => u.id === payload.userId ? { ...u, team: payload.team, isCaptain: false } : u);
        break;

      case 'SET_CAPTAIN':
        const targetPlayer = next.users.find(u => u.id === payload.userId);
        if (targetPlayer) {
          next.users = next.users.map(u => (u.team === targetPlayer.team) ? { ...u, isCaptain: u.id === targetPlayer.id } : u);
        }
        break;

      case 'RESET_GAME':
        // Record leaderboard before reset if game was finished
        if (next.state === GameState.FINISHED) {
           const winnerName = next.teamAScore > next.teamBScore ? next.teamAName : next.teamBName;
           const winnerScore = next.teamAScore > next.teamBScore ? next.teamAScore : next.teamBScore;
           await supabase.from('leaderboard').insert([{ team_name: winnerName, score: winnerScore }]);
        }
        await localDB.reset();
        window.location.reload();
        return;

      case 'SET_TEAM_NAME':
        if (!payload.name || !payload.name.trim()) break;
        const finalName = payload.name.trim().toUpperCase();
        if (payload.team === Team.A) next.teamAName = finalName;
        else if (payload.team === Team.B) next.teamBName = finalName;
        break;
      
      case 'UPDATE_SCORE':
        if (payload.team === Team.A) next.teamAScore = payload.value;
        else next.teamBScore = payload.value;
        break;

      case 'SET_MAX_ROUNDS':
        next.maxRounds = Math.min(payload.count, next.activeQuestions.length);
        break;
        
      case 'SET_ACTIVE_TEAM':
        next.activeTeam = payload.team;
        break;

      case 'REMOVE_PLAYER':
        next.users = next.users.filter(u => u.id !== payload.userId);
        break;

      case 'ADD_PLAYER':
        if (payload.user) {
          const exists = next.users.find(u => u.id === payload.user.id);
          if (!exists) {
            next.users.push(payload.user);
          }
        }
        break;

      case 'ADD_PLAYER_IF_NOT_EXISTS':
        if (session && profile) {
          const exists = next.users.find(u => u.id === session.user.id);
          if (!exists) {
            next.users.push({
              id: session.user.id,
              nickname: profile.nickname,
              team: Team.NONE,
              isCaptain: false,
              isHost: false,
              score: 0
            });
          }
        }
        break;
    }

    await localDB.saveState(next);
    setRoom(next);
  }, [room, session, profile]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth event:", event, session?.user?.id);
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        // We don't necessarily want to remove the player from the room here
        // because we don't have their ID anymore in 'session'.
        // The cleanup should probably be handled differently or by the admin.
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session && profile && room) {
      const exists = room.users.find(u => u.id === session.user.id);
      if (!exists) {
        handleAction('ADD_PLAYER_IF_NOT_EXISTS', {});
      }
    }
  }, [session, profile, room, handleAction]);

  useEffect(() => {
    if (session) {
      setShowAuth(false);
      setShowLogin(false);
    }
  }, [session]);

  useEffect(() => {
    const init = async () => {
      let state = await localDB.getState();
      if (!state) {
        console.log("No game state found, initializing...");
        const freshQuestions = JSON.parse(JSON.stringify(INITIAL_QUESTIONS)).map((q: any) => ({
          ...q, answers: q.answers.map((a: any) => ({ ...a, revealed: false }))
        }));
        state = {
          code: "LIVE-DZ", state: GameState.LOBBY, hostId: 'admin',
          teamAName: "FAMILLE A", teamBName: "FAMILLE B", teamAScore: 0, teamBScore: 0,
          roundScore: 0, strikes: 0, currentQuestionId: 1, maxRounds: 3,
          activeTeam: Team.NONE, diceResults: {}, users: [], activeQuestions: freshQuestions
        };
        await localDB.saveState(state);
      }
      setRoom(state);
    };
    init();

    const unsubscribe = localDB.subscribe((newState) => {
      console.log("Supabase Sync Update:", newState);
      setRoom(newState);
    });
    return () => {
      unsubscribe();
    };
  }, []);

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

  const currentUser = room?.users.find(u => u.id === session?.user.id) || null;

  return (
    <Router>
      <Routes>
        <Route path="/leaderboard" element={<Leaderboard isAdmin={isAdmin} />} />
        <Route path="/" element={
          <>
            {showAuth && !session && (
              <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[400] flex items-center justify-center p-4">
                <Auth onSuccess={() => setShowAuth(false)} />
              </div>
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

            {!session && !isAdmin && (
              <div className="fixed top-4 right-4 z-[200]">
                <button
                  onClick={() => setShowAuth(true)}
                  className="bg-yellow-600 hover:bg-yellow-500 text-white px-6 py-2 rounded-full font-game text-lg transition-all shadow-lg"
                >
                  CONNEXION JOUEUR
                </button>
              </div>
            )}

            {session && !isAdmin && (
               <div className="fixed top-4 right-4 z-[200] flex items-center gap-4">
                  <div className="bg-slate-900/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/5 flex items-center gap-3">
                    {profile ? (
                      <>
                        <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-slate-950 font-black uppercase">{profile?.nickname?.[0]}</div>
                        <span className="text-white text-xs font-bold uppercase tracking-widest">{profile?.nickname}</span>
                      </>
                    ) : (
                      <span className="text-slate-500 text-[10px] animate-pulse">CHARGEMENT...</span>
                    )}
                  </div>
                  <button onClick={() => { supabase.auth.signOut(); window.location.reload(); }} className="text-slate-500 hover:text-red-500 transition-colors">
                    <i className="fas fa-sign-out-alt"></i>
                  </button>
               </div>
            )}

            <GamePage
              room={room}
              user={currentUser}
              isAdmin={isAdmin}
              handleAction={handleAction}
              setShowLogin={setShowLogin}
              onLogoutAdmin={() => setIsAdmin(false)}
            />
          </>
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;
