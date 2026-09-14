'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  const router = useRouter()

  // Form de nueva ficha
  const [mostrarNueva, setMostrarNueva] = useState(false)
  const [nDia, setNDia] = useState('')
  const [nMes, setNMes] = useState('1')
  const [nCategoria, setNCategoria] = useState<string>(CATEGORIAS[0].slug)
  const [nTitulo, setNTitulo] = useState('')
  const [nContexto, setNContexto] = useState('')
  const [nGancho, setNGancho] = useState('')
  const [nPlan, setNPlan] = useState('')
  const [nEstado, setNEstado] = useState('verificar')
  const [nTono, setNTono] = useState('neutral')
  const [nTonoNota, setNTonoNota] = useState('')
  const [nNota, setNNota] = useState('')
  const [guardando, setGuardando] = useState(false)

  async function crearFicha() {
    if (!nTitulo.trim() || !nContexto.trim() || !nGancho.trim() || !nPlan.trim()) {
      alert('título, contexto, gancho y plan de libros son obligatorios')
      return
    }
    setGuardando(true)
    const { data, error } = await supabase
      .from('calendario_fechas')
      .insert({
        mes: Number(nMes),
        dia: nDia.trim() ? Number(nDia) : null,
        categoria: nCategoria,
        titulo: nTitulo.trim(),
        contexto: nContexto.trim(),
        gancho: nGancho.trim(),
        plan_de_libros: nPlan.trim(),
        estado_acervo: nEstado,
        tono: nTono,
        tono_nota: nTonoNota.trim() || null,
        nota_interna: nNota.trim() || null,
      })
      .select('id')
      .single()
    setGuardando(false)
    if (error || !data) {
      alert('error: ' + (error?.message ?? 'sin respuesta'))
      return
    }
    router.push(`/admin/calendario/${data.id}`)
  }

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

        {/* ============ DECISIONES ABIERTAS (del documento fuente) ============ */}
        <div className="border border-loan/40 bg-bg-soft p-4 mb-8 font-mono text-xs text-text-dim leading-relaxed">
          <p className="font-micro uppercase tracking-[0.12em] text-[10px] text-loan mb-2">decisiones de contenido aún abiertas — el calendario no es final hasta que Marina decida</p>
          <p>1. Reemplazo de 4 fechas cívicas débiles (Día de la Bandera 24 feb, Día del Ejército 19 feb, Día del Maestro 15 may, Día de las Madres 10 may). Candidatas con fecha verificada: Manuel Álvarez Bravo (nace 4 feb 1902), Tina Modotti (muere 5 ene 1942), &ldquo;El Corno Emplumado&rdquo; (fundación, enero 1962, solo mes), Festival de Avándaro (11-12 sep 1971), Manifiesto &ldquo;Actual No. 1&rdquo; / Estridentismo (diciembre 1921, sin día confirmado), Luis Barragán (nace 9 mar 1902 / muere 22 nov 1988). Ningún candidato con día exacto cae en mayo — falta decidir acomodo.</p>
          <p className="mt-1">2. Correcciones de fecha ya aplicadas, pendientes de confirmar: muerte de Hannah Arendt 4 dic 1975 (no 4 nov); fundación de la Bauhaus 1 abril 1919 (no 12 abril).</p>
          <p className="mt-1">3. Dato con una sola fuente no académica: exposición individual de Frida Kahlo, 13 abr 1953 — publicado con advertencia en su ficha.</p>
        </div>

        {/* ============ NUEVA FICHA ============ */}
        <div className="mb-8">
          <button
            onClick={() => setMostrarNueva((v) => !v)}
            className="inline-flex items-center bg-brillante text-bone border border-tinta rounded-sm px-4 py-2 font-micro text-[11px] uppercase tracking-[0.08em] hover:bg-tinta hover:text-acid transition-colors"
          >
            {mostrarNueva ? '× cerrar' : '+ nueva fecha'}
          </button>

          {mostrarNueva && (
            <div className="border border-rule-strong bg-bg-soft p-5 mt-3 flex flex-col gap-3 font-mono">
              <div className="flex flex-wrap items-end gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-wider text-text-dim">día (vacío si es fecha móvil)</span>
                  <input type="number" min={1} max={31} value={nDia} onChange={(e) => setNDia(e.target.value)}
                    className="bg-transparent border border-rule text-sm px-2 py-1.5 outline-none focus:border-text w-24" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-wider text-text-dim">mes</span>
                  <select value={nMes} onChange={(e) => setNMes(e.target.value)}
                    className="bg-transparent border border-rule text-sm px-2 py-1.5 outline-none focus:border-text">
                    {MESES.map((m, i) => <option key={m} value={i + 1} className="bg-tinta">{m}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1 flex-1 min-w-[220px]">
                  <span className="text-[10px] uppercase tracking-wider text-text-dim">categoría</span>
                  <select value={nCategoria} onChange={(e) => setNCategoria(e.target.value)}
                    className="bg-transparent border border-rule text-sm px-2 py-1.5 outline-none focus:border-text">
                    {CATEGORIAS.map((c) => <option key={c.slug} value={c.slug} className="bg-tinta">{c.label}</option>)}
                  </select>
                </label>
              </div>
              <input value={nTitulo} onChange={(e) => setNTitulo(e.target.value)} placeholder="título *"
                className="bg-transparent border-b border-rule text-sm py-2 outline-none focus:border-text" />
              <textarea value={nContexto} onChange={(e) => setNContexto(e.target.value)} rows={4}
                placeholder="contexto * (3-6 líneas, dato citable + fuente)"
                className="bg-transparent border border-rule text-sm p-2 outline-none focus:border-text resize-y" />
              <textarea value={nGancho} onChange={(e) => setNGancho(e.target.value)} rows={2}
                placeholder="gancho * (ángulo de copy)"
                className="bg-transparent border border-rule text-sm p-2 outline-none focus:border-text resize-y" />
              <textarea value={nPlan} onChange={(e) => setNPlan(e.target.value)} rows={2}
                placeholder="plan de libros * (qué buscar / mostrar del catálogo)"
                className="bg-transparent border border-rule text-sm p-2 outline-none focus:border-text resize-y" />
              <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-wider text-text-dim">estado de acervo</span>
                  <select value={nEstado} onChange={(e) => setNEstado(e.target.value)}
                    className="bg-transparent border border-rule text-sm px-2 py-1.5 outline-none focus:border-text">
                    <option value="verificar" className="bg-tinta">verificar en catálogo</option>
                    <option value="confirmado" className="bg-tinta">confirmado en catálogo</option>
                    <option value="hueco" className="bg-tinta">hueco de acervo (no inventar)</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-wider text-text-dim">tono</span>
                  <select value={nTono} onChange={(e) => setNTono(e.target.value)}
                    className="bg-transparent border border-rule text-sm px-2 py-1.5 outline-none focus:border-text">
                    <option value="neutral" className="bg-tinta">neutral</option>
                    <option value="requiere_cuidado" className="bg-tinta">requiere cuidado</option>
                  </select>
                </label>
              </div>
              {nTono === 'requiere_cuidado' && (
                <input value={nTonoNota} onChange={(e) => setNTonoNota(e.target.value)} placeholder="qué cuidar"
                  className="bg-transparent border-b border-loan/40 text-sm py-2 outline-none focus:border-text" />
              )}
              <input value={nNota} onChange={(e) => setNNota(e.target.value)} placeholder="nota interna (opcional, no va al post)"
                className="bg-transparent border-b border-rule text-sm py-2 outline-none focus:border-text" />
              <button onClick={crearFicha} disabled={guardando}
                className="self-start inline-flex items-center bg-brillante text-bone border border-tinta rounded-sm px-4 py-2 font-micro text-[11px] uppercase tracking-[0.08em] disabled:opacity-30 hover:bg-tinta hover:text-acid transition-colors">
                {guardando ? 'guardando...' : 'crear ficha'}
              </button>
            </div>
          )}
        </div>

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
