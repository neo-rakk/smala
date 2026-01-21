import React, { useState } from 'react';
import { GameRoom, Team, User } from '../types';

interface TeamEditSectionProps {
  team: Team;
  room: GameRoom;
  user: User;
  handleAction: (type: string, payload: any) => Promise<void>;
}

const TeamEditSection: React.FC<TeamEditSectionProps> = ({ team, room, user, handleAction }) => {
  const [input, setInput] = useState('');
  const isTeamA = team === Team.A;
  const teamName = isTeamA ? room.teamAName : room.teamBName;
  const players = room.users.filter(u => u.team === team);

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

export default TeamEditSection;
