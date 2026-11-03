import { useEffect, useState } from 'react'
import { IconTrophy } from '@tabler/icons-react'
import { getExercises } from '../data/db'
import { formatWeight, toDisplay } from '../data/units'
import { sessionStats } from '../data/stats'
import Plates from './Plates'

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

// Amber and white confetti pieces, placed and timed so they look scattered.
const CONFETTI = Array.from({ length: 26 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  delay: `${(i % 7) * 0.08}s`,
  rotate: `${i * 29}deg`,
  white: i % 3 === 0,
}))

// Shown right after finishing. Weight records get a big celebration at the top.
// records: { exerciseId: { prev, now, gain } } (weights in kg)
export default function WorkoutSummary({ workout, records, unit, onDone }) {
  const [exercises, setExercises] = useState({})
  useEffect(() => {
    getExercises().then((list) => setExercises(Object.fromEntries(list.map((e) => [e.id, e]))))
  }, [])

  const show = (kg) => Math.round(toDisplay(kg, unit) * 10) / 10
  const totalSets = workout.entries.reduce((n, e) => n + e.sets.length, 0)
  const totalVolume = workout.entries.reduce((n, e) => n + sessionStats(e.sets).volume, 0)

  // Feature the biggest weight jump.
  const top = Object.entries(records).sort((a, b) => b[1].gain - a[1].gain)[0]
  const topName = top && exercises[top[0]]?.name

  return (
    <div className="stack">
      <div className="summary-hero">
        <Plates />
        {top ? (
          <>
            <div className="confetti" aria-hidden="true">
              {CONFETTI.map((c, i) => (
                <span
                  key={i}
                  className={c.white ? 'white' : ''}
                  style={{ left: c.left, animationDelay: c.delay, '--r': c.rotate }}
                />
              ))}
            </div>
            <IconTrophy size={44} className="accent" aria-hidden="true" />
            <p className="celebrate-small">New record</p>
            <p className="celebrate-big">+{show(top[1].gain)}</p>
            <p className="celebrate-small">
              {unit} on {topName ?? 'this exercise'}
            </p>
            <p className="muted small">
              {formatWeight(top[1].now, unit)} · previous best {formatWeight(top[1].prev, unit)}
            </p>
          </>
        ) : (
          <>
            <div className="summary-emoji">💪</div>
            <h2>Workout saved</h2>
          </>
        )}
        <p className="muted small" style={{ marginTop: 10 }}>
          {workout.name} · {plural(workout.entries.length, 'exercise')} · {plural(totalSets, 'set')} ·{' '}
          {Math.round(toDisplay(totalVolume, unit)).toLocaleString()} {unit} lifted
        </p>
      </div>

      <div className="pick-list">
        {workout.entries.map((e) => (
          <div key={e.exerciseId} className="pick-row static summary-row">
            <span className="stack-xs">
              <span className="row-title">{exercises[e.exerciseId]?.name}</span>
              <span className="muted small">
                {e.sets.map((s) => `${show(s.weight)} × ${s.reps}`).join(' · ')}
              </span>
            </span>
            {records[e.exerciseId] && (
              <span className="badge nowrap">
                🏆 +{show(records[e.exerciseId].gain)} {unit}
              </span>
            )}
          </div>
        ))}
      </div>

      <button className="btn btn-primary btn-big" onClick={onDone}>
        Done
      </button>
    </div>
  )
}
