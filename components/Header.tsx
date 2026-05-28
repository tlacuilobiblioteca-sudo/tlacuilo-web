'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import ThemeToggle from './ThemeToggle'

/**
 * Header de Tlacuilo · 2 bandas
 *
 * BANDA 1 (top): logo + search bar input + MI TLACUILO + ThemeToggle
 * BANDA 2 (nav, periwinkle bg): 6 categorías centradas
 *   BIBLIOTECA / ARTOTECA / FONOTECA / MANIFESTO / CALENDARIO / EDITORIAL
 */
export default function Header() {
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

  const navLinkClass =
    'font-mono text-[clamp(11px,1.05vw,14px)] tracking-[0.12em] uppercase text-tinta hover:opacity-60 transition-opacity'

  return (
    <header className="sticky top-0 z-50 bg-bg">
      {/* ============ BANDA 1 · LOGO + SEARCH + PERFIL + LUNA ============ */}
      <div className="flex items-center justify-between gap-6 px-10 py-5 max-md:flex-col max-md:items-start max-md:gap-4 max-md:px-5">
        <Link href="/" className="block shrink-0" aria-label="Inicio">
          <img
            src="/TLACUILOLOGONEGRO.svg"
            alt="tlacuilo"
            className="block h-[clamp(26px,2.8vw,40px)] w-auto"
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
          <Link href={miTlacuiloHref} className="font-mono text-[clamp(11px,1.05vw,14px)] tracking-[0.12em] uppercase text-text hover:text-text-bright transition-colors">
            MI TLACUILO
          </Link>
          <ThemeToggle />
        </div>
      </div>

      {/* ============ BANDA 2 · 6 CATEGORÍAS CENTRADAS (periwinkle bg) ============ */}
      <nav className="bg-periwinkle border-y border-tinta py-3 px-10 max-md:px-5">
        <div className="flex flex-wrap items-center justify-center gap-x-[clamp(20px,3.5vw,56px)] gap-y-2">
          <Link href="/biblioteca" className={navLinkClass}>BIBLIOTECA</Link>
          <a href="#" className={navLinkClass}>ARTOTECA</a>
          <a href="#" className={navLinkClass}>FONOTECA</a>
          <Link href="/manifesto" className={navLinkClass}>MANIFESTO</Link>
          <Link href="/calendario" className={navLinkClass}>CALENDARIO</Link>
          <a href="#" className={navLinkClass}>EDITORIAL</a>
        </div>
      </nav>
    </header>
  )
}
