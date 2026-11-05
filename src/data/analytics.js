// Anonymous usage counts with GoatCounter (https://www.goatcounter.com).
// No cookies, nothing personal: GoatCounter only sees that the app was opened
// and when a workout was finished. Workout contents never leave the phone.
//
// Put your GoatCounter code here: for https://facu-gym.goatcounter.com it is 'facu-gym'.
// While it's empty, nothing is loaded or counted.
const GOATCOUNTER_CODE = 'gym-tracker'

// Only the published app is counted, not `npm run dev` on your computer.
const enabled = GOATCOUNTER_CODE !== '' && import.meta.env.PROD

// Loads GoatCounter's script. It counts one visit ("app opened") as soon as it loads.
// With no signal at the gym the script just fails quietly and the app works as normal.
export function loadAnalytics() {
  if (!enabled) return
  const script = document.createElement('script')
  script.async = true
  script.src = 'https://gc.zgo.at/count.js'
  script.dataset.goatcounter = `https://${GOATCOUNTER_CODE}.goatcounter.com/count`
  document.head.appendChild(script)
}

// Counts a named event, e.g. trackEvent('workout-finished', 'Workout finished').
// Events show up in GoatCounter alongside page visits.
export function trackEvent(name, title = name) {
  if (!enabled) return
  try {
    window.goatcounter?.count?.({ path: name, title, event: true })
  } catch {
    // Counting must never break the app.
  }
}
