'use client'

import { useEffect, useState } from 'react'

type Mode = 'light' | 'dark'

/**
 * Toggle entre modo claro y oscuro.
 * - Lee preferencia inicial de localStorage o de prefers-color-scheme.
 * - Toggle agrega/quita .light-mode al body.
 * - Persiste elección en localStorage como 'tl-mode'.
 */
export default function ThemeToggle({ className }: { className?: string }) {
  const [mode, setMode] = useState<Mode>('dark')
  const [mounted, setMounted] = useState(false)

  // Helper: aplica la clase al body. Declarado ANTES del useEffect
  // para evitar warning de React 19 sobre uso antes de declarar.
  const applyMode = (m: Mode) => {
    if (m === 'light') {
      document.body.classList.add('light-mode')
    } else {
      document.body.classList.remove('light-mode')
    }
  }

  // Lee preferencia inicial al montar
  useEffect(() => {
    const saved = localStorage.getItem('tl-mode') as Mode | null
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches
    const initial: Mode = saved ?? (prefersLight ? 'light' : 'dark')
    applyMode(initial)
    setMode(initial)
    setMounted(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggle = () => {
    const next: Mode = mode === 'light' ? 'dark' : 'light'
    applyMode(next)
    setMode(next)
    try {
      localStorage.setItem('tl-mode', next)
    } catch {
      // localStorage puede fallar en privado/iframe, ignoramos
    }
  }

  // Evita flicker durante SSR/hidratación
  if (!mounted) {
    return (
      <span
        aria-hidden="true"
        className={className}
        style={{ display: 'inline-block', width: 22, height: 22 }}
      />
    )
  }

  return (
    <button
      onClick={toggle}
      aria-label={mode === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
      className={`text-text hover:text-text-bright transition-colors inline-flex items-center cursor-pointer ${className ?? ''}`}
    >
      {mode === 'light' ? (
        // Moon (en light mode mostramos la luna porque clic → modo oscuro)
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.6"
          stroke="currentColor"
          className="w-[clamp(17px,1.5vw,22px)] h-[clamp(17px,1.5vw,22px)]"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
          />
        </svg>
      ) : (
        // Sun (en dark mode mostramos el sol porque clic → modo claro)
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.6"
          stroke="currentColor"
          className="w-[clamp(17px,1.5vw,22px)] h-[clamp(17px,1.5vw,22px)]"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
          />
        </svg>
      )}
    </button>
  )
}
