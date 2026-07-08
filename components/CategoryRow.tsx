'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Cover from './Cover'
import QuickMorralButton from './QuickMorralButton'
import AdminEditButton from './AdminEditButton'

type Libro = {
  id: string
  titulo: string
  autor: string | null
  portada_url: string | null
  isbn: string | null
  disponible: boolean | null
}

type Props = {
  categoria: string
  count: number
  /** cuántos libros por fila (default 14) */
  limit?: number
}

/**
 * Fila estilo streaming del landing v3: una categoría, scroll horizontal.
 * Lazy: solo pide sus libros a Supabase cuando la fila se acerca al viewport.
 * Si la categoría no tiene libros con portada, la fila se oculta sola.
 * Sin autoplay: el movimiento siempre viene del usuario (scroll/flechas).
 */
export default function CategoryRow({ categoria, count, limit = 14 }: Props) {
  const rootRef = useRef<HTMLElement>(null)
  const stripRef = useRef<HTMLDivElement>(null)
  const [libros, setLibros] = useState<Libro[] | null>(null)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach(async (entry) => {
          if (!entry.isIntersecting) return
          io.unobserve(el)
          const { data, error } = await supabase
            .from('libros')
            .select('id, titulo, autor, portada_url, isbn, disponible')
            .contains('categorias', [categoria])
            .not('portada_url', 'is', null)
            .order('autor', { ascending: true, nullsFirst: false })
            .order('titulo', { ascending: true, nullsFirst: false })
            .limit(limit)
          if (error || !data || data.length === 0) {
            setHidden(true)
            return
          }
          setLibros(data as Libro[])
        })
      },
      { rootMargin: '600px 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [categoria, limit])

  if (hidden) return null

  const scrollStrip = (dir: -1 | 1) => {
    const s = stripRef.current
    if (s) s.scrollBy({ left: dir * s.clientWidth * 0.85, behavior: 'smooth' })
  }

  const catHref = `/biblioteca?categoria=${encodeURIComponent(categoria)}`

  return (
    <section ref={rootRef} className="pt-8 pb-1">
      {/* Cabeza de fila */}
      <div className="flex items-baseline gap-3.5 px-10 pb-3 max-md:px-5">
        <h2 className="font-mono font-medium uppercase text-[clamp(13px,1.15vw,16px)] tracking-[0.12em] text-text">
          {categoria}
        </h2>
        <span className="font-micro text-[10px] tracking-[0.1em] accent-detail tabular-nums">
          {count.toLocaleString('es-MX')}
        </span>
        <Link
          href={catHref}
          className="ml-auto font-mono text-[11px] lowercase tracking-[0.06em] text-text-dim hover:text-text-bright hover:underline transition-colors"
        >
          ver todo →
        </Link>
      </div>

      {/* Strip horizontal */}
      <div className="group/strip relative min-h-[240px]">
        <button
          type="button"
          aria-label="anterior"
          onClick={() => scrollStrip(-1)}
          className="absolute left-0 top-0 bottom-4 z-10 w-12 flex items-center justify-center text-[22px] text-text opacity-0 group-hover/strip:opacity-80 hover:!opacity-100 transition-opacity cursor-pointer"
          style={{ background: 'linear-gradient(to right, var(--color-bg) 30%, transparent)' }}
        >
          ‹
        </button>

        <div
          ref={stripRef}
          className="no-scrollbar flex gap-4.5 overflow-x-auto px-10 pt-1 pb-4 max-md:px-5"
        >
          {libros === null
            ? Array.from({ length: 8 }, (_, i) => (
                <div
                  key={i}
                  className="shrink-0 w-[148px] max-md:w-[118px] aspect-[2/3] bg-bg-card opacity-45"
                />
              ))
            : libros.map((libro) => (
                <article
                  key={libro.id}
                  className="group relative shrink-0 w-[148px] max-md:w-[118px] flex flex-col gap-2"
                >
                  {/* Botón editar · solo visible para admins */}
                  <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <AdminEditButton libroId={libro.id} />
                  </div>

                  <Link
                    href={`/biblioteca/${libro.id}`}
                    className="aspect-[2/3] bg-bg-card flex items-center justify-center text-text-dim text-[10px] overflow-hidden p-1.5 text-center outline outline-1 outline-transparent group-hover:outline-morado group-hover:-translate-y-1 transition-[transform,outline-color] duration-200"
                  >
                    <Cover
                      titulo={libro.titulo}
                      portada_url={libro.portada_url}
                      isbn={libro.isbn}
                      autor={libro.autor}
                    />
                  </Link>

                  <Link
                    href={`/biblioteca/${libro.id}`}
                    className="font-sans font-normal text-[13.5px] leading-tight text-text hover:text-text-bright transition-colors line-clamp-2 min-h-[2.3em]"
                  >
                    {libro.titulo}
                  </Link>

                  <span className="font-sans font-light text-[12px] text-text-dim truncate min-h-[1.2em]">
                    {libro.autor ?? ''}
                  </span>

                  <div className="min-h-[1.2em]">
                    {libro.disponible && <QuickMorralButton libroId={libro.id} />}
                  </div>
                </article>
              ))}
        </div>

        <button
          type="button"
          aria-label="siguiente"
          onClick={() => scrollStrip(1)}
          className="absolute right-0 top-0 bottom-4 z-10 w-12 flex items-center justify-center text-[22px] text-text opacity-0 group-hover/strip:opacity-80 hover:!opacity-100 transition-opacity cursor-pointer"
          style={{ background: 'linear-gradient(to left, var(--color-bg) 30%, transparent)' }}
        >
          ›
        </button>
      </div>
    </section>
  )
}
