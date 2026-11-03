import { IconArrowLeft } from '@tabler/icons-react'

// One routine: its exercises in order, Edit at the top right, and a Start button.
export default function RoutineDetail({ routine, exercises, onBack, onEdit, onStart }) {
  const list = routine.exerciseIds.map((id) => exercises[id]).filter(Boolean)
  return (
    <div className="stack">
      <div className="screen-head">
        <div className="section-head">
          <button className="link-btn" onClick={onBack}>
            <IconArrowLeft size={16} aria-hidden="true" /> Workout
          </button>
          <button className="link-btn quiet" onClick={onEdit}>
            Edit
          </button>
        </div>
        <h2 className="detail-title">{routine.name}</h2>
        <p className="muted small">
          {list.length} exercise{list.length === 1 ? '' : 's'}
        </p>
      </div>

      <div className="pick-list">
        {list.map((ex) => (
          <div key={ex.id} className="pick-row static">
            <span>{ex.name}</span>
            <span className="muted small">{ex.muscleGroup}</span>
          </div>
        ))}
        {list.length === 0 && <p className="muted small">No exercises yet. Tap Edit to add some.</p>}
      </div>

      <button className="btn btn-primary btn-big" disabled={list.length === 0} onClick={onStart}>
        Start routine
      </button>
    </div>
  )
}
