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
        setData({
          prev_day_open: prev?.open ?? null,
          prev_day_high: prev?.high ?? null,
          prev_day_low: prev?.low ?? null,
          prev_day_close: prev?.close ?? null,
          prior_day_close_position: json.prior_day_close_position ?? null,
          overnight_high_approx: prev?.high ?? null,
          overnight_low_approx: prev?.low ?? null,
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
