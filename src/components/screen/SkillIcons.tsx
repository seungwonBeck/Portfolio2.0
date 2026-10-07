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
