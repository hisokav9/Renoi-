import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Menu, X } from 'lucide-react'
import { contact, nav, waLink } from '../../data/content'
import { cn } from '../../lib/cn'
import { store, useStore } from '../../lib/store'
import { WhatsAppIcon } from '../ui/Buttons'

const EASE = [0.16, 1, 0.3, 1] as const

export function Nav() {
  const intro = useStore((s) => s.introDone)
  const open = useStore((s) => s.menuOpen)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  const setOpen = (v: boolean) => store.set({ menuOpen: v })

  return (
    <>
      <motion.header
        initial={{ y: -30, opacity: 0 }}
        animate={intro ? { y: 0, opacity: 1 } : undefined}
        transition={{ duration: 1, ease: EASE, delay: 0.9 }}
        className="fixed inset-x-0 top-0 z-50 pt-[max(env(safe-area-inset-top),0px)]"
      >
        <div className="wrap pt-3 md:pt-4">
          <div
            className={cn(
              'flex h-14 items-center justify-between rounded-full pl-5 pr-2 transition-all duration-500',
              scrolled || open ? 'border border-white/10 bg-night/60 shadow-[0_10px_40px_-20px_rgb(0_0_0/0.8)] backdrop-blur-xl' : 'border border-transparent',
            )}
          >
            <a href="#top" className="h-display text-[22px] tracking-tight text-ink" aria-label="Samir, accueil" onClick={() => setOpen(false)}>
              samir<span className="text-sun">.</span>
            </a>
            <nav className="hidden items-center gap-1 md:flex" aria-label="Navigation principale">
              {nav.map((l) => (
                <a key={l.href} href={l.href} className="rounded-full px-4 py-2 text-[14px] text-ink/75 transition-colors hover:bg-white/[0.06] hover:text-ink">
                  {l.label}
                </a>
              ))}
            </nav>
            <div className="flex items-center gap-2">
              <a
                href={waLink('Bonjour Samir, je voudrais parler de mon projet.')}
                target="_blank"
                rel="noreferrer"
                className="hidden h-10 items-center gap-2 rounded-full bg-ink px-4 text-[14px] font-medium text-night transition-transform hover:scale-[1.03] sm:inline-flex"
              >
                <WhatsAppIcon className="size-4" /> Écrire sur WhatsApp
              </a>
              <button
                type="button"
                onClick={() => setOpen(!open)}
                className="inline-flex size-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-ink md:hidden"
                aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
                aria-expanded={open}
              >
                {open ? <X className="size-5" /> : <Menu className="size-5" />}
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-40 flex flex-col bg-night/95 px-6 pb-10 pt-28 backdrop-blur-2xl md:hidden"
            initial={{ clipPath: 'circle(0% at 92% 6%)' }}
            animate={{ clipPath: 'circle(150% at 92% 6%)' }}
            exit={{ clipPath: 'circle(0% at 92% 6%)' }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <nav className="flex flex-col gap-1" aria-label="Menu mobile">
              {nav.map((l, i) => (
                <motion.a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.7, ease: EASE, delay: 0.15 + i * 0.06 }}
                  className="h-display flex items-baseline gap-4 py-2 text-[44px] text-ink"
                >
                  <span className="font-mono text-xs text-dim">0{i + 1}</span>
                  {l.label}
                </motion.a>
              ))}
            </nav>
            <motion.div
              className="mt-auto flex flex-col gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <a
                href={waLink('Bonjour Samir, je voudrais parler de mon projet.')}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-ink text-[16px] font-medium text-night"
              >
                <WhatsAppIcon className="size-5" /> {contact.whatsappLabel}
              </a>
              <a href={`mailto:${contact.email}`} className="text-center text-sm text-muted">
                {contact.email}
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
