import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export default async function BibliotecaPage() {
  const { data: libros, error } = await supabase
    .from('libros')
    .select('id, titulo, autor, anio, portada_url, disponible')
    .limit(12)

  return (
    <main className="min-h-screen bg-[#9794C4] text-black font-sans">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6">
        <a href="/">
          <img src="/logo.png" alt="TLACUILO" className="h-10 w-auto" />
        </a>
        <nav className="hidden md:flex gap-8 text-sm uppercase tracking-wide">
          <a href="/biblioteca" className="font-bold">Biblioteca</a>
          <a href="#" className="hover:underline">Artoteca</a>
          <a href="#" className="hover:underline">Fonoteca</a>
          <a href="#" className="hover:underline">Editorial Tlacuilo</a>
        </nav>
        <div className="hidden md:flex gap-6 text-sm uppercase tracking-wide">
          <a href="#" className="hover:underline">Iniciar sesión</a>
          <a href="#" className="hover:underline">Crear cuenta</a>
        </div>
      </header>

      {/* Grid de libros */}
      <section className="px-8 py-12 max-w-7xl mx-auto">
        {error ? (
          <pre className="bg-black/10 p-4 text-xs">{JSON.stringify(error, null, 2)}</pre>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
            {libros?.map((libro) => (
              <article key={libro.id} className="flex gap-3 items-start">
                <div className="w-20 flex-shrink-0">
                  <div className="aspect-[2/3] bg-black/15 flex items-center justify-center text-[9px] text-black/40 p-1 text-center overflow-hidden">
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
                <div className="flex flex-col flex-1 min-w-0 text-xs">
                  <h2 className="font-semibold leading-tight text-sm mb-1">
                    {libro.titulo}
                  </h2>
                  <p className="opacity-80 leading-tight">{libro.autor ?? '—'}</p>
                  <p className="opacity-60">{libro.anio ?? ''}</p>
                  <span
                    className={`mt-2 w-3 h-3 rounded-full ${
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
      </main>
  )
}
