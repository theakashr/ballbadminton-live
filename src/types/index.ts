export type MatchStatus = 'live' | 'upcoming' | 'ready' | 'completed' | 'paused' | 'postponed' | 'cancelled';

export type MatchCategory = 
  | "Men's Open 5s"
  | "Women's Open 5s"
  | "Junior Boys (U-19)"
  | "Junior Girls (U-19)"
  | "Inter-Collegiate Fives"
  | "Doubles Open";

export type MatchStage = 
  | 'Championship Final' 
  | 'Semi-Final 1' 
  | 'Semi-Final 2' 
  | 'Bronze Medal Playoff'
  | 'Quarter-Final' 
  | 'Super 8 League' 
  | 'Group Stage';

export interface Player {
  id: string;
  name: string;
  number: number;
  position: 'Front / Net' | 'Centre / Pivot' | 'Base / Deep' | 'Server';
  isCaptain?: boolean;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  state: string;
  city: string;
  logoBg: string;
  accentColor: string;
  captainName: string;
  coachName?: string;
  roster?: Player[];
}

export interface GameScore {
  gameNumber: number; // 1, 2, or 3
  team1Score: number;
  team2Score: number;
  isCompleted: boolean;
  winnerTeamId?: string;
  durationMinutes?: number;
}

export interface MatchLineupItem {
  id?: string;
  matchId: string;
  teamId: string;
  playerId: string;
  playerName: string;
  jerseyNumber: number;
  position: 'Front / Net' | 'Centre / Pivot' | 'Base / Deep' | 'Server';
  isStarting: boolean;
  isSubstitute: boolean;
  orderIndex: number;
}

export interface Match {
  id: string;
  tournamentId: string;
  tournamentName: string;
  stage: MatchStage;
  round?: string;
  category: MatchCategory;
  court: string;
  status: MatchStatus;
  scheduledTime: string;
  startedAt?: string;
  completedAt?: string;
  team1: Team;
  team2: Team;
  currentSet: number;
  team1SetsWon: number;
  team2SetsWon: number;
  setScores: GameScore[];
  servingTeamId?: string;
  servingHand?: 1 | 2; // In Ball Badminton: 1st Hand or 2nd Hand
  maxPointsPerSet: number; // Ball Badminton is traditionally played to 29 or 35 points
  bestOfSets?: number; // 1 (Group / League 29-pt), 3 (Standard BBFI Championship), or 5
  venue: string;
  city: string;
  notes?: string;
  referee?: string;
  scorerEmail?: string;
  scorerName?: string;
  lineups?: MatchLineupItem[];
  configSnapshot?: any;
  version?: number;
  matchDurationMinutes?: number;
}

export interface TournamentTeamRegistration {
  id: string;
  tournamentId: string;
  teamId: string;
  team?: Team;
  registrationStatus: 'pending' | 'confirmed' | 'withdrawn' | 'disqualified';
  seedNumber?: number;
  groupName?: string; // e.g. "Group A"
  registeredAt: string;
}

export interface TeamRosterMember {
  id: string;
  teamId: string;
  playerId: string;
  player?: Player;
  tournamentId?: string;
  jerseyNumber: number;
  position: 'Front / Net' | 'Centre / Pivot' | 'Base / Deep' | 'Server';
  isCaptain: boolean;
  isActive: boolean;
  registeredAt: string;
}

export interface TeamStandings {
  teamId: string;
  teamName: string;
  shortName: string;
  groupName?: string;
  played: number;
  won: number;
  lost: number;
  setsWon: number;
  setsLost: number;
  setDifference: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDifference: number;
  points: number; // 2 points per victory
}

export interface Tournament {
  id: string;
  name: string;
  organizer: string;
  startDate: string;
  endDate: string;
  city: string;
  venue: string;
  format: '5s' | 'Doubles' | 'Mixed';
  category: string;
  totalTeams: number;
  courtsCount: number;
  status: 'live' | 'upcoming' | 'completed';
}

export interface NewTournamentFormData {
  name: string;
  organizer: string;
  category: string;
  format: '5s' | 'Doubles' | 'Mixed';
  matchFormat?: string;
  startDate: string;
  endDate: string;
  city: string;
  venue: string;
  courtsCount: number;
  expectedTeams: number;
  contactEmail: string;
}

export * from './admin';

