'use client'

import { useEffect } from 'react'

/**
 * InfiniteLoop — al llegar al fondo del scroll, te regresa arriba;
 * al llegar arriba y seguir scrolleando hacia arriba, te baja al fondo.
 * Sin autoplay: el movimiento siempre es consecuencia del scroll del usuario.
 *
 * Decisión Marina 2026-05-25: el landing se loopea cuando llegas abajo.
 */
export default function InfiniteLoop({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    let lastScrollY = window.scrollY
    let cooldown = false

    const handleScroll = () => {
      if (cooldown) return

      const scrollY = window.scrollY
      const viewportH = window.innerHeight
      const docH = document.documentElement.scrollHeight
      const direction = scrollY > lastScrollY ? 'down' : 'up'

      // Bottom edge: scrolleando hacia abajo y casi al final.
      if (direction === 'down' && scrollY + viewportH >= docH - 2) {
        cooldown = true
        window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
        setTimeout(() => {
          cooldown = false
        }, 50)
      }
      // Top edge: scrolleando hacia arriba y estamos en 0.
      else if (direction === 'up' && scrollY <= 0) {
        cooldown = true
        window.scrollTo({ top: docH - viewportH, behavior: 'instant' as ScrollBehavior })
        setTimeout(() => {
          cooldown = false
        }, 50)
      }

      lastScrollY = window.scrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return <>{children}</>
}
