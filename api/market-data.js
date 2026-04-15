// Vercel serverless function — proxies Yahoo Finance for NQ=F data
// Fetches daily bars + intraday 15m data to compute session-specific levels
// No API key needed.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300');

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json',
  };

  try {
    // Fetch daily and intraday data in parallel
    const [dailyRes, intradayRes] = await Promise.all([
      fetch('https://query1.finance.yahoo.com/v8/finance/chart/NQ=F?interval=1d&range=5d&includePrePost=true', { headers }),
      fetch('https://query1.finance.yahoo.com/v8/finance/chart/NQ=F?interval=15m&range=5d&includePrePost=true', { headers }),
    ]);

    if (!dailyRes.ok) {
      return res.status(502).json({ error: 'Yahoo Finance daily fetch failed', status: dailyRes.status });
    }

    // Parse daily data
    const dailyRaw = await dailyRes.json();
    const dailyResult = dailyRaw?.chart?.result?.[0];
    if (!dailyResult) {
      return res.status(404).json({ error: 'No daily data returned for NQ=F' });
    }

    const timestamps = dailyResult.timestamp || [];
    const quotes = dailyResult.indicators?.quote?.[0] || {};
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

    // Parse intraday data for session levels
    let levels = null;
    if (intradayRes.ok) {
      const intradayRaw = await intradayRes.json();
      const intradayResult = intradayRaw?.chart?.result?.[0];
      if (intradayResult) {
        levels = computeSessionLevels(intradayResult);
      }
    }

    return res.status(200).json({
      prev_day: prev,
      prior_day_close_position: prior_day_close_position
        ? parseFloat(prior_day_close_position.toFixed(3))
        : null,
      bars,
      levels,
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

function computeSessionLevels(result) {
  const timestamps = result.timestamp || [];
  const quotes = result.indicators?.quote?.[0] || {};

  // Build intraday bars with ET hour info
  const bars = timestamps.map((ts, i) => {
    const d = new Date(ts * 1000);
    const etStr = d.toLocaleString('en-US', { timeZone: 'America/New_York' });
    const et = new Date(etStr);
    return {
      ts,
      date: d.toISOString().split('T')[0],
      etHour: et.getHours(),
      etMinute: et.getMinutes(),
      etDate: `${et.getFullYear()}-${String(et.getMonth() + 1).padStart(2, '0')}-${String(et.getDate()).padStart(2, '0')}`,
      high: quotes.high?.[i],
      low: quotes.low?.[i],
      open: quotes.open?.[i],
      close: quotes.close?.[i],
    };
  }).filter(b => b.high != null && b.low != null);

  if (bars.length === 0) return null;

  // Find today's date in ET
  const nowET = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const todayET = `${nowET.getFullYear()}-${String(nowET.getMonth() + 1).padStart(2, '0')}-${String(nowET.getDate()).padStart(2, '0')}`;

  // Get unique dates, sorted
  const dates = [...new Set(bars.map(b => b.etDate))].sort();
  const prevDate = dates.includes(todayET)
    ? dates[dates.indexOf(todayET) - 1]
    : dates[dates.length - 1];

  // Previous regular session: 9:30-16:00 ET on prevDate
  const prevSession = bars.filter(b =>
    b.etDate === prevDate &&
    ((b.etHour === 9 && b.etMinute >= 30) || (b.etHour >= 10 && b.etHour < 16))
  );

  // Asia session: 18:00-02:00 ET (previous evening into early morning)
  // This spans from prevDate 18:00 to todayET 02:00
  const asia = bars.filter(b =>
    (b.etDate === prevDate && b.etHour >= 18) ||
    (b.etDate === todayET && b.etHour < 2)
  );

  // London session: 02:00-09:30 ET on todayET (London open ~2-3am ET)
  const london = bars.filter(b =>
    b.etDate === todayET &&
    (b.etHour >= 2 && (b.etHour < 9 || (b.etHour === 9 && b.etMinute < 30)))
  );

  // Overnight: 18:00 prevDate to 09:30 todayET (combines Asia + London + gap)
  const overnight = bars.filter(b =>
    (b.etDate === prevDate && b.etHour >= 18) ||
    (b.etDate === todayET && (b.etHour < 9 || (b.etHour === 9 && b.etMinute < 30)))
  );

  // Previous 1H: last completed 1-hour bar of previous session (15:00-16:00)
  const prev1H = bars.filter(b =>
    b.etDate === prevDate && b.etHour === 15
  );

  const hlOf = (arr) => {
    if (arr.length === 0) return null;
    return {
      high: Math.max(...arr.map(b => b.high)),
      low: Math.min(...arr.map(b => b.low)),
    };
  };

  const prevDayHL = hlOf(prevSession);
  const asiaHL = hlOf(asia);
  const londonHL = hlOf(london);
  const overnightHL = hlOf(overnight);
  const prev1HHL = hlOf(prev1H);

  return {
    prev_day_high: prevDayHL?.high ?? null,
    prev_day_low: prevDayHL?.low ?? null,
    asia_high: asiaHL?.high ?? null,
    asia_low: asiaHL?.low ?? null,
    london_high: londonHL?.high ?? null,
    london_low: londonHL?.low ?? null,
    overnight_high: overnightHL?.high ?? null,
    overnight_low: overnightHL?.low ?? null,
    prev_1h_high: prev1HHL?.high ?? null,
    prev_1h_low: prev1HHL?.low ?? null,
  };
}
