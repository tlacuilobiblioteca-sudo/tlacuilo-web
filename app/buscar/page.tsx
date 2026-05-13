import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import Cover from '@/components/Cover'

export const dynamic = 'force-dynamic'

type Libro = {
  id: string
  titulo: string
  autor: string | null
  anio: number | null
  portada_url: string | null
  disponible: boolean
  isbn: string | null
}

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const params = await searchParams
  const query = (params.q ?? '').trim()

  let libros: Libro[] = []
  let errorMsg: string | null = null

  if (query) {
    const { data, error } = await supabase.rpc('search_libros', { q: query })
    if (error) {
      errorMsg = error.message
    } else {
      libros = (data as Libro[]) ?? []
    }
  }

  return (
    <main className="min-h-screen bg-[#9794C4] text-black font-sans">
      <Header />

      <section className="px-8 pt-2 pb-6 max-w-7xl mx-auto">
        <form action="/buscar" method="GET" className="flex gap-3 items-center">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Busca por título, autor, categoría o etiqueta..."
            className="flex-1 bg-black/10 px-5 py-3 outline-none focus:bg-black/15 text-[clamp(13px,1.1vw,17px)] placeholder:opacity-50"
            autoFocus
          />
          <button
            type="submit"
            className="bg-black text-white px-6 py-3 uppercase tracking-wide hover:bg-black/80 transition text-[clamp(11px,0.9vw,14px)]"
          >
            Buscar
          </button>
        </form>

        {query && (
          <p className="mt-4 uppercase tracking-wide opacity-70 text-[clamp(10px,0.8vw,13px)]">
            {errorMsg
              ? 'Error: ' + errorMsg
              : libros.length + ' resultado' + (libros.length === 1 ? '' : 's') + ' para "' + query + '"'}
          </p>
        )}
      </section>

      {query && !errorMsg && libros.length > 0 && (
        <section className="px-8 pb-12 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
            {libros.map((libro) => (
              <a
                key={libro.id}
                href={'/biblioteca/' + libro.id}
                className="flex gap-5 items-start opacity-95 hover:opacity-100 transition"
              >
                <div className="w-[clamp(96px,14vw,200px)] flex-shrink-0">
                  <div className="aspect-[2/3] bg-black/15 flex items-center justify-center text-black/40 p-2 text-center overflow-hidden text-[clamp(9px,0.85vw,13px)]">
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
                      libro.disponible ? 'bg-green-700' : 'bg-orange-500'
                    }`}
                    title={libro.disponible ? 'Disponible' : 'En préstamo'}
                  />
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {query && !errorMsg && libros.length === 0 && (
        <section className="px-8 pb-12 max-w-7xl mx-auto">
          <p className="text-[clamp(13px,1.1vw,17px)] opacity-70">
            No encontramos libros que coincidan con &ldquo;{query}&rdquo;. Prueba con otra palabra o nombre.
          </p>
        </section>
      )}

      {!query && (
        <section className="px-8 pb-12 max-w-7xl mx-auto">
          <p className="text-[clamp(13px,1.1vw,17px)] opacity-70">
            Busca libros por título, autor, categoría o etiqueta.
          </p>
        </section>
      )}
    </main>
  )
}
