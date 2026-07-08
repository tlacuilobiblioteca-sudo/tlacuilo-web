import { supabase } from '@/lib/supabase'
import TecaLayout from '@/components/TecaLayout'
import Cover from '@/components/Cover'
import PageSelector from '@/components/PageSelector'
import QuickMorralButton from '@/components/QuickMorralButton'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 27

type Categoria = { categoria: string; libros_count: number }

async function getCategorias(): Promise<Categoria[]> {
  const { data, error } = await supabase.rpc('distinct_categorias')
  if (error || !data) return []
  return data as Categoria[]
}

export default async function BibliotecaPage({
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
    .select('id, titulo, autor, anio, portada_url, disponible, isbn', { count: 'exact' })
    .eq('teca', 'biblioteca')
    .order('has_portada', { ascending: false, nullsFirst: false })
    .order('autor_apellido', { ascending: true, nullsFirst: false })
    .order('autor', { ascending: true, nullsFirst: false })
    .order('titulo', { ascending: true, nullsFirst: false })
    .range(from, to)

  if (categoria) {
    query = query.contains('categorias', [categoria])
  }

  const [{ data: libros, count, error }, categorias] = await Promise.all([
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
    return '/biblioteca?' + sp.toString()
  }

  return (
    <TecaLayout initialCategorias={categorias}>
      <section className="px-8 pt-6 pb-6 max-w-7xl mx-auto uppercase tracking-wide opacity-70 text-[clamp(10px,0.8vw,13px)] font-mono">
        {categoria ? categoria + ' · ' : ''}
        Página {page} de {totalPages} · {total.toLocaleString('es-MX')} libros
      </section>

      <section className="px-8 pb-12 max-w-7xl mx-auto">
        {error ? (
          <pre className="bg-bg-soft p-4 text-xs">{JSON.stringify(error, null, 2)}</pre>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
            {libros?.map((libro) => (
              <a
                key={libro.id}
                href={'/biblioteca/' + libro.id}
                className="flex gap-5 items-start opacity-95 hover:opacity-100 transition"
              >
                <div className="w-[clamp(96px,14vw,200px)] flex-shrink-0">
                  <div className="aspect-[2/3] bg-bg-soft flex items-center justify-center text-text-dim p-2 text-center overflow-hidden text-[clamp(9px,0.85vw,13px)]">
                    <Cover
                      titulo={libro.titulo}
                      portada_url={libro.portada_url}
                      isbn={libro.isbn}
                      autor={libro.autor}
                    />
                  </div>
                </div>
                <div className="flex flex-col flex-1 min-w-0 text-[clamp(11px,0.95vw,15px)]">
                  <h2 className="font-semibold leading-tight mb-1 text-[clamp(13px,1.1vw,17px)]">
                    {libro.titulo}
                  </h2>
                  <p className="opacity-80 leading-tight">{libro.autor ?? '—'}</p>
                  <p className="opacity-60">{libro.anio ?? ''}</p>
                  <span
                    className={`mt-2 rounded-full w-[clamp(8px,0.7vw,14px)] h-[clamp(8px,0.7vw,14px)] ${
                      libro.disponible ? 'bg-available' : 'bg-loan'
                    }`}
                    title={libro.disponible ? 'Disponible' : 'En préstamo'}
                  />
                  {libro.disponible && <QuickMorralButton libroId={libro.id} />}
                </div>
              </a>
            ))}
          </div>
        )}
      </section>

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
    </TecaLayout>
  )
}
