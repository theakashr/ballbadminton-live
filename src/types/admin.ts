import type { Tournament } from './index';

export type UserRole = 'super_admin' | 'tournament_admin' | 'official_scorer' | 'viewer';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  grantedBy: string; // e.g. "akashakashr505@gmail.com"
  grantedAt: string;
  avatarBg?: string;
  isActive: boolean;
  assignedTournaments?: string[];
  contactNumber?: string;
  designation?: string;
}

export type TournamentVisibility = 'public' | 'unlisted' | 'draft';
export type TournamentRegistrationStatus = 'open' | 'closed' | 'invite-only' | 'upcoming';
export type TournamentFullStatus = 'live' | 'upcoming' | 'completed' | 'archived';

export interface AdminTournament extends Omit<Tournament, 'status'> {
  description?: string;
  registrationDeadline?: string;
  maxTeams?: number;
  matchFormat?: string; // e.g. "Best of 3 sets (29 Points per set)"
  visibility?: TournamentVisibility;
  registrationStatus?: TournamentRegistrationStatus;
  status: TournamentFullStatus;
  prizePool?: string;
  entryFee?: string;
  ballType?: string;
  surfaceType?: string;
  chiefReferee?: string;
  contactEmail?: string;
  contactPhone?: string;
  registeredTeamsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ScorerAssignment {
  id: string;
  scorerName: string;
  scorerEmail: string;
  court: string;
  matchId?: string;
  matchTitle?: string;
  tournamentId: string;
  tournamentName: string;
  status: 'assigned' | 'active_scoring' | 'available' | 'offline';
  assignedAt: string;
  certificationLevel?: 'BBFI Grade A' | 'BBFI Grade B' | 'State Umpire' | 'National Scorer';
  phone?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  entityType: 'tournament' | 'team' | 'match' | 'scorer' | 'user' | 'system';
  entityName: string;
  userName: string;
  userEmail: string;
  details?: string;
}

export interface ScoringSettings {
  pointsPerSet: 29 | 35;
  bestOfSets: 3 | 5;
  servingSystem: 'two_hands' | 'single_hand'; // 1st Hand & 2nd Hand (Ball Badminton standard)
  deucePointsEnabled: boolean;
  maxOvertimeCap: number; // e.g. 33 or 39
  defaultCourtsCount: number;
  courtSurface: 'Outdoor Red Clay' | 'Indoor Synthetic Mat' | 'Outdoor Sand/Grit';
  ballSpecification: 'BBFI Standard Yellow Woollen Ball (27-30g)';
  autoPublishLiveScores: boolean;
  umpirePinRequired: boolean;
}

export interface DashboardStats {
  totalTournaments: number;
  registeredTeams: number;
  registeredPlayers: number;
  scheduledMatches: number;
  liveMatches: number;
  completedMatches: number;
  totalCourtsActive: number;
  certifiedScorersCount: number;
}
