import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsModal } from './StatsModal';
import { makeTestMatch, makeTestPlayer } from '../../domain/testHelpers';

describe('StatsModal', () => {
  it('sorts by fewest matches played first, then puts waiting players before on-court players on a tie', () => {
    const fewOnCourt = makeTestPlayer({ id: 'p1', name: 'FewOnCourt', matchesPlayed: 1 });
    const fewWaiting = makeTestPlayer({ id: 'p2', name: 'FewWaiting', matchesPlayed: 1 });
    const manyWaiting = makeTestPlayer({ id: 'p3', name: 'ManyWaiting', matchesPlayed: 3 });
    const zeroWaiting = makeTestPlayer({ id: 'p4', name: 'ZeroWaiting', matchesPlayed: 0 });

    const activeMatch = makeTestMatch({
      id: 'm1',
      players: [
        fewOnCourt,
        makeTestPlayer({ id: 'filler-a' }),
        makeTestPlayer({ id: 'filler-b' }),
        makeTestPlayer({ id: 'filler-c' }),
      ],
    });

    const { container } = render(
      <StatsModal
        isOpen
        onClose={() => {}}
        players={[fewOnCourt, fewWaiting, manyWaiting, zeroWaiting]}
        activeMatches={[activeMatch]}
      />,
    );

    const names = Array.from(container.querySelectorAll('tbody tr td:first-child')).map((td) => td.textContent);
    expect(names).toEqual(['ZeroWaiting', 'FewWaiting', 'FewOnCourt', 'ManyWaiting']);
  });

  it('derives each row’s status from activeMatches membership, not the isActive flag', () => {
    const onCourt = makeTestPlayer({ id: 'p1', name: 'OnCourt', isActive: true });
    const restingOffCourt = makeTestPlayer({ id: 'p2', name: 'RestingOffCourt', isActive: false });

    const activeMatch = makeTestMatch({
      id: 'm1',
      players: [
        onCourt,
        makeTestPlayer({ id: 'filler-a' }),
        makeTestPlayer({ id: 'filler-b' }),
        makeTestPlayer({ id: 'filler-c' }),
      ],
    });

    render(
      <StatsModal isOpen onClose={() => {}} players={[onCourt, restingOffCourt]} activeMatches={[activeMatch]} />,
    );

    const onCourtRow = screen.getByText('OnCourt').closest('tr');
    const restingRow = screen.getByText('RestingOffCourt').closest('tr');
    if (!onCourtRow || !restingRow) throw new Error('expected rows not found');

    expect(onCourtRow.textContent).toContain('正在場上打球');
    expect(restingRow.textContent).toContain('正在場下等待');
  });
});
