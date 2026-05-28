'use client'

import { useEffect, useRef } from 'react'

type Props = {
  children: React.ReactNode
  className?: string
  /** Delay en ms antes de mostrar, después de entrar al viewport. */
  delay?: number
  /** Cuánto del elemento debe estar visible para disparar (0-1). Default 0.15. */
  threshold?: number
}

/**
 * Reveal — fade + translate al entrar al viewport del usuario.
 * Disparado por scroll (consecuencia de interacción del usuario),
 * no autoplay. Solo se dispara una vez por elemento.
 */
export default function Reveal({
  children,
  className = '',
  delay = 0,
  threshold = 0.15,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (delay > 0) {
              setTimeout(() => el.classList.add('in'), delay)
            } else {
              el.classList.add('in')
            }
            observer.disconnect()
          }
        })
      },
      { threshold, rootMargin: '0px 0px -10% 0px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [delay, threshold])

  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  )
}
