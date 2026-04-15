import { formatCountdown } from '../utils/timeUtils';

const STATE_LABELS = {
  pre_session: { text: 'PRE-SESSION', color: 'text-text-dim', bg: 'bg-text-dim/10' },
  macro_1: { text: 'LIVE M1', color: 'text-cyan', bg: 'bg-cyan/10', pulse: true },
  macro_2: { text: 'LIVE M2', color: 'text-cyan', bg: 'bg-cyan/10', pulse: true },
  macro_3: { text: 'LIVE M3', color: 'text-cyan', bg: 'bg-cyan/10', pulse: true },
  complete: { text: 'SESSION COMPLETE', color: 'text-text-dim', bg: 'bg-text-dim/10' },
};

export default function Header({ currentTime, sessionState, timeUntilNext }) {
  const label = STATE_LABELS[sessionState] || STATE_LABELS.pre_session;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 md:px-6 bg-bg border-b border-border">
      <div className="font-mono font-bold text-sm tracking-widest text-text">
        NQ PLAYBOOK
      </div>

      <div className="font-mono text-2xl text-cyan tabular-nums">
        {currentTime}
      </div>

      <div className="flex items-center gap-3">
        {sessionState === 'pre_session' && timeUntilNext > 0 && (
          <span className="font-mono text-xs text-text-dim">
            Opens in {formatCountdown(timeUntilNext)}
          </span>
        )}
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold ${label.color} ${label.bg} ${label.pulse ? 'animate-badge-pulse' : ''}`}>
          {label.pulse && (
            <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-badge-pulse" />
          )}
          {label.text}
        </span>
      </div>
    </header>
  );
}
