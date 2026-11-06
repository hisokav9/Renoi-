import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import { alsoLive, featured, projects } from '../../data/content'
import { cn } from '../../lib/cn'
import { ProjectCover } from '../ui/Covers'
import { SpotlightCard, Tilt } from '../ui/Fx'
import { Reveal, SplitReveal } from '../ui/Text'

function Featured() {
  const ref = useRef<HTMLAnchorElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center center'] })
  const scale = useTransform(scrollYProgress, [0, 1], [0.88, 1])
  const radius = useTransform(scrollYProgress, [0, 1], [44, 24])
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.18, 1])
  return (
    <motion.a ref={ref} href={featured.link} target="_blank" rel="noreferrer" style={{ scale }} className="group block origin-top">
      <motion.div style={{ borderRadius: radius }} className="relative aspect-[16/10] overflow-hidden border border-white/10 bg-surface">
        <motion.img
          src={featured.image}
          alt="Page d'accueil du site Renoi Studio : carte du Niger en 3D"
          style={{ scale: imgScale }}
          className="absolute inset-0 size-full object-cover transition-[filter] duration-700 group-hover:brightness-110"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_70%,rgb(7_6_10/0.55))]" />
        <span className="chip absolute left-4 top-4 !border-sun/40 !bg-night/60 !text-[#ffc89a] backdrop-blur-md md:left-6 md:top-6">{featured.badge}</span>
        <span className="absolute bottom-4 right-4 inline-flex size-14 items-center justify-center rounded-full bg-ink text-night transition-transform duration-500 group-hover:rotate-45 group-hover:scale-110 md:bottom-6 md:right-6 md:size-20">
          <ArrowUpRight className="size-6 md:size-8" />
        </span>
      </motion.div>
      <div className="mt-6 grid gap-4 md:grid-cols-[1fr_1.1fr] md:items-start md:gap-10">
        <div>
          <h3 className="h-display text-[clamp(36px,5vw,72px)] text-ink">{featured.name}</h3>
          <p className="mt-2 font-mono text-[11.5px] text-dim">{featured.stack.join(' · ')}</p>
        </div>
        <p className="text-[15.5px] leading-relaxed text-ink/70 md:pt-3 md:text-[16.5px]">{featured.desc}</p>
      </div>
    </motion.a>
  )
}

export function Projects() {
  return (
    <section id="projets" className="relative bg-night py-24 md:py-36">
      <div className="wrap">
        <div className="mb-12 flex flex-col gap-6 md:mb-16 md:flex-row md:items-end md:justify-between">
          <div>
            <Reveal className="eyebrow mb-5">(02) Projets</Reveal>
            <SplitReveal text="Ce que j'ai construit." className="h-display text-[clamp(42px,7vw,108px)] text-ink" accent={(w) => w.startsWith('construit')} />
          </div>
          <Reveal delay={0.2} className="max-w-sm text-[15.5px] leading-relaxed text-muted">
            Des sites en 3D, des boutiques, une appli, un jeu. Chaque projet est pensé d'abord pour le téléphone, parce que c'est là que sont vos clients.
          </Reveal>
        </div>

        <Featured />

        <div className="mt-5 grid gap-5 md:grid-cols-6">
          {projects.map((p, i) => (
            <Reveal key={p.name} delay={(i % 3) * 0.08} className={cn(i < 2 ? 'md:col-span-3' : 'md:col-span-2')}>
              <Tilt className="h-full" max={5}>
                <SpotlightCard className="flex h-full flex-col" glow={hexToRgb(p.hue)}>
                  <div className={cn('relative overflow-hidden rounded-t-[22px]', i < 2 ? 'aspect-[16/9]' : 'aspect-[4/3]')}>
                    {p.image ? (
                      <img src={p.image} alt={`Aperçu du projet ${p.name}`} loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" />
                    ) : (
                      <ProjectCover motif={p.motif} hue={p.hue} />
                    )}
                    <span className="absolute left-5 top-5 font-mono text-[11px] text-ink/60">0{i + 2}</span>
                    <span className="chip absolute right-4 top-4 !bg-night/50 backdrop-blur-md">{p.badge}</span>
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-6">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="h-display text-[28px] text-ink">{p.name}</h3>
                      <span className="eyebrow !text-[10px]">{p.kind}</span>
                    </div>
                    <p className="text-[14.5px] leading-relaxed text-muted">{p.desc}</p>
                    <p className="mt-auto pt-2 font-mono text-[11.5px] text-dim">{p.stack.join(' · ')}</p>
                  </div>
                </SpotlightCard>
              </Tilt>
            </Reveal>
          ))}
        </div>

        <div className="mt-20">
          <Reveal className="eyebrow mb-6">Aussi en ligne ou en chantier</Reveal>
          <ul className="border-t border-line">
            {alsoLive.map((a, i) => {
              const Row = a.link ? 'a' : 'div'
              return (
                <Reveal as="li" key={a.name} delay={i * 0.06} className="border-b border-line">
                  <Row
                    {...(a.link ? { href: a.link, target: '_blank', rel: 'noreferrer' } : {})}
                    className="group grid grid-cols-[1fr_auto] items-center gap-4 py-6 md:grid-cols-[260px_1fr_auto] md:gap-10"
                  >
                    <span className="h-display text-[24px] text-ink transition-transform duration-500 group-hover:translate-x-2 md:text-[30px]">{a.name}</span>
                    <span className="order-3 col-span-2 text-[14.5px] text-muted md:order-none md:col-span-1">{a.desc}</span>
                    <span className="flex items-center gap-3">
                      <span className={cn('chip !text-[11px]', a.status === 'En ligne' ? '!border-emerald-400/30 !text-emerald-300' : '!text-muted')}>{a.status}</span>
                      {a.link && (
                        <span className="inline-flex size-10 items-center justify-center rounded-full border border-white/15 transition-all duration-500 group-hover:rotate-45 group-hover:bg-ink group-hover:text-night">
                          <ArrowUpRight className="size-4" />
                        </span>
                      )}
                    </span>
                  </Row>
                </Reveal>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`
}
