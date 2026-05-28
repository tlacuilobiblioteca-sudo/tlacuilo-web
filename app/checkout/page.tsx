'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import TecaLayout from '@/components/TecaLayout'
import Cover from '@/components/Cover'

type Libro = {
  id: string
  titulo: string
  autor: string | null
  portada_url: string | null
  isbn: string | null
}

type Prestamo = {
  id: string
  libros: Libro
}

const BLOCKS = [
  { id: 'manana', label: 'mañana', range: '10:00 a 14:30', startHour: 10 },
  { id: 'tarde', label: 'tarde', range: '16:00 a 19:00', startHour: 16 },
] as const

type BlockId = typeof BLOCKS[number]['id']

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

function getNextWeekdays(count: number): Date[] {
  const days: Date[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(today)
  d.setDate(d.getDate() + 1) // mínimo mañana
  while (days.length < count) {
    const dow = d.getDay()
    if (dow >= 1 && dow <= 5) days.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return days
}

function dayShort(d: Date): string {
  return `${DIAS[d.getDay()].slice(0, 3)} ${d.getDate()} ${MESES[d.getMonth()].slice(0, 3)}`
}

function dayFull(d: Date): string {
  return `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`
}

export default function CheckoutPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [morral, setMorral] = useState<Prestamo[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedBlock, setSelectedBlock] = useState<BlockId | null>(null)
  const [error, setError] = useState<string | null>(null)

  const days = getNextWeekdays(10)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!mounted) return
      if (!user) {
        router.push('/login')
        return
      }
      const { data, error: err } = await supabase
        .from('prestamos')
        .select('id, libros (id, titulo, autor, portada_url, isbn)')
        .eq('user_id', user.id)
        .eq('status', 'morral')
        .order('added_at', { ascending: false })
      if (!mounted) return
      if (err) setError(err.message)
      else if (data) setMorral(data as unknown as Prestamo[])
      setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [router])

  async function handleConfirm() {
    if (!selectedDate || !selectedBlock || morral.length === 0) return
    setSubmitting(true)
    setError(null)
    const block = BLOCKS.find((b) => b.id === selectedBlock)
    if (!block) return
    const visitAt = new Date(selectedDate)
    visitAt.setHours(block.startHour, 0, 0, 0)
    const ids = morral.map((p) => p.id)
    const { error: upErr } = await supabase
      .from('prestamos')
      .update({ status: 'apartado', visit_at: visitAt.toISOString() })
      .in('id', ids)
    if (upErr) {
      setError(upErr.message)
      setSubmitting(false)
      return
    }
    router.push('/mi-tlacuilo')
  }

  if (loading) {
    return (
      <TecaLayout>
        <section className="px-10 py-20 max-w-7xl mx-auto">
          <p className="opacity-70 font-mono text-[clamp(13px,1vw,16px)]">
            &gt; preparando tu checkout<span className="animate-pulse">_</span>
          </p>
        </section>
      </TecaLayout>
    )
  }

  if (morral.length === 0) {
    return (
      <TecaLayout>
        <section className="px-10 pt-8 pb-12 max-w-7xl mx-auto">
          <p className="font-mono uppercase tracking-[0.2em] text-[clamp(10px,0.8vw,13px)] opacity-60 mb-2">
            &gt; checkout
          </p>
          <h1 className="font-mono leading-tight mb-6 text-[clamp(28px,3.5vw,52px)] uppercase tracking-wide text-text-bright">
            Tu morral está vacío
          </h1>
          <p className="opacity-70 mb-6 text-[clamp(13px,1vw,17px)]">
            Necesitas agregar libros antes de agendar una visita.
          </p>
          <Link href="/biblioteca" className="font-mono text-sm uppercase tracking-wider underline hover:text-text-bright">
            explorar la biblioteca →
          </Link>
        </section>
      </TecaLayout>
    )
  }

  return (
    <TecaLayout>
      <section className="px-10 pt-8 pb-16 max-w-7xl mx-auto">
        <p className="font-mono uppercase tracking-[0.2em] text-[clamp(10px,0.8vw,13px)] opacity-60 mb-2">
          &gt; checkout
        </p>
        <h1 className="font-mono leading-tight mb-2 text-[clamp(28px,3.5vw,52px)] uppercase tracking-wide text-text-bright">
          Agenda tu visita
        </h1>
        <p className="opacity-70 mb-12 text-[clamp(13px,1vw,17px)]">
          Te esperamos en la biblioteca, en Coyoacán, para entregarte tus libros.
        </p>

        <div className="mb-12">
          <h2 className="font-mono uppercase tracking-wide text-[clamp(16px,1.6vw,22px)] text-text-bright mb-4">
            Llevas {morral.length} {morral.length === 1 ? 'libro' : 'libros'}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {morral.map((p) => (
              <div key={p.id} className="flex flex-col gap-2">
                <div className="aspect-[2/3] bg-bg-soft flex items-center justify-center text-text-dim p-2 text-center overflow-hidden text-[10px] mb-2">
                  <Cover titulo={p.libros.titulo} portada_url={p.libros.portada_url} isbn={p.libros.isbn} autor={p.libros.autor} />
                </div>
                <p className="font-medium leading-tight text-[clamp(11px,0.9vw,14px)] line-clamp-2">{p.libros.titulo}</p>
                <p className="opacity-70 text-[10px] line-clamp-1">{p.libros.autor ?? '—'}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-10">
          <h2 className="font-mono uppercase tracking-wide mb-3 opacity-70 text-[clamp(11px,0.9vw,14px)]">
            // qué día
          </h2>
          <p className="opacity-50 text-[10px] mb-4 font-mono">
            &gt; lun-vie · mín. 1 día de anticipación
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {days.map((d) => {
              const selected = selectedDate?.toDateString() === d.toDateString()
              return (
                <button
                  key={d.toISOString()}
                  onClick={() => setSelectedDate(d)}
                  className={`font-mono text-xs uppercase tracking-wider p-3 border transition-colors ${selected ? 'border-invert-bg bg-invert-bg text-invert-fg' : 'border-rule hover:border-rule-strong'}`}
                >
                  {dayShort(d)}
                </button>
              )
            })}
          </div>
        </div>

        <div className="mb-10">
          <h2 className="font-mono uppercase tracking-wide mb-3 opacity-70 text-[clamp(11px,0.9vw,14px)]">
            // qué bloque
          </h2>
          <p className="opacity-50 text-[10px] mb-4 font-mono">
            &gt; cerramos 14:30-16:00 (comida)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {BLOCKS.map((b) => {
              const selected = selectedBlock === b.id
              return (
                <button
                  key={b.id}
                  onClick={() => setSelectedBlock(b.id)}
                  className={`font-mono text-sm lowercase tracking-wider p-4 border text-left transition-colors ${selected ? 'border-invert-bg bg-invert-bg text-invert-fg' : 'border-rule hover:border-rule-strong'}`}
                >
                  <span className="block">{b.label}</span>
                  <span className="block text-[11px] opacity-70 mt-1">{b.range}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="border-t border-rule pt-8 font-mono">
          {selectedDate && selectedBlock ? (
            <p className="text-[clamp(12px,0.95vw,15px)] mb-4 opacity-90">
              &gt; vienes el <span className="text-text-bright">{dayFull(selectedDate)}</span>,{' '}
              bloque <span className="text-text-bright">{BLOCKS.find((b) => b.id === selectedBlock)?.label}</span>{' '}
              ({BLOCKS.find((b) => b.id === selectedBlock)?.range})
            </p>
          ) : (
            <p className="text-[clamp(12px,0.95vw,15px)] mb-4 opacity-60">
              &gt; escoge día y bloque
            </p>
          )}

          {error && (
            <p className="text-loan text-xs uppercase tracking-wider mb-4">
              &gt; error: {error}
            </p>
          )}

          <div className="flex items-center gap-4">
            <button
              onClick={handleConfirm}
              disabled={!selectedDate || !selectedBlock || submitting}
              className="font-mono text-sm lowercase tracking-wider bg-invert-bg text-invert-fg px-6 py-3 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              {submitting ? <>confirmando<span className="animate-pulse">_</span></> : <>confirmar visita →</>}
            </button>
            <Link href="/mi-tlacuilo" className="font-mono text-xs uppercase tracking-wider opacity-60 hover:opacity-100 hover:text-text-bright transition-opacity">
              × cancelar
            </Link>
          </div>
        </div>
      </section>
    </TecaLayout>
  )
}
