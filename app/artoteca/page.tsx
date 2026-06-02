import { supabase } from '@/lib/supabase'
import TecaLayout from '@/components/TecaLayout'
import ArtCover from '@/components/ArtCover'
import PageSelector from '@/components/PageSelector'
import QuickMorralButton from '@/components/QuickMorralButton'
import AdminEditButton from '@/components/AdminEditButton'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 27

type Artista = { artista: string; libros_count: number }

async function getArtistas(): Promise<Artista[]> {
  const { data, error } = await supabase.rpc('distinct_artistas_artoteca')
  if (error || !data) return []
  return data as Artista[]
}

export default async function ArtotecaPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; artista?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1)
  const artistaParam = params.artista
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('libros')
    .select('id, titulo, autor, anio, portada_url, disponible, isbn, formato, descripcion', { count: 'exact' })
    .eq('teca', 'artoteca')
    .order('has_portada', { ascending: false, nullsFirst: false })
    .order('autor', { ascending: true, nullsFirst: false })
    .order('anio', { ascending: true, nullsFirst: false })
    .order('titulo', { ascending: true, nullsFirst: false })
    .range(from, to)

  if (artistaParam) {
    if (artistaParam === 'Anónimo') {
      query = query.is('autor', null)
    } else {
      query = query.eq('autor', artistaParam)
    }
  }

  const [{ data: items, count, error }, artistas] = await Promise.all([
    query,
    getArtistas(),
  ])

  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const hasPrev = page > 1
  const hasNext = page < totalPages

  const buildUrl = (p: number) => {
    const sp = new URLSearchParams()
    sp.set('page', String(p))
    if (artistaParam) sp.set('artista', artistaParam)
    return '/artoteca?' + sp.toString()
  }

  return (
    <TecaLayout initialArtistas={artistas}>
      <section className="px-8 pt-6 pb-6 max-w-7xl mx-auto uppercase tracking-wide opacity-70 text-[clamp(10px,0.8vw,13px)] font-mono">
        artoteca · {artistaParam ? artistaParam + ' · ' : ''}
        Página {page} de {totalPages} · {total.toLocaleString('es-MX')} {total === 1 ? 'pieza' : 'piezas'}
      </section>

      <section className="px-8 pb-12 max-w-7xl mx-auto">
        {error ? (
          <pre className="bg-bg-soft p-4 text-xs">{JSON.stringify(error, null, 2)}</pre>
        ) : items && items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
            {items.map((item) => (
              <article key={item.id} className="flex gap-5 items-start opacity-95 hover:opacity-100 transition relative">
                <div className="absolute top-0 right-0 z-10">
                  <AdminEditButton libroId={item.id} />
                </div>

                <a href={'/biblioteca/' + item.id} className="w-[clamp(96px,14vw,200px)] flex-shrink-0 block self-start">
                  <ArtCover titulo={item.titulo} portada_url={item.portada_url} />
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
                  {item.descripcion && (
                    <p className="opacity-50 text-[clamp(10px,0.8vw,12px)] mt-1 line-clamp-2">
                      {item.descripcion}
                    </p>
                  )}
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
              sin piezas en artoteca todavía.
            </p>
          </div>
        )}
      </section>

      {totalPages > 1 && (
        <section className="px-8 pb-8 max-w-7xl mx-auto flex justify-between items-center uppercase tracking-wide text-[clamp(11px,0.95vw,15px)] gap-4 flex-wrap">
          {hasPrev ? (
            <a href={buildUrl(page - 1)} className="hover:underline">
              ← Página anterior
            </a>
          ) : (
            <span className="opacity-30">← Página anterior</span>
          )}

          <PageSelector currentPage={page} totalPages={totalPages} basePath="/artoteca" filterParam="artista" filterValue={artistaParam} />

          {hasNext ? (
            <a href={buildUrl(page + 1)} className="hover:underline">
              Página siguiente →
            </a>
          ) : (
            <span className="opacity-30">Página siguiente →</span>
          )}
        </section>
      )}

      {/* ============ ATRIBUCIÓN MACG ============ */}
      <section className="px-8 pb-16 max-w-7xl mx-auto border-t border-rule pt-6">
        <p className="font-micro text-[10px] uppercase tracking-[0.08em] text-text-dim">
          Catálogo de obra basado en la colección Artoteca Tlacuilo MACG. Donación inicial de Pedro Reyes en 2021,
          incrementada por la generosidad de otrxs artistas. Más información en{' '}
          <a href="https://museodeartecarrillogil.inba.gob.mx/artoteca-tlacuilo-macg/" target="_blank" rel="noreferrer" className="underline hover:text-text">
            museo de arte carrillo gil
          </a>.
        </p>
      </section>
    </TecaLayout>
  )
}
