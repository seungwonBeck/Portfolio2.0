/** Profile pictures for the ABOUT screen: 0 = the owner's cartoon, 1 = ID photo (public/avatars/*.webp), the rest are original pixel characters. */
const img = (f: string) => `${import.meta.env.BASE_URL}avatars/${f}`

const BLOB = ['..............', '....bbbbbb....', '..bbbbbbbbbb..', '..bbbbbbbbbb..', '..bbwwbbwwbb..', '..bbwebbwebb..', '..bbbbbbbbbb..', '..bbbbrrbbbb..', '..bbbbbbbbbb..', '...bbbbbbbb...', '....bbbbbb....', '....bbbbbb....']
const ROBOT = ['.....rr.....', '.....aa.....', '..aaaaaaaa..', '.aaaaaaaaaa.', '.aawwaawwaa.', '.aawkaawkaa.', '.aaaaaaaaaa.', '.aakkkkkkaa.', '.aaaaaaaaaa.', '..aaaaaaaa..', '.bb.aaaa.bb.', '.bb......bb.']
const CAT = ['.o........o.', '.oo......oo.', '.oooooooooo.', 'oooooooooooo', 'ooowkoowkooo', 'oooooooooooo', 'oooooppooooo', 'oooooooooooo', '.oooooooooo.', '..oooooooo..']
const GHOST = ['...gggggg...', '..gggggggg..', '.gggggggggg.', '.ggwkggwkgg.', '.gggggggggg.', '.ggggkkgggg.', '.gggggggggg.', '.gggggggggg.', '.ggg.gg.ggg.']
const ALIEN = ['.g........g.', '..g......g..', '..gggggggg..', '.gggggggggg.', '.gwwkggwwkg.', '.gwwkggwwkg.', '.gggggggggg.', '..gggddggg..', '...gggggg...', '....gggg....']

const K = '#16171a', W = '#ffffff'
type Entry = { name: string; bg: string; src?: string; pos?: string; rows: string[]; pal: Record<string, string> }
export const AVATARS: Entry[] = [
  { name: 'ME', bg: '#96cdff', src: img('me.webp'), pos: '50% 50%', rows: [] as string[], pal: {} as Record<string, string> },
  { name: 'PHOTO', bg: '#ffffff', src: img('photo.webp'), pos: '50% 20%', rows: [] as string[], pal: {} as Record<string, string> },
  { name: 'BLOB', bg: '#ff9f43', rows: BLOB, pal: { b: '#1fb6e8', w: W, e: K, r: '#ff4b3e' } },
  { name: 'ROBOT', bg: '#3b6cff', rows: ROBOT, pal: { a: '#c4ccd6', b: '#6b7683', r: '#ff4b3e', w: W, k: K } },
  { name: 'CAT', bg: '#34c759', rows: CAT, pal: { o: '#ff9f43', p: '#ff6b8a', w: W, k: K } },
  { name: 'GHOST', bg: '#7c6cf0', rows: GHOST, pal: { g: '#f1f1ff', w: W, k: K } },
  { name: 'ALIEN', bg: '#ff4b3e', rows: ALIEN, pal: { g: '#34c759', d: '#0b6b2b', w: W, k: K } },
]

/** Round avatar. Size comes from className (e.g. "h-6 w-6"). */
export function Avatar({ i, className = '' }: { i: number; className?: string }) {
  const a = AVATARS[i], n = a.rows[0]?.length ?? 0
  return (
    <span className={`relative inline-block shrink-0 overflow-hidden rounded-full ${className}`} style={{ background: a.bg }}>
      {a.src ? <img src={a.src} alt={a.name} draggable={false} className="h-full w-full object-cover" style={{ objectPosition: a.pos }} /> : (
        <svg viewBox={`0 0 ${n + 4} ${n + 4}`} shapeRendering="crispEdges" className="h-full w-full">
          {a.rows.map((row, r) => [...row].map((ch, c) => ch === '.' ? null :
            <rect key={`${r}-${c}`} x={c + 2} y={r + 2 + (n - a.rows.length) / 2} width="1.02" height="1.02" fill={a.pal[ch]} />))}
        </svg>
      )}
    </span>
  )
}
