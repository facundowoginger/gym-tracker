// Progress calculations. Everything here is a plain function of saved data,
// so nothing extra needs to be stored.

// Estimated 1-rep max (Epley formula): weight × (1 + reps / 30).
// One rep counts as the weight itself.
export function estimate1RM(weight, reps) {
  if (!weight || !reps) return 0
  return reps === 1 ? weight : weight * (1 + reps / 30)
}

// Numbers for one session of one exercise.
// For bodyweight exercises the weight is the extra load, so reps matter most.
export function sessionStats(sets) {
  let heaviest = 0
  let best1RM = 0
  let volume = 0
  let totalReps = 0
  let maxReps = 0
  for (const { reps, weight } of sets) {
    heaviest = Math.max(heaviest, weight)
    best1RM = Math.max(best1RM, estimate1RM(weight, reps))
    volume += reps * weight
    totalReps += reps
    maxReps = Math.max(maxReps, reps)
  }
  return { sets: sets.length, heaviest, best1RM, volume, totalReps, maxReps }
}

// Monday-based week key, e.g. "2026-10-26", for grouping sessions by week.
export function weekStart(isoDate) {
  const d = new Date(isoDate)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d.toLocaleDateString('en-CA') // YYYY-MM-DD in local time
}

// Groups an exercise's history (from getExerciseHistory) into weeks, oldest first.
// Each week keeps its sessions plus the best numbers across them.
export function weeklyHistory(history) {
  const weeks = new Map()
  for (const session of history) {
    const key = weekStart(session.date)
    if (!weeks.has(key)) weeks.set(key, { week: key, sessions: [] })
    weeks.get(key).sessions.push({ ...session, stats: sessionStats(session.sets) })
  }
  return [...weeks.values()].map((w) => ({
    ...w,
    heaviest: Math.max(...w.sessions.map((s) => s.stats.heaviest)),
    best1RM: Math.max(...w.sessions.map((s) => s.stats.best1RM)),
    volume: w.sessions.reduce((sum, s) => sum + s.stats.volume, 0),
    maxReps: Math.max(...w.sessions.map((s) => s.stats.maxReps)),
  }))
}

// All-time bests for an exercise, and which session set each one.
export function personalRecords(history) {
  const records = {
    heaviest: { value: 0, date: null },
    best1RM: { value: 0, date: null },
    volume: { value: 0, date: null },
    maxReps: { value: 0, date: null },
  }
  for (const session of history) {
    const stats = sessionStats(session.sets)
    for (const key of Object.keys(records)) {
      if (stats[key] > records[key].value) records[key] = { value: stats[key], date: session.date }
    }
  }
  return records
}

// One pass over all workouts: per exercise, its sessions (oldest first) with stats.
// Used by the Exercises and Progress lists so they don't query each exercise separately.
export function summarizeByExercise(workouts) {
  const map = {}
  for (const w of workouts) {
    for (const e of w.entries) {
      map[e.exerciseId] ??= { sessions: [] }
      map[e.exerciseId].sessions.push({ date: w.date, stats: sessionStats(e.sets) })
    }
  }
  for (const s of Object.values(map)) {
    s.sessions.sort((a, b) => a.date.localeCompare(b.date))
    s.lastDate = s.sessions.at(-1).date
    s.heaviest = Math.max(...s.sessions.map((x) => x.stats.heaviest))
    s.maxReps = Math.max(...s.sessions.map((x) => x.stats.maxReps))
  }
  return map
}

// Sets done per muscle group in the week starting on weekKey.
export function muscleSetsForWeek(workouts, exercisesById, weekKey) {
  const counts = {}
  for (const w of workouts) {
    if (weekStart(w.date) !== weekKey) continue
    for (const e of w.entries) {
      const group = exercisesById[e.exerciseId]?.muscleGroup ?? 'Other'
      counts[group] = (counts[group] ?? 0) + e.sets.length
    }
  }
  return counts
}

// Which records a just-finished session broke, compared to the history before it.
// Returns e.g. ['heaviest', 'best1RM'], so the app can celebrate them.
export function newRecords(previousHistory, sets) {
  if (previousHistory.length === 0) return []
  const before = personalRecords(previousHistory)
  const now = sessionStats(sets)
  return Object.keys(before).filter((key) => now[key] > before[key].value)
}
