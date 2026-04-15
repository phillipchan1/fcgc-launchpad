import { useState, useMemo, useEffect } from 'react';
import { calculateLevelStatus, detectConfluenceZones, getConfluenceSweepRate } from '../utils/levelCalculator';

const BADGE_STYLES = {
  PRIME: 'text-cyan bg-cyan/15 border-cyan/30',
  ACTIVE: 'text-green bg-green/15 border-green/30',
  WATCH: 'text-text-dim bg-text-dim/10 border-text-dim/20',
  'TOO FAR': 'text-disabled bg-disabled/10 border-disabled/20',
};

const TIER_LABELS = { 1: 'T1', 2: 'T2', 3: 'T3' };

export default function LevelGrid({ playbook, inputs, marketData }) {
  const levels = playbook?.liquidity_levels || [];
  const confluenceBonus = playbook?.confluence_bonus;

  const [prices, setPrices] = useState({});
  const [autoFilled, setAutoFilled] = useState(false);

  // Auto-fill prices from market data once
  useEffect(() => {
    if (autoFilled || !marketData?.levelPrices) return;
    const lp = marketData.levelPrices;
    const filled = {};
    for (const level of levels) {
      if (lp[level.id] != null) {
        filled[level.id] = String(lp[level.id]);
      }
    }
    if (Object.keys(filled).length > 0) {
      setPrices(p => ({ ...filled, ...p }));
      setAutoFilled(true);
    }
  }, [marketData, levels, autoFilled]);

  const setPrice = (id, val) => {
    setPrices(p => ({ ...p, [id]: val }));
  };

  const openPrice = inputs?.expectedOpen;

  const levelStatuses = useMemo(() => {
    if (!openPrice) return {};
    const result = {};
    for (const level of levels) {
      const price = parseFloat(prices[level.id]);
      if (isNaN(price)) continue;
      result[level.id] = calculateLevelStatus(price, openPrice, level);
    }
    return result;
  }, [levels, prices, openPrice]);

  const confluenceZones = useMemo(() => {
    const levelsWithPrices = levels
      .filter(l => prices[l.id] && !isNaN(parseFloat(prices[l.id])))
      .map(l => ({ id: l.id, label: l.label, price: parseFloat(prices[l.id]), config: l }));
    return detectConfluenceZones(levelsWithPrices, confluenceBonus?.cluster_threshold_pts ?? 50);
  }, [levels, prices, confluenceBonus]);

  if (!inputs) {
    return (
      <div className="bg-surface border border-border rounded-lg p-4">
        <h2 className="text-xs font-semibold text-text-dim uppercase tracking-wider mb-3">Liquidity Levels</h2>
        <p className="text-xs text-text-dim">Lock in pre-market inputs to activate level grid.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <h2 className="text-xs font-semibold text-text-dim uppercase tracking-wider mb-3">Liquidity Levels</h2>

      <div className="space-y-2">
        {levels.map(level => {
          const status = levelStatuses[level.id];
          const hasPrice = prices[level.id] !== undefined && prices[level.id] !== '';
          const isDisabled = status?.disabled;

          return (
            <div
              key={level.id}
              className={`flex items-center gap-2 p-2 rounded border ${
                isDisabled ? 'opacity-40 border-border' : 'border-border'
              }`}
            >
              <span className="text-[10px] font-mono text-text-dim w-6">{TIER_LABELS[level.tier]}</span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${level.side === 'high' ? 'text-red' : 'text-green'}`}>
                    {level.label}
                  </span>
                  {level.note && (
                    <span className="text-[10px] text-text-dim truncate">{level.note}</span>
                  )}
                </div>
              </div>

              <div className="relative">
                <input
                  type="number"
                  step="0.25"
                  placeholder="Price"
                  value={prices[level.id] ?? ''}
                  onChange={e => setPrice(level.id, e.target.value)}
                  className="w-24 bg-bg border border-border rounded px-2 py-1.5 text-xs font-mono text-text focus:border-cyan focus:outline-none min-h-[36px]"
                />
                {marketData?.levelPrices?.[level.id] != null && prices[level.id] === String(marketData.levelPrices[level.id]) && (
                  <span className="absolute -top-1.5 right-1 text-[8px] text-cyan bg-surface px-0.5">auto</span>
                )}
              </div>

              {status && (
                <>
                  <span className="font-mono text-[10px] text-text-dim w-14 text-right">
                    {status.distance.toFixed(1)}pt
                  </span>

                  {status.sweep_probability != null && !isDisabled && (
                    <span className="font-mono text-xs text-cyan w-12 text-right">
                      {status.sweep_probability.toFixed(0)}%
                    </span>
                  )}

                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${BADGE_STYLES[status.badge]}`}>
                    {status.badge}
                  </span>
                </>
              )}

              {!hasPrice && (
                <span className="text-[10px] text-text-dim w-32 text-right">Enter price</span>
              )}
            </div>
          );
        })}
      </div>

      {confluenceZones.length > 0 && (
        <div className="mt-4 space-y-2">
          {confluenceZones.map((zone, i) => {
            const sweepRate = getConfluenceSweepRate(zone.count, confluenceBonus);
            return (
              <div key={i} className="p-3 rounded border border-cyan/30 bg-cyan/5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-cyan">SUPER MAGNET</span>
                  <span className="text-[10px] text-text-dim">{zone.count} levels clustered</span>
                  {sweepRate != null && (
                    <span className="font-mono text-xs text-cyan">{sweepRate}% sweep rate</span>
                  )}
                </div>
                <div className="text-[10px] text-text-dim">
                  {zone.labels.join(' + ')} — Zone: {zone.low.toFixed(2)}–{zone.high.toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
