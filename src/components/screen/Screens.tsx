import { ReactNode, RefObject, createContext, useContext, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bomb, Code2, Download, Palette, Sparkles, Wrench, Github, Instagram, Wifi, CircleDot, ExternalLink, FolderOpen, Flag, Footprints, Gamepad2, Gauge, LayoutGrid, Mail, MousePointerClick, Move, Rocket, User } from 'lucide-react'
import SkillIcon from './SkillIcons'
import { AVATAR_ORDER, Btn, contactItems, DOCK, State, TILES } from '../../store/nav'
import { Avatar, AVATARS, Coin } from './avatars'
import Logo from '../Logo'
import { profile, projects, skills } from '../../types'

const tileIcon = { ABOUT: User, PROJECTS: FolderOpen, SKILLS: Gauge, CONTACT: Mail, GAME: Gamepad2 }
const Scroll = ({ children }: { children: ReactNode }) => (
  <div data-scroll className="h-full overflow-y-auto px-7 pb-6 [scrollbar-width:none]">{children}</div>
)
const Title = ({ children, small = false }: { children: ReactNode; small?: boolean }) => (
  <h2 className={`flex items-center gap-2.5 font-extrabold tracking-tight ${small ? 'mb-2 text-[16px]' : 'mb-3 text-[20px]'}`}><span aria-hidden className={`w-1.5 rounded-full bg-accent-blue ${small ? 'h-[14px]' : 'h-[18px]'}`} />{children}</h2>
)
/** Box art per project (same colours as the case rack), shared by the list thumbnails and the detail hero. */
const PROJ_ART = [['#ff7a6b', '#b3261a'], ['#4fd0f5', '#0b6f98'], ['#ffc14d', '#b86a00'], ['#4fd98a', '#12803f'], ['#b07bff', '#4a21a8'], ['#ff8fba', '#a82a63'], ['#9fb0c8', '#37455c']]
/** The focused row/card frame: same pulsing white + cyan frame as the focused home tile. */
const FOCUS = 'animate-[tileGlow_1.6s_ease-in-out_infinite]'
const REST = 'shadow-[0_6px_14px_-8px_rgba(0,0,0,.35)] ring-1 ring-black/10'

/** 기기 배터리: 브라우저가 알려주면 실제 잔량(없으면 100%). 어두운 타일 안에 흰 테두리, 초록 잔량 막대, 막대 안에 숫자. */
function Battery() {
  const [level, setLevel] = useState(100)
  const [charging, setCharging] = useState(false)
  useEffect(() => {
    type Bat = EventTarget & { level: number; charging: boolean }
    let bat: Bat | undefined
    const sync = () => { if (bat) { setLevel(Math.round(bat.level * 100)); setCharging(bat.charging) } }
    const nav = navigator as Navigator & { getBattery?: () => Promise<Bat> }
    nav.getBattery?.().then(b => { bat = b; sync(); b.addEventListener('levelchange', sync); b.addEventListener('chargingchange', sync) }).catch(() => {})
    return () => { bat?.removeEventListener('levelchange', sync); bat?.removeEventListener('chargingchange', sync) }
  }, [])
  const low = level <= 20 && !charging
  return (
    <span role="img" aria-label={`배터리 ${level}%`} className="flex items-center">
      <span className="relative h-[14px] w-[30px] overflow-hidden rounded-[4px] border-[1.5px] border-ink/25">
        <span className={`absolute inset-y-0 left-0 ${low ? 'bg-[#ff453a]' : 'bg-[#4cd964]'}`} style={{ width: `${Math.max(level, 6)}%` }} />
        <span className="absolute inset-0 grid place-items-center text-[8px] font-semibold leading-none text-ink/45">{level}</span>
      </span>
      <span aria-hidden className="ml-[1px] h-[5px] w-[2px] rounded-r-full bg-ink/25" />
    </span>
  )
}

function Clock() {
  const [t, setT] = useState(() => new Date())
  useEffect(() => { const i = setInterval(() => setT(new Date()), 15000); return () => clearInterval(i) }, [])
  const parts = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).formatToParts(t)
  const get = (type: string) => parts.find(x => x.type === type)?.value ?? ''
  return <span className="flex items-baseline gap-1">{get('hour')}:{get('minute')}<span className="text-[9px] font-extrabold tracking-wide text-ink-sub">{get('dayPeriod').toUpperCase()}</span></span>
}

export function Boot({ ms }: { ms: number }) {
  return (
    <motion.div className="grid h-full place-items-center bg-card"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: ms / 2000 }}>
      <div className="text-center">
        <Logo className="mx-auto mb-3 h-14 text-ink" />
        <div className="text-[44px] font-black tracking-tight">seungwon<span className="text-accent-red">.2</span></div>
        <div className="label mt-1">press any key</div>
      </div>
    </motion.div>
  )
}

/** Lets tiles and dock icons be clicked/tapped (provided by App). */
export const AvatarContext = createContext<(i: number) => void>(() => {})
export const OpenContext = createContext<(row: 'tile' | 'dock', i: number) => void>(() => {})
/** Clicking a project / contact row or an arcade card, and the A / B / H hints in the footer bar. */
export const RowContext = createContext<(screen: 'PROJECTS' | 'CONTACT' | 'GAME', i: number) => void>(() => {})
export const PressContext = createContext<(b: Btn) => void>(() => {})

const dockColor = { ABOUT: '#ff4b3e', PROJECTS: '#ff9f43', SKILLS: '#34c759', CONTACT: '#1fb6e8', GAME: '#8a8b90' }
/** Box-art colours per tile (light, dark) and the one-line blurb shown under the focused tile, like a game's title on the Switch home. */
const TILE_ART = { ABOUT: ['#ff7a6b', '#b3261a'], PROJECTS: ['#ffb54d', '#c4630a'], SKILLS: ['#4fd98a', '#12803f'], CONTACT: ['#3cc6f2', '#0b6f98'], GAME: ['#b07bff', '#4a21a8'] } as const
const TILE_SUB = { ABOUT: '프로필과 타임라인', PROJECTS: `${projects.length}개의 작품`, SKILLS: '쓸 수 있는 도구들', CONTACT: '연락하는 방법', GAME: '쉬어가는 미니게임' } as const

/**
 * Console-style home, modelled on the Switch home screen: a row of square "game" tiles with soft drop shadows (the focused one
 * grows and gets a pulsing white + cyan frame), the focused tile's title and blurb underneath, and a row of round coloured
 * system icons at the bottom (the focused one gets the blue ring and its name below).
 */
function Home({ s }: { s: State }) {
  const label = (t: (typeof TILES)[number]) => (t === 'PROJECTS' && s.only !== null ? projects[s.only].title : t)
  const tileFocus = s.row === 'tile'
  const open = useContext(OpenContext)
  const cur = TILES[s.home]
  return (
    <div className="relative h-full">
      <div className="absolute inset-x-0 top-0 overflow-hidden py-4 pl-7">
      {/* the row slides left so the focused tile stays on screen (one tile = 132px + 14px gap) */}
      <motion.div className="flex gap-3.5 py-1" animate={{ x: -Math.max(0, s.home - 2) * 146 }} transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}>
        {TILES.map((t, i) => {
          const sel = tileFocus && i === s.home
          const [hi, lo] = TILE_ART[t]
          const Icon = tileIcon[t]
          const chip = t === 'PROJECTS' && s.only !== null // 칩이 꽂히면 이 칸은 그 프로젝트의 로고 + 제목으로 바뀐다
          return (
            <div key={t} className="shrink-0">
              <motion.button aria-label={label(t)} onClick={() => open('tile', i)} animate={{ scale: sel ? 1.07 : 1, y: sel ? -3 : 0 }} transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                className={`relative block h-[132px] w-[132px] overflow-hidden rounded-[14px] text-left ${sel ? 'animate-[tileGlow_1.6s_ease-in-out_infinite]' : 'shadow-[0_8px_16px_-6px_rgba(0,0,0,.35)]'}`}
                style={{ background: `linear-gradient(155deg, ${hi} 0%, ${lo} 100%)` }}>
                {chip ? (
                  <>
                    {/* inserted cartridge: the project's logo fills the box, its title sits on a dark bar, a PLAYING tag marks it as different from the plain menu tiles */}
                    <ChipBadge i={s.only!} bare className="absolute inset-0 !rounded-none !shadow-none !ring-0" />
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/75 to-black/0 px-2.5 pb-2 pt-6 text-[12px] font-extrabold leading-tight tracking-tight text-white">{label(t)}</span>
                    <span className="absolute left-2 top-2 rounded-full bg-[#ff4b3e] px-2 py-0.5 text-[8px] font-extrabold tracking-[0.14em] text-white shadow-[0_2px_4px_rgba(0,0,0,.3)]">PLAYING</span>
                    <span aria-hidden className="absolute inset-0 rounded-[14px]" style={{ boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,.55)' }} />
                  </>
                ) : (
                  <>
                    {/* big faint glyph as the box art, a sheen from the top-left, a rim light, then the title on a scrim */}
                    <Icon aria-hidden size={92} strokeWidth={1.2} className="absolute -right-3 -top-2 text-white/25" />
                    <span aria-hidden className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,.34) 0%, rgba(255,255,255,.06) 38%, transparent 52%)' }} />
                    <span aria-hidden className="absolute inset-0 rounded-[14px]" style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.28), inset 0 -26px 34px -18px rgba(0,0,0,.5)' }} />
                    <span className="absolute left-3 top-3 grid h-7 w-7 place-items-center rounded-lg bg-white/90 shadow-[0_2px_4px_rgba(0,0,0,.25)]"><Icon size={16} strokeWidth={2.2} style={{ color: lo }} /></span>
                    <span className="absolute inset-x-0 bottom-0 p-3 text-[15px] font-bold leading-tight text-white [text-shadow:0_1px_2px_rgba(0,0,0,.45)]">{label(t)}</span>
                  </>
                )}
              </motion.button>
            </div>
          )
        })}
        <div className="shrink-0"><div className="h-[132px] w-[132px] rounded-[14px] bg-black/[.06] shadow-[inset_0_2px_6px_rgba(0,0,0,.12)] ring-1 ring-black/5" /></div>
      </motion.div>
      </div>
      {/* the focused tile's name and blurb */}
      <div className="absolute inset-x-0 top-[176px] h-10 pl-7 pr-7">
        <AnimatePresence mode="wait" initial={false}>
          {tileFocus && (
            <motion.div key={cur} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}>
              <div className="text-[15px] font-extrabold leading-tight">{label(cur)}</div>
              <div className="text-[11px] text-ink-sub">{s.only !== null && cur === 'PROJECTS' ? projects[s.only].summary : TILE_SUB[cur]}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* dock: the five menus as round coloured icons */}
      <div className="absolute inset-x-0 bottom-1 flex flex-col items-center">
        <div className="flex items-center gap-[18px]">
          {DOCK.map((t, i) => {
            const Icon = tileIcon[t]
            const sel = !tileFocus && i === s.dock
            return (
              <motion.button key={t} aria-label={t} onClick={() => open('dock', i)} animate={{ scale: sel ? 1.18 : 1 }} transition={{ type: 'spring', stiffness: 380, damping: 24 }}
                className={`relative grid h-[38px] w-[38px] place-items-center rounded-full shadow-[0_4px_8px_-2px_rgba(0,0,0,.35)] ${sel ? 'ring-[3px] ring-accent-blue ring-offset-[3px] ring-offset-screen' : 'ring-2 ring-white/80'}`}
                style={{ background: `linear-gradient(160deg, ${dockColor[t]}, ${dockColor[t]}cc)` }}>
                <span aria-hidden className="absolute inset-x-1 top-0.5 h-1/2 rounded-full bg-gradient-to-b from-white/45 to-transparent" />
                <Icon size={19} strokeWidth={2} className="relative text-white" />
              </motion.button>
            )
          })}
        </div>
        <div className="mt-1.5 h-4 text-[12px] font-bold text-accent-blue">{tileFocus ? '' : DOCK[s.dock]}</div>
      </div>
    </div>
  )
}

function About({ s }: { s: State }) {
  const pick = useContext(AvatarContext)
  // coin: back = ID photo (1), front = ME (0) or the chosen character; it always spins the same way
  const front = useRef(s.avatar === 1 ? 0 : s.avatar)
  if (s.avatar !== 1) front.current = s.avatar
  const [rot, setRot] = useState(s.avatar === 1 ? 180 : 0)
  const prev = useRef(s.avatar)
  const [photo, setPhoto] = useState(s.avatar === 1) // back face shows the ID photo; it is released only after the coin has flipped away
  useEffect(() => {
    if (prev.current === s.avatar) return
    const d = (prev.current === 1) !== (s.avatar === 1) ? 180 : 360 // read before prev changes: the updater runs later
    prev.current = s.avatar
    setRot(r => r + d)
  }, [s.avatar])
  useEffect(() => {
    if (s.avatar === 1) { setPhoto(true); return }
    const t = setTimeout(() => setPhoto(false), 950)
    return () => clearTimeout(t)
  }, [s.avatar])
  return (
    <Scroll>
      <Title>ABOUT ME</Title>
      <div className="mb-5 flex items-center gap-7">
        <div className="shrink-0 text-center">
          <div className="pb-3"><Coin rot={rot} front={front.current} photo={photo} onClick={() => pick(s.avatar === 1 ? front.current : 1)} /></div>
          {/* only while my own character is picked */}
          <div className="h-4 text-[10px] font-bold text-accent-blue">{s.avatar === 0 && '↻ 동전을 돌려보세요'}</div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[18px] font-extrabold leading-tight">{profile.name}</div>
          <div className="text-[12px] text-ink-sub">{profile.role}</div>
          <div className="label mb-1.5 mt-3">Edit character</div>
          <div className="grid grid-cols-6 gap-1.5">
            {AVATAR_ORDER.map(i => (
              <button key={i} type="button" aria-label={AVATARS[i].name} onClick={() => pick(i)}
                className={`grid aspect-square place-items-center rounded-lg bg-card p-1 ${i === s.avatar ? 'ring-[3px] ring-accent-blue' : 'ring-1 ring-black/10'}`}>
                <Avatar i={i} className="h-full w-full" />
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-ink-sub"><span className="rounded bg-card px-1.5 py-0.5 font-bold text-ink ring-1 ring-black/10">◀ ▶</span> 캐릭터 고르기</p>
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
  const pickRow = useContext(RowContext)
  return (
    <div className="h-full overflow-y-auto px-7 pb-4 pt-0.5 [scrollbar-width:none]">
      <Title>PROJECTS</Title>
      {projects.map((p, i) => (
        <div key={p.id} ref={el => { if (i === s.proj) el?.scrollIntoView({ block: 'nearest' }) }}
          role="button" tabIndex={-1} onClick={() => pickRow('PROJECTS', i)}
          className={`mb-2.5 flex cursor-pointer items-center gap-3 rounded-xl bg-card py-2 pl-2 pr-4 transition-transform hover:scale-[1.01] ${i === s.proj ? FOCUS : REST}`}>
          {/* cartridge-style thumbnail with its shelf number */}
          <span className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-lg text-[13px] font-extrabold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,.3)]" style={{ background: `linear-gradient(155deg, ${PROJ_ART[i % PROJ_ART.length][0]}, ${PROJ_ART[i % PROJ_ART.length][1]})` }}>
            <span aria-hidden className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,.4),transparent_55%)]" />
            <span className="relative [text-shadow:0_1px_2px_rgba(0,0,0,.4)]">{String(i + 1).padStart(2, '0')}</span>
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-bold">{p.title}</div>
            <div className="truncate text-[11px] text-ink-sub">{p.summary}</div>
          </div>
          <span className="rounded-full bg-black/[.06] px-2 py-0.5 text-[10px] font-bold text-ink-sub">{p.role}</span>
          <span className="label">{p.period.slice(0, 4)}</span>
        </div>
      ))}
    </div>
  )
}

export function Thumb({ i, className = '' }: { i: number; className?: string }) {
  const [a, b] = PROJ_ART[i % PROJ_ART.length]
  return <div className={className} style={{ background: `linear-gradient(155deg, ${a}, ${b})` }} />
}

/** 파비콘 칩의 배경색 (Layout의 칩 라벨과 같은 값) */
export const CHIP_TONE: Record<string, string> = { black: 'bg-black', orange: 'bg-[#fc4c02]' }

/** 칩 아이콘을 정사각형 상자로: 파비콘이 있는 칩은 칩 라벨과 같은 모양, 없는 칩은 박스아트 색 위에 제목. */
function ChipBadge({ i, className = '', bare = false }: { i: number; className?: string; bare?: boolean }) {
  const p = projects[i]
  const fav = p.favicon, cap = p.faviconLabel
  const base = `${import.meta.env.BASE_URL}favicons/${fav}`
  return (
    <div role="img" aria-label={`${p.title} 칩`} className={`relative aspect-square shrink-0 overflow-hidden rounded-xl shadow-[0_6px_14px_-6px_rgba(0,0,0,.45)] ring-1 ring-black/15 ${fav ? (CHIP_TONE[p.faviconTone] ?? 'bg-white') : ''} ${className}`}>
      {fav ? (cap ? (
        <>
          <img src={base} alt="" draggable={false} className="absolute -top-[6%] left-1/2 h-[92%] w-[92%] max-w-none -translate-x-1/2 object-contain" />
          {!bare && <span className="absolute inset-x-0 bottom-[7%] text-center text-[9px] font-extrabold tracking-[0.14em] text-white">{cap}</span>}
        </>
      ) : <img src={base} alt="" draggable={false} className={bare ? 'absolute left-1/2 top-[17%] h-[50%] w-[64%] -translate-x-1/2 object-contain' : 'absolute inset-[12%] h-[76%] w-[76%] object-contain'} />) : (
        <>
          <Thumb i={i} className="absolute inset-0" />
          {!bare && <span className="absolute inset-0 grid place-items-center p-1.5 text-center text-[10px] font-extrabold leading-tight text-white [text-shadow:0_1px_2px_rgba(0,0,0,.4)]">{p.title}</span>}
        </>
      )}
    </div>
  )
}

/** A photo slot: the project's own picture when `images[k]` is filled in projects.json, otherwise a box-art placeholder in the project colours. */
function Photo({ src, i, k, className = '', plain = false, contain = false }: { src?: string; i: number; k: number; className?: string; plain?: boolean; contain?: boolean }) {
  return (
    <div className={`relative overflow-hidden rounded-xl ${contain ? 'bg-[#f2f3f0]' : 'bg-[#d9d9d9]'} ${plain ? '' : 'shadow-[0_8px_16px_-8px_rgba(0,0,0,.4)]'} ${className}`}>
      {src ? <img src={src} alt="" draggable={false} loading="lazy" decoding="async" className={`absolute inset-0 h-full w-full ${contain ? 'object-contain' : 'object-cover'}`} /> : (
        <>
          <Thumb i={i} className="absolute inset-0" />
          <span aria-hidden className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,.4),rgba(255,255,255,.05)_40%,transparent_55%)]" />
          <span aria-hidden className="absolute -bottom-2 right-3 text-[56px] font-black leading-none text-white/25">{String(k + 1).padStart(2, '0')}</span>
        </>
      )}
    </div>
  )
}

/** The big hero photo as an auto-advancing slideshow: each slide sweeps in from the right with a horizontal motion-blur streak while the old one is pulled out to the left. Uses the project's own pictures, or box-art colour cards until they exist. */
function HeroSlides({ imgs: all, i, className = '', contain = false, dark = false, glow = false }: { imgs: string[]; i: number; className?: string; contain?: boolean; dark?: boolean; glow?: boolean }) {
  const imgs = [...new Set(all)] // 같은 사진이 여러 칸에 쓰여도 슬라이드는 한 번만
  const n = imgs.length || 4
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setIdx(v => (v + 1) % n), 1500)
    return () => clearInterval(t)
  }, [n])
  return (
    <div className={`relative overflow-hidden ${dark ? 'bg-[#0d0d0f]' : contain ? 'bg-[#f2f3f0]' : 'bg-[#d9d9d9]'} ${className}`}>
      {/* glow: 지금 슬라이드를 흐리게 키워 뒤에 깔아, 슬라이드 양옆 빈 곳이 같은 사진 색으로 번지게 한다 */}
      {glow && imgs.length > 0 && (
        <AnimatePresence initial={false}>
          <motion.img key={`g${idx}`} aria-hidden src={imgs[idx]} alt="" draggable={false} decoding="async" className="pointer-events-none absolute inset-0 h-full w-full scale-125 object-cover blur-2xl"
            initial={{ opacity: 0 }} animate={{ opacity: 0.55 }} exit={{ opacity: 0 }} transition={{ duration: 0.45 }} />
        </AnimatePresence>
      )}
      <AnimatePresence initial={false}>
        <motion.div
          key={idx}
          className="absolute inset-0"
          initial={{ x: '100%', scaleX: 1.08, filter: 'blur(8px)' }}
          animate={{ x: 0, scaleX: 1, filter: 'blur(0px)' }}
          exit={{ x: '-45%', opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          {imgs.length ? <img src={imgs[idx]} alt="" draggable={false} decoding="async" className={`h-full w-full ${contain ? 'object-contain' : 'object-cover'}`} /> : (
            <>
              <Thumb i={i + idx} className="absolute inset-0" />
              <span aria-hidden className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,.4),rgba(255,255,255,.05)_40%,transparent_55%)]" />
              <span aria-hidden className="absolute -bottom-2 right-3 text-[72px] font-black leading-none text-white/25">{String(idx + 1).padStart(2, '0')}</span>
            </>
          )}
        </motion.div>
      </AnimatePresence>
      <div className="absolute bottom-2 left-4 flex gap-1">
        {Array.from({ length: n }, (_, k) => <span key={k} className={`h-1 rounded-full transition-all ${k === idx ? 'w-4 bg-white' : 'w-1 bg-white/50'}`} />)}
      </div>
    </div>
  )
}

// 프로젝트 페이지 글자 규격: 띠 제목·본문·라벨 간격을 모든 띠에서 같게 쓴다
const H3 = 'mb-1.5 text-[16px] font-extrabold leading-[1.3] tracking-tight'
const BODY = 'text-[10px] leading-[1.6]'
const Eyebrow = ({ children, dark = false }: { children: ReactNode; dark?: boolean }) => (
  <div className={`mb-1 text-[10px] font-bold leading-none tracking-wide ${dark ? 'text-[#4aa3ff]' : 'text-[#0a6cff]'}`}>{children}</div>
)

/**
 * Project page, laid out like the "Apple Concept" template sketch, as full-width bands (no side margin on the bands themselves,
 * only a small padding for the text inside). First view: a left-aligned header (small blue label, big title, blurb, then, with some
 * air above it, the blue "사이트 보기" pill) and right under it the big photo, edge to edge, so title, button and photo are all on
 * the first screen. Scrolling goes through three bands, each with its own background and its own text, laid out differently:
 * overview (white, text + photo), role (white, big numbers), closing (dark).
 * `sections[n]` in projects.json ({ title, text }) overrides a band's text, otherwise it is built from the project's data.
 * Photos come from `images` (0 = hero, 1 = overview, 2-3 = keywords, 4 = role, 5 = closing).
 */
function Detail({ s }: { s: State }) {
  const p = projects[s.proj]
  // images: 전체 주소가 아니면 public/projects/ 아래 파일로 본다. imageFit "contain"은 슬라이드 캡처처럼 잘리면 안 되는 사진용.
  const imgs = ((p as { images?: string[] }).images ?? []).map(f => (/^(https?:)?\//.test(f) ? f : `${import.meta.env.BASE_URL}projects/${f}`))
  // heroImages: 첫 화면 슬라이드에 쓸 사진만 따로 고를 때 (없으면 images 전체)
  const heroImgs = ((p as { heroImages?: string[] }).heroImages ?? []).map(f => (/^(https?:)?\//.test(f) ? f : `${import.meta.env.BASE_URL}projects/${f}`))
  const slideImgs = heroImgs.length ? heroImgs : imgs
  const fit = (p as { imageFit?: string }).imageFit
  const contain = fit === 'contain' || fit === 'slide' || fit === 'a4' // slide: 16:9 슬라이드/PDF 캡처, a4: 세로로 긴 상세 페이지를 A4 비율로 잘라 둔 것, 잘리지 않게 칸도 같은 비율
  // 슬라이드 사진은 16:9 칸에 꽉 채운다(원본 비율이 소수점 단위로 달라 contain이면 가장자리에 1px 틈이 생김)
  const ratio = fit === 'slide' ? 'aspect-[16/9]' : fit === 'a4' ? 'aspect-[210/297]' : 'aspect-[4/3]'
  const panelW = fit === 'a4' ? 'w-[46%]' : 'w-[76%]' // A4는 세로로 길어서 칸 폭을 좁게
  const dark = (p as { imageTone?: string }).imageTone === 'dark'
  const own = (p as { sections?: { title?: string; text?: string }[] }).sections ?? []
  const tools = (p as { tools?: string }).tools // 사이트 작업의 사용 도구 (예: VSCODE · HTML · CSS · JS)
  const pdf = (p.links as { pdf?: string }).pdf
  const site = p.links.demo || (pdf ? `${import.meta.env.BASE_URL}${pdf}` : '') // 사이트가 없는 작업은 PDF를 바로 연다
  const pdfHref = pdf ? `${import.meta.env.BASE_URL}${pdf}` : ''
  const pdfOnly = !p.links.demo && !!pdf // 사이트 링크 없이 PDF만 있는 작업: 보기 + 다운로드 두 버튼
  const siteLabel = !p.links.demo ? 'PDF 보기' : /behance\.net/.test(p.links.demo) ? 'Behance 보기' : /figma\.com/.test(p.links.demo) ? 'Figma에서 보기' : '사이트 보기' // 링크 종류에 맞는 버튼 글자
  const sec = [
    { title: own[0]?.title || '프로젝트 소개', text: own[0]?.text || p.description },
    { title: own[1]?.title || '함께 쓴 키워드', text: own[1]?.text || `함께 쓴 키워드는 ${p.tags.join(', ')}입니다.` },
    { title: own[2]?.title || '역할과 기간', text: own[2]?.text || `역할은 ${p.role}, 작업 기간은 ${p.period}입니다.` },
    { title: own[3]?.title || p.title, text: own[3]?.text || '사이트에서 더 자세한 결과물을 확인해 보세요.' },
  ]
  const siteBtn = (cls: string) => site ? (
    <a href={site} target="_blank" rel="noopener" className={`inline-flex items-center gap-1 rounded-full text-[11px] font-bold hover:brightness-110 ${cls}`}>{siteLabel} <ExternalLink size={12} /></a>
  ) : (
    <span aria-disabled className="inline-block cursor-not-allowed rounded-full bg-black/[.08] px-3.5 py-1 text-[11px] font-bold text-ink-sub">링크 준비 중</span>
  )
  const downloadBtn = (cls: string) => pdfOnly ? <a href={pdfHref} download className={`inline-flex items-center gap-1 rounded-full text-[11px] font-bold hover:brightness-110 ${cls}`}>PDF 다운로드 <Download size={12} /></a> : null
  return (
    <div data-scroll className="h-full overflow-y-auto bg-white [scrollbar-width:none]">
      {/* hero: left-aligned text with the button set apart from the title, then the photo edge to edge */}
      <section className="relative flex h-full flex-col overflow-hidden bg-[#f4f6fb]">
        {/* 슬라이드형 작업: 메인 사진을 첫 화면 전체 배경에 흐리고 옅게 깐다 */}
        {(fit === 'slide' || fit === 'a4') && slideImgs[0] && <img aria-hidden src={slideImgs[0]} alt="" draggable={false} decoding="async" className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover opacity-30 blur-2xl" />}
        <div className="relative flex shrink-0 items-start justify-between gap-3 px-4 pb-4 pt-4">
          <div className="min-w-0">
            <Eyebrow>{p.role}</Eyebrow>
            <h2 className="mb-1.5 text-[24px] font-extrabold leading-[1.2] tracking-tight text-[#16171a]">{p.title}</h2>
            <p className="line-clamp-1 text-[11px] leading-[1.4] text-[#6b6f78]">{p.summary}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">{site ? siteBtn('bg-[#0a6cff] px-4 py-1 text-white shadow-[0_6px_14px_-6px_rgba(10,108,255,.7)]') : siteBtn('')}{downloadBtn('bg-white px-4 py-1 text-[#0a6cff] ring-1 ring-[#0a6cff]/40')}</div>
          </div>
          <ChipBadge i={s.proj} className="mt-1 w-[76px]" />
        </div>
        <HeroSlides imgs={slideImgs.length ? slideImgs : p.thumbnail ? [p.thumbnail] : []} i={s.proj} contain={contain} dark={dark} glow={fit === 'slide' || fit === 'a4'} className="relative min-h-0 w-full flex-1" />
      </section>

      {/* 띠마다 글자는 가운데 정렬, 사진은 그 아래 가운데에 놓는다 */}
      {/* band 1: white, text, then the photo on a grey panel */}
      <section className="bg-white px-4 py-6 text-center">
        <Eyebrow>Overview</Eyebrow>
        <h3 className={`${H3} text-[#16171a]`}>{sec[0].title}</h3>
        <p className={`mx-auto max-w-[460px] ${BODY} text-[#3c3f46]`}>{sec[0].text}</p>
        <div className={`mx-auto mt-4 ${panelW} rounded-xl bg-[#f1f2f7] p-2.5`}>
          <Photo src={imgs[1]} i={s.proj} k={1} plain contain={fit === 'contain'} className={`${ratio} w-full`} />
        </div>
      </section>

      {/* band 2: white, text, the big number 24px under it, then the photo panel */}
      <section className="bg-white px-4 py-6 text-center">
        <Eyebrow>Role</Eyebrow>
        <h3 className={`${H3} text-[#16171a]`}>{sec[2].title}</h3>
        <p className={`mx-auto max-w-[460px] ${BODY} text-[#3c3f46]`}>{sec[2].text}</p>
        <div className="mx-auto mt-6 flex max-w-[460px] justify-center">
          <div className="w-[35%]"><div className="text-[22px] font-extrabold leading-none text-[#16171a]">{p.period}</div><div className="mt-1.5 text-[9px] text-[#6b6f78]">작업 기간</div></div>
          <div className="w-[35%]"><div className="text-[22px] font-extrabold leading-none text-[#16171a]">100%</div><div className="mt-1.5 text-[9px] text-[#6b6f78]">작업 비중</div></div>
          {tools && <div className="w-[30%]"><div className="text-[10px] font-extrabold leading-[22px] text-[#16171a]">{tools.split(' · ').map(t => <span key={t} className="mx-[2px] inline-block whitespace-nowrap">{t}</span>)}</div><div className="mt-1.5 text-[9px] text-[#6b6f78]">사용 도구</div></div>}
        </div>
        <div className={`mx-auto mt-4 ${panelW} rounded-xl bg-[#f1f2f7] p-2.5`}>
          <Photo src={imgs[4]} i={s.proj} k={4} plain contain={fit === 'contain'} className={`${ratio} w-full`} />
        </div>
      </section>

      {/* band 3: dark closing band */}
      <section className="bg-[#0b0b0d] px-4 py-6 text-center text-white">
        <Eyebrow dark>Next</Eyebrow>
        <h3 className={`${H3}`}>{sec[3].title}</h3>
        <p className={`mx-auto max-w-[460px] ${BODY} text-white/65`}>{sec[3].text}</p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">{site ? siteBtn('bg-white px-3.5 py-1 text-[#0b0b0d]') : siteBtn('')}{downloadBtn('bg-transparent px-3.5 py-1 text-white ring-1 ring-white/50')}</div>
        <Photo src={imgs[5]} i={s.proj} k={5} plain contain={fit === 'contain'} className={`mx-auto mt-4 ${ratio} ${panelW} rounded-lg`} />
      </section>
    </div>
  )
}

// 이름 뒤 괄호(예: Claude (Claude Code))는 작고 옅게 보여 레벨 글자와 겹치지 않게 한다
function skillLabel(name: string) {
  const m = name.match(/^(.*?)\s*(\(.*\))$/)
  if (!m) return name
  return <span className="flex flex-col leading-tight">{m[1]}<span className="text-[9px] font-semibold text-ink-sub">{m[2].slice(1, -1)}</span></span>
}

const SKILL_COLOR = ['#1fb6e8', '#ff4b3e', '#34c759', '#ff9f43']
// 카테고리별 제목 아이콘 (없는 이름이면 Wrench)
const SKILL_ICON: Record<string, typeof Code2> = { Frontend: Code2, Design: Palette, AI: Sparkles, Etc: Wrench }
function Skills() {
  return (
    <div data-scroll className="h-full overflow-y-auto px-7 pb-5 [scrollbar-width:none]">
      <Title small>SKILLS</Title>
      <div className="grid grid-cols-3 gap-4">
        {skills.map((g, gi) => {
          const c = SKILL_COLOR[gi % SKILL_COLOR.length]
          return (
            <div key={g.category} className="rounded-2xl bg-card px-4 pb-4 pt-4 shadow-[0_6px_14px_-8px_rgba(0,0,0,.35)] ring-1 ring-black/10">
              <div className="mb-4 flex items-center gap-2.5"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg text-white shadow-[0_2px_5px_-1px_rgba(0,0,0,.4)]" style={{ background: `linear-gradient(160deg, ${c}, ${c}cc)` }}>{(() => { const I = SKILL_ICON[g.category] ?? Wrench; return <I size={14} strokeWidth={2.3} /> })()}</span><span className="text-[13px] font-extrabold tracking-tight text-ink">{g.category}</span></div>
              {g.items.map(it => {
                return (
                <div key={it.name} className="mb-3.5 last:mb-0">
                  <div className={`flex items-center justify-between gap-3 font-bold mb-1.5 text-[12px]`}><span className="flex min-w-0 items-center gap-2 whitespace-nowrap"><SkillIcon name={it.name} /><span className="whitespace-nowrap">{skillLabel(it.name)}</span></span><span className="text-[10px] font-semibold text-ink-sub">LV.{it.level}</span></div>
                  <div className="flex gap-[3px]">
                    {[1, 2, 3, 4, 5].map(n => <i key={n} className="h-[6px] flex-1 rounded-full" style={{ background: n <= it.level ? `linear-gradient(180deg, ${c}, ${c}bb)` : 'rgba(0,0,0,.09)' }} />)}
                  </div>
                </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const CONTACT_ICON = [{ Icon: Mail, c: '#1fb6e8' }, { Icon: Github, c: '#2b2d33' }, { Icon: Instagram, c: '#e1306c' }]
function Contact({ s }: { s: State }) {
  const pickRow = useContext(RowContext)
  return (
    <div className="px-7">
      <Title>CONTACT</Title>
      {contactItems.map((c, i) => {
        const { Icon, c: col } = CONTACT_ICON[i % CONTACT_ICON.length]
        return (
          <div key={c.label} role="link" tabIndex={-1} onClick={() => { pickRow('CONTACT', i); window.open(c.url, '_blank', 'noopener') }}
            className={`mb-2.5 flex cursor-pointer items-center gap-3 rounded-xl bg-card py-2 pl-2 pr-4 text-[13px] font-bold transition-transform hover:scale-[1.01] ${i === s.contact ? FOCUS : REST}`}>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white shadow-[0_3px_6px_-2px_rgba(0,0,0,.4)]" style={{ background: `linear-gradient(160deg, ${col}, ${col}cc)` }}><Icon size={18} strokeWidth={2.1} /></span>
            {c.label}
            <span className="ml-auto flex items-center gap-1.5 text-[11px] font-normal text-ink-sub">{'handle' in c ? c.handle : profile.email}<ExternalLink size={12} /></span>
          </div>
        )
      })}
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

const MW = 9, MH = 9, MINES = 10
type MCell = { mine: boolean; open: boolean; flag: boolean; n: number }
const MCOLORS = ['', '#2a7bf0', '#2ea44f', '#e5473a', '#7a45d6', '#a3362c', '#12a3a3', '#16171a', '#6b6f78']
const mkBoard = (): MCell[] => Array.from({ length: MW * MH }, () => ({ mine: false, open: false, flag: false, n: 0 }))
const around = (i: number) => {
  const x = i % MW, y = Math.floor(i / MW), out: number[] = []
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const nx = x + dx, ny = y + dy
    if ((dx || dy) && nx >= 0 && nx < MW && ny >= 0 && ny < MH) out.push(ny * MW + nx)
  }
  return out
}

/** Minesweeper, 9x9 with 10 mines. Pad: ◀▶▲▼ move the cursor, A opens (on a number: opens the rest around it once enough flags are placed).
 *  Mouse: click opens, right-click flags. F (or the flag button) switches taps to flagging, for touch. The first open is always safe. */
function Mines({ s }: { s: State }) {
  const [board, setBoard] = useState(mkBoard)
  const [phase, setPhase] = useState<'idle' | 'play' | 'won' | 'dead'>('idle')
  const [cur, setCur] = useState(40)
  const [flagMode, setFlagMode] = useState(false)
  const [time, setTime] = useState(0)
  const [best, setBest] = useState(() => { try { return +(localStorage.getItem('folio-mines-best') ?? 0) } catch { return 0 } })
  const seen = useRef(s.pad.n)
  const over = phase === 'won' || phase === 'dead'

  const finish = (b: MCell[], hit: boolean) => {
    if (hit) {
      b.forEach(c => { if (c.mine) c.open = true })
      setPhase('dead')
    } else if (b.every(c => c.mine || c.open)) {
      b.forEach(c => { if (c.mine) c.flag = true })
      setPhase('won')
      if (!best || time < best) { setBest(time); try { localStorage.setItem('folio-mines-best', String(time)) } catch { /* private mode */ } }
    }
    setBoard(b)
  }
  const flood = (b: MCell[], from: number[]) => {
    const stack = [...from]; let hit = false
    while (stack.length) {
      const k = stack.pop()!, c = b[k]
      if (c.open || c.flag) continue
      c.open = true
      if (c.mine) hit = true
      else if (c.n === 0) stack.push(...around(k))
    }
    finish(b, hit)
  }
  const reveal = (i: number) => {
    if (over || board[i].flag || board[i].open) return
    const b = board.map(c => ({ ...c }))
    if (phase === 'idle') { // first open is always safe: mines go anywhere except there and around it
      const ban = new Set([i, ...around(i)]), free = b.map((_, k) => k).filter(k => !ban.has(k))
      for (let m = 0; m < MINES; m++) b[free.splice(Math.floor(Math.random() * free.length), 1)[0]].mine = true
      b.forEach((c, k) => { c.n = around(k).filter(a => b[a].mine).length })
      setPhase('play'); setTime(0)
    }
    flood(b, [i])
  }
  const chord = (i: number) => {
    const c = board[i], ring = around(i)
    if (over || !c.open || !c.n || ring.filter(a => board[a].flag).length !== c.n) return
    flood(board.map(x => ({ ...x })), ring)
  }
  const flag = (i: number) => {
    if (over || board[i].open) return
    setBoard(board.map((c, k) => (k === i ? { ...c, flag: !c.flag } : c)))
  }
  const act = (i: number) => (board[i].open ? chord(i) : flagMode ? flag(i) : reveal(i))
  const restart = () => { setBoard(mkBoard()); setPhase('idle'); setTime(0) }

  useEffect(() => { // pad
    if (s.pad.n === seen.current) return
    seen.current = s.pad.n
    const b = s.pad.b, x = cur % MW, y = Math.floor(cur / MW)
    if (b === 'A') return over ? restart() : act(cur)
    if (b === 'left') setCur(y * MW + Math.max(0, x - 1))
    else if (b === 'right') setCur(y * MW + Math.min(MW - 1, x + 1))
    else if (b === 'up') setCur(Math.max(0, y - 1) * MW + x)
    else if (b === 'down') setCur(Math.min(MH - 1, y + 1) * MW + x)
  }, [s.pad.n])

  useEffect(() => {
    if (phase !== 'play') return
    const id = setInterval(() => setTime(t => Math.min(999, t + 1)), 1000)
    return () => clearInterval(id)
  }, [phase])

  useEffect(() => { // F toggles flag mode
    const k = (e: KeyboardEvent) => { if ((e.key === 'f' || e.key === 'F' || e.code === 'KeyF') && !e.metaKey && !e.ctrlKey) setFlagMode(v => !v) }
    addEventListener('keydown', k)
    return () => removeEventListener('keydown', k)
  }, [])

  const left = MINES - board.filter(c => c.flag).length
  const msg = phase === 'won' ? '클리어! 🎉' : phase === 'dead' ? '펑! 지뢰를 밟았어요' : phase === 'idle' ? '아무 칸이나 열어 시작' : '지뢰를 피해 모두 열어요'
  const help = [
    { Icon: Move, t: '방향키로 칸 이동' },
    { Icon: CircleDot, t: 'A 로 열기', d: '숫자 위 A: 주변 열기' },
    { Icon: MousePointerClick, t: '클릭 열기', d: '우클릭 깃발' },
    { Icon: Flag, t: 'F 깃발 모드', d: '터치는 이 모드로 깃발' },
  ]
  return (
    <div className="px-7">
      <div className="flex items-baseline justify-between">
        <Title>MINES</Title>
        <span className="label">Time {time} · Best {best || '-'}</span>
      </div>
      {/* three columns: the two side panels are equal width and centred in their column, so both sit the same distance from the board */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        {/* left: status + buttons */}
        <div className="mx-auto flex w-[138px] flex-col items-center gap-3 text-center">
          <div className="flex items-center justify-center gap-2 text-[22px] font-extrabold leading-none"><Flag size={20} className="fill-accent-red text-accent-red" />{left}</div>
          <div className="text-[13px] font-bold leading-snug [word-break:keep-all]">{msg}</div>
          <button type="button" tabIndex={-1} onClick={() => setFlagMode(v => !v)} aria-pressed={flagMode}
            className={`flex w-full items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold ring-1 ${flagMode ? 'bg-accent-red text-white ring-accent-red' : 'bg-card ring-black/10'}`}>
            <Flag size={13} />깃발 모드 {flagMode ? 'ON' : 'OFF'}
          </button>
          <button type="button" tabIndex={-1} onClick={restart} className="w-full rounded-full bg-card px-3 py-1.5 text-[12px] font-bold ring-1 ring-black/10">다시 시작</button>
        </div>
        {/* center: the board */}
        <div className="grid rounded-xl bg-[#c9cdd5] p-1 ring-1 ring-black/10" style={{ gridTemplateColumns: `repeat(${MW}, 22px)`, gap: 2 }} onContextMenu={e => e.preventDefault()}>
          {board.map((c, i) => (
            <button key={i} type="button" aria-label={`칸 ${i + 1}`} tabIndex={-1}
              onClick={() => { setCur(i); act(i) }} onContextMenu={e => { e.preventDefault(); setCur(i); flag(i) }}
              className={`grid h-[22px] w-[22px] place-items-center rounded-[4px] text-[13px] font-extrabold leading-none
                ${c.open ? (c.mine ? 'bg-accent-red text-white' : 'bg-[#f3f4f6]') : 'bg-gradient-to-b from-white to-[#dfe3ea] shadow-[0_1px_0_rgba(0,0,0,.25)] hover:to-white'}
                ${i === cur ? 'ring-2 ring-accent-blue' : ''}`}>
              {c.open ? (c.mine ? <Bomb size={13} /> : c.n ? <span style={{ color: MCOLORS[c.n] }}>{c.n}</span> : null) : c.flag ? <Flag size={12} className="fill-accent-red text-accent-red" /> : null}
            </button>
          ))}
        </div>
        {/* right: controls */}
        <ul className="mx-auto flex w-[138px] flex-col gap-3">
          {help.map(h => (
            <li key={h.t} className="flex items-start gap-2.5">
              <h.Icon size={18} strokeWidth={2} className="mt-px shrink-0 text-accent-blue" />
              <div className="text-[12px] leading-tight"><div className="font-extrabold">{h.t}</div>{h.d && <div className="mt-0.5 text-[10.5px] text-ink-sub">{h.d}</div>}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

const ARCADE = [
  { name: 'SIDE QUEST', sub: 'A · 점프', color: '#1fb6e8', Icon: Footprints, View: Runner },
  { name: 'BLOCKS', sub: '떨어지는 블록 쌓기', color: '#a45cff', Icon: LayoutGrid, View: Blocks },
  { name: 'STAR FIGHTER', sub: '우주 슈팅', color: '#ff4b3e', Icon: Rocket, View: Starfighter },
  { name: 'MINES', sub: '지뢰찾기', color: '#2ea44f', Icon: Bomb, View: Mines },
]

/** GAME tab: pick one of the mini games (◀▶ + A); B goes back to this menu. */
function Game({ s }: { s: State }) {
  const pickRow = useContext(RowContext)
  if (s.gmode !== null) { const V = ARCADE[s.gmode].View; return <V s={s} /> }
  return (
    <div className="px-7">
      <Title>ARCADE</Title>
      <div className="grid grid-cols-4 gap-2.5">
        {ARCADE.map((a, i) => (
          <div key={a.name} role="button" tabIndex={-1} onClick={() => pickRow('GAME', i)} className={`flex h-[120px] cursor-pointer flex-col justify-between rounded-2xl p-3 text-white transition-transform hover:scale-[1.02] ${i === s.game ? 'ring-[3px] ring-accent-blue ring-offset-2' : ''}`} style={{ background: a.color }}>
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

export default function Screen({ s, bootMs, dark, instantLoad = false }: { s: State; bootMs: number; dark: boolean; instantLoad?: boolean }) {
  const press = useContext(PressContext)
  const open = useContext(OpenContext)
  // The black loading splash is an overlay that fades in over the old screen and fades out over the new one.
  // `base` is the screen underneath: it stays on the old screen until the overlay is opaque, then swaps to the project unseen.
  const loading = s.screen === 'LOAD'
  // 커서가 올라간 프로젝트의 사진을 미리 준비하고, 한가할 때 나머지 프로젝트도 차례로 준비한다
  const [base, setBase] = useState(s.screen)
  useEffect(() => {
    if (!loading) return setBase(s.screen)
    const t = setTimeout(() => setBase('DETAIL'), instantLoad ? 0 : 550) // instantLoad: the splash is already opaque, swap right away
    return () => clearTimeout(t)
  }, [s.screen, loading])
  const View = base === 'BOOT' ? null : views[base]
  const chrome = !!View
  const cut = loading // swaps that happen behind the opaque overlay are instant
  return (
    <div className={`relative screen-font flex h-full flex-col bg-screen text-ink ${dark ? 'screen-dark' : ''}`}>
      {/* soft light from the top and a faint vignette, so the flat grey reads as a lit screen */}
      <div aria-hidden className={`pointer-events-none absolute inset-0 ${dark ? 'bg-[radial-gradient(110%_80%_at_50%_0%,rgba(255,255,255,.07),transparent_70%)]' : 'bg-[radial-gradient(110%_80%_at_50%_0%,rgba(255,255,255,.75),transparent_70%),linear-gradient(180deg,transparent_70%,rgba(0,0,0,.05))]'}`} />
      {chrome && (
        <motion.div className="relative grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 px-7 py-2.5 text-[11px] font-semibold" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          {/* three columns: profile (+ the inserted cartridge, right beside it) | Portfolio | status. The cartridge's name only shrinks inside its own column, so it never reaches "Portfolio" */}
          <span className="flex min-w-0 items-center gap-2">
            <button type="button" tabIndex={-1} aria-label="프로필 (About)" onClick={() => open('dock', 0)} className="flex shrink-0 items-center gap-2 rounded-full py-0.5 pr-2 hover:bg-black/[.07]">
              <Avatar i={s.avatar} className="h-[26px] w-[26px] shrink-0 ring-2 ring-white shadow-[0_2px_5px_rgba(0,0,0,.3)]" />
              <span className="shrink-0">{profile.name}</span>
            </button>
            {s.only !== null && (
              <span className="ml-1 flex min-w-0 items-center gap-1.5 rounded-full bg-card px-2.5 py-1 ring-1 ring-black/10">
                <span className="h-3 w-2.5 shrink-0 bg-accent-blue" style={{ clipPath: 'polygon(0 0, 70% 0, 100% 20%, 100% 100%, 0 100%)', borderRadius: 1 }} />
                <span className="truncate text-[10px] font-bold">{projects[s.only].title}</span>
              </span>
            )}
          </span>
          <span aria-hidden className="pointer-events-none font-display text-[15px] font-black tracking-tight">Portfolio</span>
          <span className="flex shrink-0 items-center justify-end gap-3.5">
            <Wifi size={16} strokeWidth={2.6} className="text-ink" /><Clock /><Battery />
          </span>
        </motion.div>
      )}
      <div className="relative flex-1 overflow-hidden">
        {/* popLayout: the old screen fades out while the new one fades in (a dissolve with a slight slide), no gap in between */}
        <AnimatePresence mode="popLayout" initial={false} custom={{ d: s.dir, cut }}>
          <motion.div key={base} className="h-full will-change-[transform,opacity]"
            custom={{ d: s.dir, cut }}
            variants={{
            in: ({ d, cut }: Motion) => cut ? { x: 0, opacity: 1 } : { x: 28 * d, opacity: 0 },
            show: ({ cut }: Motion) => ({ x: 0, opacity: 1, transition: { duration: cut ? 0 : 0.5, ease: [0.4, 0, 0.2, 1] } }),
            out: ({ d, cut }: Motion) => cut ? { opacity: 0, transition: { duration: 0 } } : { x: -28 * d, opacity: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } },
            }}
            initial="in" animate="show" exit="out">
            {View ? <View s={s} /> : <Boot ms={bootMs} />}
          </motion.div>
        </AnimatePresence>
      </div>
      {chrome && (
        <div className="relative flex items-center justify-between border-t border-black/[.07] px-5 py-1 text-[10px] font-semibold text-ink-sub">
          <span>◀▶▲▼ 이동</span>
          <span className="flex items-center gap-1">
            {([['A', '선택', 'A'], ['B', '뒤로', 'B'], ['H', '홈', 'HOME']] as const).map(([g, t, b]) => (
              <button key={b} type="button" onClick={() => press(b)} className="flex items-center gap-1.5 rounded-full py-0.5 pl-0.5 pr-2 hover:bg-black/[.07] hover:text-ink">
                <span className="grid h-4 w-4 place-items-center rounded-full bg-ink text-[9px] font-extrabold leading-none text-screen">{g}</span>{t}
              </button>
            ))}
          </span>
        </div>
      )}
      <AnimatePresence>
        {loading && (
          <motion.div key="load" className="absolute -inset-[2px] z-20" /* 소수점 배율(모바일 확대)에서 가장자리에 아래 화면이 1px 비치지 않도록 살짝 크게 덮는다 */ initial={{ opacity: instantLoad ? 1 : 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.55, ease: 'easeInOut' }}>
            <Splash s={s} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
