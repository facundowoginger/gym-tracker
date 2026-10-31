// All saving and loading goes through this file.
// Data lives in the browser's IndexedDB, so it stays on the phone and works offline.
//
// What gets stored:
//   exercises: { id, name, muscleGroup, bodyweight, createdAt }
//   routines:  { id, name, exerciseIds: [id, ...] }
//   workouts:  { id, date, name, routineId, exerciseIds: [...],
//                entries: [{ exerciseId, sets: [{ reps, weight }] }] }
//   settings:  { key, value }   e.g. { key: 'unit', value: 'kg' }
//
// Weights are always saved in kg and converted for display (see units.js),
// so switching between kg and lbs never changes your history.
// For bodyweight exercises, `weight` is the extra weight added (0 = none).

import { openDB } from 'idb'
import { STARTER_EXERCISES, STARTER_VERSION } from './starterExercises'

const DB_NAME = 'gym-tracker'
const DB_VERSION = 1

let dbPromise

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const exercises = db.createObjectStore('exercises', { keyPath: 'id' })
        exercises.createIndex('byName', 'nameKey', { unique: true })

        db.createObjectStore('routines', { keyPath: 'id' })

        const workouts = db.createObjectStore('workouts', { keyPath: 'id' })
        workouts.createIndex('byDate', 'date')
        // One workout can hold many exercises, so this index lets us find
        // every workout that contains a given exercise.
        workouts.createIndex('byExercise', 'exerciseIds', { multiEntry: true })

        db.createObjectStore('settings', { keyPath: 'key' })
      },
    }).then(async (db) => {
      await seedStarterExercises(db)
      return db
    })
  }
  return dbPromise
}

const newId = () => crypto.randomUUID()
const nameKey = (name) => name.trim().toLowerCase()

// Loads the starter list on first open, and applies changes when STARTER_VERSION goes up:
// new starter exercises are added, and existing ones get the list's muscle group.
// Exercises removed from the list are left alone (they may have history).
async function seedStarterExercises(db) {
  const versionRow = await db.get('settings', 'starterVersion')
  const legacySeeded = await db.get('settings', 'seeded') // installs from before versioning
  const installed = versionRow?.value ?? (legacySeeded ? 1 : 0)
  if (installed >= STARTER_VERSION) return

  const tx = db.transaction(['exercises', 'settings'], 'readwrite')
  const store = tx.objectStore('exercises')
  for (const ex of STARTER_EXERCISES) {
    const existing = await store.index('byName').get(nameKey(ex.name))
    if (!existing) {
      await store.put(makeExercise(ex))
    } else if (existing.muscleGroup !== ex.muscleGroup) {
      await store.put({ ...existing, muscleGroup: ex.muscleGroup })
    }
  }
  await tx.objectStore('settings').put({ key: 'starterVersion', value: STARTER_VERSION })
  await tx.done
}

function makeExercise({ name, muscleGroup, bodyweight = false }) {
  return {
    id: newId(),
    name: name.trim(),
    nameKey: nameKey(name),
    muscleGroup,
    bodyweight,
    createdAt: new Date().toISOString(),
  }
}

// ---------- Exercises ----------

export async function getExercises() {
  const db = await getDB()
  const all = await db.getAll('exercises')
  return all.sort((a, b) => a.name.localeCompare(b.name))
}

export async function getExercise(id) {
  return (await getDB()).get('exercises', id)
}

// Adds a new exercise, which starts its own empty history log.
// If an exercise with the same name already exists, that one is returned instead.
export async function addExercise({ name, muscleGroup, bodyweight }) {
  const db = await getDB()
  const existing = await db.getFromIndex('exercises', 'byName', nameKey(name))
  if (existing) return existing
  const exercise = makeExercise({ name, muscleGroup, bodyweight })
  await db.put('exercises', exercise)
  return exercise
}

export async function updateExercise(exercise) {
  const db = await getDB()
  await db.put('exercises', { ...exercise, nameKey: nameKey(exercise.name) })
}

// Only exercises with no logged history can be deleted, so progress is never lost.
export async function deleteExercise(id) {
  const db = await getDB()
  const used = await db.countFromIndex('workouts', 'byExercise', id)
  if (used > 0) throw new Error('This exercise has logged workouts and cannot be deleted.')
  await db.delete('exercises', id)
  // Also take it out of any routines that included it.
  for (const r of await db.getAll('routines')) {
    if (r.exerciseIds.includes(id)) {
      await db.put('routines', { ...r, exerciseIds: r.exerciseIds.filter((x) => x !== id) })
    }
  }
}

// ---------- Routines ----------

export async function getRoutines() {
  const all = await (await getDB()).getAll('routines')
  return all.sort((a, b) => a.name.localeCompare(b.name))
}

export async function saveRoutine({ id, name, exerciseIds }) {
  const routine = { id: id ?? newId(), name: name.trim(), exerciseIds }
  await (await getDB()).put('routines', routine)
  return routine
}

export async function deleteRoutine(id) {
  await (await getDB()).delete('routines', id)
}

// ---------- Workouts ----------

// entries: [{ exerciseId, sets: [{ reps, weight }] }]
export async function saveWorkout({ id, date, name = 'Workout', routineId = null, entries }) {
  const cleaned = entries
    .map((e) => ({
      exerciseId: e.exerciseId,
      sets: e.sets
        .filter((s) => Number(s.reps) > 0)
        .map((s) => ({ reps: Number(s.reps), weight: Number(s.weight) || 0 })),
    }))
    .filter((e) => e.sets.length > 0)

  const workout = {
    id: id ?? newId(),
    date: date ?? new Date().toISOString(),
    name,
    routineId,
    exerciseIds: cleaned.map((e) => e.exerciseId),
    entries: cleaned,
  }
  await (await getDB()).put('workouts', workout)
  return workout
}

export async function getWorkouts() {
  const all = await (await getDB()).getAllFromIndex('workouts', 'byDate')
  return all.reverse() // newest first
}

export async function deleteWorkout(id) {
  await (await getDB()).delete('workouts', id)
}

// Every past session of one exercise, oldest first:
// [{ workoutId, date, sets: [{ reps, weight }] }]
export async function getExerciseHistory(exerciseId) {
  const db = await getDB()
  const workouts = await db.getAllFromIndex('workouts', 'byExercise', exerciseId)
  return workouts
    .map((w) => ({
      workoutId: w.id,
      date: w.date,
      sets: w.entries.find((e) => e.exerciseId === exerciseId).sets,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

// The most recent session of an exercise, used for the "last time" reminder.
export async function getLastSession(exerciseId) {
  const history = await getExerciseHistory(exerciseId)
  return history.at(-1) ?? null
}

// ---------- Settings ----------

export async function getSetting(key, fallback) {
  const row = await (await getDB()).get('settings', key)
  return row ? row.value : fallback
}

export async function setSetting(key, value) {
  await (await getDB()).put('settings', { key, value })
}

// ---------- Backup ----------

const STORES = ['exercises', 'routines', 'workouts', 'settings']

export async function exportAll() {
  const db = await getDB()
  const data = { app: 'gym-tracker', version: DB_VERSION, exportedAt: new Date().toISOString() }
  for (const store of STORES) data[store] = await db.getAll(store)
  return data
}

// Replaces everything currently saved with the contents of a backup.
export async function importAll(data) {
  if (data?.app !== 'gym-tracker') throw new Error('This is not a Gym Tracker backup file.')
  const db = await getDB()
  const tx = db.transaction(STORES, 'readwrite')
  for (const store of STORES) {
    await tx.objectStore(store).clear()
    for (const row of data[store] ?? []) await tx.objectStore(store).put(row)
  }
  await tx.done
}
