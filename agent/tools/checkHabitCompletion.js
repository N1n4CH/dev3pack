/**
 * check_habit_completion
 *
 * Mock wearable data source. Returns whether the user completed
 * their daily fitness goal. Replace the mock function body with a
 * real Health Connect / Google Fit / Apple HealthKit API call.
 */

/** Goal-type mapping mirrors the on-chain enum. */
const GOAL_DEFAULTS = {
  0: { label: 'steps', goal: 10000 },
  1: { label: 'workout_minutes', goal: 30 },
  2: { label: 'cycling_km', goal: 15 },
  3: { label: 'custom', goal: 1 },
};

/** Simple deterministic hash for mock reproducibility. */
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Queries a mock wearable API for a given wallet's daily fitness data.
 *
 * @param {string}  walletAddress - The user's Solana wallet address
 * @param {number}  goalType      - 0=steps, 1=workout, 2=cycling, 3=custom
 * @param {number}  dailyTarget   - The on-chain daily_target value
 * @returns {Promise<{completed: boolean, value: number, goal: number}>}
 */
export async function checkHabitCompletion(walletAddress, goalType, dailyTarget) {
  // ─── Mock implementation ──────────────────────────────────────
  // Simulate a ~75% success rate for testing.
  // Replace this block with a real Health Connect REST call:
  //
  //   const res = await fetch(`https://healthconnect.api/v1/daily/${walletAddress}`, {
  //     headers: { Authorization: `Bearer ${process.env.HEALTH_API_KEY}` },
  //   });
  //   const data = await res.json();
  //   return { completed: data.value >= dailyTarget, value: data.value, goal: dailyTarget };
  //

  const defaults = GOAL_DEFAULTS[goalType] ?? GOAL_DEFAULTS[3];
  const goal = dailyTarget || defaults.goal;

  const today = new Date().toISOString().slice(0, 10);
  const seed = hashCode(`${walletAddress}:${today}`);
  const successRate = 0.75;
  const passed = (seed % 100) / 100 < successRate;

  const value = passed
    ? goal + Math.floor(Math.abs(seed % (goal * 0.3)))
    : Math.floor(goal * (0.3 + (Math.abs(seed) % 50) / 100));

  console.log(
    `  [wearable] ${defaults.label} for ${walletAddress.slice(0, 8)}...: ` +
    `${value}/${goal} -> ${passed ? 'completed' : 'incomplete'}`,
  );

  return { completed: passed, value, goal };
}
