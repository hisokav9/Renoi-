import { Component, lazy, Suspense, useEffect, useMemo, useRef, type ReactNode } from 'react'
import { motion, useInView, useScroll, useTransform } from 'motion/react'
import { ArrowDown, ArrowUpRight } from 'lucide-react'
import { contact, waLink } from '../../data/content'
import { hasWebGL, isLowPower, prefersReducedMotion } from '../../lib/device'
import { heroScroll, pointer, store, useStore } from '../../lib/store'
import { GhostButton, PrimaryButton, WhatsAppIcon } from '../ui/Buttons'
import { LiveDot } from '../ui/Fx'
import { SplitReveal } from '../ui/Text'

const HeroScene = lazy(() => import('../three/HeroScene'))
const EASE = [0.16, 1, 0.3, 1] as const

class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    store.set({ sceneReady: true })
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

/** Image de secours (sans WebGL ou mouvement réduit) : dégradé de coucher de soleil. */
function StaticBackdrop() {
  useEffect(() => {
    store.set({ sceneReady: true })
  }, [])
  return (
    <div className="absolute inset-0 overflow-hidden bg-[linear-gradient(180deg,#05050d_0%,#2a1238_38%,#e0643a_62%,#4a2530_63%,#120b17_100%)]">
      <div className="absolute left-[22%] top-[52%] size-24 -translate-y-1/2 rounded-full bg-[#ffe1b8] blur-[2px] shadow-[0_0_120px_60px_rgb(255_160_90/0.55)]" />
      <svg className="absolute inset-x-0 bottom-0 h-[48%] w-full" viewBox="0 0 1440 400" preserveAspectRatio="none" aria-hidden>
        <path d="M0 120 C 240 40 420 160 640 90 S 1080 30 1440 110 L1440 400 L0 400Z" fill="#3a1d2b" />
        <path d="M0 220 C 300 140 520 260 820 190 S 1240 160 1440 230 L1440 400 L0 400Z" fill="#1d1220" />
      </svg>
      <div className="absolute inset-x-0 top-[34%] text-center h-display text-[22vw] leading-none text-[#e9c49a] opacity-90 md:text-[15vw]">
        samir<span className="text-sun">.</span>
      </div>
    </div>
  )
}

export function Hero() {
  const intro = useStore((s) => s.introDone)
  const section = useRef<HTMLElement>(null)
  const visible = useInView(section, { margin: '0px 0px 0px 0px' })
  const use3D = useMemo(() => hasWebGL() && !prefersReducedMotion(), [])
  const quality = useMemo(
    () => (isLowPower() ? { segments: 150, dust: 260, dpr: [1, 1.5] as [number, number] } : { segments: 230, dust: 520, dpr: [1, 1.75] as [number, number] }),
    [],
  )

  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end end'] })
  const contentOpacity = useTransform(scrollYProgress, [0, 0.45], [1, 0])
  const contentY = useTransform(scrollYProgress, [0, 0.5], [0, -90])
  const contentBlur = useTransform(scrollYProgress, [0, 0.45], ['blur(0px)', 'blur(12px)'])
  const shade = useTransform(scrollYProgress, [0.55, 1], [0, 0.85])

  useEffect(() => {
    const un = scrollYProgress.on('change', (v) => {
      heroScroll.p = v
    })
    const onMove = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => (un(), window.removeEventListener('pointermove', onMove))
  }, [scrollYProgress])

  return (
    <section id="top" ref={section} className="relative h-[175svh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div className="absolute inset-0">
          {use3D ? (
            <SceneBoundary fallback={<StaticBackdrop />}>
              <Suspense fallback={null}>
                <HeroScene active={visible} quality={quality} />
              </Suspense>
            </SceneBoundary>
          ) : (
            <StaticBackdrop />
          )}
        </div>

        {/* voiles pour la lisibilité + vignette */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_40%,transparent_55%,rgb(7_6_10/0.75)_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-night via-night/70 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-night/70 to-transparent" />
        <motion.div style={{ opacity: shade }} className="pointer-events-none absolute inset-0 bg-night" />

        <motion.div style={{ opacity: contentOpacity, y: contentY, filter: contentBlur }} className="absolute inset-x-0 bottom-0">
          <div className="wrap pb-[max(28px,env(safe-area-inset-bottom))] md:pb-12">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={intro ? { opacity: 1, y: 0 } : undefined}
              transition={{ duration: 0.9, ease: EASE, delay: 0.5 }}
              className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 eyebrow"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[10.5px] text-ink/85 backdrop-blur-md">
                <LiveDot /> Disponible pour de nouveaux projets
              </span>
              <span className="hidden sm:inline">{contact.name} · Développeur web · Dosso, Niger</span>
            </motion.div>

            <div className="grid items-end gap-8 lg:grid-cols-[1.6fr_1fr] lg:gap-14">
              <SplitReveal
                as="h1"
                text="Je code des sites qui font vendre."
                play={intro}
                delay={0.55}
                stagger={0.028}
                accent={(w) => w.startsWith('vendre')}
                className="h-display text-[clamp(44px,6.1vw,100px)] text-ink [text-wrap:balance]"
              />
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={intro ? { opacity: 1, y: 0 } : undefined}
                transition={{ duration: 1, ease: EASE, delay: 1.25 }}
                className="flex flex-col gap-6 lg:pb-3"
              >
                <p className="max-w-md text-[16px] leading-relaxed text-ink/75 md:text-[17px]">
                  Sites 3D premium, boutiques en ligne, applis IA, bots et vidéos pub pour les entreprises du Niger et d'Afrique
                  francophone. Du design au code, par une seule personne.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <PrimaryButton href={waLink('Bonjour Samir, je voudrais démarrer un projet.')} target="_blank" rel="noreferrer">
                    <WhatsAppIcon className="size-[18px]" /> Démarrer un projet
                  </PrimaryButton>
                  <GhostButton href="#projets">
                    Voir mes projets <ArrowUpRight className="size-4 transition-transform group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5" />
                  </GhostButton>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={intro ? { opacity: 1 } : undefined}
              transition={{ duration: 1, delay: 1.8 }}
              className="mt-10 hidden items-center justify-between border-t border-white/10 pt-5 md:flex"
            >
              <span className="eyebrow">Sites 3D · Boutiques · Applis IA · Bots · Vidéos pub</span>
              <a href="#approche" className="eyebrow inline-flex items-center gap-2 hover:text-ink">
                Défiler <ArrowDown className="size-3.5 animate-float" />
              </a>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
