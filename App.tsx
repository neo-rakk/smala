import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GameRoom, GameState, Team, Profile, Question } from './types';
import { INITIAL_QUESTIONS } from './constants';
import GamePage from './components/GamePage';
import SoundService from './services/SoundService';
import { localDB } from './services/LocalDB';
import { supabase } from './services/supabase';
import Auth from './components/Auth';
import Leaderboard from './components/Leaderboard';

const App: React.FC = () => {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [pin, setPin] = useState('');
  const handleActionRef = useRef<any>(null);

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
    let nextHostId: string | undefined = undefined;

    if (!current) {
        const freshQuestions = JSON.parse(JSON.stringify(INITIAL_QUESTIONS)).map((q: any) => ({
          ...q, answers: q.answers.map((a: any) => ({ ...a, revealed: false }))
        }));

        // When initializing, if we are the admin (session exists + validated PIN), we become the host
        const hostId = (session && isAdmin) ? session.user.id : 'admin';

        next = {
          code: "LIVE-DZ", state: GameState.LOBBY, hostId,
          teamAName: "FAMILLE A", teamBName: "FAMILLE B", teamAScore: 0, teamBScore: 0,
          roundScore: 0, strikes: 0, currentQuestionId: 1, maxRounds: 3,
          activeTeam: Team.NONE, diceResults: {}, users: [], activeQuestions: freshQuestions
        };
        nextHostId = hostId;
    } else {
        next = JSON.parse(JSON.stringify(current));
    }

    const currentQuestion = next.activeQuestions.find(q => q.id === next.currentQuestionId);

    // Helper to trigger sound
    const triggerSound = (soundName: string) => {
      next.lastSound = { id: Date.now(), type: soundName };
    };

    switch (type) {
      case 'INIT':
        if (current && isAdmin && session) {
             next.hostId = session.user.id;
             nextHostId = session.user.id;
        }
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
        triggerSound('tada');
        break;

      case 'REVEAL_ANSWER':
        if (!currentQuestion) break;
        const ans = currentQuestion.answers.find(a => a.id === payload.answerId);
        if (ans && !ans.revealed) {
          ans.revealed = true;
          next.roundScore += ans.points;
          triggerSound('ding');
          
          if (next.state === GameState.STEAL) {
            if (next.activeTeam === Team.A) next.teamAScore += next.roundScore;
            else if (next.activeTeam === Team.B) next.teamBScore += next.roundScore;
            
            next.state = GameState.LOBBY;
            next.currentQuestionId++;
            next.roundScore = 0;
            next.strikes = 0;
            next.activeTeam = Team.NONE;
            if (next.currentQuestionId > next.maxRounds) next.state = GameState.FINISHED;
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
            if (next.currentQuestionId > next.maxRounds) next.state = GameState.FINISHED;
          }
        }
        break;

      case 'ADD_STRIKE':
        if (next.state === GameState.STEAL) {
          triggerSound('buzzer');
          const originalTeam = next.activeTeam === Team.A ? Team.B : Team.A;
          if (originalTeam === Team.A) next.teamAScore += next.roundScore;
          else if (originalTeam === Team.B) next.teamBScore += next.roundScore;
          
          next.state = GameState.LOBBY;
          next.currentQuestionId++;
          next.roundScore = 0;
          next.strikes = 0;
          next.activeTeam = Team.NONE;
          if (next.currentQuestionId > next.maxRounds) next.state = GameState.FINISHED;
          break;
        }
        next.strikes = Math.min(3, next.strikes + 1);
        triggerSound('buzzer');
        break;

      case 'ACTIVATE_STEAL':
        next.state = GameState.STEAL;
        next.activeTeam = next.activeTeam === Team.A ? Team.B : Team.A;
        triggerSound('tada');
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
        if (next.currentQuestionId > next.maxRounds) next.state = GameState.FINISHED;
        triggerSound('tada');
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
        next.maxRounds = payload.count;
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

      case 'SET_QUESTIONS':
        if (payload.questions && Array.isArray(payload.questions)) {
           next.activeQuestions = payload.questions.map((q: any) => ({
             ...q,
             answers: q.answers.map((a: any) => ({ ...a, revealed: false }))
           }));
           next.currentQuestionId = next.activeQuestions[0]?.id || 1;
           next.roundScore = 0;
           next.strikes = 0;
        }
        break;
    }

    // Pass nextHostId to saveState so it updates the host_id column if needed
    await localDB.saveState(next, nextHostId);
    setRoom(next);
  }, [room, session, profile, isAdmin]);

  useEffect(() => {
    handleActionRef.current = handleAction;
  }, [handleAction]);

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

  const handleAdminLogin = () => {
    if (pin === (import.meta.env.VITE_ADMIN_PIN || '2908')) {
      setIsAdmin(true);
      setShowLogin(false);
      SoundService.unlockAudio();

      // If we are logged in, we claim the room as host immediately
      if (session) {
         handleAction('INIT', {});
      } else {
         // Fallback if not logged in (legacy support, though not recommended with RLS)
         if (!room) handleAction('INIT', {});
      }
    } else {
      alert("PIN Incorrect");
    }
  };

  const currentUser = room?.users.find(u => u.id === session?.user.id) || null;

  return (
    <Router>
      <Routes>
        <Route path="/leaderboard" element={<Leaderboard />} />
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
