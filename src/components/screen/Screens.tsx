import { ReactNode, RefObject, createContext, useContext, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BatteryFull, ExternalLink, FolderOpen, Footprints, Gamepad2, Gauge, LayoutGrid, Mail, Rocket, User } from 'lucide-react'
import { contactItems, DOCK, State, TILES } from '../../store/nav'
import { Avatar, AVATARS } from './avatars'
import { profile, projects, skills } from '../../types'

const tileIcon = { ABOUT: User, PROJECTS: FolderOpen, SKILLS: Gauge, CONTACT: Mail, GAME: Gamepad2 }
const Scroll = ({ children }: { children: ReactNode }) => (
  <div data-scroll className="h-full overflow-y-auto px-7 pb-6 [scrollbar-width:none]">{children}</div>
)
const Title = ({ children }: { children: ReactNode }) => (
  <h2 className="mb-3 text-[20px] font-extrabold tracking-tight">{children}</h2>
)

function Clock() {
  const [t, setT] = useState(() => new Date())
  useEffect(() => { const i = setInterval(() => setT(new Date()), 15000); return () => clearInterval(i) }, [])
  return <>{t.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}</>
}

export function Boot({ ms }: { ms: number }) {
  return (
    <motion.div className="grid h-full place-items-center bg-card"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: ms / 2000 }}>
      <div className="text-center">
        <div className="text-[44px] font-black tracking-tight">folio<span className="text-accent-red"> 2</span></div>
        <div className="label mt-1">press any key</div>
      </div>
    </motion.div>
  )
}

/** Lets tiles and dock icons be clicked/tapped (provided by App). */
export const AvatarContext = createContext<(i: number) => void>(() => {})
export const OpenContext = createContext<(row: 'tile' | 'dock', i: number) => void>(() => {})

const dockColor = { ABOUT: '#ff4b3e', PROJECTS: '#ff9f43', SKILLS: '#34c759', CONTACT: '#1fb6e8', GAME: '#8a8b90' }

/**
 * Console-style home: a row of large colored tiles — ABOUT, the project in the console (its title; "PROJECTS" if none),
 * CONTACT, GAME — followed by an empty slot that runs off the edge.
 */
function Home({ s }: { s: State }) {
  const label = (t: (typeof TILES)[number]) => (t === 'PROJECTS' && s.only !== null ? projects[s.only].title : t)
  const tileFocus = s.row === 'tile'
  const open = useContext(OpenContext)
  return (
    <div className="relative h-full">
      <div className="absolute inset-x-0 top-2 overflow-hidden py-3 pl-7">
      {/* the row slides left so the focused tile stays on screen (one tile = 132px + 12px gap) */}
      <motion.div className="flex gap-3" animate={{ x: -Math.max(0, s.home - 2) * 144 }} transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}>
        {TILES.map((t, i) => {
          const sel = tileFocus && i === s.home
          return (
            <div key={t} className="shrink-0">
              <motion.button aria-label={label(t)} onClick={() => open('tile', i)} animate={{ scale: sel ? 1.04 : 1 }}
                className={`relative block h-[132px] w-[132px] overflow-hidden rounded-xl text-left ${sel ? 'ring-[3px] ring-accent-blue ring-offset-[3px] ring-offset-white' : 'ring-1 ring-black/10'}`}>
                <Thumb i={i} className="absolute inset-0" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3 text-[15px] font-semibold leading-tight text-white">{label(t)}</div>
              </motion.button>
            </div>
          )
        })}
        <div className="shrink-0"><div className="h-[132px] w-[132px] rounded-xl bg-card ring-1 ring-black/10" /></div>
      </motion.div>
      </div>
      {/* dock: the five menus */}
      <div className="absolute inset-x-0 bottom-1 flex flex-col items-center">
        <div className="flex items-center gap-4 rounded-full bg-card px-5 py-2 ring-1 ring-black/10">
          {DOCK.map((t, i) => {
            const Icon = tileIcon[t]
            const sel = !tileFocus && i === s.dock
            return (
              <motion.button key={t} aria-label={t} onClick={() => open('dock', i)} animate={{ scale: sel ? 1.15 : 1 }}
                className={`grid h-9 w-9 place-items-center rounded-full ${sel ? 'ring-[3px] ring-accent-blue ring-offset-[2px] ring-offset-white' : ''}`}>
                <Icon size={22} strokeWidth={1.8} style={{ color: dockColor[t] }} />
              </motion.button>
            )
          })}
        </div>
        <div className="mt-1 h-4 text-[11px] font-semibold text-accent-blue">{tileFocus ? '' : DOCK[s.dock]}</div>
      </div>
    </div>
  )
}

function About({ s }: { s: State }) {
  const pick = useContext(AvatarContext)
  return (
    <Scroll>
      <Title>ABOUT ME</Title>
      <div className="mb-4 flex items-center gap-6">
        <div className="shrink-0 text-center">
          <Avatar i={s.avatar} className="h-[112px] w-[112px] ring-4 ring-white" />
          <div className="mt-1.5 text-[12px] font-extrabold">{profile.name}</div>
          <div className="text-[10px] text-ink-sub">{profile.role}</div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="label mb-2">Edit character · {AVATARS[s.avatar].name}</div>
          <div className="grid grid-cols-7 gap-1.5">
            {AVATARS.map((a, i) => (
              <button key={a.name} type="button" aria-label={a.name} onClick={() => pick(i)}
                className={`grid aspect-square place-items-center rounded-lg bg-card p-1 ${i === s.avatar ? 'ring-[3px] ring-accent-blue' : 'ring-1 ring-black/10'}`}>
                <Avatar i={i} className="h-full w-full" />
              </button>
            ))}
          </div>
          <p className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-ink-sub">
            <span className="rounded bg-card px-1.5 py-0.5 font-bold text-ink ring-1 ring-black/10">◀ ▶</span>
            키로 고르거나 직접 눌러서 프로필 사진을 바꿔보세요
          </p>
        </div>
      </div>
      <p className="mb-4 text-[13px] leading-relaxed">{profile.intro}</p>
      <div className="label mb-2">Timeline</div>
      {profile.timeline.map(t => (
        <div key={t.period} className="mb-3 border-l-2 border-accent-blue pl-3">
          <div className="text-[10px] font-semibold text-accent-blue">{t.period}</div>
          <div className="text-[13px] font-bold">{t.title}</div>
          <div className="text-[11px] text-ink-sub">{t.desc}</div>
        </div>
      ))}
    </Scroll>
  )
}

function Projects({ s }: { s: State }) {
  return (
    <div className="h-full overflow-y-auto px-7 pb-4 [scrollbar-width:none]">
      <Title>PROJECTS</Title>
      {projects.map((p, i) => (
        <div key={p.id} ref={el => { if (i === s.proj) el?.scrollIntoView({ block: 'nearest' }) }}
          className={`mb-2 flex items-center justify-between rounded-xl bg-card px-4 py-2.5
          ${i === s.proj ? 'ring-[3px] ring-accent-blue' : 'ring-1 ring-black/10'}`}>
          <div>
            <div className="text-[13px] font-bold">{p.title}</div>
            <div className="text-[11px] text-ink-sub">{p.summary}</div>
          </div>
          <span className="label">{p.period.slice(0, 4)}</span>
        </div>
      ))}
    </div>
  )
}

export function Thumb({ i, className = '' }: { i: number; className?: string }) {
  return <div className={`bg-gradient-to-br ${i % 2 ? 'from-accent-red to-device-body' : 'from-accent-blue to-device-body'} ${className}`} />
}

function Detail({ s }: { s: State }) {
  const p = projects[s.proj]
  return (
    <Scroll>
      <Thumb i={s.proj} className="mb-3 h-[90px] rounded-xl" />
      <h2 className="text-[20px] font-extrabold tracking-tight">{p.title}</h2>
      <p className="mb-2 text-[12px] text-ink-sub">{p.summary}</p>
      <p className="mb-3 text-[12px] leading-relaxed">{p.description}</p>
      <div className="mb-2 flex gap-6 text-[11px]"><div><div className="label">Role</div>{p.role}</div><div><div className="label">Period</div>{p.period}</div></div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {p.tags.map(t => <span key={t} className="rounded-full bg-card px-2 py-0.5 text-[10px] font-semibold ring-1 ring-black/10">{t}</span>)}
      </div>
      {p.links.demo && <div className="inline-flex items-center gap-1 rounded-full bg-accent-blue px-3 py-1 text-[11px] font-bold text-white">A · 보러가기 <ExternalLink size={12} /></div>}
    </Scroll>
  )
}

function Skills() {
  return (
    <Scroll>
      <Title>SKILLS</Title>
      {skills.map(g => (
        <div key={g.category} className="mb-3">
          <div className="label mb-1">{g.category}</div>
          {g.items.map(it => (
            <div key={it.name} className="mb-1 flex items-center gap-3 text-[12px]">
              <span className="w-[80px] font-semibold">{it.name}</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(n => <i key={n} className={`h-2 w-6 rounded-sm ${n <= it.level ? 'bg-accent-blue' : 'bg-black/10'}`} />)}
              </div>
              <span className="text-[10px] text-ink-sub">LV.{it.level}</span>
            </div>
          ))}
        </div>
      ))}
    </Scroll>
  )
}

function Contact({ s }: { s: State }) {
  return (
    <div className="px-7">
      <Title>CONTACT</Title>
      {contactItems.map((c, i) => (
        <div key={c.label} className={`mb-2 flex items-center justify-between rounded-xl bg-card px-4 py-2.5 text-[13px] font-bold
          ${i === s.contact ? 'ring-[3px] ring-accent-blue' : 'ring-1 ring-black/10'}`}>
          {c.label}<span className="flex items-center gap-1 text-[11px] font-normal text-ink-sub">{c.label === 'Email' ? profile.email : 'A · open'}<ExternalLink size={12} /></span>
        </div>
      ))}
    </div>
  )
}

const FRAMES = {
  run1: ['..............', '....bbbbbb....', '..bbbbbbbbbb..', '..bbbbbbbbbb..', '..bbwwbbwwbb..', '..bbwebbwebb..', '..bbbbbbbbbb..', '..bbbbrrbbbb..', '..bbbbbbbbbb..', '...bbbbbbbb...', '....bbbbbb....', '....bbbbbb....', '....nn..nn....', '...nnn..nnn...'],
  run2: ['..............', '....bbbbbb....', '..bbbbbbbbbb..', '..bbbbbbbbbb..', '..bbwwbbwwbb..', '..bbwebbwebb..', '..bbbbbbbbbb..', '..bbbbrrbbbb..', '..bbbbbbbbbb..', '...bbbbbbbb...', '....bbbbbb....', '....bbbbbb....', '.....nnnn.....', '.....nn.nn....'],
  jump: ['..............', '....bbbbbb....', '..bbbbbbbbbb..', '..bbbbbbbbbb..', '..bbwwbbwwbb..', '..bbwebbwebb..', '..bbbbbbbbbb..', '..bbbbrrbbbb..', '..bbbbbbbbbb..', '...bbbbbbbb...', '....bbbbbb....', '....bbbbbb....', '...nn....nn...', '..............'],
}
const PAL: Record<string, string> = { b: '#1fb6e8', n: '#0e7fa8', w: '#ffffff', e: '#16171a', r: '#ff4b3e' }
const GW = 576, GH = 200, GROUND = GH - 28, PX = 4, PW = 14 * PX

/** Lighten (+) / darken (-) a #rrggbb color. */
const shade = (hex: string, amt: number) => {
  const n = parseInt(hex.slice(1), 16)
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(v + (amt > 0 ? (255 - v) : v) * amt)))
  return `rgb(${ch(n >> 16)},${ch((n >> 8) & 255)},${ch(n & 255)})`
}

/** Draw a sprite as lit voxel cubes: bright top edge, dark bottom/right edge, plus a ground shadow that shrinks in the air. */
function drawVoxels(c: CanvasRenderingContext2D, rows: string[], x0: number, y0: number, air: number) {
  c.fillStyle = `rgba(0,0,0,${0.28 * (1 - Math.min(air / 140, 0.7))})`
  c.beginPath(); c.ellipse(x0 + PW / 2, GROUND + 5, PW * 0.5 * (1 - Math.min(air / 220, 0.5)), 5, 0, 0, 7); c.fill()
  rows.forEach((row, r) => [...row].forEach((ch, col) => {
    if (ch === '.') return
    const x = x0 + col * PX, y = y0 + r * PX, base = PAL[ch]
    c.fillStyle = base; c.fillRect(x, y, PX, PX)
    if (rows[r - 1]?.[col] !== ch) { c.fillStyle = shade(base, 0.4); c.fillRect(x, y, PX, 1) }
    else { c.fillStyle = shade(base, 0.12); c.fillRect(x, y, 1, PX) }
    c.fillStyle = shade(base, -0.32); c.fillRect(x, y + PX - 1, PX, 1); c.fillRect(x + PX - 1, y, 1, PX)
  }))
}

/** Side quest: an endless runner. A = jump, collect coins, dodge blocks. The hero is an original sprite. */
function Runner({ s }: { s: State }) {
  const cv = useRef<HTMLCanvasElement>(null)
  const seen = useRef(0)
  const [phase, setPhase] = useState<'idle' | 'play' | 'dead'>('idle')
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(() => { try { return +(localStorage.getItem('folio-run-best') ?? 0) } catch { return 0 } })
  const g = useRef({ y: 0, vy: 0, obs: [] as { x: number; w: number; h: number }[], coins: [] as { x: number; y: number }[], dist: 0, coinN: 0, next: 300 })

  const draw = (t: number) => {
    const c = cv.current?.getContext('2d'); if (!c) return
    const st = g.current
    c.clearRect(0, 0, GW, GH)
    c.fillStyle = '#cfe9f5'; c.fillRect(0, 0, GW, GH)
    c.fillStyle = 'rgba(255,255,255,.8)' // parallax clouds
    for (let i = 0; i < 3; i++) { const x = ((i * 240 - st.dist * 0.15) % (GW + 80) + GW + 80) % (GW + 80) - 40; c.fillRect(x, 30 + i * 22, 60, 14) }
    c.fillStyle = '#2a2b30'; c.fillRect(0, GROUND, GW, GH - GROUND)
    c.fillStyle = '#1fb6e8'; c.fillRect(0, GROUND, GW, 4)
    c.fillStyle = '#ff4b3e'
    for (const o of st.obs) c.fillRect(o.x, GROUND - o.h, o.w, o.h)
    c.fillStyle = '#f5c518'
    for (const k of st.coins) { c.beginPath(); c.arc(k.x, k.y, 7, 0, 7); c.fill() }
    const frame = st.y > 0 ? FRAMES.jump : phase === 'play' && Math.floor(st.dist / 22) % 2 ? FRAMES.run2 : FRAMES.run1
    drawVoxels(c, frame, 60, GROUND - 14 * PX - st.y, st.y)
    void t
  }

  useEffect(() => { draw(0) }, [phase])

  useEffect(() => { // A press: start / jump
    if (s.hits === seen.current) return
    seen.current = s.hits
    const st = g.current
    if (phase !== 'play') {
      Object.assign(st, { y: 0, vy: 0, obs: [], coins: [], dist: 0, coinN: 0, next: 300 })
      setScore(0); setPhase('play')
    } else if (st.y === 0) st.vy = 660
  }, [s.hits])

  useEffect(() => {
    if (phase !== 'play') return
    const st = g.current
    let id = 0, last = performance.now()
    const loop = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000); last = now
      const v = 260 + Math.min(st.dist / 40, 220) // px/s, ramps up
      st.dist += v * dt
      st.vy -= 2200 * dt; st.y = Math.max(0, st.y + st.vy * dt); if (st.y === 0) st.vy = 0
      for (const o of st.obs) o.x -= v * dt
      for (const k of st.coins) k.x -= v * dt
      st.obs = st.obs.filter(o => o.x > -50); st.coins = st.coins.filter(k => k.x > -20)
      st.next -= v * dt
      if (st.next <= 0) {
        const h = 24 + Math.random() * 22
        st.obs.push({ x: GW + 10, w: 26, h })
        if (Math.random() < 0.7) st.coins.push({ x: GW + 10 + 13, y: GROUND - h - 50 - Math.random() * 30 })
        st.next = 260 + Math.random() * 200
      }
      for (let i = st.coins.length - 1; i >= 0; i--) {
        const k = st.coins[i]
        if (k.x > 60 && k.x < 60 + PW && Math.abs(k.y - (GROUND - 30 - st.y)) < 34) { st.coins.splice(i, 1); st.coinN++ }
      }
      const total = Math.floor(st.dist / 10) + st.coinN * 10
      setScore(total)
      const hit = st.obs.some(o => o.x < 60 + PW - 12 && o.x + o.w > 72 && st.y < o.h - 4)
      draw(now)
      if (hit) {
        setPhase('dead')
        if (total > best) { setBest(total); try { localStorage.setItem('folio-run-best', String(total)) } catch { /* ignore */ } }
        return
      }
      id = requestAnimationFrame(loop)
    }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [phase])

  return (
    <div className="px-7">
      <div className="flex items-baseline justify-between">
        <Title>SIDE QUEST</Title>
        <span className="label">Score {score} · Best {best}</span>
      </div>
      <canvas ref={cv} width={GW} height={GH} className="w-full rounded-xl ring-1 ring-black/10" style={{ imageRendering: 'pixelated' }} />
      <p className="mt-2 text-[11px] text-ink-sub">
        {phase === 'idle' && 'A로 시작 · A로 점프 — 빨간 블록을 피하고 코인을 모으세요'}
        {phase === 'play' && 'A · 점프'}
        {phase === 'dead' && '앗! A로 다시 도전'}
      </p>
    </div>
  )
}

const best0 = (k: string) => { try { return +(localStorage.getItem(k) ?? 0) } catch { return 0 } }
const saveBest = (k: string, v: number) => { try { localStorage.setItem(k, String(v)) } catch { /* ignore */ } }
const FONT = '700 12px Paperlogy, sans-serif'

/** Shared shell for the canvas games: title, score line, canvas, hint. */
function Arcade({ title, score, best, cv, hint }: { title: string; score: number; best: number; cv: RefObject<HTMLCanvasElement>; hint: string }) {
  return (
    <div className="px-7">
      <div className="flex items-baseline justify-between">
        <Title>{title}</Title>
        <span className="label">Score {score} · Best {best}</span>
      </div>
      <canvas ref={cv} width={GW} height={GH} className="w-full rounded-xl ring-1 ring-black/10" style={{ imageRendering: 'pixelated' }} />
      <p className="mt-2 text-[11px] text-ink-sub">{hint}</p>
    </div>
  )
}

const SHAPES = [[[1, 1, 1, 1]], [[1, 1], [1, 1]], [[0, 1, 0], [1, 1, 1]], [[0, 1, 1], [1, 1, 0]], [[1, 1, 0], [0, 1, 1]], [[1, 0, 0], [1, 1, 1]], [[0, 0, 1], [1, 1, 1]]]
const BLOCK_COLORS = ['#1fb6e8', '#f5c518', '#a45cff', '#34c759', '#ff4b3e', '#3b6cff', '#ff9f43']
const CELL = 9, BX = 243, BY = 10
const rot = (m: number[][]) => m[0].map((_, i) => m.map(r => r[i]).reverse())

/** Falling-blocks puzzle. ◀▶ move · ▼ soft drop · ▲ hard drop · A rotate. */
function Blocks({ s }: { s: State }) {
  const cv = useRef<HTMLCanvasElement>(null)
  const seen = useRef(s.pad.n)
  const [phase, setPhase] = useState<'idle' | 'play' | 'dead'>('idle')
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(() => best0('folio-blocks-best'))
  const g = useRef({ b: [] as number[][], m: SHAPES[0], x: 3, y: 0, c: 0, nx: 0, acc: 0, lines: 0, score: 0, drop: false })
  const rnd = () => Math.floor(Math.random() * 7)

  const fits = (m: number[][], x: number, y: number) => m.every((r, j) => r.every((v, i) =>
    !v || (x + i >= 0 && x + i < 10 && y + j < 20 && !g.current.b[y + j]?.[x + i])))

  const spawn = () => { // false when the stack reached the top
    const st = g.current
    st.c = st.nx; st.m = SHAPES[st.c]; st.nx = rnd(); st.x = 3; st.y = 0
    return fits(st.m, st.x, st.y)
  }
  const lock = () => {
    const st = g.current
    st.m.forEach((r, j) => r.forEach((v, i) => { if (v) st.b[st.y + j][st.x + i] = st.c + 1 }))
    const rest = st.b.filter(r => r.some(v => !v)), n = 20 - rest.length
    st.b = [...Array.from({ length: n }, () => Array(10).fill(0)), ...rest]
    st.lines += n; st.score += [0, 100, 300, 500, 800][n]
    return spawn()
  }

  const cell = (c: CanvasRenderingContext2D, x: number, y: number, ci: number) => {
    const col = BLOCK_COLORS[ci - 1]
    c.fillStyle = col; c.fillRect(x, y, CELL, CELL)
    c.fillStyle = shade(col, 0.4); c.fillRect(x, y, CELL, 1)
    c.fillStyle = shade(col, -0.32); c.fillRect(x, y + CELL - 1, CELL, 1); c.fillRect(x + CELL - 1, y, 1, CELL)
  }
  const draw = () => {
    const c = cv.current?.getContext('2d'); if (!c) return
    const st = g.current
    c.fillStyle = '#16171a'; c.fillRect(0, 0, GW, GH)
    c.fillStyle = '#23252b'; c.fillRect(BX, BY, 10 * CELL, 20 * CELL)
    st.b.forEach((r, j) => r.forEach((v, i) => { if (v) cell(c, BX + i * CELL, BY + j * CELL, v) }))
    if (phase === 'play') st.m.forEach((r, j) => r.forEach((v, i) => { if (v) cell(c, BX + (st.x + i) * CELL, BY + (st.y + j) * CELL, st.c + 1) }))
    c.fillStyle = '#fff'; c.font = FONT
    c.fillText('NEXT', 350, 24); c.fillText(`LINES ${st.lines}`, 350, 110)
    SHAPES[st.nx].forEach((r, j) => r.forEach((v, i) => { if (v) cell(c, 350 + i * CELL, 34 + j * CELL, st.nx + 1) }))
  }
  useEffect(draw, [phase])

  useEffect(() => { // pad presses: A starts, then move / rotate / drop
    if (s.pad.n === seen.current) return
    seen.current = s.pad.n
    const st = g.current, b = s.pad.b
    if (phase !== 'play') {
      if (b !== 'A') return
      Object.assign(st, { b: Array.from({ length: 20 }, () => Array(10).fill(0)), acc: 0, lines: 0, score: 0, nx: rnd(), drop: false })
      spawn(); setScore(0); setPhase('play'); return
    }
    if (b === 'left' && fits(st.m, st.x - 1, st.y)) st.x--
    else if (b === 'right' && fits(st.m, st.x + 1, st.y)) st.x++
    else if (b === 'down' && fits(st.m, st.x, st.y + 1)) st.y++
    else if (b === 'up') { while (fits(st.m, st.x, st.y + 1)) st.y++; st.drop = true } // locks on the next frame
    else if (b === 'A') { const r = rot(st.m); if (fits(r, st.x, st.y)) st.m = r }
    draw()
  }, [s.pad.n])

  useEffect(() => {
    if (phase !== 'play') return
    const st = g.current
    let id = 0, last = performance.now()
    const loop = (now: number) => {
      st.acc += now - last; last = now
      const every = Math.max(120, 700 - st.lines * 30)
      let alive = true
      if (st.drop) { st.drop = false; st.acc = 0; alive = lock() }
      while (alive && st.acc >= every) {
        st.acc -= every
        if (fits(st.m, st.x, st.y + 1)) st.y++; else alive = lock()
      }
      setScore(st.score); draw()
      if (!alive) {
        setPhase('dead')
        if (st.score > best) { setBest(st.score); saveBest('folio-blocks-best', st.score) }
        return
      }
      id = requestAnimationFrame(loop)
    }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [phase])

  return <Arcade title="BLOCKS" score={score} best={best} cv={cv} hint={phase === 'idle' ? 'A로 시작 · ◀▶ 이동 · ▼ 내리기 · ▲ 바로 떨어뜨리기 · A 회전' : phase === 'play' ? 'A 회전 · ▲ 하드드롭' : '게임 오버! A로 다시 도전'} />
}

const SHIP = ['....a....', '...aaa...', '...aba...', '.aaaaaaa.', 'aacaaacaa', 'aa.....aa']
const BUG = ['.a.....a.', '..a...a..', '.aaaaaaa.', 'aabaaabaa', 'aaaaaaaaa', 'a.a...a.a']
/** Plain pixel blit (no shading): '.' is empty, other letters index the palette. */
function blit(c: CanvasRenderingContext2D, rows: string[], pal: Record<string, string>, x: number, y: number, px = 3) {
  rows.forEach((row, r) => [...row].forEach((ch, i) => { if (ch !== '.') { c.fillStyle = pal[ch]; c.fillRect(x + i * px, y + r * px, px, px) } }))
}
type Foe = { hx: number; hy: number; x: number; y: number; alive: boolean; dive: number; row: number }
const ROWS_COLOR = ['#ff4b3e', '#f5c518', '#34c759']
const newWave = (): Foe[] => Array.from({ length: 24 }, (_, i) => {
  const hx = 128 + (i % 8) * 46, hy = 24 + Math.floor(i / 8) * 26
  return { hx, hy, x: hx, y: -30, alive: true, dive: 0, row: Math.floor(i / 8) }
})

/** Space shooter: ◀▶ steer (keeps drifting until you press the other way or ▼) · A fire. */
function Starfighter({ s }: { s: State }) {
  const cv = useRef<HTMLCanvasElement>(null)
  const seen = useRef(s.pad.n)
  const [phase, setPhase] = useState<'idle' | 'play' | 'dead'>('idle')
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(() => best0('folio-star-best'))
  const g = useRef({ x: GW / 2, dir: 0, shots: [] as { x: number; y: number }[], bombs: [] as { x: number; y: number }[], foes: [] as Foe[], lives: 3, hurt: 0, score: 0, t: 0, nextDive: 1, wave: 1 })

  const draw = () => {
    const c = cv.current?.getContext('2d'); if (!c) return
    const st = g.current
    c.fillStyle = '#0d1020'; c.fillRect(0, 0, GW, GH)
    c.fillStyle = '#fff'
    for (let i = 0; i < 40; i++) c.fillRect((i * 97) % GW, (i * 53 + st.t * 40 * (1 + (i % 3))) % GH, 1, 1) // scrolling stars
    for (const f of st.foes) if (f.alive) blit(c, BUG, { a: ROWS_COLOR[f.row], b: '#fff' }, f.x - 13, f.y - 9)
    c.fillStyle = '#fff'; for (const b of st.shots) c.fillRect(b.x - 1, b.y - 6, 2, 8)
    c.fillStyle = '#ff9f43'; for (const b of st.bombs) c.fillRect(b.x - 1, b.y, 3, 6)
    if (!(st.hurt > 0 && Math.floor(st.hurt * 10) % 2)) blit(c, SHIP, { a: '#1fb6e8', b: '#fff', c: '#ff4b3e' }, st.x - 13, GH - 26)
    c.fillStyle = '#fff'; c.font = FONT; c.fillText('♥'.repeat(Math.max(st.lives, 0)), 8, 16)
  }
  useEffect(draw, [phase])

  useEffect(() => {
    if (s.pad.n === seen.current) return
    seen.current = s.pad.n
    const st = g.current, b = s.pad.b
    if (phase !== 'play') {
      if (b !== 'A') return
      Object.assign(st, { x: GW / 2, dir: 0, shots: [], bombs: [], foes: newWave(), lives: 3, hurt: 0, score: 0, t: 0, nextDive: 1, wave: 1 })
      setScore(0); setPhase('play'); return
    }
    if (b === 'left') st.dir = -1; else if (b === 'right') st.dir = 1; else if (b === 'down') st.dir = 0
    else if (b === 'A' && st.shots.length < 3) st.shots.push({ x: st.x, y: GH - 28 })
  }, [s.pad.n])

  useEffect(() => {
    if (phase !== 'play') return
    const st = g.current
    let id = 0, last = performance.now()
    const loop = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000); last = now
      st.t += dt; st.hurt = Math.max(0, st.hurt - dt)
      st.x = Math.max(14, Math.min(GW - 14, st.x + st.dir * 240 * dt))
      st.shots.forEach(b => { b.y -= 420 * dt }); st.shots = st.shots.filter(b => b.y > -8)
      st.bombs.forEach(b => { b.y += 150 * dt }); st.bombs = st.bombs.filter(b => b.y < GH)
      const sway = Math.sin(st.t * 1.4) * 26
      for (const f of st.foes) {
        if (!f.alive) continue
        if (f.dive) { // dive: sweep down toward the ship's column, then re-enter from the top
          f.dive += dt; f.y += (110 + st.wave * 12) * dt; f.x += Math.cos(f.dive * 4) * 70 * dt + (st.x - f.x) * 0.5 * dt
          if (Math.random() < dt * 0.6) st.bombs.push({ x: f.x, y: f.y + 8 })
          if (f.y > GH + 10) { f.dive = 0; f.y = -20 }
        } else {
          f.x = f.hx + sway; f.y += Math.min(f.hy - f.y, 90 * dt)
        }
        for (let i = st.shots.length - 1; i >= 0; i--) {
          const b = st.shots[i]
          if (Math.abs(b.x - f.x) < 14 && Math.abs(b.y - f.y) < 10) { f.alive = false; st.shots.splice(i, 1); st.score += f.dive ? 100 : 40; break }
        }
      }
      st.nextDive -= dt
      if (st.nextDive <= 0) {
        const pool = st.foes.filter(f => f.alive && !f.dive && Math.abs(f.y - f.hy) < 2)
        if (pool.length) pool[Math.floor(Math.random() * pool.length)].dive = 0.001
        st.nextDive = Math.max(0.5, 1.6 - st.wave * 0.2)
      }
      if (!st.hurt) {
        const hit = st.bombs.some(b => Math.abs(b.x - st.x) < 12 && b.y > GH - 26) ||
          st.foes.some(f => f.alive && Math.abs(f.x - st.x) < 18 && Math.abs(f.y - (GH - 18)) < 12)
        if (hit) { st.lives--; st.hurt = 1.4; st.bombs = [] }
      }
      if (!st.foes.some(f => f.alive)) { st.wave++; st.foes = newWave(); st.score += 200 }
      setScore(st.score); draw()
      if (st.lives <= 0) {
        setPhase('dead')
        if (st.score > best) { setBest(st.score); saveBest('folio-star-best', st.score) }
        return
      }
      id = requestAnimationFrame(loop)
    }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [phase])

  return <Arcade title="STAR FIGHTER" score={score} best={best} cv={cv} hint={phase === 'idle' ? 'A로 시작 · ◀▶ 조종(계속 이동) · ▼ 정지 · A 발사' : phase === 'play' ? 'A 발사 · ◀▶ 방향 전환' : '격추당했어요! A로 다시 도전'} />
}

const ARCADE = [
  { name: 'SIDE QUEST', sub: 'A · 점프', color: '#1fb6e8', Icon: Footprints, View: Runner },
  { name: 'BLOCKS', sub: '떨어지는 블록 쌓기', color: '#a45cff', Icon: LayoutGrid, View: Blocks },
  { name: 'STAR FIGHTER', sub: '우주 슈팅', color: '#ff4b3e', Icon: Rocket, View: Starfighter },
]

/** GAME tab: pick one of the mini games (◀▶ + A); B goes back to this menu. */
function Game({ s }: { s: State }) {
  if (s.gmode !== null) { const V = ARCADE[s.gmode].View; return <V s={s} /> }
  return (
    <div className="px-7">
      <Title>ARCADE</Title>
      <div className="grid grid-cols-3 gap-3">
        {ARCADE.map((a, i) => (
          <div key={a.name} className={`flex h-[120px] flex-col justify-between rounded-2xl p-4 text-white ${i === s.game ? 'ring-[3px] ring-accent-blue ring-offset-2' : ''}`} style={{ background: a.color }}>
            <a.Icon size={28} strokeWidth={2.2} />
            <div><div className="text-[14px] font-extrabold leading-tight">{a.name}</div><div className="text-[10px] opacity-80">{a.sub}</div></div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-ink-sub">◀▶ 선택 · A 시작 · B 뒤로</p>
    </div>
  )
}

/** Game-launch splash shown right after a cartridge goes in: the title fades up over a loading bar. */
function Splash({ s }: { s: State }) {
  const p = projects[s.proj]
  return (
    <div className="relative h-full overflow-hidden bg-black text-white">
      {/* bottom right: the title above the clockwise spinner */}
      <motion.div className="absolute bottom-6 right-8 flex flex-col items-end gap-3" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5, ease: 'easeOut' }}>
        <h1 className="font-display text-[22px] font-extrabold leading-none tracking-tight">{p.title}</h1>
        <div className="flex items-center gap-3">
        <span className="text-[11px] font-semibold tracking-[0.15em] text-white/60">NOW LOADING</span>
        <motion.svg width="30" height="30" viewBox="0 0 30 30" fill="none" animate={{ rotate: 360 }} transition={{ duration: 0.9, ease: 'linear', repeat: Infinity }}>
          <circle cx="15" cy="15" r="11" stroke="rgba(255,255,255,.28)" strokeWidth="3" />
          <circle cx="15" cy="15" r="11" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeDasharray="22 70" />
        </motion.svg>
        </div>
      </motion.div>
    </div>
  )
}

const views = { HOME: Home, ABOUT: About, PROJECTS: Projects, DETAIL: Detail, SKILLS: Skills, CONTACT: Contact, GAME: Game, LOAD: Detail } as const

type Motion = { d: number; cut: boolean }

export default function Screen({ s, bootMs, dark }: { s: State; bootMs: number; dark: boolean }) {
  // The black loading splash is an overlay that fades in over the old screen and fades out over the new one.
  // `base` is the screen underneath: it stays on the old screen until the overlay is opaque, then swaps to the project unseen.
  const loading = s.screen === 'LOAD'
  const [base, setBase] = useState(s.screen)
  useEffect(() => {
    if (!loading) return setBase(s.screen)
    const t = setTimeout(() => setBase('DETAIL'), 550)
    return () => clearTimeout(t)
  }, [s.screen, loading])
  const View = base === 'BOOT' ? null : views[base]
  const chrome = !!View
  const cut = loading // swaps that happen behind the opaque overlay are instant
  return (
    <div className={`relative screen-font flex h-full flex-col bg-screen text-ink ${dark ? 'screen-dark' : ''}`}>
      {chrome && (
        <motion.div className="flex items-center justify-between px-5 py-3 text-[11px] font-semibold" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          <span className="flex items-center gap-2">
            <Avatar i={s.avatar} className="h-6 w-6" />
            {profile.name}
          </span>
          <span className="flex items-center gap-2">
            {/* the cartridge in the console, next to the clock */}
            {s.only !== null && (
              <span className="mr-1 flex max-w-[190px] items-center gap-1.5 rounded-full bg-card px-2.5 py-1 ring-1 ring-black/10">
                <span className="h-3 w-2.5 shrink-0 bg-accent-blue" style={{ clipPath: 'polygon(0 0, 70% 0, 100% 20%, 100% 100%, 0 100%)', borderRadius: 1 }} />
                <span className="truncate text-[10px] font-bold">{projects[s.only].title}</span>
              </span>
            )}
            <Clock /><BatteryFull size={16} />
          </span>
        </motion.div>
      )}
      <div className="relative flex-1 overflow-hidden">
        {/* popLayout: the old screen fades out while the new one fades in (a dissolve with a slight slide), no gap in between */}
        <AnimatePresence mode="popLayout" initial={false} custom={{ d: s.dir, cut }}>
          <motion.div key={base} className="h-full"
            custom={{ d: s.dir, cut }}
            variants={{
              in: ({ d, cut }: Motion) => cut ? { x: 0, opacity: 1, scale: 1 } : { x: 28 * d, opacity: 0, scale: 0.985 },
              show: ({ cut }: Motion) => ({ x: 0, opacity: 1, scale: 1, transition: { duration: cut ? 0 : 0.5, ease: [0.4, 0, 0.2, 1] } }),
              out: ({ d, cut }: Motion) => cut ? { opacity: 0, transition: { duration: 0 } } : { x: -28 * d, opacity: 0, scale: 0.985, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } },
            }}
            initial="in" animate="show" exit="out">
            {View ? <View s={s} /> : <Boot ms={bootMs} />}
          </motion.div>
        </AnimatePresence>
      </div>
      {chrome && (
        <div className="flex gap-4 px-5 py-2 text-[10px] font-semibold text-ink-sub">
          <span>◀▶▲▼ 이동</span><span>A 선택</span><span>B 뒤로</span><span>H 홈</span>
        </div>
      )}
      <AnimatePresence>
        {loading && (
          <motion.div key="load" className="absolute inset-0 z-20" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.55, ease: 'easeInOut' }}>
            <Splash s={s} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
