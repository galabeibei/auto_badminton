import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlayerListScreen } from './PlayerListScreen';
import { renderWithAppState } from '../test/renderWithAppState';
import { initialAppState, Stage } from '../state/appState';
import { makeTestMatch, makeTestPlayer } from '../domain/testHelpers';
import { MatchStatus } from '../domain';

describe('PlayerListScreen', () => {
  it('adds a player through the form and shows them in the roster table', async () => {
    const user = userEvent.setup();
    renderWithAppState(<PlayerListScreen />);

    await user.type(screen.getByPlaceholderText('姓名'), 'Alice');
    await user.click(screen.getByRole('button', { name: '新增' }));

    expect(await screen.findByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('總人數: 1')).toBeInTheDocument();
  });

  it('shows a validation message and adds nobody when the name is blank', async () => {
    const user = userEvent.setup();
    renderWithAppState(<PlayerListScreen />);

    await user.click(screen.getByRole('button', { name: '新增' }));

    expect(await screen.findByText('請輸入選手姓名')).toBeInTheDocument();
    expect(screen.getByText('總人數: 0')).toBeInTheDocument();
  });

  it('keeps "下一步" disabled until at least 4 active players exist', async () => {
    const user = userEvent.setup();
    renderWithAppState(<PlayerListScreen />);

    const nextButton = screen.getByRole('button', { name: /下一步/ });
    expect(nextButton).toBeDisabled();

    const nameInput = screen.getByPlaceholderText('姓名');
    const addButton = screen.getByRole('button', { name: '新增' });
    for (const name of ['P1', 'P2', 'P3']) {
      await user.type(nameInput, name);
      await user.click(addButton);
    }
    expect(nextButton).toBeDisabled();

    await user.type(nameInput, 'P4');
    await user.click(addButton);
    expect(nextButton).not.toBeDisabled();
  });

  it('moves a player to resting and excludes them from the active count', async () => {
    const user = userEvent.setup();
    renderWithAppState(<PlayerListScreen />);

    await user.type(screen.getByPlaceholderText('姓名'), 'Alice');
    await user.click(screen.getByRole('button', { name: '新增' }));

    const restButton = await screen.findByRole('button', { name: /準備上場/ });
    await user.click(restButton);

    expect(screen.getByRole('button', { name: /休息中/ })).toBeInTheDocument();
    expect(screen.getByText('上場: 0')).toBeInTheDocument();
  });

  it('refuses to remove a player who is still on a court', async () => {
    const user = userEvent.setup();
    const playing = ['OnCourt1', 'OnCourt2', 'OnCourt3', 'OnCourt4'].map((name) =>
      makeTestPlayer({ id: name, name }),
    );
    const resting = makeTestPlayer({ id: 'Benched', name: 'Benched' });

    renderWithAppState(<PlayerListScreen />, {
      ...initialAppState,
      stage: Stage.PLAYER_LIST,
      hasGameStarted: true,
      players: [...playing, resting],
      activeMatches: [
        makeTestMatch({ id: 'm1', players: playing, status: MatchStatus.PLAYING, courtId: 1 }),
      ],
    });

    // Deleting them would leave court 1 holding a player the roster no longer has.
    expect(screen.getByRole('button', { name: '移除 OnCourt1' })).toBeDisabled();

    const removable = screen.getByRole('button', { name: '移除 Benched' });
    expect(removable).not.toBeDisabled();
    await user.click(removable);
    expect(screen.queryByText('Benched')).not.toBeInTheDocument();
  });

  describe('editing a rating in the roster table', () => {
    /** Adds one player and hands back their rating field. */
    const addAlice = async (user: ReturnType<typeof userEvent.setup>) => {
      renderWithAppState(<PlayerListScreen />);
      await user.type(screen.getByPlaceholderText('姓名'), 'Alice');
      await user.click(screen.getByRole('button', { name: '新增' }));
      return screen.findByLabelText('Alice 的積分');
    };

    it('keeps the typed rating after committing it with Enter', async () => {
      const user = userEvent.setup();
      const field = await addAlice(user);

      await user.clear(field);
      await user.type(field, '1450{Enter}');

      expect(await screen.findByLabelText('Alice 的積分')).toHaveValue(1450);
    });

    it('commits the typed rating when focus leaves the field', async () => {
      const user = userEvent.setup();
      const field = await addAlice(user);

      await user.clear(field);
      await user.type(field, '900');
      await user.tab();

      expect(await screen.findByLabelText('Alice 的積分')).toHaveValue(900);
    });

    it('reverts to the stored rating when the edit is cancelled with Escape', async () => {
      const user = userEvent.setup();
      const field = await addAlice(user);

      await user.clear(field);
      await user.type(field, '7777{Escape}');

      expect(await screen.findByLabelText('Alice 的積分')).toHaveValue(1200);
    });

    it('rejects an out-of-range rating with a message and keeps the stored one', async () => {
      const user = userEvent.setup();
      const field = await addAlice(user);

      await user.clear(field);
      await user.type(field, '9999{Enter}');

      expect(await screen.findByText('請輸入合理的積分 (0 - 5000)')).toBeInTheDocument();
      expect(screen.getByLabelText('Alice 的積分')).toHaveValue(1200);
    });

    it('silently keeps the stored rating when the field is left blank', async () => {
      const user = userEvent.setup();
      const field = await addAlice(user);

      await user.clear(field);
      await user.tab();

      expect(await screen.findByLabelText('Alice 的積分')).toHaveValue(1200);
      expect(screen.queryByText('請輸入合理的積分 (0 - 5000)')).not.toBeInTheDocument();
    });
  });
});
