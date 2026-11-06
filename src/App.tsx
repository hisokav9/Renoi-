import { useEffect, useState } from 'react'
import Lenis from 'lenis'
import { AnimatePresence, motion } from 'motion/react'
import { waLink } from './data/content'
import { prefersReducedMotion } from './lib/device'
import { useStore } from './lib/store'
import { WhatsAppIcon } from './components/ui/Buttons'
import { Preloader } from './components/sections/Preloader'
import { Nav } from './components/sections/Nav'
import { Hero } from './components/sections/Hero'
import { Manifesto, Stats } from './components/sections/Intro'
import { Projects } from './components/sections/Projects'
import { Concepts } from './components/sections/Concepts'
import { Proof, Services } from './components/sections/Services'
import { Pricing, Process } from './components/sections/Pricing'
import { About, Faq } from './components/sections/About'
import { Contact, Footer } from './components/sections/Contact'

function useSmoothScroll() {
  const intro = useStore((s) => s.introDone)
  const menu = useStore((s) => s.menuOpen)
  const [lenis, setLenis] = useState<Lenis | null>(null)

  useEffect(() => {
    if (prefersReducedMotion()) return
    const l = new Lenis({ duration: 1.15, anchors: { offset: -20 }, smoothWheel: true })
    let raf = 0
    const loop = (t: number) => {
      l.raf(t)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    setLenis(l)
    return () => (cancelAnimationFrame(raf), l.destroy())
  }, [])

  useEffect(() => {
    const locked = !intro || menu
    document.documentElement.style.overflow = locked ? 'hidden' : ''
    if (!lenis) return
    if (locked) lenis.stop()
    else lenis.start()
  }, [intro, menu, lenis])
}

function FloatingWhatsApp() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const on = () => setShow(window.scrollY > window.innerHeight * 1.2)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  return (
    <AnimatePresence>
      {show && (
        <motion.a
          href={waLink('Bonjour Samir, je viens de voir ton portfolio.')}
          target="_blank"
          rel="noreferrer"
          aria-label="Écrire sur WhatsApp"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          className="fixed bottom-[max(18px,env(safe-area-inset-bottom))] right-4 z-40 inline-flex size-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-[0_12px_40px_-8px_rgb(37_211_102/0.6)] md:right-6 md:size-15"
        >
          <WhatsAppIcon className="size-7" />
        </motion.a>
      )}
    </AnimatePresence>
  )
}

export default function App() {
  useSmoothScroll()
  return (
    <>
      <Preloader />
      <Nav />
      <main>
        <Hero />
        <Stats />
        <Manifesto />
        <Projects />
        <Concepts />
        <Services />
        <Proof />
        <Pricing />
        <Process />
        <About />
        <Faq />
        <Contact />
      </main>
      <Footer />
      <FloatingWhatsApp />
    </>
  )
}
