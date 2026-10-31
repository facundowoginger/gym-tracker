import { useEffect, useRef, useState } from 'react'
import { exportAll, importAll, getSetting, setSetting, getWorkouts, getExercises, getRoutines } from '../data/db'
import { useConfirm } from '../components/useConfirm'

const longDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

// The Settings tab: kg / lbs switch, and backup export / import.
export default function SettingsScreen({ unit, onUnitChange }) {
  const [counts, setCounts] = useState(null)
  const [lastBackup, setLastBackup] = useState(null)
  const [message, setMessage] = useState(null) // { type: 'ok' | 'error', text }
  const fileInput = useRef(null)
  const [dialog, ask] = useConfirm()

  async function loadInfo() {
    const [w, e, r, lb] = await Promise.all([getWorkouts(), getExercises(), getRoutines(), getSetting('lastBackup', null)])
    setCounts({ workouts: w.length, exercises: e.length, routines: r.length })
    setLastBackup(lb)
  }

  useEffect(() => {
    loadInfo()
  }, [])

  async function changeUnit(next) {
    await setSetting('unit', next)
    onUnitChange(next)
  }

  async function exportBackup() {
    const data = await exportAll()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gym-tracker-backup-${new Date().toLocaleDateString('en-CA')}.json`
    a.click()
    URL.revokeObjectURL(url)
    const now = new Date().toISOString()
    await setSetting('lastBackup', now)
    setLastBackup(now)
    setMessage({ type: 'ok', text: 'Backup file downloaded. Keep it somewhere safe, like cloud storage or email.' })
  }

  async function importBackup(file) {
    setMessage(null)
    let data
    try {
      data = JSON.parse(await file.text())
      if (data?.app !== 'gym-tracker') throw new Error()
    } catch {
      setMessage({ type: 'error', text: "That file isn't a Gym Tracker backup." })
      return
    }
    const ok = await ask({
      title: 'Restore this backup?',
      message: `It has ${plural(data.workouts?.length ?? 0, 'workout')} and ${plural(data.exercises?.length ?? 0, 'exercise')}, from ${longDate(
        data.exportedAt,
      )}. Everything currently in the app will be replaced.`,
      confirmLabel: 'Replace and restore',
      danger: true,
    })
    if (!ok) return
    await importAll(data)
    // Reload so every screen picks up the restored data and settings.
    window.location.reload()
  }

  return (
    <div className="stack">
      <h2>Settings</h2>

      <section className="card stack-sm">
        <h3>Weight unit</h3>
        <div className="segmented" role="radiogroup" aria-label="Weight unit">
          {['lbs', 'kg'].map((u) => (
            <button
              key={u}
              role="radio"
              aria-checked={unit === u}
              className={unit === u ? 'segment active' : 'segment'}
              onClick={() => changeUnit(u)}
            >
              {u}
            </button>
          ))}
        </div>
        <p className="muted small">
          Switching converts how all your history is shown. Nothing is lost. A workout already in progress keeps the
          unit it started with.
        </p>
      </section>

      <section className="card stack-sm">
        <h3>Backup</h3>
        <p className="muted small">
          Your data is stored only on this device. Download a backup now and then, so you can restore it on a new
          phone or after clearing your browser.
        </p>
        {counts && (
          <p className="small">
            {plural(counts.workouts, 'workout')} · {plural(counts.exercises, 'exercise')} ·{' '}
            {plural(counts.routines, 'routine')}
          </p>
        )}
        <p className="muted small">Last backup: {lastBackup ? longDate(lastBackup) : 'never'}</p>
        <button className="btn btn-primary" onClick={exportBackup}>
          Download backup
        </button>
        <button className="btn" onClick={() => fileInput.current.click()}>
          Restore from backup…
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const file = e.target.files[0]
            e.target.value = '' // allow picking the same file again
            if (file) importBackup(file)
          }}
        />
        {message && <p className={message.type === 'error' ? 'error small' : 'ok small'}>{message.text}</p>}
      </section>

      {dialog}
    </div>
  )
}
