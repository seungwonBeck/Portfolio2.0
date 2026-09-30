import { CSSProperties, ReactNode, useRef } from 'react'
import { motion, MotionValue, useMotionValue, useTransform } from 'framer-motion'
import { Home } from 'lucide-react'
import type { Btn } from '../../store/nav'

interface P { pressed: Btn | null; press: (b: Btn, silent?: boolean) => void; children: ReactNode; /** scroll-driven Joy-Con separation, canvas px */ sep?: MotionValue<number> }

/** Design canvas, traced from a Switch 2 front photo. App scales it to fit; every coordinate below is canvas px. */
export const CANVAS = { w: 1760, h: 770 }
export const SCREEN = { w: 640, h: 360, k: 1118 / 640 } // UI design size → 1118×629 glass

// matte-plastic grain
const grain = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`

const drop = '0 46px 64px -26px rgba(0,0,0,.55), 0 16px 24px -8px rgba(0,0,0,.35)'
const joyLight = 'radial-gradient(90% 55% at 28% 0%, rgba(255,255,255,.16), transparent 62%), linear-gradient(180deg,#55575c 0%,#46484c 40%,#3a3c40 100%)'
const joyEdge = `inset 0 3px 2px rgba(255,255,255,.22), inset 0 -8px 14px rgba(0,0,0,.28), inset 3px 0 3px rgba(255,255,255,.07), inset -3px 0 3px rgba(0,0,0,.25), ${drop}`
const keyFace = 'linear-gradient(180deg,#4a4c51 0%,#36383c 100%)'

const at = (cx: number, cy: number, w: number, h = w): CSSProperties =>
  ({ position: 'absolute', left: cx - w / 2, top: cy - h / 2, width: w, height: h })

const capFace = 'radial-gradient(circle at 34% 24%, #62646a 0%, #45474c 38%, #303236 78%, #27292c 100%)'

/** Round/rounded button: recessed well, raised cap with a rubber skirt, embossed glyph. Presses down on click/keypress. */
function Key({ id, label, p, cx, cy, w, h = w, round = 'rounded-full', children }: {
  id?: Btn; label?: string; p: P; cx: number; cy: number; w: number; h?: number; round?: string; children?: ReactNode
}) {
  const down = !!id && p.pressed === id
  const pad = 4.5
  const inner = (
    <>
      <span className={`absolute inset-0 ${round}`} style={{ background: '#2a2b2f', boxShadow: 'inset 0 2px 3px rgba(0,0,0,.35), 0 1px 0 rgba(255,255,255,.1)' }} />
      <span className={`absolute grid place-items-center text-white/75 transition-all duration-75 ${round}`}
        style={{
          inset: pad, background: capFace, transform: `translateY(${down ? 4 : 0}px)`,
          textShadow: '0 -1px 0 rgba(0,0,0,.7), 0 1px 0 rgba(255,255,255,.12)',
          boxShadow: down
            ? '0 1px 0 #17181a, inset 0 2px 2px rgba(255,255,255,.22), inset 0 -3px 5px rgba(0,0,0,.35)'
            : '0 4px 0 #17181a, 0 6px 5px rgba(0,0,0,.3), inset 0 2px 2px rgba(255,255,255,.4), inset 0 -4px 6px rgba(0,0,0,.4), inset 0 0 0 1.5px rgba(255,255,255,.05)',
        }}>{children}</span>
    </>
  )
  const style = at(cx, cy, w + pad * 2, h + pad * 2)
  if (!id) return <div aria-hidden className="pointer-events-auto" style={style}>{inner}</div>
  return <button aria-label={label} onClick={() => p.press(id)} className="pointer-events-auto" style={style}>{inner}</button>
}

// button letters keep the original typeface, not the KBL fonts
const ORIGINAL_FONT = "'Paperlogy','Pretendard','Malgun Gothic',system-ui,sans-serif"
const Glyph = ({ children }: { children: ReactNode }) => <span className="text-[28px] font-light leading-none" style={{ fontFamily: ORIGINAL_FONT }}>{children}</span>

const bar = (down: boolean): CSSProperties => ({
  background: 'linear-gradient(180deg,#5a5c62 0%,#404247 55%,#2f3135 100%)',
  transform: `translateY(${down ? 3 : 0}px)`,
  boxShadow: down
    ? '0 1px 0 #1c1d20, inset 0 1.5px 1px rgba(255,255,255,.3)'
    : '0 2px 0 #1c1d20, 0 3px 2px rgba(0,0,0,.18), inset 0 1.5px 1px rgba(255,255,255,.45), inset 0 -2px 3px rgba(0,0,0,.35)',
})
const slot: CSSProperties = { background: '#2a2b2f', boxShadow: 'inset 0 2px 3px rgba(0,0,0,.35), 0 1px 0 rgba(255,255,255,.1)' }
const center = 'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'

/** − and + : recessed slot with a raised bar (plus = two crossed bars). */
function Small({ kind, id, label, p, cx, cy }: { kind: 'minus' | 'plus'; id: Btn; label: string; p: P; cx: number; cy: number }) {
  const down = p.pressed === id
  return (
    <button aria-label={label} onClick={() => p.press(id)} className="pointer-events-auto" style={at(cx, cy, 76, 60)}>
      <span className={`${center} h-[18px] w-[46px] rounded-[6px]`} style={slot} />
      {kind === 'plus' && <span className={`${center} h-[46px] w-[18px] rounded-[6px]`} style={slot} />}
      <span className={`${center} h-[12px] w-[40px] rounded-[4px] transition-transform duration-75`} style={bar(down)} />
      {kind === 'plus' && <span className={`${center} h-[40px] w-[12px] rounded-[4px] transition-transform duration-75`} style={bar(down)} />}
    </button>
  )
}

const STICK_R = 14 // how far the stick cap can travel from center, px

/** send: the stick also drives the menu (left stick). Without it the stick just moves. Either way it never animates a body button. */
function Stick({ ring, cx, cy, p, interactive, send, label }: { ring: string; cx: number; cy: number; p: P; interactive?: boolean; send?: boolean; label: string }) {
  const fired = useRef(false)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  return (
    <div style={at(cx, cy, 132)}>
      {/* housing: beveled metal collar, color ring, deep well */}
      <div className="absolute inset-0 rounded-full" style={{
        background: 'conic-gradient(from 210deg,#55575c,#25262a 25%,#3b3d42 50%,#1d1e21 75%,#55575c)',
        boxShadow: '0 3px 4px rgba(0,0,0,.55), inset 0 0 0 1.5px rgba(255,255,255,.12)',
      }} />
      <div className="absolute inset-[8px] rounded-full" style={{ background: ring, boxShadow: 'inset 0 2px 3px rgba(255,255,255,.45), inset 0 -2px 3px rgba(0,0,0,.35), 0 1px 1px rgba(0,0,0,.6)' }} />
      <div className="absolute inset-[14px] rounded-full" style={{ background: 'radial-gradient(circle at 50% 30%,#1d1e21,#131416)', boxShadow: 'inset 0 4px 8px rgba(0,0,0,.45)' }} />
      <motion.div
        className={`pointer-events-auto absolute inset-[20px] rounded-full ${interactive ? 'cursor-grab active:cursor-grabbing' : ''}`}
        role={interactive ? 'slider' : undefined}
        aria-label={interactive ? `${label}, 드래그해서 이동` : undefined}
        aria-hidden={!interactive}
        drag={interactive} dragSnapToOrigin dragElastic={0} dragMomentum={false}
        dragConstraints={{ left: -STICK_R, right: STICK_R, top: -STICK_R, bottom: STICK_R }}
        whileDrag={{ scale: 1.03 }}
        onDrag={(_, i) => {
          // keep the cap inside a circle (the square constraint alone lets the corners reach further)
          const r = Math.hypot(mx.get(), my.get())
          if (r > STICK_R) { mx.set(mx.get() * STICK_R / r); my.set(my.get() * STICK_R / r) }
          if (!send || fired.current) return
          const { x, y } = i.offset
          if (Math.hypot(x, y) < 12) return
          fired.current = true
          p.press(Math.abs(x) > Math.abs(y) ? (x > 0 ? 'right' : 'left') : (y > 0 ? 'down' : 'up'), true)
        }}
        onDragEnd={() => { fired.current = false }}
        style={{
          x: mx, y: my, touchAction: 'none',
          // rubber skirt below + cast shadow into the well
          background: 'radial-gradient(circle at 36% 26%,#55575c 0%,#33353a 55%,#232528 100%)',
          boxShadow: '0 6px 0 #17181a, 0 12px 10px rgba(0,0,0,.4), inset 0 2px 2px rgba(255,255,255,.35), inset 0 -5px 8px rgba(0,0,0,.45)',
        }}>
        {/* rim highlight arc */}
        <div className="absolute inset-0 rounded-full" style={{
          background: 'conic-gradient(from 200deg,rgba(255,255,255,.45),transparent 22%,transparent 58%,rgba(255,255,255,.2) 78%,rgba(255,255,255,.45))',
          WebkitMask: 'radial-gradient(circle,transparent 66%,#000 69%)', mask: 'radial-gradient(circle,transparent 66%,#000 69%)',
        }} />
        {/* concave dish with grip rings and center dimple */}
        <div className="absolute inset-[10px] rounded-full" style={{
          background: 'repeating-radial-gradient(circle,#2a2c30 0 1.5px,#212327 1.5px 4px)',
          boxShadow: 'inset 0 3px 5px rgba(0,0,0,.6), 0 1px 0 rgba(255,255,255,.12)',
        }} />
        <div className="absolute inset-[24px] rounded-full" style={{ background: 'radial-gradient(circle at 50% 35%,#1c1d20,#2c2e32)', boxShadow: 'inset 0 2px 3px #000' }} />
        <i className="absolute left-1/2 top-[3px] h-2 w-px bg-white/30" /><i className="absolute bottom-[3px] left-1/2 h-2 w-px bg-white/30" />
        <i className="absolute left-[3px] top-1/2 h-px w-2 bg-white/30" /><i className="absolute right-[3px] top-1/2 h-px w-2 bg-white/30" />
      </motion.div>
    </div>
  )
}

/** Raised hardware on the tablet's top edge (rocker/power): lit top face, shaded sides, contact shadow. */
const Nub = ({ left, w, split }: { left: number; w: number; split?: boolean }) => (
  <div aria-hidden className="absolute" style={{ left, top: 12, width: w, height: 9, borderRadius: '4px 4px 1px 1px',
    background: 'linear-gradient(180deg,#65676c 0%,#484a4f 30%,#2c2d30 100%)',
    boxShadow: 'inset 0 2px 1px rgba(255,255,255,.5), inset 3px 0 2px rgba(255,255,255,.08), inset -3px 0 3px rgba(0,0,0,.35), 0 -1px 2px rgba(0,0,0,.15), 0 2px 2px rgba(0,0,0,.3)' }}>
    {split && <i className="absolute inset-y-[3px] left-1/2 w-[2px] -translate-x-1/2 bg-black/60" />}
  </div>
)

/** Joy-Con body: outer shell, inset face plate, convex shading, specular streak, and the rail groove with its color strip. */
function Shell({ side, color, x, w, r, ri }: { side: 'l' | 'r'; color: string; x: number; w: number; r: string; ri: string }) {
  const L = side === 'l'
  const inner = L ? 'right' : 'left'
  return (
    <div className="absolute" style={{ left: x, top: 10, width: w, height: 740 }}>
      <div className="absolute inset-0 overflow-hidden" style={{ background: joyLight, boxShadow: joyEdge, borderRadius: r }}>
        <div className="absolute inset-0 mix-blend-soft-light" style={{ backgroundImage: grain, opacity: 0.5 }} />
      </div>
      {/* face plate, slightly inset from the outer edge with a parting line */}
      <div className="absolute overflow-hidden" style={{
        top: 11, bottom: 11, [L ? 'left' : 'right']: 11, [inner]: 6, borderRadius: ri,
        background: `linear-gradient(${L ? 90 : 270}deg, rgba(255,255,255,.06), rgba(255,255,255,0) 40%, rgba(0,0,0,.18) 100%), linear-gradient(180deg,#52545a 0%,#47494d 45%,#3c3e42 100%)`,
        boxShadow: '0 0 0 2px rgba(0,0,0,.45), inset 0 2px 2px rgba(255,255,255,.16), inset 0 -6px 12px rgba(0,0,0,.3)',
      }}>
        <div className="absolute inset-0 mix-blend-soft-light" style={{ backgroundImage: grain, opacity: 0.45 }} />
        {/* specular streak following the top curve */}
        <div className="absolute inset-0" style={{ background: `radial-gradient(60% 22% at ${L ? 30 : 70}% 3%, rgba(255,255,255,.2), transparent 70%)` }} />
        {/* soft bounce light at the bottom curve */}
        <div className="absolute inset-0" style={{ background: `radial-gradient(55% 14% at ${L ? 34 : 66}% 99%, rgba(255,255,255,.1), transparent 75%)` }} />
      </div>
      {/* rail groove + color strip on the inner edge */}
      <div className="absolute rounded-full" style={{ [inner]: 0, top: 22, bottom: 22, width: 6, background: '#0a0a0b', boxShadow: 'inset 0 0 2px #000' }}>
        <i className="absolute inset-y-[3px] rounded-full" style={{ left: 1.5, width: 3, background: color }} />
      </div>
    </div>
  )
}

export default function Console(p: P) {
  const zero = useMotionValue(0)
  const sv = p.sep ?? zero
  const nx = useTransform(sv, v => -v)
  // Joy-Cons swing in from 45° and straighten to 0° as they dock (sep 320 → 0)
  const rotL = useTransform(sv, [0, 320], [0, -45])
  const rotR = useTransform(sv, [0, 320], [0, 45])
  const spring = { type: 'spring', stiffness: 240, damping: 18, delay: 0.7 } as const
  return (
    <div id="console" className="relative select-none" style={{ width: CANVAS.w, height: CANVAS.h }}>
      {/* tablet */}
      <div className="absolute overflow-hidden" style={{
        left: 233, top: 17, width: 1287, height: 728, borderRadius: 14,
        background: 'linear-gradient(180deg,#3d3e42 0%,#28292c 3%,#222326 40%,#1b1c1e 100%)',
        boxShadow: `inset 0 2px 1px rgba(255,255,255,.28), inset 0 -3px 3px rgba(255,255,255,.05), ${drop}`,
      }}>
        <div className="absolute inset-0 mix-blend-soft-light" style={{ backgroundImage: grain, opacity: 0.35 }} />
      </div>
      {/* top buttons + vent lines on the tablet edge */}
      <Nub left={398} w={97} split />
      <Nub left={300} w={58} />
      <div aria-hidden className="absolute rounded-full bg-black/55" style={{ left: 1245, top: 26, width: 160, height: 3 }} />

      {/* card slot in the top edge, exactly one cartridge wide (--chipw is the chip's on-screen width, --k the console scale) */}
      <div aria-hidden className="absolute" style={{
        left: 'calc(1330px - var(--chipw, 90px) / var(--k, 1) / 2 - 4px)', top: 13, width: 'calc(var(--chipw, 90px) / var(--k, 1) + 8px)', height: 10,
        borderRadius: 3, background: '#020203', boxShadow: 'inset 0 3px 4px #000, 0 1.5px 0 rgba(255,255,255,.18), 0 -1px 0 rgba(255,255,255,.1)',
      }} />

      {/* black glass panel + display */}
      <div className="absolute overflow-hidden" style={{ left: 251, top: 40, width: 1252, height: 690, borderRadius: 10, background: '#050506', boxShadow: '0 0 0 3px #0e0f10, inset 0 2px 6px #000, 0 2px 1px 3px rgba(255,255,255,.06)' }}>
        <div className="absolute overflow-hidden bg-black" style={{ left: 66, top: 32, width: 1118, height: 629 }}>
          <div style={{ width: SCREEN.w, height: SCREEN.h, transform: `scale(${SCREEN.k})`, transformOrigin: 'top left' }}>{p.children}</div>
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-0"
          style={{ background: 'linear-gradient(112deg,rgba(255,255,255,.09) 0%,rgba(255,255,255,.03) 30%,transparent 30.2%), radial-gradient(120% 90% at 50% 40%,transparent 60%,rgba(0,0,0,.35))' }} />
        <i aria-hidden className="absolute left-1/2 top-[12px] h-[8px] w-[8px] -translate-x-1/2 rounded-full bg-[#141b22]" />
        <span aria-hidden className="absolute bottom-[8px] left-1/2 -translate-x-1/2 text-[11px] font-semibold tracking-[0.4em] text-white/20">FOLIO 2</span>
      </div>

      {/* left Joy-Con */}
      <motion.div style={{ x: nx, rotate: rotL, transformOrigin: '120px 380px' }} className="pointer-events-none absolute inset-0"><motion.div className="pointer-events-none absolute inset-0" initial={{ x: -220, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={spring}>
        <Shell side="l" color="#1fb6e8" x={10} w={223} r="190px 10px 10px 170px" ri="180px 2px 2px 160px" />
        <Small kind="minus" id="minus" label="마이너스 버튼, 효과음 켜기/끄기" p={p} cx={192} cy={98} />
        <Stick ring="#1fb6e8" cx={125} cy={202} p={p} interactive send label="왼쪽 스틱" />
        <Key id="up" label="위쪽 버튼" p={p} cx={125} cy={335} w={52}><Glyph>▴</Glyph></Key>
        <Key id="left" label="왼쪽 버튼" p={p} cx={70} cy={388} w={52}><Glyph>◂</Glyph></Key>
        <Key id="right" label="오른쪽 버튼" p={p} cx={180} cy={388} w={52}><Glyph>▸</Glyph></Key>
        <Key id="down" label="아래쪽 버튼" p={p} cx={125} cy={442} w={52}><Glyph>▾</Glyph></Key>
        <Key p={p} cx={172} cy={523} w={40} round="rounded-[9px]"><span className="block h-[16px] w-[16px] rounded-full border-2 border-white/45" /></Key>
      </motion.div></motion.div>

      {/* right Joy-Con */}
      <motion.div style={{ x: sv, rotate: rotR, transformOrigin: '1640px 380px' }} className="pointer-events-none absolute inset-0"><motion.div className="pointer-events-none absolute inset-0" initial={{ x: 220, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={spring}>
        <Shell side="r" color="#ff4b3e" x={1520} w={225} r="10px 190px 170px 10px" ri="2px 180px 160px 2px" />
        <Small kind="plus" id="plus" label="플러스 버튼, 화면 크게 보기" p={p} cx={1559} cy={98} />
        <Key p={p} cx={1626} cy={150} w={54}><Glyph>X</Glyph></Key>
        <Key id="Y" label="Y 버튼, 화면 테마 전환" p={p} cx={1572} cy={203} w={54}><Glyph>Y</Glyph></Key>
        <Key id="A" label="A 버튼, 선택" p={p} cx={1681} cy={203} w={54}><Glyph>A</Glyph></Key>
        <Key id="B" label="B 버튼, 뒤로" p={p} cx={1626} cy={256} w={54}><Glyph>B</Glyph></Key>
        <Stick ring="#ff4b3e" cx={1626} cy={390} p={p} interactive label="오른쪽 스틱" />
        <Key id="HOME" label="HOME 버튼, 홈으로" p={p} cx={1579} cy={523} w={50}><Home size={24} strokeWidth={2.4} /></Key>
        <Key p={p} cx={1579} cy={597} w={40} round="rounded-[9px]"><span className="text-[20px] font-medium" style={{ fontFamily: ORIGINAL_FONT }}>C</span></Key>
      </motion.div></motion.div>
    </div>
  )
}
