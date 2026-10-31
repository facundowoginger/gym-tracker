import { useEffect, useState } from 'react'
import { IconBarbell, IconListDetails, IconChartLine, IconSettings } from '@tabler/icons-react'
import { getSetting } from './data/db'
import WorkoutScreen from './screens/WorkoutScreen'
import ExercisesScreen from './screens/ExercisesScreen'
import ProgressScreen from './screens/ProgressScreen'
import SettingsScreen from './screens/SettingsScreen'
import Splash from './components/Splash'
import './App.css'

const TABS = [
  { id: 'workout', label: 'Workout', Icon: IconBarbell },
  { id: 'exercises', label: 'Exercises', Icon: IconListDetails },
  { id: 'progress', label: 'Progress', Icon: IconChartLine },
  { id: 'settings', label: 'Settings', Icon: IconSettings },
]

function App() {
  const [tab, setTab] = useState('workout')
  const [unit, setUnit] = useState(null)
  const [showSplash, setShowSplash] = useState(false)

  useEffect(() => {
    // Show the opening screen on launch, unless a workout is already in progress:
    // then go straight back to it.
    Promise.all([getSetting('unit', 'lbs'), getSetting('activeWorkout', null)]).then(([u, active]) => {
      setShowSplash(!active)
      setUnit(u)
    })
    // Ask the browser not to clear this app's data when the phone runs low on space.
    navigator.storage?.persist?.().catch(() => {})
  }, [])

  return (
    <div className="app">
      <main className="app-main">
        {unit && tab === 'workout' && <WorkoutScreen unit={unit} />}
        {unit && tab === 'exercises' && <ExercisesScreen unit={unit} />}
        {unit && tab === 'progress' && <ProgressScreen unit={unit} />}
        {unit && tab === 'settings' && <SettingsScreen unit={unit} onUnitChange={setUnit} />}
      </main>

      <nav className="tab-bar">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={id === tab ? 'tab active' : 'tab'}
            aria-current={id === tab ? 'page' : undefined}
            onClick={() => setTab(id)}
          >
            <Icon size={22} stroke={1.75} aria-hidden="true" />
            <span>{label}</span>
            <span className="tab-indicator" />
          </button>
        ))}
      </nav>

      {showSplash && <Splash onDone={() => setShowSplash(false)} />}
    </div>
  )
}

export default App
