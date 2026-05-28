import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import Cover from '@/components/Cover'

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
}

type CategoriaConteo = { nombre: string; total: number }

type Counters = {
  libros: number
  prestamos: number
}

async function getLandingLibros(): Promise<Libro[]> {
  // Mezclado tipo "remix": ordenamos por id (UUID) que es efectivamente aleatorio.
  // Si después queremos true random, agregar una RPC `random_libros(n)` en Supabase.
  const { data, error } = await supabase
    .from('libros')
    .select('id, titulo, autor, portada_url, isbn')
    .order('id', { ascending: false })
    .limit(54)

  if (error || !data) return []
  return data as Libro[]
}

async function getCategorias(): Promise<CategoriaConteo[]> {
  const { data, error } = await supabase
    .from('libros')
    .select('categorias')

  if (error || !data) return []

  const counts = new Map<string, number>()
  for (const row of data) {
    const cats = (row.categorias ?? []) as string[]
    for (const cat of cats) {
      if (!cat) continue
      counts.set(cat, (counts.get(cat) ?? 0) + 1)
    }
  }

  return Array.from(counts.entries())
    .map(([nombre, total]) => ({ nombre, total }))
    .sort((a, b) => b.total - a.total) // ordenado por volumen descendente
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

      {/* ============ CATEGORÍAS EN BOTONES CUADRITOS · full width ============ */}
      {categorias.length > 0 && (
        <section className="px-10 pt-10 pb-6 max-md:px-5">
          <div className="flex flex-wrap gap-2">
            {categorias.map((cat) => (
              <Link
                key={cat.nombre}
                href={`/biblioteca?categoria=${encodeURIComponent(cat.nombre)}`}
                className="inline-flex items-baseline gap-2 bg-tinta text-bone border border-tinta rounded-sm px-3 py-1.5 font-micro text-[10px] uppercase tracking-[0.08em] hover:bg-dirty hover:text-tinta transition-colors"
              >
                <span>{cat.nombre}</span>
                <span className="opacity-50 text-[9px]">{cat.total}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ============ CATÁLOGO HEADER · TÍTULO + COUNTERS · full width ============ */}
      <section className="px-10 pt-10 pb-6 max-md:px-5 border-t border-rule">
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

      {/* ============ GRID MEZCLADO · 4 columnas fijas ============ */}
      <section className="relative max-w-4xl mx-auto px-5 pt-6 pb-0">
        {total === 0 ? (
          <p className="font-mono text-sm text-text-dim lowercase py-20 text-center">
            sin libros en el catálogo todavía.
          </p>
        ) : (
          <div className="grid grid-cols-4 gap-x-6 gap-y-10 max-md:grid-cols-2 max-[420px]:grid-cols-1">
            {libros.map((libro, i) => {
              const opacity = fadeOpacity(i, total)
              return (
                <Link
                  key={libro.id}
                  href={`/biblioteca/${libro.id}`}
                  className="group flex flex-col gap-2 transition-opacity hover:!opacity-100"
                  style={{ opacity }}
                >
                  <div className="aspect-[2/3] bg-bg-card flex items-center justify-center text-text-dim text-[11px] overflow-hidden p-2 text-center">
                    <Cover
                      titulo={libro.titulo}
                      portada_url={libro.portada_url}
                      isbn={libro.isbn}
                      autor={libro.autor}
                    />
                  </div>
                  <div className="font-mono uppercase text-[11px] tracking-[0.06em] text-text line-clamp-2 mt-2">
                    {libro.titulo}
                  </div>
                  {libro.autor && (
                    <div className="font-micro text-[10px] uppercase tracking-[0.04em] text-text-dim line-clamp-1">
                      {libro.autor}
                    </div>
                  )}
                </Link>
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
      <section className="max-w-4xl mx-auto px-5 py-14 flex justify-center">
        <Link
          href="/biblioteca"
          className="inline-flex items-center gap-3 bg-invert-bg text-invert-fg font-mono uppercase tracking-[0.12em] text-[12px] px-8 py-4 hover:opacity-90 transition-opacity"
        >
          Ir al catálogo completo
          <span aria-hidden="true">→</span>
        </Link>
      </section>

      {/* ============ FOOTER CUADRITO ============ */}
      <footer className="max-w-4xl mx-auto px-5 pb-16 flex justify-center">
        <div className="w-full max-w-[380px] border border-rule-strong bg-bg-card p-5 font-micro text-[10px] uppercase tracking-[0.08em] leading-relaxed">
          <div className="flex justify-between text-text">
            <span>// tlacuilo</span>
            <span>2026</span>
          </div>
          <div className="flex justify-between text-text">
            <span>cdmx · coyoacán</span>
            <span>los comunes</span>
          </div>

          <hr className="border-t border-text-dim/40 my-3" />

          <div className="flex flex-col gap-1.5">
            <a
              href="https://instagram.com/tlacuilobiblioteca"
              target="_blank"
              rel="noreferrer"
              className="text-text hover:text-text-bright transition-colors"
            >
              → @tlacuilobiblioteca
            </a>
            <Link href="/manifesto" className="text-text hover:text-text-bright transition-colors">
              → manifesto
            </Link>
            <a href="#" className="text-text hover:text-text-bright transition-colors">
              → newsletter
            </a>
            <a href="#" className="text-text hover:text-text-bright transition-colors">
              → booklet (pdf)
            </a>
            <a
              href="mailto:hola@tlacuilo.org"
              className="text-text hover:text-text-bright transition-colors"
            >
              → hola@tlacuilo.org
            </a>
          </div>

          <hr className="border-t border-text-dim/40 my-3" />

          <div className="text-text-dim">diseño + código: marina</div>
          <div className="text-text-dim">curaduría: marina, pedro reyes, samm</div>
        </div>
      </footer>
    </>
  )
}
