'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

type Categoria = { categoria: string; libros_count: number }

export default function Header() {
  const [bibliotecaOpen, setBibliotecaOpen] = useState(false)
  const [categorias, setCategorias] = useState<Categoria[]>([])

  useEffect(() => {
    supabase.rpc('distinct_categorias').then(({ data, error }) => {
      if (data) setCategorias(data as Categoria[])
      if (error) console.error('Error al cargar categorias:', error)
    })
  }, [])

  return (
    <header className="relative flex items-center justify-between px-8 py-6 z-40">
      <a href="/">
        <img
          src="/logo.png"
          alt="TLACUILO"
          className="h-[clamp(28px,3vw,48px)] w-auto"
        />
      </a>

      <nav className="hidden md:flex gap-8 uppercase tracking-wide text-[clamp(11px,0.9vw,15px)]">
        <div
          className="relative"
          onMouseEnter={() => setBibliotecaOpen(true)}
          onMouseLeave={() => setBibliotecaOpen(false)}
        >
          <a href="/biblioteca" className="hover:underline">Biblioteca</a>

          {bibliotecaOpen && (
            <div className="absolute top-full left-0 pt-3 z-50">
              <div className="bg-neutral-100 text-black p-6 shadow-xl min-w-[600px]">
                <a
                  href="/biblioteca"
                  className="block font-bold mb-4 hover:underline uppercase tracking-wide text-[clamp(11px,0.9vw,15px)]"
                >
                  Biblioteca (todo)
                </a>
                <div className="grid grid-cols-3 gap-x-8 gap-y-1.5 normal-case tracking-normal text-[clamp(10px,0.85vw,13px)]">
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

        <a href="#" className="hover:underline">Artoteca</a>
        <a href="#" className="hover:underline">Fonoteca</a>
        <a href="#" className="hover:underline">Editorial Tlacuilo</a>
      </nav>

      <div className="hidden md:flex gap-6 uppercase tracking-wide text-[clamp(11px,0.9vw,15px)]">
        <a href="#" className="hover:underline">Iniciar sesión</a>
        <a href="#" className="hover:underline">Crear cuenta</a>
      </div>
    </header>
  )
}
