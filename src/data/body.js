// Body weight goals, weigh-in feedback, and body measurement parts.
// All weights are in kg here; screens convert for display.

export const BODY_PARTS = [
  { key: 'chest', label: 'Chest' },
  { key: 'rightArm', label: 'Right arm' },
  { key: 'leftArm', label: 'Left arm' },
  { key: 'aboveNavel', label: '2" above navel' },
  { key: 'stomach', label: 'Stomach' },
  { key: 'belowNavel', label: '2" below navel' },
  { key: 'hips', label: 'Hips' },
  { key: 'rightThigh', label: 'Right thigh' },
  { key: 'leftThigh', label: 'Left thigh' },
  { key: 'leftCalf', label: 'Left calf' },
  { key: 'rightCalf', label: 'Right calf' },
]

export const WEEKDAY_NAMES = ['Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays', 'Sundays']
export const WEEKDAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Staying within this much of the target counts as "on track" for a Maintain goal (about 2 lbs).
export const MAINTAIN_RANGE_KG = 0.907

export const todayKey = () => new Date().toLocaleDateString('en-CA') // YYYY-MM-DD, local
export const weekdayIndex = (date = new Date()) => (date.getDay() + 6) % 7 // Monday = 0
export const dateFromKey = (key) => new Date(`${key}T12:00:00`)

// Is today one of the chosen weigh-in days, with no weigh-in logged yet?
export function isWeighInDue(goal, weights, dismissedOn) {
  if (!goal?.days?.length) return false
  const today = todayKey()
  if (dismissedOn === today) return false
  if (weights.some((w) => w.date === today)) return false
  return goal.days.includes(weekdayIndex())
}

// How far along a Lose / Gain goal is, from where it started (0 to 1), and how much is left.
export function goalProgress(goal, currentKg) {
  if (!goal || goal.type === 'maintain' || currentKg == null) return null
  const start = goal.startKg ?? currentKg
  const dir = goal.type === 'lose' ? -1 : 1
  const total = (goal.targetKg - start) * dir
  const done = (currentKg - start) * dir
  const toGo = Math.max(0, (goal.targetKg - currentKg) * dir)
  const fraction = total > 0 ? Math.min(1, Math.max(0, done / total)) : toGo === 0 ? 1 : 0
  return { fraction, toGo }
}

// Is this change in weight a move toward the goal? (Used to color changes amber.)
export function isTowardGoal(goal, diffKg) {
  if (!goal || diffKg === 0) return null
  if (goal.type === 'lose') return diffKg < 0
  if (goal.type === 'gain') return diffKg > 0
  return null
}

// What to tell the user after they log a weigh-in.
// kind: 'none' (first weigh-in), 'logged' (no goal), 'closer', 'away', 'steady', 'reached'
export function weightFeedback(prevKg, newKg, goal) {
  if (prevKg == null) return { kind: 'none' }
  const diff = newKg - prevKg
  if (!goal) return { kind: 'logged', diff }
  const target = goal.targetKg
  if (goal.type === 'maintain') {
    return Math.abs(newKg - target) <= MAINTAIN_RANGE_KG ? { kind: 'steady', diff } : { kind: 'away', diff }
  }
  const dir = goal.type === 'lose' ? -1 : 1
  const reached = (kg) => (dir < 0 ? kg <= target : kg >= target)
  if (reached(newKg) && !reached(prevKg)) return { kind: 'reached', diff }
  const toGo = Math.max(0, (target - newKg) * dir)
  if (Math.abs(diff) < 0.01) return { kind: 'steady', diff, toGo }
  if (diff * dir > 0) return { kind: 'closer', diff, toGo }
  return { kind: 'away', diff, toGo }
}

const pick = (list) => list[Math.floor(Math.random() * list.length)]

// Friendly wording for a feedback result. fmt turns kg into e.g. "0.8 lbs".
export function feedbackMessage(fb, fmt, goal) {
  const amount = fb.diff == null ? '' : fmt(Math.abs(fb.diff))
  switch (fb.kind) {
    case 'closer':
      return {
        emoji: '💪',
        title: `${amount} closer to your goal`,
        sub:
          fb.toGo > 0
            ? `Only ${fmt(fb.toGo)} to go. ${pick(['Keep it up!', 'Nice work!', "That's progress!"])}`
            : "You're past your goal. Amazing!",
      }
    case 'away':
      return {
        emoji: '🔥',
        title: `${fb.diff > 0 ? 'Up' : 'Down'} ${amount}. Let's go!`,
        sub: pick([
          "One weigh-in doesn't define you. Next one's yours.",
          'Stay consistent. The trend is what counts.',
          'Every week is a new chance. Keep going!',
        ]),
      }
    case 'steady':
      return goal?.type === 'maintain'
        ? { emoji: '💪', title: 'Holding steady', sub: 'Right where you want to be.' }
        : { emoji: '💪', title: 'Same as last time', sub: "Steady is still progress. Let's go!" }
    case 'logged':
      return {
        emoji: '✅',
        title: `Logged · ${fb.diff === 0 ? 'no change' : `${fb.diff > 0 ? '▲' : '▼'} ${amount}`}`,
        sub: 'Set a goal to see how close you are.',
      }
    default:
      return { emoji: '✅', title: 'Weight logged', sub: 'Your first weigh-in. Nice start!' }
  }
}
