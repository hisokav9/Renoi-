import type { CSSProperties } from 'react'
import type { Project } from '../../data/content'

/** Couvertures animées dessinées en SVG, une par projet (en attendant de vraies captures). */
export function ProjectCover({ motif, hue }: { motif: Project['motif']; hue: string }) {
  const style = { '--hue': hue } as CSSProperties
  return (
    <div
      style={style}
      className="absolute inset-0 overflow-hidden bg-[radial-gradient(120%_90%_at_70%_10%,color-mix(in_oklab,var(--hue)_32%,transparent),transparent_60%),linear-gradient(180deg,#141219,#0b0a0f)]"
    >
      <svg viewBox="0 0 400 260" className="absolute inset-0 size-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <defs>
          <linearGradient id={`fade-${motif}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={hue} stopOpacity="0.95" />
            <stop offset="1" stopColor={hue} stopOpacity="0.15" />
          </linearGradient>
        </defs>
        {motif === 'road' && <Road hue={hue} />}
        {motif === 'dunes' && <Dunes id={`fade-${motif}`} />}
        {motif === 'radar' && <Radar hue={hue} />}
        {motif === 'quiz' && <Quiz hue={hue} />}
        {motif === 'swirl' && <Swirl hue={hue} />}
      </svg>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,rgb(11_10_15/0.9))]" />
    </div>
  )
}

function Road({ hue }: { hue: string }) {
  const lines = Array.from({ length: 14 }, (_, i) => i)
  return (
    <g>
      <line x1="200" y1="70" x2="200" y2="260" stroke="#fff" strokeOpacity="0.5" strokeWidth="3" strokeDasharray="10 14" className="[animation:dash_1.2s_linear_infinite]" />
      {lines.map((i) => {
        const side = i % 2 ? 1 : -1
        const x = 200 + side * (40 + i * 22)
        return <line key={i} x1="200" y1="70" x2={x} y2="260" stroke={i % 3 ? '#fff' : hue} strokeOpacity={i % 3 ? 0.12 : 0.7} strokeWidth="1.2" />
      })}
      <circle cx="200" cy="70" r="40" fill={hue} opacity="0.25" className="animate-pulse" />
      <style>{`@keyframes dash{to{stroke-dashoffset:-48}}`}</style>
    </g>
  )
}

function Dunes({ id }: { id: string }) {
  const rows = Array.from({ length: 11 }, (_, i) => i)
  return (
    <g>
      {rows.map((i) => {
        const y = 70 + i * 18
        const a = 10 + i * 1.6
        const d = `M-40 ${y} C 40 ${y - a}, 120 ${y + a}, 200 ${y} S 360 ${y - a}, 440 ${y}`
        return (
          <path
            key={i}
            d={d}
            fill="none"
            stroke={`url(#${id})`}
            strokeWidth={i === 4 ? 2.4 : 1.1}
            opacity={0.25 + i * 0.06}
            style={{ animation: `drift ${7 + i}s ease-in-out ${-i}s infinite alternate` }}
          />
        )
      })}
      <circle cx="300" cy="62" r="18" fill="#ffd9a8" opacity="0.9" />
      <style>{`@keyframes drift{from{transform:translateX(-14px)}to{transform:translateX(14px)}}`}</style>
    </g>
  )
}

function Radar({ hue }: { hue: string }) {
  return (
    <g transform="translate(200 130)">
      {[30, 60, 90, 120, 150].map((r) => (
        <circle key={r} r={r} fill="none" stroke="#fff" strokeOpacity={0.12} strokeDasharray={r === 90 ? '4 6' : undefined} />
      ))}
      <circle r="150" fill="none" stroke={hue} strokeOpacity="0.6" strokeWidth="1.5" />
      <g style={{ animation: 'sweep 4s linear infinite', transformOrigin: '0 0' }}>
        <path d="M0 0 L150 0 A150 150 0 0 0 106 -106 Z" fill={hue} opacity="0.22" />
        <line x1="0" y1="0" x2="150" y2="0" stroke={hue} strokeWidth="2" />
      </g>
      {[
        [-70, -40],
        [50, 60],
        [90, -80],
        [-30, 95],
        [-110, 30],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="4" fill={i === 2 ? hue : '#fff'} opacity={i === 2 ? 1 : 0.7} className="animate-pulse" />
      ))}
      <style>{`@keyframes sweep{to{transform:rotate(360deg)}}`}</style>
    </g>
  )
}

function Quiz({ hue }: { hue: string }) {
  const rows = Array.from({ length: 6 }, (_, r) => r)
  return (
    <g>
      {[0, 1].map((col) =>
        rows.map((r) => (
          <g key={`${col}-${r}`} transform={`translate(${70 + col * 150} ${46 + r * 32})`}>
            <rect x="0" y="-3" width="22" height="6" rx="3" fill="#fff" opacity="0.25" />
            {[0, 1, 2, 3].map((k) => {
              const on = (r * 3 + col * 5 + 1) % 4 === k
              return (
                <circle
                  key={k}
                  cx={40 + k * 22}
                  cy="0"
                  r="7"
                  fill={on ? hue : 'none'}
                  stroke={on ? hue : '#fff'}
                  strokeOpacity={on ? 1 : 0.35}
                  style={on ? { animation: `pop 2.4s ease-in-out ${(r + col) * 0.25}s infinite` } : undefined}
                />
              )
            })}
          </g>
        )),
      )}
      <style>{`@keyframes pop{0%,100%{opacity:1}50%{opacity:.35}}`}</style>
    </g>
  )
}

function Swirl({ hue }: { hue: string }) {
  const rings = [1, 2, 3]
  return (
    <g>
      {[110, 200, 290].map((cx, j) => (
        <g key={cx} transform={`translate(${cx} ${130 + (j % 2 ? -10 : 12)})`}>
          <g style={{ animation: `spin ${16 + j * 4}s linear infinite`, transformOrigin: '0 0' }}>
            {rings.map((k) => {
              const r = 18 * k + 6
              return <path key={k} d={`M ${-r} 0 A ${r} ${r} 0 1 1 ${r * 0.6} ${r * 0.8}`} fill="none" stroke={k === 2 ? hue : '#fff'} strokeOpacity={k === 2 ? 0.9 : 0.35} strokeWidth="1.6" />
            })}
            {Array.from({ length: 8 }, (_, i) => (
              <circle key={i} cx={Math.cos(i) * 50} cy={Math.sin(i) * 50} r="2.4" fill={hue} />
            ))}
          </g>
        </g>
      ))}
    </g>
  )
}
