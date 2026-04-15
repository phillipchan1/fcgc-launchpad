import { useState, useEffect, useMemo } from 'react';

function getVixRegime(vix, regimes) {
  if (!vix || !regimes) return null;
  for (const [key, r] of Object.entries(regimes)) {
    const aboveMin = r.min === undefined || vix >= r.min;
    const belowMax = r.max === undefined || vix < r.max;
    if (aboveMin && belowMax) return { key, ...r };
  }
  return null;
}

function getOvernightBucket(range, buckets) {
  if (range == null || !buckets) return null;
  for (const [key, b] of Object.entries(buckets)) {
    const aboveMin = b.min === undefined || range >= b.min;
    const belowMax = b.max === undefined || range < b.max;
    if (aboveMin && belowMax) return { key, ...b };
  }
  return null;
}

function getGapDirection(open, prevClose) {
  if (open == null || prevClose == null) return null;
  const diff = open - prevClose;
  if (Math.abs(diff) < 5) return 'FLAT';
  return diff > 0 ? 'GAP UP' : 'GAP DOWN';
}

const REGIME_COLORS = {
  low: 'text-green bg-green/10',
  normal: 'text-cyan bg-cyan/10',
  elevated: 'text-yellow-400 bg-yellow-400/10',
  high: 'text-red bg-red/10',
};

const BUCKET_COLORS = {
  tight: 'text-green bg-green/10',
  normal: 'text-cyan bg-cyan/10',
  wide: 'text-yellow-400 bg-yellow-400/10',
  extreme: 'text-red bg-red/10',
};

export default function PreMarketPanel({ playbook, marketData, onConfirm }) {
  const filters = playbook?.contextual_filters;

  const [fields, setFields] = useState({
    expectedOpen: '',
    overnightHigh: '',
    overnightLow: '',
    priorDayClosePosition: 0.5,
    vixAtOpen: '',
    fomcWeek: false,
    redFolderNews: false,
  });
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (marketData) {
      setFields(f => ({
        ...f,
        expectedOpen: marketData.prev_day_close ?? f.expectedOpen,
        overnightHigh: marketData.overnight_high_approx ?? f.overnightHigh,
        overnightLow: marketData.overnight_low_approx ?? f.overnightLow,
        priorDayClosePosition: marketData.prior_day_close_position ?? f.priorDayClosePosition,
      }));
    }
  }, [marketData]);

  const overnightRange = useMemo(() => {
    const h = parseFloat(fields.overnightHigh);
    const l = parseFloat(fields.overnightLow);
    if (isNaN(h) || isNaN(l)) return null;
    return Math.abs(h - l);
  }, [fields.overnightHigh, fields.overnightLow]);

  const vixRegime = useMemo(
    () => getVixRegime(parseFloat(fields.vixAtOpen), filters?.vix_regimes),
    [fields.vixAtOpen, filters]
  );

  const overnightBucket = useMemo(
    () => getOvernightBucket(overnightRange, filters?.overnight_range_buckets),
    [overnightRange, filters]
  );

  const gapDirection = useMemo(
    () => getGapDirection(parseFloat(fields.expectedOpen), marketData?.prev_day_close),
    [fields.expectedOpen, marketData]
  );

  const canLock = fields.expectedOpen !== '' && fields.overnightHigh !== '' &&
    fields.overnightLow !== '' && fields.vixAtOpen !== '';

  const handleLock = () => {
    if (!canLock) return;
    setLocked(true);
    onConfirm({
      expectedOpen: parseFloat(fields.expectedOpen),
      overnightHigh: parseFloat(fields.overnightHigh),
      overnightLow: parseFloat(fields.overnightLow),
      priorDayClosePosition: parseFloat(fields.priorDayClosePosition),
      vixAtOpen: parseFloat(fields.vixAtOpen),
      vixRegime: vixRegime?.key ?? null,
      overnightRange,
      overnightRangeBucket: overnightBucket?.key ?? null,
      gapDirection,
      fomcWeek: fields.fomcWeek,
      redFolderNews: fields.redFolderNews,
    });
  };

  const set = (key) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFields(f => ({ ...f, [key]: val }));
  };

  const numInput = (label, key, extra) => (
    <div className="space-y-1">
      <label className="flex items-center justify-between text-xs text-text-dim">
        <span>{label}</span>
        {extra}
      </label>
      {locked ? (
        <div className="font-mono text-sm text-text">{fields[key]}</div>
      ) : (
        <input
          type="number"
          step="0.25"
          value={fields[key]}
          onChange={set(key)}
          className="w-full bg-bg border border-border rounded px-3 py-2 text-sm font-mono text-text focus:border-cyan focus:outline-none min-h-[44px]"
        />
      )}
    </div>
  );

  return (
    <div className="bg-surface border border-border rounded-lg p-4 space-y-4">
      <h2 className="text-xs font-semibold text-text-dim uppercase tracking-wider">Pre-Market Inputs</h2>

      {numInput('Expected Open', 'expectedOpen',
        gapDirection && (
          <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${gapDirection === 'GAP UP' ? 'text-green bg-green/10' : gapDirection === 'GAP DOWN' ? 'text-red bg-red/10' : 'text-text-dim bg-text-dim/10'}`}>
            {gapDirection}
          </span>
        )
      )}

      {numInput('Overnight High', 'overnightHigh')}
      {numInput('Overnight Low', 'overnightLow')}

      <div className="space-y-1">
        <label className="flex items-center justify-between text-xs text-text-dim">
          <span>Prior Day Close Position</span>
          <span className="font-mono">{parseFloat(fields.priorDayClosePosition).toFixed(2)}</span>
        </label>
        {locked ? (
          <div className="font-mono text-sm text-text">{parseFloat(fields.priorDayClosePosition).toFixed(2)}</div>
        ) : (
          <>
            <input
              type="range"
              min="0" max="1" step="0.01"
              value={fields.priorDayClosePosition}
              onChange={set('priorDayClosePosition')}
              className="w-full min-h-[44px]"
            />
            <div className="flex justify-between text-[10px] text-text-dim">
              <span>Near Lows (0–0.25)</span>
              <span>Mid</span>
              <span>Near Highs (0.75–1.0)</span>
            </div>
          </>
        )}
      </div>

      {numInput('VIX at Open', 'vixAtOpen',
        vixRegime && (
          <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${REGIME_COLORS[vixRegime.key] || 'text-text-dim'}`}>
            {vixRegime.label}
          </span>
        )
      )}

      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-text-dim">
          <span>Overnight Range</span>
          <div className="flex items-center gap-2">
            {overnightRange != null && (
              <span className="font-mono text-text">{overnightRange.toFixed(1)} pts</span>
            )}
            {overnightBucket && (
              <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${BUCKET_COLORS[overnightBucket.key] || 'text-text-dim'}`}>
                {overnightBucket.key.toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </div>

      {!locked && (
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-xs text-text-dim cursor-pointer min-h-[44px]">
            <input type="checkbox" checked={fields.fomcWeek} onChange={set('fomcWeek')}
              className="w-4 h-4 rounded border-border bg-bg accent-cyan" />
            FOMC Week?
          </label>
          <label className="flex items-center gap-2 text-xs text-text-dim cursor-pointer min-h-[44px]">
            <input type="checkbox" checked={fields.redFolderNews} onChange={set('redFolderNews')}
              className="w-4 h-4 rounded border-border bg-bg accent-cyan" />
            Red Folder News?
          </label>
        </div>
      )}

      {locked && (
        <div className="flex gap-4 text-xs text-text-dim">
          {fields.fomcWeek && <span className="text-yellow-400">FOMC WEEK</span>}
          {fields.redFolderNews && <span className="text-red">RED FOLDER</span>}
        </div>
      )}

      {locked ? (
        <button
          onClick={() => setLocked(false)}
          className="w-full py-2.5 text-xs font-semibold text-text-dim border border-border rounded hover:border-text-dim transition-colors min-h-[44px]"
        >
          EDIT
        </button>
      ) : (
        <button
          onClick={handleLock}
          disabled={!canLock}
          className={`w-full py-2.5 text-xs font-bold rounded transition-colors min-h-[44px] ${
            canLock
              ? 'bg-cyan text-bg hover:bg-cyan/90 cursor-pointer'
              : 'bg-border text-disabled cursor-not-allowed'
          }`}
        >
          LOCK IN & BUILD PLAYBOOK
        </button>
      )}
    </div>
  );
}
