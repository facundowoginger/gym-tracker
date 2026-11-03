import { useState } from 'react'

// Pop-up to choose how many workouts per week the streak needs.
export default function GoalPicker({ current, onSave, onClose }) {
  const [goal, setGoal] = useState(current ?? 3)
  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" role="dialog" aria-label="Weekly goal" onClick={(e) => e.stopPropagation()}>
        <h3>Weekly goal</h3>
        <p className="muted">How many workouts per week?</p>
        <div className="goal-numbers" role="radiogroup" aria-label="Workouts per week">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <button
              key={n}
              role="radio"
              aria-checked={goal === n}
              className={goal === n ? 'goal-num active' : 'goal-num'}
              onClick={() => setGoal(n)}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="dialog-actions">
          {current && (
            <button className="link-btn quiet" style={{ marginRight: 'auto' }} onClick={() => onSave(null)}>
              Remove goal
            </button>
          )}
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={() => onSave(goal)}>
            Set goal
          </button>
        </div>
      </div>
    </div>
  )
}
