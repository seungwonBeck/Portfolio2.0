// Tiny synthesized sfx (no audio files). Created lazily so it only runs after a user input.
let ctx: AudioContext | undefined

const NOTES = {
  move: [[880, 0, 0.04]],
  select: [[660, 0, 0.06], [990, 0.06, 0.09]],
  back: [[520, 0, 0.06], [390, 0.06, 0.09]],
  boot: [[523, 0, 0.12], [659, 0.12, 0.12], [784, 0.24, 0.2]],
} as const

export type Sfx = keyof typeof NOTES

export function play(kind: Sfx) {
  try {
    ctx ??= new AudioContext()
    const t0 = ctx.currentTime
    for (const [f, at, dur] of NOTES[kind]) {
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.type = 'square'; o.frequency.value = f
      g.gain.setValueAtTime(0.05, t0 + at)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + at + dur)
      o.connect(g).connect(ctx.destination)
      o.start(t0 + at); o.stop(t0 + at + dur)
    }
  } catch { /* audio unavailable */ }
}
