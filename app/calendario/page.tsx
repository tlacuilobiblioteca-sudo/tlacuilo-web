import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import TecaLayout from '@/components/TecaLayout'

export const dynamic = 'force-dynamic'

/* ============================================================
   Tipos
   ============================================================ */

type Evento = {
  id: string
  titulo: string
  descripcion: string | null
  fecha_inicio: string
  fecha_fin: string | null
  ubicacion: string | null
  url: string | null
}

/* ============================================================
   Data
   ============================================================ */

async function getEventosDelAño(year: number): Promise<Evento[]> {
  const start = new Date(year, 0, 1).toISOString()
  const end = new Date(year + 1, 0, 1).toISOString()
  const { data } = await supabase
    .from('eventos')
    .select('id, titulo, descripcion, fecha_inicio, fecha_fin, ubicacion, url')
    .gte('fecha_inicio', start)
    .lt('fecha_inicio', end)
    .order('fecha_inicio', { ascending: true })
  return (data ?? []) as Evento[]
}

/* ============================================================
   Calendario helpers
   ============================================================ */

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const DIAS_SEMANA = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

/** Devuelve YYYY-MM-DD en zona local. */
function dateKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
}

/** Mapa de día (YYYY-MM-DD) → lista de eventos que caen en ese día. */
function indexarEventosPorDia(eventos: Evento[]): Map<string, Evento[]> {
  const map = new Map<string, Evento[]>()
  for (const e of eventos) {
    const start = new Date(e.fecha_inicio)
    const end = e.fecha_fin ? new Date(e.fecha_fin) : new Date(e.fecha_inicio)
    const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate())
    const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate())
    while (cursor <= endDay) {
      const key = dateKey(cursor)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(e)
      cursor.setDate(cursor.getDate() + 1)
    }
  }
  return map
}

/** Genera la matriz de días de un mes (filas de 7), empezando en lunes.
    Las celdas vacías antes del 1 y después del último día son null. */
function generarMatrizMes(year: number, month: number): (number | null)[][] {
  const primerDia = new Date(year, month, 1)
  // JS: getDay() devuelve 0=domingo, 1=lunes, ..., 6=sábado.
  // Queremos empezar en lunes: shift = (getDay() + 6) % 7
  const shift = (primerDia.getDay() + 6) % 7
  const diasEnMes = new Date(year, month + 1, 0).getDate()

  const celdas: (number | null)[] = []
  for (let i = 0; i < shift; i++) celdas.push(null)
  for (let d = 1; d <= diasEnMes; d++) celdas.push(d)
  while (celdas.length % 7 !== 0) celdas.push(null)

  const filas: (number | null)[][] = []
  for (let i = 0; i < celdas.length; i += 7) {
    filas.push(celdas.slice(i, i + 7))
  }
  return filas
}

function formatFechaCorta(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

function formatFechaLarga(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function formatHora(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

/* ============================================================
   Página
   ============================================================ */

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>
}) {
  const params = await searchParams
  const yearActual = new Date().getFullYear()
  const year = parseInt(params.year ?? String(yearActual), 10) || yearActual
  const yearsDisponibles = [yearActual - 1, yearActual, yearActual + 1]

  const eventos = await getEventosDelAño(year)
  const eventosPorDia = indexarEventosPorDia(eventos)

  // Hoy en formato YYYY-MM-DD para marcar la celda "hoy"
  const hoyKey = dateKey(new Date())

  return (
    <TecaLayout>
      {/* ============ HEADER ============ */}
      <section className="px-10 pt-10 pb-6 max-md:px-5">
        <p className="font-micro uppercase tracking-[0.12em] text-[11px] text-dirty mb-3">
          calendario
        </p>
        <div className="flex items-end justify-between flex-wrap gap-6">
          <h1 className="font-sans font-light leading-none text-[clamp(34px,4vw,56px)] tracking-[-0.01em] text-text">
            {year}
          </h1>

          {/* Navegación de año */}
          <div className="flex gap-2">
            {yearsDisponibles.map((y) => (
              <Link
                key={y}
                href={`/calendario?year=${y}`}
                className={`inline-flex items-center border border-tinta rounded-sm px-3 py-2 font-micro text-[11px] uppercase tracking-[0.08em] transition-colors ${
                  y === year
                    ? 'bg-dirty text-tinta'
                    : 'bg-tinta text-bone hover:bg-dirty hover:text-tinta'
                }`}
              >
                {y}
              </Link>
            ))}
          </div>
        </div>
        <p className="text-text-dim text-[clamp(13px,1vw,15px)] mt-3">
          días resaltados tienen evento · {eventos.length} eventos en {year}
        </p>
      </section>

      <hr className="border-t border-rule mx-10 max-md:mx-5" />

      {/* ============ GRID DE 12 MINI-CALENDARIOS ============ */}
      <section className="px-10 pt-10 pb-10 max-md:px-5">
        <div className="grid grid-cols-4 gap-x-6 gap-y-10 max-lg:grid-cols-3 max-md:grid-cols-2 max-[480px]:grid-cols-1">
          {MESES.map((nombre, idx) => {
            const filas = generarMatrizMes(year, idx)
            return (
              <div key={idx} className="flex flex-col gap-3">
                {/* Nombre del mes */}
                <div className="font-mono uppercase tracking-[0.12em] text-[12px] text-text pb-1 border-b border-rule">
                  {nombre}
                </div>

                {/* Header de días L M M J V S D */}
                <div className="grid grid-cols-7 gap-0.5 font-micro text-[9px] uppercase tracking-[0.08em] text-text-dim text-center">
                  {DIAS_SEMANA.map((d, i) => (
                    <div key={i} className="py-0.5">{d}</div>
                  ))}
                </div>

                {/* Matriz de días */}
                <div className="grid grid-cols-7 gap-0.5 font-mono text-[11px]">
                  {filas.flat().map((dia, i) => {
                    if (dia === null) {
                      return <div key={i} className="aspect-square" />
                    }
                    const fechaCell = new Date(year, idx, dia)
                    const key = dateKey(fechaCell)
                    const eventosDia = eventosPorDia.get(key) ?? []
                    const tieneEvento = eventosDia.length > 0
                    const esHoy = key === hoyKey

                    const titulos = eventosDia.map((e) => e.titulo).join(' · ')

                    return (
                      <div
                        key={i}
                        title={tieneEvento ? titulos : undefined}
                        className={`aspect-square flex items-center justify-center text-center transition-colors ${
                          tieneEvento
                            ? 'bg-dirty text-tinta font-medium cursor-help'
                            : esHoy
                            ? 'bg-tinta text-bone font-medium'
                            : 'text-text-dim hover:text-text'
                        }`}
                      >
                        {dia}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <hr className="border-t border-rule mx-10 max-md:mx-5" />

      {/* ============ LISTA DE EVENTOS DEL AÑO ============ */}
      <section className="px-10 pt-10 pb-16 max-md:px-5">
        <h2 className="font-sans font-light text-[clamp(22px,2.4vw,34px)] tracking-[-0.005em] text-text mb-6">
          Eventos del año
        </h2>

        {eventos.length === 0 ? (
          <p className="font-mono text-sm text-text-dim lowercase">
            sin eventos registrados en {year}.
          </p>
        ) : (
          <ul className="flex flex-col gap-8 max-w-4xl">
            {eventos.map((e) => (
              <li key={e.id} className="border-t border-rule pt-6">
                <div className="font-micro text-[11px] uppercase tracking-[0.12em] text-dirty mb-2">
                  {formatFechaLarga(e.fecha_inicio)}
                  {e.fecha_fin && (
                    <span className="text-text-dim">
                      {' '}— {formatFechaCorta(e.fecha_fin)}
                    </span>
                  )}
                  <span className="text-text-dim"> · {formatHora(e.fecha_inicio)}</span>
                </div>

                <h3 className="font-sans font-medium text-[clamp(18px,2vw,24px)] leading-tight text-text mb-2">
                  {e.titulo}
                </h3>

                {e.ubicacion && (
                  <div className="font-mono text-[12px] text-text-dim mb-2">
                    {e.ubicacion}
                  </div>
                )}

                {e.descripcion && (
                  <p className="font-sans text-[14px] text-text leading-relaxed max-w-[640px] mb-2">
                    {e.descripcion}
                  </p>
                )}

                {e.url && (
                  <a
                    href={e.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block font-micro text-[11px] uppercase tracking-[0.12em] text-text hover:text-text-bright underline"
                  >
                    más info →
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </TecaLayout>
  )
}
