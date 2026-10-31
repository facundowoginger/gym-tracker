// A "draft" is the workout in progress. It is saved after every change,
// so closing the app or locking the phone mid-workout loses nothing.
//
// draft: { startedAt, name, routineId, unit,
//          entries: [{ exerciseId, sets: [{ weight: '', reps: '', done: false }] }] }
// Weight and reps are kept as typed text (in draft.unit) until the workout is finished.

import { getLastSession } from './db'

export const blankSet = () => ({ weight: '', reps: '', done: false })

// A new exercise in the workout gets as many rows as last time, or 3 if it's new.
export async function makeEntry(exerciseId) {
  const last = await getLastSession(exerciseId)
  const count = last ? last.sets.length : 3
  return { exerciseId, sets: Array.from({ length: count }, blankSet) }
}

export async function newDraft({ routine = null, unit }) {
  const entries = routine ? await Promise.all(routine.exerciseIds.map(makeEntry)) : []
  return {
    startedAt: new Date().toISOString(),
    name: routine?.name ?? 'Workout',
    routineId: routine?.id ?? null,
    unit,
    entries,
  }
}
