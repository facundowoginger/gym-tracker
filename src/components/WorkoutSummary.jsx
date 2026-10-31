import { useEffect, useState } from 'react'
import { getExercises } from '../data/db'
import { formatWeight } from '../data/units'
import { sessionStats } from '../data/stats'

const RECORD_LABELS = {
  heaviest: 'Heaviest weight',
  best1RM: 'Est. 1-rep max',
  volume: 'Total volume',
  maxReps: 'Most reps',
}

// Shown right after finishing: what was saved and any new personal records.
export default function WorkoutSummary({ workout, records, unit, onDone }) {
  const [exercises, setExercises] = useState({})
  useEffect(() => {
    getExercises().then((list) => setExercises(Object.fromEntries(list.map((e) => [e.id, e]))))
  }, [])

  const totalSets = workout.entries.reduce((n, e) => n + e.sets.length, 0)
  const totalVolume = workout.entries.reduce((n, e) => n + sessionStats(e.sets).volume, 0)
  const prCount = Object.values(records).reduce((n, r) => n + r.length, 0)

  return (
    <div className="stack">
      <div className="summary-hero">
        <div className="summary-emoji">{prCount > 0 ? '🏆' : '💪'}</div>
        <h2>Workout saved</h2>
        <p className="muted">
          {workout.name} · {workout.entries.length} exercises · {totalSets} sets · {formatWeight(totalVolume, unit)} lifted
        </p>
        {prCount > 0 && (
          <p className="pr-banner">
            {prCount} new personal record{prCount > 1 ? 's' : ''}!
          </p>
        )}
      </div>

      {workout.entries.map((e) => (
        <div key={e.exerciseId} className="card stack-sm">
          <strong>{exercises[e.exerciseId]?.name}</strong>
          <span className="muted small">
            {e.sets.map((s) => `${formatWeight(s.weight, unit)} × ${s.reps}`).join(' · ')}
          </span>
          {records[e.exerciseId]?.length > 0 && (
            <div className="badges">
              {records[e.exerciseId].map((r) => (
                <span key={r} className="badge">
                  🏆 {RECORD_LABELS[r]}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}

      <button className="btn btn-primary btn-big" onClick={onDone}>
        Done
      </button>
    </div>
  )
}
