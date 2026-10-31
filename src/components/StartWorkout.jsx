import { useEffect, useState } from 'react'
import { getRoutines, getWorkouts, getExercises, saveRoutine, deleteRoutine } from '../data/db'
import RoutineEditor from './RoutineEditor'

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })

// Shown when no workout is in progress: start one, manage routines, see recent workouts.
export default function StartWorkout({ onStart }) {
  const [routines, setRoutines] = useState([])
  const [recent, setRecent] = useState([])
  const [exercises, setExercises] = useState({})
  const [editing, setEditing] = useState(null) // null | 'new' | a routine

  async function load() {
    const [r, w, e] = await Promise.all([getRoutines(), getWorkouts(), getExercises()])
    setRoutines(r)
    setRecent(w.slice(0, 5))
    setExercises(Object.fromEntries(e.map((x) => [x.id, x])))
  }

  useEffect(() => {
    load()
  }, [])

  if (editing) {
    return (
      <RoutineEditor
        routine={editing === 'new' ? null : editing}
        onCancel={() => setEditing(null)}
        onSave={async (routine) => {
          await saveRoutine(routine)
          setEditing(null)
          load()
        }}
        onDelete={async (id) => {
          await deleteRoutine(id)
          setEditing(null)
          load()
        }}
      />
    )
  }

  return (
    <div className="stack">
      <button className="btn btn-primary btn-big" onClick={() => onStart(null)}>
        Start empty workout
      </button>

      <section className="stack-sm">
        <div className="section-head">
          <h3>Routines</h3>
          <button className="btn btn-small" onClick={() => setEditing('new')}>
            + New routine
          </button>
        </div>
        {routines.length === 0 && (
          <p className="muted small">
            No routines yet. Create one like "Push Day" to load all its exercises in one tap.
          </p>
        )}
        {routines.map((r) => (
          <div key={r.id} className="card routine-card">
            <div className="routine-info">
              <strong>{r.name}</strong>
              <span className="muted small">
                {r.exerciseIds.map((id) => exercises[id]?.name).filter(Boolean).join(', ') ||
                  'No exercises yet'}
              </span>
            </div>
            <div className="row-actions">
              <button className="btn btn-small" onClick={() => setEditing(r)}>
                Edit
              </button>
              <button className="btn btn-small btn-primary" onClick={() => onStart(r)}>
                Start
              </button>
            </div>
          </div>
        ))}
      </section>

      {recent.length > 0 && (
        <section className="stack-sm">
          <h3>Recent workouts</h3>
          {recent.map((w) => (
            <div key={w.id} className="card recent-card">
              <div>
                <strong>{w.name ?? 'Workout'}</strong>
                <div className="muted small">
                  {w.entries.map((e) => exercises[e.exerciseId]?.name).filter(Boolean).join(', ')}
                </div>
              </div>
              <span className="muted small nowrap">{fmtDate(w.date)}</span>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
