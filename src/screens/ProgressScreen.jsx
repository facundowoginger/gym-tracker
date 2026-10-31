import { useEffect, useState } from 'react'
import { getExercises, getWorkouts } from '../data/db'
import { summarizeByExercise, muscleSetsForWeek, weekStart } from '../data/stats'
import { toDisplay } from '../data/units'
import { MUSCLE_GROUPS } from '../data/starterExercises'
import ExerciseDetail from '../components/ExerciseDetail'

const shortDate = (iso) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })

// The Progress tab: this week at a glance, then every exercise you've logged with its trend.
export default function ProgressScreen({ unit }) {
  const [data, setData] = useState(null)
  const [openId, setOpenId] = useState(null)

  useEffect(() => {
    if (openId) return
    Promise.all([getExercises(), getWorkouts()]).then(([exercises, workouts]) =>
      setData({ exercisesById: Object.fromEntries(exercises.map((e) => [e.id, e])), workouts }),
    )
  }, [openId])

  if (openId) return <ExerciseDetail exerciseId={openId} unit={unit} onBack={() => setOpenId(null)} />
  if (!data) return null

  const { exercisesById, workouts } = data
  if (workouts.length === 0) {
    return (
      <div className="empty-center">
        <h2>Progress</h2>
        <p className="muted">Finish your first workout and your progress will show up here.</p>
      </div>
    )
  }

  const thisWeek = weekStart(new Date().toISOString())
  const lastWeek = weekStart(new Date(Date.now() - 7 * 864e5).toISOString())
  const setsNow = muscleSetsForWeek(workouts, exercisesById, thisWeek)
  const setsBefore = muscleSetsForWeek(workouts, exercisesById, lastWeek)
  const groups = [...new Set([...MUSCLE_GROUPS, ...Object.keys(setsNow), ...Object.keys(setsBefore)])].filter(
    (g) => setsNow[g] || setsBefore[g],
  )
  const maxSets = Math.max(1, ...groups.map((g) => setsNow[g] ?? 0))
  const workoutsThisWeek = workouts.filter((w) => weekStart(w.date) === thisWeek).length
  const totalSets = Object.values(setsNow).reduce((a, b) => a + b, 0)

  // Logged exercises, most recently trained first, with change since the previous session.
  const summary = summarizeByExercise(workouts)
  const logged = Object.entries(summary)
    .filter(([id]) => exercisesById[id])
    .sort((a, b) => b[1].lastDate.localeCompare(a[1].lastDate))

  return (
    <div className="stack">
      <h2>Progress</h2>

      <section className="card stack-sm">
        <h3>This week</h3>
        <div className="tile-grid">
          <div className="tile">
            <span className="muted small">Workouts</span>
            <strong className="tile-value">{workoutsThisWeek}</strong>
          </div>
          <div className="tile">
            <span className="muted small">Sets</span>
            <strong className="tile-value">{totalSets}</strong>
          </div>
        </div>
        {groups.length > 0 && (
          <div className="stack-sm">
            <span className="muted small">Sets per muscle group (last week in brackets)</span>
            {groups.map((g) => (
              <div key={g} className="bar-row">
                <span className="bar-label small">{g}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${((setsNow[g] ?? 0) / maxSets) * 100}%` }} />
                </div>
                <span className="small nowrap">
                  {setsNow[g] ?? 0} <span className="muted">({setsBefore[g] ?? 0})</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="stack-sm">
        <h3>Your exercises</h3>
        <div className="pick-list">
          {logged.map(([id, s]) => {
            const ex = exercisesById[id]
            const key = ex.bodyweight ? 'maxReps' : 'heaviest'
            const latest = s.sessions.at(-1).stats[key]
            const prev = s.sessions.at(-2)?.stats[key]
            const diff = prev === undefined ? null : latest - prev
            const show = (v) => (key === 'maxReps' ? `${v} reps` : `${Math.round(toDisplay(v, unit) * 10) / 10} ${unit}`)
            return (
              <button key={id} className="pick-row" onClick={() => setOpenId(id)}>
                <span className="stack-xs">
                  <span>{ex.name}</span>
                  <span className="muted small">
                    Last {shortDate(s.lastDate)} · top {show(latest)}
                  </span>
                </span>
                <span className={`change ${diff > 0 ? 'up' : diff < 0 ? 'down' : 'same'} nowrap`}>
                  {diff === null ? 'New' : diff === 0 ? '= same' : `${diff > 0 ? '▲ +' : '▼ '}${show(diff)}`}
                </span>
              </button>
            )
          })}
        </div>
        <p className="muted small">Change compares your top set with the session before.</p>
      </section>
    </div>
  )
}
