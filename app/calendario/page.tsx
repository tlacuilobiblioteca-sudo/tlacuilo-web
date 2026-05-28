import { supabase } from '@/lib/supabase'
import TecaLayout from '@/components/TecaLayout'

export const dynamic = 'force-dynamic'

type Evento = {
  id: string
  titulo: string
  descripcion: string | null
  fecha_inicio: string
  fecha_fin: string | null
  ubicacion: string | null
  url: string | null
}

async function getEventos(): Promise<Evento[]> {
  const ahora = new Date().toISOString()
  const { data } = await supabase
    .from('eventos')
    .select('id, titulo, descripcion, fecha_inicio, fecha_fin, ubicacion, url')
    .gte('fecha_inicio', ahora)
    .order('fecha_inicio', { ascending: true })
  return (data ?? []) as Evento[]
}

function formatFecha(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatHora(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

export default async function CalendarioPage() {
  const eventos = await getEventos()

  return (
    <TecaLayout>
      <section className="px-8 pt-6 pb-16 max-w-4xl mx-auto">
        <h1 className="font-mono uppercase tracking-[0.18em] text-text text-[11px] mb-2">
          calendario
        </h1>
        <p className="font-mono text-[11px] text-text-dim mb-12 lowercase">
          próximos eventos de tlacuilo.
        </p>

        {eventos.length === 0 ? (
          <p className="font-mono text-sm text-text-dim lowercase">
            sin eventos próximos por ahora.
          </p>
        ) : (
          <ul className="flex flex-col gap-12">
            {eventos.map((e) => (
              <li key={e.id} className="border-t border-rule-strong pt-8">
                <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-dim mb-3">
                  {formatFecha(e.fecha_inicio)} · {formatHora(e.fecha_inicio)}
                  {e.fecha_fin && (
                    <span> — {formatHora(e.fecha_fin)}</span>
                  )}
                </div>
                <h2 className="font-mono uppercase tracking-[0.04em] text-text text-[clamp(20px,2.6vw,34px)] mb-3">
                  {e.titulo}
                </h2>
                {e.ubicacion && (
                  <div className="font-mono text-[12px] text-text-dim lowercase mb-3">
                    {e.ubicacion}
                  </div>
                )}
                {e.descripcion && (
                  <p className="font-sans text-[14px] text-text leading-[1.6] max-w-[640px] mb-3">
                    {e.descripcion}
                  </p>
                )}
                {e.url && (
                  <a
                    href={e.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block font-mono text-[11px] uppercase tracking-[0.12em] text-text hover:text-text-bright underline"
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
