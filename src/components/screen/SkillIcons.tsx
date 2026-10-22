import { useId } from 'react'
import { Clapperboard, Stamp } from 'lucide-react'

/** 스킬 카드에 쓰는 작은 로고 타일. 외부 아이콘 라이브러리 없이 SVG로 직접 그린 단순한 모양이다. */
const Tile = ({ className = '', children }: { className?: string; children: React.ReactNode }) => (
  <span aria-hidden className={`grid h-5 w-5 shrink-0 place-items-center overflow-hidden rounded-[6px] ring-1 ring-black/10 ${className}`}>{children}</span>
)

// 어도비 계열: 둥근 사각형 안에 두 글자
const Adobe = ({ bg, fg, label }: { bg: string; fg: string; label: string }) => (
  <Tile className={bg}><span className={`text-[9px] font-extrabold leading-none tracking-tight ${fg}`}>{label}</span></Tile>
)

function GeminiMark() {
  const id = useId() // 같은 화면에 여러 개여도 그라데이션 id가 겹치지 않게
  return (
    <Tile className="bg-white">
      <svg viewBox="0 0 24 24" className="h-4 w-4">
        <defs>
          <linearGradient id={id} x1="4" y1="20" x2="20" y2="4" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#4285f4" /><stop offset=".55" stopColor="#9b72cb" /><stop offset="1" stopColor="#d96570" />
          </linearGradient>
        </defs>
        <path d="M12 1.5C12.6 7.6 16.4 11.4 22.5 12C16.4 12.6 12.6 16.4 12 22.5C11.4 16.4 7.6 12.6 1.5 12C7.6 11.4 11.4 7.6 12 1.5Z" fill={`url(#${id})`} />
      </svg>
    </Tile>
  )
}

export default function SkillIcon({ name }: { name: string }) {
  const key = name.toLowerCase()
  if (key.startsWith('claude')) return (
    <Tile className="bg-[#d97757]">
      <svg viewBox="0 0 24 24" className="h-4 w-4" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
        <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4" />
      </svg>
    </Tile>
  )
  if (key.startsWith('chatgpt')) return (
    <Tile className="bg-[#10a37f]">
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="#fff" strokeWidth="1.7">
        {[0, 60, 120].map(a => <rect key={a} x="8.2" y="3.6" width="7.6" height="16.8" rx="3.8" transform={`rotate(${a} 12 12)`} />)}
      </svg>
    </Tile>
  )
  if (key.startsWith('gemini')) return <GeminiMark />
  if (key === 'react') return (
    <Tile className="bg-[#20232a]">
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="#61dafb" strokeWidth="1.3">
        {[0, 60, 120].map(a => <ellipse key={a} cx="12" cy="12" rx="10" ry="4" transform={`rotate(${a} 12 12)`} />)}
        <circle cx="12" cy="12" r="1.8" fill="#61dafb" stroke="none" />
      </svg>
    </Tile>
  )
  if (key === 'next.js') return <Tile className="bg-black"><span className="text-[10px] font-black leading-none text-white">N</span></Tile>
  if (key === 'javascript') return <Tile className="bg-[#f7df1e]"><span className="text-[9px] font-extrabold leading-none text-black">JS</span></Tile>
  if (key.startsWith('copilot')) return (
    <Tile className="bg-white">
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" strokeWidth="3.2" strokeLinecap="round">
        <defs>
          <linearGradient id="copilotG" x1="3" y1="21" x2="21" y2="3" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#0f9bff" /><stop offset=".5" stopColor="#8a5cf6" /><stop offset="1" stopColor="#ff8a3c" />
          </linearGradient>
        </defs>
        <path d="M17 7.5A7 7 0 1 0 17 16.5" stroke="url(#copilotG)" />
      </svg>
    </Tile>
  )
  if (key.startsWith('perplexity')) return (
    <Tile className="bg-[#20808d]">
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
        <path d="M12 2.5v19M5 6.5l7 5.5 7-5.5M5 17.5l7-5.5 7 5.5M5 6.5v11M19 6.5v11" />
      </svg>
    </Tile>
  )
  if (key === 'typescript') return <Tile className="bg-[#3178c6]"><span className="text-[9px] font-extrabold leading-none text-white">TS</span></Tile>
  if (key === 'tailwind') return (
    <Tile className="bg-white">
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="#38bdf8">
        <path d="M12 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.9.2 1.6.9 2.3 1.6C13.7 10.6 15 12 18 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.9-.2-1.6-.9-2.3-1.6C16.3 6.2 15 4.8 12 4.8zM6 12c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.9.2 1.6.9 2.3 1.6 1.2 1.2 2.5 2.600 5.500 2.600 3.200 0 5.200-1.600 6-4.800-1.200 1.600-2.600 2.200-4.200 1.800-.900-.200-1.600-.900-2.300-1.600C10.300 13.400 9 12 6 12z" />
      </svg>
    </Tile>
  )
  if (key === 'figma') return (
    <Tile className="bg-[#1e1e1e]">
      <svg viewBox="0 0 24 36" className="h-4 w-[11px]">
        <path d="M0 6a6 6 0 0 1 6-6h6v12H6a6 6 0 0 1-6-6z" fill="#f24e1e" />
        <path d="M12 0h6a6 6 0 0 1 0 12h-6z" fill="#ff7262" />
        <path d="M0 18a6 6 0 0 1 6-6h6v12H6a6 6 0 0 1-6-6z" fill="#a259ff" />
        <circle cx="18" cy="18" r="6" fill="#1abcfe" />
        <path d="M0 30a6 6 0 0 1 6-6h6v6a6 6 0 1 1-12 0z" fill="#0acf83" />
      </svg>
    </Tile>
  )
  if (key === 'motion') return <Tile className="bg-[#7c3aed]"><Clapperboard size={12} strokeWidth={2.4} className="text-white" /></Tile>
  if (key === 'branding') return <Tile className="bg-[#f43f5e]"><Stamp size={12} strokeWidth={2.4} className="text-white" /></Tile>
  if (key === 'photoshop') return <Adobe bg="bg-[#001e36]" fg="text-[#31a8ff]" label="Ps" />
  if (key === 'illustrator') return <Adobe bg="bg-[#330000]" fg="text-[#ff9a00]" label="Ai" />
  if (key === 'premiere') return <Adobe bg="bg-[#00005b]" fg="text-[#9999ff]" label="Pr" />
  return null
}

/** 홈 타일용 말랑한 3D 느낌 그림(점토 질감): 그라데이션 + 위쪽 하이라이트 + 바닥 그림자. 외부 이미지 없이 SVG로 그렸다. */
export function TileArt({ name }: { name: 'ABOUT' | 'SKILLS' | 'PROJECTS' | 'CONTACT' | 'GAME' }) {
  const id = useId()
  const u = (k: string) => `url(#${id}${k})`
  const grad = (k: string, a: string, b: string) => (
    <linearGradient id={`${id}${k}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={a} /><stop offset="1" stopColor={b} /></linearGradient>
  )
  const shadow = <ellipse cx="50" cy="93" rx="28" ry="4.5" fill="rgba(0,0,0,.22)" />
  let art: React.ReactNode = null
  if (name === 'ABOUT') art = (
    <>
      <defs>{grad('s', '#ffe4cb', '#f0a878')}{grad('b', '#ffffff', '#c6d2f7')}{grad('h', '#6b4630', '#2b1a12')}</defs>
      {shadow}
      <path d="M16 92C16 72 31 65 50 65C69 65 84 72 84 92Z" fill={u('b')} />
      <circle cx="50" cy="42" r="27" fill={u('s')} />
      <path d="M22 41C20 17 38 9 52 11C69 12 81 23 78 41C71 31 61 27 50 27C39 27 29 32 22 41Z" fill={u('h')} />
      <ellipse cx="40" cy="47" rx="3.6" ry="4.8" fill="#2a1a14" /><ellipse cx="60" cy="47" rx="3.6" ry="4.8" fill="#2a1a14" />
      <circle cx="41.2" cy="45" r="1.3" fill="#fff" /><circle cx="61.2" cy="45" r="1.3" fill="#fff" />
      <circle cx="32" cy="56" r="4.2" fill="#ff8f8f" opacity=".5" /><circle cx="68" cy="56" r="4.2" fill="#ff8f8f" opacity=".5" />
      <path d="M44 57Q50 63 56 57" stroke="#8a4a3a" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <ellipse cx="37" cy="30" rx="9" ry="4.5" fill="#fff" opacity=".28" transform="rotate(-25 37 30)" />
    </>
  )
  if (name === 'SKILLS') art = (
    <>
      <defs>{grad('b', '#ffffff', '#c9d4f6')}{grad('r', '#ff8a7a', '#e0383b')}{grad('f', '#ffe27a', '#ff8a2a')}</defs>
      {shadow}
      <path d="M42 70Q50 96 58 70Z" fill={u('f')} />
      <path d="M33 52L16 74L34 70Z" fill={u('r')} /><path d="M67 52L84 74L66 70Z" fill={u('r')} />
      <path d="M50 6C67 21 71 46 67 71L33 71C29 46 33 21 50 6Z" fill={u('b')} />
      <path d="M50 6C58 13 63 22 65 31L35 31C37 22 42 13 50 6Z" fill={u('r')} />
      <circle cx="50" cy="49" r="10" fill="#4aa8ff" stroke="#fff" strokeWidth="3.5" /><circle cx="47" cy="46" r="2.6" fill="#fff" opacity=".9" />
      <ellipse cx="40" cy="38" rx="3" ry="9" fill="#fff" opacity=".5" transform="rotate(8 40 38)" />
    </>
  )
  if (name === 'PROJECTS') art = (
    <>
      <defs>{grad('k', '#ffcf5c', '#f3951a')}{grad('f', '#ffe08a', '#f7a41d')}</defs>
      {shadow}
      <path d="M12 34Q12 24 22 24H38L46 32H80Q90 32 90 42V78Q90 88 80 88H22Q12 88 12 78Z" fill={u('k')} />
      <rect x="22" y="30" width="54" height="34" rx="4" fill="#fff" transform="rotate(-4 49 47)" />
      <rect x="26" y="36" width="34" height="4" rx="2" fill="#c9d4f6" transform="rotate(-4 43 38)" /><rect x="26" y="45" width="26" height="4" rx="2" fill="#c9d4f6" transform="rotate(-4 39 47)" />
      <path d="M10 50H90V80Q90 90 80 90H20Q10 90 10 80Z" fill={u('f')} />
      <rect x="16" y="54" width="68" height="5" rx="2.5" fill="#fff" opacity=".4" />
    </>
  )
  if (name === 'CONTACT') art = (
    <>
      <defs>{grad('b', '#ffffff', '#d5def9')}{grad('f', '#f6f8ff', '#bcc9f2')}{grad('h', '#ff7a8f', '#e0264a')}</defs>
      {shadow}
      <rect x="10" y="26" width="80" height="58" rx="11" fill={u('b')} />
      <path d="M10 38Q10 26 22 26H78Q90 26 90 38L50 62Z" fill={u('f')} />
      <path d="M50 74C36 65 40 53 47 55C49 56 50 58 50 58C50 58 51 56 53 55C60 53 64 65 50 74Z" fill={u('h')} transform="translate(0 -3)" />
      <ellipse cx="30" cy="34" rx="12" ry="3.5" fill="#fff" opacity=".6" transform="rotate(8 30 34)" />
    </>
  )
  if (name === 'GAME') art = (
    <>
      <defs>{grad('b', '#ffffff', '#c9d0ea')}{grad('r', '#ff8a7a', '#e0383b')}{grad('u', '#7cc0ff', '#2f7de0')}</defs>
      {shadow}
      <path d="M22 32H78C91 32 97 45 95 62C93 76 84 82 76 75L68 67H32L24 75C16 82 7 76 5 62C3 45 9 32 22 32Z" fill={u('b')} />
      <rect x="22" y="48" width="18" height="6.5" rx="2.5" fill="#3b4252" /><rect x="27.8" y="42.3" width="6.5" height="18" rx="2.5" fill="#3b4252" />
      <circle cx="69" cy="46" r="5.6" fill={u('r')} /><circle cx="79" cy="55" r="5.6" fill={u('u')} />
      <circle cx="67.6" cy="44.4" r="1.6" fill="#fff" opacity=".8" /><circle cx="77.6" cy="53.4" r="1.6" fill="#fff" opacity=".8" />
      <ellipse cx="32" cy="38" rx="14" ry="3.5" fill="#fff" opacity=".7" />
    </>
  )
  return <svg aria-hidden viewBox="0 0 100 100" className="h-full w-full">{art}</svg>
}
