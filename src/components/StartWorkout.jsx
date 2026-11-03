import { useEffect, useState } from 'react'
import { IconCheck, IconChevronRight, IconArrowLeft } from '@tabler/icons-react'
import {
  getRoutines,
  getWorkouts,
  getExercises,
  saveRoutine,
  deleteRoutine,
  deleteWorkout,
  getSetting,
  setSetting,
} from '../data/db'
import { recentWorkouts, currentWeekDays, weeklyStreak } from '../data/stats'
import { useNav, Screen } from './nav'
import RoutineEditor from './RoutineEditor'
import RoutineDetail from './RoutineDetail'
import WorkoutDetail from './WorkoutDetail'
import GoalPicker from './GoalPicker'

const shortDay = (iso) => new Date(iso).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
const dayLetter = (d) => d.toLocaleDateString(undefined, { weekday: 'narrow' })

// The Workout tab when no workout is in progress. Screens:
// home → routine → edit routine, home → past workout, home → a day with several workouts.
export default function StartWorkout({ onStart, unit }) {
  const nav = useNav({ type: 'home' })
  const [data, setData] = useState(null)
  const [goalOpen, setGoalOpen] = useState(false)

  async function load() {
    const [routines, workouts, list, goal] = await Promise.all([
      getRoutines(),
      getWorkouts(),
      getExercises(),
      getSetting('weeklyGoal', null),
    ])
    setData({ routines, workouts, exercises: Object.fromEntries(list.map((x) => [x.id, x])), goal })
  }

  // Reload whenever the screen changes, so edits and deletes show straight away.
  useEffect(() => {
    load()
  }, [nav.view])

  if (!data) return null
  const { routines, workouts, exercises, goal } = data
  const v = nav.view
  const routine = v.id && routines.find((r) => r.id === v.id)
  const workout = v.id && workouts.find((w) => w.id === v.id)

  let content
  if (v.type === 'routine' && routine) {
    content = (
      <RoutineDetail
        routine={routine}
        exercises={exercises}
        onBack={nav.pop}
        onEdit={() => nav.push({ type: 'edit', id: routine.id })}
        onStart={() => onStart(routine)}
      />
    )
  } else if (v.type === 'edit') {
    content = (
      <RoutineEditor
        routine={routine ?? null}
        onCancel={nav.pop}
        onSave={async (r) => {
          await saveRoutine(r)
          nav.pop()
        }}
        onDelete={async (id) => {
          await deleteRoutine(id)
          nav.home()
        }}
      />
    )
  } else if (v.type === 'workout' && workout) {
    content = (
      <WorkoutDetail
        workout={workout}
        exercises={exercises}
        unit={unit}
        backLabel={nav.depth > 2 ? 'Back' : 'Workout'}
        onBack={nav.pop}
        onDelete={async (id) => {
          await deleteWorkout(id)
          nav.home()
        }}
      />
    )
  } else if (v.type === 'day') {
    const dayWorkouts = workouts.filter((w) => v.ids.includes(w.id))
    content = (
      <div className="stack">
        <div className="screen-head">
          <button className="link-btn" onClick={nav.pop}>
            <IconArrowLeft size={16} aria-hidden="true" /> Workout
          </button>
          <h2 className="detail-title">{v.label}</h2>
        </div>
        <div className="pick-list">
          {dayWorkouts.map((w) => (
            <button key={w.id} className="pick-row" onClick={() => nav.push({ type: 'workout', id: w.id })}>
              <span>{w.name}</span>
              <IconChevronRight size={18} className="muted" aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
    )
  } else {
    content = (
      <Home
        data={data}
        onStartEmpty={() => onStart(null)}
        onOpenRoutine={(id) => nav.push({ type: 'routine', id })}
        onNewRoutine={() => nav.push({ type: 'edit', id: null })}
        onOpenWorkout={(id) => nav.push({ type: 'workout', id })}
        onOpenDay={(day) =>
          day.workouts.length === 1
            ? nav.push({ type: 'workout', id: day.workouts[0].id })
            : nav.push({ type: 'day', id: day.key, ids: day.workouts.map((w) => w.id), label: shortDay(day.date) })
        }
        onGoal={() => setGoalOpen(true)}
      />
    )
  }

  return (
    <>
      <Screen nav={nav}>{content}</Screen>
      {goalOpen && (
        <GoalPicker
          current={goal}
          onClose={() => setGoalOpen(false)}
          onSave={async (g) => {
            await setSetting('weeklyGoal', g)
            setGoalOpen(false)
            load()
          }}
        />
      )}
    </>
  )
}

function Home({ data, onStartEmpty, onOpenRoutine, onNewRoutine, onOpenWorkout, onOpenDay, onGoal }) {
  const { routines, workouts, goal } = data
  const days = currentWeekDays(workouts)
  const { thisCount, streak } = weeklyStreak(workouts, goal)
  const recent = recentWorkouts(workouts)

  return (
    <div className="stack">
      <div>
        <h2>Workout</h2>
        <div className="week-strip">
          {days.map((d) => {
            const done = d.workouts.length > 0
            return (
              <button
                key={d.key}
                className={`week-day${d.isToday ? ' today' : ''}`}
                disabled={!done}
                onClick={() => onOpenDay(d)}
                aria-label={`${d.date.toLocaleDateString(undefined, { weekday: 'long' })}${done ? ', trained' : ''}`}
              >
                <span className="week-letter">{dayLetter(d.date)}</span>
                <span className={done ? 'week-dot on' : 'week-dot'}>
                  {done && <IconCheck size={14} stroke={3} aria-hidden="true" />}
                </span>
              </button>
            )
          })}
        </div>
        {goal ? (
          <button className="streak-line" onClick={onGoal} aria-label="Change weekly goal">
            <strong className="accent">
              {thisCount} of {goal} workout{goal === 1 ? '' : 's'}
            </strong>{' '}
            <span className="muted">this week ·</span>{' '}
            <strong>{streak > 0 ? `${streak}-week streak` : 'streak starts at your goal'}</strong> 🔥
          </button>
        ) : (
          <div className="streak-line">
            <span>
              <strong className="accent">
                {thisCount} workout{thisCount === 1 ? '' : 's'}
              </strong>{' '}
              <span className="muted">this week</span>
            </span>
            <button className="goal-btn" onClick={onGoal}>
              + Set weekly goal
            </button>
          </div>
        )}
      </div>

      <button className="btn btn-primary btn-big" onClick={onStartEmpty}>
        Start empty workout
      </button>

      <section>
        <div className="section-head">
          <h3>Routines</h3>
          <button className="link-btn" onClick={onNewRoutine}>
            + New routine
          </button>
        </div>
        {routines.length === 0 && (
          <p className="muted small" style={{ paddingTop: 6 }}>
            No routines yet. Create one like "Push Day" to load all its exercises in one tap.
          </p>
        )}
        <div className="pick-list">
          {routines.map((r) => (
            <button key={r.id} className="pick-row" onClick={() => onOpenRoutine(r.id)}>
              <span className="row-title">{r.name}</span>
              <IconChevronRight size={18} className="muted" aria-hidden="true" />
            </button>
          ))}
        </div>
      </section>

      {recent.length > 0 && (
        <section>
          <h3>Recent workouts</h3>
          <div className="pick-list">
            {recent.map((w) => (
              <button key={w.id} className="pick-row" onClick={() => onOpenWorkout(w.id)}>
                <span className="row-title">{w.name}</span>
                <span className="muted small row-end">
                  {shortDay(w.startedAt ?? w.date)} <IconChevronRight size={18} aria-hidden="true" />
                </span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
