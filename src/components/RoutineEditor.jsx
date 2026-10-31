import { useEffect, useState } from 'react'
import { getExercises } from '../data/db'
import ExercisePicker from './ExercisePicker'
import { useConfirm } from './useConfirm'

// Create or edit a routine: a name plus an ordered list of exercises.
export default function RoutineEditor({ routine, onSave, onDelete, onCancel }) {
  const [name, setName] = useState(routine?.name ?? '')
  const [ids, setIds] = useState(routine?.exerciseIds ?? [])
  const [exercises, setExercises] = useState({})
  const [picking, setPicking] = useState(false)
  const [dialog, ask] = useConfirm()

  // Reload after the picker closes, in case a new exercise was created there.
  useEffect(() => {
    getExercises().then((list) => setExercises(Object.fromEntries(list.map((e) => [e.id, e]))))
  }, [picking])

  const move = (i, dir) => {
    const next = [...ids]
    ;[next[i], next[i + dir]] = [next[i + dir], next[i]]
    setIds(next)
  }

  const canSave = name.trim() && ids.length > 0

  return (
    <div className="stack">
      <div className="section-head">
        <h2>{routine ? 'Edit routine' : 'New routine'}</h2>
        <button className="btn btn-small" onClick={onCancel}>
          Cancel
        </button>
      </div>

      <label className="field">
        <span>Name</span>
        <input
          className="input"
          value={name}
          placeholder="e.g. Push Day"
          onChange={(e) => setName(e.target.value)}
        />
      </label>

      <section className="stack-sm">
        <h3>Exercises</h3>
        {ids.length === 0 && <p className="muted small">Add the exercises this routine includes.</p>}
        {ids.map((id, i) =>
          exercises[id] ? (
            <div key={id} className="card list-row">
              <span>
                {i + 1}. {exercises[id].name}
              </span>
              <div className="row-actions">
                <button className="icon-btn" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">
                  ↑
                </button>
                <button
                  className="icon-btn"
                  disabled={i === ids.length - 1}
                  onClick={() => move(i, 1)}
                  aria-label="Move down"
                >
                  ↓
                </button>
                <button
                  className="icon-btn"
                  onClick={() => setIds(ids.filter((x) => x !== id))}
                  aria-label="Remove"
                >
                  ✕
                </button>
              </div>
            </div>
          ) : null,
        )}
        <button className="btn" onClick={() => setPicking(true)}>
          + Add exercise
        </button>
      </section>

      <button
        className="btn btn-primary btn-big"
        disabled={!canSave}
        onClick={() => onSave({ id: routine?.id, name, exerciseIds: ids.filter((id) => exercises[id]) })}
      >
        Save routine
      </button>
      {routine && (
        <button
          className="btn btn-danger-text"
          onClick={async () => {
            const ok = await ask({
              title: `Delete "${routine.name}"?`,
              message: 'Your workout history is kept.',
              confirmLabel: 'Delete',
              danger: true,
            })
            if (ok) onDelete(routine.id)
          }}
        >
          Delete routine
        </button>
      )}
      {dialog}

      {picking && (
        <ExercisePicker
          exclude={ids}
          onClose={() => setPicking(false)}
          onPick={(ex) => {
            setIds([...ids, ex.id])
            setPicking(false)
          }}
        />
      )}
    </div>
  )
}
