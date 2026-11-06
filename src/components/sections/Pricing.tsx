import { useRef } from 'react'
import { motion, useScroll } from 'motion/react'
import { Check } from 'lucide-react'
import { planNotes, plans, steps, waLink } from '../../data/content'
import { cn } from '../../lib/cn'
import { BorderBeam } from '../ui/Fx'
import { Reveal, SplitReveal } from '../ui/Text'

export function Pricing() {
  return (
    <section id="tarifs" className="relative bg-night py-24 md:py-36">
      <div className="wrap">
        <div className="mb-12 text-center md:mb-16">
          <Reveal className="eyebrow mb-5">(06) Tarifs</Reveal>
          <SplitReveal text="Les formules pour votre site." className="h-display mx-auto max-w-[14ch] text-[clamp(40px,6.4vw,100px)] text-ink" accent={(w) => w === 'site.'} />
          <Reveal delay={0.15} className="mx-auto mt-6 max-w-md text-[15.5px] leading-relaxed text-muted">
            Des prix de départ clairs. Le tarif final est fixé avec vous, avant de commencer.
          </Reveal>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((p, i) => (
            <Reveal key={p.name} delay={i * 0.08} className="h-full">
              <article
                className={cn(
                  'card relative flex h-full flex-col p-7',
                  p.featured && 'bg-[linear-gradient(180deg,rgb(255_122_47/0.14),rgb(255_255_255/0.02)_45%)] shadow-[0_30px_80px_-30px_rgb(255_122_47/0.45)] xl:-translate-y-3',
                )}
              >
                {p.featured && <BorderBeam />}
                <div className="flex items-center justify-between">
                  <h3 className="h-display text-[26px] text-ink">{p.name}</h3>
                  {p.featured && <span className="chip !border-sun/40 !bg-sun/20 !text-[11px] !text-[#ffd0a8]">Recommandée</span>}
                </div>
                <div className="mt-6">
                  <span className="eyebrow !text-[10px]">{p.unit ? 'À partir de' : 'Selon le projet'}</span>
                  <p className="mt-2 flex items-baseline gap-2">
                    <span className="h-display text-[44px] text-ink">{p.price}</span>
                    {p.unit && <span className="font-mono text-[12px] text-muted">{p.unit}</span>}
                  </p>
                  <p className="mt-2 text-[14px] text-muted">{p.pitch}</p>
                </div>
                <ul className="mt-6 flex flex-col gap-3 border-t border-line pt-6">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-3 text-[14.5px] text-ink/85">
                      <Check className="mt-0.5 size-4 shrink-0 text-sun" strokeWidth={2.4} /> {f}
                    </li>
                  ))}
                </ul>
                <dl className="mt-auto grid grid-cols-2 gap-3 pt-8 text-[13px]">
                  <div>
                    <dt className="eyebrow !text-[9.5px]">Délai indicatif</dt>
                    <dd className="mt-1 text-ink">{p.delay}</dd>
                  </div>
                  <div>
                    <dt className="eyebrow !text-[9.5px]">Retouches</dt>
                    <dd className="mt-1 text-ink">{p.rounds}</dd>
                  </div>
                </dl>
                <a
                  href={waLink(`Bonjour Samir, la formule ${p.name} m'intéresse. On peut en parler ?`)}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    'mt-6 inline-flex h-12 items-center justify-center rounded-full text-[14.5px] font-medium transition-all duration-300',
                    p.featured ? 'bg-ink text-night hover:scale-[1.02]' : 'border border-white/15 text-ink hover:border-white/35 hover:bg-white/5',
                  )}
                >
                  Choisir {p.name}
                </a>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-6 grid gap-px overflow-hidden rounded-[22px] border border-sun/20 bg-sun/10 md:grid-cols-3">
          {planNotes.map((n) => (
            <p key={n.strong} className="bg-night/80 p-5 text-[14px] leading-relaxed text-ink/75">
              <strong className="font-semibold text-ink">{n.strong}</strong> {n.text}
            </p>
          ))}
        </Reveal>
      </div>
    </section>
  )
}

export function Process() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.8', 'end 0.55'] })
  return (
    <section id="methode" className="relative bg-night py-24 md:py-32">
      <div className="wrap">
        <Reveal className="eyebrow mb-5">(07) Méthode</Reveal>
        <SplitReveal text="Comment on travaille ensemble." className="h-display max-w-[14ch] text-[clamp(38px,5.6vw,88px)] text-ink" />
        <div ref={ref} className="relative mt-14 md:mt-20">
          <div className="absolute left-[11px] top-2 h-[calc(100%-16px)] w-px bg-white/10 md:left-0 md:top-[11px] md:h-px md:w-full">
            <motion.div style={{ scaleY: scrollYProgress }} className="h-full w-full origin-top bg-gradient-to-b from-gold via-sun to-ember md:hidden" />
            <motion.div style={{ scaleX: scrollYProgress }} className="hidden h-full w-full origin-left bg-gradient-to-r from-gold via-sun to-ember md:block" />
          </div>
          <ol className="grid gap-10 md:grid-cols-4 md:gap-8">
            {steps.map((s, i) => (
              <Reveal as="li" key={s.title} delay={i * 0.1} className="relative pl-10 md:pl-0 md:pt-12">
                <span className="absolute left-0 top-0 inline-flex size-6 items-center justify-center rounded-full border border-sun/60 bg-night">
                  <span className="size-2 rounded-full bg-sun shadow-[0_0_14px_rgb(255_122_47)]" />
                </span>
                <span className="font-mono text-[11px] text-dim">Étape 0{i + 1}</span>
                <h3 className="h-display mt-2 text-[28px] text-ink">{s.title}</h3>
                <p className="mt-3 max-w-xs text-[14.5px] leading-relaxed text-muted">{s.text}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
