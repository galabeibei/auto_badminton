import React, { useState } from 'react';
import { MMR_MAX, MMR_MIN, parseMmrInput } from '../../domain';

interface PlayerMmrInputProps {
  /** Only used to label the field for screen readers / tests. */
  playerName: string;
  /** The player's current rating - also what the field falls back to on cancel. */
  mmr: number;
  /** Called when the typed rating is valid and actually different from `mmr`. */
  onCommit: (mmr: number) => void;
  /** Called when the typed rating is a real but unusable value (out of range, not a number). */
  onInvalid: () => void;
}

/**
 * The roster list's rating cell: an editable field rather than plain text, so
 * an admin who realises mid-session that someone is stronger/weaker than their
 * score says can correct it on the spot.
 *
 * Commits on Enter or blur, cancels on Escape. While the user is typing, the
 * draft is kept locally (`draft !== null`) so a half-typed "9" never reaches
 * the matchmaker; a blank field is treated as "never mind" and silently
 * reverts, which keeps an accidental select-all-and-tab-away from nagging.
 */
export const PlayerMmrInput: React.FC<PlayerMmrInputProps> = ({ playerName, mmr, onCommit, onInvalid }) => {
  const [draft, setDraft] = useState<string | null>(null);

  const commit = () => {
    if (draft === null) return;
    setDraft(null);

    if (draft.trim() === '') return;

    const parsed = parseMmrInput(draft);
    if (parsed === null) {
      onInvalid();
      return;
    }
    if (parsed !== mmr) onCommit(parsed);
  };

  return (
    <input
      type="number"
      inputMode="numeric"
      aria-label={`${playerName} 的積分`}
      value={draft ?? String(mmr)}
      min={MMR_MIN}
      max={MMR_MAX}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          commit();
          e.currentTarget.blur();
        } else if (e.key === 'Escape') {
          setDraft(null);
          e.currentTarget.blur();
        }
      }}
      className="w-20 bg-white text-slate-700 font-mono text-sm border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
    />
  );
};
