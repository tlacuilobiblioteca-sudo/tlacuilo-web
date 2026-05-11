import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 54

export default async function BibliotecaPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1)
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { data: libros, count, error } = await supabase
    .from('libros')
    .select('id, titulo, autor, anio, portada_url, disponible', { count: 'exact' })
    .order('autor', { ascending: true, nullsFirst: false })
    .range(from, to)

  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const hasPrev = page > 1
  const hasNext = page < totalPages

  return (
    <main className="min-h-screen bg-[#9794C4] text-black font-sans">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6">
        <a href="/">
          <img
            src="/logo.png"
            alt="TLACUILO"
            className="h-[clamp(28px,3vw,48px)] w-auto"
          />
        </a>
        <nav className="hidden md:flex gap-8 uppercase tracking-wide text-[clamp(11px,0.9vw,15px)]">
          <a href="/biblioteca" className="font-bold">Biblioteca</a>
          <a href="#" className="hover:underline">Artoteca</a>
          <a href="#" className="hover:underline">Fonoteca</a>
          <a href="#" className="hover:underline">Editorial Tlacuilo</a>
        </nav>
        <div className="hidden md:flex gap-6 uppercase tracking-wide text-[clamp(11px,0.9vw,15px)]">
          <a href="#" className="hover:underline">Iniciar sesión</a>
          <a href="#" className="hover:underline">Crear cuenta</a>
        </div>
      </header>

      {/* Counter */}
      <section className="px-8 pt-2 pb-6 max-w-7xl mx-auto uppercase tracking-wide opacity-70 text-[clamp(10px,0.8vw,13px)]">
        Página {page} de {totalPages} · {total.toLocaleString('es-MX')} libros en total
      </section>

      {/* Grid */}
      <section className="px-8 pb-12 max-w-7xl mx-auto">
        {error ? (
          <pre className="bg-black/10 p-4 text-xs">{JSON.stringify(error, null, 2)}</pre>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
            {libros?.map((libro) => (
              <article key={libro.id} className="flex gap-5 items-start">
                <div className="w-[clamp(96px,14vw,200px)] flex-shrink-0">
                  <div className="aspect-[2/3] bg-black/15 flex items-center justify-center text-black/40 p-2 text-center overflow-hidden text-[clamp(9px,0.85vw,13px)]">
                    {libro.portada_url ? (
                      <img
                        src={libro.portada_url}
                        alt={libro.titulo}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="font-serif italic leading-tight">
                        {libro.titulo}
                      </span>
                    )}
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
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Pagination */}
      <section className="px-8 pb-16 max-w-7xl mx-auto flex justify-between items-center uppercase tracking-wide text-[clamp(11px,0.95vw,15px)]">
        {hasPrev ? (
          <a href={`/biblioteca?page=${page - 1}`} className="hover:underline">
            ← Página anterior
          </a>
        ) : (
          <span className="opacity-30">← Página anterior</span>
        )}

        <span className="opacity-70">
          {page} / {totalPages}
        </span>

        {hasNext ? (
          <a href={`/biblioteca?page=${page + 1}`} className="hover:underline">
            Página siguiente →
          </a>
        ) : (
          <span className="opacity-30">Página siguiente →</span>
        )}
      </section>
    </main>
  )
}
