'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthLink from './AuthLink'
import ThemeToggle from './ThemeToggle'

type Categoria = { categoria: string; libros_count: number }

const TECAS = [
  { slug: 'biblioteca', label: 'Biblioteca', href: '/biblioteca', enabled: true },
  { slug: 'artoteca', label: 'Artoteca', href: '#', enabled: false },
  { slug: 'fonoteca', label: 'Fonoteca', href: '#', enabled: false },
  { slug: 'editorial', label: 'Editorial', href: '#', enabled: false },
] as const

/**
 * Layout para páginas interiores (todas las que no son el landing).
 * - Slim header arriba (logo + lupita + Mi Tlacuilo)
 * - Sidebar izquierdo (todas las tecas + categorías de Biblioteca expandidas)
 * - Children en el área principal
 *
 * Mobile (<880px): sidebar se vuelve menú hamburguesa.
 */
export default function TecaLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [navOpen, setNavOpen] = useState(false)
  const [categoriasOpen, setCategoriasOpen] = useState(false)

  // Cargar categorías una vez
  useEffect(() => {
    supabase.rpc('distinct_categorias').then(({ data }) => {
      if (data) setCategorias(data as Categoria[])
    })
  }, [])

  // ¿Qué teca está activa?
  const activeTeca = TECAS.find((t) => pathname?.startsWith(t.href) && t.enabled)?.slug ?? null
  const activeCategoria = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('categoria')
    : null

  return (
    <div className="min-h-screen bg-bg text-text">
      {/* ============ SLIM HEADER ============ */}
      <header className="relative z-50 flex items-center justify-between gap-4 px-6 md:px-10 pt-5 pb-3 border-b border-rule">
        <a href="/" className="block relative h-[clamp(40px,5vw,72px)] w-[clamp(35px,4.5vw,64px)]">
          <img
            src="/logodark.svg"
            alt="tlacuilo"
            className="logo-dark absolute inset-0 h-full w-full object-contain"
          />
          <img
            src="/logolight.svg"
            alt="tlacuilo"
            className="logo-light absolute inset-0 h-full w-full object-contain"
            aria-hidden="true"
          />
        </a>

        <div className="flex items-center gap-5 md:gap-8 font-sonoran font-black uppercase text-text text-[clamp(11px,1.1vw,15px)] tracking-[0.16em]">
          <a
            href="/buscar"
            aria-label="Buscar"
            className="hover:text-text-bright transition-colors inline-flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-[clamp(18px,1.6vw,24px)] h-[clamp(18px,1.6vw,24px)]">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </a>
          <ThemeToggle />
          <AuthLink className="hover:text-text-bright transition-colors" />
          {/* Hamburger solo mobile */}
          <button
            onClick={() => setNavOpen(true)}
            aria-label="Abrir menú"
            className="md:hidden text-text hover:text-text-bright p-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-7 h-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
            </svg>
          </button>
        </div>
      </header>

      {/* ============ LAYOUT GRID: sidebar fija + main ============ */}
      <div className="flex">
        {/* SIDEBAR DESKTOP — permanente */}
        <aside className="hidden md:block w-[240px] lg:w-[280px] shrink-0 border-r border-rule p-6 sticky top-0 self-start max-h-screen overflow-y-auto">
          <SidebarContent
            categorias={categorias}
            activeTeca={activeTeca}
            activeCategoria={activeCategoria}
            categoriasOpen={categoriasOpen}
            onToggleCategorias={() => setCategoriasOpen(!categoriasOpen)}
          />
        </aside>

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
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] opacity-60">
                &gt; menú
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
                categoriasOpen={categoriasOpen}
                onToggleCategorias={() => setCategoriasOpen(!categoriasOpen)}
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
   ============================================================ */

function SidebarContent({
  categorias,
  activeTeca,
  activeCategoria,
  categoriasOpen,
  onToggleCategorias,
  onLinkClick,
}: {
  categorias: Categoria[]
  activeTeca: string | null
  activeCategoria: string | null
  categoriasOpen: boolean
  onToggleCategorias: () => void
  onLinkClick?: () => void
}) {
  return (
    <nav className="flex flex-col gap-8">
      {TECAS.map((teca) => {
        const isActive = teca.slug === activeTeca
        const hasSub = teca.slug === 'biblioteca' && categorias.length > 0

        return (
          <div key={teca.slug}>
            {teca.enabled ? (
              <div className="flex items-center justify-between gap-2">
                <a
                  href={teca.href}
                  onClick={onLinkClick}
                  className={`font-sonoran font-black uppercase tracking-[0.16em] text-[clamp(14px,1.2vw,18px)] block transition-colors flex-1 ${
                    isActive ? 'text-text-bright' : 'text-text hover:text-text-bright'
                  }`}
                >
                  {teca.label}
                </a>
                {hasSub && (
                  <button
                    onClick={onToggleCategorias}
                    aria-label={categoriasOpen ? 'colapsar categorías' : 'expandir categorías'}
                    className="text-text-dim hover:text-text-bright transition-colors p-1 font-mono text-sm"
                  >
                    {categoriasOpen ? '▾' : '▸'}
                  </button>
                )}
              </div>
            ) : (
              <span className="font-sonoran font-black uppercase tracking-[0.16em] text-[clamp(14px,1.2vw,18px)] block text-text-faint cursor-not-allowed">
                {teca.label} <span className="text-[10px] tracking-normal ml-1">próx.</span>
              </span>
            )}

            {/* Sub-categorías solo de Biblioteca, colapsables */}
            {hasSub && categoriasOpen && (
              <ul className="mt-3 flex flex-col gap-1.5 font-sans text-[13px] pl-1">
                <li>
                  <a
                    href="/biblioteca"
                    onClick={onLinkClick}
                    className={`hover:text-text-bright transition-colors ${
                      !activeCategoria && activeTeca === 'biblioteca'
                        ? 'text-text-bright'
                        : 'text-text-dim'
                    }`}
                  >
                    todo el catálogo
                  </a>
                </li>
                {categorias.map((c) => (
                  <li key={c.categoria}>
                    <a
                      href={`/biblioteca?categoria=${encodeURIComponent(c.categoria)}`}
                      onClick={onLinkClick}
                      className={`hover:text-text-bright transition-colors ${
                        activeCategoria === c.categoria
                          ? 'text-text-bright'
                          : 'text-text-dim'
                      }`}
                    >
                      {c.categoria}{' '}
                      <span className="opacity-50 text-[11px]">({c.libros_count})</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      })}
    </nav>
  )
}
