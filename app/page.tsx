import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import Cover from '@/components/Cover'
import QuickMorralButton from '@/components/QuickMorralButton'

export const dynamic = 'force-dynamic'

/* ============================================================
   Tipos + Data
   ============================================================ */

type Libro = {
  id: string
  titulo: string
  autor: string | null
  portada_url: string | null
  isbn: string | null
  disponible: boolean | null
}

type CategoriaConteo = { categoria: string; libros_count: number }

type Counters = {
  libros: number
  prestamos: number
}

async function getLandingLibros(): Promise<Libro[]> {
  // Mezclado tipo "remix": ordenamos por id (UUID) que es efectivamente aleatorio.
  // Filtramos por has_portada para que el landing se sienta vivo (libros con cover).
  const { data, error } = await supabase
    .from('libros')
    .select('id, titulo, autor, portada_url, isbn, disponible')
    .order('has_portada', { ascending: false, nullsFirst: false })
    .order('id', { ascending: false })
    .limit(54)

  if (error || !data) return []
  return data as Libro[]
}

async function getCategorias(): Promise<CategoriaConteo[]> {
  // MISMA fuente que biblioteca sidebar (RPC distinct_categorias) para que
  // estén siempre sincronizadas.
  const { data, error } = await supabase.rpc('distinct_categorias')
  if (error || !data) return []
  return (data as CategoriaConteo[]).sort((a, b) => b.libros_count - a.libros_count)
}

async function getCounters(): Promise<Counters> {
  let libros = 0
  let prestamos = 0

  try {
    const { count } = await supabase
      .from('libros')
      .select('id', { count: 'exact', head: true })
    libros = count ?? 0
  } catch {
    libros = 0
  }

  try {
    const { count } = await supabase
      .from('prestamos')
      .select('id', { count: 'exact', head: true })
    prestamos = count ?? 0
  } catch {
    prestamos = 0
  }

  return { libros, prestamos }
}

/* ============================================================
   Util: fade opacity para los últimos items
   ============================================================ */

function fadeOpacity(i: number, total: number): number {
  const tailStart = total - 12
  if (i < tailStart) return 1
  const step = Math.min(Math.floor((i - tailStart) / 3) + 1, 4)
  const levels = [1, 0.72, 0.5, 0.32, 0.18]
  return levels[step]
}

/* ============================================================
   Landing
   ============================================================ */

export default async function Home() {
  const [libros, categorias, counters] = await Promise.all([
    getLandingLibros(),
    getCategorias(),
    getCounters(),
  ])
  const total = libros.length

  return (
    <>
      <Header />

      {/* ============ CATÁLOGO HEADER · TÍTULO + COUNTERS · primero ============ */}
      <section className="px-10 pt-10 pb-6 max-md:px-5">
        <div className="flex items-end justify-between flex-wrap gap-6">
          <h2 className="font-sans font-light text-[clamp(28px,3.4vw,48px)] leading-none tracking-[-0.01em] text-text">
            Catálogo
          </h2>
          <div className="flex gap-10">
            <div className="flex flex-col items-start gap-1">
              <div className="font-sans font-light text-[clamp(22px,2.4vw,34px)] leading-none text-text tabular-nums">
                {counters.libros.toLocaleString('es-MX')}
              </div>
              <div className="font-micro text-[10px] uppercase tracking-[0.12em] text-dirty">
                Libros
              </div>
            </div>
            <div className="flex flex-col items-start gap-1">
              <div className="font-sans font-light text-[clamp(22px,2.4vw,34px)] leading-none text-text tabular-nums">
                {counters.prestamos.toLocaleString('es-MX')}
              </div>
              <div className="font-micro text-[10px] uppercase tracking-[0.12em] text-dirty">
                Préstamos
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ RAYA DIVISORA entre Catálogo y Categorías ============ */}
      <hr className="border-t border-rule mx-10 max-md:mx-5" />

      {/* ============ CATEGORÍAS EN BOTONES CUADRITOS · después del catálogo ============ */}
      {categorias.length > 0 && (
        <section className="px-10 pt-10 pb-10 max-md:px-5">
          <div className="flex flex-wrap gap-2">
            {categorias.map((cat) => (
              <Link
                key={cat.categoria}
                href={`/biblioteca?categoria=${encodeURIComponent(cat.categoria)}`}
                className="inline-flex items-baseline gap-2 bg-tinta text-bone border border-tinta rounded-sm px-3 py-1.5 font-micro text-[10px] uppercase tracking-[0.08em] hover:bg-dirty hover:text-tinta transition-colors"
              >
                <span>{cat.categoria}</span>
                <span className="opacity-50 text-[9px]">{cat.libros_count}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ============ RAYA DIVISORA full width · separa metadata del catálogo visual ============ */}
      <hr className="border-t border-rule mx-10 max-md:mx-5" />

      {/* ============ GRID DE 54 LIBROS · Utrecht-style · 4 cols más grandes ============ */}
      <section className="relative max-w-6xl mx-auto px-5 pt-20 pb-0 max-md:pt-12">
        {total === 0 ? (
          <p className="font-mono text-sm text-text-dim lowercase py-20 text-center">
            sin libros en el catálogo todavía.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-x-12 gap-y-20 max-md:grid-cols-2 max-md:gap-x-6 max-md:gap-y-12 max-[420px]:grid-cols-1">
            {libros.map((libro, i) => {
              const opacity = fadeOpacity(i, total)
              return (
                <article
                  key={libro.id}
                  className="flex flex-col gap-3 transition-opacity hover:!opacity-100"
                  style={{ opacity }}
                >
                  <Link
                    href={`/biblioteca/${libro.id}`}
                    className="aspect-[2/3] bg-bg-card flex items-center justify-center text-text-dim text-[10px] overflow-hidden p-2 text-center hover:opacity-90 transition-opacity"
                  >
                    <Cover
                      titulo={libro.titulo}
                      portada_url={libro.portada_url}
                      isbn={libro.isbn}
                      autor={libro.autor}
                    />
                  </Link>

                  {/* TÍTULO · siempre 2 líneas reservadas */}
                  <div className="min-h-[2.6em]">
                    <Link
                      href={`/biblioteca/${libro.id}`}
                      className="font-sans font-medium text-[19px] leading-snug text-text hover:text-text-bright transition-colors line-clamp-2"
                    >
                      {libro.titulo}
                    </Link>
                  </div>

                  {/* AUTOR · siempre 1 línea reservada */}
                  <div className="min-h-[1.3em]">
                    {libro.autor && (
                      <span className="font-sans font-light text-[16px] leading-snug text-text-dim line-clamp-1 block">
                        {libro.autor}
                      </span>
                    )}
                  </div>

                  {/* QUICK ADD MORRAL · siempre 1 línea reservada */}
                  <div className="min-h-[1.3em]">
                    {libro.disponible && <QuickMorralButton libroId={libro.id} />}
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {/* Overlay gradient al fondo refuerza el fade */}
        {total > 0 && (
          <div
            aria-hidden="true"
            className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
            style={{
              background:
                'linear-gradient(to bottom, transparent 0%, var(--color-bg) 100%)',
            }}
          />
        )}
      </section>

      {/* ============ BOTÓN IR AL CATÁLOGO ============ */}
      <section className="max-w-6xl mx-auto px-5 py-14 flex justify-center">
        <Link
          href="/biblioteca"
          className="inline-flex items-center gap-3 bg-invert-bg text-invert-fg font-mono uppercase tracking-[0.12em] text-[12px] px-8 py-4 hover:opacity-90 transition-opacity"
        >
          Ir al catálogo completo
          <span aria-hidden="true">→</span>
        </Link>
      </section>

      {/* ============ FOOTER full width · estilo colofón ============ */}
      <footer className="border-t border-rule bg-bg-card mt-10 px-10 py-8 max-md:px-5 font-micro text-[10px] uppercase tracking-[0.08em] leading-relaxed text-text">
        <div className="flex flex-wrap justify-between items-start gap-x-10 gap-y-6">

          {/* Columna 1 · Identidad y lugar */}
          <div className="flex flex-col gap-1 min-w-[180px]">
            <div className="flex gap-3"><span>// tlacuilo</span><span className="text-text-dim">2026</span></div>
            <div>cdmx · coyoacán</div>
            <div className="text-text-dim">los comunes</div>
            <div className="text-text-dim mt-2">
              estudio pedro reyes<br />
              lun–vie · 10:00–14:30 · 16:00–19:00
            </div>
          </div>

          {/* Columna 2 · Enlaces */}
          <div className="flex flex-col gap-1.5 min-w-[180px]">
            <a
              href="https://instagram.com/tlacuilobiblioteca"
              target="_blank"
              rel="noreferrer"
              className="hover:text-text-bright transition-colors"
            >
              → @tlacuilobiblioteca
            </a>
            <Link href="/manifesto" className="hover:text-text-bright transition-colors">
              → manifesto
            </Link>
            <Link href="/calendario" className="hover:text-text-bright transition-colors">
              → calendario
            </Link>
            <a href="#" className="hover:text-text-bright transition-colors">
              → newsletter
            </a>
            <a href="#" className="hover:text-text-bright transition-colors">
              → booklet (pdf)
            </a>
            <a
              href="mailto:hola@tlacuilo.org"
              className="hover:text-text-bright transition-colors"
            >
              → hola@tlacuilo.org
            </a>
          </div>

          {/* Columna 3 · Créditos */}
          <div className="flex flex-col gap-1 min-w-[180px] text-text-dim">
            <div>diseño + código · marina</div>
            <div>curaduría · marina · pedro reyes · samm</div>
            <div className="mt-2">
              fuentes · jost light · jetbrains mono · dm mono
            </div>
            <div>
              paleta v2 · #6E6BA0 · #9D9BC8 · #15151D · #ECEAF0 · #E8DC4A
            </div>
            <div className="mt-2">
              <span className="text-text">mi cosa es tu cosa.</span>
            </div>
          </div>

        </div>
      </footer>
    </>
  )
}
