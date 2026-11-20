import type { Match } from './types';

/**
 * Drops every system-suggested match from the queue, keeping the admin's own
 * manual groupings.
 *
 * This is what "重新安排分組" does after player ratings were corrected on the
 * roster screen: the queued suggestions were computed from the *old* MMRs, so
 * once they're cleared the Assist/Auto engines immediately refill the queue
 * from scratch using the corrected ones. Matches already on court aren't part
 * of the queue and are therefore left alone to finish as they are.
 */
export const dropSystemMatches = (queue: Match[]): Match[] => queue.filter((m) => m.isManual);
