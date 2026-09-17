import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { PlayerStatsTable } from './PlayerStatsTable';
import { makeTestPlayer } from '../../domain/testHelpers';

describe('PlayerStatsTable', () => {
  it('shows "正在場上打球" for a player in activePlayerIds and "正在場下等待" otherwise', () => {
    const onCourt = makeTestPlayer({ id: 'p1', name: 'OnCourt' });
    const waiting = makeTestPlayer({ id: 'p2', name: 'Waiting' });

    render(
      <PlayerStatsTable
        players={[onCourt, waiting]}
        allPlayers={[onCourt, waiting]}
        variant="lobby"
        activePlayerIds={new Set(['p1'])}
      />,
    );

    const onCourtRow = screen.getByText('OnCourt').closest('tr');
    const waitingRow = screen.getByText('Waiting').closest('tr');
    if (!onCourtRow || !waitingRow) throw new Error('expected rows not found');

    expect(within(onCourtRow).getByText('正在場上打球')).toBeInTheDocument();
    expect(within(waitingRow).getByText('正在場下等待')).toBeInTheDocument();
  });

  it('treats a resting player (isActive: false) as waiting rather than a distinct status', () => {
    // isActive means "eligible for matchmaking", not "currently on a court" -
    // the status column must key off activePlayerIds, not that flag.
    const resting = makeTestPlayer({ id: 'p3', name: 'Resting', isActive: false });

    render(
      <PlayerStatsTable players={[resting]} allPlayers={[resting]} variant="lobby" activePlayerIds={new Set()} />,
    );

    expect(screen.getByText('正在場下等待')).toBeInTheDocument();
    expect(screen.queryByText('正在場上打球')).not.toBeInTheDocument();
  });

  it('omits the status column for the "final" variant', () => {
    const player = makeTestPlayer({ id: 'p1', name: 'Alice' });
    render(<PlayerStatsTable players={[player]} allPlayers={[player]} variant="final" />);

    expect(screen.queryByText('狀態')).not.toBeInTheDocument();
    expect(screen.queryByText('正在場上打球')).not.toBeInTheDocument();
    expect(screen.queryByText('正在場下等待')).not.toBeInTheDocument();
  });
});
