'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import ThemeToggle from './ThemeToggle'

export default function Header() {
  const [user, setUser] = useState<User | null>(null)
  const logoboxRef = useRef<HTMLSpanElement>(null)

  // Auth
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  // Glitch bursts aleatorios (4.5-7.5s) + double-burst raro cada 16-28s
  useEffect(() => {
    let singleTimeout: ReturnType<typeof setTimeout>
    let doubleTimeout: ReturnType<typeof setTimeout>

    const fireGlitch = () => {
      if (logoboxRef.current) {
        logoboxRef.current.classList.add('glitching')
        setTimeout(() => {
          logoboxRef.current?.classList.remove('glitching')
        }, 360)
      }
    }

    const scheduleSingle = () => {
      const delay = 4500 + Math.random() * 3000
      singleTimeout = setTimeout(() => {
        fireGlitch()
        scheduleSingle()
      }, delay)
    }

    const scheduleDouble = () => {
      const delay = 16000 + Math.random() * 12000
      doubleTimeout = setTimeout(() => {
        fireGlitch()
        setTimeout(fireGlitch, 380)
        scheduleDouble()
      }, delay)
    }

    const startSingle = setTimeout(scheduleSingle, 1500 + Math.random() * 2500)
    const startDouble = setTimeout(scheduleDouble, 13000)

    return () => {
      clearTimeout(singleTimeout)
      clearTimeout(doubleTimeout)
      clearTimeout(startSingle)
      clearTimeout(startDouble)
    }
  }, [])

  // Mi Tlacuilo: logueado → /mi-tlacuilo, sin sesión → /login
  const miTlacuiloHref = user ? '/mi-tlacuilo' : '/login'

  const linkClass =
    'nav-link font-sonoran font-black text-[clamp(13px,1.3vw,17px)] tracking-[0.16em] uppercase text-text hover:text-text-bright transition-colors'

  return (
    <nav className="relative z-50 flex items-center justify-between gap-8 px-14 pt-6 pb-4 max-md:flex-col max-md:items-start max-md:gap-3.5 max-md:px-5 max-md:pt-4 max-md:pb-3">
      <a href="/" className="block">
        <span
          ref={logoboxRef}
          className="logobox"
          style={{
            width: 'clamp(108px, 11vw, 168px)',
            height: 'clamp(122px, 12vw, 188px)',
          }}
        >
          <img className="ghost g1 logo-dark" src="/logodark.svg" alt="" aria-hidden="true" />
          <img className="ghost g2 logo-dark" src="/logodark.svg" alt="" aria-hidden="true" />
          <img className="main logo-dark" src="/logodark.svg" alt="tlacuilo" />
          <img className="ghost g1 logo-light" src="/logolight.svg" alt="" aria-hidden="true" />
          <img className="ghost g2 logo-light" src="/logolight.svg" alt="" aria-hidden="true" />
          <img className="main logo-light" src="/logolight.svg" alt="tlacuilo" />
        </span>
      </a>

      <div className="flex items-center flex-wrap gap-[clamp(24px,4vw,64px)] max-md:gap-3.5">
        <a href="/biblioteca" className={linkClass}>Biblioteca</a>
        <a href="#" className={linkClass}>Artoteca</a>
        <a href="#" className={linkClass}>Fonoteca</a>
        <a href="#" className={linkClass}>Editorial</a>

        {/* Separador visual entre tecas y zona del usuario */}
        <span className="inline-block w-[clamp(20px,3vw,56px)] max-md:hidden" aria-hidden="true" />

        {/* Lupita → /buscar */}
        <a
          href="/buscar"
          aria-label="Buscar"
          className="text-text hover:text-text-bright transition-colors inline-flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            className="w-[clamp(17px,1.5vw,22px)] h-[clamp(17px,1.5vw,22px)]"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
        </a>

        {/* Sol/Luna → toggle light/dark */}
        <ThemeToggle />

        <a href={miTlacuiloHref} className={linkClass}>Mi Tlacuilo</a>
      </div>
    </nav>
  )
}
