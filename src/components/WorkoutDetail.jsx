import { IconArrowLeft } from '@tabler/icons-react'
import { sessionStats } from '../data/stats'
import { toDisplay } from '../data/units'
import { useConfirm } from './useConfirm'

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`
const longDay = (iso) => new Date(iso).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
const time = (iso) => new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })

// What was done in one past workout, set by set, with a way to delete it.
export default function WorkoutDetail({ workout, exercises, unit, backLabel = 'Workout', onBack, onDelete }) {
  const [dialog, ask] = useConfirm()
  const w = (kg) => Math.round(toDisplay(kg, unit) * 10) / 10
  const totalSets = workout.entries.reduce((n, e) => n + e.sets.length, 0)
  const volume = workout.entries.reduce((n, e) => n + sessionStats(e.sets).volume, 0)

  async function remove() {
    const ok = await ask({
      title: `Delete ${workout.name}?`,
      message: 'It will also be removed from your progress and records. This cannot be undone.',
      confirmLabel: 'Delete',
      danger: true,
    })
    if (ok) onDelete(workout.id)
  }

  return (
    <div className="stack">
      <div className="screen-head">
        <button className="link-btn" onClick={onBack}>
          <IconArrowLeft size={16} aria-hidden="true" /> {backLabel}
        </button>
        <h2 className="detail-title">{workout.name}</h2>
        <p className="muted small">
          {longDay(workout.startedAt ?? workout.date)}
          {workout.startedAt && ` · started ${time(workout.startedAt)}`}
        </p>
        <p className="muted small">
          {plural(workout.entries.length, 'exercise')} · {plural(totalSets, 'set')} ·{' '}
          {Math.round(toDisplay(volume, unit)).toLocaleString()} {unit}
        </p>
      </div>

      {workout.entries.map((e) => {
        const ex = exercises[e.exerciseId]
        return (
          <section key={e.exerciseId}>
            <div className="exercise-head">
              <span className="exercise-name">{ex?.name ?? 'Deleted exercise'}</span>
              <span className="tag">{ex?.muscleGroup}</span>
            </div>
            {e.sets.map((s, i) => (
              <div key={i} className="detail-set">
                <span className="muted">Set {i + 1}</span>
                <span>
                  {ex?.bodyweight ? `+${w(s.weight)}` : w(s.weight)} × {s.reps}
                </span>
              </div>
            ))}
          </section>
        )
      })}

      <button className="btn-danger-text" onClick={remove}>
        Delete workout
      </button>
      {dialog}
    </div>
  )
}
