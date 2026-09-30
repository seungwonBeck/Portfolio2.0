import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import { ArrowUpRight, CircleDot, Move, Home, Volume2, VolumeX } from 'lucide-react'
import { profile, projects, skills } from '../../types'
import { Thumb } from '../screen/Screens'

export const Header = () => (
  <header className="relative z-20 flex items-center justify-between px-5 py-5 md:px-20">
    <span className="text-lg font-extrabold tracking-tight">seungwon<span className="text-accent-red">.</span></span>
    <span className="label hidden sm:block">An interactive portfolio</span>
    <span className="label flex items-center gap-2"><i className="h-1.5 w-1.5 rounded-full bg-accent-blue" />Open to work</span>
  </header>
)

export const IntroCopy = () => (
  <div className="w-full text-left">
    <div className="label mb-3">01 — The play edition</div>
    <h1 className="font-display text-3xl font-black leading-[1.1] tracking-tight md:text-4xl lg:text-[2.75rem] xl:whitespace-nowrap">
      Small screen. <em className="font-light text-accent-blue">Big play.</em>
    </h1>
    <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-sub">{profile.intro}</p>
  </div>
)

const guide = [
  { icon: Move, t: '이동', k: '← → ↑ ↓ / 왼쪽 스틱 드래그' },
  { icon: CircleDot, t: 'A · 선택', k: 'Enter / Z' },
  { icon: CircleDot, t: 'B · 뒤로', k: 'Esc / X / Backspace' },
  { icon: Home, t: 'HOME · 홈으로', k: 'H' },
  { icon: CircleDot, t: 'Y · 화면 테마', k: 'Y' },
  { icon: CircleDot, t: '+ / −', k: 'P 크게 보기 · M 효과음' },
]
export const HowToPlay = () => (
  <aside className="hidden md:block">
    <div className="label mb-3 border-t border-black/10 pt-3">How to play</div>
    <div className="grid grid-cols-3 gap-x-6 gap-y-3">
      {guide.map(g => (
        <div key={g.t} className="flex items-start gap-2">
          <g.icon size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-ink-sub" />
          <div><div className="text-xs font-semibold">{g.t}</div><div className="label !normal-case !tracking-normal">{g.k}</div></div>
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
    <span className="screen-font absolute left-[9px] top-[3px] grid h-[11px] w-[20px] place-items-center rounded-[2px] bg-[#1d86b3] text-[7px] font-black leading-none tracking-tight text-white/95">f2</span>
    {/* shallow grip ridges */}
    <span className="absolute left-[34px] top-[6px] h-[6px] w-[28px]"
      style={{ background: 'repeating-linear-gradient(90deg,rgba(0,0,0,.35) 0 1.5px,rgba(255,255,255,.07) 1.5px 2.5px,transparent 2.5px 5px)' }} />
    {/* printed paper label: flat inks, a white title band with a rating box, no gloss */}
    <span className="screen-font absolute inset-x-[9px] bottom-[46px] top-[24px] overflow-hidden rounded-[2px]" style={{ boxShadow: '0 0 0 1px rgba(0,0,0,.55)', background: i % 2 ? 'linear-gradient(170deg,#bd4a3d,#93352c)' : 'linear-gradient(170deg,#2a86ad,#1e5f80)' }}>
      <span className="absolute inset-x-0 top-0 flex h-[9px] items-center justify-between bg-[#f1efe8] px-[3px] text-[4.5px] font-bold uppercase tracking-[0.12em] text-[#2a2b2f]">folio 2<i className="h-[5px] w-[5px] border border-[#2a2b2f]" /></span>
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
    <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[40px] rounded-b-[6px]"
      style={{ background: 'linear-gradient(180deg,rgba(252,252,253,.96) 0%,rgba(232,234,238,.94) 50%,rgba(222,224,230,.95) 100%)', boxShadow: 'inset 0 2px 1px rgba(255,255,255,.95), 0 -4px 6px -3px rgba(0,0,0,.2)' }} />
    </div>
    </div>
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
