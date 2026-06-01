import { supabase } from '@/lib/supabase'
import TecaLayout from '@/components/TecaLayout'
import Cover from '@/components/Cover'
import PageSelector from '@/components/PageSelector'
import QuickMorralButton from '@/components/QuickMorralButton'
import AdminEditButton from '@/components/AdminEditButton'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 27

type Categoria = { categoria: string; libros_count: number }

async function getCategorias(): Promise<Categoria[]> {
  // Por ahora reusa el RPC distinct_categorias (mismo agregador).
  // Si después quieres que videoteca tenga su propio set de categorías,
  // creamos otro RPC distinct_categorias_videoteca.
  const { data, error } = await supabase.rpc('distinct_categorias')
  if (error || !data) return []
  return data as Categoria[]
}

export default async function VideotecaPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; categoria?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1)
  const categoria = params.categoria
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('libros')
    .select('id, titulo, autor, anio, portada_url, disponible, isbn, formato', { count: 'exact' })
    .eq('teca', 'videoteca')
    .order('has_portada', { ascending: false, nullsFirst: false })
    .order('titulo', { ascending: true, nullsFirst: false })
    .range(from, to)

  if (categoria) {
    query = query.contains('categorias', [categoria])
  }

  const [{ data: items, count, error }, categorias] = await Promise.all([
    query,
    getCategorias(),
  ])

  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const hasPrev = page > 1
  const hasNext = page < totalPages

  const buildUrl = (p: number) => {
    const sp = new URLSearchParams()
    sp.set('page', String(p))
    if (categoria) sp.set('categoria', categoria)
    return '/videoteca?' + sp.toString()
  }

  return (
    <TecaLayout initialCategorias={categorias}>
      <section className="px-8 pt-6 pb-6 max-w-7xl mx-auto uppercase tracking-wide opacity-70 text-[clamp(10px,0.8vw,13px)] font-mono">
        videoteca · {categoria ? categoria + ' · ' : ''}
        Página {page} de {totalPages} · {total.toLocaleString('es-MX')} {total === 1 ? 'item' : 'items'}
      </section>

      <section className="px-8 pb-12 max-w-7xl mx-auto">
        {error ? (
          <pre className="bg-bg-soft p-4 text-xs">{JSON.stringify(error, null, 2)}</pre>
        ) : items && items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
            {items.map((item) => (
              <article key={item.id} className="flex gap-5 items-start opacity-95 hover:opacity-100 transition relative group">
                {/* Botón editar solo para admins */}
                <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <AdminEditButton libroId={item.id} />
                </div>

                <a href={'/biblioteca/' + item.id} className="w-[clamp(96px,14vw,200px)] flex-shrink-0 block">
                  <div className="aspect-[2/3] bg-bg-soft flex items-center justify-center text-text-dim p-2 text-center overflow-hidden text-[clamp(9px,0.85vw,13px)]">
                    <Cover
                      titulo={item.titulo}
                      portada_url={item.portada_url}
                      isbn={item.isbn}
                      autor={item.autor}
                    />
                  </div>
                </a>

                <div className="flex flex-col flex-1 min-w-0 text-[clamp(11px,0.95vw,15px)]">
                  <a href={'/biblioteca/' + item.id}>
                    <h2 className="font-semibold leading-tight mb-1 text-[clamp(13px,1.1vw,17px)]">
                      {item.titulo}
                    </h2>
                  </a>
                  <p className="opacity-80 leading-tight">{item.autor ?? '—'}</p>
                  <p className="opacity-60">
                    {item.anio ?? ''}
                    {item.formato && <span className="ml-2 font-micro uppercase tracking-wider text-[10px]">· {item.formato}</span>}
                  </p>
                  <span
                    className={`mt-2 rounded-full w-[clamp(8px,0.7vw,14px)] h-[clamp(8px,0.7vw,14px)] ${
                      item.disponible ? 'bg-available' : 'bg-loan'
                    }`}
                    title={item.disponible ? 'Disponible' : 'En préstamo'}
                  />
                  {item.disponible && <QuickMorralButton libroId={item.id} />}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="border border-rule p-10 text-center">
            <p className="font-mono text-sm text-text-dim mb-3 lowercase">
              sin items en videoteca todavía.
            </p>
            <p className="font-mono text-[11px] text-text-faint lowercase">
              los admins pueden agregar VHS, DVD, Blu-ray, 16mm desde /admin/libros.
            </p>
          </div>
        )}
      </section>

      {totalPages > 1 && (
        <section className="px-8 pb-16 max-w-7xl mx-auto flex justify-between items-center uppercase tracking-wide text-[clamp(11px,0.95vw,15px)] gap-4 flex-wrap">
          {hasPrev ? (
            <a href={buildUrl(page - 1)} className="hover:underline">
              ← Página anterior
            </a>
          ) : (
            <span className="opacity-30">← Página anterior</span>
          )}

          <PageSelector currentPage={page} totalPages={totalPages} categoria={categoria} />

          {hasNext ? (
            <a href={buildUrl(page + 1)} className="hover:underline">
              Página siguiente →
            </a>
          ) : (
            <span className="opacity-30">Página siguiente →</span>
          )}
        </section>
      )}
    </TecaLayout>
  )
}
