'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import TecaLayout from '@/components/TecaLayout'
import AdminNav from '@/components/AdminNav'
import { useEditorGate } from '@/components/useEditorGate'
import {
  CATEGORIAS,
  ESTADO_CLASE,
  ESTADO_LABEL,
  MESES,
  fechaCorta,
  labelCategoria,
  type CalendarioFecha,
} from '@/lib/calendario'

/**
 * /admin/calendario
 *
 * El mega calendario de fechas evergreen para planear contenido de Tlacuilo.
 * Herramienta interna: se navega por mes y categoria, se filtra y se busca
 * por titulo/tema. Cada fecha se abre para ver la ficha completa y los
 * libros del catalogo que aplican.
 */
export default function AdminCalendarioPage() {
  const { loading, isEditor } = useEditorGate()
  const [fechas, setFechas] = useState<CalendarioFecha[]>([])
  const [cargando, setCargando] = useState(true)
  const [mes, setMes] = useState<number | null>(null)
  const [categoria, setCategoria] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')

  const cargar = useCallback(async () => {
    if (!isEditor) return
    const { data } = await supabase
      .from('calendario_fechas')
      .select('*')
      .order('mes', { ascending: true })
      .order('dia', { ascending: true })
    setFechas((data ?? []) as CalendarioFecha[])
    setCargando(false)
  }, [isEditor])

  useEffect(() => {
    cargar()
  }, [cargar])

  const filtradas = useMemo(() => {
    const b = busqueda.trim().toLowerCase()
    return fechas.filter((f) => {
      if (mes !== null && f.mes !== mes) return false
      if (categoria !== null && f.categoria !== categoria) return false
      if (b) {
        const hay = `${f.titulo} ${f.contexto} ${f.gancho}`.toLowerCase()
        if (!hay.includes(b)) return false
      }
      return true
    })
  }, [fechas, mes, categoria, busqueda])

  if (loading || !isEditor) {
    return (
      <TecaLayout>
        <section className="px-10 py-20 max-w-4xl mx-auto">
          <p className="opacity-70 font-mono">&gt; verificando permisos<span className="animate-pulse">_</span></p>
        </section>
      </TecaLayout>
    )
  }

  return (
    <TecaLayout>
      <AdminNav />
      <section className="px-10 pt-10 pb-16 max-w-5xl mx-auto max-md:px-5">
        <p className="font-micro uppercase tracking-[0.12em] text-[11px] text-acid mb-3">
          admin · calendario de contenido
        </p>
        <h1 className="font-sans font-light leading-none mb-3 text-[clamp(32px,3.8vw,52px)] tracking-[-0.01em] text-text">
          Calendario de contenido
        </h1>
        <p className="text-text-dim mb-8 text-[clamp(13px,1vw,15px)]">
          fechas evergreen para planear posts · <span className="font-mono">{fechas.length}</span> fichas ·
          nada inventado: lo que no tiene match confirmado se marca como hueco
        </p>

        {/* ============ FILTROS ============ */}
        <div className="flex flex-col gap-3 mb-8">
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="buscar por autor / tema..."
            className="bg-transparent border-b border-rule font-mono text-sm py-2 outline-none focus:border-text"
          />

          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setMes(null)}
              className={`font-micro text-[10px] uppercase tracking-[0.08em] px-2.5 py-1 border transition-colors ${
                mes === null ? 'border-rule-strong text-text-bright' : 'border-rule text-text-dim hover:text-text-bright'
              }`}
            >
              todo el año
            </button>
            {MESES.map((m, i) => (
              <button
                key={m}
                onClick={() => setMes(mes === i + 1 ? null : i + 1)}
                className={`font-micro text-[10px] uppercase tracking-[0.08em] px-2.5 py-1 border transition-colors ${
                  mes === i + 1 ? 'border-rule-strong text-text-bright' : 'border-rule text-text-dim hover:text-text-bright'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setCategoria(null)}
              className={`font-micro text-[10px] uppercase tracking-[0.08em] px-2.5 py-1 border transition-colors ${
                categoria === null ? 'border-rule-strong text-text-bright' : 'border-rule text-text-dim hover:text-text-bright'
              }`}
            >
              todas las categorias
            </button>
            {CATEGORIAS.map((c) => (
              <button
                key={c.slug}
                onClick={() => setCategoria(categoria === c.slug ? null : c.slug)}
                className={`font-micro text-[10px] uppercase tracking-[0.08em] px-2.5 py-1 border transition-colors ${
                  categoria === c.slug ? 'border-rule-strong text-text-bright' : 'border-rule text-text-dim hover:text-text-bright'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* ============ LISTA ============ */}
        {cargando ? (
          <p className="font-mono text-sm text-text-dim">cargando...</p>
        ) : fechas.length === 0 ? (
          <p className="font-mono text-sm text-text-dim lowercase">
            todavia no hay fichas cargadas. son 150+ del mega calendario — pendiente importarlas.
          </p>
        ) : filtradas.length === 0 ? (
          <p className="font-mono text-sm text-text-dim lowercase">sin resultados con estos filtros.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {filtradas.map((f) => (
              <Link
                key={f.id}
                href={`/admin/calendario/${f.id}`}
                className="border border-rule bg-bg-soft p-4 flex items-start justify-between gap-4 hover:border-rule-strong transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-mono text-[11px] text-text-dim uppercase tracking-wider mb-1">
                    {fechaCorta(f.mes, f.dia)} · {labelCategoria(f.categoria)}
                  </p>
                  <p className="text-text-bright text-[15px] leading-snug truncate">{f.titulo}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span
                    className={`font-micro text-[10px] uppercase tracking-[0.08em] px-2 py-0.5 border ${ESTADO_CLASE[f.estado_acervo]}`}
                  >
                    {ESTADO_LABEL[f.estado_acervo]}
                  </span>
                  {f.tono === 'requiere_cuidado' && (
                    <span className="font-micro text-[10px] uppercase tracking-[0.08em] px-2 py-0.5 border text-loan border-loan/40">
                      requiere cuidado
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </TecaLayout>
  )
}
