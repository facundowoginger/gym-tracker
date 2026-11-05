import { useState } from 'react'
import { toDisplay, fromInput, round1 } from '../data/units'
import { WEEKDAY_NAMES, todayKey } from '../data/body'

const TYPES = [
  { key: 'lose', label: 'Lose' },
  { key: 'gain', label: 'Gain' },
  { key: 'maintain', label: 'Maintain' },
]
const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

// Two steps: 1) lose / gain / maintain and a target weight, 2) weigh-in days.
// Opens filled in when editing an existing goal. onSave(goal) or onSave(null) to remove it.
export default function WeightGoalDialog({ unit, goal, latestKg, startAtStep = 1, onSave, onClose }) {
  const [step, setStep] = useState(startAtStep)
  const [type, setType] = useState(goal?.type ?? 'lose')
  const [target, setTarget] = useState(
    goal ? String(round1(toDisplay(goal.targetKg, unit))) : latestKg ? String(round1(toDisplay(latestKg, unit))) : '',
  )
  const [days, setDays] = useState(goal?.days ?? [])
  const [error, setError] = useState('')

  function next() {
    const n = Number(target)
    if (!(n > 0)) return setError('Enter your target weight.')
    const current = latestKg != null ? toDisplay(latestKg, unit) : null
    if (current != null && type === 'lose' && n >= current) return setError('To lose weight, the target should be below your current weight.')
    if (current != null && type === 'gain' && n <= current) return setError('To gain weight, the target should be above your current weight.')
    setError('')
    setStep(2)
  }

  function finish(chosenDays) {
    const targetKg = fromInput(Number(target), unit)
    // Keep the starting point when only the weigh-in days changed; otherwise start fresh from today.
    const sameGoal = goal && goal.type === type && Math.abs(goal.targetKg - targetKg) < 0.01
    onSave({
      type,
      targetKg,
      days: chosenDays,
      startKg: sameGoal ? goal.startKg : (latestKg ?? null),
      startDate: sameGoal ? goal.startDate : todayKey(),
    })
  }

  const toggleDay = (i) => setDays((d) => (d.includes(i) ? d.filter((x) => x !== i) : [...d, i].sort()))

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" role="dialog" aria-label="Weight goal" onClick={(e) => e.stopPropagation()}>
        <p className="step-label">Step {step} of 2</p>
        {step === 1 ? (
          <>
            <h3>Weight goal</h3>
            <p className="muted small">What are you working toward?</p>
            <div className="chips" role="radiogroup" aria-label="Goal type">
              {TYPES.map((t) => (
                <button
                  key={t.key}
                  role="radio"
                  aria-checked={type === t.key}
                  className={type === t.key ? 'chip active' : 'chip'}
                  onClick={() => {
                    setType(t.key)
                    setError('')
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <label className="field">
              <span>{type === 'maintain' ? 'Weight to maintain' : 'Target weight'}</span>
              <span className="big-input">
                <input
                  className="input"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  value={target}
                  onChange={(e) => {
                    setTarget(e.target.value)
                    setError('')
                  }}
                />
                <span className="muted">{unit}</span>
              </span>
            </label>
            {error && <p className="error small">{error}</p>}
            <div className="dialog-actions">
              {goal && (
                <button className="link-btn quiet" style={{ marginRight: 'auto' }} onClick={() => onSave(null)}>
                  Remove goal
                </button>
              )}
              <button className="btn" onClick={onClose}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={next}>
                Next
              </button>
            </div>
          </>
        ) : (
          <>
            <h3>How many times a week would you like to log your weight?</h3>
            <p className="muted small">Pick your weigh-in days.</p>
            <div className="weigh-days" role="group" aria-label="Weigh-in days">
              {DAY_LETTERS.map((d, i) => (
                <button
                  key={i}
                  className={days.includes(i) ? 'weigh-day on' : 'weigh-day'}
                  aria-pressed={days.includes(i)}
                  aria-label={WEEKDAY_NAMES[i]}
                  onClick={() => toggleDay(i)}
                >
                  {d}
                </button>
              ))}
            </div>
            <p className="small">
              {days.length ? (
                <>
                  <strong className="accent">
                    {days.length} time{days.length === 1 ? '' : 's'} a week
                  </strong>{' '}
                  <span className="muted">· {days.map((i) => WEEKDAY_NAMES[i]).join(', ').replace(/, ([^,]*)$/, ' and $1')}</span>
                </>
              ) : (
                <span className="muted">No reminders. You can still log any day.</span>
              )}
            </p>
            <div className="dialog-actions">
              <button className="link-btn quiet" style={{ marginRight: 'auto' }} onClick={() => setStep(1)}>
                Back
              </button>
              <button className="btn" onClick={() => finish([])}>
                Skip
              </button>
              <button className="btn btn-primary" onClick={() => finish(days)}>
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
