import { useEffect, useState } from 'react'
import { IconPencil } from '@tabler/icons-react'
import { getBodyWeights, updateBodyWeight, deleteBodyWeight, getSetting, setSetting } from '../data/db'
import { toDisplay, fromInput, round1 } from '../data/units'
import { goalProgress, isTowardGoal, WEEKDAY_SHORT, dateFromKey } from '../data/body'
import ProgressChart from './ProgressChart'
import WeightLogFlow from './WeightLogFlow'
import WeightGoalDialog from './WeightGoalDialog'
import EditValueDialog from './EditValueDialog'
import { useConfirm } from './useConfirm'

const RANGES = [
  { key: '1M', months: 1 },
  { key: '3M', months: 3 },
  { key: '6M', months: 6 },
  { key: '1Y', months: 12 },
  { key: 'All', months: null },
]
const short = (key) => dateFromKey(key).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
const dayLabel = (key) => dateFromKey(key).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
const joinDays = (days) => days.map((i) => WEEKDAY_SHORT[i]).join(', ').replace(/, ([^,]*)$/, ' and $1')

// Progress tab → Body weight: current weight, goal, chart, and the weigh-in log.
export default function BodyWeightSection({ unit }) {
  const [weights, setWeights] = useState(null)
  const [goal, setGoal] = useState(null)
  const [range, setRange] = useState('3M')
  const [logging, setLogging] = useState(false)
  const [goalStep, setGoalStep] = useState(null) // null | 1 | 2
  const [editing, setEditing] = useState(null)
  const [dialog, ask] = useConfirm()

  async function load() {
    const [w, g] = await Promise.all([getBodyWeights(), getSetting('weightGoal', null)])
    setWeights(w)
    setGoal(g)
  }
  useEffect(() => {
    load()
  }, [])

  if (!weights) return null
  const w = (kg) => round1(toDisplay(kg, unit))
  const fmt = (kg) => `${w(kg)} ${unit}`
  const latest = weights.at(-1)
  const first = weights[0]
  const totalDiff = latest && first ? latest.kg - first.kg : 0
  const progress = goalProgress(goal, latest?.kg)

  const months = RANGES.find((r) => r.key === range).months
  const cutoff = months ? new Date(new Date().setMonth(new Date().getMonth() - months)).toLocaleDateString('en-CA') : ''
  const shown = weights.filter((e) => e.date >= cutoff)
  const points = shown.map((e) => ({ label: short(e.date), value: w(e.kg), raw: e.kg }))

  const goalLine = goal && (
    <>
      <div className="goal-line">
        <span>
          <span className="muted">Goal:</span>{' '}
          {goal.type === 'maintain' ? 'maintain' : goal.type} {goal.type === 'maintain' ? '' : 'to '}
          <strong>{fmt(goal.targetKg)}</strong>{' '}
          <button className="edit-chip" onClick={() => setGoalStep(1)}>
            <IconPencil size={13} aria-hidden="true" /> Edit
          </button>
        </span>
        {progress && <span className="muted nowrap">{progress.toGo > 0 ? `${fmt(progress.toGo)} to go` : 'Reached 🏆'}</span>}
      </div>
      {progress && (
        <div className="goal-bar" aria-label={`${Math.round(progress.fraction * 100)}% of the way to your goal`}>
          <div style={{ width: `${progress.fraction * 100}%` }} />
        </div>
      )}
      <button className="weigh-line" onClick={() => setGoalStep(2)}>
        <span className="muted">{goal.days?.length ? `Weigh-ins: ${joinDays(goal.days)}` : 'No weigh-in days'}</span>
        <IconPencil size={13} className="accent" aria-hidden="true" />
      </button>
    </>
  )

  return (
    <div className="stack">
      {latest ? (
        <div className="section-head" style={{ alignItems: 'flex-end' }}>
          <div className="stack-xs">
            <span className="muted small">Current</span>
            <span>
              <span className="big-number">{w(latest.kg)}</span> <span className="muted small">{unit}</span>
            </span>
          </div>
          {weights.length > 1 && (
            <div className="stack-xs" style={{ textAlign: 'right' }}>
              <strong className={isTowardGoal(goal, totalDiff) === false ? '' : 'accent'}>
                {totalDiff === 0 ? 'No change' : `${totalDiff < 0 ? '▼' : '▲'} ${fmt(Math.abs(totalDiff))}`}
              </strong>
              <span className="muted small">since {short(first.date)}</span>
            </div>
          )}
        </div>
      ) : (
        <p className="muted">Log your first weigh-in to start tracking your body weight.</p>
      )}

      <div>
        {goal ? (
          goalLine
        ) : (
          <button className="goal-btn" onClick={() => setGoalStep(1)}>
            + Set a weight goal
          </button>
        )}
      </div>

      {weights.length > 1 && (
        <section>
          <div className="chips">
            {RANGES.map((r) => (
              <button key={r.key} className={r.key === range ? 'chip active' : 'chip'} onClick={() => setRange(r.key)}>
                {r.key}
              </button>
            ))}
          </div>
          {points.length > 0 ? (
            <ProgressChart
              points={points}
              pad={2}
              goal={goal ? w(goal.targetKg) : undefined}
              tipPrefix=""
              title={`Body weight over the last ${range}`}
              formatValue={fmt}
            />
          ) : (
            <p className="muted small" style={{ padding: '16px 0' }}>
              No weigh-ins in this range.
            </p>
          )}
        </section>
      )}

      <button className="btn btn-primary btn-big" onClick={() => setLogging(true)}>
        + Log weight
      </button>

      {weights.length > 0 && (
        <div className="pick-list">
          {[...weights].reverse().map((e, i, list) => {
            const prev = list[i + 1]
            const diff = prev ? e.kg - prev.kg : null
            const toward = isTowardGoal(goal, diff ?? 0)
            return (
              <button key={e.id} className="pick-row" onClick={() => setEditing(e)}>
                <span className="muted">{dayLabel(e.date)}</span>
                <span className="nowrap">
                  <strong>{w(e.kg)}</strong> <span className="muted small">{unit}</span>
                  {diff != null && (
                    <span className={`log-diff ${toward === false ? 'muted' : 'accent'}`}>
                      {Math.abs(diff) < 0.05 ? '=' : `${diff < 0 ? '−' : '+'}${w(Math.abs(diff))}`}
                    </span>
                  )}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {logging && (
        <WeightLogFlow
          unit={unit}
          onDone={() => {
            setLogging(false)
            load()
          }}
        />
      )}
      {goalStep && (
        <WeightGoalDialog
          unit={unit}
          goal={goal}
          latestKg={latest?.kg}
          startAtStep={goal ? goalStep : 1}
          onClose={() => setGoalStep(null)}
          onSave={async (g) => {
            await setSetting('weightGoal', g)
            setGoalStep(null)
            load()
          }}
        />
      )}
      {editing && (
        <EditValueDialog
          title="Edit weigh-in"
          subtitle={dayLabel(editing.date)}
          initial={w(editing.kg)}
          unitLabel={unit}
          onClose={() => setEditing(null)}
          onSave={async (n) => {
            await updateBodyWeight({ ...editing, kg: fromInput(n, unit) })
            setEditing(null)
            load()
          }}
          onDelete={async () => {
            const ok = await ask({ title: 'Delete this weigh-in?', confirmLabel: 'Delete', danger: true })
            if (!ok) return
            await deleteBodyWeight(editing.id)
            setEditing(null)
            load()
          }}
        />
      )}
      {dialog}
    </div>
  )
}
