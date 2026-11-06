import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { store, useStore } from '../../lib/store'
import { prefersReducedMotion } from '../../lib/device'

const EASE = [0.76, 0, 0.24, 1] as const

/** Écran d'ouverture : compteur 0 → 100 pendant le chargement de la 3D, puis rideau. */
export function Preloader() {
  const ready = useStore((s) => s.sceneReady)
  const [n, setN] = useState(0)
  const [done, setDone] = useState(false)
  const readyRef = useRef(ready)
  useEffect(() => {
    readyRef.current = ready
  }, [ready])

  useEffect(() => {
    const reduce = prefersReducedMotion()
    const t0 = performance.now()
    const minTime = reduce ? 200 : 1500
    const maxTime = 4500
    let raf = 0
    let v = 0
    const tick = () => {
      const t = performance.now() - t0
      const canFinish = (readyRef.current && t > minTime) || t > maxTime
      const target = canFinish ? 100 : Math.min(92, (t / minTime) * 80 + (readyRef.current ? 12 : 0))
      v += (target - v) * (canFinish ? 0.16 : 0.06)
      if (canFinish && v > 99.4) v = 100
      setN(Math.round(v))
      if (v >= 100) {
        setTimeout(() => setDone(true), reduce ? 0 : 250)
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <AnimatePresence onExitComplete={() => store.set({ introDone: true })}>
      {!done && (
        <motion.div
          key="pre"
          className="fixed inset-0 z-[100] flex flex-col justify-between bg-night p-[clamp(18px,4.5vw,56px)]"
          exit={{ clipPath: 'inset(0 0 100% 0)' }}
          initial={{ clipPath: 'inset(0 0 0% 0)' }}
          transition={{ duration: 1.1, ease: EASE }}
          aria-hidden
        >
          <div className="flex items-center justify-between eyebrow">
            <span>Samir Abdoulaye Seyni</span>
            <span>Dosso · Niger</span>
          </div>
          <div className="flex items-end justify-between gap-6">
            <motion.div
              className="h-display text-[clamp(56px,12vw,180px)] text-ink"
              exit={{ y: -60, opacity: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
            >
              samir<span className="text-sun">.</span>
            </motion.div>
            <motion.div
              className="font-display text-[clamp(40px,8vw,120px)] font-light tabular-nums leading-none text-muted"
              exit={{ y: -60, opacity: 0 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.05 }}
            >
              {String(n).padStart(3, '0')}
            </motion.div>
          </div>
          <div className="h-px w-full overflow-hidden bg-white/10">
            <div className="h-full bg-gradient-to-r from-gold via-sun to-ember transition-[width] duration-150" style={{ width: `${n}%` }} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
