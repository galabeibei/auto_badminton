import { useRef } from 'react';

/**
 * Guards a `useEffect` body against React 18 Strict Mode's development-only
 * "mount -> simulate cleanup -> remount" double-invoke.
 *
 * That double-invoke re-runs the effect body synchronously, before any state
 * dispatched during the first run has been processed into a new render - so
 * an effect that reads state and dispatches an *append* of freshly generated
 * data (new matches with fresh ids, in this app's case) will duplicate that
 * data, since both invocations see the exact same "before" state.
 *
 * Call the returned function once at the top of the effect body with every
 * value the effect's decision depends on. It returns true only when every
 * value is reference-identical to the previous invocation's - which can only
 * happen via that synthetic double-invoke (a real state change always
 * produces at least one new reference), so it's safe to bail out early.
 */
export const useStrictModeInvokeGuard = () => {
  const lastDepsRef = useRef<unknown[] | null>(null);

  return (deps: unknown[]): boolean => {
    const isDuplicateInvoke =
      lastDepsRef.current !== null &&
      deps.length === lastDepsRef.current.length &&
      deps.every((d, i) => d === lastDepsRef.current![i]);
    lastDepsRef.current = deps;
    return isDuplicateInvoke;
  };
};
