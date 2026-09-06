import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlayerListScreen } from './PlayerListScreen';
import { renderWithAppState } from '../test/renderWithAppState';

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
});
