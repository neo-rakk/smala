import React from 'react';
import { Team } from '../types';

interface ScoreDisplayProps {
  name: string;
  score: number;
  team: Team;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ name, score, team }) => {
  return (
    <div className={`relative p-2 md:p-6 rounded-[1rem] md:rounded-[2rem] border-2 md:border-8 shadow-2xl overflow-hidden group transition-all duration-300 ${
      team === Team.A
        ? 'bg-gradient-to-br from-emerald-950 to-slate-900 border-emerald-600 shadow-emerald-900/20'
        : 'bg-gradient-to-br from-red-950 to-slate-900 border-red-600 shadow-red-900/20'
    }`}>
      <div className="flex flex-col items-center">
        <span className="text-[10px] md:text-xl font-black text-white/40 uppercase tracking-[0.2em] mb-1">{name}</span>
        <span className={`text-3xl md:text-8xl font-game leading-none gold-glow ${
          team === Team.A ? 'text-emerald-400' : 'text-red-400'
        }`}>
          {score}
        </span>
      </div>
      <div className={`absolute top-0 ${team === Team.A ? 'left-0' : 'right-0'} w-1 md:w-3 h-full ${
        team === Team.A ? 'bg-emerald-500' : 'bg-red-500'
      }`}></div>
    </div>
  );
};

export default ScoreDisplay;
