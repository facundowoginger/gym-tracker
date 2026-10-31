import { useEffect, useState } from 'react'
import { getSetting } from './data/db'
import WorkoutScreen from './screens/WorkoutScreen'
import ExercisesScreen from './screens/ExercisesScreen'
import ProgressScreen from './screens/ProgressScreen'
import SettingsScreen from './screens/SettingsScreen'
import './App.css'

const TABS = [
  { id: 'workout', label: 'Workout', icon: '🏋️' },
  { id: 'exercises', label: 'Exercises', icon: '📋' },
  { id: 'progress', label: 'Progress', icon: '📈' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
]

function App() {
  const [tab, setTab] = useState('workout')
  const [unit, setUnit] = useState(null)

  useEffect(() => {
    getSetting('unit', 'lbs').then(setUnit)
    // Ask the browser not to clear this app's data when the phone runs low on space.
    navigator.storage?.persist?.().catch(() => {})
  }, [])

  return (
    <div className="app">
      <header className="app-header">
        <h1>Gym Tracker</h1>
      </header>

      <main className="app-main">
        {unit && tab === 'workout' && <WorkoutScreen unit={unit} />}
        {unit && tab === 'exercises' && <ExercisesScreen unit={unit} />}
        {unit && tab === 'progress' && <ProgressScreen unit={unit} />}
        {unit && tab === 'settings' && <SettingsScreen unit={unit} onUnitChange={setUnit} />}
      </main>

      <nav className="tab-bar">
        {TABS.map((t) => (
          <button key={t.id} className={t.id === tab ? 'tab active' : 'tab'} onClick={() => setTab(t.id)}>
            <span className="tab-icon">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

export default App
