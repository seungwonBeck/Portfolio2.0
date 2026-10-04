import { useEffect, useState } from 'react'
import { RotateCw, Smartphone } from 'lucide-react'

const PORTRAIT_PHONE = '(orientation: portrait) and (max-width: 767px)'

/** Full-screen "turn your phone sideways" prompt, shown only on a phone held upright. Disappears by itself once rotated. */
export default function RotateNotice() {
  const [portrait, setPortrait] = useState(false)
  const [dismissed, setDismissed] = useState(() => { try { return sessionStorage.getItem('rotate-dismissed') === '1' } catch { return false } })

  useEffect(() => {
    const mq = matchMedia(PORTRAIT_PHONE)
    const f = () => setPortrait(mq.matches)
    f(); mq.addEventListener('change', f)
    return () => mq.removeEventListener('change', f)
  }, [])

  const [note, setNote] = useState('')
  // Android Chrome can lock the screen to landscape, but only while fullscreen. iOS Safari has no lock at all.
  // Either way we check that the phone really ended up sideways; if not, tell the person to turn it by hand.
  const rotate = async () => {
    setNote('')
    const o = screen.orientation as (ScreenOrientation & { lock?: (o: string) => Promise<void> }) | undefined
    try {
      if (typeof o?.lock !== 'function') throw new Error('orientation lock unsupported')
      await document.documentElement.requestFullscreen?.()
      await o.lock('landscape')
      await new Promise(r => setTimeout(r, 500))
      if (matchMedia(PORTRAIT_PHONE).matches) throw new Error('still portrait')
    } catch {
      try { if (document.fullscreenElement) await document.exitFullscreen() } catch { /* ignore */ }
      setNote('이 기기에서는 자동으로 돌릴 수 없어요. 휴대폰을 직접 가로로 돌려주세요.')
    }
  }
  const dismiss = () => { setDismissed(true); try { sessionStorage.setItem('rotate-dismissed', '1') } catch { /* private mode */ } }

  if (!portrait || dismissed) return null
  return (
    <div role="dialog" aria-modal="true" aria-label="가로 모드 안내" className="fixed inset-0 z-[60] grid place-items-center bg-[#131315]/95 px-8 text-center text-white backdrop-blur-sm">
      <div className="flex max-w-xs flex-col items-center">
        <span className="relative mb-6 grid h-24 w-24 place-items-center rounded-full bg-white/10">
          <Smartphone size={44} strokeWidth={1.6} className="animate-[rotateHint_2.4s_ease-in-out_infinite]" />
          <RotateCw size={20} className="absolute -right-1 -top-1 rounded-full bg-accent-blue p-1 text-white" />
        </span>
        <h2 className="text-2xl font-extrabold leading-snug [word-break:keep-all]">휴대폰을 가로로 돌려주세요</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-white/75 [word-break:keep-all]">게임기 화면이 훨씬 크게 보이고, 카트리지도 더 편하게 꽂을 수 있어요.</p>
        <button onClick={rotate} className="mt-7 w-full rounded-full bg-accent-blue py-3.5 text-base font-extrabold text-white active:scale-[.98]">가로 모드로 보기</button>
        {note && <p role="status" className="mt-3 rounded-xl bg-white/10 px-4 py-3 text-[14px] font-semibold leading-snug text-white [word-break:keep-all]">{note}</p>}
        <button onClick={dismiss} className="mt-3 py-2 text-sm font-semibold text-white/60 underline underline-offset-4">그냥 세로로 볼게요</button>
      </div>
    </div>
  )
}
