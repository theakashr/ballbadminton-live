import React, { useState } from 'react';
import { ArrowLeftRight, Crown } from 'lucide-react';
import type { Team } from '../../types';

interface CourtPlayer {
  id: string;
  name: string;
  number: number;
  position: 'Front / Net' | 'Centre / Pivot' | 'Base / Deep';
  isCaptain?: boolean;
}

interface InteractiveCourtViewProps {
  team1: Team;
  team2: Team;
  team1Players?: CourtPlayer[];
  team2Players?: CourtPlayer[];
  servingTeamId?: string;
  servingHand?: 1 | 2;
  isFlipped?: boolean;
  onToggleFlip?: () => void;
  className?: string;
}

// Fallback default starting positions if custom lineups aren't provided
const DEFAULT_T1_PLAYERS: CourtPlayer[] = [
  { id: 't1-p1', name: 'R. Vignesh', number: 7, position: 'Front / Net', isCaptain: true },
  { id: 't1-p2', name: 'S. Karthik', number: 4, position: 'Front / Net' },
  { id: 't1-p3', name: 'M. Anand', number: 9, position: 'Centre / Pivot' },
  { id: 't1-p4', name: 'P. Balaji', number: 11, position: 'Base / Deep' },
  { id: 't1-p5', name: 'K. Naveen', number: 3, position: 'Base / Deep' },
];

const DEFAULT_T2_PLAYERS: CourtPlayer[] = [
  { id: 't2-p1', name: 'G. Suresh', number: 10, position: 'Front / Net', isCaptain: true },
  { id: 't2-p2', name: 'A. Dhanush', number: 8, position: 'Front / Net' },
  { id: 't2-p3', name: 'V. Praveen', number: 5, position: 'Centre / Pivot' },
  { id: 't2-p4', name: 'R. Harish', number: 2, position: 'Base / Deep' },
  { id: 't2-p5', name: 'L. Varun', number: 12, position: 'Base / Deep' },
];

export const InteractiveCourtView: React.FC<InteractiveCourtViewProps> = ({
  team1,
  team2,
  team1Players = DEFAULT_T1_PLAYERS,
  team2Players = DEFAULT_T2_PLAYERS,
  servingTeamId,
  servingHand = 1,
  isFlipped = false,
  onToggleFlip,
  className = '',
}) => {
  const [hoveredPlayer, setHoveredPlayer] = useState<{
    player: CourtPlayer;
    teamName: string;
    teamColor: string;
  } | null>(null);

  const t1 = isFlipped ? team2 : team1;
  const t2 = isFlipped ? team1 : team2;
  const t1List = isFlipped ? team2Players : team1Players;
  const t2List = isFlipped ? team1Players : team2Players;

  // Distribute 5 players onto court spots
  const getPositionSlots = (players: CourtPlayer[]) => {
    const netLeft = players[0] || { id: '1', name: 'Net Left', number: 1, position: 'Front / Net' };
    const netRight = players[1] || { id: '2', name: 'Net Right', number: 2, position: 'Front / Net' };
    const centre = players[2] || { id: '3', name: 'Centre Pivot', number: 3, position: 'Centre / Pivot' };
    const baseLeft = players[3] || { id: '4', name: 'Base Left', number: 4, position: 'Base / Deep' };
    const baseRight = players[4] || { id: '5', name: 'Base Right', number: 5, position: 'Base / Deep' };
    return { netLeft, netRight, centre, baseLeft, baseRight };
  };

  const leftSlots = getPositionSlots(t1List);
  const rightSlots = getPositionSlots(t2List);

  const isT1Serving = servingTeamId === t1.id;
  const isT2Serving = servingTeamId === t2.id;

  const renderPlayerPin = (
    player: CourtPlayer,
    teamName: string,
    colorVariant: 'orange' | 'coral'
  ) => {
    const isServer = (colorVariant === 'orange' ? isT1Serving : isT2Serving) && player.number === 7;

    return (
      <div
        onMouseEnter={() =>
          setHoveredPlayer({
            player,
            teamName,
            teamColor: colorVariant === 'orange' ? 'text-brand-orange' : 'text-brand-coral',
          })
        }
        onMouseLeave={() => setHoveredPlayer(null)}
        className="relative group flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-125 z-20"
      >
        {/* Ball Badminton Yellow Wool Ball Indicator on Active Server */}
        {isServer && (
          <div className="absolute -top-3 w-3 h-3 rounded-full bg-brand-yellow shadow-[0_0_10px_#FFDC00] animate-bounce z-30" />
        )}

        <div
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-md border-2 transition-all ${
            colorVariant === 'orange'
              ? 'bg-brand-orange text-charcoal-950 border-orange-200 group-hover:border-white'
              : 'bg-brand-coral text-white border-coral-200 group-hover:border-white'
          }`}
        >
          {player.number}
          {player.isCaptain && (
            <Crown className="w-2.5 h-2.5 absolute -top-1.5 -right-1 text-brand-yellow stroke-[3]" />
          )}
        </div>

        <span className="text-[10px] font-semibold text-soft-white/90 bg-charcoal-950/80 px-1 rounded mt-0.5 whitespace-nowrap hidden sm:block">
          {player.name.split(' ')[0]}
        </span>
      </div>
    );
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Top Court Controls & Header */}
      <div className="flex items-center justify-between text-xs px-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900 dark:text-soft-white uppercase tracking-wider">
            BBFI 5s Tactical Court
          </span>
          <span className="text-slate-500 dark:text-muted-grey text-[11px] hidden sm:inline">
            (12m &times; 24m Standard Outdoor Dimension)
          </span>
        </div>

        <div className="flex items-center gap-3">
          {servingTeamId && (
            <span className="text-[11px] font-semibold text-amber-600 dark:text-brand-yellow flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-yellow animate-ping" />
              Serving: Hand {servingHand}
            </span>
          )}

          {onToggleFlip && (
            <button
              onClick={onToggleFlip}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-charcoal-800 dark:hover:bg-charcoal-700 text-slate-700 hover:text-slate-950 dark:text-muted-grey dark:hover:text-soft-white border border-slate-200 dark:border-transparent transition-colors text-xs font-semibold"
              title="Change of ends (flip court sides)"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Flip Ends</span>
            </button>
          )}
        </div>
      </div>

      {/* The 2D Graphic Court Surface */}
      <div className="relative w-full aspect-[21/9] sm:aspect-[24/10] bg-[#8B2E1D] rounded-2xl border-4 border-[#E2DDD5] p-3 shadow-2xl overflow-hidden select-none">
        
        {/* Clay Surface Texture Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#9B3926_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

        {/* Center Net Line with Post markers */}
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1.5 bg-white/90 z-10 flex flex-col justify-between items-center py-1 shadow-[0_0_8px_rgba(255,255,255,0.6)]">
          <div className="w-2.5 h-2.5 rounded-sm bg-slate-900 border border-white" />
          <span className="text-[9px] font-black uppercase tracking-widest text-white/70 -rotate-90 select-none">
            NET (1.05m)
          </span>
          <div className="w-2.5 h-2.5 rounded-sm bg-slate-900 border border-white" />
        </div>

        {/* 1m Crease / Dead Zone Lines on both sides of net */}
        <div className="absolute top-0 bottom-0 left-[calc(50%-28px)] w-[1px] bg-white/40 border-r border-dashed border-white/60 pointer-events-none" />
        <div className="absolute top-0 bottom-0 left-[calc(50%+28px)] w-[1px] bg-white/40 border-l border-dashed border-white/60 pointer-events-none" />

        {/* 5m Service Crease lines */}
        <div className="absolute top-0 bottom-0 left-[25%] w-[1px] bg-white/30 pointer-events-none" />
        <div className="absolute top-0 bottom-0 right-[25%] w-[1px] bg-white/30 pointer-events-none" />

        {/* Outer Boundary White Lines */}
        <div className="absolute inset-2 border-2 border-white/80 pointer-events-none rounded-sm" />

        {/* Court Half 1 (Left Side) */}
        <div className="absolute inset-y-0 left-0 right-1/2 p-4 grid grid-cols-3 items-center">
          {/* Base / Deep (Left column) */}
          <div className="flex flex-col justify-around h-full items-center">
            {renderPlayerPin(leftSlots.baseLeft, t1.name, 'orange')}
            {renderPlayerPin(leftSlots.baseRight, t1.name, 'orange')}
          </div>

          {/* Centre / Pivot (Middle column) */}
          <div className="flex items-center justify-center h-full">
            {renderPlayerPin(leftSlots.centre, t1.name, 'orange')}
          </div>

          {/* Front / Net (Right column near net) */}
          <div className="flex flex-col justify-around h-full items-center">
            {renderPlayerPin(leftSlots.netLeft, t1.name, 'orange')}
            {renderPlayerPin(leftSlots.netRight, t1.name, 'orange')}
          </div>
        </div>

        {/* Court Half 2 (Right Side) */}
        <div className="absolute inset-y-0 left-1/2 right-0 p-4 grid grid-cols-3 items-center">
          {/* Front / Net (Left column near net) */}
          <div className="flex flex-col justify-around h-full items-center">
            {renderPlayerPin(rightSlots.netLeft, t2.name, 'coral')}
            {renderPlayerPin(rightSlots.netRight, t2.name, 'coral')}
          </div>

          {/* Centre / Pivot (Middle column) */}
          <div className="flex items-center justify-center h-full">
            {renderPlayerPin(rightSlots.centre, t2.name, 'coral')}
          </div>

          {/* Base / Deep (Right column) */}
          <div className="flex flex-col justify-around h-full items-center">
            {renderPlayerPin(rightSlots.baseLeft, t2.name, 'coral')}
            {renderPlayerPin(rightSlots.baseRight, t2.name, 'coral')}
          </div>
        </div>

        {/* Side Team Badges */}
        <div className="absolute bottom-2 left-4 z-20">
          <span className="text-[11px] font-bold text-soft-white bg-charcoal-950/80 px-2 py-0.5 rounded-md border border-brand-orange/40">
            {t1.name} {isT1Serving && '🎾'}
          </span>
        </div>
        <div className="absolute bottom-2 right-4 z-20">
          <span className="text-[11px] font-bold text-soft-white bg-charcoal-950/80 px-2 py-0.5 rounded-md border border-brand-coral/40">
            {t2.name} {isT2Serving && '🎾'}
          </span>
        </div>
      </div>

      {/* Hovered Player Tooltip / Info Card */}
      {hoveredPlayer && (
        <div className="p-3 rounded-xl bg-white dark:bg-charcoal-900 border border-slate-200 dark:border-plum-800 shadow-md text-xs flex items-center justify-between animate-fade-in-up">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-charcoal-800 flex items-center justify-center font-bold text-slate-800 dark:text-soft-white border border-slate-300 dark:border-charcoal-700">
              #{hoveredPlayer.player.number}
            </span>
            <div>
              <span className="font-bold text-slate-900 dark:text-soft-white">{hoveredPlayer.player.name}</span>
              <span className={`text-[11px] block font-semibold ${hoveredPlayer.teamColor}`}>
                {hoveredPlayer.teamName} • {hoveredPlayer.player.position}
              </span>
            </div>
          </div>

          {hoveredPlayer.player.isCaptain && (
            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-brand-yellow font-bold text-[10px] border border-amber-500/30">
              Captain
            </span>
          )}
        </div>
      )}
    </div>
  );
};
