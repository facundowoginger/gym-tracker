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

// Weight record: did these sets lift more than ever before on this exercise?
// Only weight counts (an extra rep at the same weight is not a record), and an
// exercise's first session is never a record. Returns { prev, now, gain } in kg, or null.
export function weightRecord(previousHistory, sets) {
  if (!previousHistory?.length || !sets.length) return null
  const prev = Math.max(...previousHistory.map((s) => sessionStats(s.sets).heaviest))
  const now = Math.max(...sets.map((s) => s.weight))
  return now > prev + 0.01 ? { prev, now, gain: now - prev } : null
}

// ---------- Workout labels ----------

const PUSH = new Set(['Chest', 'Tricep', 'Shoulders'])
const PULL = new Set(['Back', 'Bicep', 'Shoulders'])

// Name for a workout started empty, from the muscle groups it trained.
// Core is ignored, so adding abs never changes the label.
export function workoutLabel(entries, exercisesById) {
  const groups = [
    ...new Set(entries.map((e) => exercisesById[e.exerciseId]?.muscleGroup).filter((g) => g && g !== 'Core')),
  ]
  if (groups.length === 0) return 'Workout'
  if (groups.length === 1 && groups[0] === 'Shoulders') return 'Workout'
  if (groups.every((g) => g === 'Legs')) return 'Leg workout'
  if (groups.every((g) => PUSH.has(g))) return 'Push workout'
  if (groups.every((g) => PULL.has(g))) return 'Pull workout'
  if (groups.every((g) => PUSH.has(g) || PULL.has(g))) return 'Upper workout'
  return 'Workout'
}

// ---------- Days, weeks and streaks ----------

const dayKey = (date) => new Date(date).toLocaleDateString('en-CA') // YYYY-MM-DD, local time

// The day a workout counts for: when it started (older workouts only have a finish time).
export const workoutDay = (w) => dayKey(w.startedAt ?? w.date)

// Recent list: every workout from the last 2 weeks, or the last 3 if there are none.
// `workouts` must be newest first.
export function recentWorkouts(workouts, now = new Date()) {
  const cutoff = new Date(now)
  cutoff.setDate(cutoff.getDate() - 14)
  const within = workouts.filter((w) => new Date(w.startedAt ?? w.date) >= cutoff)
  return within.length ? within : workouts.slice(0, 3)
}

// The 7 days of the current week (Monday first), each with the workouts done that day.
export function currentWeekDays(workouts, now = new Date()) {
  const start = new Date(`${weekStart(now.toISOString())}T12:00:00`)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const key = dayKey(d)
    return { key, date: d, isToday: key === dayKey(now), workouts: workouts.filter((w) => workoutDay(w) === key) }
  })
}

// Workouts this week, and how many weeks in a row the weekly goal was reached.
// The current week only adds to the streak once its goal is met; it never breaks it.
export function weeklyStreak(workouts, goal, now = new Date()) {
  const counts = new Map()
  for (const w of workouts) {
    const k = weekStart(w.startedAt ?? w.date)
    counts.set(k, (counts.get(k) ?? 0) + 1)
  }
  const thisWeek = weekStart(now.toISOString())
  const thisCount = counts.get(thisWeek) ?? 0
  if (!goal) return { thisCount, streak: 0 }
  let streak = thisCount >= goal ? 1 : 0
  const d = new Date(`${thisWeek}T12:00:00`)
  for (;;) {
    d.setDate(d.getDate() - 7)
    if ((counts.get(dayKey(d)) ?? 0) >= goal) streak++
    else break
  }
  return { thisCount, streak }
}
