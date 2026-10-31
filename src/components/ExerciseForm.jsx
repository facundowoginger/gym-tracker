import { useState } from 'react'
import { addExercise, updateExercise, deleteExercise, getExercises } from '../data/db'
import { MUSCLE_GROUPS } from '../data/starterExercises'
import { useConfirm } from './useConfirm'

// Pop-up form to create a new exercise or edit (rename, regroup, delete) an existing one.
export default function ExerciseForm({ exercise, hasHistory, onSaved, onDeleted, onClose }) {
  const [name, setName] = useState(exercise?.name ?? '')
  const [group, setGroup] = useState(exercise?.muscleGroup ?? MUSCLE_GROUPS[0])
  const [bodyweight, setBodyweight] = useState(exercise?.bodyweight ?? false)
  const [error, setError] = useState('')
  const [dialog, ask] = useConfirm()

  const groups = [...new Set([...MUSCLE_GROUPS, group])]

  async function save() {
    setError('')
    try {
      if (exercise) {
        const saved = { ...exercise, name: name.trim(), muscleGroup: group, bodyweight }
        await updateExercise(saved)
        onSaved(saved)
      } else {
        const taken = (await getExercises()).some((e) => e.name.toLowerCase() === name.trim().toLowerCase())
        if (taken) throw new Error('duplicate')
        onSaved(await addExercise({ name, muscleGroup: group, bodyweight }))
      }
    } catch {
      setError('Another exercise already has that name.')
    }
  }

  async function remove() {
    const ok = await ask({
      title: `Delete ${exercise.name}?`,
      message: 'It will also be removed from any routines.',
      confirmLabel: 'Delete',
      danger: true,
    })
    if (!ok) return
    await deleteExercise(exercise.id)
    onDeleted()
  }

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" role="dialog" aria-label="Exercise" onClick={(e) => e.stopPropagation()}>
        <h3>{exercise ? 'Edit exercise' : 'New exercise'}</h3>
        <label className="field">
          <span>Name</span>
          <input className="input" autoFocus value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="field">
          <span>Muscle group</span>
          <select className="input" value={group} onChange={(e) => setGroup(e.target.value)}>
            {groups.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </label>
        <label className="checkbox">
          <input type="checkbox" checked={bodyweight} onChange={(e) => setBodyweight(e.target.checked)} />
          Bodyweight exercise (weight = extra weight added)
        </label>
        {error && <p className="error small">{error}</p>}
        <div className="dialog-actions">
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" disabled={!name.trim()} onClick={save}>
            Save
          </button>
        </div>
        {exercise &&
          (hasHistory ? (
            <p className="muted small">Exercises with logged workouts can't be deleted, so your progress is never lost.</p>
          ) : (
            <button className="btn btn-danger-text" onClick={remove}>
              Delete exercise
            </button>
          ))}
      </div>
      {dialog}
    </div>
  )
}
