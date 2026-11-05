import { useEffect, useState } from 'react'
import { IconBarbell, IconCalendar, IconListDetails, IconChartLine, IconSettings, IconScale } from '@tabler/icons-react'
import { getSetting, setSetting, getBodyWeights } from './data/db'
import { isWeighInDue, todayKey, WEEKDAY_NAMES, weekdayIndex } from './data/body'
import WorkoutScreen from './screens/WorkoutScreen'
import ExercisesScreen from './screens/ExercisesScreen'
import ProgressScreen from './screens/ProgressScreen'
import CalendarScreen from './screens/CalendarScreen'
import SettingsScreen from './screens/SettingsScreen'
import Splash from './components/Splash'
import WeightLogFlow from './components/WeightLogFlow'
import './App.css'

const TABS = [
  { id: 'workout', label: 'Workout', Icon: IconBarbell },
  { id: 'calendar', label: 'Calendar', Icon: IconCalendar },
  { id: 'progress', label: 'Progress', Icon: IconChartLine },
  { id: 'exercises', label: 'Exercises', Icon: IconListDetails },
  { id: 'settings', label: 'Settings', Icon: IconSettings },
]

function App() {
  const [tab, setTab] = useState('workout')
  const [unit, setUnit] = useState(null)
  const [showSplash, setShowSplash] = useState(false)
  const [weighIn, setWeighIn] = useState(null) // null | 'prompt' | 'log'
  const [refresh, setRefresh] = useState(0) // remounts the current screen after a weigh-in

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

  // On a weigh-in day, offer to log weight right after the opening screen. Never forced.
  async function afterSplash() {
    setShowSplash(false)
    const [goal, weights, dismissed] = await Promise.all([
      getSetting('weightGoal', null),
      getBodyWeights(),
      getSetting('weighInDismissed', null),
    ])
    if (isWeighInDue(goal, weights, dismissed)) setWeighIn('prompt')
  }

  return (
    <div className="app">
      <main className="app-main" key={refresh}>
        {unit && tab === 'workout' && <WorkoutScreen unit={unit} />}
        {unit && tab === 'calendar' && <CalendarScreen unit={unit} />}
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

      {weighIn === 'prompt' && (
        <div className="dialog-backdrop">
          <div className="dialog weigh-in" role="dialog" aria-label="Weigh-in day">
            <IconScale size={36} className="accent" aria-hidden="true" />
            <h3 className="bungee">Weigh-in day</h3>
            <p className="muted">It's {WEEKDAY_NAMES[weekdayIndex()].slice(0, -1)}. Want to log your weight?</p>
            <button className="btn btn-primary btn-big" onClick={() => setWeighIn('log')}>
              Log weight
            </button>
            <button
              className="link-btn quiet"
              onClick={() => {
                setSetting('weighInDismissed', todayKey())
                setWeighIn(null)
              }}
            >
              Not today
            </button>
          </div>
        </div>
      )}
      {weighIn === 'log' && unit && (
        <WeightLogFlow
          unit={unit}
          onDone={() => {
            setWeighIn(null)
            setRefresh((n) => n + 1)
          }}
        />
      )}

      {showSplash && <Splash onDone={afterSplash} />}
    </div>
  )
}

export default App
