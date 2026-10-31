import { useEffect, useState } from 'react'
import { getExercise, getExerciseHistory } from '../data/db'
import { weeklyHistory, personalRecords, sessionStats } from '../data/stats'
import { toDisplay, formatWeight } from '../data/units'
import ProgressChart from './ProgressChart'
import ExerciseForm from './ExerciseForm'
import { IconArrowLeft } from '@tabler/icons-react'

const METRICS = [
  { key: 'heaviest', label: 'Heaviest', record: 'Heaviest weight' },
  { key: 'best1RM', label: 'Est. 1RM', record: 'Est. 1-rep max' },
  { key: 'volume', label: 'Volume', record: 'Best volume' },
  { key: 'maxReps', label: 'Most reps', record: 'Most reps' },
]

const shortDate = (iso) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
const dayDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
const weekLabel = (key) => shortDate(`${key}T12:00:00`)

// Everything about one exercise: records, a chart by week, and the week-by-week log.
export default function ExerciseDetail({ exerciseId, unit, onBack }) {
  const [exercise, setExercise] = useState(null)
  const [history, setHistory] = useState(null)
  const [metric, setMetric] = useState(null)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    getExercise(exerciseId).then((ex) => {
      setExercise(ex)
      setMetric((m) => m ?? (ex?.bodyweight ? 'maxReps' : 'heaviest'))
    })
    getExerciseHistory(exerciseId).then(setHistory)
  }, [exerciseId, editing])

  if (!exercise || !history) return null

  const fmt = (key, kg) => {
    if (key === 'maxReps') return `${kg} reps`
    if (key === 'volume') return `${Math.round(toDisplay(kg, unit)).toLocaleString()} ${unit}`
    return formatWeight(kg, unit)
  }
  const display = (key, v) => (key === 'maxReps' ? v : Math.round(toDisplay(v, unit) * 10) / 10)

  const weeks = weeklyHistory(history)
  const records = personalRecords(history)
  // Bodyweight exercises only show weight measures once extra weight has been added.
  const metrics =
    exercise.bodyweight && records.heaviest.value === 0
      ? METRICS.filter((m) => m.key === 'maxReps')
      : exercise.bodyweight
        ? [METRICS[3], ...METRICS.slice(0, 3)]
        : METRICS
  const points = weeks.map((w) => ({ label: weekLabel(w.week), value: display(metric, w[metric]), raw: w[metric] }))
  const current = METRICS.find((m) => m.key === metric)

  // Change between the two most recent weeks, for the chosen measure.
  let change = null
  if (weeks.length >= 2) {
    const diff = weeks.at(-1)[metric] - weeks.at(-2)[metric]
    const shown = metric === 'maxReps' ? diff : Math.round(toDisplay(diff, unit) * 10) / 10
    const unitLabel = metric === 'maxReps' ? 'reps' : unit
    change = {
      dir: diff > 0 ? 'up' : diff < 0 ? 'down' : 'same',
      text: diff === 0 ? 'Same as the week before' : `${diff > 0 ? '▲ +' : '▼ '}${shown} ${unitLabel} vs the week before`,
    }
  }

  return (
    <div className="stack">
      <div className="screen-head">
        <div className="section-head">
          <button className="link-btn" onClick={onBack}>
            <IconArrowLeft size={16} aria-hidden="true" /> Back
          </button>
          <button className="link-btn quiet" onClick={() => setEditing(true)}>
            Edit
          </button>
        </div>
        <h2 className="detail-title">{exercise.name}</h2>
        <p className="muted small">
          {exercise.muscleGroup}
          {history.length > 0 && ` · ${history.length} session${history.length > 1 ? 's' : ''}`}
          {exercise.bodyweight && ' · bodyweight (weight = extra added)'}
        </p>
      </div>

      {history.length === 0 ? (
        <p className="muted">
          No sets logged yet. This exercise's log starts the first time you tick a set for it in a workout.
        </p>
      ) : (
        <>
          <section className="stack-sm">
            <h3>Personal records</h3>
            <div className="tile-grid">
              {metrics.map((m) => (
                <div key={m.key} className="tile">
                  <span className="muted small">{m.record}</span>
                  <strong className="tile-value">{fmt(m.key, records[m.key].value)}</strong>
                  <span className="muted small">{records[m.key].date ? shortDate(records[m.key].date) : '–'}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="card stack-sm">
            <div className="chips">
              {metrics.length > 1 &&
                metrics.map((m) => (
                <button
                  key={m.key}
                  className={m.key === metric ? 'chip active' : 'chip'}
                  onClick={() => setMetric(m.key)}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <div>
              <h3>{current.label} by week</h3>
              {change && <span className={`change ${change.dir}`}>{change.text}</span>}
            </div>
            <ProgressChart
              points={points}
              title={`${current.label} by week for ${exercise.name}`}
              formatValue={(raw) => fmt(metric, raw)}
            />
          </section>

          <section className="stack-sm">
            <h3>Week by week</h3>
            {[...weeks].reverse().map((w) => (
              <div key={w.week} className="card stack-sm">
                <div className="section-head">
                  <strong>Week of {weekLabel(w.week)}</strong>
                  <span className="muted small">
                    {current.label}: {fmt(metric, w[metric])}
                  </span>
                </div>
                {[...w.sessions].reverse().map((s) => (
                  <div key={s.workoutId} className="week-session">
                    <span className="muted small nowrap">{dayDate(s.date)}</span>
                    <span className="small">
                      {s.sets.map((x) => `${display('heaviest', x.weight)}×${x.reps}`).join(', ')}
                    </span>
                    <span className="muted small nowrap">{fmt('volume', sessionStats(s.sets).volume)}</span>
                  </div>
                ))}
              </div>
            ))}
            <p className="muted small">Sets shown as weight × reps, in {unit}. Right column is total volume.</p>
          </section>
        </>
      )}

      {editing && (
        <ExerciseForm
          exercise={exercise}
          hasHistory={history.length > 0}
          onClose={() => setEditing(false)}
          onSaved={() => setEditing(false)}
          onDeleted={onBack}
        />
      )}
    </div>
  )
}
