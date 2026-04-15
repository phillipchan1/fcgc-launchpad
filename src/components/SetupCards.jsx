import { useMemo } from 'react';
import { evaluateCombos } from '../utils/decisionEngine';

const TIER_STYLES = {
  A: 'text-cyan border-cyan/40 bg-cyan/10',
  B: 'text-text-dim border-text-dim/30 bg-text-dim/10',
};

const DIR_STYLES = {
  short: 'text-red bg-red/10',
  long: 'text-green bg-green/10',
};

export default function SetupCards({ playbook, inputs, activeMacroWindow, onSignalFired }) {
  const combos = playbook?.high_probability_combos || [];

  const evaluated = useMemo(
    () => evaluateCombos(combos, inputs, activeMacroWindow),
    [combos, inputs, activeMacroWindow]
  );

  if (!inputs) {
    return (
      <div className="bg-surface border border-border rounded-lg p-4">
        <h2 className="text-xs font-semibold text-text-dim uppercase tracking-wider mb-3">Active Setups</h2>
        <p className="text-xs text-text-dim">Lock in pre-market inputs to see setups.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <h2 className="text-xs font-semibold text-text-dim uppercase tracking-wider mb-3">Active Setups</h2>

      {evaluated.length === 0 ? (
        <p className="text-xs text-text-dim">
          No high-conviction setups for today's conditions. Trade baseline FVGC only.
        </p>
      ) : (
        <div className="space-y-3">
          {evaluated.map(combo => (
            <div
              key={combo.id}
              className={`p-3 rounded border transition-all ${
                combo.status === 'active'
                  ? 'border-cyan/30 bg-cyan/5'
                  : 'border-border opacity-60'
              }`}
            >
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${TIER_STYLES[combo.tier]}`}>
                  {combo.tier}
                </span>
                <span className="text-xs font-semibold text-text">{combo.label}</span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${DIR_STYLES[combo.direction]}`}>
                  {combo.direction.toUpperCase()}
                </span>
                {combo.status === 'watch' && (
                  <span className="text-[10px] text-text-dim bg-text-dim/10 px-1.5 py-0.5 rounded">WATCH</span>
                )}
              </div>

              <div className="flex items-center gap-3 mb-2 text-[10px]">
                <span className="text-cyan font-mono">{combo.wr_estimate}</span>
                <span className="text-text-dim">
                  {combo.conditions_met}/{combo.conditions_total} conditions met
                </span>
              </div>

              <div className="space-y-0.5 mb-2">
                {combo.conditions.map((c, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[10px]">
                    <span className={combo.condition_results[i] ? 'text-green' : 'text-text-dim'}>
                      {combo.condition_results[i] ? '✓' : '○'}
                    </span>
                    <span className={combo.condition_results[i] ? 'text-text' : 'text-text-dim'}>
                      {c.key} {c.op} {JSON.stringify(c.value)}
                    </span>
                  </div>
                ))}
              </div>

              {combo.note && (
                <p className="text-[10px] text-text-dim mb-2">{combo.note}</p>
              )}

              {combo.status === 'active' && (
                <button
                  onClick={() => onSignalFired(combo)}
                  className="text-xs font-bold text-cyan hover:text-white transition-colors min-h-[44px] px-3"
                >
                  SIGNAL FIRED →
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
