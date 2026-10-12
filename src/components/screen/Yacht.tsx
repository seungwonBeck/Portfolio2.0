import { useEffect, useReducer, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Dices } from 'lucide-react'
import type { Btn, State } from '../../store/nav'
import { Avatar } from './avatars'

/**
 * Yacht: 주사위 5개, 한 턴에 최대 3번 굴림, 한 사람당 12개 족보. 1 vs COM 또는 한 기기에서 P1 / P2.
 * 화면 구성: 왼쪽 점수판(노란 칸 = 지금 주사위로 받을 수 있는 점수) + 오른쪽 빨간 주사위 판(위쪽 5칸이 고정 자리) + 컵.
 * 키: ◀▶ 주사위 선택 · ▲ 고정 · A 굴리기 · ▼ 점수 고르기 · (점수 고르기) ▲▼ 족보 선택 · A 확정.
 */
const UPPER: [string, number][] = [['Aces', 0], ['Deuces', 1], ['Threes', 2], ['Fours', 3], ['Fives', 4], ['Sixes', 5]]
const LOWER: [string, number][] = [['Choice', 6], ['4 of a Kind', 7], ['Full House', 8], ['S. Straight', 9], ['L. Straight', 10], ['Yacht', 11]]
// 족보별 평균 점수: COM이 좋은 패를 약한 칸에 낭비하지 않게 비교하는 기준
const BIAS = [2, 4, 6, 8, 10, 12, 21, 9, 10, 7, 9, 4]

const rnd = () => Math.ceil(Math.random() * 6)
const roll5 = () => Array.from({ length: 5 }, rnd)

export function scoreOf(d: number[], c: number): number {
  const cnt = [0, 0, 0, 0, 0, 0, 0]; d.forEach(v => cnt[v]++)
  const sum = d.reduce((a, b) => a + b, 0)
  const has = (a: number[]) => a.every(v => cnt[v] > 0)
  if (c < 6) return (c + 1) * cnt[c + 1]
  switch (c) {
    case 6: return sum
    case 7: return cnt.some(n => n >= 4) ? sum : 0
    case 8: return cnt.includes(3) && cnt.includes(2) ? sum : 0
    case 9: return has([1, 2, 3, 4]) || has([2, 3, 4, 5]) || has([3, 4, 5, 6]) ? 15 : 0
    case 10: return has([1, 2, 3, 4, 5]) || has([2, 3, 4, 5, 6]) ? 30 : 0
    default: return cnt.includes(5) ? 50 : 0
  }
}

const upper = (sc: (number | null)[]) => sc.slice(0, 6).reduce<number>((a, b) => a + (b ?? 0), 0)
const total = (sc: (number | null)[]) => sc.reduce<number>((a, b) => a + (b ?? 0), 0) + (upper(sc) >= 63 ? 35 : 0)
const free = (sc: (number | null)[]) => sc.map((v, i) => (v === null ? i : -1)).filter(i => i >= 0)

/* ---------- 주사위 판 치수 (px, 무대 좌표: 위에서 내려다본 평면) ---------- */
const SLOT_X = (i: number) => 29 + 49 * i // 위쪽 고정 칸 5개의 주사위 위치
const SLOT_Y = 27
const CUP = { x: 218, y: 122 } // 컵이 기울어 쏟는 자리: 굴린 주사위가 여기서 튀어나온다
const CUP_SEC = 1.5 // 컵이 흔들리고 쏟고 돌아가는 전체 시간
const POUR = 0.74 // 컵이 쏟기 자리에 도착하는 시각(초): 주사위는 이때부터 날아간다
const FLIGHT = 0.9 // 주사위가 날아가 튕기고 멈출 때까지(초)
const AFTER_ROLL = 2300 // COM이 굴린 뒤 다음 행동까지 기다리는 시간(ms): 주사위가 다 멈춘 뒤에 생각한다

type Land = { x: number; y: number; r: number }
const CELLS = [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]]
const jit = (a: number) => (Math.random() * 2 - 1) * a
// 천 위 6칸 중 5칸을 무작위로 골라 살짝 흔들어서 주사위가 흩어진 모양을 만든다
const makeLands = (): Land[] => CELLS.map((_, i) => [Math.random(), i] as const).sort((a, b) => a[0] - b[0]).slice(0, 5)
  .map(([, i]) => ({ x: 30 + CELLS[i][0] * 62 + jit(9), y: 88 + CELLS[i][1] * 54 + jit(7), r: jit(55) }))

type Y = {
  mode: 'pick' | 'play' | 'over'; vs: 'com' | '2p'; pick: 0 | 1; turn: 0 | 1
  dice: number[]; held: boolean[]; rolls: number; phase: 'roll' | 'score'; cur: number; cat: number
  sc: (number | null)[][]; rollId: number; land: Land[]; ver: number[]
}
type Act =
  | { t: 'pick'; d: number } | { t: 'start' } | { t: 'again' }
  | { t: 'roll'; vals: number[]; lands: Land[] } | { t: 'cur'; d: number } | { t: 'hold'; i?: number } | { t: 'holds'; h: boolean[] }
  | { t: 'toScore' } | { t: 'toRoll' } | { t: 'catMove'; d: number } | { t: 'choose'; c?: number }

const fresh = (vs: 'com' | '2p', pick: 0 | 1 = 0): Y => ({
  mode: 'pick', vs, pick, turn: 0, dice: [1, 1, 1, 1, 1], held: Array(5).fill(false), rolls: 0, phase: 'roll', cur: 0, cat: 0,
  sc: [Array(12).fill(null), Array(12).fill(null)], rollId: 0, land: Array.from({ length: 5 }, () => ({ x: 0, y: 0, r: 0 })), ver: [0, 0, 0, 0, 0],
})

function reduce(y: Y, a: Act): Y {
  switch (a.t) {
    case 'pick': return { ...y, pick: (y.pick === 0 ? 1 : 0) as 0 | 1, vs: y.pick === 0 ? '2p' : 'com' }
    case 'start': return { ...fresh(y.vs, y.pick), mode: 'play' }
    case 'again': return fresh(y.vs, y.pick)
    case 'roll': {
      if (y.rolls >= 3) return y
      const rolled = (i: number) => y.rolls === 0 || !y.held[i] // 이번에 굴러가는 주사위만 값·자리·버전이 바뀐다
      const rolls = y.rolls + 1
      return {
        ...y, rolls, rollId: y.rollId + 1, phase: rolls >= 3 ? 'score' : 'roll', cat: free(y.sc[y.turn])[0] ?? 0,
        dice: y.dice.map((v, i) => (rolled(i) ? a.vals[i] : v)),
        land: y.land.map((l, i) => (rolled(i) ? a.lands[i] : l)),
        ver: y.ver.map((v, i) => (rolled(i) ? v + 1 : v)),
      }
    }
    case 'cur': return { ...y, cur: Math.max(0, Math.min(4, y.cur + a.d)) }
    case 'hold': {
      if (y.rolls < 1 || y.rolls > 2) return y
      const i = a.i ?? y.cur
      return { ...y, held: y.held.map((h, k) => (k === i ? !h : h)) }
    }
    case 'holds': return { ...y, held: a.h }
    case 'toScore': return y.rolls < 1 ? y : { ...y, phase: 'score', cat: free(y.sc[y.turn])[0] ?? 0 }
    case 'toRoll': return y.rolls < 1 || y.rolls >= 3 ? y : { ...y, phase: 'roll' }
    case 'catMove': {
      const f = free(y.sc[y.turn]); if (!f.length) return y
      const at = Math.max(0, f.indexOf(y.cat))
      return { ...y, cat: f[(at + a.d + f.length) % f.length] }
    }
    case 'choose': {
      const c = a.c ?? y.cat
      if (y.rolls < 1 || y.sc[y.turn][c] !== null) return y
      const sc = y.sc.map((row, p) => (p === y.turn ? row.map((v, i) => (i === c ? scoreOf(y.dice, c) : v)) : row))
      const over = sc.every(r => r.every(v => v !== null))
      return { ...y, sc, mode: over ? 'over' : 'play', turn: (y.turn === 0 ? 1 : 0) as 0 | 1, held: Array(5).fill(false), rolls: 0, phase: 'roll', cur: 0, cat: 0 }
    }
  }
}

/** COM: 가장 많이 나온 눈(또는 4연속 숫자)을 고정하고 나머지를 다시 굴린다. 마지막엔 평균 대비 가장 이득인 족보를 고른다. */
function comHolds(d: number[]): boolean[] {
  const cnt = [0, 0, 0, 0, 0, 0, 0]; d.forEach(v => cnt[v]++)
  const run = [1, 2, 3].map(s => [s, s + 1, s + 2, s + 3]).find(r => r.every(v => cnt[v] > 0))
  if (run) { const used = new Set<number>(); return d.map(v => (run.includes(v) && !used.has(v) ? (used.add(v), true) : false)) }
  let best = 1; for (let v = 1; v <= 6; v++) if (cnt[v] >= cnt[best]) best = v
  if (cnt[best] >= 2) return d.map(v => v === best)
  return d.map(v => v >= 5)
}
function comPick(d: number[], sc: (number | null)[]): number {
  return free(sc).reduce((bestC, c) => (scoreOf(d, c) - BIAS[c] > scoreOf(d, bestC) - BIAS[bestC] ? c : bestC), free(sc)[0])
}

const PIPS: Record<number, number[]> = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] }

/** 하얀 주사위 눈금면. mini면 점수판 줄 앞의 작은 아이콘. */
function Face({ v, mini = false }: { v: number; mini?: boolean }) {
  return (
    <span className={`grid grid-cols-3 grid-rows-3 bg-white ring-1 ring-black/40 ${mini ? 'h-[11px] w-[11px] gap-0 rounded-[2px] p-[1px]' : 'h-full w-full gap-[2px] rounded-[7px] p-[5px]'}`}>
      {Array.from({ length: 9 }, (_, i) => <i key={i} className={`m-auto rounded-full ${mini ? 'h-[2px] w-[2px]' : 'h-[6px] w-[6px]'} ${PIPS[v].includes(i) ? 'bg-[#16171a]' : ''}`} />)}
    </span>
  )
}

const OUT = [0.2, 0.7, 0.3, 1] as const

/**
 * 주사위 한 개(위에서 본 평면). mode: fly(컵에서 튀어나와 구르는 중) → rest(천 위에 멈춤) · held(위쪽 칸으로 호를 그리며 이동) · back(칸에서 천으로 되돌아감).
 * 높이는 크기(scale)로 표현한다: 튀어 오를 때 커지고 떨어질 때 작아지며, 그림자는 바닥에 붙어 있다.
 */
function Die({ i, v, held, land, delay, cursor, enabled, onClick }: {
  i: number; v: number; held: boolean; land: Land; delay: number; cursor: boolean; enabled: boolean; onClick: () => void
}) {
  const [mode, setMode] = useState<'fly' | 'rest' | 'held' | 'back'>('fly')
  const [shown, setShown] = useState(rnd)
  useEffect(() => { // 구르는 동안 눈이 빠르게 바뀌다가 진짜 값에서 멈춘다
    const spin = window.setInterval(() => setShown(rnd()), 70)
    const stop = window.setTimeout(() => { clearInterval(spin); setShown(v) }, (delay + FLIGHT * 0.72) * 1000)
    const rest = window.setTimeout(() => setMode(m => (m === 'fly' ? 'rest' : m)), (delay + FLIGHT + 0.05) * 1000)
    return () => { clearInterval(spin); clearTimeout(stop); clearTimeout(rest) }
  }, [])
  useEffect(() => { setMode(m => (held ? 'held' : m === 'held' ? 'back' : m)) }, [held])

  const sx = SLOT_X(i), mx = (land.x + sx) / 2
  const arcY = Math.min(land.y, SLOT_Y) - 12
  const spinTo = land.r + 360
  const pose = {
    fly: { x: [CUP.x, (CUP.x + land.x) / 2, land.x - 8, land.x], y: [CUP.y, (CUP.y + land.y) / 2 - 18, land.y + 6, land.y], scale: [0.9, 1.45, 1, 1.15, 1], rotate: [-380, land.r + 120, spinTo + 9, spinTo], opacity: 1 },
    held: { x: [null, mx, sx], y: [null, arcY, SLOT_Y], scale: [null, 1.25, 1], rotate: [null, 0], opacity: 1 },
    back: { x: [null, mx, land.x], y: [null, arcY, land.y], scale: [null, 1.25, 1], rotate: [null, spinTo], opacity: 1 },
    rest: { x: land.x, y: land.y, scale: 1, rotate: spinTo, opacity: 1 },
  }[mode]
  const tween = { duration: 0.5, ease: 'easeInOut' as const }
  const how = mode === 'fly' ? {
    x: { delay, duration: FLIGHT, times: [0, 0.4, 0.75, 1], ease: OUT }, // 값마다 따로 출발 시각을 줘야 컵이 기울 때 같이 튀어나온다
    y: { delay, duration: FLIGHT, times: [0, 0.4, 0.75, 1], ease: OUT },
    scale: { delay, duration: FLIGHT, times: [0, 0.28, 0.55, 0.77, 1], ease: ['easeOut', 'easeIn', 'easeOut', 'easeIn'] as const },
    rotate: { delay, duration: FLIGHT, times: [0, 0.45, 0.8, 1], ease: 'easeOut' as const },
    opacity: { delay, duration: 0.01 },
  } : mode === 'rest' ? { duration: 0 } : { ...tween, times: undefined }
  const landed = mode !== 'fly'

  return (
    <>
      {/* 그림자: 돌지 않고 천에 붙어 있다. 날아가는 동안엔 흐리다 */}
      <motion.i aria-hidden className="pointer-events-none absolute left-0 top-0 h-[36px] w-[36px] rounded-[8px] bg-black blur-[3px]"
        initial={{ x: CUP.x + 3, y: CUP.y + 5, opacity: 0, scale: 0.4 }}
        animate={{ x: held ? SLOT_X(i) + 2 : land.x + 3, y: held ? SLOT_Y + 3 : land.y + 5, opacity: held ? 0.3 : landed ? 0.5 : [0, 0.12, 0.5], scale: 1 }}
        transition={{ delay: mode === 'fly' ? delay : 0, duration: mode === 'fly' ? FLIGHT : 0.5, ease: OUT }} />
      <motion.button type="button" aria-label={`주사위 ${v}${held ? ' 고정' : ''}`} onClick={onClick} disabled={!enabled}
        className="absolute left-0 top-0 h-[36px] w-[36px] shadow-[0_2px_3px_rgba(0,0,0,.4)]"
        initial={{ x: CUP.x, y: CUP.y, scale: 0.9, rotate: -380, opacity: 0 }}
        animate={pose as never} transition={how as never}>
        {cursor && <i className="pointer-events-none absolute -inset-[5px] rounded-[11px] border-[3px] border-[#ffd84a] shadow-[0_0_8px_#ffd84a]" />}
        <Face v={shown} />
      </motion.button>
    </>
  )
}

export default function Yacht({ s }: { s: State }) {
  const [y, d] = useReducer(reduce, undefined, () => fresh('com'))
  const ref = useRef(y); ref.current = y
  const seen = useRef(s.pad.n)
  const rolledAt = useRef(0) // 마지막으로 굴린 시각: COM은 주사위가 다 멈춘 뒤에야 다음 행동을 한다
  useEffect(() => { rolledAt.current = Date.now() }, [y.rollId])
  const settle = () => Math.max(800, AFTER_ROLL - (Date.now() - rolledAt.current))
  const human = y.mode === 'play' && (y.vs === '2p' || y.turn === 0)
  const names = ['P1', y.vs === 'com' ? 'COM' : 'P2']
  const faces = [s.avatar, s.avatar === 3 ? 2 : 3] // 두 번째 선수 얼굴: 내가 고른 캐릭터와 겹치지 않게
  // 다음에 굴릴 값을 미리 정해 두고 컵 속 주사위에 보여 준다. 굴리면 그 값 그대로 나오고, 컵이 돌아간 뒤 다음 값으로 바뀐다
  const [pre, setPre] = useState(() => ({ vals: roll5(), lands: makeLands() }))
  const preRef = useRef(pre); preRef.current = pre
  const doRoll = () => {
    if (Date.now() - rolledAt.current < CUP_SEC * 1000) return // 컵이 돌아오는 중엔 다시 못 굴린다(같은 값 방지)
    d({ t: 'roll', vals: preRef.current.vals, lands: preRef.current.lands })
    window.setTimeout(() => setPre({ vals: roll5(), lands: makeLands() }), CUP_SEC * 1000)
  }
  const cupDie = y.rolls === 0 ? 0 : Math.max(0, y.held.findIndex(h => !h)) // 컵에 든 주사위 = 이번에 굴러갈 첫 번째 주사위

  useEffect(() => { // 패드 입력
    if (s.pad.n === seen.current) return
    seen.current = s.pad.n
    const b: Btn = s.pad.b, cur = ref.current
    const hum = cur.mode === 'play' && (cur.vs === '2p' || cur.turn === 0)
    if (cur.mode === 'pick') { if (b === 'up' || b === 'down' || b === 'left' || b === 'right') d({ t: 'pick', d: 1 }); else if (b === 'A') d({ t: 'start' }); return }
    if (cur.mode === 'over') { if (b === 'A') d({ t: 'again' }); return }
    if (!hum) return
    if (cur.phase === 'roll') {
      if (b === 'A') doRoll()
      else if (cur.rolls > 0 && b === 'left') d({ t: 'cur', d: -1 })
      else if (cur.rolls > 0 && b === 'right') d({ t: 'cur', d: 1 })
      else if (cur.rolls > 0 && b === 'up') d({ t: 'hold' })
      else if (cur.rolls > 0 && b === 'down') d({ t: 'toScore' })
    } else if (b === 'up') d({ t: 'catMove', d: -1 })
    else if (b === 'down') d({ t: 'catMove', d: 1 })
    else if (b === 'A') d({ t: 'choose' })
    else if (b === 'left') d({ t: 'toRoll' })
  }, [s.pad.n])

  useEffect(() => { // COM은 중간중간 쉬면서 자기 차례를 둔다
    if (y.mode !== 'play' || y.vs !== 'com' || y.turn !== 1) return
    const ids: number[] = []
    const later = (fn: () => void, ms: number) => { ids.push(window.setTimeout(fn, ms)) }
    if (y.phase === 'score') later(() => d({ t: 'choose', c: comPick(y.dice, y.sc[1]) }), settle())
    else if (y.rolls === 0) later(doRoll, 900)
    else if (scoreOf(y.dice, 11) > 0 || scoreOf(y.dice, 10) > 0) later(() => d({ t: 'toScore' }), settle())
    else later(() => { d({ t: 'holds', h: comHolds(y.dice) }); later(doRoll, 900) }, settle())
    return () => ids.forEach(clearTimeout)
  }, [y.mode, y.turn, y.rolls, y.phase, y.vs])

  const turnNo = Math.min(12, y.sc[y.turn].filter(v => v !== null).length + 1)
  const t0 = total(y.sc[0]), t1 = total(y.sc[1])
  const hint = y.mode === 'pick' ? '▲▼ 선택 · A 시작'
    : y.mode === 'over' ? 'A 로 다시하기'
    : !human ? 'COM이 생각 중…'
    : y.phase === 'score' ? '▲▼ 족보 선택 · A 확정 · ◀ 다시 굴리기'
    : y.rolls === 0 ? 'A 로 주사위 굴리기'
    : '◀▶ 선택 · ▲ 고정/해제 · A 굴리기 · ▼ 점수 고르기'

  /** 점수판 한 칸: 확정 점수(흰 칸) / 받을 수 있는 점수(노란 칸) / 빈 칸 */
  const cell = (p: number, c: number) => {
    const v = y.sc[p][c]
    const active = y.mode === 'play' && y.turn === p
    const preview = v === null && active && y.rolls > 0 ? scoreOf(y.dice, c) : null
    const picked = active && human && y.phase === 'score' && y.cat === c && v === null
    return (
      <span key={p} className={`grid h-full place-items-center text-center ${v !== null ? 'bg-white font-extrabold text-black' : preview !== null ? 'bg-[#ffd84a] font-bold text-black' : 'bg-[#e9e9ec] text-transparent'} ${picked ? 'z-10 ring-2 ring-[#16171a]' : ''}`}>
        {v ?? preview ?? '·'}
      </span>
    )
  }
  const row = (label: string, c: number, icon?: number) => (
    <div key={c} onClick={() => human && y.rolls > 0 && y.sc[y.turn][c] === null && d({ t: 'choose', c })}
      className="grid h-[14px] cursor-pointer grid-cols-[1fr_38px_38px] items-center gap-px border-b border-black/10 bg-[#f6f6f4]">
      <span className="flex items-center gap-1 pl-1 font-semibold">{icon ? <Face v={icon} mini /> : <i className="h-[11px] w-[11px]" />}{label}</span>
      {cell(0, c)}{cell(1, c)}
    </div>
  )
  const sumRow = (label: string, f: (p: number) => string, cls: string) => (
    <div className={`grid h-[14px] grid-cols-[1fr_38px_38px] items-center gap-px ${cls}`}>
      <span className="pl-1 font-extrabold">{label}</span>
      {[0, 1].map(p => <span key={p} className="text-center font-extrabold">{f(p)}</span>)}
    </div>
  )

  return (
    <div className="px-6">
      {y.mode === 'pick' ? (
        <div className="pt-2">
          <h2 className="mb-3 text-[20px] font-extrabold tracking-tight">YACHT</h2>
          <div className="grid grid-cols-2 gap-3">
            {([['1 vs COM', '컴퓨터와 대결'], ['1P · 2P', '한 기기에서 번갈아']] as const).map(([name, sub], i) => (
              <button key={name} type="button" onClick={() => { if (y.pick !== i) d({ t: 'pick', d: 1 }); d({ t: 'start' }) }}
                className={`rounded-2xl p-4 text-left text-white ${i ? 'bg-[#ff4b3e]' : 'bg-[#1fb6e8]'} ${y.pick === i ? 'ring-[3px] ring-accent-blue ring-offset-2' : ''}`}>
                <div className="text-[18px] font-extrabold">{name}</div><div className="text-[11px] opacity-85">{sub}</div>
              </button>
            ))}
            <p className="col-span-2 text-[11px] text-ink-sub">주사위 5개를 최대 3번 굴려 12개 족보를 채워요. 높은 합계가 이겨요.</p>
          </div>
        </div>
      ) : (
        <div className="flex gap-3">
          {/* 점수판 */}
          <div className="w-[205px] shrink-0 overflow-hidden rounded-lg bg-white text-[9.5px] leading-[14px] shadow-[0_2px_8px_rgba(0,0,0,.18)] ring-1 ring-black/25">
            <div className="flex h-[24px] items-baseline gap-1.5 bg-white px-1.5 pt-[3px] text-black"><span className="text-[10px] font-semibold">Turn</span><span className="text-[16px] font-extrabold leading-[18px]">{turnNo}/12</span></div>
            <div className="grid h-[26px] grid-cols-[1fr_38px_38px] gap-px bg-[#d8d8dc]">
              <span className="self-end bg-[#f6f6f4] pl-1 font-extrabold">Categories</span>
              {[0, 1].map(p => (
                <span key={p} className={`grid place-items-center ${y.mode === 'play' && y.turn === p ? 'bg-[#ffd84a]' : 'bg-[#f6f6f4]'}`}>
                  <Avatar i={faces[p]} className="h-[20px] w-[20px]" />
                </span>
              ))}
            </div>
            {UPPER.map(([label, c]) => row(label, c, c + 1))}
            {sumRow('Subtotal', p => `${upper(y.sc[p])}/63`, 'bg-[#55565c] text-white')}
            {sumRow('+35 Bonus', p => (upper(y.sc[p]) >= 63 ? '+35' : ''), 'bg-[#2c2d31] text-[#ffd84a]')}
            <p className="bg-[#f6f6f4] px-1 text-[7.5px] leading-[10px] text-black/55">Bonus if Aces–Sixes are over 63 points</p>
            {LOWER.map(([label, c]) => row(label, c))}
            {sumRow('Total', p => String(p ? t1 : t0), 'bg-[#16171a] text-[12px] text-white')}
          </div>

          {/* 주사위 판: 나무 테이블 위에 은색 테두리 판 + 빨간 천 + 오른쪽 컵 (위에서 내려다본 모습) */}
          <div className="min-w-0 flex-1 rounded-lg bg-[repeating-linear-gradient(90deg,#b98652_0_26px,#a8763f_26px_28px,#c08d57_28px_54px,#a8763f_54px_56px)] p-1.5 shadow-[inset_0_0_14px_rgba(60,30,0,.45)]">
            <div className="relative h-[248px] w-[350px]">
              <div className="absolute right-0 top-0 flex flex-col items-end text-[10px] font-extrabold leading-[14px] text-white [text-shadow:0_1px_2px_rgba(0,0,0,.6)]">
                <span>{y.mode === 'over' ? '게임 끝' : `${names[y.turn]} 차례`}</span>
                <span className="flex items-center gap-1 text-[12px]"><Dices size={15} />{3 - y.rolls} left</span>
              </div>
              {/* 판: 은색 겹테두리 → 빨간 천 → 위쪽 고정 칸 5개 */}
              <div className="absolute left-0 top-0 h-[226px] w-[296px] rounded-[30px] bg-[linear-gradient(145deg,#f4f6f9,#9aa3af_50%,#e3e7ec)] shadow-[0_8px_14px_rgba(0,0,0,.45)]">
                <div className="absolute inset-[6px] rounded-[25px] bg-[#2b2e34]" />
                <div className="absolute inset-[10px] rounded-[22px] bg-[linear-gradient(145deg,#dfe4ea,#7e8793)]" />
                <div className="absolute inset-[15px] rounded-[18px] bg-[#34373e]" />
                <div className="absolute inset-[20px] rounded-[14px] bg-[radial-gradient(120%_110%_at_40%_35%,#c53430,#8d1b19_70%,#651210)] shadow-[inset_0_4px_14px_rgba(0,0,0,.55)]" />
                <div className="absolute left-[20px] top-[20px] h-[50px] w-[256px] rounded-t-[14px] bg-[#2a2c31] shadow-[0_3px_5px_rgba(0,0,0,.4)]" />
                {['left-[26px]', 'left-[75px]', 'left-[124px]', 'left-[173px]', 'left-[222px]'].map(x => <i key={x} className={`absolute top-[24px] h-[42px] w-[42px] rounded-[8px] bg-[#14161a] shadow-[inset_0_3px_6px_rgba(0,0,0,.85)] ${x}`} />)}
              </div>
              {/* 주사위: 고정된 건 위쪽 칸으로, 아닌 건 천 위에 흩어진다. 다시 굴린 주사위만 컵에서 튀어나온다 */}
              {y.rolls > 0 && y.dice.map((v, i) => (
                <Die key={`${i}-${y.ver[i]}`} i={i} v={v} held={y.held[i]} land={y.land[i]} delay={POUR + i * 0.045} enabled={human}
                  cursor={human && y.phase === 'roll' && y.cur === i} onClick={() => d({ t: 'hold', i })} />
              ))}
              <Avatar i={faces[y.turn]} className="absolute left-[128px] top-[207px] z-10 h-[40px] w-[40px] ring-[3px] ring-[#e3e7ec]" />
              {y.mode === 'over' && (
                <div className="absolute left-0 top-0 z-20 grid h-[226px] w-[296px] place-items-center rounded-[30px] bg-black/55 text-center text-white">
                  <div>
                    <div className="text-[20px] font-extrabold">{t0 === t1 ? '무승부!' : `${names[t0 > t1 ? 0 : 1]} 승리!`}</div>
                    <div className="text-[13px] font-semibold opacity-80">{t0} : {t1}</div>
                  </div>
                </div>
              )}
              {/* 컵: 위에서 본 원통(검은 테두리 + 빨간 안쪽 + 주사위 하나). 흔들다가 판 쪽으로 기울여 쏟고 돌아간다 */}
              <motion.div key={y.rollId} aria-hidden className="pointer-events-none absolute left-[240px] top-[86px] z-10 h-[108px] w-[108px]"
                animate={y.rollId ? { x: [0, -4, 5, -5, 5, -4, -58, -58, 0], y: [0, 4, -4, 4, -4, 3, -2, -2, 0], rotate: [0, -6, 6, -6, 6, -4, -18, -18, 0] } : { x: 0, y: 0, rotate: 0 }}
                transition={{ duration: CUP_SEC, times: [0, 0.08, 0.16, 0.24, 0.32, 0.4, 0.5, 0.64, 1], ease: 'easeInOut' }}>
                <i className="absolute inset-0 rounded-full bg-black/40 blur-[6px] [transform:translate(10px,12px)]" />
                <i className="absolute inset-0 rounded-full bg-[radial-gradient(circle,#2b2c30_55%,#0c0c0e_100%)] shadow-[inset_0_0_10px_rgba(255,255,255,.12)]" />
                <i className="absolute inset-[11px] rounded-full bg-[radial-gradient(circle_at_40%_35%,#e23b34,#a31d1b_75%,#7a1211)] shadow-[inset_0_3px_10px_rgba(0,0,0,.55)]" />
                <span className="absolute left-[36px] top-[36px] h-[36px] w-[36px] rotate-[-14deg] shadow-[0_2px_3px_rgba(0,0,0,.4)]"><Face v={pre.vals[cupDie]} /></span>
              </motion.div>
              {human && y.phase === 'roll' && y.rolls < 3 && (
                <p className="pointer-events-none absolute left-[256px] top-[204px] z-10 flex items-center gap-1 text-[11px] font-extrabold text-white [text-shadow:0_1px_2px_rgba(0,0,0,.7)]">
                  <b className="grid h-[16px] w-[16px] place-items-center rounded-full bg-white text-[9px] text-black [text-shadow:none]">A</b>{y.rolls ? 'Shake again' : 'Shake cup'}
                </p>
              )}
            </div>
            <div className="mt-0.5 flex w-[350px] items-center justify-between gap-2">
              <p className="text-[10px] leading-snug text-white [text-shadow:0_1px_2px_rgba(0,0,0,.6)] [word-break:keep-all]">{hint}</p>
              <button type="button" disabled={!human || y.phase !== 'roll' || y.rolls >= 3} onClick={doRoll}
                className="shrink-0 rounded-full bg-accent-blue px-3 py-1 text-[10px] font-extrabold text-white disabled:opacity-35">굴리기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
