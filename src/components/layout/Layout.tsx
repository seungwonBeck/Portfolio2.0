import { useRef, useState } from 'react'
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import { ArrowUpRight, CircleDot, Move, Home, Volume2, VolumeX } from 'lucide-react'
import { profile, projects, skills } from '../../types'
import { Thumb } from '../screen/Screens'
import Logo from '../Logo'

export const Header = () => (
  <header className="relative z-20 flex items-center justify-between px-5 py-5 md:px-20">
    <span className="flex items-center gap-2 text-lg font-extrabold tracking-tight"><Logo drift={false} className="h-[18px] w-[18px] text-ink" /><span>seungwon<span className="text-accent-red">.</span></span></span>
    <span className="label hidden sm:block">An interactive portfolio</span>
    <span className="label flex items-center gap-2"><i className="h-1.5 w-1.5 rounded-full bg-accent-blue" />Open to work</span>
  </header>
)

export const IntroCopy = () => (
  <div className="w-full text-left">
    <div className="label mb-3">01 — The play edition</div>
    <h1 className="font-display text-5xl font-black leading-[1.05] tracking-tight md:text-7xl lg:text-[clamp(4rem,13vh,7.5rem)] xl:whitespace-nowrap">
      Portfolio
    </h1>
    <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-sub">{profile.tagline}</p>
  </div>
)

const guide = [
  { icon: Move, t: '이동', k: '방향키 / 왼쪽 스틱' },
  { icon: CircleDot, t: 'A · 선택', k: 'Enter / Z / A' },
  { icon: CircleDot, t: 'B · 뒤로', k: 'Esc / X / B' },
  { icon: Home, t: 'HOME', k: 'H · 홈으로' },
  { icon: CircleDot, t: 'Y · 테마', k: 'Y 키' },
  { icon: CircleDot, t: '+ / −', k: 'P 확대 · M 소리' },
]
export const HowToPlay = () => (
  <aside className="hidden md:block">
    <div className="label mb-3 border-t border-black/10 pt-3">How to play</div>
    <div className="grid grid-cols-2 gap-x-5 gap-y-3">
      {guide.map(g => (
        <div key={g.t} className="flex items-start gap-2">
          <g.icon size={18} strokeWidth={1.6} className="mt-0.5 shrink-0 text-ink-sub" />
          <div><div className="text-sm font-bold">{g.t}</div><div className="!text-[13px] text-ink-sub">{g.k}</div></div>
        </div>
      ))}
    </div>
  </aside>
)

/** Game-cartridge shelf: one cartridge per project; clicking loads it on the device screen. */
const CARD_CLIP = 'polygon(0 0, 80% 0, 100% 15%, 100% 100%, 0 100%)' // notched corner

/** The cartridge itself (90×124 box, parent must be `relative`). Also used by the flying insert animation. */
export const CardFace = ({ i, title }: { i: number; title: string }) => (
  <>
    {/* molded matte plastic: a slightly lighter rim, then a flat dark face — real cards are not glossy */}
    <span className="absolute inset-0" style={{ clipPath: CARD_CLIP, borderRadius: 6, background: 'linear-gradient(165deg,#5b5d62 0%,#3f4044 50%,#303135 100%)' }} />
    <span className="absolute inset-[1.5px]" style={{ clipPath: CARD_CLIP, borderRadius: 5, background: 'linear-gradient(180deg,#414246 0%,#36373b 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.1), inset 0 -3px 5px rgba(0,0,0,.18)' }} />
    {/* logo mark: stays visible when the card is inserted and only its top edge shows */}
    <Logo drift={false} flat className="absolute left-[9px] top-[2px] h-[12px] w-[12px]" />
    {/* shallow grip ridges */}
    <span className="absolute left-[34px] top-[6px] h-[6px] w-[28px]"
      style={{ background: 'repeating-linear-gradient(90deg,rgba(0,0,0,.35) 0 1.5px,rgba(255,255,255,.07) 1.5px 2.5px,transparent 2.5px 5px)' }} />
    {/* printed paper label: flat inks, a white title band with a rating box, no gloss */}
    <span className="screen-font absolute inset-x-[9px] bottom-[46px] top-[24px] overflow-hidden rounded-[2px]" style={{ boxShadow: '0 0 0 1px rgba(0,0,0,.55)', background: i % 2 ? 'linear-gradient(170deg,#bd4a3d,#93352c)' : 'linear-gradient(170deg,#2a86ad,#1e5f80)' }}>
      <span className="absolute inset-x-0 top-0 flex h-[9px] items-center justify-between bg-[#f1efe8] px-[3px] text-[4.5px] font-bold uppercase tracking-[0.12em] text-[#2a2b2f]">seungwon.2<i className="h-[5px] w-[5px] border border-[#2a2b2f]" /></span>
      <span className="absolute inset-x-0 bottom-0 p-1.5 text-left text-[9.5px] font-extrabold leading-[1.1] text-white/95">{title}</span>
    </span>
    {/* gold contact pins */}
    <span className="absolute inset-x-[12px] bottom-[6px] h-[10px]"
      style={{ background: 'repeating-linear-gradient(90deg,#c4ad68 0 3px,#202124 3px 5px)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,.5)' }} />
  </>
)

/** `width`: row width in px (spread evenly, like auto-layout space-between). `away`: index currently out of its pocket. */
const CHIP_GAP = 24
const HOLDER_H = 144 // 20 top padding + 124 card
/** Scale of the chip row at a given row width (1 unless the row is narrower than its natural width). */
export const chipScale = (width?: number) => {
  const natural = projects.length * 90 + (projects.length - 1) * CHIP_GAP + 40
  return width ? Math.min(1, width / natural) : 1
}

export const Cartridges = ({ onPick, width, away }: { onPick: (i: number, from: DOMRect) => void; width?: number; away?: number | null }) => {
  // Natural size of the holder; when the row is narrower than that the whole holder scales down with the console.
  const natural = projects.length * 90 + (projects.length - 1) * CHIP_GAP + 40
  const k = chipScale(width)
  return (
  <div className="text-center">
    <div className="label mb-2">Game library · {projects.length} titles</div>
    <div className="mx-auto" style={{ width, height: HOLDER_H * k }}>
    <div style={{ width: k < 1 ? natural : width, transform: `scale(${k})`, transformOrigin: 'top left' }}>
    {/* holder: a case with one pocket per cartridge; the front lip hides the pins and stays put when a card lifts */}
    {/* the group is exactly as wide as the chips + their end fins, so the front wall stops cleanly at the last fin */}
    <div className="relative mx-auto w-max px-5">
    <ul className="flex pt-5" style={{ gap: CHIP_GAP }}>
      {projects.map((p, i) => (
        <li key={p.id} data-slot={i} className="relative shrink-0" style={{ perspective: 500 }}>
          {/* drop-shadow (not box-shadow) so the notched silhouette casts its own shadow */}
          <button onClick={e => onPick(i, e.currentTarget.getBoundingClientRect())} style={{ visibility: away === i ? 'hidden' : 'visible' }} aria-label={`${p.title} 카트리지, 화면에서 열기`}
            className="relative block h-[124px] w-[90px] transition-transform duration-300 ease-out [filter:drop-shadow(0_3px_2px_rgba(0,0,0,.18))] hover:-translate-y-4 focus-visible:-translate-y-4"
          >
            <CardFace i={i} title={p.title} />
          </button>
          {/* divider fins: thin walls with a slanted top, one on the left of every slot and one closing the row */}
          <Fin className="-left-[15px]" />
          {i === projects.length - 1 && <Fin className="-right-[15px]" />}
        </li>
      ))}
    </ul>
    {/* front wall of the tray: cards stand behind it, so only their tops show until they are pulled up */}
    <div aria-hidden data-wall className="pointer-events-none absolute inset-x-0 bottom-0 h-[40px] rounded-b-[6px]"
      style={{ background: 'linear-gradient(180deg,rgba(252,252,253,.96) 0%,rgba(232,234,238,.94) 50%,rgba(222,224,230,.95) 100%)', boxShadow: 'inset 0 2px 1px rgba(255,255,255,.95), 0 -4px 6px -3px rgba(0,0,0,.2)' }} />
    </div>
    </div>
    </div>
  </div>
  )
}

/**
 * Game-case rack at the bottom of the TV scene, front view. The cases are tall, so the viewport's bottom edge crops them and only the upper
 * half shows, with the title running down the spine. Clear plastic shell, printed insert in its own color, gloss. A picked case pops up with a
 * plain rise and fall back down; the loaded case glows with a PLAY tag.
 */
const CASE = { w: 46, h: 212, gap: 6, lift: 30 } // lift: how high a picked case rises before it lowers again
export const CASE_ROW_W = projects.length * (CASE.w + CASE.gap) - CASE.gap
// [highlight, mid, shadow, accent] per project: each print has its own color
const PRINTS = [
  ['#ef7462', '#bd3c2d', '#6b160d', '#ffd2c9'], ['#5dbbe2', '#1f8ab8', '#0a4a66', '#c4eeff'], ['#f3c14f', '#d08f14', '#7a4d05', '#fff0c2'],
  ['#58cfa6', '#1d9c78', '#0a5a44', '#c6f7e6'], ['#a98bf2', '#6b48c9', '#2f1a75', '#e2d8ff'], ['#f58cb4', '#cc4a83', '#6d1b43', '#ffd6e7'],
  ['#8fa0b8', '#51617a', '#1f2a3a', '#dbe4f2'],
]
export const CaseRack = ({ onPick, active, scale = 1 }: { onPick: (i: number) => void; active?: number | null; scale?: number }) => {
  const { w, h, gap, lift } = CASE
  const W = CASE_ROW_W + 24
  const [pop, setPop] = useState<{ i: number; n: number } | null>(null) // n re-triggers the animation when the same case is picked again
  const pick = (i: number) => { setPop(s => ({ i, n: (s?.n ?? 0) + 1 })); onPick(i) }
  return (
    <div style={{ width: W * scale, height: (h + lift + 34) * scale }}>
      <div className="relative" style={{ width: W, height: h + lift + 34, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <ul className="absolute bottom-0 flex" style={{ left: 12, gap }}>
          {projects.map((p, i) => {
            const [hi, mid, lo, acc] = PRINTS[i % PRINTS.length]
            const on = active === i
            const popping = pop?.i === i
            return (
              <li key={p.id} className="relative" style={{ width: w, height: h }}>
                <motion.button key={popping ? `p${pop!.n}` : 'rest'} type="button" onClick={() => pick(i)} aria-label={`${p.title} 케이스, TV에서 열기`}
                  className="absolute inset-0"
                  initial={false}
                  animate={popping ? { y: [0, -lift, 0] } : { y: 0 }}
                  transition={popping
                    ? { duration: 1.1, times: [0, 0.4, 1], ease: [[0.25, 0.8, 0.3, 1], [0.5, 0, 0.3, 1]] } // one plain rise and fall back to the resting spot
                    : { type: 'spring', stiffness: 260, damping: 28 }}
                  style={{ filter: `drop-shadow(0 8px 6px rgba(0,0,0,.5))${on ? ' drop-shadow(0 0 9px rgba(43,212,255,.9))' : ''}` }}>
                  {on && <>
                    <span aria-hidden className="pointer-events-none absolute -inset-[4px] animate-[casePulse_1.6s_ease-in-out_infinite] rounded-t-[9px] border-2 border-[#2bd4ff]" style={{ boxShadow: '0 0 12px #2bd4ff, inset 0 0 8px rgba(43,212,255,.5)' }} />
                    <span aria-hidden className="pointer-events-none absolute -top-[26px] left-1/2 flex -translate-x-1/2 items-center gap-[3px] whitespace-nowrap rounded-full bg-[#2bd4ff] px-[7px] py-[2px] text-[9px] font-extrabold tracking-[0.06em] text-[#04222e] shadow-[0_2px_8px_rgba(0,0,0,.5)]">
                      <i className="h-[6px] w-[6px] rounded-full bg-[#04222e] animate-[casePulse_1.2s_ease-in-out_infinite]" />PLAY
                    </span>
                  </>}
                  {/* clear outer shell: bright rim, bevel, specular edges, hang slot */}
                  <span className="absolute inset-0 rounded-t-[7px]" style={{ background: 'linear-gradient(90deg,rgba(255,255,255,.97),rgba(236,240,245,.62) 8%,rgba(226,231,238,.3) 92%,rgba(255,255,255,.9))', boxShadow: 'inset 0 2px 0 #fff, inset 0 -1px 0 rgba(0,0,0,.25), 0 0 0 1px rgba(0,0,0,.45)' }} />
                  <span className="absolute inset-x-[2px] top-[2px] h-[8px] rounded-t-[5px] bg-gradient-to-b from-white to-[#dfe3e9]" />
                  <span className="absolute left-1/2 top-[4px] h-[3px] w-[12px] -translate-x-1/2 rounded-full bg-black/35" />
                  {/* printed insert */}
                  <span className="absolute inset-x-[4px] bottom-0 top-[10px] overflow-hidden rounded-t-[2px]" style={{ background: `linear-gradient(90deg,${hi} 0%,${mid} 42%,${lo} 100%)`, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.35), inset 0 3px 4px rgba(0,0,0,.35)' }}>
                    <span className="absolute inset-0" style={{ background: `radial-gradient(130% 55% at 28% 0%,rgba(255,255,255,.3),transparent 60%)` }} />
                    {/* header plate with the logo */}
                    <span className="absolute inset-x-0 top-0 h-[32px]" style={{ background: 'linear-gradient(180deg,#2a2b30,#0e0f12)', boxShadow: '0 1px 0 rgba(255,255,255,.6), inset 0 -2px 0 rgba(255,255,255,.06)' }} />
                    <Logo drift={false} flat className="absolute left-1/2 top-[7px] h-[18px] w-[18px] -translate-x-1/2" />
                    <span className="absolute inset-x-0 top-[33px] h-[3px]" style={{ background: acc, opacity: 0.85 }} />
                    {/* number + pixel motif */}
                    <span className="absolute left-1/2 top-[42px] -translate-x-1/2 rounded-[3px] border border-white/70 px-[4px] py-[2px] text-[9px] font-extrabold leading-none tracking-[0.06em] text-white/95">{String(i + 1).padStart(2, '0')}</span>
                    <span className="absolute left-1/2 top-[62px] flex -translate-x-1/2 gap-[2px]"><i className="h-[4px] w-[4px]" style={{ background: acc }} /><i className="h-[4px] w-[4px] bg-white/80" /><i className="h-[4px] w-[4px]" style={{ background: acc }} /></span>
                    <span className="screen-font absolute inset-x-0 bottom-[16px] top-[78px] grid justify-center overflow-hidden text-[14px] font-extrabold leading-none tracking-[0.05em] text-white" style={{ writingMode: 'vertical-rl', textShadow: '0 1px 0 rgba(0,0,0,.55), 0 0 4px rgba(0,0,0,.4)' }}>
                      <span className="max-h-full overflow-hidden text-ellipsis whitespace-nowrap">{p.title}</span>
                    </span>
                    {/* fine print texture, gloss streaks, edge shading */}
                    <span className="absolute inset-0 opacity-[.08]" style={{ background: 'repeating-linear-gradient(45deg,#fff 0 1px,transparent 1px 3px)' }} />
                    <span className="absolute inset-0" style={{ background: 'linear-gradient(104deg,rgba(255,255,255,.4) 0%,rgba(255,255,255,.08) 24%,transparent 42%,rgba(0,0,0,.25) 100%)' }} />
                    <span className="absolute inset-y-0 left-[3px] w-[2px] bg-gradient-to-b from-white/70 via-white/25 to-transparent" />
                    <span className="absolute inset-y-0 right-0 w-[3px] bg-gradient-to-l from-black/45 to-transparent" />
                  </span>
                  <span className="pointer-events-none absolute inset-y-[6px] left-[1.5px] w-[1.5px] rounded bg-white/90" />
                  <span className="pointer-events-none absolute inset-y-[6px] right-[1.5px] w-[1px] rounded bg-white/60" />
                </motion.button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

/** A thin translucent divider wall whose top edge slopes down to the right, like the slot dividers of a card tray. */
const Fin = ({ className }: { className: string }) => (
  // outer span carries the shadow (a clip-path would cut it off), inner span is the clipped wall
  <span aria-hidden className={`pointer-events-none absolute bottom-0 h-[70px] w-[7px] [filter:drop-shadow(1px_0_0_rgba(0,0,0,.16))_drop-shadow(0_-1px_0_rgba(255,255,255,.9))] ${className}`}>
    <span className="block h-full w-full" style={{ clipPath: 'polygon(0 34%, 100% 0, 100% 100%, 0 100%)',
      background: 'linear-gradient(90deg,rgba(255,255,255,.9),rgba(230,232,236,.6))' }} />
  </span>
)

/**
 * Full-bleed strip of project panels just above the footer: no gaps between panels, edges cropped, and it drifts
 * sideways on its own in a seamless loop (the list is rendered twice; .marquee slides by exactly one copy). Pauses on hover.
 */
export const Showcase = () => {
  return (
    <section className="overflow-hidden py-20" aria-label="Selected works">
      <div className="mb-8 px-5 md:px-20"><div className="label mb-2">Selected works</div>
        <h2 className="font-display text-3xl font-extrabold tracking-tight">Keep playing.</h2></div>
      <ul className="marquee flex w-max">
        {[...projects, ...projects].map((p, n) => { const i = n % projects.length; return (
          <li key={n} aria-hidden={n >= projects.length} className="relative h-[280px] w-[72vw] shrink-0 overflow-hidden md:h-[340px] md:w-[34vw]">
            <Thumb i={i} className="absolute inset-0" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-white">
              <div className="text-2xl font-extrabold leading-tight">{p.title}</div>
              <div className="mt-1 text-sm text-white/80">{p.summary}</div>
            </div>
          </li>
        )})}
      </ul>
    </section>
  )
}

/** Plain-HTML view: recruiters, SEO and screen readers don't need the console. */
export const FallbackList = () => (
  <section id="list" className="mx-auto max-w-4xl px-6 py-20">
    <div className="label mb-2">Quick look</div>
    <h2 className="mb-2 text-3xl font-extrabold tracking-tight">{profile.name} — {profile.role}</h2>
    <p className="mb-10 max-w-xl text-ink-sub">{profile.intro}</p>
    <div className="grid gap-4 sm:grid-cols-2">
      {projects.map((p, i) => (
        <article key={p.id} className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/5">
          {p.thumbnail ? <img src={p.thumbnail} alt="" loading="lazy" className="h-36 w-full object-cover" /> : <Thumb i={i} className="h-36" />}
          <div className="p-5">
            <h3 className="font-bold">{p.title}</h3>
            <p className="text-sm text-ink-sub">{p.summary}</p>
            <div className="label mt-3">{p.role} · {p.period}</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {p.tags.map(t => <span key={t} className="rounded-full bg-bg px-2 py-0.5 text-[11px]">{t}</span>)}
            </div>
            {p.links.demo && <a href={p.links.demo} target="_blank" rel="noopener" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-accent-blue">보러가기 <ArrowUpRight size={14} /></a>}
          </div>
        </article>
      ))}
    </div>
    <div className="mt-10 grid gap-2 text-sm sm:grid-cols-3">
      {skills.map(g => <div key={g.category}><div className="label mb-1">{g.category}</div>{g.items.map(i => i.name).join(' · ')}</div>)}
    </div>
  </section>
)

export const Footer = ({ sound, onToggle }: { sound: boolean; onToggle: () => void }) => (
  <footer className="border-t border-black/5 px-6 py-8 text-sm">
    <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
      <div><b>{profile.name}</b><div className="label mt-1">{profile.role}</div><a className="text-ink-sub" href={`mailto:${profile.email}`}>{profile.email}</a></div>
      <div className="flex gap-5">{profile.links.map(l => <a key={l.label} href={l.url} target="_blank" rel="noopener" className="hover:text-accent-red">{l.label}</a>)}</div>
      <button onClick={onToggle} aria-pressed={sound} className="flex items-center gap-2 text-xs font-semibold">
        {sound ? <Volume2 size={16} /> : <VolumeX size={16} />}효과음 {sound ? 'ON' : 'OFF'}
      </button>
      <div className="label md:text-right">Thanks for playing. ■ Game saved<br />© 2026 {profile.name}. Not affiliated with Nintendo.</div>
    </div>
  </footer>
)
