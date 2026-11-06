import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Plus } from 'lucide-react'
import { about, contact, faq } from '../../data/content'
import { cn } from '../../lib/cn'
import { TikTokIcon } from '../ui/Buttons'
import { Marquee, Tilt } from '../ui/Fx'
import { Reveal, SplitReveal } from '../ui/Text'

export function About() {
  return (
    <section id="apropos" className="relative overflow-hidden bg-night py-24 md:py-36">
      <div className="wrap grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24">
        <Reveal className="mx-auto w-full max-w-[420px]">
          <Tilt max={7}>
            <figure className="relative rotate-[-2.5deg] rounded-[6px] bg-[#f4efe6] p-3 pb-16 shadow-[0_50px_100px_-30px_rgb(0_0_0/0.9),0_0_0_1px_rgb(255_255_255/0.06)]">
              <div className="relative overflow-hidden rounded-[2px]">
                <img src="/img/samir.webp" alt="Portrait de Samir Abdoulaye Seyni" loading="lazy" decoding="async" className="aspect-[3/4] w-full object-cover" />
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgb(255_160_90/0.18),transparent_45%)] mix-blend-soft-light" />
              </div>
              <figcaption className="h-display absolute bottom-4 left-5 text-[24px] text-[#15171a]">
                Building from zero<span className="text-sun">.</span>
              </figcaption>
              <span className="absolute -top-3 left-1/2 h-7 w-24 -translate-x-1/2 rotate-[3deg] bg-[#e9dcc4]/80 shadow-sm" />
            </figure>
          </Tilt>
        </Reveal>
        <div>
          <Reveal className="eyebrow mb-5">(08) À propos</Reveal>
          <SplitReveal text={about.title} className="h-display text-[clamp(44px,6.6vw,104px)] text-ink" accent={(w) => w.startsWith('Samir')} />
          {about.paragraphs.map((p, i) => (
            <Reveal key={i} delay={0.1 + i * 0.08} className="mt-6 max-w-xl text-[16.5px] leading-relaxed text-ink/75">
              {p}
            </Reveal>
          ))}
          <Reveal delay={0.3} className="mt-8 flex flex-wrap gap-3">
            <a href={contact.tiktok} target="_blank" rel="noreferrer" className="chip !px-4 !py-2.5 !text-[14px] hover:!bg-white/10">
              <TikTokIcon className="size-4" /> {contact.tiktokHandle} · 16,8 K abonnés
            </a>
            <a href={contact.renoi} target="_blank" rel="noreferrer" className="chip !px-4 !py-2.5 !text-[14px] hover:!bg-white/10">
              <img src="/img/renoi-logo-light.png" alt="" className="size-4 object-contain" /> Renoi Studio
            </a>
          </Reveal>
        </div>
      </div>
      <div className="mt-20 md:mt-28">
        <Marquee duration={30} reverse>
          {about.stack.map((t) => (
            <span key={t} className="mx-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-2.5 font-mono text-[13px] text-ink/70">
              {t}
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  )
}

export function Faq() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section id="faq" className="relative bg-night py-24 md:py-32">
      <div className="wrap grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <Reveal className="eyebrow mb-5">(09) FAQ</Reveal>
          <SplitReveal text="Questions fréquentes." className="h-display text-[clamp(40px,5.4vw,84px)] text-ink" />
        </div>
        <div className="border-t border-line">
          {faq.map((f, i) => {
            const isOpen = open === i
            return (
              <Reveal key={f.q} delay={i * 0.04} className="border-b border-line">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-6 py-6 text-left"
                >
                  <span className={cn('text-[17px] font-medium transition-colors md:text-[19px]', isOpen ? 'text-ink' : 'text-ink/80')}>{f.q}</span>
                  <span
                    className={cn(
                      'inline-flex size-9 shrink-0 items-center justify-center rounded-full border transition-all duration-500',
                      isOpen ? 'rotate-45 border-sun bg-sun text-night' : 'border-white/15 text-ink',
                    )}
                  >
                    <Plus className="size-4" />
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="max-w-2xl pb-6 text-[15.5px] leading-relaxed text-muted">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
