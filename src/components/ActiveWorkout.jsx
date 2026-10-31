import { useEffect, useState } from 'react'
import { getExercises, getExerciseHistory, saveWorkout } from '../data/db'
import { toDisplay, fromInput } from '../data/units'
import { newRecords } from '../data/stats'
import { blankSet, makeEntry } from '../data/workoutDraft'
import ExercisePicker from './ExercisePicker'
import { useConfirm } from './useConfirm'

const round1 = (n) => Math.round(n * 10) / 10
const fmtDate = (iso) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
const fmtTime = (iso) => new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })

// The workout in progress. Every change goes through onChange, which saves the draft.
export default function ActiveWorkout({ draft, onChange, onFinish, onCancel }) {
  const unit = draft.unit
  const [exercises, setExercises] = useState({})
  const [histories, setHistories] = useState({}) // exerciseId -> past sessions
  const [picking, setPicking] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dialog, ask] = useConfirm()

  useEffect(() => {
    getExercises().then((list) => setExercises(Object.fromEntries(list.map((e) => [e.id, e]))))
  }, [picking])

  // Load history for any exercise we haven't looked up yet (for "last time" and hints).
  useEffect(() => {
    const missing = draft.entries.map((e) => e.exerciseId).filter((id) => !(id in histories))
    if (missing.length === 0) return
    Promise.all(missing.map(async (id) => [id, await getExerciseHistory(id)])).then((pairs) =>
      setHistories((h) => ({ ...h, ...Object.fromEntries(pairs) })),
    )
  }, [draft.entries, histories])

  const showW = (kg) => round1(toDisplay(kg, unit))

  const updateEntry = (i, fn) =>
    onChange({ ...draft, entries: draft.entries.map((e, j) => (j === i ? fn(e) : e)) })
  const updateSet = (i, s, patch) =>
    updateEntry(i, (e) => ({ ...e, sets: e.sets.map((x, k) => (k === s ? { ...x, ...patch } : x)) }))
  const addSet = (i) => updateEntry(i, (e) => ({ ...e, sets: [...e.sets, blankSet()] }))
  const removeSet = (i) => updateEntry(i, (e) => ({ ...e, sets: e.sets.slice(0, -1) }))
  const removeEntry = async (i) => {
    const name = exercises[draft.entries[i].exerciseId]?.name ?? 'this exercise'
    const ok = await ask({
      title: `Remove ${name}?`,
      message: 'Its sets from this workout will be cleared. Past history is kept.',
      confirmLabel: 'Remove',
      danger: true,
    })
    if (ok) onChange({ ...draft, entries: draft.entries.filter((_, j) => j !== i) })
  }

  const cancelWorkout = async () => {
    const ok = await ask({
      title: 'Cancel this workout?',
      message: 'Nothing from this workout will be saved.',
      confirmLabel: 'Cancel workout',
      danger: true,
    })
    if (ok) onCancel()
  }

  // The grey suggestion in an empty box: last time's matching set,
  // or else the set above it in this workout.
  function hint(entry, s) {
    const prev = histories[entry.exerciseId]?.at(-1)?.sets[s]
    if (prev) return { weight: showW(prev.weight), reps: prev.reps }
    const above = entry.sets[s - 1]
    if (!above) return {}
    return {
      weight: above.weight === '' ? undefined : above.weight,
      reps: above.reps === '' ? undefined : above.reps,
    }
  }

  // Tapping ✓ on a set with empty boxes fills them from the hint ("same as last time").
  function toggleDone(i, s) {
    const entry = draft.entries[i]
    const set = entry.sets[s]
    if (set.done) return updateSet(i, s, { done: false })
    const ex = exercises[entry.exerciseId]
    const h = hint(entry, s)
    const weight = set.weight !== '' ? set.weight : (h.weight ?? (ex?.bodyweight ? 0 : ''))
    const reps = set.reps !== '' ? set.reps : (h.reps ?? '')
    if (weight === '' || !(Number(reps) > 0)) return // nothing to save yet
    updateSet(i, s, { weight: String(weight), reps: String(reps), done: true })
  }

  async function finish() {
    const ticked = draft.entries.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0)
    const unticked = draft.entries.reduce(
      (n, e) => n + e.sets.filter((s) => !s.done && (s.weight !== '' || s.reps !== '')).length,
      0,
    )
    if (ticked === 0) {
      await ask({
        title: 'Nothing to save yet',
        message: 'Tick at least one set (✓) before finishing.',
        cancelLabel: null,
      })
      return
    }
    if (unticked > 0) {
      const ok = await ask({
        title: 'Finish workout?',
        message: `${unticked} filled-in set${unticked > 1 ? 's are' : ' is'} not ticked and won't be saved.`,
        confirmLabel: 'Finish anyway',
      })
      if (!ok) return
    }

    setSaving(true)
    const entries = draft.entries
      .map((e) => ({
        exerciseId: e.exerciseId,
        sets: e.sets
          .filter((s) => s.done)
          .map((s) => ({ reps: Number(s.reps), weight: fromInput(Number(s.weight) || 0, unit) })),
      }))
      .filter((e) => e.sets.length > 0)

    // Compare against history from before this workout to find new records.
    const records = {}
    for (const e of entries) {
      const before = await getExerciseHistory(e.exerciseId)
      records[e.exerciseId] = newRecords(before, e.sets)
    }

    const workout = await saveWorkout({
      date: new Date().toISOString(),
      name: draft.name,
      routineId: draft.routineId,
      entries,
    })
    onFinish({ workout, records })
  }

  return (
    <div className="stack">
      <div className="section-head">
        <div>
          <h2>{draft.name}</h2>
          <span className="muted small">Started {fmtTime(draft.startedAt)}</span>
        </div>
        <button className="btn btn-primary" disabled={saving} onClick={finish}>
          Finish
        </button>
      </div>

      {draft.entries.length === 0 && (
        <p className="muted">Add your first exercise to get going.</p>
      )}

      {draft.entries.map((entry, i) => {
        const ex = exercises[entry.exerciseId]
        if (!ex) return null
        const history = histories[entry.exerciseId]
        const last = history?.at(-1)
        return (
          <div className="card stack-sm" key={entry.exerciseId}>
            <div className="section-head">
              <div>
                <strong>{ex.name}</strong> <span className="tag">{ex.muscleGroup}</span>
              </div>
              <button className="icon-btn" onClick={() => removeEntry(i)} aria-label={`Remove ${ex.name}`}>
                ✕
              </button>
            </div>

            <p className="muted small">
              {history === undefined
                ? ' '
                : last
                  ? `Last time (${fmtDate(last.date)}): ${last.sets.map((s) => `${showW(s.weight)}×${s.reps}`).join(', ')}`
                  : 'First time doing this. This workout starts its log.'}
            </p>

            <div className="set-grid set-header">
              <span>Set</span>
              <span>Previous</span>
              <span>{ex.bodyweight ? `+${unit}` : unit}</span>
              <span>Reps</span>
              <span />
            </div>
            {entry.sets.map((set, s) => {
              const h = hint(entry, s)
              const prev = last?.sets[s]
              return (
                <div key={s} className={set.done ? 'set-grid set-row done' : 'set-grid set-row'}>
                  <span className="set-num">{s + 1}</span>
                  <span className="muted small">{prev ? `${showW(prev.weight)} × ${prev.reps}` : '–'}</span>
                  <input
                    className="input num"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="any"
                    aria-label={`Set ${s + 1} weight`}
                    value={set.weight}
                    placeholder={h.weight ?? (ex.bodyweight ? '0' : '')}
                    onChange={(e) => updateSet(i, s, { weight: e.target.value })}
                  />
                  <input
                    className="input num"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    aria-label={`Set ${s + 1} reps`}
                    value={set.reps}
                    placeholder={h.reps ?? ''}
                    onChange={(e) => updateSet(i, s, { reps: e.target.value })}
                  />
                  <button
                    className={set.done ? 'check on' : 'check'}
                    onClick={() => toggleDone(i, s)}
                    aria-label={`Complete set ${s + 1}`}
                    aria-pressed={set.done}
                  >
                    ✓
                  </button>
                </div>
              )
            })}
            <div className="row-actions">
              <button className="btn btn-small" onClick={() => addSet(i)}>
                + Add set
              </button>
              {entry.sets.length > 1 && (
                <button className="btn btn-small" onClick={() => removeSet(i)}>
                  − Remove set
                </button>
              )}
            </div>
          </div>
        )
      })}

      <button className="btn btn-big" onClick={() => setPicking(true)}>
        + Add exercise
      </button>
      <button className="btn btn-danger-text" onClick={cancelWorkout}>
        Cancel workout
      </button>
      {dialog}

      {picking && (
        <ExercisePicker
          exclude={draft.entries.map((e) => e.exerciseId)}
          onClose={() => setPicking(false)}
          onPick={async (ex) => {
            setPicking(false)
            const entry = await makeEntry(ex.id)
            onChange({ ...draft, entries: [...draft.entries, entry] })
          }}
        />
      )}
    </div>
  )
}
