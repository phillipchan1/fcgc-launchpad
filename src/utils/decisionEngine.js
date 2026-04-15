function evaluateCondition(condition, inputs, activeMacroWindow) {
  const { key, op, value } = condition;

  let actual;
  if (key === 'active_macro_window') {
    actual = activeMacroWindow;
  } else if (key === 'fvg_created_in_opening_window') {
    actual = inputs.fvgCreatedInOpeningWindow ?? false;
  } else if (key === 'prior_day_close_position') {
    actual = inputs.priorDayClosePosition;
  } else if (key === 'overnight_range_bucket') {
    actual = inputs.overnightRangeBucket;
  } else if (key === 'vix_regime') {
    actual = inputs.vixRegime;
  } else {
    actual = inputs[key];
  }

  if (actual === undefined || actual === null) return false;

  switch (op) {
    case '==': return actual === value;
    case '!=': return actual !== value;
    case '<':  return actual < value;
    case '>':  return actual > value;
    case '<=': return actual <= value;
    case '>=': return actual >= value;
    case 'in': return Array.isArray(value) && value.includes(actual);
    default:   return false;
  }
}

export function evaluateCombos(combos, inputs, activeMacroWindow) {
  if (!combos || !inputs) return [];

  return combos.map(combo => {
    const results = combo.conditions.map(c => evaluateCondition(c, inputs, activeMacroWindow));
    const metCount = results.filter(Boolean).length;
    const total = combo.conditions.length;
    const ratio = total > 0 ? metCount / total : 0;

    let status;
    if (metCount === total) status = 'active';
    else if (ratio >= 0.5) status = 'watch';
    else status = 'inactive';

    return {
      ...combo,
      status,
      conditions_met: metCount,
      conditions_total: total,
      condition_results: results,
    };
  })
  .filter(c => c.status !== 'inactive')
  .sort((a, b) => {
    // Active before watch
    if (a.status !== b.status) return a.status === 'active' ? -1 : 1;
    // A-tier before B-tier
    if (a.tier !== b.tier) return a.tier === 'A' ? -1 : 1;
    return 0;
  });
}

export function evaluateBoost(boost, inputs) {
  const { condition_key, condition_op, condition_value } = boost;
  return evaluateCondition(
    { key: condition_key, op: condition_op, value: condition_value },
    inputs,
    null
  );
}
