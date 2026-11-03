import { useState } from 'react'
import Plates from './Plates'

// Opening screen: "Workout" with "START" underneath. Tapping anywhere slides it up
// and off the top, revealing the app underneath.
export default function Splash({ onDone }) {
  const [leaving, setLeaving] = useState(false)

  function start() {
    if (leaving) return
    setLeaving(true)
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    // Remove the screen once the slide has finished (immediately if motion is reduced).
    setTimeout(onDone, reduceMotion ? 0 : 560)
  }

  return (
    <div
      className={leaving ? 'splash leaving' : 'splash'}
      role="button"
      tabIndex={0}
      aria-label="Start"
      autoFocus
      onClick={start}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && start()}
    >
      <Plates />
      <span className="splash-title">Workout</span>
      <span className="splash-sub">START</span>
    </div>
  )
}
