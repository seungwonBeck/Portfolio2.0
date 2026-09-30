import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { Btn, contactItems, initial, reducer } from '../store/nav'
import { projects } from '../types'
import { play, Sfx } from './useSound'

const KEYS: Record<string, Btn> = {
  ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
  Enter: 'A', z: 'A', Z: 'A',
  Escape: 'B', x: 'B', X: 'B', Backspace: 'B',
  h: 'HOME', H: 'HOME',
  y: 'Y', Y: 'Y', p: 'plus', P: 'plus', m: 'minus', M: 'minus',
}

const seen = () => { try { return !!localStorage.getItem('folio-seen') } catch { return false } }
const bootMs = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : seen() ? 500 : 2000

/** Keyboard, mouse and touch all funnel through press(). */
export function useControls() {
  const [state, dispatch] = useReducer(reducer, initial)
  const [pressed, setPressed] = useState<Btn | null>(null)
  const [sound, setSound] = useState(false) // off by default; first input enables audio context
  const [big, setBig] = useState(false)
  const [dark, setDark] = useState(false)
  const timer = useRef<number>()
  const ref = useRef({ state, sound })
  ref.current = { state, sound }

  useEffect(() => {
    if (state.screen !== 'BOOT') return
    const t = setTimeout(() => dispatch('A'), bootMs)
    try { localStorage.setItem('folio-seen', '1') } catch { /* private mode */ }
    return () => clearTimeout(t)
  }, [state.screen])

  useEffect(() => { // title splash after a cartridge is inserted, then on to the project
    if (state.screen !== 'LOAD') return
    const t = setTimeout(() => dispatch({ loaded: true }), 1500)
    return () => clearTimeout(t)
  }, [state.screen, state.proj])

  /** silent: the input comes from a stick, so don't animate a button on the body as if it was pressed */
  const press = useCallback((b: Btn, silent = false) => {
    const { state: s, sound } = ref.current
    if (b === 'minus') { setSound(!sound); if (!sound) play('select') }
    else if (b === 'plus') setBig(v => !v)
    else if (b === 'Y') setDark(v => !v)
    else if (sound) play(b === 'B' || b === 'HOME' ? 'back' : b === 'A' ? 'select' : 'move' as Sfx)
    if (!silent) {
      setPressed(b)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setPressed(null), 120)
    }

    if (b === 'A') {
      const url = s.screen === 'CONTACT' ? contactItems[s.contact].url
        : s.screen === 'DETAIL' ? projects[s.proj].links.demo : ''
      if (url) window.open(url, '_blank', 'noopener')
    }
    // long screens: up/down scroll the visible content
    if ((b === 'up' || b === 'down') && ['ABOUT', 'SKILLS', 'DETAIL'].includes(s.screen))
      document.querySelector('[data-scroll]')?.scrollBy({ top: b === 'up' ? -70 : 70, behavior: 'smooth' })
    if (b !== 'plus' && b !== 'minus' && b !== 'Y') dispatch(b)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if ((e.target as HTMLElement).closest('input,textarea')) return
      const b = KEYS[e.key]
      if (!b) { if (ref.current.state.screen === 'BOOT') dispatch('A'); return }
      e.preventDefault()
      if (!e.repeat) press(b)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [press])

  const pick = useCallback((i: number) => dispatch({ pick: i }), [])
  const goHome = useCallback(() => dispatch('HOME'), [])
  const open = useCallback((row: 'tile' | 'dock', i: number) => dispatch({ open: { row, i } }), [])
  const setAvatar = useCallback((i: number) => dispatch({ avatar: i }), [])
  const setOnly =useCallback((i: number | null) => dispatch({ only: i }), [])

  return { state, pressed, press, pick, goHome, setOnly, setAvatar, open, bootMs, sound, big, setBig, dark, toggleSound: () => press('minus') }
}
