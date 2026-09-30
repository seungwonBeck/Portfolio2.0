import { useState } from 'react'

/** Profile pictures for the ABOUT screen: 0 = the owner's ID photo (public/avatars/me.jpg), the rest are original pixel characters. */
export const PHOTO_URL = `${import.meta.env.BASE_URL}avatars/me.jpg`

const BLOB = ['..............', '....bbbbbb....', '..bbbbbbbbbb..', '..bbbbbbbbbb..', '..bbwwbbwwbb..', '..bbwebbwebb..', '..bbbbbbbbbb..', '..bbbbrrbbbb..', '..bbbbbbbbbb..', '...bbbbbbbb...', '....bbbbbb....', '....bbbbbb....']
const ROBOT = ['.....rr.....', '.....aa.....', '..aaaaaaaa..', '.aaaaaaaaaa.', '.aawwaawwaa.', '.aawkaawkaa.', '.aaaaaaaaaa.', '.aakkkkkkaa.', '.aaaaaaaaaa.', '..aaaaaaaa..', '.bb.aaaa.bb.', '.bb......bb.']
const CAT = ['.o........o.', '.oo......oo.', '.oooooooooo.', 'oooooooooooo', 'ooowkoowkooo', 'oooooooooooo', 'oooooppooooo', 'oooooooooooo', '.oooooooooo.', '..oooooooo..']
const GHOST = ['...gggggg...', '..gggggggg..', '.gggggggggg.', '.ggwkggwkgg.', '.gggggggggg.', '.ggggkkgggg.', '.gggggggggg.', '.gggggggggg.', '.ggg.gg.ggg.']
const ALIEN = ['.g........g.', '..g......g..', '..gggggggg..', '.gggggggggg.', '.gwwkggwwkg.', '.gwwkggwwkg.', '.gggggggggg.', '..gggddggg..', '...gggggg...', '....gggg....']

const K = '#16171a', W = '#ffffff'
export const AVATARS = [
  { name: 'ME', bg: '#e3e6ec', rows: [] as string[], pal: {} as Record<string, string> },
  { name: 'BLOB', bg: '#ff9f43', rows: BLOB, pal: { b: '#1fb6e8', w: W, e: K, r: '#ff4b3e' } },
  { name: 'ROBOT', bg: '#3b6cff', rows: ROBOT, pal: { a: '#c4ccd6', b: '#6b7683', r: '#ff4b3e', w: W, k: K } },
  { name: 'CAT', bg: '#34c759', rows: CAT, pal: { o: '#ff9f43', p: '#ff6b8a', w: W, k: K } },
  { name: 'GHOST', bg: '#7c6cf0', rows: GHOST, pal: { g: '#f1f1ff', w: W, k: K } },
  { name: 'ALIEN', bg: '#ff4b3e', rows: ALIEN, pal: { g: '#34c759', d: '#0b6b2b', w: W, k: K } },
]

/** Round avatar. Size comes from className (e.g. "h-6 w-6"). */
export function Avatar({ i, className = '' }: { i: number; className?: string }) {
  const a = AVATARS[i]
  const [photoOk, setPhotoOk] = useState(true)
  return (
    <span className={`relative inline-block shrink-0 overflow-hidden rounded-full ${className}`} style={{ background: a.bg }}>
      {i === 0 ? (photoOk
        ? <img src={PHOTO_URL} alt="" draggable={false} onError={() => setPhotoOk(false)} className="h-full w-full object-cover" />
        : <svg viewBox="0 0 24 24" className="h-full w-full"><circle cx="12" cy="9.5" r="4.2" fill="#9aa1ad" /><path d="M3 24c0-5.5 4-8.5 9-8.5s9 3 9 8.5z" fill="#9aa1ad" /></svg>
      ) : (
        <svg viewBox={`0 0 ${a.rows[0].length + 4} ${a.rows[0].length + 4}`} shapeRendering="crispEdges" className="h-full w-full">
          {a.rows.map((row, r) => [...row].map((ch, c) => ch === '.' ? null :
            <rect key={`${r}-${c}`} x={c + 2} y={r + 2 + (a.rows[0].length - a.rows.length) / 2} width="1.02" height="1.02" fill={a.pal[ch]} />))}
        </svg>
      )}
    </span>
  )
}
