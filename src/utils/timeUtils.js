const ET_TZ = 'America/New_York';

export function getETTime() {
  const now = new Date();
  const etStr = now.toLocaleString('en-US', { timeZone: ET_TZ });
  return new Date(etStr);
}

export function getETHoursMinutes() {
  const et = getETTime();
  return { hours: et.getHours(), minutes: et.getMinutes(), seconds: et.getSeconds() };
}

export function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export function formatETTime(date) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: ET_TZ,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

export function getSessionState(macroWindows, sessionEnd) {
  const { hours, minutes, seconds } = getETHoursMinutes();
  const currentMinutes = hours * 60 + minutes;
  const currentSeconds = currentMinutes * 60 + seconds;

  const sessionEndMinutes = timeToMinutes(sessionEnd);

  if (currentMinutes >= sessionEndMinutes) {
    return { sessionState: 'complete', activeMacroWindow: null, timeUntilNext: 0, sessionComplete: true };
  }

  for (const w of macroWindows) {
    const startMin = timeToMinutes(w.start);
    const endMin = timeToMinutes(w.end);

    if (currentMinutes >= startMin && currentMinutes < endMin) {
      const remainingSeconds = (endMin * 60) - currentSeconds;
      return {
        sessionState: `macro_${w.id}`,
        activeMacroWindow: w.id,
        timeUntilNext: remainingSeconds,
        sessionComplete: false,
      };
    }
  }

  // Pre-session
  const firstStart = timeToMinutes(macroWindows[0].start);
  const untilOpen = (firstStart * 60) - currentSeconds;
  return {
    sessionState: 'pre_session',
    activeMacroWindow: null,
    timeUntilNext: Math.max(0, untilOpen),
    sessionComplete: false,
  };
}

export function formatCountdown(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
