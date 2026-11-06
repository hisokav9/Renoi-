import { useRef, type ElementType, type ReactNode } from 'react'
import { motion, useInView, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { cn } from '../../lib/cn'

const EASE = [0.16, 1, 0.3, 1] as const

// Dégradé coucher de soleil, lettre par lettre (fiable même avec des lettres animées).
const STOPS = [
  [255, 201, 128],
  [255, 122, 47],
  [232, 70, 58],
]
export function sunset(t: number) {
  const x = Math.min(1, Math.max(0, t)) * (STOPS.length - 1)
  const i = Math.min(STOPS.length - 2, Math.floor(x))
  const f = x - i
  const c = STOPS[i].map((v, k) => Math.round(v + (STOPS[i + 1][k] - v) * f))
  return `rgb(${c[0]} ${c[1]} ${c[2]})`
}

type SplitProps = {
  text: string
  as?: ElementType
  className?: string
  /** Mots colorés en dégradé coucher de soleil. */
  accent?: (word: string, index: number) => boolean
  delay?: number
  stagger?: number
  /** Démarre l'animation quand `play` passe à true (sinon : à l'apparition à l'écran). */
  play?: boolean
}

/** Titre qui se dévoile lettre par lettre, avec une rotation 3D (style cinéma). */
export function SplitReveal({ text, as: Tag = 'h2', className, accent, delay = 0, stagger = 0.022, play }: SplitProps) {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -12% 0px' })
  const reduce = useReducedMotion()
  const go = play ?? inView
  const words = text.split(' ')
  let charIndex = 0
  return (
    <Tag ref={ref} className={cn('[perspective:900px]', className)} aria-label={text}>
      {words.map((word, wi) => (
        <span key={wi} aria-hidden className="inline-block whitespace-nowrap">
          {Array.from(word).map((ch, ci, arr) => {
            const i = charIndex++
            const color = accent?.(word, wi) ? sunset(arr.length > 1 ? ci / (arr.length - 1) : 0) : undefined
            return (
              <span key={ci} className="inline-block overflow-hidden pb-[0.12em] -mb-[0.12em] align-bottom">
                <motion.span
                  className="inline-block origin-[50%_100%] will-change-transform"
                  style={color ? { color } : undefined}
                  initial={reduce ? false : { y: '105%', rotateX: -75, opacity: 0, filter: 'blur(8px)' }}
                  animate={go ? { y: '0%', rotateX: 0, opacity: 1, filter: 'blur(0px)' } : undefined}
                  transition={{ duration: 1.05, ease: EASE, delay: delay + i * stagger }}
                >
                  {ch}
                </motion.span>
              </span>
            )
          })}
          {wi < words.length - 1 && <span className="inline-block">&nbsp;</span>}
        </span>
      ))}
    </Tag>
  )
}

/** Apparition douce (montée + flou) quand l'élément entre à l'écran. */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 28,
  as = 'div',
}: {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
  as?: 'div' | 'li' | 'p' | 'span' | 'article' | 'section'
}) {
  const reduce = useReducedMotion()
  const M = motion[as] as typeof motion.div
  return (
    <M
      className={className}
      initial={reduce ? false : { opacity: 0, y, filter: 'blur(10px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: 1, ease: EASE, delay }}
    >
      {children}
    </M>
  )
}

function Word({ children, progress, range, accent }: { children: string; progress: MotionValue<number>; range: [number, number]; accent?: boolean }) {
  const opacity = useTransform(progress, range, [0.14, 1])
  const y = useTransform(progress, range, [6, 0])
  return (
    <motion.span style={{ opacity, y }} className={cn('inline-block mr-[0.25em]', accent && 'text-gradient')}>
      {children}
    </motion.span>
  )
}

/** Texte qui s'allume mot par mot au fil du défilement. */
export function ScrollWords({ text, highlights = [], className }: { text: string; highlights?: string[]; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.45'] })
  const words = text.split(' ')
  return (
    <p ref={ref} className={className}>
      {words.map((w, i) => {
        const start = i / words.length
        const end = start + 1 / words.length
        return (
          <Word key={i} progress={scrollYProgress} range={[start, end]} accent={highlights.includes(w)}>
            {w}
          </Word>
        )
      })}
    </p>
  )
}
