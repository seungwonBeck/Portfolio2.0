/** Profile pictures for the ABOUT screen: 0 = the owner's cartoon, 1 = ID photo (public/avatars/*.webp; the ID photo is only reachable by flipping the coin), 2+ = original pixel characters. */
const img = (f: string) => `${import.meta.env.BASE_URL}avatars/${f}`

const BLOB = ['..............', '....bbbbbb....', '..bbbbbbbbbb..', '..bbbbbbbbbb..', '..bbwwbbwwbb..', '..bbwebbwebb..', '..bbbbbbbbbb..', '..bbbbrrbbbb..', '..bbbbbbbbbb..', '...bbbbbbbb...', '....bbbbbb....', '....bbbbbb....']
const ROBOT = ['.....rr.....', '.....aa.....', '..aaaaaaaa..', '.aaaaaaaaaa.', '.aawwaawwaa.', '.aawkaawkaa.', '.aaaaaaaaaa.', '.aakkkkkkaa.', '.aaaaaaaaaa.', '..aaaaaaaa..', '.bb.aaaa.bb.', '.bb......bb.']
const CAT = ['.o........o.', '.oo......oo.', '.oooooooooo.', 'oooooooooooo', 'ooowkoowkooo', 'oooooooooooo', 'oooooppooooo', 'oooooooooooo', '.oooooooooo.', '..oooooooo..']
const GHOST = ['...gggggg...', '..gggggggg..', '.gggggggggg.', '.ggwkggwkgg.', '.gggggggggg.', '.ggggkkgggg.', '.gggggggggg.', '.gggggggggg.', '.ggg.gg.ggg.']
const ALIEN = ['.g........g.', '..g......g..', '..gggggggg..', '.gggggggggg.', '.gwwkggwwkg.', '.gwwkggwwkg.', '.gggggggggg.', '..gggddggg..', '...gggggg...', '....gggg....']
const K = '#16171a', W = '#ffffff'

type Entry = { name: string; bg: string; src?: string; fit?: 'cover' | 'contain'; rows?: string[]; pal?: Record<string, string> }
export const AVATARS: Entry[] = [
  { name: 'ME', bg: '#ffffff', src: img('me.webp') },
  { name: 'PHOTO', bg: '#ffffff', src: img('photo.webp'), fit: 'contain' },
  { name: 'BLOB', bg: '#ff9f43', rows: BLOB, pal: { b: '#1fb6e8', w: W, e: K, r: '#ff4b3e' } },
  { name: 'ROBOT', bg: '#3b6cff', rows: ROBOT, pal: { a: '#c4ccd6', b: '#6b7683', r: '#ff4b3e', w: W, k: K } },
  { name: 'CAT', bg: '#34c759', rows: CAT, pal: { o: '#ff9f43', p: '#ff6b8a', w: W, k: K } },
  { name: 'GHOST', bg: '#7c6cf0', rows: GHOST, pal: { g: '#f1f1ff', w: W, k: K } },
  { name: 'ALIEN', bg: '#ff4b3e', rows: ALIEN, pal: { g: '#34c759', d: '#0b6b2b', w: W, k: K } },
]

/** Round avatar. Size comes from className (e.g. "h-6 w-6"). */
export function Avatar({ i, className = '' }: { i: number; className?: string }) {
  const a = AVATARS[i], rows = a.rows ?? [], n = rows[0]?.length ?? 0
  return (
    <span className={`relative inline-block shrink-0 overflow-hidden rounded-full ${className}`} style={{ background: a.bg }}>
      {a.src ? <img src={a.src} alt={a.name} draggable={false} className={`h-full w-full ${a.fit === 'contain' ? 'object-contain' : 'object-cover'}`} /> : (
        <svg viewBox={`0 0 ${n + 4} ${n + 4}`} shapeRendering="crispEdges" className="h-full w-full">
          {rows.map((row, r) => [...row].map((ch, c) => ch === '.' ? null :
            <rect key={`${r}-${c}`} x={c + 2} y={r + 2 + (n - rows.length) / 2} width="1.02" height="1.02" fill={a.pal![ch]} />))}
        </svg>
      )}
    </span>
  )
}

const SIZE = 120, DEPTH = 14 // px

/** A coin with real thickness: two faces plus a stack of rim discs. `rot` is the total Y rotation in degrees (multiples of 180); `front` is the face at 0°, the back only shows the ID photo while `photo` is set (so it never flashes by during a character spin). */
export function Coin({ rot, front, photo, onClick }: { rot: number; front: number; photo: boolean; onClick: () => void }) {
  const face = { backfaceVisibility: 'hidden' } as const
  return (
    <button type="button" aria-label="프로필 뒤집기" onClick={onClick} className="relative block cursor-pointer" style={{ width: SIZE, height: SIZE, perspective: 600 }}>
      <span className="absolute -bottom-3 left-1/2 h-3 w-[70%] -translate-x-1/2 rounded-full bg-black/20 blur-[6px]" />
      <span className="absolute inset-0 block transition-transform duration-[900ms] ease-[cubic-bezier(.3,1.4,.5,1)]" style={{ transformStyle: 'preserve-3d', transform: `rotateY(${rot}deg)` }}>
        {Array.from({ length: DEPTH }, (_, k) => (
          <span key={k} className="absolute inset-0 rounded-full" style={{ transform: `translateZ(${k - DEPTH / 2 + 0.5}px)`, background: k % 2 ? '#aeb6c2' : '#d6dbe3' }} />
        ))}
        <span className="absolute inset-0" style={{ ...face, transform: `translateZ(${DEPTH / 2}px)` }}><Avatar i={front} className="h-full w-full ring-[5px] ring-[#e4e8ee]" /></span>
        <span className="absolute inset-0" style={{ ...face, transform: `rotateY(180deg) translateZ(${DEPTH / 2}px)` }}><Avatar i={photo ? 1 : front} className="h-full w-full ring-[5px] ring-[#e4e8ee]" /></span>
      </span>
    </button>
  )
}
