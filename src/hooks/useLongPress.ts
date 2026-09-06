import { useCallback, useRef } from 'react';

export interface LongPressHandlers {
  onMouseDown: () => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
  onTouchStart: () => void;
  onTouchEnd: () => void;
  onClick: () => void;
}

export interface UseLongPressOptions {
  onLongPress: () => void;
  onClick?: () => void;
  /** How long (ms) the press must be held before it counts as a long press. */
  delay?: number;
}

const DEFAULT_DELAY_MS = 500;

/**
 * Distinguishes a tap/click from a press-and-hold on the same element, for
 * both mouse and touch. A held press that reaches `delay` fires
 * `onLongPress` and suppresses the click that would otherwise follow it
 * (browsers synthesize a `click` after a touch or mouse up); a press
 * released early fires `onClick` instead, so short-click behaviour is
 * unaffected.
 */
export const useLongPress = ({
  onLongPress,
  onClick,
  delay = DEFAULT_DELAY_MS,
}: UseLongPressOptions): LongPressHandlers => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedLongPressRef = useRef(false);

  const start = useCallback(() => {
    firedLongPressRef.current = false;
    timeoutRef.current = setTimeout(() => {
      firedLongPressRef.current = true;
      onLongPress();
    }, delay);
  }, [onLongPress, delay]);

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const handleClick = useCallback(() => {
    if (!firedLongPressRef.current) {
      onClick?.();
    }
  }, [onClick]);

  return {
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear,
    onTouchStart: start,
    onTouchEnd: clear,
    onClick: handleClick,
  };
};
