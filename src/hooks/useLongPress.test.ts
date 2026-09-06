import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useLongPress } from './useLongPress';

describe('useLongPress', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fires onClick for a press released before the delay', () => {
    const onClick = vi.fn();
    const onLongPress = vi.fn();
    const { result } = renderHook(() => useLongPress({ onClick, onLongPress, delay: 500 }));

    act(() => {
      result.current.onMouseDown();
      vi.advanceTimersByTime(200);
      result.current.onMouseUp();
      result.current.onClick();
    });

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('fires onLongPress once the delay elapses while still held', () => {
    const onClick = vi.fn();
    const onLongPress = vi.fn();
    const { result } = renderHook(() => useLongPress({ onClick, onLongPress, delay: 500 }));

    act(() => {
      result.current.onMouseDown();
      vi.advanceTimersByTime(500);
    });

    expect(onLongPress).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('suppresses the synthetic click that follows a long press', () => {
    const onClick = vi.fn();
    const onLongPress = vi.fn();
    const { result } = renderHook(() => useLongPress({ onClick, onLongPress, delay: 500 }));

    act(() => {
      result.current.onMouseDown();
      vi.advanceTimersByTime(500);
      result.current.onMouseUp();
      result.current.onClick(); // browsers fire this after mouseup/touchend regardless
    });

    expect(onLongPress).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('cancels the pending long press if the pointer leaves before the delay', () => {
    const onClick = vi.fn();
    const onLongPress = vi.fn();
    const { result } = renderHook(() => useLongPress({ onClick, onLongPress, delay: 500 }));

    act(() => {
      result.current.onMouseDown();
      vi.advanceTimersByTime(200);
      result.current.onMouseLeave();
      vi.advanceTimersByTime(1000);
    });

    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('allows a fresh press-release cycle to fire onClick again after a completed long press', () => {
    const onClick = vi.fn();
    const onLongPress = vi.fn();
    const { result } = renderHook(() => useLongPress({ onClick, onLongPress, delay: 500 }));

    act(() => {
      result.current.onMouseDown();
      vi.advanceTimersByTime(500);
      result.current.onMouseUp();
      result.current.onClick();
    });

    act(() => {
      result.current.onMouseDown();
      vi.advanceTimersByTime(100);
      result.current.onMouseUp();
      result.current.onClick();
    });

    expect(onLongPress).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
