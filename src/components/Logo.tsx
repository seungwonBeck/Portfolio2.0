/** seungwon.2 mark: a pixel bust turning from cyan to red, with a few pixels drifting off. The center column follows currentColor. */
const BUST = ['..#####..', '.#######.', '.#######.', '.#######.', '..#####..', '...###...', '.#######.', '#########', '#########']
const DRIFT = [[10, 1.2, 0.75], [11.3, 2.9, 0.55], [10.4, 5.2, 0.4], [12, 6.6, 0.25], [11.8, 1, 0.3]]

export default function Logo({ className = '', drift = true }: { className?: string; drift?: boolean }) {
  return (
    <svg viewBox={`0 0 ${drift ? 13 : 9} 9`} shapeRendering="crispEdges" aria-hidden className={className}>
      {BUST.map((row, r) => [...row].map((c, i) => c === '#' &&
        <rect key={`${r}-${i}`} x={i} y={r} width="1.02" height="1.02" fill={i < 4 ? '#1fb6e8' : i === 4 ? 'currentColor' : '#ff4b3e'} />))}
      {drift && DRIFT.map(([x, y, o]) => <rect key={`${x}-${y}`} x={x} y={y} width="0.75" height="0.75" fill="#ff4b3e" opacity={o} />)}
    </svg>
  )
}
