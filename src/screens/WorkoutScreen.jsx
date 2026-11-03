import { useEffect, useState } from 'react'
import { getSetting, setSetting } from '../data/db'
import { newDraft } from '../data/workoutDraft'
import StartWorkout from '../components/StartWorkout'
import ActiveWorkout from '../components/ActiveWorkout'
import WorkoutSummary from '../components/WorkoutSummary'

// The Workout tab: start screen → workout in progress → summary.
export default function WorkoutScreen({ unit }) {
  const [draft, setDraft] = useState(undefined) // undefined while loading
  const [summary, setSummary] = useState(null)

  // Pick up a workout that was in progress before the app was closed.
  useEffect(() => {
    getSetting('activeWorkout', null).then(setDraft)
  }, [])

  const update = (next) => {
    setDraft(next)
    setSetting('activeWorkout', next)
  }

  if (draft === undefined) return null

  if (summary) {
    return <WorkoutSummary {...summary} unit={unit} onDone={() => setSummary(null)} />
  }

  if (draft) {
    return (
      <ActiveWorkout
        draft={draft}
        onChange={update}
        onFinish={(result) => {
          update(null)
          setSummary(result)
        }}
        onCancel={() => update(null)}
      />
    )
  }

  return <StartWorkout unit={unit} onStart={async (routine) => update(await newDraft({ routine, unit }))} />
}
