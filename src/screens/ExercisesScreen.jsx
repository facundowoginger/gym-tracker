import { useEffect, useState } from 'react'
import { getExercises, getWorkouts } from '../data/db'
import { summarizeByExercise } from '../data/stats'
import { formatWeight } from '../data/units'
import { MUSCLE_GROUPS } from '../data/starterExercises'
import ExerciseDetail from '../components/ExerciseDetail'
import ExerciseForm from '../components/ExerciseForm'
import { useNav, Screen } from '../components/nav'

const shortDate = (iso) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })

// The Exercises tab: browse every exercise by muscle group, add new ones, open one's progress.
export default function ExercisesScreen({ unit }) {
  const [exercises, setExercises] = useState([])
  const [summary, setSummary] = useState({})
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState('All')
  const nav = useNav({ type: 'list' })
  const [adding, setAdding] = useState(false)
  const openId = nav.view.type === 'exercise' ? nav.view.id : null

  useEffect(() => {
    if (openId || adding) return
    Promise.all([getExercises(), getWorkouts()]).then(([list, workouts]) => {
      setExercises(list)
      setSummary(summarizeByExercise(workouts))
    })
  }, [openId, adding])

  if (openId) {
    return (
      <Screen nav={nav}>
        <ExerciseDetail exerciseId={openId} unit={unit} onBack={nav.pop} />
      </Screen>
    )
  }

  const groups = ['All', ...new Set([...MUSCLE_GROUPS, ...exercises.map((e) => e.muscleGroup)])]
  const q = query.trim().toLowerCase()
  const shown = exercises.filter(
    (e) => (group === 'All' || e.muscleGroup === group) && e.name.toLowerCase().includes(q),
  )

  return (
    <Screen nav={nav}>
    <div className="stack-sm">
      <div className="section-head">
        <h2>Exercises</h2>
        <button className="btn btn-small btn-primary" onClick={() => setAdding(true)}>
          + New
        </button>
      </div>
      <input className="input" placeholder="Search exercises" value={query} onChange={(e) => setQuery(e.target.value)} />
      <div className="chips">
        {groups.map((g) => (
          <button key={g} className={g === group ? 'chip active' : 'chip'} onClick={() => setGroup(g)}>
            {g}
          </button>
        ))}
      </div>

      <div className="pick-list">
        {shown.map((e) => {
          const s = summary[e.id]
          return (
            <button key={e.id} className="pick-row" onClick={() => nav.push({ type: 'exercise', id: e.id })}>
              <span className="stack-xs">
                <span>{e.name}</span>
                <span className="muted small">
                  {s
                    ? `Last ${shortDate(s.lastDate)} · best ${
                        e.bodyweight ? `${s.maxReps} reps` : formatWeight(s.heaviest, unit)
                      }`
                    : 'Not logged yet'}
                </span>
              </span>
              <span className="muted small">{e.muscleGroup} ›</span>
            </button>
          )
        })}
        {shown.length === 0 && <p className="muted small">No exercises match.</p>}
      </div>

      {adding && (
        <ExerciseForm
          exercise={null}
          onClose={() => setAdding(false)}
          onSaved={() => setAdding(false)}
        />
      )}
    </div>
    </Screen>
  )
}
