import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@testing-library/react';
import { PlayerSelectModal } from './PlayerSelectModal';
import { makeTestPlayer } from '../../domain/testHelpers';

const players = ['Alice', 'Bob', 'Cara', 'Dan'].map((name) => makeTestPlayer({ id: name, name }));

const renderModal = () => {
  const onConfirm = vi.fn();
  const onClose = vi.fn();
  const view = render(
    <PlayerSelectModal
      isOpen
      onClose={onClose}
      players={players}
      activePlayerIds={new Set()}
      manualQueuedIds={new Set()}
      systemQueuedIds={new Set()}
      onConfirm={onConfirm}
    />,
  );
  return { ...view, onConfirm, onClose };
};

describe('PlayerSelectModal', () => {
  it('keeps the confirm button disabled until exactly 4 players are picked', async () => {
    const user = userEvent.setup();
    const { onConfirm } = renderModal();

    await user.click(screen.getByText('Alice'));
    expect(screen.getByRole('button', { name: '建立分組' })).toBeDisabled();

    for (const name of ['Bob', 'Cara', 'Dan']) {
      await user.click(screen.getByText(name));
    }
    await user.click(screen.getByRole('button', { name: '建立分組' }));

    expect(onConfirm).toHaveBeenCalledWith(['Alice', 'Bob', 'Cara', 'Dan']);
  });

  it('throws the half-finished selection away when the dialog is cancelled', async () => {
    const user = userEvent.setup();
    const { rerender, onClose } = renderModal();

    await user.click(screen.getByText('Alice'));
    expect(screen.getByText('請再選擇 3 位選手')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '取消' }));
    expect(onClose).toHaveBeenCalled();

    // The modal stays mounted while hidden; reopening must start from scratch.
    rerender(
      <PlayerSelectModal
        isOpen={false}
        onClose={onClose}
        players={players}
        activePlayerIds={new Set()}
        manualQueuedIds={new Set()}
        systemQueuedIds={new Set()}
        onConfirm={vi.fn()}
      />,
    );
    rerender(
      <PlayerSelectModal
        isOpen
        onClose={onClose}
        players={players}
        activePlayerIds={new Set()}
        manualQueuedIds={new Set()}
        systemQueuedIds={new Set()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.queryByText(/請再選擇/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '建立分組' })).toBeDisabled();
  });
});
