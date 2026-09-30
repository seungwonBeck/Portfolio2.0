import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { MotionValue, motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import { X } from 'lucide-react'
import { ContactForm, Guestbook } from './components/layout/Forms'
import { Music, SoundButton } from './components/layout/Music'
import Console, { CANVAS } from './components/device/Console'
import Screen, { OpenContext } from './components/screen/Screens'
import { projects } from './types'
import { CardFace, Cartridges, chipScale, FallbackList, Footer, Header, HowToPlay, IntroCopy, Showcase } from './components/layout/Layout'
import { useControls } from './hooks/useControls'

/** Scales the fixed-size console to its container's width, and to maxH if given. */
function Scaled({ children, maxH = Infinity }: { children: React.ReactNode; maxH?: number }) {
  const box = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(CANVAS.w)
  useLayoutEffect(() => {
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width))
    ro.observe(box.current!)
    return () => ro.disconnect()
  }, [])
  const k = Math.min(w, maxH * (CANVAS.w / CANVAS.h)) / CANVAS.w
  return (
    <div ref={box} className="w-full" style={{ '--k': k } as React.CSSProperties}>
      <div className="mx-auto" style={{ width: CANVAS.w * k, height: CANVAS.h * k }}>
        <div style={{ width: CANVAS.w, height: CANVAS.h, transform: `scale(${k})`, transformOrigin: 'top left' }}>{children}</div>
      </div>
    </div>
  )
}

const CAPTIONS = [
  { a: 0.12, b: 0.46, t: 'Two halves, one maker.', d: '디자인과 개발, 두 손으로 만듭니다. 조이콘처럼 떼어도 붙여도 하나.' },
  { a: 0.48, b: 0.64, t: 'Click.', d: '딱, 하고 맞물리는 순간.' },
  { a: 0.7, b: 0.94, t: 'Big screen, big ideas.', d: '작은 화면 속 이야기 — 아래에서 직접 눌러보세요.' },
]

function Fade({ p, keys, vals, children }: { p: MotionValue<number>; keys: number[]; vals: number[]; children: React.ReactNode }) {
  return <motion.div style={{ opacity: useTransform(p, keys, vals) }}>{children}</motion.div>
}

function Caption({ p, a, b, t, d }: { p: MotionValue<number>; a: number; b: number; t: string; d: string }) {
  const opacity = useTransform(p, [a, a + 0.03, b - 0.03, b], [0, 1, 1, 0])
  const y = useTransform(p, [a, a + 0.04], [16, 0])
  return (
    <motion.div style={{ opacity, y }} className="absolute left-0 top-0">
      <h2 className="font-display text-3xl font-black tracking-tight md:text-4xl">{t}</h2>
      <p className="mt-2 text-sm text-ink-sub md:text-base">{d}</p>
    </motion.div>
  )
}

/**
 * Hero. The console is playable from the first screen. Scrolling pins it and (1) detaches the Joy-Cons while it tilts
 * left/right, (2) snaps them back, (3) eases in toward the screen, then settles back to normal.
 */
function Hero({ children, onPick, away }: { children: (sep: MotionValue<number>) => React.ReactNode; onPick: (i: number, from: DOMRect) => void; away: number | null }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const [vh, setVh] = useState(innerHeight)
  const [, force] = useState(0)
  useEffect(() => {
    const f = () => { setVh(innerHeight); force(n => n + 1) } // width changes matter too (console size)
    addEventListener('resize', f)
    return () => removeEventListener('resize', f)
  }, [])
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const soft = { stiffness: 55, damping: 24, mass: 1.2 } // slow, no overshoot: smooth zoom
  // low damping on purpose: re-attach overshoots a little, which reads as a "click"
  const sep = useSpring(useTransform(p, [0.12, 0.28, 0.46, 0.6], [0, 320, 320, 0]), { stiffness: 140, damping: 13 })
  const rotateY = useSpring(useTransform(p, [0.12, 0.24, 0.36, 0.48, 0.6], [0, -9, 9, -6, 0]), soft)
  const scale = useSpring(useTransform(p, [0, 0.12, 0.28, 0.6, 0.72, 0.88, 0.95, 1], [1, 1, 0.92, 0.96, 1, 1.35, 1.35, 1]), soft)
  // Once pinned, ease the console from its 80px-below-the-chips spot to the vertical center of the viewport.
  const maxH = Math.max(300, vh - 560) // title + chips + gaps take ~550px, so title, chips and console all fit one viewport
  const est = Math.min(maxH, (innerWidth - (innerWidth >= 768 ? 160 : 40)) * (CANVAS.h / CANVAS.w)) // rendered console height
  // chip row spans the console from Joy-Con seam to Joy-Con seam (233..1520 of the 1760px canvas)
  const rowW = (est * CANVAS.w / CANVAS.h) * ((1520 - 233) / CANVAS.w)
  const centerY = useRef(0)
  centerY.current = Math.max(0, (vh - est) / 2 - 80)
  const toCenter = useTransform(p, v => Math.min(1, v / 0.06) * centerY.current)
  const zoomY = useTransform(p, [0.72, 0.88, 0.95, 1], [0, 60, 60, 0])
  const y = useSpring(useTransform([toCenter, zoomY], ([a, b]: number[]) => a + b), soft)

  // centered stack: title, 160px, cartridges, 160px, console
  const top = (
    <section className="flex flex-col items-center px-5 pt-14 md:px-20">
      <div className="grid w-full items-start gap-8 md:grid-cols-[7fr_3fr] lg:gap-12"><IntroCopy /><HowToPlay /></div>
      <div className="mt-14 w-full"><Cartridges onPick={onPick} width={rowW} away={away} /></div>
    </section>
  )
  const guide = null // how-to-play now sits beside the title
  if (reduce) return <>{top}<div className="mt-20 px-5 md:px-20"><Scaled>{children(sep)}</Scaled></div>{guide}</>
  return (
    <>
      {top}
      <div ref={ref} className="relative h-[450vh]" style={{ marginBottom: -Math.max(0, (vh - est) / 2 - 24) }} /* pull the next section up under the console's empty lower half */>
        <div className="sticky top-0 flex h-screen flex-col items-center overflow-hidden px-5 pt-14 md:px-20" style={{ perspective: 1800, '--chipw': `${90 * chipScale(rowW)}px` } as React.CSSProperties}>
          <div className="pointer-events-none absolute left-5 top-20 z-10 w-[32rem] max-w-[85vw] md:left-20">
            {CAPTIONS.map(c => <Caption key={c.t} p={p} {...c} />)}
          </div>
          <motion.div className="w-full" style={{ scale, rotateY, y }}>
            <Scaled maxH={maxH}>{children(sep)}</Scaled>
          </motion.div>
          <p className="label mt-4 text-center sm:hidden">Tip: 가로 모드로 보면 더 커요</p>
        </div>
      </div>
      {guide}
    </>
  )
}

/**
 * A cartridge pulled out of the holder: it flies above the console's top-right edge, pushes in, bounces back up once,
 * then slides fully in (the part that has entered is clipped away).
 */
function Flying({ i, from, to, eject, onDone }: { i: number; from: DOMRect; to: { x: number; y: number }; eject?: boolean; onDone: () => void }) {
  const dx = to.x - (from.left + from.width / 2)
  const k = from.width / 90 // the holder scales down on narrow screens; the flying card follows
  const contact = to.y - 62 * k - (from.top + 62 * k) // card center offset when its pins touch the top edge
  const IN = 124 * k // slides in by its full height, so it is clipped away by the edge rather than faded
  // insertion depth (px hidden) at each keyframe: 0 until the card touches the edge, slides in to 16px shy, clicks back 6px, pushes home
  const DEPTH = [0, 0, 0, 0, IN - 16, IN - 22, IN, IN]
  // lift out → one diagonal glide to hover over the slot → lower until it touches → slide in → click → push home
  const frames = {
    x: [0, 4, dx, dx, dx, dx, dx, dx],
    rotate: [0, -4, 0, 0, 0, 0, 0, 0], // tilts slightly while carried, straightens as it lines up
    scale: [1, 1.05, 1.02, 1, 1, 1, 1, 1],
    y: [0, -14, contact - 26, ...DEPTH.slice(3).map(d => contact + d)],
    clipPath: DEPTH.map(d => `inset(0px 0px ${d}px 0px)`),
  }
  type Ease = number[] | 'linear'
  let times = [0, 0.12, 0.5, 0.6, 0.82, 0.88, 0.97, 1]
  let ease: Ease[] = [[0.3, 0, 0.2, 1], [0.45, 0, 0.2, 1], [0.2, 0.6, 0.3, 1], [0.4, 0, 0.3, 1], [0.2, 0.8, 0.3, 1], [0.5, 0, 0.75, 0.4], 'linear']
  let anim: Record<string, (number | string)[]> = frames
  if (eject) { // the same path played backwards: pops out of the console, then glides back to its pocket in the holder
    // no tilt, scale-up or sideways jog on the way back: those were the "lift-off" wobble of the insert path and looked odd at the landing
    // and the insert path's "click" rebound played backwards made the card slip out, then dip back in: use a steadily increasing depth instead
    const D = [0, 0, 0, 0, IN - 44, IN - 22, IN, IN]
    const calm = {
      x: frames.x.map((v, n) => (n === 1 ? 0 : v)), rotate: frames.rotate.map(() => 0), scale: frames.scale.map(() => 1),
      y: [0, -6, contact - 26, ...D.slice(3).map(d => contact + d)],
      clipPath: D.map(d => `inset(0px 0px ${d}px 0px)`),
    }
    anim = Object.fromEntries(Object.entries(calm).map(([k, v]) => [k, [...v].reverse()]))
    times = times.map(t => 1 - t).reverse()
    ease = [...ease].reverse().map(e => (e === 'linear' ? e : [1 - e[2], 1 - e[3], 1 - e[0], 1 - e[1]]))
  }
  return (
    <motion.div aria-hidden className="pointer-events-none fixed z-40" style={{ left: from.left, top: from.top, width: 90 * k, height: 124 * k }}
      initial={{ x: anim.x[0], y: anim.y[0], rotate: anim.rotate[0], scale: anim.scale[0], clipPath: anim.clipPath[0] as string, opacity: 1 }}
      animate={anim}
      transition={{ duration: eject ? 1.4 : 1.7, times, ease: ease as never }}
      onAnimationComplete={onDone}>
      <div className="relative [filter:drop-shadow(0_6px_4px_rgba(0,0,0,.25))]" style={{ width: 90, height: 124, transform: `scale(${k})`, transformOrigin: 'top left' }}><CardFace i={i} title={projects[i].title} /></div>
    </motion.div>
  )
}

/** "TV mode": the device screen blown up to the whole page. */
function TvMode({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  const k = Math.min(innerWidth / 640, innerHeight / 360)
  return (
    <div role="dialog" aria-label="화면 크게 보기" className="fixed inset-0 z-50 grid place-items-center bg-black">
      <div className="overflow-hidden" style={{ width: 640 * k, height: 360 * k }}>
        <div style={{ width: 640, height: 360, transform: `scale(${k})`, transformOrigin: 'top left' }}>{children}</div>
      </div>
      <button onClick={onClose} aria-label="닫기 (P)" className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"><X size={20} /></button>
    </div>
  )
}

export default function App() {
  const { state, pressed, press, pick, goHome, setOnly, open, bootMs, sound, big, setBig, dark, toggleSound } = useControls()
  type Fly = { i: number; from: DOMRect; to: { x: number; y: number }; eject?: boolean; next?: () => void }
  const [fly, setFly] = useState<Fly | null>(null)
  const [inserted, setInserted] = useState<number | null>(null) // the cartridge currently in the console; its pocket stays empty
  const reduce = useReducedMotion()
  const insert =(i: number, from: DOMRect) => {
    if (fly || i === inserted) return
    const c = document.getElementById('console')?.getBoundingClientRect()
    if (!c || reduce) { setInserted(i); setOnly(i); return pick(i) }
    const k = c.width / CANVAS.w
    const to = { x: c.left + 1330 * k, y: c.top + 17 * k } // top edge of the tablet, right side
    const start = () => {
      setInserted(i)
      setFly({ i, from, to })
      // the console only "knows" the cartridge (title in the top bar, project tile) once it has slid all the way in
      setTimeout(() => { setOnly(i); pick(i) }, 1600)
    }
    const slot = inserted === null ? null : document.querySelector(`[data-slot="${inserted}"]`)?.getBoundingClientRect()
    if (inserted !== null && slot) { // swap: take the current cartridge out and return it to its pocket first
      setOnly(null) // the old title goes away as soon as the cartridge is pulled out
      goHome()
      setFly({ i: inserted, from: slot, to, eject: true, next: () => { setInserted(null); start() } })
    } else start()
  }
  return (
    <OpenContext.Provider value={open}>
      <Header />
      {fly && <Flying {...fly} onDone={() => { const n = fly.next; setFly(null); n?.() }} />}
      <Hero onPick={insert} away={fly ? fly.i : inserted}>
        {sep => (
          <Console pressed={pressed} press={press} sep={sep}>
            {!big && <Screen s={state} bootMs={bootMs} dark={dark} />}
          </Console>
        )}
      </Hero>
      <Showcase />
      <Footer sound={sound} onToggle={toggleSound} />
      <Music on={sound} />
      <SoundButton sound={sound} onToggle={toggleSound} />
      {big && <TvMode onClose={() => setBig(false)}><Screen s={state} bootMs={bootMs} dark={dark} /></TvMode>}
    </OpenContext.Provider>
  )
}
