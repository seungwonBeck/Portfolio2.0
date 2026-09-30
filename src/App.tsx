import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { MotionValue, motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import { X } from 'lucide-react'
import { ContactForm, Guestbook } from './components/layout/Forms'
import { Music, SoundButton } from './components/layout/Music'
import Console, { CANVAS } from './components/device/Console'
import Logo from './components/Logo'
import Screen, { AvatarContext, OpenContext } from './components/screen/Screens'
import { projects } from './types'
import { CardFace, Cartridges, CaseRack, chipScale, FallbackList, Footer, Header, HowToPlay, IntroCopy, Showcase } from './components/layout/Layout'
import MobilePad from './components/layout/MobilePad'
import { useControls } from './hooks/useControls'
import type { Btn } from './store/nav'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react'

/** Scales the fixed-size console to its container's width, and to maxH if given. `dockY` lowers only the console; `overlay` (the dock) stays put. */
function Scaled({ children, maxH = Infinity, dockY, screenOff, overlay }: { children: React.ReactNode; maxH?: number; dockY?: MotionValue<string>; screenOff?: MotionValue<number>; overlay?: React.ReactNode }) {
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
      <div className="relative mx-auto" style={{ width: CANVAS.w * k, height: CANVAS.h * k }}>
        <motion.div className="absolute inset-0" style={dockY ? { y: dockY } : undefined}>
          <div style={{ width: CANVAS.w, height: CANVAS.h, transform: `scale(${k})`, transformOrigin: 'top left' }}>{children}</div>
          {screenOff && <motion.div aria-hidden className="pointer-events-none absolute bg-[#08080a]" style={{ opacity: screenOff, left: '18%', top: '9.35%', width: '63.5%', height: '81.7%' }} />}
        </motion.div>
        {overlay}
      </div>
    </div>
  )
}

const CAPTIONS = [
  { s: 'o', a: 0.12, b: 0.46, t: 'Two halves, one maker.', d: '디자인과 개발, 두 손으로 만듭니다. 조이콘처럼 떼어도 붙여도 하나.' },
  { s: 'o', a: 0.48, b: 0.64, t: 'Click.', d: '딱, 하고 맞물리는 순간.' },
  { s: 'q', a: 0.04, b: 0.4, t: 'Dock in.', d: '딸깍, 독에 꽂으면 — 이제 거실로 나갈 시간이에요.', light: true },
] as const

function Fade({ p, keys, vals, children }: { p: MotionValue<number>; keys: number[]; vals: number[]; children: React.ReactNode }) {
  return <motion.div style={{ opacity: useTransform(p, keys, vals) }}>{children}</motion.div>
}

function Caption({ p, a, b, t, d, light }: { p: MotionValue<number>; a: number; b: number; t: string; d: string; light?: boolean }) {
  const opacity = useTransform(p, [a, a + 0.03, b - 0.03, b], [0, 1, 1, 0])
  const y = useTransform(p, [a, a + 0.04], [16, 0])
  return (
    <motion.div style={{ opacity, y }} className={`absolute left-0 top-0 ${light ? 'text-white' : ''}`}>
      <h2 className="font-display text-3xl font-black tracking-tight md:text-4xl">{t}</h2>
      <p className={`mt-2 text-sm md:text-base ${light ? 'text-white/70' : 'text-ink-sub'}`}>{d}</p>
    </motion.div>
  )
}

/** Controller halves at the bottom corners of the TV scene: a D-pad on the left, face buttons on the right. Hand-drawn style arrow above says what they are. */
function SideCtrl({ side, press }: { side: 'l' | 'r'; press: (b: Btn) => void }) {
  const btn = (b: Btn, node: React.ReactNode, cls = '') => (
    <button type="button" aria-label={b} onPointerDown={e => { e.preventDefault(); press(b) }}
      className={`grid h-9 w-9 touch-manipulation place-items-center rounded-full bg-[#1b1c1f] text-[13px] font-extrabold text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,.14),0_2px_3px_rgba(0,0,0,.5)] active:scale-90 active:bg-[#0f1012] ${cls}`}>{node}</button>
  )
  const arrow = <svg aria-hidden viewBox="0 0 40 44" className="mx-auto h-11 w-10" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 3 C 16 14 24 22 20 36 M11 28 L20 38 L30 28" /></svg>
  return (
    <div className={`absolute bottom-0 z-10 flex flex-col items-center ${side === 'l' ? 'left-[6%]' : 'right-[6%]'}`} style={{ width: 132 }}>
      <span className="text-[12px] font-bold text-white/70">{side === 'l' ? '방향키로 이동' : 'A 로 선택'}</span>
      {arrow}
      <div className="relative h-[150px] w-full overflow-hidden rounded-t-[66px]" style={{ background: 'linear-gradient(180deg,#3d3e42,#2a2b2e 40%,#1f2023)', boxShadow: 'inset 0 2px 0 rgba(255,255,255,.18), 0 -6px 24px rgba(0,0,0,.4)' }}>
        <div className="absolute left-1/2 top-[26px] grid -translate-x-1/2 grid-cols-3 gap-[2px]">
          {side === 'l' ? (<>
            <span />{btn('up', <ChevronUp size={18} />)}<span />
            {btn('left', <ChevronLeft size={18} />)}<span />{btn('right', <ChevronRight size={18} />)}
            <span />{btn('down', <ChevronDown size={18} />)}<span />
          </>) : (<>
            <span />{btn('HOME', 'X')}<span />
            {btn('Y', 'Y')}<span />{btn('A', 'A', '!bg-accent-red')}
            <span />{btn('B', 'B')}<span />
          </>)}
        </div>
      </div>
    </div>
  )
}

/** The dock: a dark front panel that hides the lower console, with our logo on it. */
function Dock() {
  return (
    <div aria-hidden className="absolute z-20" style={{ left: '13.2%', width: '73.1%', top: '47%', height: '100%' }}>
      <div className="absolute inset-0 overflow-hidden rounded-t-[7%/16%]"
        style={{ background: 'linear-gradient(180deg,#3a3a3f 0%,#2b2b2f 12%,#242427 70%,#19191b 100%)', boxShadow: 'inset 0 2px 1px rgba(255,255,255,.14), 0 -8px 30px rgba(0,0,0,.35)' }}>
        <div className="absolute inset-x-0 bottom-0 h-[16%] bg-[#141416]" style={{ boxShadow: 'inset 0 2px 3px rgba(0,0,0,.6)' }} />
        <i className="absolute bottom-[6%] left-[2.2%] h-[1.4%] w-[0.9%] rounded-full bg-[#4be05f]" style={{ boxShadow: '0 0 6px #4be05f' }} />
        <div className="absolute left-1/2 top-[22%] flex -translate-x-1/2 flex-col items-center text-white/90" style={{ width: '17%' }}>
          <Logo drift={false} flat className="w-full" />
          <span className="mt-[10%] whitespace-nowrap font-black tracking-[0.34em] text-white/85" style={{ fontSize: 'calc(var(--k, 1) * 22px)' }}>SEUNGWON.2</span>
        </div>
      </div>
    </div>
  )
}

/**
 * Hero. The console is playable from the first screen. Scrolling pins it and (1) detaches the Joy-Cons while it tilts
 * left/right, (2) snaps them back, then (3) lowers it into a dock, (4) the view pulls back to a TV that fills the viewport
 * and shows the console's screen. `po` is the old tilt story's progress, `q` the dock + TV story's.
 */
function Hero({ children, tv, onPick, onPickTv, onPress, away }: { children: (sep: MotionValue<number>) => React.ReactNode; tv: React.ReactNode; onPick: (i: number, from: DOMRect) => void; onPickTv: (i: number) => void; onPress: (b: Btn) => void; away: number | null }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const [vh, setVh] = useState(innerHeight)
  const [, force] = useState(0)
  const topRef = useRef<HTMLElement>(null)
  const [topB, setTopB] = useState(480) // page-y of the title+chips block's bottom edge
  useEffect(() => {
    const f = () => { setVh(innerHeight); force(n => n + 1) } // width changes matter too (console size)
    const m = () => setTopB(Math.round((topRef.current?.getBoundingClientRect().bottom ?? 0) + scrollY))
    const ro = new ResizeObserver(m); if (topRef.current) ro.observe(topRef.current); m()
    addEventListener('resize', f)
    return () => { removeEventListener('resize', f); ro.disconnect() }
  }, [])
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const WORLD = 3 // distance from the dock to the TV, in viewport widths (the cable's length)
  const TOTAL = 880 // vh of scroll; the tilt story keeps its old pace (it used 450vh)
  const po = useTransform(p, [0, 450 / TOTAL], [0, 1])
  const q = useTransform(p, [450 * 0.72 / TOTAL, 1], [0, 1])
  const soft = { stiffness: 55, damping: 24, mass: 1.2 } // slow, no overshoot
  // low damping on purpose: re-attach overshoots a little, which reads as a "click"
  const sep = useSpring(useTransform(po, [0.12, 0.28, 0.46, 0.6], [0, 320, 320, 0]), { stiffness: 140, damping: 13 })
  const rotateY = useSpring(useTransform(po, [0.12, 0.24, 0.36, 0.48, 0.6], [0, -9, 9, -6, 0]), soft)
  const scale = useSpring(useTransform(po, [0, 0.12, 0.28, 0.6, 0.72], [1, 1, 0.92, 0.96, 1]), soft)
  // dock + TV: the console lowers into the dock, the room goes dark, then the scene shrinks away and the TV grows to fill the viewport
  const dockY = useSpring(useTransform(q, [0.05, 0.34], [0, 30]), soft)
  const dockYPct = useTransform(dockY, v => `${v}%`)
  const screenOff = useTransform(q, [0.24, 0.36], [0, 1])
  const dockIn = useTransform(q, [0, 0.16], [0, 1])
  const dockUp = useTransform(dockIn, v => `${(1 - v) * 40}%`)
  const room = useTransform(q, [0, 0.16], [0, 1])
  // once docked, the camera follows the cable to the right (scroll goes down, the view goes right) and the TV comes into view
  const pan = useTransform(q, [0.4, 0.9], ['0%', `${-WORLD * 100}%`])
  // headline over the long cable stretch, fixed to the viewport while the world slides by
  const linkO = useTransform(q, [0.46, 0.54, 0.74, 0.82], [0, 1, 1, 0])
  const linkY = useTransform(q, [0.46, 0.54, 0.74, 0.82], [28, 0, 0, -28])
  const [tvOn, setTvOn] = useState(false)
  useMotionValueEvent(q, 'change', v => setTvOn(v > 0.34))
  // Once pinned, ease the console from its 80px-below-the-chips spot to the vertical center of the viewport.
  const maxH = Math.max(220, vh - topB - 80) // measured title + chips block (+56 frame padding, 24 breathing room): everything fits one viewport
  const est = Math.min(maxH, (innerWidth - (innerWidth >= 768 ? 160 : 40)) * (CANVAS.h / CANVAS.w)) // rendered console height
  // chip row spans the console from Joy-Con seam to Joy-Con seam (233..1520 of the 1760px canvas)
  const rowW = (est * CANVAS.w / CANVAS.h) * ((1520 - 233) / CANVAS.w)
  const centerY = useRef(0)
  centerY.current = Math.max(0, (vh - est) / 2 - 80)
  const toCenter = useTransform(po, v => Math.min(1, v / 0.06) * centerY.current)
  const y = useSpring(toCenter, soft)
  // TV: the console's UI size (640×360) scaled to fill the viewport, with a thin bezel and a stand
  // TV with a game-case rack underneath; the TV is sized so both fit the viewport
  const fw = innerWidth, cw = est * CANVAS.w / CANVAS.h
  const rs = Math.max(0.7, Math.min(1.25, vh * 0.2 / 150)) // case rack scale
  const rackH = 190 * rs
  const tk = Math.min((fw * 0.86 - 16) / 640, 0.85 * (vh - 16 - rackH - 28 - 30) / 360)
  const tvW = 640 * tk + 16, tvBox = 360 * tk + 16
  const groupH = tvBox + 24 + rackH
  const tvTop = (vh - groupH) / 2
  // cable: leaves the dock's lower right, runs right along the floor, then plugs into the TV's left side in the next "screen" of the world
  const cx0 = fw / 2 + cw * 0.363, cy0 = 56 + centerY.current + 1.38 * est
  const cx1 = fw * WORLD + (fw - tvW) / 2, cy1 = tvTop + tvBox * 0.78
  const cable = `M${cx0} ${cy0} H${cx1 - 110} C${cx1 - 40} ${cy0} ${cx1 - 30} ${cy1} ${cx1} ${cy1}`

  // centered stack: title, 160px, cartridges, 160px, console
  const top = (
    <section ref={topRef} className="flex flex-col items-center px-5 pt-14 md:px-20">
      <div className="grid w-full items-start gap-8 md:grid-cols-[7fr_3fr] lg:gap-12"><IntroCopy /><HowToPlay /></div>
      <div className="mt-14 w-full"><Cartridges onPick={onPick} width={rowW} away={away} /></div>
    </section>
  )
  const guide = null // how-to-play now sits beside the title
  if (reduce) return <>{top}<div className="mt-20 px-5 md:px-20"><Scaled>{children(sep)}</Scaled></div>{guide}</>
  return (
    <>
      {top}
      <div ref={ref} className="relative" style={{ height: `${TOTAL}vh` }}>
        <div className="sticky top-0 flex h-screen flex-col items-center overflow-hidden px-5 pt-14 md:px-20" style={{ perspective: 1800, '--chipw': `${90 * chipScale(rowW)}px` } as React.CSSProperties}>
          <motion.div aria-hidden className="absolute inset-0" style={{ opacity: room, background: 'radial-gradient(120% 90% at 50% 40%,#2c2c30 0%,#1d1d20 60%,#131315 100%)' }} />
          <div className="pointer-events-none absolute left-5 top-20 z-10 w-[32rem] max-w-[85vw] md:left-20">
            {CAPTIONS.map(c => <Caption key={c.t} p={c.s === 'o' ? po : q} {...c} />)}
          </div>
          <motion.div aria-hidden className="pointer-events-none absolute inset-x-0 top-[20%] z-20 px-6 text-center text-white" style={{ opacity: linkO, y: linkY }}>
            <p className="text-[clamp(1.75rem,5.2vw,4.5rem)] font-extrabold leading-[1.25] tracking-tight [word-break:keep-all]">독을 연결하면<br />큰 화면으로 프로젝트가 펼쳐집니다</p>
          </motion.div>
          <motion.div className="absolute inset-0 flex flex-col items-center px-5 pt-14 md:px-20" style={{ x: pan }}>
            <motion.div className="relative w-full" style={{ scale, rotateY, y }}>
              <Scaled maxH={maxH} dockY={dockYPct} screenOff={screenOff}
                overlay={<motion.div className="absolute inset-0" style={{ opacity: dockIn, y: dockUp }}><Dock /></motion.div>}>
                {children(sep)}
              </Scaled>
            </motion.div>
            <motion.svg aria-hidden className="pointer-events-none absolute left-0 top-0 h-full overflow-visible" style={{ width: fw * (WORLD + 1), opacity: dockIn }} fill="none">
              <path d={cable} stroke="rgba(255,255,255,.28)" strokeWidth="2.5" strokeLinecap="round" />
            </motion.svg>
            <div className="absolute top-0 grid h-full w-full place-items-center" style={{ left: `${WORLD * 100}%` }}>
              <div className="flex flex-col items-center" style={{ gap: 24 }}>
                <div className="relative rounded-[6px] bg-[#0a0a0b] p-[8px] shadow-[0_20px_60px_rgba(0,0,0,.5)]" style={{ width: tvW, height: tvBox }}>
                  <div className="relative overflow-hidden bg-black" style={{ width: 640 * tk, height: 360 * tk }}>
                    <div style={{ width: 640, height: 360, transform: `scale(${tk})`, transformOrigin: 'top left' }}>{tvOn && tv}</div>
                  </div>
                </div>
                <CaseRack onPick={onPickTv} active={away} scale={rs} />
              </div>
              <SideCtrl side="l" press={onPress} />
              <SideCtrl side="r" press={onPress} />
            </div>
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
function Flying({ i, from, to, eject, wallTop, onDone }: { i: number; from: DOMRect; to: { x: number; y: number }; eject?: boolean; wallTop: number; onDone: () => void }) {
  const dx = to.x - (from.left + from.width / 2)
  const k = from.width / 90 // the holder scales down on narrow screens; the flying card follows
  const contact = to.y - 62 * k - (from.top + 62 * k) // card center offset when its pins touch the top edge
  const IN = 124 * k // slides in by its full height, so it is clipped away by the edge rather than faded
  // The holder's front wall is part of the page while the flying card is an overlay, so: (1) lift straight up until the card's bottom
  // clears the wall, (2) clip whatever is still behind the wall during that lift, so the card never appears to pass through it.
  const hid = (y: number) => Math.max(0, from.top + 124 * k + y - wallTop)
  const L = hid(0) + 10 // full lift (px)
  const clip = (ds: number[], ys: number[]) => ds.map((d, n) => `inset(0px 0px ${Math.max(d, n <= 2 ? hid(ys[n]) : 0)}px 0px)`)
  // insertion depth (px hidden) per keyframe: 0 until the card touches the edge, slides in to 16px shy, clicks back 6px, pushes home
  const DEPTH = [0, 0, 0, 0, 0, IN - 16, IN - 22, IN, IN]
  // lift straight out → one diagonal glide to hover over the slot → lower until it touches → slide in → click → push home
  const frames = {
    x: [0, 0, 4, dx, dx, dx, dx, dx, dx],
    rotate: [0, -2, -4, 0, 0, 0, 0, 0, 0], // tilts slightly while carried, straightens as it lines up
    scale: [1, 1.02, 1.05, 1.02, 1, 1, 1, 1, 1],
    y: [0, -0.55 * L, -L, contact - 26, ...DEPTH.slice(4).map(d => contact + d)],
    clipPath: [] as string[],
  }
  frames.clipPath = clip(DEPTH, frames.y)
  type Ease = number[] | 'linear'
  let times = [0, 0.08, 0.17, 0.5, 0.6, 0.82, 0.88, 0.97, 1]
  let ease: Ease[] = [[0.3, 0, 0.4, 1], [0.3, 0, 0.4, 1], [0.45, 0, 0.2, 1], [0.2, 0.6, 0.3, 1], [0.4, 0, 0.3, 1], [0.2, 0.8, 0.3, 1], [0.5, 0, 0.75, 0.4], 'linear']
  let anim: Record<string, (number | string)[]> = frames
  if (eject) { // the same path played backwards: pops out of the console, then glides back to its pocket in the holder
    // no tilt, scale-up or sideways jog on the way back: those were the "lift-off" wobble of the insert path and looked odd at the landing
    // and the insert path's "click" rebound played backwards made the card slip out, then dip back in: use a steadily increasing depth instead
    const D = [0, 0, 0, 0, 0, IN - 44, IN - 22, IN, IN]
    const calm = {
      x: frames.x.map((v, n) => (n <= 2 ? 0 : v)), rotate: frames.rotate.map(() => 0), scale: frames.scale.map(() => 1),
      y: [0, -0.55 * L, -L, contact - 26, ...D.slice(4).map(d => contact + d)],
      clipPath: [] as string[],
    }
    calm.clipPath = clip(D, calm.y)
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
  const { state, pressed, press, pick, goHome, setOnly, setAvatar, open, bootMs, sound, big, setBig, dark, toggleSound } = useControls()
  type Fly = { i: number; from: DOMRect; wallTop: number; to: { x: number; y: number }; eject?: boolean; next?: () => void }
  const [fly, setFly] = useState<Fly | null>(null)
  const [inserted, setInserted] = useState<number | null>(null) // the cartridge currently in the console; its pocket stays empty
  const reduce = useReducedMotion()
  const insert =(i: number, from: DOMRect) => {
    if (fly || i === inserted) return
    const c = document.getElementById('console')?.getBoundingClientRect()
    if (!c || reduce) { setInserted(i); setOnly(i); return pick(i) }
    const k = c.width / CANVAS.w
    const wallTop = document.querySelector('[data-wall]')?.getBoundingClientRect().top ?? 1e9
    const to = { x: c.left + 1330 * k, y: c.top + 17 * k } // top edge of the tablet, right side
    const start = () => {
      setInserted(i)
      setFly({ i, from, to, wallTop })
      // the console only "knows" the cartridge (title in the top bar, project tile) once it has slid all the way in
      setTimeout(() => { setOnly(i); pick(i) }, 1600)
    }
    const slot = inserted === null ? null : document.querySelector(`[data-slot="${inserted}"]`)?.getBoundingClientRect()
    if (inserted !== null && slot) { // swap: take the current cartridge out and return it to its pocket first
      setOnly(null) // the old title goes away as soon as the cartridge is pulled out
      goHome()
      setFly({ i: inserted, from: slot, to, wallTop, eject: true, next: () => { setInserted(null); start() } })
    } else start()
  }
  return (
    <OpenContext.Provider value={open}><AvatarContext.Provider value={setAvatar}>
      <Header />
      {fly && <Flying {...fly} onDone={() => { const n = fly.next; setFly(null); n?.() }} />}
      <Hero onPick={insert} onPress={press} onPickTv={i => { if (fly || i === inserted) return; setInserted(i); setOnly(i); pick(i) }} away={fly ? fly.i : inserted} tv={<Screen s={state} bootMs={bootMs} dark={dark} />}>
        {sep => (
          <Console pressed={pressed} press={press} sep={sep}>
            {!big && <Screen s={state} bootMs={bootMs} dark={dark} />}
          </Console>
        )}
      </Hero>
      <Showcase />
      <Footer sound={sound} onToggle={toggleSound} />
      <Music on={sound} />
      <MobilePad press={press} />
      <SoundButton sound={sound} onToggle={toggleSound} />
      {big && <TvMode onClose={() => setBig(false)}><Screen s={state} bootMs={bootMs} dark={dark} /></TvMode>}
    </AvatarContext.Provider></OpenContext.Provider>
  )
}
