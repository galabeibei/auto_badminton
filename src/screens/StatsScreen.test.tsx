import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StatsScreen } from './StatsScreen';
import { renderWithAppState } from '../test/renderWithAppState';
import { initialAppState, Stage } from '../state/appState';
import { makeTestPlayer } from '../domain/testHelpers';
import { Gender } from '../domain';

const state = {
  ...initialAppState,
  stage: Stage.STATS,
  players: [
    makeTestPlayer({ id: 'p1', name: 'Alice', gender: Gender.FEMALE, mmr: 1240 }),
    makeTestPlayer({ id: 'p2', name: 'Bob', mmr: 1180 }),
  ],
};

const stubClipboard = (impl: () => Promise<void>) => {
  const writeText = vi.fn(impl);
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  return writeText;
};

afterEach(() => {
  Reflect.deleteProperty(navigator, 'clipboard');
  vi.restoreAllMocks();
});

describe('StatsScreen 簡易複製', () => {
  it('copies the roster and reports success', async () => {
    const user = userEvent.setup();
    const writeText = stubClipboard(() => Promise.resolve());
    renderWithAppState(<StatsScreen />, state);

    await user.click(screen.getByRole('button', { name: /簡易複製/ }));

    expect(writeText).toHaveBeenCalledWith('Alice, 女, 1240\nBob, 男, 1180');
    expect(await screen.findByText('複製成功')).toBeInTheDocument();
  });

  it('offers the data for manual copying instead of claiming success when the browser refuses', async () => {
    const user = userEvent.setup();
    stubClipboard(() => Promise.reject(new Error('denied')));
    renderWithAppState(<StatsScreen />, state);

    await user.click(screen.getByRole('button', { name: /簡易複製/ }));

    expect(await screen.findByText('無法自動複製')).toBeInTheDocument();
    expect(screen.queryByText('複製成功')).not.toBeInTheDocument();
    expect(screen.getByLabelText('選手資料')).toHaveValue('Alice, 女, 1240\nBob, 男, 1180');
  });

  it('survives a browser with no clipboard API at all', async () => {
    const user = userEvent.setup();
    // userEvent installs its own clipboard stub on setup; drop it to stand in
    // for a browser that exposes no Clipboard API (any non-secure origin).
    Reflect.deleteProperty(navigator, 'clipboard');
    renderWithAppState(<StatsScreen />, state);

    await user.click(screen.getByRole('button', { name: /簡易複製/ }));

    expect(await screen.findByText('無法自動複製')).toBeInTheDocument();
  });
});
