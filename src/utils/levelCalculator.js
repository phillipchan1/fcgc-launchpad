export function getSweepProbability(distance, sweepProbByDistance) {
  if (!sweepProbByDistance) return null;
  if (distance <= 25) return sweepProbByDistance['0-25'];
  if (distance <= 50) return sweepProbByDistance['25-50'];
  if (distance <= 75) return sweepProbByDistance['50-75'];
  if (distance <= 100) return sweepProbByDistance['75-100'];
  if (distance <= 150) return sweepProbByDistance['100-150'];
  return sweepProbByDistance['150+'] ?? 0;
}

export function calculateLevelStatus(levelPrice, openPrice, levelConfig) {
  const distance = Math.abs(levelPrice - openPrice);
  const disabled = distance > levelConfig.disabled_threshold_pts;

  const sweep_probability = levelConfig.sweep_prob_by_distance
    ? getSweepProbability(distance, levelConfig.sweep_prob_by_distance)
    : levelConfig.sweep_prob_c1 ?? null;

  let badge = 'WATCH';
  if (disabled) badge = 'TOO FAR';
  else if (distance <= 25) badge = 'PRIME';
  else if (distance <= 50) badge = 'ACTIVE';

  return { distance: Math.round(distance * 100) / 100, sweep_probability, badge, disabled };
}

export function detectConfluenceZones(levels, threshold = 50) {
  // levels: array of { id, price, config }
  const withPrices = levels.filter(l => l.price != null);
  if (withPrices.length < 2) return [];

  const sorted = [...withPrices].sort((a, b) => a.price - b.price);
  const zones = [];

  for (let i = 0; i < sorted.length; i++) {
    const cluster = [sorted[i]];
    for (let j = i + 1; j < sorted.length; j++) {
      if (sorted[j].price - sorted[i].price <= threshold) {
        cluster.push(sorted[j]);
      } else {
        break;
      }
    }
    if (cluster.length >= 2) {
      const prices = cluster.map(l => l.price);
      const zone = {
        levels: cluster.map(l => l.id),
        labels: cluster.map(l => l.label),
        count: cluster.length,
        low: Math.min(...prices),
        high: Math.max(...prices),
      };
      // Avoid duplicate zones (check if we already have a zone with same levels)
      const key = zone.levels.sort().join(',');
      if (!zones.find(z => z.levels.sort().join(',') === key)) {
        zones.push(zone);
      }
    }
  }

  // Keep only the largest zone for overlapping level sets
  const filtered = [];
  for (const zone of zones) {
    const isSupersetOf = filtered.some(z =>
      zone.levels.every(l => z.levels.includes(l))
    );
    if (!isSupersetOf) {
      // Remove any existing zone that's a subset of this one
      const remaining = filtered.filter(z =>
        !z.levels.every(l => zone.levels.includes(l))
      );
      remaining.push(zone);
      filtered.length = 0;
      filtered.push(...remaining);
    }
  }

  return filtered;
}

export function getConfluenceSweepRate(count, confluenceBonus) {
  if (!confluenceBonus?.thresholds) return null;
  const match = confluenceBonus.thresholds.find(t => t.count === count);
  if (match) return match.sweep_rate;
  const max = confluenceBonus.thresholds[confluenceBonus.thresholds.length - 1];
  return count >= max.count ? max.sweep_rate : null;
}
