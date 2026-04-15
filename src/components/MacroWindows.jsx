import { useMemo } from 'react';
import { formatCountdown } from '../utils/timeUtils';
import { evaluateBoost } from '../utils/decisionEngine';

const DIRECTION_STYLES = {
  short: { label: 'SHORT BIAS', color: 'text-red' },
  long: { label: 'LONG BIAS', color: 'text-green' },
  neutral: { label: 'NEUTRAL', color: 'text-text-dim' },
};

export default function MacroWindows({ playbook, inputs, sessionState, activeMacroWindow, timeUntilNext }) {
  const windows = playbook?.macro_windows || [];

  return (
    <div className="space-y-3">
      <h2 className="text-xs font-semibold text-text-dim uppercase tracking-wider">Macro Windows</h2>
      {windows.map(w => (
        <MacroCard
          key={w.id}
          window={w}
          inputs={inputs}
          isActive={activeMacroWindow === w.id}
          isExpired={
            sessionState === 'complete' ||
            (activeMacroWindow != null && activeMacroWindow > w.id)
          }
          isUpcoming={activeMacroWindow == null || activeMacroWindow < w.id}
          timeRemaining={activeMacroWindow === w.id ? timeUntilNext : 0}
        />
      ))}
    </div>
  );
}

function MacroCard({ window: w, inputs, isActive, isExpired, isUpcoming, timeRemaining }) {
  const dir = DIRECTION_STYLES[w.direction_bias] || DIRECTION_STYLES.neutral;
  const totalDuration = 15 * 60; // 15 minutes in seconds
  const progress = isActive ? ((totalDuration - timeRemaining) / totalDuration) * 100 : 0;

  const matchingBoosts = useMemo(() => {
    if (!inputs || !w.contextual_boosts) return [];
    return w.contextual_boosts.filter(b => evaluateBoost(b, inputs));
  }, [w.contextual_boosts, inputs]);

  return (
    <div className={`bg-surface border rounded-lg p-3 transition-all ${
      isActive
        ? 'border-cyan animate-pulse-glow'
        : isExpired
          ? 'border-border opacity-40'
          : 'border-border'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold text-text">{w.label}</span>
          {isActive && (
            <span className="text-[10px] font-bold text-cyan bg-cyan/10 px-1.5 py-0.5 rounded animate-badge-pulse">
              TRADING NOW
            </span>
          )}
        </div>
        <span className="font-mono text-xs text-cyan">{w.base_wr}% WR</span>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <span className={`text-[10px] font-semibold ${dir.color}`}>{dir.label}</span>
        <span className="text-[10px] text-text-dim">n={w.sample_n}</span>
      </div>

      {isActive && (
        <div className="mb-2">
          <div className="flex justify-between text-[10px] text-text-dim mb-1">
            <span>Progress</span>
            <span className="font-mono">{formatCountdown(timeRemaining)} remaining</span>
          </div>
          <div className="h-1.5 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {matchingBoosts.length > 0 && !isExpired && (
        <div className="mt-2 space-y-1">
          {matchingBoosts.map((b, i) => (
            <div key={i} className="flex items-start gap-1.5 text-[10px]">
              <span className="text-cyan mt-0.5">+</span>
              <div>
                <span className="text-text">{b.label}</span>
                <span className="text-cyan ml-1">({b.wr_delta})</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
