'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import TecaLayout from '@/components/TecaLayout'
import Cover from '@/components/Cover'

type Libro = {
  id: string
  titulo: string
  autor: string | null
  anio: number | null
  portada_url: string | null
  disponible: boolean
  isbn: string | null
}

/**
 * useSearchParams() requiere Suspense boundary en Next.js App Router.
 * Por eso separamos: la página wrap-ea en Suspense, el contenido usa el hook.
 */
export default function BuscarPage() {
  return (
    <TecaLayout>
      <Suspense fallback={<BuscarLoading />}>
        <BuscarContent />
      </Suspense>
    </TecaLayout>
  )
}

function BuscarLoading() {
  return (
    <section className="px-8 pt-8 pb-6 max-w-7xl mx-auto">
      <p className="font-mono text-sm opacity-70">
        &gt; cargando<span className="animate-pulse">_</span>
      </p>
    </section>
  )
}

function BuscarContent() {
  const router = useRouter()
  const sp = useSearchParams()
  const initialQuery = sp.get('q') ?? ''

  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<Libro[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [placeholders, setPlaceholders] = useState<string[]>([
    'buscar por título, autor, categoría...',
  ])
  const [phIdx, setPhIdx] = useState(0)

  // Cargar 30 títulos aleatorios para el placeholder
  useEffect(() => {
    const loadRandom = async () => {
      const { count } = await supabase
        .from('libros')
        .select('id', { count: 'exact', head: true })
      if (!count) return

      const titles: string[] = []
      for (let i = 0; i < 30; i++) {
        const offset = Math.floor(Math.random() * count)
        const { data } = await supabase
          .from('libros')
          .select('titulo')
          .not('titulo', 'is', null)
          .range(offset, offset)
          .limit(1)
        if (data && data[0]?.titulo) titles.push(data[0].titulo)
      }
      if (titles.length > 0) setPlaceholders(titles)
    }
    loadRandom()
  }, [])

  useEffect(() => {
    if (placeholders.length < 2) return
    const interval = setInterval(() => {
      setPhIdx((i) => (i + 1) % placeholders.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [placeholders])

  useEffect(() => {
    const q = sp.get('q')?.trim()
    if (!q) {
      setResults(null)
      return
    }
    setQuery(q)
    runSearch(q)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp])

  const runSearch = async (q: string) => {
    setLoading(true)
    setError(null)
    const { data, error: rpcError } = await supabase.rpc('search_libros', { q })
    if (rpcError) {
      setError(rpcError.message)
      setResults([])
    } else {
      setResults((data as Libro[]) ?? [])
    }
    setLoading(false)
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    router.push(`/buscar?q=${encodeURIComponent(q)}`)
  }

  const currentPlaceholder = placeholders[phIdx]

  return (
    <>
      <section className="px-8 pt-8 pb-6 max-w-7xl mx-auto">
        <p className="font-mono uppercase tracking-[0.2em] text-xs opacity-60 mb-3">
          &gt; buscar en la biblioteca
        </p>
        <form onSubmit={onSubmit} className="flex gap-3 items-center">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={currentPlaceholder}
            className="flex-1 bg-bg-soft px-5 py-3 outline-none focus:bg-bg-card text-[clamp(13px,1.1vw,17px)] placeholder:opacity-50 text-text-bright font-mono border border-rule focus:border-rule-strong transition-colors"
            autoFocus
          />
          <button
            type="submit"
            className="bg-invert-bg text-invert-fg px-6 py-3 uppercase tracking-wide hover:bg-text-bright transition-colors text-[clamp(11px,0.9vw,14px)] font-sonoran font-black"
          >
            Buscar
          </button>
        </form>

        {results !== null && (
          <p className="mt-4 uppercase tracking-wide opacity-70 text-[clamp(10px,0.8vw,13px)] font-mono">
            {loading
              ? '> buscando...'
              : error
              ? '> error: ' + error
              : '> ' + results.length + ' resultado' + (results.length === 1 ? '' : 's') + ' para "' + query + '"'}
          </p>
        )}
      </section>

      {results !== null && !error && results.length > 0 && (
        <section className="px-8 pb-12 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
            {results.map((libro) => (
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
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {results !== null && !error && results.length === 0 && !loading && (
        <section className="px-8 pb-12 max-w-7xl mx-auto">
          <p className="text-[clamp(13px,1.1vw,17px)] opacity-70 font-mono">
            &gt; sin resultados para &ldquo;{query}&rdquo;. prueba con otra palabra.
          </p>
        </section>
      )}
    </>
  )
}
