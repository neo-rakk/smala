import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { GameRoom, GameState, Team, User } from '../types';
import AdminPanel from './AdminPanel';
import GameBoard from './GameBoard';
import TeamEditSection from './TeamEditSection';

interface GamePageProps {
  room: GameRoom | null;
  user: User | null;
  isAdmin: boolean;
  handleAction: (type: string, payload: any) => Promise<void>;
  setShowLogin: (show: boolean) => void;
  onLogoutAdmin: () => void;
}

const GamePage: React.FC<GamePageProps> = ({ room, user, isAdmin, handleAction, setShowLogin, onLogoutAdmin }) => {
  const [showLobby, setShowLobby] = useState(true);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row overflow-hidden relative font-sans">
      {!isAdmin && (
        <div className="fixed bottom-4 right-4 flex gap-2 z-[200]">
           {room?.state === GameState.LOBBY && user && !showLobby && (
             <button
               onClick={() => setShowLobby(true)}
               className="px-4 h-10 rounded-full bg-yellow-600 hover:bg-yellow-500 text-white flex items-center justify-center transition-all border border-white/10 text-[10px] font-black uppercase tracking-tighter"
             >
               GESTION ÉQUIPE
             </button>
           )}
           <Link to="/leaderboard" className="w-10 h-10 rounded-full bg-white/5 hover:bg-yellow-600/20 flex items-center justify-center transition-all border border-white/10">
            <i className="fas fa-trophy text-yellow-500/40 text-sm"></i>
          </Link>
          <button
            onClick={() => setShowLogin(true)}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-yellow-600/20 flex items-center justify-center transition-all border border-white/10"
          >
            <i className="fas fa-cog text-white/40 text-sm"></i>
          </button>
        </div>
      )}

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
            <span className="text-yellow-500/90">PANDORA LIVE</span>
            <span className="opacity-20">|</span>
            FAMILLE DZ EN OR
          </p>
        </div>
      </footer>
    </div>
  );
};

export default GamePage;
