import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '../../theme/ThemeProvider';
import { AppStateProvider } from '../../state/AppStateProvider';
import { HomeScreen } from '../../screens/HomeScreen';
import { ThemePicker } from './ThemePicker';

const renderPicker = () =>
  render(
    <ThemeProvider>
      <ThemePicker />
    </ThemeProvider>,
  );

describe('ThemePicker', () => {
  beforeEach(() => {
    window.localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  it('applies the saved theme on mount', () => {
    window.localStorage.setItem('badminton-matchmaker:theme', 'fairy');
    renderPicker();
    expect(document.documentElement.dataset.theme).toBe('fairy');
    expect(screen.getByRole('button', { name: /目前：夢幻童話風/ })).toBeInTheDocument();
  });

  it('lists every theme and applies + remembers the one picked', async () => {
    const user = userEvent.setup();
    renderPicker();
    expect(document.documentElement.dataset.theme).toBe('default');

    await user.click(screen.getByRole('button', { name: /主題選擇/ }));
    const options = screen.getAllByRole('radio');
    expect(options.map((o) => o.getAttribute('aria-label'))).toEqual([
      '經典預設',
      '打官司風',
      '吃吃喝喝風',
      '名偵探風',
      '希臘神話風',
      '科技風',
      '保險業務風',
      '旅遊風',
      '麻將大師風',
      '夢幻童話風',
      '廢材風',
    ]);
    expect(screen.getByRole('radio', { name: '經典預設' })).toHaveAttribute('aria-checked', 'true');

    await user.click(screen.getByRole('radio', { name: '保險業務風' }));

    // One click applies the theme and closes the gallery.
    expect(document.documentElement.dataset.theme).toBe('insurance');
    expect(window.localStorage.getItem('badminton-matchmaker:theme')).toBe('insurance');
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /主題選擇/ }));
    expect(screen.getByRole('radio', { name: '保險業務風' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByRole('radio', { name: '經典預設' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });

  it('closes the gallery with the close button', async () => {
    const user = userEvent.setup();
    renderPicker();
    await user.click(screen.getByRole('button', { name: /主題選擇/ }));
    await user.click(screen.getByRole('button', { name: '關閉' }));
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
  });

  it('re-words the app when the theme changes', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <AppStateProvider>
          <ThemePicker />
          <HomeScreen />
        </AppStateProvider>
      </ThemeProvider>,
    );
    expect(screen.getByRole('button', { name: /打球啦/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /主題選擇/ }));
    await user.click(screen.getByRole('radio', { name: '夢幻童話風' }));
    expect(screen.getByRole('button', { name: /推開城堡大門/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /主題選擇/ }));
    await user.click(screen.getByRole('radio', { name: '保險業務風' }));
    expect(screen.getByRole('button', { name: /立即投保・開始打球/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /打球啦/ })).not.toBeInTheDocument();
  });
});
