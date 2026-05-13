'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

type Categoria = { categoria: string; libros_count: number }

export default function Header() {
  const [bibliotecaOpen, setBibliotecaOpen] = useState(false)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [user, setUser] = useState<User | null>(null)

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
    <header className="relative grid grid-cols-3 items-end px-10 pt-6 pb-4 z-40">
      {/* LOGO — izquierda */}
      <a href="/" className="block justify-self-start">
        <img
          src="/logolight.svg"
          alt="TLACUILO"
          className="h-[clamp(70px,9vw,140px)] w-auto"
        />
      </a>

      {/* TECAS — centro */}
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

      {/* AUTH — derecha */}
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
    </header>
  )
}
