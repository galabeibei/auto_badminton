import { useCallback, useEffect, useState } from 'react';
import { buildMatchAnnouncementSegments } from '../domain';
import type { Match } from '../domain';
import { cancelSpeech, speak } from '../lib/speech';

/**
 * Announces a match's players out loud (spoken twice, matching the original
 * app) whenever `isSoundEnabled` is on. Automatically stops any in-flight
 * speech when the component unmounts.
 */
export const useMatchAnnouncer = () => {
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);

  useEffect(() => {
    return () => cancelSpeech();
  }, []);

  const announceMatch = useCallback(
    (match: Match) => {
      if (!isSoundEnabled) return;
      const segments = buildMatchAnnouncementSegments(match);
      speak([...segments, ...segments]);
    },
    [isSoundEnabled],
  );

  const toggleSound = useCallback(() => setIsSoundEnabled((v) => !v), []);

  return { isSoundEnabled, toggleSound, announceMatch };
};
