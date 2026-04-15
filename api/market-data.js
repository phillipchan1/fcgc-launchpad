// Vercel serverless function — proxies Yahoo Finance for NQ=F data
// No API key needed. Deploy to Vercel and call from the frontend as /api/market-data

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300');

  try {
    const url = 'https://query1.finance.yahoo.com/v8/finance/chart/NQ=F?interval=1d&range=5d&includePrePost=true';

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      return res.status(502).json({ error: 'Yahoo Finance fetch failed', status: response.status });
    }

    const raw = await response.json();
    const result = raw?.chart?.result?.[0];

    if (!result) {
      return res.status(404).json({ error: 'No data returned for NQ=F' });
    }

    const timestamps = result.timestamp || [];
    const quotes = result.indicators?.quote?.[0] || {};
    const adjclose = result.indicators?.adjclose?.[0]?.adjclose || [];

    const bars = timestamps.map((ts, i) => ({
      date: new Date(ts * 1000).toISOString().split('T')[0],
      open: quotes.open?.[i],
      high: quotes.high?.[i],
      low: quotes.low?.[i],
      close: quotes.close?.[i],
      volume: quotes.volume?.[i],
    })).filter(b => b.close != null);

    const prev = bars[bars.length - 1];

    const prior_day_close_position = prev
      ? (prev.close - prev.low) / (prev.high - prev.low)
      : null;

    return res.status(200).json({
      prev_day: prev,
      prior_day_close_position: prior_day_close_position
        ? parseFloat(prior_day_close_position.toFixed(3))
        : null,
      bars,
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
