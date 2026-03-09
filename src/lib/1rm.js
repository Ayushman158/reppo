// ─────────────────────────────────────────────────────────────
// REPPO — 1RM Engine
// All the AI logic lives here. Pure functions, fully testable.
// ─────────────────────────────────────────────────────────────

/**
 * Epley formula: estimated 1RM from a working set.
 * Most widely validated for sub-maximal reps (2–10).
 *
 * @param {number} weight  - Weight lifted in kg
 * @param {number} reps    - Reps performed
 * @returns {number}       - Estimated 1RM in kg
 */
export function epley(weight, reps) {
  if (reps === 1) return weight
  if (reps <= 0 || weight <= 0) return 0
  return weight * (1 + reps / 30)
}

/**
 * Round to nearest barbell plate increment (2.5kg default).
 */
export function roundToPlate(value, increment = 2.5) {
  return Math.round(value / increment) * increment
}

/**
 * Calculate rolling weighted 1RM from up to 4 recent sessions.
 * Weights: most recent = 40%, then 30%, 20%, 10%.
 *
 * @param {Array<{weight: number, reps: number}>} recentSets
 *   Sorted most-recent first. Takes best set per session.
 * @returns {number} Weighted rolling 1RM estimate
 */
export function rollingOneRM(recentSets) {
  if (!recentSets || recentSets.length === 0) return 0

  const weights = [0.4, 0.3, 0.2, 0.1]
  const capped   = recentSets.slice(0, 4)

  let total = 0
  let weightSum = 0

  capped.forEach((set, i) => {
    const est = epley(set.weight, set.reps)
    total     += est * weights[i]
    weightSum += weights[i]
  })

  return total / weightSum
}

/**
 * Detect trend direction across recent 1RM values.
 *
 * @param {number[]} recentRMs  - Array of 1RM values, most recent last
 * @returns {'rising' | 'flat' | 'declining'}
 */
export function detectTrend(recentRMs) {
  if (!recentRMs || recentRMs.length < 2) return 'flat'
  const first = recentRMs[0]
  const last  = recentRMs[recentRMs.length - 1]
  const delta = ((last - first) / first) * 100

  if (delta > 1.5)  return 'rising'
  if (delta < -1.5) return 'declining'
  return 'flat'
}

/**
 * Check if an exercise is in a plateau.
 * A plateau = estimated 1RM changed by less than 1% across last 4 sessions.
 *
 * @param {number[]} last4RMs - Four most recent rolling 1RM values
 * @returns {boolean}
 */
export function isPlateaued(last4RMs) {
  if (!last4RMs || last4RMs.length < 4) return false
  const min   = Math.min(...last4RMs)
  const max   = Math.max(...last4RMs)
  const delta = ((max - min) / min) * 100
  return delta < 1.0
}

/**
 * Generate today's session target range for one exercise.
 *
 * @param {object} params
 * @param {number}  params.oneRM          - Current rolling estimated 1RM
 * @param {number}  params.targetRepMin   - Lower end of target rep range (from program)
 * @param {number}  params.targetRepMax   - Upper end of target rep range (from program)
 * @param {'rising'|'flat'|'declining'} params.trend
 * @param {boolean} params.isDeloadWeek   - Whether this is a deload week
 * @param {boolean} params.isFirstSession - True if no history yet
 * @returns {{ weightLow: number, weightHigh: number, repLow: number, repHigh: number }}
 */
export function generateTarget({
  oneRM,
  targetRepMin = 6,
  targetRepMax = 8,
  trend        = 'flat',
  isDeloadWeek = false,
  isFirstSession = false,
}) {
  if (!oneRM || oneRM <= 0) return null

  let pctLow, pctHigh, repLow, repHigh

  if (isDeloadWeek) {
    pctLow  = 0.55
    pctHigh = 0.60
    repLow  = targetRepMax
    repHigh = targetRepMax + 4
  } else if (isFirstSession) {
    pctLow  = 0.63
    pctHigh = 0.67
    repLow  = Math.round((targetRepMin + targetRepMax) / 2)
    repHigh = repLow + 1
  } else if (trend === 'rising') {
    pctLow  = 0.70
    pctHigh = 0.75
    repLow  = targetRepMin + 1
    repHigh = targetRepMax
  } else if (trend === 'declining') {
    pctLow  = 0.65
    pctHigh = 0.70
    repLow  = targetRepMin
    repHigh = targetRepMin + 1
  } else {
    // flat — standard working set
    pctLow  = 0.72
    pctHigh = 0.77
    repLow  = targetRepMin
    repHigh = targetRepMax
  }

  return {
    weightLow:  roundToPlate(oneRM * pctLow),
    weightHigh: roundToPlate(oneRM * pctHigh),
    repLow,
    repHigh,
  }
}

/**
 * Format a target range as a human-readable string.
 * e.g. "87.5–90kg × 6–8 reps"
 */
export function formatTarget(target) {
  if (!target) return '—'
  const { weightLow, weightHigh, repLow, repHigh } = target
  const weightStr = weightLow === weightHigh
    ? `${weightLow}kg`
    : `${weightLow}–${weightHigh}kg`
  const repStr = repLow === repHigh
    ? `${repLow} reps`
    : `${repLow}–${repHigh} reps`
  return `${weightStr} × ${repStr}`
}

/**
 * Quick utility: format 1RM to clean display value.
 * e.g. 104.7 → "105kg"
 */
export function formatRM(value) {
  if (!value) return '—'
  return `${Math.round(value)}kg`
}
