import { profile, projects } from '../types'

export type Screen = 'BOOT' | 'HOME' | 'ABOUT' | 'PROJECTS' | 'DETAIL' | 'SKILLS' | 'CONTACT' | 'GAME' | 'LOAD'
export type Btn = 'up' | 'down' | 'left' | 'right' | 'A' | 'B' | 'HOME' | 'plus' | 'minus' | 'Y'

export const TILES = ['ABOUT', 'PROJECTS', 'SKILLS', 'CONTACT', 'GAME'] as const
export const contactItems = [
  { label: 'Email', url: `mailto:${profile.email}` },
  ...profile.links,
]

/** The dock under the tiles: all five menus. */
export const DOCK = ['ABOUT', 'PROJECTS', 'SKILLS', 'CONTACT', 'GAME'] as const

/** only: cartridge currently in the console (it becomes the project tile on HOME), or null. row/dock: focus on HOME (tiles or dock). */
export interface State {
  screen: Screen; home: number; proj: number; contact: number; hits: number
  only: number | null; row: 'tile' | 'dock'; dock: number; dir: 1 | -1
  /** GAME screen: game (menu focus), gmode (running game, null = menu), pad (last button pressed inside a game; n counts presses) */
  game: number; gmode: number | null; pad: { n: number; b: Btn }
  /** ABOUT screen: selected profile picture (0 = ID photo) */
  avatar: number
}
export const AVATAR_COUNT = 7
export const AVATAR_ORDER = [0, 2, 3, 4, 5, 6] // picker order; 1 (ID photo) is coin-only
export const initial: State = { screen: 'BOOT', home: 0, proj: 0, contact: 0, hits: 0, only: null, row: 'tile', dock: 0, dir: 1, game: 0, gmode: null, pad: { n: 0, b: 'A' }, avatar: 0 }

const clamp = (n: number, len: number) => Math.max(0, Math.min(len - 1, n))

/** pick: cartridge inserted → title splash (LOAD). loaded: splash finished → project detail (ignored if the user already left). */
export type Action = Btn | { pick: number } | { loaded: true } | { only: number | null } | { open: { row: 'tile' | 'dock'; i: number } } | { avatar: number } | { rowPick: { screen: 'PROJECTS' | 'CONTACT' | 'GAME'; i: number } }

export const GAMES = 4

/** Entering GAME always lands on the game menu. */
export function reducer(s: State, b: Action): State {
  const n = step(s, b)
  return n.screen === 'GAME' && s.screen !== 'GAME' ? { ...n, gmode: null } : n
}

function step(s: State, b: Action): State {
  if (typeof b === 'object') {
    if ('only' in b) return { ...s, only: b.only }
    if ('avatar' in b) return { ...s, avatar: clamp(b.avatar, AVATAR_COUNT) }
    if ('open' in b) { // mouse/touch on a tile or dock icon: same as focusing it and pressing A
      const { row, i } = b.open
      if (s.screen === 'BOOT' || s.screen === 'LOAD') return s
      if (s.screen !== 'HOME' && !(row === 'dock' && DOCK[i] === 'ABOUT')) return s // 프로필 클릭: 어느 화면에서든 ABOUT으로 이동
      if (row === 'dock') return { ...s, row, dock: i, screen: DOCK[i], hits: 0, dir: 1 }
      if (TILES[i] === 'PROJECTS' && s.only !== null) return { ...s, row, home: i, screen: 'DETAIL', proj: s.only, dir: 1 }
      return { ...s, row, home: i, screen: TILES[i], hits: 0, dir: 1 }
    }
    if ('rowPick' in b) { // mouse/touch on a project row, contact row or arcade card: same as moving the cursor there and pressing A
      const { screen, i } = b.rowPick
      if (s.screen !== screen) return s
      if (screen === 'PROJECTS') return { ...s, proj: clamp(i, projects.length), screen: 'DETAIL', dir: 1 }
      if (screen === 'CONTACT') return { ...s, contact: clamp(i, contactItems.length) }
      return s.gmode === null ? { ...s, game: clamp(i, GAMES), gmode: clamp(i, GAMES), hits: 0 } : s
    }
    if ('loaded' in b) return s.screen === 'LOAD' ? { ...s, screen: 'DETAIL', dir: 1 } : s
    return { ...s, screen: 'LOAD', proj: clamp(b.pick, projects.length), dir: 1 }
  }
  if (s.screen === 'BOOT') return { ...s, screen: 'HOME' }
  if (b === 'HOME') return s.screen === 'HOME' ? s : { ...s, screen: 'HOME', dir: -1 }
  if (s.screen === 'GAME' && ['up', 'down', 'left', 'right', 'A', 'B'].includes(b)) {
    if (b === 'B') return s.gmode === null ? { ...s, screen: 'HOME', dir: -1 } : { ...s, gmode: null }
    if (s.gmode === null) {
      if (b === 'A') return { ...s, gmode: s.game, hits: 0 }
      return { ...s, game: clamp(s.game + (b === 'left' || b === 'up' ? -1 : 1), GAMES) }
    }
    return { ...s, hits: b === 'A' ? s.hits + 1 : s.hits, pad: { n: s.pad.n + 1, b: b as Btn } } // running game reads pad/hits
  }
  const d = b === 'left' || b === 'up' ? -1 : 1
  switch (b) {
    case 'left': case 'right':
      if (s.screen === 'ABOUT' && s.avatar === 1) return s // the real photo stays until the coin is clicked again
      if (s.screen === 'ABOUT') { // keys walk the picker (ME + characters); the real photo (1) only comes from flipping the coin
        const o = AVATAR_ORDER, i = o.indexOf(s.avatar)
        return { ...s, avatar: o[i < 0 ? 0 : clamp(i + d, o.length)] }
      }
      if (s.screen !== 'HOME') return s
      return s.row === 'tile' ? { ...s, home: clamp(s.home + d, TILES.length) } : { ...s, dock: clamp(s.dock + d, DOCK.length) }
    case 'up': case 'down':
      if (s.screen === 'HOME') return { ...s, row: b === 'up' ? 'tile' : 'dock' }
      if (s.screen === 'PROJECTS') return { ...s, proj: clamp(s.proj + d, projects.length) }
      if (s.screen === 'CONTACT') return { ...s, contact: clamp(s.contact + d, contactItems.length) }
      return s
    case 'A':
      if (s.screen === 'HOME' && s.row === 'dock') return { ...s, screen: DOCK[s.dock], hits: 0, dir: 1 }
      // the project tile is the cartridge in the console: it opens that project, or the list if nothing is inserted
      if (s.screen === 'HOME' && TILES[s.home] === 'PROJECTS' && s.only !== null) return { ...s, screen: 'DETAIL', proj: s.only, dir: 1 }
      if (s.screen === 'HOME') return { ...s, screen: TILES[s.home], hits: 0, dir: 1 }
      if (s.screen === 'PROJECTS') return { ...s, screen: 'DETAIL', dir: 1 }
      if (s.screen === 'GAME') return { ...s, hits: s.hits + 1 } // Game screen reads this as its A-press signal
      return s
    case 'B':
      if (s.screen !== 'HOME') return { ...s, screen: 'HOME', dir: -1 }
      return s
    default:
      return s
  }
}
