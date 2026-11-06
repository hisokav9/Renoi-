import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { concepts, contact } from '../../data/content'
import { Reveal, SplitReveal } from '../ui/Text'

type C = (typeof concepts)[number]

function BrowserCard({ c, i }: { c: C; i: number }) {
  return (
    <figure className="group relative w-[78vw] shrink-0 sm:w-[56vw] lg:w-[40vw] xl:w-[34vw]">
      <div className="overflow-hidden rounded-[18px] border border-white/10 bg-surface-2 shadow-[0_40px_80px_-40px_rgb(0_0_0/0.9)]">
        <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
          <i className="size-2.5 rounded-full bg-[#ff5f57]" />
          <i className="size-2.5 rounded-full bg-[#febc2e]" />
          <i className="size-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-3 truncate rounded-full bg-white/5 px-3 py-1 font-mono text-[11px] text-muted">{c.url}</span>
        </div>
        <div className="relative aspect-[16/11] overflow-hidden">
          <img
            src={c.image}
            alt={`Concept de site : ${c.name}`}
            loading="lazy"
            decoding="async"
            style={{ objectPosition: c.pos }}
            className="absolute inset-0 size-full object-cover transition-transform duration-[1.6s] ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(8_7_10/0.82),rgb(8_7_10/0.15)_70%)]" />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 py-4 text-[12px] text-ink/80">
            <b className="text-[15px] font-semibold text-ink">{c.brand}</b>
            <span className="hidden gap-4 sm:flex">
              <span>Accueil</span>
              <span>Contact</span>
            </span>
          </div>
          <div className="absolute bottom-6 left-5 max-w-[62%]">
            <p className="font-[Georgia,serif] text-[clamp(18px,2.2vw,30px)] leading-tight text-ink">{c.title}</p>
            <span className="mt-4 inline-flex rounded-full bg-gold px-4 py-2 text-[12px] font-semibold text-night">{c.cta}</span>
          </div>
        </div>
      </div>
      <figcaption className="mt-4 flex items-baseline gap-3">
        <span className="font-mono text-[11px] text-dim">{String(i + 1).padStart(2, '0')} / 06</span>
        <span className="h-display text-[22px] text-ink">{c.name}</span>
      </figcaption>
    </figure>
  )
}

/** Galerie horizontale : défile de côté pendant qu'on descend (sur ordinateur). */
export function Concepts() {
  const section = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const [dist, setDist] = useState(0)

  useEffect(() => {
    const measure = () => {
      if (!track.current) return
      setDist(Math.max(0, track.current.scrollWidth - window.innerWidth))
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (track.current) ro.observe(track.current)
    window.addEventListener('resize', measure)
    return () => (ro.disconnect(), window.removeEventListener('resize', measure))
  }, [])

  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end end'] })
  const x = useTransform(scrollYProgress, [0, 1], [0, -dist])
  const bar = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])

  return (
    <section ref={section} className="relative bg-night" style={{ height: `calc(100svh + ${dist}px)` }} aria-label="Concepts Renoi Studio">
      <div className="sticky top-0 flex h-[100svh] flex-col justify-center overflow-hidden">
        <div className="pointer-events-none absolute left-1/2 top-1/2 size-[70vmax] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(255_122_47/0.10),transparent_60%)]" />
        <div className="wrap relative mb-8 flex flex-col gap-4 md:mb-12 md:flex-row md:items-end md:justify-between">
          <div>
            <Reveal className="eyebrow mb-4">(03) Concepts · Renoi Studio</Reveal>
            <SplitReveal text="Six univers, une même exigence." className="h-display text-[clamp(34px,5.2vw,80px)] text-ink" accent={(w) => w.startsWith('exigence')} />
          </div>
          <Reveal delay={0.15} className="max-w-sm text-[15px] leading-relaxed text-muted">
            Des concepts que j'ai dessinés pour montrer ma façon de travailler.{' '}
            <a href={contact.renoi} target="_blank" rel="noreferrer" className="text-ink underline decoration-sun/60 underline-offset-4 hover:decoration-sun">
              Les voir en vrai sur Renoi Studio
            </a>
            .
          </Reveal>
        </div>
        <motion.div ref={track} style={{ x }} className="flex gap-6 pl-[clamp(18px,4.5vw,56px)] pr-[clamp(18px,4.5vw,56px)] will-change-transform md:gap-8">
          {concepts.map((c, i) => (
            <BrowserCard key={c.name} c={c} i={i} />
          ))}
        </motion.div>
        <div className="wrap mt-10">
          <div className="h-px w-full bg-white/10">
            <motion.div style={{ width: bar }} className="h-full bg-gradient-to-r from-gold via-sun to-ember" />
          </div>
        </div>
      </div>
    </section>
  )
}
