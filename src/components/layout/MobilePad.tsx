import { useEffect, useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Home } from 'lucide-react'
import type { Btn } from '../../store/nav'

/** Translucent on-screen controller for touch phones: shown only while the console is on screen. */
export default function MobilePad({ press }: { press: (b: Btn) => void }) {
  const [show, setShow] = useState(true)
  useEffect(() => {
    const el = document.getElementById('console'); if (!el) return
    const io = new IntersectionObserver(([e]) => setShow(e.intersectionRatio > 0.3), { threshold: [0, 0.3, 0.6] })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const b = (k: Btn, node: React.ReactNode, cls = '') => (
    <button type="button" aria-label={k}
      onPointerDown={e => { e.preventDefault(); press(k) }}
      className={`grid h-12 w-12 touch-manipulation select-none place-items-center rounded-full bg-black/35 text-lg font-extrabold text-white ring-1 ring-white/30 backdrop-blur-sm active:scale-90 active:bg-black/55 ${cls}`}>
      {node}
    </button>
  )
  return (
    <div aria-label="controller" className={`fixed inset-x-0 bottom-3 z-30 flex items-end justify-between px-5 transition-opacity duration-300 md:hidden ${show ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
      <div className="grid grid-cols-3 grid-rows-3 gap-0.5">
        <span />{b('up', <ChevronUp size={22} />)}<span />
        {b('left', <ChevronLeft size={22} />)}<span />{b('right', <ChevronRight size={22} />)}
        <span />{b('down', <ChevronDown size={22} />)}<span />
      </div>
      <div className="mr-14 mb-1 flex flex-col items-center gap-3">
        {b('HOME', <Home size={18} />, '!h-10 !w-10')}
        <div className="flex items-end gap-3">{b('B', 'B', 'mb-6')}{b('A', 'A')}</div>
      </div>
    </div>
  )
}
