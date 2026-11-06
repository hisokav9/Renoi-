import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react'
import { animate, motion, useInView, useMotionValue, useReducedMotion, useSpring } from 'motion/react'
import { cn } from '../../lib/cn'
import { isTouch } from '../../lib/device'

/** Carte avec halo lumineux qui suit la souris (bord + fond). */
export function SpotlightCard({ children, className, glow = '255 122 47' }: { children: ReactNode; className?: string; glow?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${e.clientX - r.left}px`)
    el.style.setProperty('--my', `${e.clientY - r.top}px`)
  }
  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      style={{ '--glow': glow } as CSSProperties}
      className={cn(
        'group/spot card overflow-hidden transition-colors duration-500',
        'before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:opacity-0 before:transition-opacity before:duration-500 group-hover/spot:before:opacity-100 hover:before:opacity-100',
        'before:bg-[radial-gradient(420px_circle_at_var(--mx,50%)_var(--my,50%),rgb(var(--glow)/0.13),transparent_45%)]',
        'after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:p-px after:opacity-0 after:transition-opacity after:duration-500 hover:after:opacity-100',
        'after:bg-[radial-gradient(260px_circle_at_var(--mx,50%)_var(--my,50%),rgb(var(--glow)/0.85),transparent_55%)]',
        'after:[mask:linear-gradient(#000_0_0)_content-box_exclude,linear-gradient(#000_0_0)]',
        className,
      )}
    >
      {children}
    </div>
  )
}

/** Inclinaison 3D au survol. */
export function Tilt({ children, className, max = 8 }: { children: ReactNode; className?: string; max?: number }) {
  const reduce = useReducedMotion()
  const rx = useSpring(0, { stiffness: 160, damping: 18 })
  const ry = useSpring(0, { stiffness: 160, damping: 18 })
  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    if (reduce || isTouch()) return
    const r = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    ry.set(px * max * 2)
    rx.set(-py * max * 2)
  }
  return (
    <div className={cn('[perspective:1200px]', className)} onMouseMove={onMove} onMouseLeave={() => (rx.set(0), ry.set(0))}>
      <motion.div style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }} className="h-full">
        {children}
      </motion.div>
    </div>
  )
}

/** Élément attiré par le curseur. */
export function Magnetic({ children, className, strength = 0.35 }: { children: ReactNode; className?: string; strength?: number }) {
  const x = useSpring(0, { stiffness: 220, damping: 16, mass: 0.4 })
  const y = useSpring(0, { stiffness: 220, damping: 16, mass: 0.4 })
  return (
    <motion.div
      className={cn('inline-block', className)}
      style={{ x, y }}
      onMouseMove={(e) => {
        if (isTouch()) return
        const r = e.currentTarget.getBoundingClientRect()
        x.set((e.clientX - (r.left + r.width / 2)) * strength)
        y.set((e.clientY - (r.top + r.height / 2)) * strength)
      }}
      onMouseLeave={() => (x.set(0), y.set(0))}
    >
      {children}
    </motion.div>
  )
}

/** Bande défilante infinie. */
export function Marquee({ children, className, duration = 40, reverse }: { children: ReactNode; className?: string; duration?: number; reverse?: boolean }) {
  return (
    <div className={cn('group/mq flex overflow-hidden mask-fade-x', className)}>
      <div
        className="flex shrink-0 animate-marquee items-center group-hover/mq:[animation-play-state:paused]"
        style={{ '--marquee-duration': `${duration}s`, animationDirection: reverse ? 'reverse' : 'normal' } as CSSProperties}
      >
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  )
}

/** Chiffre qui compte jusqu'à sa valeur quand il apparaît. */
export function CountUp({ value, decimals = 0, suffix = '', className }: { value: number; decimals?: number; suffix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' })
  const reduce = useReducedMotion()
  const mv = useMotionValue(0)
  const [txt, setTxt] = useState(() => format(reduce ? value : 0, decimals))
  useEffect(() => {
    if (!inView) return
    if (reduce) return setTxt(format(value, decimals))
    const c = animate(mv, value, { duration: 2.2, ease: [0.16, 1, 0.3, 1] })
    const un = mv.on('change', (v) => setTxt(format(v, decimals)))
    return () => (c.stop(), un())
  }, [inView, value, decimals, reduce, mv])
  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      {txt}
      {suffix}
    </span>
  )
}
const format = (v: number, d: number) => v.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d })

/** Bordure lumineuse qui tourne autour d'une carte. */
export function BorderBeam({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] p-[1.5px]',
        '[mask:linear-gradient(#000_0_0)_content-box_exclude,linear-gradient(#000_0_0)]',
        className,
      )}
    >
      <div className="absolute left-1/2 top-1/2 aspect-square w-[300%] -translate-x-1/2 -translate-y-1/2 animate-spin-slow bg-[conic-gradient(from_0deg,transparent_0deg,transparent_250deg,#ffc980_290deg,#ff7a2f_320deg,#e8463a_345deg,transparent_360deg)]" />
    </div>
  )
}

/** Petit point lumineux "disponible". */
export function LiveDot({ className }: { className?: string }) {
  return (
    <span className={cn('relative inline-flex size-2', className)}>
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
      <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
    </span>
  )
}
