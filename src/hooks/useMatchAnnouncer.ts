import { useCallback, useEffect, useState } from 'react';
import { buildMatchAnnouncementSegments } from '../domain';
import type { Match } from '../domain';
import { cancelSpeech, speak } from '../lib/speech';
import { useCopy } from './useCopy';

/**
 * Announces a match's players out loud (spoken twice, matching the original
 * app) whenever `isSoundEnabled` is on, phrased in the active theme's style.
 * Automatically stops any in-flight speech when the component unmounts.
 */
export const useMatchAnnouncer = () => {
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const { announcement } = useCopy();

  useEffect(() => {
    return () => cancelSpeech();
  }, []);

  const announceMatch = useCallback(
    (match: Match) => {
      if (!isSoundEnabled) return;
      const segments = buildMatchAnnouncementSegments(match, {
        intro: announcement.intro,
        versus: announcement.versus,
        outro: announcement.outro(match.courtId),
      });
      speak([...segments, ...segments]);
    },
    [isSoundEnabled, announcement],
  );

  const toggleSound = useCallback(() => setIsSoundEnabled((v) => !v), []);

  return { isSoundEnabled, toggleSound, announceMatch };
};
