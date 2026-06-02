'use client'

import { useState } from 'react'

type Props = {
  currentPage: number
  totalPages: number
  /** Valor del filtro activo (categoría/década/artista). */
  filterValue?: string
  /** Nombre del query param para el filtro. Default 'categoria'. */
  filterParam?: string
  /** Base path de la página (sin query string). Default '/biblioteca'. */
  basePath?: string
  /** @deprecated usar filterValue. Se mantiene para compat. */
  categoria?: string
}

export default function PageSelector({
  currentPage,
  totalPages,
  filterValue,
  filterParam = 'categoria',
  basePath = '/biblioteca',
  categoria,
}: Props) {
  const [open, setOpen] = useState(false)

  // Compat: si vino categoria sin filterValue, úsala
  const effectiveFilter = filterValue ?? categoria

  const buildUrl = (p: number) => {
    const sp = new URLSearchParams()
    sp.set('page', String(p))
    if (effectiveFilter) sp.set(filterParam, effectiveFilter)
    return basePath + '?' + sp.toString()
  }

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="opacity-70 hover:opacity-100 uppercase tracking-wide hover:underline cursor-pointer"
      >
        {currentPage} / {totalPages}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50">
            <div className="bg-[#7C7AB0] text-black p-5 shadow-lg max-h-[60vh] overflow-y-auto min-w-[400px]">
              <div className="grid grid-cols-10 gap-x-4 gap-y-2 text-[clamp(10px,0.85vw,13px)] tracking-normal normal-case">
                {pages.map((p) => (
                  <a
                    key={p}
                    href={buildUrl(p)}
                    className={p === currentPage ? 'text-center font-bold hover:underline' : 'text-center opacity-80 hover:opacity-100 hover:underline'}
                    onClick={() => setOpen(false)}
                  >
                    {p}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
