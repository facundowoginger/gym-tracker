import { useEffect, useRef, useState } from 'react'
import { IconTrophy } from '@tabler/icons-react'
import { getBodyWeights, saveBodyWeight, getSetting, setSetting } from '../data/db'
import { toDisplay, fromInput, round1 } from '../data/units'
import { weightFeedback, feedbackMessage, todayKey, dateFromKey } from '../data/body'
import WeightGoalDialog from './WeightGoalDialog'
import Plates from './Plates'

const CONFETTI = Array.from({ length: 26 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  delay: `${(i % 7) * 0.08}s`,
  rotate: `${i * 29}deg`,
  white: i % 3 === 0,
}))
const longDate = (key) => dateFromKey(key).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

// Logging a weigh-in: the pop-up, then a short encouraging message,
// or a full celebration when the goal is reached. Calls onDone() when finished.
export default function WeightLogFlow({ unit, onDone }) {
  const [phase, setPhase] = useState('form') // form | toast | reached | newGoal
  const [weight, setWeight] = useState('')
  const [date, setDate] = useState(todayKey())
  const [error, setError] = useState('')
  const [message, setMessage] = useState(null)
  const [reached, setReached] = useState(null) // { kg, goal }

  const fmt = (kg) => `${round1(toDisplay(kg, unit))} ${unit}`

  // Start from the last weigh-in so usually only a small change is needed.
  useEffect(() => {
    getBodyWeights().then((list) => {
      const last = list.at(-1)
      if (last) setWeight(String(round1(toDisplay(last.kg, unit))))
    })
  }, [unit])

  // The short message hides itself after a few seconds.
  const doneRef = useRef(onDone)
  doneRef.current = onDone
  useEffect(() => {
    if (phase !== 'toast') return
    const t = setTimeout(() => doneRef.current(), 3800)
    return () => clearTimeout(t)
  }, [phase])

  async function save() {
    const n = Number(weight)
    if (!(n > 0)) return setError('Enter your weight.')
    if (!date || date > todayKey()) return setError("Pick today or an earlier day.")
    const kg = fromInput(n, unit)
    const before = (await getBodyWeights()).filter((w) => w.date < date)
    let goal = await getSetting('weightGoal', null)
    // A goal set before any weigh-in starts counting from the first one.
    if (goal && goal.startKg == null) {
      goal = { ...goal, startKg: kg, startDate: date }
      await setSetting('weightGoal', goal)
    }
    await saveBodyWeight({ date, kg })

    const fb = weightFeedback(before.at(-1)?.kg, kg, goal)
    if (fb.kind === 'reached') {
      setReached({ kg, goal })
      setPhase('reached')
    } else {
      setMessage(feedbackMessage(fb, fmt, goal))
      setPhase('toast')
    }
  }

  if (phase === 'toast' && message) {
    return (
      <button className="toast" role="status" onClick={onDone}>
        <span className="toast-emoji" aria-hidden="true">
          {message.emoji}
        </span>
        <span className="stack-xs">
          <strong>{message.title}</strong>
          <span className="muted small">{message.sub}</span>
        </span>
      </button>
    )
  }

  if (phase === 'reached' && reached) {
    const { kg, goal } = reached
    const changed = goal.startKg != null ? Math.abs(kg - goal.startKg) : null
    const weeks = goal.startDate ? Math.max(1, Math.round((Date.now() - dateFromKey(goal.startDate)) / (7 * 864e5))) : null
    return (
      <div className="celebrate-screen" role="dialog" aria-label="Goal reached">
        <Plates />
        <div className="confetti" aria-hidden="true">
          {CONFETTI.map((c, i) => (
            <span key={i} className={c.white ? 'white' : ''} style={{ left: c.left, animationDelay: c.delay, '--r': c.rotate }} />
          ))}
        </div>
        <div className="celebrate-content">
          <IconTrophy size={52} className="accent" aria-hidden="true" />
          <p className="celebrate-small">Goal reached</p>
          <p className="celebrate-big">{round1(toDisplay(goal.targetKg, unit))}</p>
          <p className="celebrate-small">{unit}</p>
          {changed != null && (
            <p className="muted" style={{ marginTop: 12 }}>
              You {goal.type === 'lose' ? 'lost' : 'gained'} {fmt(changed)} since {longDate(goal.startDate)}.
              {weeks && (
                <>
                  <br />
                  That's {weeks} week{weeks === 1 ? '' : 's'} of work. 🏆
                </>
              )}
            </p>
          )}
          <button className="btn btn-primary btn-big" style={{ marginTop: 26, width: '100%' }} onClick={() => setPhase('newGoal')}>
            Set a new goal
          </button>
          <button
            className="link-btn quiet"
            style={{ marginTop: 8 }}
            onClick={async () => {
              await setSetting('weightGoal', {
                type: 'maintain',
                targetKg: kg,
                days: goal.days ?? [],
                startKg: kg,
                startDate: todayKey(),
              })
              onDone()
            }}
          >
            Maintain this weight
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'newGoal' && reached) {
    return (
      <WeightGoalDialog
        unit={unit}
        goal={{ ...reached.goal, targetKg: reached.kg }}
        latestKg={reached.kg}
        onClose={onDone}
        onSave={async (g) => {
          await setSetting('weightGoal', g)
          onDone()
        }}
      />
    )
  }

  return (
    <div className="dialog-backdrop" onClick={onDone}>
      <div className="dialog" role="dialog" aria-label="Log weight" onClick={(e) => e.stopPropagation()}>
        <h3>Log weight</h3>
        <label className="field">
          <span>Weight</span>
          <span className="big-input">
            <input
              className="input"
              type="number"
              inputMode="decimal"
              step="any"
              autoFocus
              value={weight}
              onChange={(e) => {
                setWeight(e.target.value)
                setError('')
              }}
            />
            <span className="muted">{unit}</span>
          </span>
        </label>
        <label className="field">
          <span>Date</span>
          <input className="input" type="date" max={todayKey()} value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        {error && <p className="error small">{error}</p>}
        <div className="dialog-actions">
          <button className="btn" onClick={onDone}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={save}>
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
