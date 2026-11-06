import type { AnchorHTMLAttributes, ReactNode, SVGProps } from 'react'
import { cn } from '../../lib/cn'
import { Magnetic } from './Fx'

export function WhatsAppIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.32l-.34-.2-3.57.94.95-3.48-.22-.36a9.4 9.4 0 0 1-1.45-5.02c0-5.2 4.24-9.44 9.45-9.44 2.52 0 4.9.99 6.68 2.77a9.37 9.37 0 0 1 2.76 6.68c0 5.2-4.24 9.43-9.45 9.43m8.04-17.47A11.3 11.3 0 0 0 12.05.7C5.78.7.68 5.8.68 12.06c0 2 .52 3.96 1.52 5.68L.58 23.62l6.02-1.58a11.3 11.3 0 0 0 5.44 1.39h.01c6.26 0 11.36-5.1 11.37-11.37 0-3.03-1.18-5.89-3.33-8.03" />
    </svg>
  )
}

export function TikTokIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M19.6 6.7a4.8 4.8 0 0 1-3.8-4.2V2h-3.4v13.6a2.9 2.9 0 1 1-2-2.7V9.4a6.3 6.3 0 1 0 5.4 6.2V8.7a8.2 8.2 0 0 0 4.8 1.5V6.8a4.8 4.8 0 0 1-1-.1" />
    </svg>
  )
}

type BtnProps = AnchorHTMLAttributes<HTMLAnchorElement> & { children: ReactNode; magnetic?: boolean }

/** Bouton principal : fond clair, reflet qui passe au survol. */
export function PrimaryButton({ children, className, magnetic = true, ...rest }: BtnProps) {
  const btn = (
    <a
      {...rest}
      className={cn(
        'group/btn relative inline-flex h-12 items-center gap-2.5 overflow-hidden rounded-full bg-ink px-6 text-[15px] font-medium text-night',
        'shadow-[0_10px_40px_-10px_rgb(255_122_47/0.55),inset_0_-2px_0_rgb(0_0_0/0.12)] transition-transform duration-300 active:scale-[0.97]',
        className,
      )}
    >
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-[linear-gradient(110deg,transparent_25%,rgb(255_190_120/0.55)_50%,transparent_75%)] transition-transform duration-700 ease-out group-hover/btn:translate-x-full" />
      <span className="relative inline-flex items-center gap-2.5">{children}</span>
    </a>
  )
  return magnetic ? <Magnetic>{btn}</Magnetic> : btn
}

/** Bouton secondaire : contour en verre. */
export function GhostButton({ children, className, magnetic = true, ...rest }: BtnProps) {
  const btn = (
    <a
      {...rest}
      className={cn(
        'group/btn inline-flex h-12 items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.04] px-6 text-[15px] font-medium text-ink backdrop-blur-md',
        'transition-[background-color,border-color,transform] duration-300 hover:border-white/30 hover:bg-white/[0.09] active:scale-[0.97]',
        className,
      )}
    >
      {children}
    </a>
  )
  return magnetic ? <Magnetic>{btn}</Magnetic> : btn
}
