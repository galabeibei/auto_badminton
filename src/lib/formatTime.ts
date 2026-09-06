/** Formats a duration given in (possibly fractional) minutes as "Xhh分Yhh秒" / "Yhh秒". */
export const formatDurationMinutes = (minutes: number): string => {
  const totalSeconds = Math.floor(minutes * 60);
  const min = Math.floor(totalSeconds / 60);
  const sec = totalSeconds % 60;
  return min > 0 ? `${min}分${sec}秒` : `${sec}秒`;
};
