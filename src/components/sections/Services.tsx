import { ArrowUpRight, Bot, Clapperboard, Globe, PenLine, ShoppingBag, Sparkles } from 'lucide-react'
import { proof, services, type Service } from '../../data/content'
import { cn } from '../../lib/cn'
import { CountUp, SpotlightCard } from '../ui/Fx'
import { Reveal, SplitReveal } from '../ui/Text'

const ICONS: Record<Service['icon'], typeof Globe> = {
  globe: Globe,
  bag: ShoppingBag,
  sparkles: Sparkles,
  bot: Bot,
  clapperboard: Clapperboard,
  pen: PenLine,
}

export function Services() {
  return (
    <section id="services" className="relative bg-night py-24 md:py-36">
      <div className="wrap">
        <div className="mb-12 grid gap-6 md:mb-16 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <Reveal className="eyebrow mb-5">(04) Services</Reveal>
            <SplitReveal text="Ce que je peux faire pour vous." className="h-display max-w-[16ch] text-[clamp(40px,6.4vw,100px)] text-ink" accent={(w) => w === 'vous.'} />
          </div>
          <Reveal delay={0.15} className="max-w-sm text-[15.5px] leading-relaxed text-muted">
            Un seul interlocuteur du début à la fin : le design, le code, les textes et les vidéos qui ramènent les clients.
          </Reveal>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => {
            const Icon = ICONS[s.icon]
            return (
              <Reveal key={s.title} delay={(i % 3) * 0.07} className={cn((s.wide || i === services.length - 1) && 'lg:col-span-2', s.lines && 'lg:row-span-2')}>
                <SpotlightCard className="flex h-full flex-col p-6 md:p-8">
                  <div className="mb-8 flex items-start justify-between">
                    <span className="relative inline-flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-sun/25 to-transparent text-[#ffc08a] shadow-[0_0_40px_-10px_rgb(255_122_47/0.6)]">
                      <Icon className="size-[22px]" strokeWidth={1.6} />
                    </span>
                    <span className="font-mono text-[11px] text-dim">0{i + 1}</span>
                  </div>
                  <h3 className={cn('h-display text-ink', s.wide ? 'text-[clamp(28px,3.2vw,44px)]' : 'text-[28px]')}>{s.title}</h3>
                  <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-muted">{s.desc}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {s.tags.map((t) => (
                      <span key={t} className="chip">
                        {t}
                      </span>
                    ))}
                  </div>
                  {s.lines && (
                    <dl className="mt-6 divide-y divide-white/5 rounded-2xl border border-white/10 bg-white/[0.02]">
                      {s.lines.map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between px-4 py-3 text-[14px]">
                          <dt className="text-muted">{k}</dt>
                          <dd className="font-mono text-ink">{v}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                  <div className="mt-auto flex items-center justify-between gap-4 pt-8">
                    <span className="font-mono text-[13px] text-ink">{s.price}</span>
                    {s.link ? (
                      <a href={s.link.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[13.5px] text-[#ffb27a] hover:text-ink">
                        {s.link.label} <ArrowUpRight className="size-4" />
                      </a>
                    ) : s.icon === 'globe' ? (
                      <a href="#tarifs" className="inline-flex items-center gap-1.5 text-[13.5px] text-[#ffb27a] hover:text-ink">
                        Voir les formules <ArrowUpRight className="size-4" />
                      </a>
                    ) : null}
                  </div>
                </SpotlightCard>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function Proof() {
  return (
    <section className="relative overflow-hidden bg-night py-24 md:py-40" aria-label="Preuve : Selv Digital">
      <div className="pointer-events-none absolute -left-[20%] top-1/2 size-[80vmax] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(255_122_47/0.16),rgb(232_70_58/0.05)_35%,transparent_60%)]" />
      <div className="wrap relative grid gap-14 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <div>
          <Reveal className="eyebrow mb-5">(05) La preuve</Reveal>
          <SplitReveal text={proof.title} className="h-display max-w-[14ch] text-[clamp(38px,5.6vw,88px)] text-ink" accent={(w) => w === 'vendre'} />
          <Reveal delay={0.15} className="mt-8 max-w-xl text-[16px] leading-relaxed text-ink/70">
            {proof.intro}
          </Reveal>
          <Reveal delay={0.25} className="mt-8">
            <a href={proof.link} target="_blank" rel="noreferrer" className="group inline-flex items-center gap-3 text-[15px] text-ink">
              <span className="inline-flex size-11 items-center justify-center rounded-full border border-white/15 transition-all duration-500 group-hover:rotate-45 group-hover:bg-ink group-hover:text-night">
                <ArrowUpRight className="size-4" />
              </span>
              Visiter la boutique Selv Digital
            </a>
          </Reveal>
        </div>
        <div className="flex flex-col">
          {proof.numbers.map((n, i) => (
            <Reveal key={n.label} delay={i * 0.1} className="flex items-baseline justify-between gap-6 border-b border-line py-6 first:border-t">
              <CountUp value={n.value} suffix={n.suffix} className="h-display text-[clamp(56px,8vw,128px)] text-ink" />
              <span className="max-w-[16ch] text-right text-[15px] text-muted">{n.label}</span>
            </Reveal>
          ))}
          <p className="mt-4 font-mono text-[11px] text-dim">Chiffres de la boutique Selv Digital sur Chariow, novembre 2026.</p>
        </div>
      </div>
    </section>
  )
}
