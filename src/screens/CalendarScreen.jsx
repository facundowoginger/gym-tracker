import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { IconArrowLeft, IconChevronRight } from '@tabler/icons-react'
import { getWorkouts, getExercises, deleteWorkout } from '../data/db'
import { workoutDay } from '../data/stats'
import { useNav, Screen } from '../components/nav'
import WorkoutDetail from '../components/WorkoutDetail'

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const dayKey = (d) => d.toLocaleDateString('en-CA') // YYYY-MM-DD, local time
const shortDay = (d) => d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })

// Every month from the first workout up to this month, oldest first.
function monthsToShow(workouts, today) {
  const oldest = workouts.length ? new Date(`${workoutDay(workouts.at(-1))}T12:00:00`) : today
  const months = []
  const d = new Date(oldest.getFullYear(), oldest.getMonth(), 1)
  while (d.getFullYear() < today.getFullYear() || (d.getFullYear() === today.getFullYear() && d.getMonth() <= today.getMonth())) {
    months.push(new Date(d))
    d.setMonth(d.getMonth() + 1)
  }
  return months
}

// The Calendar tab: one continuous calendar, newest month at the bottom.
// Days with a workout are amber; tapping one opens what was done that day.
export default function CalendarScreen({ unit }) {
  const nav = useNav({ type: 'calendar' })
  const [data, setData] = useState(null)
  const savedScroll = useRef(null) // where the calendar was scrolled before opening a day

  useEffect(() => {
    Promise.all([getWorkouts(), getExercises()]).then(([workouts, list]) =>
      setData({ workouts, exercises: Object.fromEntries(list.map((e) => [e.id, e])) }),
    )
  }, [nav.view])

  if (!data) return null
  const { workouts, exercises } = data
  const v = nav.view

  function openDay(key, dayWorkouts, date) {
    savedScroll.current = window.scrollY
    if (dayWorkouts.length === 1) nav.push({ type: 'workout', id: dayWorkouts[0].id })
    else nav.push({ type: 'day', id: key, ids: dayWorkouts.map((w) => w.id), label: shortDay(date) })
  }

  let content
  const workout = v.type === 'workout' && workouts.find((w) => w.id === v.id)
  if (workout) {
    content = (
      <WorkoutDetail
        workout={workout}
        exercises={exercises}
        unit={unit}
        backLabel={nav.depth > 2 ? 'Back' : 'Calendar'}
        onBack={nav.pop}
        onDelete={async (id) => {
          await deleteWorkout(id)
          nav.home()
        }}
      />
    )
  } else if (v.type === 'day') {
    content = (
      <div className="stack">
        <div className="screen-head">
          <button className="link-btn" onClick={nav.pop}>
            <IconArrowLeft size={16} aria-hidden="true" /> Calendar
          </button>
          <h2 className="detail-title">{v.label}</h2>
        </div>
        <div className="pick-list">
          {workouts
            .filter((w) => v.ids.includes(w.id))
            .map((w) => (
              <button key={w.id} className="pick-row" onClick={() => nav.push({ type: 'workout', id: w.id })}>
                <span className="row-title">{w.name}</span>
                <IconChevronRight size={18} className="muted" aria-hidden="true" />
              </button>
            ))}
        </div>
      </div>
    )
  } else {
    content = <MonthList workouts={workouts} onOpenDay={openDay} savedScroll={savedScroll} />
  }

  return <Screen nav={nav}>{content}</Screen>
}

function MonthList({ workouts, onOpenDay, savedScroll }) {
  const today = new Date()
  const todayKey = dayKey(today)
  const byDay = new Map()
  for (const w of workouts) {
    const k = workoutDay(w)
    byDay.set(k, [...(byDay.get(k) ?? []), w])
  }
  const monthAgo = new Date(today)
  monthAgo.setDate(monthAgo.getDate() - 30)
  const last30 = workouts.filter((w) => new Date(w.startedAt ?? w.date) >= monthAgo).length

  // Open on this month (the bottom), or back where you were after viewing a day.
  useLayoutEffect(() => {
    window.scrollTo(0, savedScroll.current ?? document.documentElement.scrollHeight)
    savedScroll.current = null
  }, [savedScroll])

  return (
    <div>
      <h2>Calendar</h2>
      <p className="small" style={{ margin: '4px 0 0' }}>
        {workouts.length ? (
          <>
            <strong className="accent">
              {last30} workout{last30 === 1 ? '' : 's'}
            </strong>{' '}
            <span className="muted">in the last 30 days</span>
          </>
        ) : (
          <span className="muted">Finished workouts will show up here.</span>
        )}
      </p>

      <div className="cal-weekdays" aria-hidden="true">
        {WEEKDAYS.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>

      {monthsToShow(workouts, today).map((month) => {
        const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
        const lead = (month.getDay() + 6) % 7 // Monday-first offset
        return (
          <section key={dayKey(month)} className="cal-month">
            <h3 className="cal-month-title">
              {month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </h3>
            <div className="cal-grid">
              {Array.from({ length: lead }, (_, i) => (
                <span key={`pad-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const date = new Date(month.getFullYear(), month.getMonth(), i + 1, 12)
                const key = dayKey(date)
                const dayWorkouts = byDay.get(key) ?? []
                const cls = [
                  'cal-day',
                  dayWorkouts.length && 'on',
                  key === todayKey && 'today',
                  key > todayKey && 'future',
                ]
                  .filter(Boolean)
                  .join(' ')
                return dayWorkouts.length ? (
                  <button
                    key={key}
                    className={cls}
                    onClick={() => onOpenDay(key, dayWorkouts, date)}
                    aria-label={`${shortDay(date)}: ${dayWorkouts.map((w) => w.name).join(', ')}`}
                  >
                    {i + 1}
                  </button>
                ) : (
                  <span key={key} className={cls}>
                    {i + 1}
                  </span>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
