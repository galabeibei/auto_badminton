import { useCallback, useEffect, useRef } from 'react';

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
 * How long a "swallow the next click" flag stays armed after a long press.
 * Long enough to cover the click a browser synthesizes after the press ends
 * (it arrives within milliseconds of the release, however long the press was
 * held), short enough that a browser which synthesizes nothing doesn't leave
 * the flag armed and eat the user's next real tap.
 */
const CLICK_SUPPRESS_WINDOW_MS = 1500;

/**
 * Distinguishes a tap/click from a press-and-hold on the same element, for
 * both mouse and touch. A held press that reaches `delay` fires
 * `onLongPress` and suppresses the click that would otherwise follow it
 * (browsers synthesize a `click` after a touch or mouse up); a press
 * released early fires `onClick` instead, so short-click behaviour is
 * unaffected.
 *
 * The suppression flag is deliberately *not* cleared when a new press
 * starts: on a touch device the browser replays a whole emulated mouse
 * sequence (mousedown, mouseup, click) after `touchend`, so clearing it on
 * mousedown would let that emulated click through - which, mid-swap, would
 * silently swap two players behind the action sheet the long press had just
 * opened.
 */
export const useLongPress = ({
  onLongPress,
  onClick,
  delay = DEFAULT_DELAY_MS,
}: UseLongPressOptions): LongPressHandlers => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressWindowRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressNextClickRef = useRef(false);

  const disarmSuppression = useCallback(() => {
    suppressNextClickRef.current = false;
    if (suppressWindowRef.current) {
      clearTimeout(suppressWindowRef.current);
      suppressWindowRef.current = null;
    }
  }, []);

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    clear();
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      suppressNextClickRef.current = true;
      suppressWindowRef.current = setTimeout(disarmSuppression, CLICK_SUPPRESS_WINDOW_MS);
      onLongPress();
    }, delay);
  }, [clear, disarmSuppression, onLongPress, delay]);

  const handleClick = useCallback(() => {
    if (suppressNextClickRef.current) {
      disarmSuppression();
      return;
    }
    onClick?.();
  }, [disarmSuppression, onClick]);

  // A press held while the card unmounts (a match sent to a court, say) must
  // not fire its long press into a component that is no longer there.
  useEffect(
    () => () => {
      clear();
      disarmSuppression();
    },
    [clear, disarmSuppression],
  );

  return {
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear,
    onTouchStart: start,
    onTouchEnd: clear,
    onClick: handleClick,
  };
};
