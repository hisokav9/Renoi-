import { Fragment } from 'react'
import { manifesto, manifestoHighlights, skills, stats } from '../../data/content'
import { CountUp, Marquee } from '../ui/Fx'
import { Reveal, ScrollWords } from '../ui/Text'

export function Stats() {
  return (
    <section aria-label="En chiffres" className="relative z-10 -mt-[1px] bg-night">
      <div className="wrap">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[22px] border border-line bg-line lg:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.08} className="flex flex-col gap-3 bg-night p-5 md:p-8">
              <CountUp value={s.value} decimals={s.decimals} suffix={s.suffix} className="h-display text-[clamp(36px,4.6vw,64px)] text-ink" />
              <p className="max-w-[24ch] text-[13.5px] leading-snug text-muted md:text-[14.5px]">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </div>
      <div className="mt-16 md:mt-24">
        <Marquee duration={38}>
          {skills.map((s, i) => (
            <Fragment key={s}>
              <span
                className={
                  i % 2
                    ? 'h-display px-6 text-[clamp(40px,7vw,104px)] text-transparent [-webkit-text-stroke:1.2px_rgb(244_239_232/0.35)]'
                    : 'h-display px-6 text-[clamp(40px,7vw,104px)] text-ink'
                }
              >
                {s}
              </span>
              <span className="text-[clamp(24px,3vw,44px)] text-sun">✦</span>
            </Fragment>
          ))}
        </Marquee>
      </div>
    </section>
  )
}

export function Manifesto() {
  return (
    <section id="approche" className="relative bg-night py-28 md:py-44">
      <div className="wrap">
        <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
          <Reveal className="eyebrow pt-3">(01) L'approche</Reveal>
          <ScrollWords
            text={manifesto}
            highlights={manifestoHighlights}
            className="h-display text-[clamp(30px,4.4vw,68px)] !leading-[1.06] !font-[650] text-ink"
          />
        </div>
      </div>
    </section>
  )
}
