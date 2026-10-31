import { useEffect, useState } from 'react'
import { getExercises, addExercise } from '../data/db'
import { MUSCLE_GROUPS } from '../data/starterExercises'

// Full-screen list to choose an exercise, with search, muscle-group filter,
// and a quick way to create a new one (which starts its own log).
export default function ExercisePicker({ onPick, onClose, exclude = [] }) {
  const [list, setList] = useState([])
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState('All')
  const [creating, setCreating] = useState(false)
  const [newGroup, setNewGroup] = useState(MUSCLE_GROUPS[0])
  const [bodyweight, setBodyweight] = useState(false)

  useEffect(() => {
    getExercises().then(setList)
  }, [])

  // Include any custom groups already in use, not just the built-in ones.
  const groups = ['All', ...new Set([...MUSCLE_GROUPS, ...list.map((e) => e.muscleGroup)])]
  const q = query.trim().toLowerCase()
  const shown = list.filter(
    (e) => (group === 'All' || e.muscleGroup === group) && e.name.toLowerCase().includes(q),
  )
  const exactMatch = list.some((e) => e.name.toLowerCase() === q)

  async function create() {
    const ex = await addExercise({ name: query, muscleGroup: newGroup, bodyweight })
    onPick(ex)
  }

  return (
    <div className="overlay" role="dialog" aria-label="Choose exercise">
      <div className="overlay-inner stack-sm">
        <div className="section-head">
          <h2>Add exercise</h2>
          <button className="btn btn-small" onClick={onClose}>
            Close
          </button>
        </div>

        <input
          className="input"
          autoFocus
          placeholder="Search or type a new exercise"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setCreating(false)
          }}
        />

        <div className="chips">
          {groups.map((g) => (
            <button key={g} className={g === group ? 'chip active' : 'chip'} onClick={() => setGroup(g)}>
              {g}
            </button>
          ))}
        </div>

        {q && !exactMatch && !creating && (
          <button
            className="btn create-btn"
            onClick={() => {
              setCreating(true)
              if (group !== 'All') setNewGroup(group)
            }}
          >
            + Create "{query.trim()}"
          </button>
        )}

        {creating && (
          <div className="card stack-sm">
            <strong>New exercise: {query.trim()}</strong>
            <label className="field">
              <span>Muscle group</span>
              <select className="input" value={newGroup} onChange={(e) => setNewGroup(e.target.value)}>
                {groups
                  .filter((g) => g !== 'All')
                  .map((g) => (
                    <option key={g}>{g}</option>
                  ))}
              </select>
            </label>
            <label className="checkbox">
              <input type="checkbox" checked={bodyweight} onChange={(e) => setBodyweight(e.target.checked)} />
              Bodyweight exercise (weight = extra weight added)
            </label>
            <button className="btn btn-primary" onClick={create}>
              Create and add
            </button>
          </div>
        )}

        <div className="pick-list">
          {shown.map((e) => {
            const added = exclude.includes(e.id)
            return (
              <button key={e.id} className="pick-row" disabled={added} onClick={() => onPick(e)}>
                <span>
                  {e.name}
                  {e.bodyweight && <span className="muted small"> · bodyweight</span>}
                </span>
                <span className="muted small">{added ? 'Added' : e.muscleGroup}</span>
              </button>
            )
          })}
          {shown.length === 0 && !q && <p className="muted small">No exercises in this group yet.</p>}
        </div>
      </div>
    </div>
  )
}
