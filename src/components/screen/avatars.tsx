/** Profile pictures for the ABOUT screen: 0 = the owner's cartoon, 1 = ID photo (public/avatars/*.webp). */
const img = (f: string) => `${import.meta.env.BASE_URL}avatars/${f}`

export const AVATARS = [
  { name: 'ME', bg: '#96cdff', src: img('me.webp'), fit: 'cover' },
  { name: 'PHOTO', bg: '#96cdff', src: img('photo.webp'), fit: 'contain' },
] as const

/** Round avatar. Size comes from className (e.g. "h-6 w-6"). */
export function Avatar({ i, className = '' }: { i: number; className?: string }) {
  const a = AVATARS[i]
  return (
    <span className={`relative inline-block shrink-0 overflow-hidden rounded-full ${className}`} style={{ background: a.bg }}>
      <img src={a.src} alt={a.name} draggable={false} className={`h-full w-full ${a.fit === 'contain' ? 'object-contain' : 'object-cover'}`} />
    </span>
  )
}

const SIZE = 120, DEPTH = 14 // px

/** A coin with real thickness: two faces plus a stack of rim discs. `rot` is the total Y rotation in degrees (multiples of 180). */
export function Coin({ rot, onClick }: { rot: number; onClick: () => void }) {
  const face = { backfaceVisibility: 'hidden' } as const
  return (
    <button type="button" aria-label="프로필 뒤집기" onClick={onClick} className="relative block cursor-pointer" style={{ width: SIZE, height: SIZE, perspective: 600 }}>
      <span className="absolute -bottom-3 left-1/2 h-3 w-[70%] -translate-x-1/2 rounded-full bg-black/20 blur-[6px]" />
      <span className="absolute inset-0 block transition-transform duration-[900ms] ease-[cubic-bezier(.3,1.4,.5,1)]" style={{ transformStyle: 'preserve-3d', transform: `rotateY(${rot}deg)` }}>
        {Array.from({ length: DEPTH }, (_, k) => (
          <span key={k} className="absolute inset-0 rounded-full" style={{ transform: `translateZ(${k - DEPTH / 2 + 0.5}px)`, background: k % 2 ? '#aeb6c2' : '#d6dbe3' }} />
        ))}
        <span className="absolute inset-0" style={{ ...face, transform: `translateZ(${DEPTH / 2}px)` }}><Avatar i={0} className="h-full w-full ring-[5px] ring-[#e4e8ee]" /></span>
        <span className="absolute inset-0" style={{ ...face, transform: `rotateY(180deg) translateZ(${DEPTH / 2}px)` }}><Avatar i={1} className="h-full w-full ring-[5px] ring-[#e4e8ee]" /></span>
      </span>
    </button>
  )
}
