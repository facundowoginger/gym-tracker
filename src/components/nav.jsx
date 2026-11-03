import { useState } from 'react'

// A simple screen stack for one tab. Opening something (a row with ›) pushes a screen
// that slides in from the right; going back pops it and the previous screen slides in
// from the left.
export function useNav(root) {
  const [state, setState] = useState({ stack: [root], dir: null })
  const go = (stack, dir) => {
    setState({ stack, dir })
    window.scrollTo(0, 0)
  }
  return {
    view: state.stack.at(-1),
    depth: state.stack.length,
    dir: state.dir,
    push: (view) => go([...state.stack, view], 'forward'),
    pop: () => go(state.stack.length > 1 ? state.stack.slice(0, -1) : state.stack, 'back'),
    home: () => go([state.stack[0]], 'back'),
  }
}

// Wraps the current screen. A new key on each navigation replays the slide.
export function Screen({ nav, children }) {
  const key = `${nav.depth}-${nav.view.type}-${nav.view.id ?? ''}`
  return (
    <div key={key} className={nav.dir ? `screen slide-${nav.dir}` : 'screen'}>
      {children}
    </div>
  )
}
