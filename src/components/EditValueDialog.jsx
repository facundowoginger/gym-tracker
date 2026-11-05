import { useState } from 'react'

// Small pop-up to correct or delete one logged number (a weigh-in or a measurement).
export default function EditValueDialog({ title, subtitle, initial, unitLabel, onSave, onDelete, onClose }) {
  const [value, setValue] = useState(String(initial))
  const [error, setError] = useState('')

  function save() {
    const n = Number(value)
    if (!(n > 0)) return setError('Enter a number above 0.')
    onSave(n)
  }

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        {subtitle && <p className="muted small">{subtitle}</p>}
        <label className="big-input">
          <input
            className="input"
            type="number"
            inputMode="decimal"
            step="any"
            autoFocus
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              setError('')
            }}
          />
          <span className="muted">{unitLabel}</span>
        </label>
        {error && <p className="error small">{error}</p>}
        <div className="dialog-actions">
          <button className="btn-danger-text" style={{ marginRight: 'auto' }} onClick={onDelete}>
            Delete
          </button>
          <button className="btn" onClick={onClose}>
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
