import { useState } from 'react'

// In-app replacement for window.confirm / window.alert, which some browsers block.
// Usage:
//   const [dialog, ask] = useConfirm()
//   if (await ask({ title: 'Delete?', confirmLabel: 'Delete', danger: true })) { ... }
//   ...render {dialog} somewhere in the component.
// Pass cancelLabel: null for a simple OK message with no cancel button.
export function useConfirm() {
  const [state, setState] = useState(null)

  const ask = (opts) => new Promise((resolve) => setState({ ...opts, resolve }))

  const close = (answer) => {
    state.resolve(answer)
    setState(null)
  }

  const dialog = state && (
    <div className="dialog-backdrop" onClick={() => close(false)}>
      <div className="dialog" role="alertdialog" aria-label={state.title} onClick={(e) => e.stopPropagation()}>
        <h3>{state.title}</h3>
        {state.message && <p className="muted">{state.message}</p>}
        <div className="dialog-actions">
          {state.cancelLabel !== null && (
            <button className="btn" onClick={() => close(false)}>
              {state.cancelLabel ?? 'Keep going'}
            </button>
          )}
          <button
            className={state.danger ? 'btn btn-danger' : 'btn btn-primary'}
            autoFocus
            onClick={() => close(true)}
          >
            {state.confirmLabel ?? 'OK'}
          </button>
        </div>
      </div>
    </div>
  )

  return [dialog, ask]
}
