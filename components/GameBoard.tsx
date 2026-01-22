
import React, { useState, useEffect, useRef } from 'react';
import { GameRoom, GameState, Team, User } from '../types';
import ScoreDisplay from './ScoreDisplay';
import AnswerCard from './AnswerCard';

interface GameBoardProps {
  room: GameRoom;
  user: User;
  onRoll: (val: number) => void;
  onLogout: () => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ room }) => {
  const [showStrikeOverlay, setShowStrikeOverlay] = useState(false);
  const [showGainOverlay, setShowGainOverlay] = useState<{team: Team, points: number} | null>(null);
  const [timer, setTimer] = useState(30);
  const prevStrikes = useRef(room.strikes);
  const prevScores = useRef({ A: room.teamAScore, B: room.teamBScore });
  
  const currentQuestion = room.activeQuestions.find(q => q.id === room.currentQuestionId);

  useEffect(() => {
    if (room.strikes > prevStrikes.current) {
      setShowStrikeOverlay(true);
      const t = setTimeout(() => setShowStrikeOverlay(false), 1200);
      return () => clearTimeout(t);
    }
    prevStrikes.current = room.strikes;
  }, [room.strikes]);

  useEffect(() => {
    const gainA = room.teamAScore - prevScores.current.A;
    const gainB = room.teamBScore - prevScores.current.B;

    if (gainA > 0) {
      setShowGainOverlay({ team: Team.A, points: gainA });
      setTimeout(() => setShowGainOverlay(null), 3000);
    } else if (gainB > 0) {
      setShowGainOverlay({ team: Team.B, points: gainB });
      setTimeout(() => setShowGainOverlay(null), 3000);
    }

    prevScores.current = { A: room.teamAScore, B: room.teamBScore };
  }, [room.teamAScore, room.teamBScore]);

  useEffect(() => {
    let interval: any;
    if (room.state === GameState.STEAL) {
      setTimer(30);
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [room.state]);

  const teamAPlayers = room.users.filter(u => u.team === Team.A);
  const teamBPlayers = room.users.filter(u => u.team === Team.B);

  return (
    <div className="w-full max-w-6xl flex flex-col items-center relative px-2 animate-in fade-in duration-700">
      {/* Overlay Gain de Points */}
      {showGainOverlay && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center pointer-events-none bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="text-center animate-in zoom-in duration-500">
            <h2 className={`text-4xl md:text-8xl font-game uppercase mb-4 ${showGainOverlay.team === Team.A ? 'text-emerald-400' : 'text-red-400'}`}>
              {showGainOverlay.team === Team.A ? room.teamAName : room.teamBName} GAGNE
            </h2>
            <div className="text-8xl md:text-[15rem] font-game text-yellow-500 drop-shadow-[0_0_50px_rgba(234,179,8,1)]">
              +{showGainOverlay.points}
            </div>
          </div>
        </div>
      )}

      {/* Overlay X Rouge */}
      {showStrikeOverlay && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none bg-red-950/20 backdrop-blur-[2px]">
          <div className="flex gap-4 md:gap-8 items-center justify-center w-full animate-in zoom-in duration-150">
            {[...Array(room.strikes)].map((_, i) => (
              <i key={i} className="fas fa-times text-[100px] md:text-[300px] text-red-600 drop-shadow-[0_0_50px_rgba(220,38,38,1)] animate-bounce"></i>
            ))}
          </div>
        </div>
      )}

      {/* Header Scores */}
      <div className="flex justify-between w-full mb-6 md:mb-12 items-start gap-2 md:gap-6 px-4">
        {/* TEAM A */}
        <div className={`transition-all duration-500 flex-1 ${
          room.activeTeam === Team.A
            ? 'scale-125 opacity-100 z-20'
            : room.activeTeam === Team.NONE
              ? 'opacity-100'
              : 'opacity-40 grayscale-[0.5]'
        }`}>
          <ScoreDisplay name={room.teamAName} score={room.teamAScore} team={Team.A} />
          <div className="mt-3 flex flex-wrap gap-1 justify-start">
            {teamAPlayers.map(u => (
              <span key={u.id} className={`text-[8px] md:text-[10px] px-2 py-0.5 rounded-full border ${u.isCaptain ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500' : 'bg-slate-800 border-slate-700 text-slate-400'} font-black uppercase tracking-tighter`}>
                {u.isCaptain && <i className="fas fa-crown mr-1"></i>}{u.nickname}
              </span>
            ))}
          </div>
        </div>
        
        {/* POINTAGE CENTRAL */}
        <div className="flex flex-col items-center shrink-0">
          <div className="relative">
            <div className="bg-yellow-500 text-slate-950 font-game text-4xl md:text-8xl px-8 md:px-16 py-3 md:py-6 rounded-b-[2rem] shadow-[0_10px_40px_rgba(234,179,8,0.5)] border-b-8 border-yellow-300 transform -rotate-2">
              {room.roundScore}
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[8px] md:text-[10px] font-black text-white bg-slate-950 px-3 md:px-4 py-1 rounded-full border border-yellow-500 shadow-lg whitespace-nowrap">À GAGNER</div>
          </div>
          
          <div className="mt-8 md:mt-14 flex gap-2 md:gap-4">
             {[...Array(3)].map((_, i) => (
               <div key={i} className={`w-8 h-8 md:w-14 md:h-14 border-2 md:border-4 rounded-lg md:rounded-xl flex items-center justify-center transition-all duration-300 ${i < room.strikes ? 'bg-red-600 border-red-400 scale-110 shadow-[0_0_20px_rgba(220,38,38,0.5)]' : 'bg-slate-900 border-slate-800 opacity-20'}`}>
                 <i className="fas fa-times text-white text-lg md:text-3xl"></i>
               </div>
             ))}
          </div>
        </div>

        {/* TEAM B */}
        <div className={`transition-all duration-500 flex-1 ${
          room.activeTeam === Team.B
            ? 'scale-125 opacity-100 z-20'
            : room.activeTeam === Team.NONE
              ? 'opacity-100'
              : 'opacity-40 grayscale-[0.5]'
        }`}>
          <ScoreDisplay name={room.teamBName} score={room.teamBScore} team={Team.B} />
          <div className="mt-3 flex flex-wrap gap-1 justify-end">
            {teamBPlayers.map(u => (
              <span key={u.id} className={`text-[8px] md:text-[10px] px-2 py-0.5 rounded-full border ${u.isCaptain ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500' : 'bg-slate-800 border-slate-700 text-slate-400'} font-black uppercase tracking-tighter`}>
                {u.isCaptain && <i className="fas fa-crown mr-1"></i>}{u.nickname}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Plateau Principal */}
      <div className="w-full bg-slate-950 border-[6px] md:border-[16px] border-yellow-600 rounded-[2rem] md:rounded-[5rem] p-4 md:p-14 shadow-[0_0_100px_rgba(0,0,0,0.8)] relative overflow-hidden min-h-[400px] md:min-h-[600px] border-double">
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #EAB308 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>

        {room.state === GameState.LOBBY && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 md:space-y-10 py-10 md:py-24 animate-in zoom-in duration-500">
            <h2 className="text-4xl md:text-9xl font-game text-white uppercase tracking-tighter leading-none">PRÊT POUR LA SUITE ?</h2>
            <div className="bg-emerald-600/20 px-6 md:px-12 py-2 md:py-4 rounded-full border-2 border-emerald-500/50 shadow-2xl animate-pulse">
               <p className="text-emerald-400 font-game text-xl md:text-5xl tracking-widest uppercase">L'ANIMATEUR VA LANCER !</p>
            </div>
          </div>
        )}

        {(room.state === GameState.ROUND || room.state === GameState.STEAL) && currentQuestion && (
          <div className="space-y-6 md:space-y-14 relative z-10">
            {/* Question */}
            <div className="bg-slate-900 p-6 md:p-12 rounded-[1.5rem] md:rounded-[3rem] border-2 md:border-8 border-slate-800 shadow-2xl text-center relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 md:h-2 bg-yellow-500"></div>
              <h2 className="text-xl md:text-6xl font-game text-white uppercase leading-tight tracking-tight">{currentQuestion.questionText}</h2>
              {room.state === GameState.STEAL && (
                <div className="absolute top-0 right-0 h-full w-14 md:w-36 bg-red-600 flex items-center justify-center border-l-2 md:border-l-8 border-red-400">
                  <span className={`font-game text-3xl md:text-8xl ${timer <= 5 ? 'animate-ping text-white' : 'text-white'}`}>{timer}</span>
                </div>
              )}
            </div>
            
            {/* Réponses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-10">
              {currentQuestion.answers.map((ans, idx) => (
                <AnswerCard key={ans.id} index={idx + 1} answer={ans} revealed={ans.revealed} />
              ))}
            </div>

            {/* Alerte Vol */}
            {room.state === GameState.STEAL && (
              <div className="mt-8 md:mt-16 bg-red-600 p-4 md:p-10 rounded-[2rem] md:rounded-[4rem] border-4 md:border-[12px] border-red-400 shadow-[0_0_80px_rgba(220,38,38,0.7)] animate-bounce flex items-center justify-center gap-4 md:gap-10">
                <i className="fas fa-bolt text-white text-3xl md:text-7xl"></i>
                <div className="text-center">
                  <p className="text-white font-game text-lg md:text-3xl opacity-80 uppercase leading-none">C'EST LE MOMENT DU</p>
                  <p className="text-white font-game text-3xl md:text-8xl uppercase tracking-widest italic drop-shadow-xl">VOL DE POINTS !</p>
                </div>
                <i className="fas fa-bolt text-white text-3xl md:text-7xl"></i>
              </div>
            )}
          </div>
        )}

        {room.state === GameState.FINISHED && (
          <div className="h-full flex flex-col items-center justify-center py-10 md:py-32 text-center space-y-10 md:space-y-20">
            <div className="relative">
              <h2 className="text-5xl md:text-[14rem] font-game text-yellow-500 drop-shadow-[0_0_60px_rgba(234,179,8,0.8)] uppercase leading-none italic animate-bounce">LE CHAMPION !</h2>
            </div>
            <div className="flex flex-col md:flex-row gap-6 md:gap-24 w-full justify-center px-4">
               <div className={`flex flex-col items-center transition-all duration-1000 ${room.teamAScore >= room.teamBScore ? 'scale-125 z-10' : 'opacity-50 grayscale'}`}>
                  <span className={`font-black uppercase mb-4 text-xs md:text-3xl tracking-[0.4em] ${room.teamAScore >= room.teamBScore ? 'text-green-500' : 'text-slate-500'}`}>{room.teamAName}</span>
                  <div className={`bg-slate-900 p-8 md:p-20 rounded-[2.5rem] md:rounded-[5rem] border-4 md:border-[12px] shadow-[0_0_50px_rgba(22,163,74,0.3)] ${room.teamAScore >= room.teamBScore ? 'border-green-600' : 'border-slate-800'}`}>
                    <p className="text-white font-game text-6xl md:text-[14rem] leading-none">{room.teamAScore}</p>
                  </div>
                  {room.teamAScore >= room.teamBScore && <div className="mt-4 text-yellow-500 font-game text-xl md:text-5xl animate-pulse">VAINQUEUR !</div>}
               </div>
               <div className={`flex flex-col items-center transition-all duration-1000 ${room.teamBScore >= room.teamAScore ? 'scale-125 z-10' : 'opacity-50 grayscale'}`}>
                  <span className={`font-black uppercase mb-4 text-xs md:text-3xl tracking-[0.4em] ${room.teamBScore >= room.teamAScore ? 'text-red-500' : 'text-slate-500'}`}>{room.teamBName}</span>
                  <div className={`bg-slate-900 p-8 md:p-20 rounded-[2.5rem] md:rounded-[5rem] border-4 md:border-[12px] shadow-[0_0_50px_rgba(220,38,38,0.3)] ${room.teamBScore >= room.teamAScore ? 'border-red-600' : 'border-slate-800'}`}>
                    <p className="text-white font-game text-6xl md:text-[14rem] leading-none">{room.teamBScore}</p>
                  </div>
                  {room.teamBScore >= room.teamAScore && <div className="mt-4 text-yellow-500 font-game text-xl md:text-5xl animate-pulse">VAINQUEUR !</div>}
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameBoard;
