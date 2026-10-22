import { ReactNode, RefObject, createContext, useContext, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Code2, Dices, Download, Maximize2, X, Palette, Sparkles, Wrench, Github, Instagram, Wifi, Goal, ExternalLink, FolderOpen, Footprints, Gamepad2, Gauge, Mail, MousePointerClick, Move, Rocket, User } from 'lucide-react'
import SkillIcon, { TileArt } from './SkillIcons'
import { AVATAR_ORDER, Btn, contactItems, DOCK, State, TILES } from '../../store/nav'
import { Avatar, AVATARS, Coin, runFrame } from './avatars'
import Yacht from './Yacht'
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
      <span className="relative h-[14px] w-[30px] overflow-hidden rounded-[4px] border-[1.5px] border-ink/40">
        <span className={`absolute inset-y-0 left-0 ${low ? 'bg-[#ff453a]' : 'bg-[#4cd964]'}`} style={{ width: `${Math.max(level, 6)}%` }} />
        <span className="absolute inset-0 grid place-items-center text-[9px] font-extrabold leading-none text-white [text-shadow:0_1px_1px_rgba(0,0,0,.6)]">{level}</span>
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

/** Box-art colours per tile (light, dark) and the one-line blurb shown under the focused tile, like a game's title on the Switch home. */
// 홈 타일 색: 조이콘처럼 왼쪽 파랑에서 가운데 보라를 지나 오른쪽 빨강으로 이어지게 통일 (밝은 색, 어두운 색)
const TILE_ART = { ABOUT: ['#52a8ff', '#1f5fd0'], SKILLS: ['#6e8cff', '#3a4fcf'], PROJECTS: ['#a07cf0', '#6a45c2'], CONTACT: ['#f27a9a', '#c23a62'], GAME: ['#ff6b5e', '#c92a2a'] } as const
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
    <div className="relative flex h-full flex-col items-center justify-center">
      {/* 다섯 칸(116px 정사각형 + 간격 10px)이 한 줄에 다 보이고, 타일 줄과 이름·설명은 화면 가운데에 놓는다 */}
      <div className="px-2 py-3">
        <div className="flex gap-2.5 py-1">
          {TILES.map((t, i) => {
            const sel = tileFocus && i === s.home
            const [hi, lo] = TILE_ART[t]
            const chip = t === 'PROJECTS' && s.only !== null // 칩이 꽂히면 이 칸은 그 프로젝트의 로고 + 제목으로 바뀐다
            return (
              <div key={t} className="relative shrink-0">
                {/* 유리 카드: 뒤에 타일 색의 흐린 빛 덩어리를 깔고, 그 위에 반투명 간유리 면을 얹는다. 선택하면 빛이 진해지고 테두리가 밝아진다 */}
                <span aria-hidden className="pointer-events-none absolute -inset-4 z-0 rounded-full transition-opacity duration-300" style={{ background: `radial-gradient(closest-side, ${hi} 0%, ${lo} 65%, transparent 100%)`, opacity: sel ? 0.5 : 0.22 }} />
                <motion.button aria-label={label(t)} onClick={() => open('tile', i)} animate={{ scale: sel ? 1.04 : 1, y: sel ? -3 : 0 }} transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                  className={`relative z-10 block h-[116px] w-[116px] overflow-hidden rounded-[22px] text-left backdrop-blur-xl ${sel ? 'ring-[1.5px] ring-white/90' : 'ring-1 ring-white/35'}`}
                  style={{ background: 'linear-gradient(150deg, rgba(255,255,255,.34) 0%, rgba(255,255,255,.10) 55%, rgba(255,255,255,.18) 100%)', boxShadow: `inset 0 1px 1px rgba(255,255,255,.7), inset 0 -10px 18px -8px ${lo}88, 0 14px 26px -12px rgba(0,0,0,.55)` }}>
                  {chip ? (
                    <>
                      {/* 꽂힌 카트리지: 다른 타일과 같은 유리 카드 위에 작품 로고를 작은 상자로 올리고, 이름은 같은 가는 글씨, PLAYING은 유리 알약으로 */}
                      <span className="absolute left-1/2 top-[46%] block h-[50px] w-[50px] -translate-x-1/2 -translate-y-1/2"><ChipBadge i={s.only!} bare className="!absolute !inset-0 !aspect-auto !h-full !w-full !rounded-2xl" /></span>
                      <span className="absolute left-2 top-2 rounded-full bg-white/25 px-2 py-0.5 text-[8px] font-bold tracking-[0.16em] text-white ring-1 ring-white/40 backdrop-blur-sm">PLAYING</span>
                      <span aria-hidden className="absolute -left-4 -top-6 h-16 w-24 rotate-[-18deg] bg-white/30 blur-xl" />
                      <span className="absolute inset-x-1 bottom-3 truncate text-center text-[10px] font-semibold tracking-[0.12em] text-white [text-shadow:0_1px_6px_rgba(0,0,0,.35)]">{label(t)}</span>
                    </>
                  ) : (
                    <>
                      <span aria-hidden className="absolute left-1/2 top-[41%] block h-[70px] w-[70px] -translate-x-1/2 -translate-y-1/2 [filter:drop-shadow(0_2px_8px_rgba(255,255,255,.35))]"><TileArt name={t} color="#ffffff" /></span>
                      <span aria-hidden className="absolute -left-4 -top-6 h-16 w-24 rotate-[-18deg] bg-white/30 blur-xl" />
                      <span className="absolute inset-x-0 bottom-3 text-center text-[11px] font-semibold tracking-[0.26em] text-white [text-shadow:0_1px_6px_rgba(0,0,0,.35)]">{label(t)}</span>
                    </>
                  )}
                </motion.button>
              </div>
            )
          })}
        </div>
      </div>
      {/* the focused tile's name and blurb */}
      <div className="mt-5 h-12 w-full px-7 text-center">
        <AnimatePresence mode="wait" initial={false}>
          {tileFocus && (
            <motion.div key={cur} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}>
              <div className="text-[17px] font-extrabold leading-tight">{label(cur)}</div>
              <div className="mt-0.5 text-[13px] text-ink-sub">{s.only !== null && cur === 'PROJECTS' ? projects[s.only].summary : TILE_SUB[cur]}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function About({ s }: { s: State }) {
  const pick = useContext(AvatarContext)
  // 동전: 캐릭터를 바꾸거나 동전을 누르면 한 바퀴 돈다 (뒷면도 같은 그림이라 실제 사진은 나오지 않는다)
  const [rot, setRot] = useState(0)
  const prev = useRef(s.avatar)
  useEffect(() => {
    if (prev.current === s.avatar) return
    prev.current = s.avatar
    setRot(r => r + 360)
  }, [s.avatar])
  return (
    <Scroll>
      <Title>ABOUT ME</Title>
      <div className="mb-5 flex items-center gap-7">
        <div className="shrink-0 text-center">
          <div className="pb-3"><Coin rot={rot} front={s.avatar} onClick={() => setRot(r => r + 360)} /></div>
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
      {/* 사이트 한 줄 소개(두 줄): 닌텐도처럼 시대에 맞게 바뀌는 나, 그래서 seungwon.2 */}
      <p className="mb-4 border-l-[3px] border-accent-blue pl-3 text-[14px] font-extrabold leading-[1.6] tracking-tight text-ink">
        {profile.statement.map(line => <span key={line} className="block">{line}</span>)}
      </p>
      <p className="mb-4 text-[13px] leading-relaxed">{profile.intro}</p>
      <div className="label mb-2">Timeline</div>
      {profile.timeline.map(t => (
        <div key={t.period} className="mb-3 border-l-2 border-accent-blue pl-3">
          <div className="text-[11px] font-semibold text-accent-blue">{t.period}</div>
          <div className="text-[13px] font-bold">{t.title}</div>
          <div className="text-[12px] text-ink-sub">{t.desc}</div>
        </div>
      ))}
    </Scroll>
  )
}

/** 프로젝트 목록: 2칸씩 카드로 배치. 위에 대표 사진, 아래에 제목·한 줄 소개·분류. */
function Projects({ s }: { s: State }) {
  const pickRow = useContext(RowContext)
  const cover = (p: (typeof projects)[number]) => {
    const f = ((p as { heroImages?: string[] }).heroImages?.[0] ?? (p as { images?: string[] }).images?.[0] ?? (p as { banners?: { image?: string }[] }).banners?.[0]?.image) as string | undefined
    return f ? (/^(https?:)?\//.test(f) ? f : `${import.meta.env.BASE_URL}projects/${f}`) : ''
  }
  return (
    <div className="h-full overflow-y-auto px-5 pb-12 pt-1 [scrollbar-width:none]">
      {/* 바깥 여백·제목과 카드 사이·카드 사이를 모두 20px로 같게 맞춘다 (아래는 화면 하단 조작 막대가 가리는 높이만큼 더 비운다) */}
      <div className="mb-2"><Title>PROJECTS</Title></div>
      <div className="grid grid-cols-2 gap-5">
        {projects.map((p, i) => {
          const soon = (p as { soon?: boolean }).soon
          const img = cover(p)
          return (
            <div key={p.id} ref={el => { if (i === s.proj) el?.scrollIntoView({ block: 'nearest' }) }}
              role="button" tabIndex={-1} onClick={() => pickRow('PROJECTS', i)}
              className={`scroll-mb-12 scroll-mt-5 cursor-pointer overflow-hidden rounded-xl bg-card transition-transform hover:scale-[1.01] ${i === s.proj ? FOCUS : REST}`}>
              <div className="relative aspect-[9/4] w-full overflow-hidden bg-d-bg2">
                {img ? <img src={img} alt="" draggable={false} decoding="async" className="absolute inset-0 h-full w-full object-cover object-top" />
                  : <ChipBadge i={i} bare className="!absolute !inset-0 !aspect-auto !rounded-none !shadow-none !ring-0" />}
                <span className="absolute left-2 top-2 rounded-md bg-black/55 px-1.5 py-0.5 text-[11px] font-extrabold text-white">{String(i + 1).padStart(2, '0')}</span>
                {soon && <span className="absolute inset-0 grid place-items-center bg-black/45 text-[12px] font-extrabold tracking-[0.18em] text-white">COMING SOON</span>}
              </div>
              <div className="px-3 pb-2.5 pt-2">
                <div className="truncate text-[14px] font-extrabold">{p.title}</div>
                <div className="mt-0.5 line-clamp-2 min-h-[34px] text-[12px] leading-[1.4] text-ink-sub">{p.summary}</div>
                <div className="mt-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wide text-ink-sub/80">
                  <span>{p.role}</span>{!soon && <span>{p.period}</span>}
                </div>
              </div>
            </div>
          )
        })}
      </div>
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
    <div className={`relative overflow-hidden rounded-xl ${contain ? 'bg-d-bg2' : 'bg-[#d9d9d9]'} ${plain ? '' : 'shadow-[0_8px_16px_-8px_rgba(0,0,0,.4)]'} ${className}`}>
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
/** 사진을 40×32 캔버스에 꽉 채워(cover) 그려 두면, 화면에 늘려 보일 때 부드럽게 번져 흐린 배경처럼 보인다. */
function GlowCanvas({ src }: { src: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const im = new Image()
    im.onload = () => {
      const c = ref.current, g = c?.getContext('2d')
      if (!c || !g) return
      const r = Math.max(c.width / im.width, c.height / im.height)
      g.drawImage(im, (c.width - im.width * r) / 2, (c.height - im.height * r) / 2, im.width * r, im.height * r)
    }
    im.src = src
  }, [src])
  return <canvas ref={ref} width={40} height={32} className="h-full w-full" />
}

function HeroSlides({ imgs: all, i, className = '', contain = false, dark = false, glow = false }: { imgs: string[]; i: number; className?: string; contain?: boolean; dark?: boolean; glow?: boolean }) {
  const imgs = [...new Set(all)] // 같은 사진이 여러 칸에 쓰여도 슬라이드는 한 번만
  const n = imgs.length || 4
  const [idx, setIdx] = useState(0)
  const single = imgs.length === 1 // 한 장이면 움직이지 않고 칸을 꽉 채워 고정
  useEffect(() => {
    if (single) return
    const t = setInterval(() => setIdx(v => (v + 1) % n), 1500)
    return () => clearInterval(t)
  }, [n, single])
  // 다음 사진이 넘어오는 순간 비어 보이지 않도록 모든 사진을 미리 받아 둔다
  useEffect(() => { imgs.forEach(src => { const im = new Image(); im.decoding = 'async'; im.src = src }) }, [imgs.join('|')]) // eslint-disable-line react-hooks/exhaustive-deps
  if (single) return (
    <div className={`relative overflow-hidden bg-d-bg2 ${className}`}>
      <img src={imgs[0]} alt="" draggable={false} decoding="async" className="absolute inset-0 h-full w-full object-cover object-top" />
    </div>
  )
  return (
    <div className={`relative overflow-hidden ${dark ? 'bg-[#0d0d0f]' : contain ? 'bg-d-bg2' : 'bg-[#d9d9d9]'} ${className}`}>
      {/* glow: 지금 슬라이드를 아주 작은 캔버스에 줄여 그린 뒤 늘려서(흐린 효과) 뒤에 깔아, 슬라이드 양옆 빈 곳이 같은 사진 색으로 번지게 한다.
          blur 필터는 확대 화면에서 매 프레임 다시 그려져 끊겨서 쓰지 않는다. */}
      {glow && imgs.length > 0 && (
        <AnimatePresence initial={false}>
          <motion.div key={`g${idx}`} aria-hidden className="pointer-events-none absolute inset-0"
            initial={{ opacity: 0 }} animate={{ opacity: 0.8 }} exit={{ opacity: 0.8, transition: { duration: 0, delay: 0.45 } }} transition={{ duration: 0.45 }}>
            <GlowCanvas src={imgs[idx]} />
          </motion.div>
        </AnimatePresence>
      )}
      <AnimatePresence initial={false}>
        <motion.div
          key={idx}
          className="absolute inset-0 [will-change:transform]"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
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
      <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1">
        {Array.from({ length: n }, (_, k) => <span key={k} className={`h-1 rounded-full transition-all ${k === idx ? 'w-4 bg-white' : 'w-1 bg-white/50'}`} />)}
      </div>
    </div>
  )
}

// 프로젝트 페이지 글자 규격: 띠 제목·본문·라벨 간격을 모든 띠에서 같게 쓴다
const H3 = 'mb-1.5 text-[16px] font-extrabold leading-[1.3] tracking-tight'
const BODY = 'text-[11px] leading-[1.6]'
const Eyebrow = ({ children, dark = false }: { children: ReactNode; dark?: boolean }) => (
  <div className={`mb-1 text-[10px] font-bold leading-none tracking-wide ${dark ? 'text-[#4aa3ff]' : 'text-[#0a6cff]'}`}>{children}</div>
)

/** 사용 도구 개수에 따른 크기: 적을수록 크게, 많을수록 작게 (한 줄에 들어오도록). 인라인 스타일 대신 미리 정한 클래스를 쓴다. */
const toolSize = (n: number) => (
  n <= 2 ? { box: 'h-[24px] w-[24px]', scale: 'scale-[1.2]', text: 'text-[14px]', gap: 'gap-x-4' }
  : n === 3 ? { box: 'h-[20px] w-[20px]', scale: 'scale-100', text: 'text-[12px]', gap: 'gap-x-3.5' }
  : n === 4 ? { box: 'h-[16px] w-[16px]', scale: 'scale-[.8]', text: 'text-[10px]', gap: 'gap-x-3' }
  : n === 5 ? { box: 'h-[13px] w-[13px]', scale: 'scale-[.65]', text: 'text-[8px]', gap: 'gap-x-2' }
  : n === 6 ? { box: 'h-[11px] w-[11px]', scale: 'scale-[.55]', text: 'text-[7px]', gap: 'gap-x-1.5' }
  : { box: 'h-[9px] w-[9px]', scale: 'scale-[.45]', text: 'text-[6px]', gap: 'gap-x-1' }
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
  // banners: 배너 작품 목록. 한 줄에 배너 사진(왼쪽) + 브랜드 로고·상품명·설명(오른쪽)으로 보여 준다
  type Banner = { image?: string; logo?: string; name?: string; text?: string }
  const resolve = (f?: string) => (f ? (/^(https?:)?\//.test(f) ? f : `${import.meta.env.BASE_URL}projects/${f}`) : '')
  const banners = (p as { banners?: Banner[] }).banners
  const bannerImgs = (banners ?? []).map(b => resolve(b.image)).filter(Boolean)
  const fit = (p as { imageFit?: string }).imageFit
  const slideAll = heroImgs.length ? heroImgs : imgs.length ? imgs : bannerImgs
  const slideImgs = fit === 'a4' || banners ? slideAll.slice(0, 1) : slideAll // 상세페이지·배너 작품은 대표 사진 한 장만 고정(넘어가지 않음)
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
  const [zoomSrc, setZoomSrc] = useState<string | null>(null) // 배너를 확대해서 보는 중인 사진 (없으면 닫힘)
  const soon = !!(p as { soon?: boolean }).soon // 준비중인 작업: 상세 내용 대신 안내만 보여 준다
  const showBtns = !!site || !banners // 링크가 없는 배너 작업은 버튼 줄 자체를 숨김
  const siteBtn = (cls: string) => site ? (
    <a href={site} target="_blank" rel="noopener" className={`inline-flex items-center gap-1 rounded-full text-[12px] font-bold hover:brightness-110 ${cls}`}>{siteLabel} <ExternalLink size={12} /></a>
  ) : (
    <span aria-disabled className="inline-block cursor-not-allowed rounded-full bg-black/[.08] px-3.5 py-1 text-[12px] font-bold text-ink-sub">링크 준비 중</span>
  )
  const downloadBtn = (cls: string) => pdfOnly ? <a href={pdfHref} download className={`inline-flex items-center gap-1 rounded-full text-[12px] font-bold hover:brightness-110 ${cls}`}>PDF 다운로드 <Download size={12} /></a> : null
  if (soon) return (
    <div data-scroll className="flex h-full flex-col bg-d-bg1 [scrollbar-width:none]">
      <div className="flex shrink-0 items-start justify-between gap-3 px-4 pb-4 pt-4">
        <div className="min-w-0">
          <Eyebrow>{p.role}</Eyebrow>
          <h2 className="mb-1.5 text-[24px] font-extrabold leading-[1.2] tracking-tight text-ink">{p.title}</h2>
          <p className="text-[12px] leading-[1.4] text-d-sub">{p.summary}</p>
        </div>
        <ChipBadge i={s.proj} className="mt-1 w-[76px]" />
      </div>
      <div className="grid min-h-0 flex-1 place-items-center px-4 pb-6 text-center">
        <div>
          <div className="text-[30px] font-extrabold tracking-tight text-ink">준비중입니다</div>
          <p className="mt-2 text-[12px] leading-[1.6] text-d-sub">더 좋은 모습으로 곧 찾아뵙겠습니다.</p>
        </div>
      </div>
    </div>
  )
  // 상세 화면 배치: 왼쪽 색 패널 + 오른쪽 큰 사진의 첫 화면, 그 아래 번호 붙은 섹션(01 개요 · 02 배경 · 03 역할 · 04 작업물 · 05 링크)
  const tone = PROJ_ART[s.proj % PROJ_ART.length][1]
  // 작업물: 대표 사진·본문 사진을 합쳐 같은 사진은 한 번만 (데이터에 칸을 채우려고 같은 사진이 여러 번 적혀 있다)
  const gallery = banners ? [] : [...new Set([...heroImgs, ...imgs])]
  // 섹션 간격 규칙: 안쪽 요소 사이는 모두 12px(gap-3), 섹션 위아래는 24px. 번호는 제목 바로 옆에 둔다
  const label = 'text-[10px] font-bold uppercase tracking-[0.18em] text-d-mute'
  const sectionBox = 'flex flex-col gap-3 border-t border-d-line px-5 py-6'
  const h3 = 'text-[22px] font-extrabold leading-[1.25] tracking-tight text-ink'
  // 섹션 번호는 실제로 보이는 섹션만 차례로 센다. 키워드 섹션(02)은 작품이 직접 쓴 글이 있을 때만 보여 준다(상세페이지·배너 작품은 빼는 중)
  const hasContext = !!own[1]?.text
  let secNo = 0
  const num = () => String(++secNo).padStart(2, '0')
  const head = (n: string, title: string) => (
    <h3 className={`${h3} flex items-baseline gap-3`}><span className="text-[16px] text-accent-blue">{n}</span><span>{title}</span></h3>
  )
  const galleryRatio = fit === 'a4' ? 'aspect-[210/297]' : fit === 'contain' ? 'aspect-[16/10]' : 'aspect-[16/9]'
  return (
    <div className="relative h-full">
    <div data-scroll className="h-full overflow-y-auto bg-d-band [scrollbar-width:none]">
      {/* 첫 화면. 상세페이지(a4)·배너 작품은 왼쪽 소개 패널 + 오른쪽 사진(원래 배치), 웹·앱 작업은 위에 사진을 꽉 차게 + 아래 가운데 정렬 소개 */}
      {(fit === 'a4' || banners) ? (
        <section className="flex h-full overflow-hidden">
          <div className="flex w-[44%] shrink-0 flex-col justify-center px-5 py-4 text-white" style={{ background: `linear-gradient(155deg, color-mix(in srgb, ${tone} 60%, #101827), #101827)` }}>
            <div className="mb-3 self-start rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/90 ring-1 ring-white/50">{p.role}</div>
            <h2 className="mb-2 text-[26px] font-extrabold leading-[1.1] tracking-tight">{p.title}</h2>
            <p className="mb-4 line-clamp-2 text-[12px] leading-[1.5] text-white/75">{p.summary}</p>
            {showBtns && <div className="flex flex-wrap items-center gap-2">{site ? siteBtn('bg-[#0a6cff] px-4 py-1 text-white shadow-[0_6px_14px_-6px_rgba(10,108,255,.7)]') : siteBtn('')}{downloadBtn('bg-white px-4 py-1 text-[#0a6cff] ring-1 ring-[#0a6cff]/40')}</div>}
          </div>
          <HeroSlides imgs={slideImgs.length ? slideImgs : p.thumbnail ? [p.thumbnail] : []} i={s.proj} contain={contain} dark={dark} glow className="relative min-w-0 flex-1" />
        </section>
      ) : (
        <section className="flex h-full flex-col overflow-hidden">
          <HeroSlides imgs={slideImgs.length ? slideImgs : p.thumbnail ? [p.thumbnail] : []} i={s.proj} dark={dark} className="relative min-h-0 w-full flex-1" />
          <div className="flex shrink-0 flex-col items-center gap-2 px-5 py-3.5 text-center text-white" style={{ background: `linear-gradient(160deg, color-mix(in srgb, ${tone} 60%, #101827), #101827)` }}>
            <span className="rounded-full px-3 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-white/90 ring-1 ring-white/50">{p.role}</span>
            <h2 className="max-w-full truncate text-[20px] font-extrabold leading-[1.15] tracking-tight">{p.title}</h2>
            <div className="flex max-w-full items-center justify-center gap-3">
              <p className="min-w-0 truncate text-[11px] leading-[1.4] text-white/75">{p.summary}</p>
              {showBtns && <div className="flex shrink-0 items-center gap-2">{site ? siteBtn('bg-[#0a6cff] px-3.5 py-1 text-white shadow-[0_6px_14px_-6px_rgba(10,108,255,.7)]') : siteBtn('')}{downloadBtn('bg-white px-3.5 py-1 text-[#0a6cff] ring-1 ring-[#0a6cff]/40')}</div>}
            </div>
          </div>
        </section>
      )}

      {/* 01: 프로젝트 개요 */}
      <section className={sectionBox}>
        <div className={label}>{banners ? 'Concept' : 'Project Overview'}</div>
        {head(num(), sec[0].title)}
        <p className={`${BODY} text-justify text-d-body`}>{sec[0].text}</p>
      </section>

      {/* 02: 배경·키워드 (왼쪽 제목, 오른쪽 설명) */}
      {hasContext && <section className={sectionBox}>
        <div className={label}>Context</div>
        {head(num(), sec[1].title)}
        <p className={`${BODY} text-justify text-d-body`}>{sec[1].text}</p>
      </section>}

      {/* 03: 역할 — 기간 · 작업 비중 · 사용 도구를 세 칸으로 */}
      <section className={sectionBox}>
        <div className={label}>Role</div>
        {head(num(), sec[2].title)}
        <div className={`grid gap-5 ${tools ? 'grid-cols-[1fr_1fr_1.9fr]' : 'grid-cols-2'}`}>
          {/* 칸마다 제목과 값을 한 묶음으로 두고 둘 다 가운데 정렬. 사용 도구는 도구가 많아도 줄바꿈 없이 한 줄로 작게 나열한다 */}
          {[
            { t: '작업 기간', v: p.period, big: true },
            { t: '작업 비중', v: '100%', big: true },
            ...(tools ? [{ t: '사용 도구', v: tools, big: false }] : []),
          ].map(c => (
            <div key={c.t} className="flex flex-col items-center gap-3 text-center">
              <div className="text-[13px] font-extrabold text-ink">{c.t}</div>
              {c.big ? <div className="text-[24px] font-extrabold leading-[1.2] tracking-tight text-ink">{c.v}</div> : (
                <ul className={`flex flex-nowrap items-center justify-center whitespace-nowrap ${toolSize(c.v.split(' · ').length).gap}`}>
                  {c.v.split(' · ').map(t => (
                    <li key={t} className={`flex items-center gap-1 font-semibold text-ink ${toolSize(c.v.split(' · ').length).text}`}>
                      <span className={`relative block shrink-0 ${toolSize(c.v.split(' · ').length).box}`}><span className={`absolute left-0 top-0 block origin-top-left ${toolSize(c.v.split(' · ').length).scale}`}><SkillIcon name={t} /></span></span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 배너 목록: 사진은 왼쪽, 브랜드 로고·상품명·설명은 오른쪽. 내용이 비어 있으면 자리표시로 틀만 보여 준다 */}
      {banners && (
        <section className="border-t border-d-line bg-d-bg3 px-5 py-2">
          {banners.map((b, k) => (
            <div key={k} className="mx-auto flex max-w-[560px] items-center gap-8 border-b border-d-line py-5 last:border-b-0">
              <div className="w-[34%] shrink-0">
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-d-line">
                  {b.image ? <img src={resolve(b.image)} alt="" draggable={false} decoding="async" className="absolute inset-0 h-full w-full object-contain" /> : (
                    <span aria-hidden className="absolute inset-0 grid place-items-center text-[11px] font-extrabold tracking-[0.2em] text-d-mute">BANNER {String(k + 1).padStart(2, '0')}</span>
                  )}
                </div>
                {/* 사진 바로 밑: 확대해서 보기 (사진이 아직 없으면 눌리지 않게 흐리게) */}
                <button type="button" tabIndex={-1} disabled={!b.image} onClick={() => setZoomSrc(resolve(b.image))}
                  className="mt-2 flex w-full items-center justify-center gap-1 rounded-full bg-white py-1 text-[10px] font-bold text-[#0a6cff] ring-1 ring-[#0a6cff]/40 hover:brightness-95 disabled:cursor-not-allowed disabled:text-d-mute disabled:ring-black/10">
                  확대해서 보기 <Maximize2 size={11} />
                </button>
              </div>
              <div className="min-w-0 flex-1 text-left">
                <div className="mb-3 flex h-8 items-center">
                  {b.logo ? <img src={resolve(b.logo)} alt="" draggable={false} decoding="async" className="max-h-8 max-w-[70%] object-contain" /> : <span className="text-[11px] font-extrabold tracking-[0.2em] text-d-faint">BRAND LOGO</span>}
                </div>
                <div className="mb-1.5 text-[14px] font-extrabold leading-[1.3] text-ink">{b.name || '상품명'}</div>
                <p className={`${BODY} text-d-body`}>{b.text || '브랜드와 상품에 대한 설명이 들어가는 자리입니다.'}</p>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* 04: 작업물 — 사진을 두 칸씩, 아래에 번호 */}
      {gallery.length > 0 && (
        <section className={sectionBox}>
          <div className="flex items-end justify-between gap-3">
            <div className="flex flex-col gap-3"><div className={label}>Works</div>{head(num(), sec[3].title)}</div>
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.14em] text-d-mute">{gallery.length} works</span>
          </div>
          <div className="grid grid-cols-2 gap-5">
            {gallery.map((g, k) => (
              <figure key={g}>
                {/* 사진 칸은 모두 같은 크기로 맞춘다: 캡처(contain)는 칸 안에 비율대로 들어가고, 슬라이드·A4 페이지는 칸을 꽉 채운다 */}
                <div className={`relative w-full overflow-hidden rounded-lg bg-d-bg2 ${galleryRatio}`}>
                  <img src={g} alt="" draggable={false} loading="lazy" decoding="async" className={`absolute inset-0 h-full w-full ${fit === 'contain' ? 'object-contain' : 'object-cover object-top'}`} />
                </div>
                <figcaption className="mt-3 text-[11px] font-bold text-d-sub">{String(k + 1).padStart(2, '0')} / {String(gallery.length).padStart(2, '0')}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* 05: 링크 */}
      <section className={sectionBox}>
        <div className={label}>Links</div>
        {head(num(), p.title)}
        <p className={`${BODY} text-justify text-d-body`}>{sec[3].text}</p>
        {showBtns && <div className="flex flex-wrap items-center gap-2">{site ? siteBtn('bg-[#0a6cff] px-4 py-1 text-white shadow-[0_6px_14px_-6px_rgba(10,108,255,.7)]') : siteBtn('')}{downloadBtn('bg-transparent px-4 py-1 text-ink ring-1 ring-ink/40')}</div>}
      </section>
    </div>
    {/* 확대해서 보기: 화면 위에 사진을 크게 띄운다. 바깥을 누르거나 닫기 버튼으로 닫는다 */}
    <AnimatePresence>
      {zoomSrc && (
        <motion.div key="zoom" className="absolute inset-0 z-10 grid place-items-center bg-black/85 p-3" onClick={() => setZoomSrc(null)}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <img src={zoomSrc} alt="" draggable={false} className="max-h-full max-w-full rounded-lg object-contain" />
          <button type="button" tabIndex={-1} aria-label="닫기" onClick={() => setZoomSrc(null)} className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-ink hover:bg-white"><X size={15} strokeWidth={2.6} /></button>
        </motion.div>
      )}
    </AnimatePresence>
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

// 라벨로 아이콘을 찾는다. Behance는 lucide에 로고가 없어 글자(Bē)로 대신한다.
const CONTACT_ICON: Record<string, { Icon?: typeof Mail; c: string }> = {
  Email: { Icon: Mail, c: '#1fb6e8' },
  GitHub: { Icon: Github, c: '#2b2d33' },
  Behance: { c: '#1769ff' },
  Instagram: { Icon: Instagram, c: '#e1306c' },
}
function Contact({ s }: { s: State }) {
  const pickRow = useContext(RowContext)
  return (
    <div className="px-7">
      <Title>CONTACT</Title>
      {contactItems.map((c, i) => {
        const { Icon, c: col } = CONTACT_ICON[c.label] ?? CONTACT_ICON.Email
        return (
          <div key={c.label} role="link" tabIndex={-1} onClick={() => { pickRow('CONTACT', i); window.open(c.url, '_blank', 'noopener') }}
            className={`mb-2 flex cursor-pointer items-center gap-3 rounded-xl bg-card py-1.5 pl-2 pr-4 text-[13px] font-bold transition-transform hover:scale-[1.01] ${i === s.contact ? FOCUS : REST}`}>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white shadow-[0_3px_6px_-2px_rgba(0,0,0,.4)]" style={{ background: `linear-gradient(160deg, ${col}, ${col}cc)` }}>{Icon ? <Icon size={18} strokeWidth={2.1} /> : <span className="text-[16px] font-black leading-none tracking-tight">Bē</span>}</span>
            {c.label}
            <span className="ml-auto flex items-center gap-1.5 text-[11px] font-normal text-ink-sub">{'handle' in c ? c.handle : profile.email}<ExternalLink size={12} /></span>
          </div>
        )
      })}
    </div>
  )
}

const GW = 576, GH = 200, GROUND = GH - 28, PX = 4, PW = 14 * PX

/** 플랫 픽셀 스프라이트: 칸마다 단색 사각형 하나, 조명·그림자 없음. */
function drawPixels(c: CanvasRenderingContext2D, rows: string[], pal: Record<string, string>, x0: number, y0: number, px = PX) {
  rows.forEach((row, r) => [...row].forEach((ch, col) => {
    if (ch === '.') return
    c.fillStyle = pal[ch]; c.fillRect(x0 + col * px, y0 + r * px, px, px)
  }))
}

/** Side quest: an endless runner. A = jump, collect coins, dodge blocks. 달리는 캐릭터는 ABOUT에서 고른 픽셀 캐릭터(안 골랐으면 2번째 BLOB). */
function Runner({ s }: { s: State }) {
  const hero = s.avatar >= 2 ? s.avatar : 2 // 내 캐릭터(ME)·증명사진은 스프라이트가 아니라서 2번째 캐릭터로 고정
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
    const f = runFrame(hero, st.y > 0 ? 2 : phase === 'play' && Math.floor(st.dist / 22) % 2 ? 1 : 0)
    drawPixels(c, f.rows, f.pal, 60 + (PW - f.rows[0].length * PX) / 2, GROUND - f.rows.length * PX - st.y + f.bob * PX)
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
        {phase === 'idle' && `A로 시작 · A로 점프 — 빨간 블록을 피하고 코인을 모으세요 · 달리는 캐릭터는 ABOUT에서 고른 ${AVATARS[hero].name}`}
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

/** 선수를 뒤에서 본 모습: 얼굴(눈·입·코)을 몸 색으로 덮고, 머리 윗부분은 헬멧(머리) 색으로 바꾼다 */
function backView(rows: string[]): string[] {
  const count: Record<string, number> = {}
  rows.forEach(r => [...r].forEach(ch => { if (ch !== '.' && ch !== 'L') count[ch] = (count[ch] ?? 0) + 1 }))
  const main = Object.keys(count).sort((a, b) => count[b] - count[a])[0]
  return rows.map((row, ri) => [...row].map(ch => {
    if (ch === '.' || ch === 'L') return ch
    if ('wekpd'.includes(ch) || (ch === 'r' && ri >= 3)) ch = main
    return ri >= 2 && ri <= 4 && ch === main ? 'H' : ch
  }).join(''))
}

// ---------- 프리킥 (골대 쪽을 바라보는 시점) ----------
const KICKS = 5
const GOAL = { x0: 206, x1: 370, y0: 34, y1: 92 } // 골대 안쪽 면
const BALL0 = { x: 288, y: 176 } // 공을 차는 자리
const WALL_TOP = 106, WALL_FEET = 140 // 수비벽 머리·발 높이
const WALL_T = 0.5 // 공이 수비벽 앞을 지나는 비행 진행도
const FLY_MS = 850
const BPX = 4 // 키커 스프라이트 확대
type KickRes = '' | 'GOAL' | 'SAVE' | 'WALL' | 'OVER' | 'WIDE'
const KICK_LABEL: Record<KickRes, string> = { '': '', GOAL: '골!', SAVE: '골키퍼가 막았어요', WALL: '수비벽에 막혔어요', OVER: '크로스바 위로', WIDE: '골대 밖으로' }
const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const smooth = (t: number) => t * t * (3 - 2 * t)
const rnd = (a: number, b: number) => a + Math.random() * (b - a)
/** 힘 게이지: 0→1→0을 오가는 삼각파 */
const gaugeAt = (now: number, from: number) => { const ph = (((now - from) / 1000) * 1.15) % 2; return ph < 1 ? ph : 2 - ph }

/** 프리킥: ◀▶▲▼로 조준 → A로 힘 게이지 시작 → A로 슛. 수비벽을 넘기려면 힘이 필요하고, 너무 세면 크로스바 위로 뜬다. 키커는 ABOUT에서 고른 캐릭터. */
function FreeKick({ s }: { s: State }) {
  const hero = s.avatar >= 2 ? s.avatar : 2
  const cv = useRef<HTMLCanvasElement>(null)
  const seen = useRef(s.pad.n)
  const [phase, setPhase] = useState<'idle' | 'play' | 'over'>('idle')
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(() => best0('folio-fk-best'))
  // stage: aim(조준) → power(게이지) → fly(공 비행) → result(결과 표시). (tx,ty)=공이 골 라인에 닿는 곳, lift=공이 떠오르는 높이
  const g = useRef({
    n: 0, goals: 0, score: 0, stage: 'aim' as 'aim' | 'power' | 'fly' | 'result', cx: 288, cy: 62, vx: 0, vy: 0,
    gaugeFrom: 0, power: 0, kickAt: 0, res: '' as KickRes, bonus: false, nextAt: 0,
    tx: 288, ty: 62, lift: 0, wallN: 3, wallX: 288, kx: 288, ky: 70,
  })

  /** 공의 비행 경로(2차 곡선): 시작점 → 떠오르는 조절점 → 도착점 */
  const bez = (u: number) => {
    const st = g.current, cx = (BALL0.x + st.tx) / 2, cy = (BALL0.y + st.ty) / 2 - st.lift
    const a = (1 - u) ** 2, b = 2 * (1 - u) * u, c = u * u
    return { x: a * BALL0.x + b * cx + c * st.tx, y: a * BALL0.y + b * cy + c * st.ty }
  }
  /** 조준점: 실제 위치 + 살짝 떨리는 흔들림 */
  const aim = (now: number) => ({ x: g.current.cx + Math.sin(now / 170) * 2.2, y: g.current.cy + Math.cos(now / 230) * 1.6 })
  const newKick = () => {
    const st = g.current
    st.stage = 'aim'; st.res = ''; st.bonus = false; st.cx = 288; st.cy = 62; st.vx = st.vy = 0
    st.wallN = 3 + Math.floor(Math.random() * 3); st.wallX = 288 + rnd(-24, 24); st.kx = 288; st.ky = 74
  }

  const draw = (now: number) => {
    const c = cv.current?.getContext('2d'); if (!c) return
    const st = g.current
    // 하늘 + 관중석
    c.fillStyle = '#7fc4ee'; c.fillRect(0, 0, GW, GH)
    c.fillStyle = '#4f5d75'; c.fillRect(0, 0, GW, 26)
    for (let i = 0; i < 96; i++) { c.fillStyle = ['#ff6b5e', '#ffd84a', '#ffffff', '#5aa9ff', '#7ee08a'][(i * 7) % 5]; c.fillRect(i * 6 + 1, 4 + ((i * 13) % 4) * 5, 3, 3) }
    c.fillStyle = '#2b3550'; c.fillRect(0, 26, GW, 6) // 광고판
    // 잔디 줄무늬
    for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#3d9a4a' : '#43a652'; c.fillRect(0, 32 + i * 21, GW, 21) }
    c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(150, 100, 276, 2) // 페널티 라인
    // 골대 뒤 그물
    c.fillStyle = '#d7dde0'; c.fillRect(GOAL.x0, GOAL.y0, GOAL.x1 - GOAL.x0, GOAL.y1 - GOAL.y0)
    c.strokeStyle = 'rgba(90,100,110,.55)'; c.lineWidth = 1
    for (let x = GOAL.x0; x <= GOAL.x1; x += 8) { c.beginPath(); c.moveTo(x, GOAL.y0); c.lineTo(x, GOAL.y1); c.stroke() }
    for (let y = GOAL.y0; y <= GOAL.y1; y += 8) { c.beginPath(); c.moveTo(GOAL.x0, y); c.lineTo(GOAL.x1, y); c.stroke() }

    // 골키퍼: 공이 출발하면 정한 자리로 몸을 날린다
    const dive = st.stage === 'fly' || st.stage === 'result' ? smooth(clamp01((now - st.kickAt) / (FLY_MS * 0.8))) : 0
    const kx = lerp(288, st.kx, dive), ky = lerp(74, st.ky, dive), tilt = (st.kx - 288) / 120 * dive
    c.save(); c.translate(kx, ky); c.rotate(tilt)
    c.fillStyle = '#ffd84a'; c.fillRect(-8, -14, 16, 26) // 몸
    c.fillStyle = '#f1c9a0'; c.beginPath(); c.arc(0, -19, 6, 0, 7); c.fill()
    c.fillStyle = '#16171b'; c.fillRect(-11, -8, 4, 8); c.fillRect(7, -8, 4, 8) // 장갑
    c.fillRect(-7, 12, 5, 8); c.fillRect(2, 12, 5, 8)
    c.restore()

    // 골대 기둥·크로스바
    c.fillStyle = '#ffffff'; c.fillRect(GOAL.x0 - 4, GOAL.y0 - 4, 4, GOAL.y1 - GOAL.y0 + 8); c.fillRect(GOAL.x1, GOAL.y0 - 4, 4, GOAL.y1 - GOAL.y0 + 8); c.fillRect(GOAL.x0 - 4, GOAL.y0 - 4, GOAL.x1 - GOAL.x0 + 8, 4)

    // 수비벽
    const wallW = st.wallN * 18, wx0 = st.wallX - wallW / 2
    for (let i = 0; i < st.wallN; i++) {
      const x = wx0 + i * 18 + 9
      c.fillStyle = '#f1f1f6'; c.fillRect(x - 7, WALL_TOP + 8, 14, 20)
      c.fillStyle = '#3a4a8a'; c.fillRect(x - 7, WALL_TOP + 28, 14, 6)
      c.fillStyle = '#f1c9a0'; c.beginPath(); c.arc(x, WALL_TOP + 3, 5.5, 0, 7); c.fill()
      c.fillStyle = '#2a2b30'; c.fillRect(x - 7, WALL_TOP + 34, 5, 2); c.fillRect(x + 2, WALL_TOP + 34, 5, 2)
    }

    // 조준 틀 (조준·게이지 단계)
    if (st.stage === 'aim' || st.stage === 'power') {
      const a = aim(now)
      c.save(); c.translate(a.x, a.y); c.strokeStyle = '#fff'; c.lineWidth = 2
      for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { c.beginPath(); c.moveTo(sx * 13, sy * 7); c.lineTo(sx * 13, sy * 13); c.lineTo(sx * 7, sy * 13); c.stroke() }
      c.fillStyle = '#ffd84a'; c.fillRect(-1.5, -1.5, 3, 3); c.restore()
    }

    // 키커: 공 왼쪽 뒤에 서 있다가 차는 순간 앞으로 달려 나간다
    const run = st.stage === 'fly' ? smooth(clamp01((now - st.kickAt) / 220)) : st.stage === 'result' ? 1 : 0
    const f = runFrame(hero, 0), rows = backView(f.rows), w = rows[0].length * BPX
    const kxr = 228 + 16 * run, kfeet = GH + 20 - 10 * run
    drawPixels(c, rows, { ...f.pal, H: '#c8312a' }, kxr - w / 2, kfeet - rows.length * BPX, BPX)
    c.fillStyle = '#fff'; c.font = '800 20px Paperlogy, sans-serif'; c.textAlign = 'center'
    c.fillText('10', kxr, kfeet - rows.length * BPX * 0.38); c.textAlign = 'left' // 등번호

    // 공
    if (st.stage === 'fly' || st.stage === 'result') {
      const u = clamp01((now - st.kickAt) / FLY_MS)
      let p = bez(u), r = 9 - 5 * u
      if (st.res === 'WALL' && u > WALL_T) { // 수비벽에 맞고 튕겨 나온다
        const w0 = bez(WALL_T), k = (u - WALL_T) / (1 - WALL_T)
        p = { x: w0.x + (st.tx < 288 ? -1 : 1) * 70 * k, y: w0.y + 50 * k * k - 22 * k }; r = 9 - 5 * WALL_T + 2 * k
      } else if (st.res === 'SAVE' && u > 0.92) { p = { x: p.x, y: p.y + (u - 0.92) * 140 } }
      c.fillStyle = 'rgba(0,0,0,.22)'; c.beginPath(); c.ellipse(p.x, Math.min(GH - 6, p.y + r + 6), r, r * 0.4, 0, 0, 7); c.fill()
      c.fillStyle = '#fff'; c.beginPath(); c.arc(p.x, p.y, r, 0, 7); c.fill()
      c.strokeStyle = '#2a2b30'; c.lineWidth = Math.max(1, r * 0.25); c.beginPath(); c.arc(p.x, p.y, r * 0.55, now / 60, now / 60 + 2.2); c.stroke()
    } else {
      c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(BALL0.x, BALL0.y + 9, 9, 3.5, 0, 0, 7); c.fill()
      c.fillStyle = '#fff'; c.beginPath(); c.arc(BALL0.x, BALL0.y, 9, 0, 7); c.fill()
      c.strokeStyle = '#2a2b30'; c.lineWidth = 2; c.beginPath(); c.arc(BALL0.x, BALL0.y, 5, 0.3, 2.6); c.stroke()
    }

    // 힘 게이지 (오른쪽): 초록 구간이 수비벽을 넘기기 좋은 힘
    const gx = 528, gy = 38, gh = 124, p = st.stage === 'power' ? gaugeAt(now, st.gaugeFrom) : st.power
    c.fillStyle = 'rgba(22,23,27,.75)'; c.fillRect(gx - 4, gy - 4, 22, gh + 8)
    c.fillStyle = '#34c759'; c.fillRect(gx, gy + gh * (1 - 0.82), 14, gh * (0.82 - 0.46))
    c.fillStyle = '#ff8a3c'; c.fillRect(gx, gy, 14, gh * (1 - 0.88))
    c.fillStyle = '#5a5f6b'; c.fillRect(gx, gy + gh * (1 - 0.46), 14, gh * 0.46)
    if (st.stage === 'power' || st.stage === 'fly' || st.stage === 'result') { c.fillStyle = '#fff'; c.fillRect(gx - 5, gy + gh * (1 - p) - 2, 24, 4) }
    c.fillStyle = '#fff'; c.font = FONT; c.textAlign = 'center'; c.fillText('힘', gx + 7, gy - 8); c.textAlign = 'left'

    // 상태판 + 결과 문구
    c.fillStyle = 'rgba(31,70,150,.88)'; c.fillRect(8, 36, 98, 40)
    c.fillStyle = '#fff'; c.font = FONT
    c.fillText(`골  ${st.goals} / ${KICKS}`, 16, 52); c.fillText(`${Math.min(st.n, KICKS)}번째 킥`, 16, 69)
    if (st.stage === 'result' && st.res) {
      c.font = '800 22px Paperlogy, sans-serif'; c.textAlign = 'center'
      const msg = st.res === 'GOAL' && st.bonus ? '골! 구석 보너스 +50' : KICK_LABEL[st.res]
      c.fillStyle = 'rgba(22,23,27,.78)'; c.fillRect(GW / 2 - 140, 100, 280, 34)
      c.fillStyle = st.res === 'GOAL' ? '#ffd84a' : '#fff'; c.fillText(msg, GW / 2, 125); c.textAlign = 'left'
    }
  }

  useEffect(() => { draw(performance.now()) }, [phase])

  useEffect(() => { // 패드: 방향키 = 조준 가속, A = 시작 / 게이지 시작 / 슛
    if (s.pad.n === seen.current) return
    seen.current = s.pad.n
    const st = g.current, b = s.pad.b, now = performance.now()
    if (phase !== 'play') {
      if (b !== 'A') return
      Object.assign(st, { n: 1, goals: 0, score: 0, nextAt: 0 })
      newKick(); setScore(0); setPhase('play'); return
    }
    if (b === 'left' || b === 'right' || b === 'up' || b === 'down') { // 누를수록 그 방향으로 빨라지고 천천히 멈춘다
      if (st.stage !== 'aim' && st.stage !== 'power') return
      if (b === 'left' || b === 'right') st.vx = Math.max(-170, Math.min(170, st.vx + (b === 'left' ? -100 : 100)))
      else st.vy = Math.max(-140, Math.min(140, st.vy + (b === 'up' ? -80 : 80)))
      return
    }
    if (b !== 'A') return
    if (st.stage === 'aim') { st.stage = 'power'; st.gaugeFrom = now; return }
    if (st.stage !== 'power') return
    // 슛: 게이지 힘 + 조준점으로 공이 닿을 곳과 떠오르는 높이를 정한다
    const p = gaugeAt(now, st.gaugeFrom), q = aim(now)
    st.power = p; st.kickAt = now; st.stage = 'fly'
    st.tx = q.x; st.ty = q.y - Math.max(0, p - 0.88) * 520 // 너무 세면 위로 뜬다
    st.lift = 15 + 95 * p
    const w = bez(WALL_T), half = (st.wallN * 18) / 2 + 4
    const blocked = w.y > WALL_TOP && Math.abs(w.x - st.wallX) < half // 수비벽 높이보다 낮게 벽 폭 안을 지나면 막힌다
    const inside = st.tx >= GOAL.x0 && st.tx <= GOAL.x1 && st.ty >= GOAL.y0 && st.ty <= GOAL.y1
    const corner = st.ty < GOAL.y0 + 16 && Math.abs(st.tx - 288) > 50
    // 골키퍼: 경기가 진행될수록 공이 올 곳을 더 잘 읽는다 (구석은 막기 어렵다)
    const read = Math.min(0.7, 0.28 + 0.07 * st.n)
    if (Math.random() < read) { st.kx = st.tx + rnd(-14, 14); st.ky = st.ty + rnd(-10, 10) } else { st.kx = rnd(GOAL.x0 + 10, GOAL.x1 - 10); st.ky = rnd(GOAL.y0 + 14, GOAL.y1 - 16) }
    st.kx = Math.max(GOAL.x0 + 8, Math.min(GOAL.x1 - 8, st.kx)); st.ky = Math.max(GOAL.y0 + 12, Math.min(GOAL.y1 - 14, st.ky))
    const saved = Math.abs(st.tx - st.kx) < 24 * (corner ? 0.55 : 1) && Math.abs(st.ty - st.ky) < 26 * (corner ? 0.6 : 1)
    st.res = blocked ? 'WALL' : st.ty < GOAL.y0 ? 'OVER' : !inside ? 'WIDE' : saved ? 'SAVE' : 'GOAL'
    st.bonus = st.res === 'GOAL' && corner
  }, [s.pad.n])

  useEffect(() => {
    if (phase !== 'play') return
    const st = g.current
    let id = 0, last = performance.now()
    const loop = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000); last = now
      // 조준점 이동: 속도 × 시간, 마찰로 서서히 멈추고 골대 가장자리에서 튕긴다
      st.cx += st.vx * dt; st.cy += st.vy * dt
      const damp = Math.max(0, 1 - 3.2 * dt); st.vx *= damp; st.vy *= damp
      if (st.cx < GOAL.x0 - 12 || st.cx > GOAL.x1 + 12) { st.cx = Math.max(GOAL.x0 - 12, Math.min(GOAL.x1 + 12, st.cx)); st.vx *= -0.3 }
      if (st.cy < GOAL.y0 - 10 || st.cy > GOAL.y1 + 10) { st.cy = Math.max(GOAL.y0 - 10, Math.min(GOAL.y1 + 10, st.cy)); st.vy *= -0.3 }
      if (st.stage === 'power' && now - st.gaugeFrom > 4500) { st.vx = st.vy = 0 } // 너무 오래 끌면 조준만 멈춘다
      if (st.stage === 'fly' && now >= st.kickAt + FLY_MS) { // 공이 도착: 결과 확정
        st.stage = 'result'; st.nextAt = now + 1400
        if (st.res === 'GOAL') { st.goals++; st.score += 100 + (st.bonus ? 50 : 0); setScore(st.score) }
      }
      if (st.stage === 'result' && now >= st.nextAt) {
        if (st.n >= KICKS) {
          setPhase('over')
          if (st.score > best) { setBest(st.score); saveBest('folio-fk-best', st.score) }
          draw(now); return
        }
        st.n++; newKick()
      }
      draw(now)
      id = requestAnimationFrame(loop)
    }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [phase])

  const hint = phase === 'idle' ? `A로 시작 · ◀▶▲▼ 조준 · A로 힘 게이지 시작, 다시 A로 슛 · ${KICKS}번 · 키커: ${AVATARS[hero].name}`
    : phase === 'play' ? '◀▶▲▼ 조준 · A로 게이지 시작 · A로 슛 (초록 구간이 수비벽을 넘기기 좋아요)' : `끝! ${g.current.goals}골 · ${score}점 · A로 다시 도전`
  return <Arcade title="FREE KICK" score={score} best={best} cv={cv} hint={hint} />
}

const ARCADE = [
  { name: 'SIDE QUEST', sub: 'A · 점프', color: '#1fb6e8', Icon: Footprints, View: Runner },
  { name: 'STAR FIGHTER', sub: '우주 슈팅', color: '#ff4b3e', Icon: Rocket, View: Starfighter },
  { name: 'YACHT', sub: '주사위 · 1vsCOM / 2P', color: '#e0a21c', Icon: Dices, View: Yacht },
  { name: 'FREE KICK', sub: 'A · 힘 조절', color: '#2ea44f', Icon: Goal, View: FreeKick },
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
