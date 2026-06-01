'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Header from './Header'

type Categoria = { categoria: string; libros_count: number }

const TECAS = [
  { slug: 'biblioteca', label: 'Biblioteca', href: '/biblioteca', enabled: true },
  { slug: 'artoteca', label: 'Artoteca', href: '#', enabled: false },
  { slug: 'fonoteca', label: 'Fonoteca', href: '#', enabled: false },
  { slug: 'videoteca', label: 'Videoteca', href: '/videoteca', enabled: true },
  { slug: 'editorial', label: 'Editorial', href: '#', enabled: false },
] as const

type Props = {
  children: React.ReactNode
  /** Categorías pre-fetched server-side. Si vienen, no hacemos query cliente (evita
      glitch de "sidebar tarda en abrir"). */
  initialCategorias?: Categoria[]
}

/**
 * Layout para páginas interiores (biblioteca, item detail, buscar, mi-tlacuilo, etc.)
 * - Header consistente arriba (Header slim, sin la banda de 6 categorías)
 * - Sidebar izquierdo con tecas + categorías de biblioteca (siempre abierto en desktop)
 * - Hamburguesa en mobile
 */
export default function TecaLayout({ children, initialCategorias }: Props) {
  const pathname = usePathname()
  const [categorias, setCategorias] = useState<Categoria[]>(initialCategorias ?? [])
  const [navOpen, setNavOpen] = useState(false)

  // Solo fetch en cliente si NO vienen pre-cargadas (fallback)
  useEffect(() => {
    if (initialCategorias && initialCategorias.length > 0) return
    supabase.rpc('distinct_categorias').then(({ data }) => {
      if (data) setCategorias(data as Categoria[])
    })
  }, [initialCategorias])

  const activeTeca = TECAS.find((t) => pathname?.startsWith(t.href) && t.enabled)?.slug ?? null
  const activeCategoria = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('categoria')
    : null

  return (
    <div className="min-h-screen bg-bg text-text">
      {/* ============ HEADER consistente con el landing (slim · sin banda de cats) ============ */}
      <Header slim />

      {/* ============ LAYOUT GRID: sidebar fija + main ============ */}
      <div className="flex">
        {/* SIDEBAR DESKTOP — siempre visible, carga server-side */}
        <aside className="hidden md:block w-[260px] lg:w-[280px] shrink-0 border-r border-rule p-6 sticky top-0 self-start max-h-screen overflow-y-auto">
          <SidebarContent
            categorias={categorias}
            activeTeca={activeTeca}
            activeCategoria={activeCategoria}
          />
        </aside>

        {/* HAMBURGER mobile · fuera del nav drawer para abrirlo */}
        <button
          onClick={() => setNavOpen(true)}
          aria-label="Abrir menú de categorías"
          className="md:hidden fixed bottom-5 right-5 z-40 bg-tinta text-bone border border-tinta rounded-full p-3 shadow-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
          </svg>
        </button>

        {/* MAIN */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>

      {/* ============ MOBILE DRAWER ============ */}
      {navOpen && (
        <>
          <div
            onClick={() => setNavOpen(false)}
            className="fixed inset-0 bg-black/60 z-[90] md:hidden"
            aria-hidden="true"
          />
          <div className="fixed top-0 left-0 bottom-0 w-full bg-bg z-[100] flex flex-col overflow-y-auto md:hidden">
            <div className="flex items-center justify-between p-5 border-b border-rule">
              <span className="font-micro text-[11px] uppercase tracking-[0.12em] opacity-60">
                Categorías
              </span>
              <button
                onClick={() => setNavOpen(false)}
                aria-label="Cerrar menú"
                className="text-text p-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-7 h-7">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 p-6">
              <SidebarContent
                categorias={categorias}
                activeTeca={activeTeca}
                activeCategoria={activeCategoria}
                onLinkClick={() => setNavOpen(false)}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/* ============================================================
   SIDEBAR CONTENT (reusado en desktop y mobile)
   - Tecas como labels grandes
   - Categorías de biblioteca como CHIPS estilo landing (tinta bg, bone text,
     rounded-sm, hover dirty yellow)
   ============================================================ */

function SidebarContent({
  categorias,
  activeTeca,
  activeCategoria,
  onLinkClick,
}: {
  categorias: Categoria[]
  activeTeca: string | null
  activeCategoria: string | null
  onLinkClick?: () => void
}) {
  return (
    <nav className="flex flex-col gap-8">
      {TECAS.map((teca) => {
        const isActive = teca.slug === activeTeca
        return (
          <div key={teca.slug}>
            {teca.enabled ? (
              <Link
                href={teca.href}
                onClick={onLinkClick}
                className={`font-mono uppercase tracking-[0.12em] text-[clamp(13px,1.1vw,16px)] block transition-colors ${
                  isActive ? 'text-text-bright' : 'text-text hover:text-text-bright'
                }`}
              >
                {teca.label}
              </Link>
            ) : (
              <span className="font-mono uppercase tracking-[0.12em] text-[clamp(13px,1.1vw,16px)] block text-text-faint cursor-not-allowed">
                {teca.label} <span className="text-[10px] tracking-normal ml-1 normal-case">próx.</span>
              </span>
            )}

            {/* Categorías de Biblioteca como chips */}
            {teca.slug === 'biblioteca' && categorias.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                <Link
                  href="/biblioteca"
                  onClick={onLinkClick}
                  className={`inline-flex items-baseline gap-1.5 border border-tinta rounded-sm px-2 py-1 font-micro text-[10px] uppercase tracking-[0.06em] transition-colors ${
                    !activeCategoria && activeTeca === 'biblioteca'
                      ? 'bg-dirty text-tinta'
                      : 'bg-tinta text-bone hover:bg-dirty hover:text-tinta'
                  }`}
                >
                  todo
                </Link>
                {categorias.map((c) => {
                  const isCatActive = activeCategoria === c.categoria
                  return (
                    <Link
                      key={c.categoria}
                      href={`/biblioteca?categoria=${encodeURIComponent(c.categoria)}`}
                      onClick={onLinkClick}
                      className={`inline-flex items-baseline gap-1.5 border border-tinta rounded-sm px-2 py-1 font-micro text-[10px] uppercase tracking-[0.06em] transition-colors ${
                        isCatActive
                          ? 'bg-dirty text-tinta'
                          : 'bg-tinta text-bone hover:bg-dirty hover:text-tinta'
                      }`}
                    >
                      <span>{c.categoria}</span>
                      <span className="opacity-50 text-[9px]">{c.libros_count}</span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}
