import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import Cover from '@/components/Cover'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

type Libro = {
  id: string
  titulo: string
  autor: string | null
  anio: number | null
  descripcion: string | null
  portada_url: string | null
  disponible: boolean
  categorias: string[] | null
  etiquetas: string[] | null
  isbn: string | null
}

export default async function LibroPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const { data: libro, error } = await supabase
    .from('libros')
    .select('id, titulo, autor, anio, descripcion, portada_url, disponible, categorias, etiquetas, isbn')
    .eq('id', id)
    .single<Libro>()

  if (error || !libro) {
    notFound()
  }

  let relacionados: Libro[] = []
  if (libro.categorias && libro.categorias.length > 0) {
    const { data } = await supabase
      .from('libros')
      .select('id, titulo, autor, anio, descripcion, portada_url, disponible, categorias, etiquetas, isbn')
      .contains('categorias', [libro.categorias[0]])
      .neq('id', id)
      .limit(6)
    relacionados = (data as Libro[]) ?? []
  }

  return (
    <main className="min-h-screen bg-[#15151d] text-[#9091c4] font-futura">
      <Header />

      <section className="px-8 pt-2 pb-4 max-w-7xl mx-auto">
        <a
          href="/biblioteca"
          className="uppercase tracking-wide opacity-70 hover:opacity-100 hover:underline text-[clamp(10px,0.8vw,13px)]"
        >
          ← Volver a Biblioteca
        </a>
      </section>

      <section className="px-8 pb-16 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[minmax(200px,30%)_1fr] gap-10">
        <div>
          <div className="aspect-[2/3] bg-[#9091c4]/10 flex items-center justify-center text-[#9091c4]/40 p-4 text-center overflow-hidden text-[clamp(11px,1vw,15px)]">
            <Cover
              titulo={libro.titulo}
              portada_url={libro.portada_url}
              isbn={libro.isbn}
              autor={libro.autor}
            />
          </div>
        </div>

        <div className="flex flex-col">
          <h1 className="font-sonoran leading-tight mb-2 text-[clamp(22px,2.3vw,38px)] uppercase tracking-wide">
            {libro.titulo}
          </h1>

          <p className="text-[clamp(14px,1.2vw,20px)] opacity-80 mb-1">
            {libro.autor ?? '—'}
          </p>
          {libro.anio && (
            <p className="text-[clamp(13px,1vw,17px)] opacity-60 mb-6">{libro.anio}</p>
          )}

          <div className="flex items-center gap-2 mb-5 text-[clamp(11px,0.9vw,14px)] uppercase tracking-wide">
            <span
              className={`inline-block w-3 h-3 rounded-full ${
                libro.disponible ? 'bg-green-500' : 'bg-orange-400'
              }`}
            />
            <span>{libro.disponible ? 'Disponible para préstamo' : 'En préstamo'}</span>
          </div>

          {libro.disponible && (
            <button className="self-start bg-[#9091c4] text-[#15151d] px-6 py-3 mb-6 uppercase tracking-wide hover:bg-[#9091c4]/90 transition text-[clamp(11px,0.9vw,14px)] font-sonoran">
              Apartar este libro
            </button>
          )}

          {libro.descripcion && (
            <div className="mb-6">
              <h2 className="font-bold uppercase tracking-wide mb-2 text-[clamp(11px,0.9vw,14px)]">
                Sobre el libro
              </h2>
              <p className="leading-relaxed text-[clamp(13px,1vw,16px)] opacity-90">
                {libro.descripcion}
              </p>
            </div>
          )}

          {libro.categorias && libro.categorias.length > 0 && (
            <div className="mb-4">
              <h2 className="font-bold uppercase tracking-wide mb-2 text-[clamp(11px,0.9vw,14px)]">
                Categorías
              </h2>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[clamp(11px,0.9vw,14px)]">
                {libro.categorias.map((cat) => (
                  <a
                    key={cat}
                    href={'/biblioteca?categoria=' + encodeURIComponent(cat)}
                    className="opacity-80 hover:opacity-100 hover:underline"
                  >
                    {cat}
                  </a>
                ))}
              </div>
            </div>
          )}

          {libro.etiquetas && libro.etiquetas.length > 0 && (
            <div className="mb-4">
              <h2 className="font-bold uppercase tracking-wide mb-2 text-[clamp(11px,0.9vw,14px)]">
                Etiquetas
              </h2>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[clamp(11px,0.9vw,14px)] opacity-80">
                {libro.etiquetas.map((tag) => (
                  <span key={tag}>· {tag}</span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-2 uppercase tracking-wide opacity-70 text-[clamp(10px,0.8vw,13px)]">
            Biblioteca Tlacuilo, Coyoacán
          </div>
        </div>
      </section>

      {relacionados.length > 0 && (
        <section className="px-8 pb-20 max-w-7xl mx-auto border-t border-[#9091c4]/15 pt-10">
          <h2 className="font-bold uppercase tracking-wide mb-6 text-[clamp(11px,0.9vw,14px)]">
            Otras lecturas relacionadas
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {relacionados.map((book) => (
              <a
                key={book.id}
                href={'/biblioteca/' + book.id}
                className="block opacity-90 hover:opacity-100"
              >
                <div className="aspect-[2/3] bg-[#9091c4]/10 flex items-center justify-center text-[#9091c4]/40 p-2 text-center overflow-hidden text-[clamp(9px,0.7vw,11px)] mb-2">
                  <Cover
                    titulo={book.titulo}
                    portada_url={book.portada_url}
                    isbn={book.isbn}
                    autor={book.autor}
                  />
                </div>
                <p className="font-medium leading-tight mb-0.5 text-[clamp(10px,0.8vw,13px)]">
                  {book.titulo}
                </p>
                <p className="opacity-70 text-[clamp(9px,0.7vw,11px)]">
                  {book.autor ?? '—'}
                </p>
              </a>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
