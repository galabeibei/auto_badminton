/**
 * Fair ordering for players the fairness rules cannot separate.
 *
 * Every "who plays next" comparator ends in a tie sooner or later - most
 * obviously at the very start of a game, when nobody has played and nobody
 * has waited. Breaking that tie by MMR (as this app used to) quietly means
 * "the strongest play first and the weakest sit out", every time: with 10
 * players and 2 courts, the same two lowest-rated players were benched for
 * the opening session of every game.
 *
 * So ties are broken by a hash of the player's id instead - arbitrary, but
 * uncorrelated with how good they are, and stable within a render so lists
 * don't reshuffle under the user's finger. Passing a different `seed` (the
 * session being planned, say) reshuffles that arbitrary order, so being last
 * in line once doesn't mean being last in line all evening.
 */

/** FNV-1a, 32-bit: small, dependency-free, and stable across runs and platforms. */
const hashText = (text: string): number => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
};

/** A rating-neutral sort key for `playerId`, varying with `seed`. */
export const rotationKey = (playerId: string, seed: number): number => hashText(`${seed}:${playerId}`);

/** Comparator form of `rotationKey`, for use as the last step of a priority sort. */
export const byRotation =
  (seed: number) =>
  (aId: string, bId: string): number =>
    rotationKey(aId, seed) - rotationKey(bId, seed);
