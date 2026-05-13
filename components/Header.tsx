'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

type Categoria = { categoria: string; libros_count: number }

export default function Header() {
  const [bibliotecaOpen, setBibliotecaOpen] = useState(false)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileCatOpen, setMobileCatOpen] = useState(false)

  useEffect(() => {
    supabase.rpc('distinct_categorias').then(({ data }) => {
      if (data) setCategorias(data as Categoria[])
    })

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      sub.subscription.unsubscribe()
    }
  }, [])

  return (
    <>
      <header className="relative grid grid-cols-[auto_1fr_auto] md:grid-cols-3 items-end px-6 md:px-10 pt-6 pb-4 z-40">
        {/* LOGO */}
        <a href="/" className="block justify-self-start">
          <img
            src="/logolight.svg"
            alt="TLACUILO"
            className="h-[clamp(50px,9vw,140px)] w-auto"
          />
        </a>

        {/* TECAS — centro (solo desktop) */}
        <nav className="justify-self-center hidden md:flex items-end font-sonoran uppercase tracking-wider text-[#9091c4] text-[clamp(14px,1.3vw,22px)] gap-7 mb-[clamp(18px,2.4vw,38px)]">
          <div
            className="relative"
            onMouseEnter={() => setBibliotecaOpen(true)}
            onMouseLeave={() => setBibliotecaOpen(false)}
          >
            <a href="/biblioteca" className="hover:opacity-100 opacity-90 transition">
              Biblioteca
            </a>

            {bibliotecaOpen && (
              <div className="absolute top-full left-0 pt-3 z-50">
                <div className="bg-neutral-100 text-black p-6 shadow-xl min-w-[600px] font-futura normal-case tracking-normal">
                  <a
                    href="/biblioteca"
                    className="block font-bold mb-4 hover:underline uppercase tracking-wide text-[clamp(11px,0.9vw,15px)]"
                  >
                    Biblioteca (todo)
                  </a>
                  <div className="grid grid-cols-3 gap-x-8 gap-y-1.5 text-[clamp(10px,0.85vw,13px)]">
                    {categorias.map((c) => (
                      <a
                        key={c.categoria}
                        href={'/biblioteca?categoria=' + encodeURIComponent(c.categoria)}
                        className="block hover:underline opacity-80 hover:opacity-100"
                      >
                        {c.categoria} <span className="opacity-50">({c.libros_count})</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <a href="#" className="opacity-90 hover:opacity-100 transition">Artoteca</a>
          <a href="#" className="opacity-90 hover:opacity-100 transition">Fonoteca</a>
          <a href="#" className="opacity-90 hover:opacity-100 transition">Editorial</a>
        </nav>

        {/* AUTH — derecha (solo desktop) */}
        <div className="justify-self-end hidden md:flex items-end font-sonoran uppercase tracking-wider text-[#9091c4] text-[clamp(14px,1.3vw,22px)] mb-[clamp(18px,2.4vw,38px)]">
          {user ? (
            <a href="/mi-tlacuilo" className="opacity-90 hover:opacity-100 transition">
              Mi Tlacuilo
            </a>
          ) : (
            <a href="/login" className="opacity-90 hover:opacity-100 transition">
              Entrar
            </a>
          )}
        </div>

        {/* HAMBURGER — solo mobile */}
        <button
          className="md:hidden justify-self-end self-center text-[#9091c4] p-2"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Abrir menú"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2.5"
            stroke="currentColor"
            className="w-8 h-8"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
          </svg>
        </button>
      </header>

      {/* MOBILE MENU OVERLAY */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-[#15151d] z-[100] md:hidden flex flex-col font-sonoran uppercase tracking-wider text-[#9091c4]">
          {/* Botón cerrar */}
          <div className="flex justify-end p-6">
            <button
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Cerrar menú"
              className="text-[#9091c4] p-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2.5"
                stroke="currentColor"
                className="w-8 h-8"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Menú vertical */}
          <nav className="flex-1 flex flex-col gap-6 px-10 py-4 text-2xl overflow-y-auto">
            <a
              href="/biblioteca"
              className="hover:opacity-70"
              onClick={() => setMobileMenuOpen(false)}
            >
              Biblioteca
            </a>

            {/* Categorías (expandible) */}
            <button
              onClick={() => setMobileCatOpen(!mobileCatOpen)}
              className="text-left opacity-70 text-base tracking-wide flex justify-between items-center"
            >
              <span>Categorías</span>
              <span className="text-xs">{mobileCatOpen ? '−' : '+'}</span>
            </button>
            {mobileCatOpen && (
              <div className="flex flex-col gap-2 pl-4 pb-4 font-futura normal-case tracking-normal text-sm opacity-90 max-h-[40vh] overflow-y-auto">
                {categorias.map((c) => (
                  <a
                    key={c.categoria}
                    href={'/biblioteca?categoria=' + encodeURIComponent(c.categoria)}
                    onClick={() => setMobileMenuOpen(false)}
                    className="hover:underline"
                  >
                    {c.categoria}{' '}
                    <span className="opacity-50">({c.libros_count})</span>
                  </a>
                ))}
              </div>
            )}

            <a href="#" className="hover:opacity-70" onClick={() => setMobileMenuOpen(false)}>
              Artoteca
            </a>
            <a href="#" className="hover:opacity-70" onClick={() => setMobileMenuOpen(false)}>
              Fonoteca
            </a>
            <a href="#" className="hover:opacity-70" onClick={() => setMobileMenuOpen(false)}>
              Editorial
            </a>

            <div className="border-t border-[#9091c4]/20 pt-6 mt-4">
              {user ? (
                <a
                  href="/mi-tlacuilo"
                  className="hover:opacity-70"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Mi Tlacuilo
                </a>
              ) : (
                <a
                  href="/login"
                  className="hover:opacity-70"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Entrar
                </a>
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  )
}
