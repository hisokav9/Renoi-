import { useMemo, useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { ArrowUp, Check, Copy, Mail } from 'lucide-react'
import { budgets, contact, nav, needs, waLink } from '../../data/content'
import { cn } from '../../lib/cn'
import { PrimaryButton, TikTokIcon, WhatsAppIcon } from '../ui/Buttons'
import { Reveal, SplitReveal } from '../ui/Text'

export function Contact() {
  const [name, setName] = useState('')
  const [activity, setActivity] = useState('')
  const [picked, setPicked] = useState<string[]>([])
  const [budget, setBudget] = useState(budgets[0])
  const [copied, setCopied] = useState(false)

  const message = useMemo(() => {
    const lines = [
      `Bonjour Samir, je m'appelle ${name.trim() || '[votre prénom]'}.`,
      activity.trim() ? `Mon activité : ${activity.trim()}.` : null,
      `Je cherche : ${picked.length ? picked.join(', ').toLowerCase() : 'des conseils pour mon projet'}.`,
      `Budget : ${budget.toLowerCase()}.`,
      'On peut en parler ?',
    ]
    return lines.filter(Boolean).join('\n')
  }, [name, activity, picked, budget])

  const toggle = (n: string) => setPicked((p) => (p.includes(n) ? p.filter((x) => x !== n) : [...p, n]))
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* presse-papiers indisponible */
    }
  }

  const field =
    'h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-[15px] text-ink placeholder:text-dim outline-none transition focus:border-sun/60 focus:bg-white/[0.06]'

  return (
    <section id="contact" className="relative overflow-hidden bg-night py-24 md:py-36">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[60vh] w-[120vw] -translate-x-1/2 bg-[radial-gradient(50%_60%_at_50%_0%,rgb(255_122_47/0.18),transparent)]" />
      <div className="wrap relative grid gap-14 lg:grid-cols-[1fr_1fr] lg:gap-20">
        <div>
          <Reveal className="eyebrow mb-5">(10) Contact</Reveal>
          <SplitReveal text="Parlons de votre projet." className="h-display text-[clamp(46px,7vw,112px)] text-ink" accent={(w) => w === 'projet.'} />
          <Reveal delay={0.15} className="mt-6 max-w-md text-[16px] leading-relaxed text-ink/70">
            Décrivez votre besoin en 30 secondes. Le message s'ouvre dans WhatsApp, prêt à envoyer. Je réponds personnellement.
          </Reveal>
          <Reveal delay={0.25} className="mt-10 flex flex-col divide-y divide-white/10 border-y border-white/10">
            {[
              { k: 'WhatsApp', v: contact.whatsappLabel, href: waLink(), Icon: WhatsAppIcon },
              { k: 'E-mail', v: contact.email, href: `mailto:${contact.email}`, Icon: Mail },
              { k: 'TikTok', v: contact.tiktokHandle, href: contact.tiktok, Icon: TikTokIcon },
            ].map(({ k, v, href, Icon }) => (
              <a key={k} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="group flex items-center gap-4 py-4">
                <Icon className="size-[18px] text-sun" />
                <span className="w-24 font-mono text-[11px] uppercase tracking-wider text-dim">{k}</span>
                <span className="text-[16px] text-ink transition-transform duration-500 group-hover:translate-x-1 break-all">{v}</span>
              </a>
            ))}
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <form
            className="card flex flex-col gap-5 p-6 md:p-8"
            onSubmit={(e) => {
              e.preventDefault()
              window.open(waLink(message), '_blank', 'noopener')
            }}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-[13.5px] text-muted">
                Votre prénom
                <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. : Aïcha" autoComplete="given-name" />
              </label>
              <label className="flex flex-col gap-2 text-[13.5px] text-muted">
                Votre activité
                <input className={field} value={activity} onChange={(e) => setActivity(e.target.value)} placeholder="Ex. : restaurant à Niamey" />
              </label>
            </div>
            <fieldset>
              <legend className="mb-3 text-[13.5px] text-muted">Ce que vous cherchez</legend>
              <div className="flex flex-wrap gap-2">
                {needs.map((n) => {
                  const on = picked.includes(n)
                  return (
                    <button
                      type="button"
                      key={n}
                      onClick={() => toggle(n)}
                      aria-pressed={on}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-[13.5px] transition-all duration-300',
                        on ? 'border-sun bg-sun/15 text-ink' : 'border-white/12 bg-white/[0.03] text-ink/75 hover:border-white/30',
                      )}
                    >
                      {on && <Check className="size-3.5 text-sun" />} {n}
                    </button>
                  )
                })}
              </div>
            </fieldset>
            <label className="flex flex-col gap-2 text-[13.5px] text-muted">
              Budget
              <select className={cn(field, 'appearance-none bg-[length:12px] bg-[right_16px_center] bg-no-repeat')} value={budget} onChange={(e) => setBudget(e.target.value)}>
                {budgets.map((b) => (
                  <option key={b} value={b} className="bg-surface">
                    {b}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex flex-col gap-2">
              <span className="text-[13.5px] text-muted">Aperçu du message</span>
              <pre className="whitespace-pre-wrap rounded-xl border border-white/10 bg-black/30 p-4 font-mono text-[12.5px] leading-relaxed text-ink/80">{message}</pre>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="submit"
                className="group/btn relative inline-flex h-12 items-center gap-2.5 overflow-hidden rounded-full bg-ink px-6 text-[15px] font-medium text-night shadow-[0_10px_40px_-10px_rgb(255_122_47/0.55)] transition-transform active:scale-[0.97]"
              >
                <WhatsAppIcon className="size-[18px]" /> Envoyer sur WhatsApp
              </button>
              <button
                type="button"
                onClick={copy}
                className="inline-flex h-12 items-center gap-2 rounded-full border border-white/15 px-5 text-[14.5px] text-ink transition hover:border-white/30"
              >
                {copied ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />} {copied ? 'Copié' : 'Copier'}
              </button>
            </div>
          </form>
        </Reveal>
      </div>
    </section>
  )
}

export function Footer() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] })
  const y = useTransform(scrollYProgress, [0, 1], ['30%', '0%'])
  const opacity = useTransform(scrollYProgress, [0, 0.8], [0.2, 1])
  return (
    <footer ref={ref} className="relative overflow-hidden border-t border-line bg-night pt-16">
      <div className="wrap">
        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="h-display max-w-[16ch] text-[clamp(30px,3.6vw,52px)] text-ink">Prêt à lancer quelque chose qui se voit ?</p>
            <div className="mt-6">
              <PrimaryButton href={waLink('Bonjour Samir, je suis prêt à lancer mon projet.')} target="_blank" rel="noreferrer">
                <WhatsAppIcon className="size-[18px]" /> Écrire sur WhatsApp
              </PrimaryButton>
            </div>
          </div>
          <nav className="grid grid-cols-2 gap-x-12 gap-y-3 text-[14.5px]" aria-label="Pied de page">
            {nav.map((l) => (
              <a key={l.href} href={l.href} className="text-muted transition-colors hover:text-ink">
                {l.label}
              </a>
            ))}
            <a href={contact.renoi} target="_blank" rel="noreferrer" className="text-muted hover:text-ink">
              Renoi Studio
            </a>
            <a href={contact.selvDigital} target="_blank" rel="noreferrer" className="text-muted hover:text-ink">
              Selv Digital
            </a>
            <a href={contact.tiktok} target="_blank" rel="noreferrer" className="text-muted hover:text-ink">
              TikTok
            </a>
          </nav>
        </div>
      </div>
      <motion.div
        style={{ y, opacity }}
        aria-hidden
        className="h-display mt-12 select-none whitespace-nowrap text-center text-[25.5vw] !leading-[0.78] tracking-[-0.06em]"
      >
        <span className="bg-[linear-gradient(180deg,#f4efe8_10%,rgb(244_239_232/0.05)_95%)] bg-clip-text text-transparent">samir</span>
        <span className="ml-[0.02em] inline-block size-[0.17em] rounded-full bg-sun align-baseline shadow-[0_0_60px_rgb(255_122_47/0.6)]" />
      </motion.div>
      <div className="wrap flex flex-col gap-3 border-t border-line py-6 text-[12.5px] text-dim sm:flex-row sm:items-center sm:justify-between">
        <span>© 2026 {contact.name}. Conçu et codé au Niger.</span>
        <a href="#top" className="inline-flex items-center gap-2 hover:text-ink">
          Retour en haut <ArrowUp className="size-3.5" />
        </a>
      </div>
    </footer>
  )
}
