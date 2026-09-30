import { useEffect, useRef } from 'react'
import { Volume2, VolumeX } from 'lucide-react'

const VIDEO = 'vKWyRIZw0AQ' // background music: https://www.youtube.com/watch?v=vKWyRIZw0AQ
declare global { interface Window { YT?: any; onYouTubeIframeAPIReady?: () => void } } // eslint-disable-line @typescript-eslint/no-explicit-any

let started = false // one player for the page, even under StrictMode's double effect

/** Looping background music through YouTube's own embedded player (kept off-screen). `on` plays/pauses it. */
export function Music({ on }: { on: boolean }) {
  const player = useRef<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
  const want = useRef(on)
  want.current = on

  useEffect(() => {
    if (started) return
    started = true
    const make = () => {
      player.current = new window.YT.Player('yt-bgm', {
        videoId: VIDEO,
        playerVars: { controls: 0, loop: 1, playlist: VIDEO, playsinline: 1, disablekb: 1 },
        events: { onReady: () => { player.current.setVolume(40); if (want.current) player.current.playVideo() } },
      })
    }
    if (window.YT?.Player) make()
    else {
      window.onYouTubeIframeAPIReady = make
      const s = document.createElement('script')
      s.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(s)
    }
  }, [])

  useEffect(() => {
    const p = player.current
    if (p?.playVideo) on ? p.playVideo() : p.pauseVideo()
  }, [on])

  return <div aria-hidden className="pointer-events-none fixed -left-[9999px] top-0 h-px w-px overflow-hidden"><div id="yt-bgm" /></div>
}

/** Always-visible mute button (the same switch as the − button, M key and footer toggle). */
export const SoundButton = ({ sound, onToggle }: { sound: boolean; onToggle: () => void }) => (
  <button onClick={onToggle} aria-pressed={sound} aria-label={sound ? '소리 끄기' : '소리 켜기'}
    className="fixed bottom-5 right-5 z-30 grid h-11 w-11 place-items-center rounded-full bg-device-body text-white shadow-lg transition-transform hover:scale-105">
    {sound ? <Volume2 size={20} /> : <VolumeX size={20} />}
  </button>
)
