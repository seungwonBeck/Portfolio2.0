import { useEffect, useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Home } from 'lucide-react'
import type { Btn } from '../../store/nav'

/** 세로 폰 전용 화면 속 컨트롤러: 확대샷에서는 기기의 십자키/A·B 버튼이 화면 밖으로 잘리므로, 콘솔이 보이는 동안 기기 아래에 눌러서 쓸 수 있는 버튼을 둔다. */
export default function MobilePad({ press }: { press: (b: Btn) => void }) {
  const [show, setShow] = useState(true)
  const [top, setTop] = useState(0) // 40px under the console (clamped so the pad stays on screen)
  useEffect(() => {
    const el = document.getElementById('console'); if (!el) return
    let raf = 0
    const place = () => { raf = 0; setTop(Math.min(el.getBoundingClientRect().bottom + 40, innerHeight - 140)) }
    const sched = () => { if (!raf) raf = requestAnimationFrame(place) }
    place(); addEventListener('scroll', sched, { passive: true }); addEventListener('resize', sched)
    const ro = new ResizeObserver(sched); ro.observe(document.documentElement); ro.observe(el) // layout shifts (fonts, hero sizing) move the console without a scroll
    const io = new IntersectionObserver(([e]) => setShow(e.intersectionRatio > 0.3), { threshold: [0, 0.3, 0.6] })
    io.observe(el)
    return () => { io.disconnect(); ro.disconnect(); cancelAnimationFrame(raf); removeEventListener('scroll', sched); removeEventListener('resize', sched) }
  }, [])

  const b = (k: Btn, node: React.ReactNode, cls = '') => (
    <button type="button" aria-label={k}
      onPointerDown={e => { e.preventDefault(); press(k) }}
      className={`grid h-11 w-11 touch-manipulation select-none place-items-center rounded-full bg-[#34353a] text-lg font-extrabold text-white shadow-[0_3px_0_#09090a,inset_0_1px_0_rgba(255,255,255,.2)] transition-transform active:translate-y-[2px] active:shadow-[0_1px_0_#09090a] ${cls}`}>
      {node}
    </button>
  )
  return (
    <div aria-label="controller" className={`fixed inset-x-0 z-30 flex items-end justify-between px-5 transition-opacity duration-300 md:hidden landscape:hidden ${show ? 'opacity-100' : 'pointer-events-none opacity-0'}`} style={{ top }}>
      <div className="grid grid-cols-3 grid-rows-3 gap-0.5">
        <span />{b('up', <ChevronUp size={22} />)}<span />
        {b('left', <ChevronLeft size={22} />)}<span />{b('right', <ChevronRight size={22} />)}
        <span />{b('down', <ChevronDown size={22} />)}<span />
      </div>
      <div className="mr-14 mb-1 flex flex-col items-center gap-3">
        {b('HOME', <Home size={18} />, '!h-9 !w-9')}
        <div className="flex items-end gap-3">{b('B', 'B', 'mb-6')}{b('A', 'A', '!bg-[#e0402f]')}</div>
      </div>
    </div>
  )
}
