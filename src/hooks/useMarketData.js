import { useState, useEffect } from 'react';

export function useMarketData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/market-data');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        const prev = json.prev_day;
        const levels = json.levels;

        setData({
          prev_day_open: prev?.open ?? null,
          prev_day_high: prev?.high ?? null,
          prev_day_low: prev?.low ?? null,
          prev_day_close: prev?.close ?? null,
          prior_day_close_position: json.prior_day_close_position ?? null,
          overnight_high_approx: levels?.overnight_high ?? prev?.high ?? null,
          overnight_low_approx: levels?.overnight_low ?? prev?.low ?? null,
          // Auto-fill level prices keyed by playbook level id
          levelPrices: levels ? {
            prev_day_high: levels.prev_day_high,
            prev_day_low: levels.prev_day_low,
            london_high: levels.london_high,
            london_low: levels.london_low,
            asia_high: levels.asia_high,
            asia_low: levels.asia_low,
            overnight_high: levels.overnight_high,
            overnight_low: levels.overnight_low,
            prev_1h_high: levels.prev_1h_high,
            prev_1h_low: levels.prev_1h_low,
            // 1m swing highs/lows are subjective — must be entered manually
          } : null,
        });
      } catch (err) {
        setError(err.message);
        setData(null);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return { data, loading, error };
}
