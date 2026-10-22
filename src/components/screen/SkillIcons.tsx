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
  if (key === 'js') return <Tile className="bg-[#f7df1e]"><span className="text-[9px] font-extrabold leading-none text-black">JS</span></Tile>
  if (key === 'vscode') return (
    <Tile className="bg-[#1f6feb]">
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 7L4 12L9 17M15 7L20 12L15 17" /></svg>
    </Tile>
  )
  if (key === 'html') return <Tile className="bg-[#e44d26]"><span className="text-[7px] font-extrabold leading-none tracking-[-0.04em] text-white">HTML</span></Tile>
  if (key === 'css') return <Tile className="bg-[#2965f1]"><span className="text-[7.5px] font-extrabold leading-none tracking-[-0.04em] text-white">CSS</span></Tile>
  if (key === 'photoshop') return <Adobe bg="bg-[#001e36]" fg="text-[#31a8ff]" label="Ps" />
  if (key === 'illustrator') return <Adobe bg="bg-[#330000]" fg="text-[#ff9a00]" label="Ai" />
  if (key === 'premiere') return <Adobe bg="bg-[#00005b]" fg="text-[#9999ff]" label="Pr" />
  return null
}

/** 홈 타일용 아이콘: 가는 선 + 은은한 색 면 + 빛 번짐만 쓴 절제된 모양. `color`는 그 타일의 포인트 색. */
export function TileArt({ name, color }: { name: 'ABOUT' | 'SKILLS' | 'PROJECTS' | 'CONTACT' | 'GAME'; color: string }) {
  const id = useId()
  const stroke = `url(#${id}s)`, fill = `url(#${id}f)`
  const p = { fill, stroke, strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' } as const
  const glyph: Record<typeof name, React.ReactNode> = {
    ABOUT: (<><circle cx="24" cy="17" r="8" {...p} /><path d="M9 41C9 31 16 26 24 26C32 26 39 31 39 41" {...p} /></>),
    SKILLS: (<><path d="M22 5L26.5 19.5L41 24L26.5 28.5L22 43L17.5 28.5L3 24L17.5 19.5Z" {...p} /><path d="M38 6L39.4 10.6L44 12L39.4 13.4L38 18L36.6 13.4L32 12L36.6 10.6Z" {...p} /></>),
    PROJECTS: (<><rect x="12" y="6" width="26" height="9" rx="3" {...p} opacity=".55" /><rect x="8" y="12" width="32" height="10" rx="3" {...p} opacity=".8" /><rect x="5" y="19" width="38" height="22" rx="5" {...p} /></>),
    CONTACT: (<><rect x="5" y="11" width="38" height="26" rx="6" {...p} /><path d="M7 15L24 28L41 15" {...p} fill="none" /></>),
    GAME: (<><path d="M13 14H35C41 14 45 19 44 27C43 35 39 38 34 34L31 31H17L14 34C9 38 5 35 4 27C3 19 7 14 13 14Z" {...p} /><path d="M15 20V28M11 24H19" {...p} fill="none" /><circle cx="32" cy="22" r="2.2" {...p} /><circle cx="37" cy="26.5" r="2.2" {...p} /></>),
  }
  return (
    <svg aria-hidden viewBox="0 0 48 48" className="h-full w-full">
      <defs>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor={color} /></linearGradient>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffffff" stopOpacity=".16" /><stop offset="1" stopColor={color} stopOpacity=".18" /></linearGradient>
      </defs>
      {glyph[name]}
    </svg>
  )
}
