
export enum GameState {
  LOBBY = 'LOBBY',
  DUEL = 'DUEL',
  ROUND = 'ROUND',
  STEAL = 'STEAL',
  FINISHED = 'FINISHED'
}

export enum Team {
  A = 'A',
  B = 'B',
  NONE = 'NONE'
}

export interface Answer {
  id: number;
  text: string;
  points: number;
  revealed: boolean;
}

export interface Question {
  id: number;
  theme: string;
  questionText: string;
  answers: Answer[];
}

export interface User {
  id: string;
  nickname: string;
  team: Team;
  isCaptain: boolean;
  isHost: boolean;
  score: number;
  avatar_url?: string;
  team_id?: string;
}

export interface Profile {
  id: string;
  nickname: string;
  role?: string;
  avatar_url?: string;
}

export interface TeamData {
  id: string;
  name: string;
  captain_id: string;
}

export interface LeaderboardEntry {
  id: string;
  nickname: string;
  score: number;
  created_at: string;
}

export interface GameRoom {
  code: string;
  state: GameState;
  hostId: string;
  teamAName: string;
  teamBName: string;
  teamAScore: number;
  teamBScore: number;
  roundScore: number;
  strikes: number;
  currentQuestionId: number;
  maxRounds: number;
  activeTeam: Team;
  diceResults: { [key: string]: number };
  users: User[];
  activeQuestions: Question[];
}
