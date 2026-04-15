import { useState } from 'react';

const VARIANT_LABELS = {
  no_fvg: 'NoFVG',
  ifvg: 'IFVG',
  bos: 'BOS',
  protected_swing: 'Protected Swing',
};

export default function FVGCChecklist({ setup, playbook, onClose }) {
  const checklist = playbook?.fvgc_signal_checklist;
  const checks = checklist?.pre_entry_checks || [];
  const variants = checklist?.entry_variants || [];

  const [checked, setChecked] = useState(new Array(checks.length).fill(false));
  const [variant, setVariant] = useState(null);
  const [tradeTaken, setTradeTaken] = useState(false);
  const [tradeTime, setTradeTime] = useState(null);

  const allChecked = checked.every(Boolean);

  const toggleCheck = (i) => {
    setChecked(c => {
      const next = [...c];
      next[i] = !next[i];
      return next;
    });
  };

  const handleTakeTrade = () => {
    const now = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
    setTradeTime(now);
    setTradeTaken(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div className="bg-surface border border-border rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-text">{setup?.label || 'FVGC Signal'}</h3>
            <span className="text-[10px] text-text-dim">FVGC v{checklist?.model_version}</span>
          </div>
          <button onClick={onClose} className="text-text-dim hover:text-text text-lg min-w-[44px] min-h-[44px] flex items-center justify-center">✕</button>
        </div>

        <div className="space-y-2 mb-4">
          <h4 className="text-xs font-semibold text-text-dim uppercase">Pre-Entry Checks</h4>
          {checks.map((check, i) => (
            <label key={i} className="flex items-start gap-3 cursor-pointer min-h-[44px] py-1">
              <input
                type="checkbox"
                checked={checked[i]}
                onChange={() => toggleCheck(i)}
                className="w-4 h-4 mt-0.5 rounded border-border bg-bg accent-cyan flex-shrink-0"
              />
              <span className={`text-xs ${checked[i] ? 'text-green' : 'text-text'}`}>
                {check}
              </span>
            </label>
          ))}
        </div>

        <div className="mb-4">
          <h4 className="text-xs font-semibold text-text-dim uppercase mb-2">Entry Variant</h4>
          <div className="flex flex-wrap gap-2">
            {variants.map(v => (
              <button
                key={v}
                onClick={() => setVariant(v)}
                className={`text-xs px-3 py-1.5 rounded border min-h-[36px] transition-colors ${
                  variant === v
                    ? 'border-cyan text-cyan bg-cyan/10'
                    : 'border-border text-text-dim hover:border-text-dim'
                }`}
              >
                {VARIANT_LABELS[v] || v}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1 mb-4 p-3 bg-bg rounded border border-border">
          <div className="flex justify-between text-[10px]">
            <span className="text-text-dim">Stop Placement</span>
            <span className="text-text font-mono">{checklist?.stop_placement}</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-text-dim">R:R Ratio</span>
            <span className="text-text font-mono">{checklist?.rr_ratio}:1</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-text-dim">Max Signal Window</span>
            <span className="text-text font-mono">{checklist?.max_signal_window}</span>
          </div>
        </div>

        {tradeTaken ? (
          <div className="p-3 rounded bg-green/10 border border-green/30 text-center">
            <p className="text-xs font-bold text-green">TRADE TAKEN</p>
            <p className="text-[10px] text-text-dim font-mono mt-1">{tradeTime}</p>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleTakeTrade}
              disabled={!allChecked}
              className={`flex-1 py-3 text-xs font-bold rounded transition-colors min-h-[44px] ${
                allChecked
                  ? 'bg-green text-bg hover:bg-green/90 cursor-pointer'
                  : 'bg-border text-disabled cursor-not-allowed'
              }`}
            >
              ALL CHECKS CLEAR — TAKE TRADE
            </button>
            <button
              onClick={onClose}
              className="px-4 py-3 text-xs font-semibold text-text-dim border border-border rounded hover:border-text-dim transition-colors min-h-[44px]"
            >
              SKIP
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
