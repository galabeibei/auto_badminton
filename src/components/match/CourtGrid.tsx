import React from 'react';
import type { Match } from '../../domain';
import { CourtCard } from './CourtCard';

interface CourtGridProps {
  courtCount: number;
  activeMatches: Match[];
  onWinTeam1: (match: Match) => void;
  onWinTeam2: (match: Match) => void;
  onDraw: (match: Match) => void;
  onReturnToQueue: (match: Match) => void;
  onNoScore: (match: Match) => void;
}

export const CourtGrid: React.FC<CourtGridProps> = ({
  courtCount,
  activeMatches,
  onWinTeam1,
  onWinTeam2,
  onDraw,
  onReturnToQueue,
  onNoScore,
}) => {
  const courtIds = Array.from({ length: courtCount }, (_, i) => i + 1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courtIds.map((courtId) => {
        const match = activeMatches.find((m) => m.courtId === courtId);
        return (
          <CourtCard
            key={courtId}
            courtId={courtId}
            match={match}
            onWinTeam1={() => match && onWinTeam1(match)}
            onWinTeam2={() => match && onWinTeam2(match)}
            onDraw={() => match && onDraw(match)}
            onReturnToQueue={() => match && onReturnToQueue(match)}
            onNoScore={() => match && onNoScore(match)}
          />
        );
      })}
    </div>
  );
};
