import { useState, useEffect } from 'react';
import { formatETTime, getSessionState } from '../utils/timeUtils';

export function useSessionClock(playbook) {
  const [state, setState] = useState({
    currentTime: formatETTime(new Date()),
    sessionState: 'pre_session',
    activeMacroWindow: null,
    timeUntilNext: 0,
    sessionComplete: false,
  });

  useEffect(() => {
    if (!playbook) return;

    const update = () => {
      const now = new Date();
      const session = getSessionState(playbook.macro_windows, playbook.session.end);
      setState({
        currentTime: formatETTime(now),
        ...session,
      });
    };

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [playbook]);

  return state;
}
