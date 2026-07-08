'use client'

/**
 * Riel de categorías del landing (2026-07-08).
 * Barra sticky con chips scrolleables horizontal, patrón streaming:
 * tocas una categoría y te lleva a su fila SIN recargar la página.
 * "todo" regresa al inicio del catálogo.
 */

type Cat = { categoria: string; slug: string; libros_count: number }

export default function CategoryRail({ categorias }: { categorias: Cat[] }) {
  const irA = (slug: string | null) => {
    if (!slug) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    document.getElementById(`cat-${slug}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const chip =
    'shrink-0 inline-flex items-baseline gap-1.5 bg-tinta text-bone border border-tinta rounded-sm px-2.5 py-1.5 font-micro text-[10px] uppercase tracking-[0.06em] hover:bg-brillante transition-colors cursor-pointer'

  return (
    <nav
      aria-label="Categorías del catálogo"
      className="sticky top-0 z-40 bg-bg border-b border-rule"
    >
      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto px-10 py-2.5 max-md:px-5">
        <span className="shrink-0 font-acacia uppercase text-[13px] text-text mr-1.5">
          categorías →
        </span>
        <button type="button" onClick={() => irA(null)} className={chip}>
          todo
        </button>
        {categorias.map((c) => (
          <button key={c.slug} type="button" onClick={() => irA(c.slug)} className={chip}>
            <span>{c.categoria}</span>
            <span className="opacity-50 text-[9px]">{c.libros_count}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
