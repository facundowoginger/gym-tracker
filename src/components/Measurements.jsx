import { useEffect, useState } from 'react'
import { IconArrowLeft, IconChevronRight } from '@tabler/icons-react'
import { getMeasurements, saveMeasurements, updateMeasurementValue } from '../data/db'
import { toLength, fromLength, lengthUnit, round1 } from '../data/units'
import { BODY_PARTS, todayKey, dateFromKey } from '../data/body'
import ProgressChart from './ProgressChart'
import EditValueDialog from './EditValueDialog'
import { useConfirm } from './useConfirm'

const short = (key) => dateFromKey(key).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
const dayLabel = (key) => dateFromKey(key).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })

// All logged values for one body part, oldest first: [{ id, date, cm }]
const seriesFor = (entries, part) =>
  entries.filter((e) => e.values[part] != null).map((e) => ({ id: e.id, date: e.date, cm: e.values[part] }))

const signed = (n) => (Math.abs(n) < 0.05 ? '=' : `${n < 0 ? '−' : '+'}${round1(Math.abs(n))}`)

// Progress tab → Measurements: every body part with its latest size and last change.
export function MeasurementsSection({ unit, onLog, onOpenPart }) {
  const [entries, setEntries] = useState(null)
  useEffect(() => {
    getMeasurements().then(setEntries)
  }, [])
  if (!entries) return null
  const lu = lengthUnit(unit)
  const len = (cm) => round1(toLength(cm, unit))

  return (
    <div className="stack">
      {entries.length > 0 ? (
        <div className="section-head muted small">
          <span>Last measured {short(entries.at(-1).date)}</span>
          <span>{lu === 'in' ? 'inches' : 'centimeters'}</span>
        </div>
      ) : (
        <p className="muted">Log your measurements to track how each body part changes over time.</p>
      )}

      <div className="pick-list">
        {BODY_PARTS.map((p) => {
          const s = seriesFor(entries, p.key)
          const last = s.at(-1)
          const prev = s.at(-2)
          return (
            <button key={p.key} className="pick-row" disabled={!last} onClick={() => onOpenPart(p.key)}>
              <span className="row-title">{p.label}</span>
              <span className="row-end">
                {last ? (
                  <>
                    <strong>{len(last.cm)}</strong>
                    {prev && <span className="log-diff accent">{signed(toLength(last.cm - prev.cm, unit))}</span>}
                    <IconChevronRight size={18} className="muted" aria-hidden="true" />
                  </>
                ) : (
                  <span className="muted small">–</span>
                )}
              </span>
            </button>
          )
        })}
      </div>

      <button className="btn btn-primary btn-big" onClick={onLog}>
        + Log measurements
      </button>
    </div>
  )
}

// One screen with every body part; only the filled-in ones are saved.
export function MeasurementForm({ unit, onBack }) {
  const [entries, setEntries] = useState([])
  const [date, setDate] = useState(todayKey())
  const [values, setValues] = useState({})
  const [error, setError] = useState('')
  const lu = lengthUnit(unit)

  useEffect(() => {
    getMeasurements().then(setEntries)
  }, [])

  async function save() {
    const filled = Object.fromEntries(
      Object.entries(values)
        .filter(([, v]) => v !== '' && Number(v) > 0)
        .map(([k, v]) => [k, fromLength(Number(v), unit)]),
    )
    if (Object.keys(filled).length === 0) return setError('Fill in at least one measurement.')
    if (!date || date > todayKey()) return setError('Pick today or an earlier day.')
    await saveMeasurements({ date, values: filled })
    onBack()
  }

  return (
    <div className="stack">
      <div className="screen-head">
        <div className="section-head">
          <button className="link-btn" onClick={onBack}>
            <IconArrowLeft size={16} aria-hidden="true" /> Progress
          </button>
          <button className="link-btn" onClick={save}>
            Save
          </button>
        </div>
        <h2 className="detail-title">Log measurements</h2>
        <p className="muted small">Fill in any you measured, in {lu === 'in' ? 'inches' : 'centimeters'}.</p>
      </div>

      <label className="field">
        <span>Date</span>
        <input className="input" type="date" max={todayKey()} value={date} onChange={(e) => setDate(e.target.value)} />
      </label>

      <div>
        {BODY_PARTS.map((p) => {
          const last = seriesFor(entries, p.key).at(-1)
          const v = values[p.key] ?? ''
          return (
            <label key={p.key} className="measure-row">
              <span>{p.label}</span>
              <input
                className={v !== '' ? 'input num filled' : 'input num'}
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                placeholder={last ? String(round1(toLength(last.cm, unit))) : '–'}
                value={v}
                onChange={(e) => {
                  setValues({ ...values, [p.key]: e.target.value })
                  setError('')
                }}
              />
            </label>
          )
        })}
      </div>
      {error && <p className="error small">{error}</p>}
      <button className="btn btn-primary btn-big" onClick={save}>
        Save measurements
      </button>
    </div>
  )
}

// One body part: current size, change since the first measurement, chart, and log.
export function PartDetail({ part, unit, onBack }) {
  const [entries, setEntries] = useState(null)
  const [editing, setEditing] = useState(null)
  const [dialog, ask] = useConfirm()
  const load = () => getMeasurements().then(setEntries)
  useEffect(() => {
    load()
  }, [])
  if (!entries) return null

  const info = BODY_PARTS.find((p) => p.key === part)
  const lu = lengthUnit(unit)
  const len = (cm) => round1(toLength(cm, unit))
  const s = seriesFor(entries, part)
  const last = s.at(-1)
  const total = last ? last.cm - s[0].cm : 0

  return (
    <div className="stack">
      <div className="screen-head">
        <button className="link-btn" onClick={onBack}>
          <IconArrowLeft size={16} aria-hidden="true" /> Measurements
        </button>
        <h2 className="detail-title">{info.label}</h2>
      </div>

      {last ? (
        <>
          <div className="section-head" style={{ alignItems: 'flex-end' }}>
            <span>
              <span className="big-number">{len(last.cm)}</span> <span className="muted small">{lu}</span>
            </span>
            {s.length > 1 && (
              <span className="stack-xs" style={{ textAlign: 'right' }}>
                <strong className="accent">
                  {Math.abs(total) < 0.05 ? 'No change' : `${total < 0 ? '▼' : '▲'} ${round1(Math.abs(toLength(total, unit)))} ${lu}`}
                </strong>
                <span className="muted small">since {short(s[0].date)}</span>
              </span>
            )}
          </div>
          {s.length > 1 && (
            <ProgressChart
              points={s.map((e) => ({ label: short(e.date), value: len(e.cm), raw: e.cm }))}
              pad={1}
              tipPrefix=""
              title={`${info.label} over time`}
              formatValue={(cm) => `${len(cm)} ${lu}`}
            />
          )}
          <div className="pick-list">
            {[...s].reverse().map((e, i, list) => {
              const prev = list[i + 1]
              return (
                <button key={e.id} className="pick-row" onClick={() => setEditing(e)}>
                  <span className="muted">{dayLabel(e.date)}</span>
                  <span className="nowrap">
                    <strong>{len(e.cm)}</strong> <span className="muted small">{lu}</span>
                    {prev && <span className="log-diff accent">{signed(toLength(e.cm - prev.cm, unit))}</span>}
                  </span>
                </button>
              )
            })}
          </div>
        </>
      ) : (
        <p className="muted">No measurements yet.</p>
      )}

      {editing && (
        <EditValueDialog
          title={`Edit ${info.label.toLowerCase()}`}
          subtitle={dayLabel(editing.date)}
          initial={len(editing.cm)}
          unitLabel={lu}
          onClose={() => setEditing(null)}
          onSave={async (n) => {
            await updateMeasurementValue(editing.id, part, fromLength(n, unit))
            setEditing(null)
            load()
          }}
          onDelete={async () => {
            const ok = await ask({ title: 'Delete this measurement?', confirmLabel: 'Delete', danger: true })
            if (!ok) return
            await updateMeasurementValue(editing.id, part, null)
            setEditing(null)
            load()
          }}
        />
      )}
      {dialog}
    </div>
  )
}
