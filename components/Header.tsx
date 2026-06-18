'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import ThemeToggle from './ThemeToggle'

type HeaderProps = {
  /** Si true, oculta la banda de 6 categorías. Útil para páginas interiores
      (biblioteca, buscar, etc.) que ya tienen sidebar propia. */
  slim?: boolean
}

/**
 * Header de Tlacuilo · 2 bandas (sticky)
 *
 * BANDA 1 (top): logo + search bar input + MI TLACUILO + ThemeToggle
 * BANDA 2 (nav, periwinkle bg): 6 categorías centradas
 *   BIBLIOTECA / ARTOTECA / FONOTECA / VIDEOTECA / MANIFIESTO / CALENDARIO / EDITORIAL
 *
 * Con slim=true solo se muestra BANDA 1.
 */
export default function Header({ slim = false }: HeaderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [q, setQ] = useState('')
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const miTlacuiloHref = user ? '/mi-tlacuilo' : '/login'

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = q.trim()
    if (trimmed) router.push(`/buscar?q=${encodeURIComponent(trimmed)}`)
  }

  const navLinkBase =
    'text-[clamp(11px,1.05vw,14px)] tracking-[0.12em] uppercase text-tinta hover:opacity-60 transition-opacity'
  const navLinkClass = `font-mono ${navLinkBase}`
  const tecaLinkClass = `font-costa ${navLinkBase}`

  return (
    <header className="sticky top-0 z-50 bg-bg">
      {/* ============ BANDA 1 · LOGO + SEARCH + PERFIL + LUNA ============ */}
      <div className="flex items-center justify-between gap-6 px-10 py-5 max-md:flex-col max-md:items-start max-md:gap-4 max-md:px-5">
        <Link href="/" className="block shrink-0" aria-label="Inicio">
          <span
            role="img"
            aria-label="tlacuilo"
            className="logo-wordmark h-[clamp(26px,2.8vw,40px)]"
          />
        </Link>

        <form
          onSubmit={handleSearch}
          className="flex-1 max-w-[420px] mx-auto max-md:w-full max-md:max-w-none"
          role="search"
        >
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar títulos, autores…"
            className="w-full bg-bone text-tinta border border-tinta px-4 py-2 font-micro text-[13px] tracking-[0.02em] placeholder:text-tinta/40 placeholder:italic outline-none focus:border-text-bright"
            autoComplete="off"
            aria-label="Buscar en el acervo"
          />
        </form>

        <div className="flex items-center gap-5 shrink-0">
          <Link
            href="/calendario"
            aria-label="Calendario"
            className="text-text hover:text-text-bright transition-colors inline-flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.6"
              stroke="currentColor"
              className="w-[clamp(14px,1.2vw,18px)] h-[clamp(14px,1.2vw,18px)]"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0V11.25A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
              />
            </svg>
          </Link>
          <ThemeToggle />
          <Link href={miTlacuiloHref} className="font-mono text-[clamp(11px,1.05vw,14px)] tracking-[0.12em] uppercase text-text hover:text-text-bright transition-colors">
            {user ? 'MI TLACUILO' : 'ENTRAR'}
          </Link>
        </div>
      </div>

      {/* ============ BANDA 2 · 6 CATEGORÍAS CENTRADAS (periwinkle bg) ============ */}
      {!slim && (
        <nav className="bg-periwinkle border-y border-tinta py-3 px-10 max-md:px-5">
          <div className="flex flex-wrap items-center justify-center gap-x-[clamp(20px,3.5vw,56px)] gap-y-2">
            <Link href="/biblioteca" className={tecaLinkClass}>BIBLIOTECA</Link>
            <Link href="/artoteca" className={tecaLinkClass}>ARTOTECA</Link>
            <a href="#" className={tecaLinkClass}>FONOTECA</a>
            <Link href="/videoteca" className={tecaLinkClass}>VIDEOTECA</Link>
            <Link href="/manifesto" className={tecaLinkClass}>MANIFIESTO</Link>
            <a href="#" className={tecaLinkClass}>EDITORIAL</a>
          </div>
        </nav>
      )}
    </header>
  )
}
