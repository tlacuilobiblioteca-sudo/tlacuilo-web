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

  // Vista por mes: de hoy a enero 2030, las fechas se repiten cada año
  const hoy = new Date()
  const INICIO = { anio: hoy.getFullYear(), mes: hoy.getMonth() + 1 }
  const FIN = { anio: 2030, mes: 1 }
  const [modo, setModo] = useState<'mes' | 'lista'>('mes')
  const [cursor, setCursor] = useState(INICIO)
  const esInicio = cursor.anio === INICIO.anio && cursor.mes === INICIO.mes
  const esFin = cursor.anio === FIN.anio && cursor.mes === FIN.mes
  const mesAnterior = () => { if (!esInicio) setCursor(cursor.mes === 1 ? { anio: cursor.anio - 1, mes: 12 } : { anio: cursor.anio, mes: cursor.mes - 1 }) }
  const mesSiguiente = () => { if (!esFin) setCursor(cursor.mes === 12 ? { anio: cursor.anio + 1, mes: 1 } : { anio: cursor.anio, mes: cursor.mes + 1 }) }

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

  function agregarEnDia(d: number, m: number) {
    setNDia(String(d))
    setNMes(String(m))
    setMostrarNueva(true)
    setTimeout(() => document.getElementById('form-nueva-ficha')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

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
      if (modo === 'lista' && mes !== null && f.mes !== mes) return false
      if (modo === 'mes' && f.mes !== cursor.mes) return false
      if (categoria !== null && f.categoria !== categoria) return false
      if (b) {
        const hay = `${f.titulo} ${f.contexto} ${f.gancho}`.toLowerCase()
        if (!hay.includes(b)) return false
      }
      return true
    })
  }, [fechas, mes, categoria, busqueda, modo, cursor])

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
      <section className="px-10 pt-10 pb-16 max-w-7xl mx-auto max-md:px-5">
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
            <div id="form-nueva-ficha" className="border border-rule-strong bg-bg-soft p-5 mt-3 flex flex-col gap-3 font-mono">
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

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setModo('mes')}
              className={`font-micro text-[10px] uppercase tracking-[0.08em] px-2.5 py-1 border transition-colors ${
                modo === 'mes' ? 'border-rule-strong text-text-bright' : 'border-rule text-text-dim hover:text-text-bright'
              }`}
            >
              vista por mes
            </button>
            <button
              onClick={() => setModo('lista')}
              className={`font-micro text-[10px] uppercase tracking-[0.08em] px-2.5 py-1 border transition-colors ${
                modo === 'lista' ? 'border-rule-strong text-text-bright' : 'border-rule text-text-dim hover:text-text-bright'
              }`}
            >
              lista completa
            </button>
          </div>

          {modo === 'lista' && (
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
          )}

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

        {/* ============ VISTA POR MES ============ */}
        {modo === 'mes' && !cargando && fechas.length > 0 && (
          <div className="mb-10">
            {/* misma cabecera que el mini calendario de mi tlacuilo */}
            <div className="flex items-center justify-between mb-3 font-mono text-[12px] tracking-wider">
              <button type="button" onClick={mesAnterior} disabled={esInicio} aria-label="mes anterior"
                className="px-2 opacity-60 hover:opacity-100 disabled:opacity-20 cursor-pointer">←</button>
              <span className="uppercase tracking-[0.14em] text-text-bright">{MESES[cursor.mes - 1]} {cursor.anio}</span>
              <button type="button" onClick={mesSiguiente} disabled={esFin} aria-label="mes siguiente"
                className="px-2 opacity-60 hover:opacity-100 disabled:opacity-20 cursor-pointer">→</button>
            </div>
            <GridMes anio={cursor.anio} mes={cursor.mes} fichas={filtradas} hoy={hoy} onAgregar={agregarEnDia} />
          </div>
        )}

        {/* ============ LISTA ============ */}
        {modo === 'mes' ? null : cargando ? (
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

/* ============================================================
   Calendario del mes: todos los días del mes en grid de semanas y, en cada
   día, un bannersito por ocasión. Las que ya tienen libros confirmados
   llevan palomita y van primero dentro del día; las que faltan de
   verificar se quedan (sin palomita, borde punteado) para que siempre se
   vea que hay algo que postear. Las fechas sin día fijo van arriba.
   ============================================================ */
const DIAS_SEMANA = ['l', 'm', 'x', 'j', 'v', 's', 'd'] // como el mini calendario de mi tlacuilo

function terceroJueves(anio: number, mes: number): number {
  const primero = new Date(anio, mes - 1, 1).getDay() // 0 dom .. 6 sab
  const offset = (4 - primero + 7) % 7 // 4 = jueves
  return 1 + offset + 14
}

function Bannersito({ f }: { f: CalendarioFecha }) {
  const ok = f.estado_acervo === 'confirmado'
  const hueco = f.estado_acervo === 'hueco'
  return (
    <Link
      href={`/admin/calendario/${f.id}`}
      title={`${f.titulo} · ${labelCategoria(f.categoria)}${ok ? ' · libros confirmados' : hueco ? ' · hueco de acervo' : ' · por verificar'}${f.tono === 'requiere_cuidado' ? ' · requiere cuidado' : ''}`}
      className={`block border px-1.5 py-1 font-mono text-[10px] leading-tight mb-1 hover:border-rule-strong transition-colors ${
        ok ? 'border-acid/40 bg-bg-soft text-text-bright' : hueco ? 'border-loan/40 border-dashed text-loan' : 'border-rule border-dashed text-text-dim'
      }`}
    >
      {ok && <span className="text-acid mr-1">✓</span>}
      {f.tono === 'requiere_cuidado' && <span className="text-loan mr-1">!</span>}
      <span className="line-clamp-2">{f.titulo}</span>
    </Link>
  )
}

function GridMes({ anio, mes, fichas, hoy, onAgregar }: { anio: number; mes: number; fichas: CalendarioFecha[]; hoy: Date; onAgregar: (d: number, m: number) => void }) {
  const diasEnMes = new Date(anio, mes, 0).getDate()
  const primerDiaSemana = (new Date(anio, mes - 1, 1).getDay() + 6) % 7 // lunes = 0
  const porDia = new Map<number, CalendarioFecha[]>()
  const sinDia: CalendarioFecha[] = []
  for (const f of fichas) {
    let d = f.dia
    if (d === null && /filosof/i.test(f.titulo) && mes === 11) d = terceroJueves(anio, mes)
    if (d === null) { sinDia.push(f); continue }
    if (!porDia.has(d)) porDia.set(d, [])
    porDia.get(d)!.push(f)
  }
  const rango = (f: CalendarioFecha) => (f.estado_acervo === 'confirmado' ? 0 : f.estado_acervo === 'verificar' ? 1 : 2)
  for (const lista of porDia.values()) lista.sort((a, b) => rango(a) - rango(b))

  const celdas: (number | null)[] = []
  for (let i = 0; i < primerDiaSemana; i++) celdas.push(null)
  for (let d = 1; d <= diasEnMes; d++) celdas.push(d)
  while (celdas.length % 7 !== 0) celdas.push(null)
  const esHoy = (d: number) => hoy.getFullYear() === anio && hoy.getMonth() + 1 === mes && hoy.getDate() === d
  const yaPaso = (d: number) => new Date(anio, mes - 1, d) < new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
  const total = fichas.length
  const confirmadas = fichas.filter((f) => f.estado_acervo === 'confirmado').length

  return (
    <div>
      <p className="font-mono text-[11px] text-text-dim mb-3">
        {total} ocasiones este mes · {confirmadas} con libros ya confirmados
        {total - confirmadas > 0 ? ` · ${total - confirmadas} por verificar (sin palomita)` : ''}
      </p>
      {sinDia.length > 0 && (
        <div className="border border-rule bg-bg-soft p-3 mb-3">
          <p className="font-micro text-[10px] uppercase tracking-wider text-text-dim mb-1">este mes, sin día fijo</p>
          {sinDia.map((f) => <Bannersito key={f.id} f={f} />)}
        </div>
      )}
      <div className="grid grid-cols-7 gap-px bg-rule border border-rule max-md:hidden">
        {DIAS_SEMANA.map((d) => (
          <div key={d} className="bg-bg px-2 py-1 font-mono text-[11px] text-center opacity-40">{d}</div>
        ))}
        {celdas.map((d, i) => (
          <div key={i} className={`group bg-bg min-h-[150px] p-1.5 ${d === null ? 'opacity-30' : ''} ${d !== null && yaPaso(d) ? 'opacity-50' : ''}`}>
            {d !== null && (
              <>
                <div className="flex items-center justify-between mb-1 px-0.5">
                  <p className={`font-mono text-[11px] ${esHoy(d) ? 'text-acid' : 'text-text-dim'}`}>{d}{esHoy(d) ? ' · hoy' : ''}</p>
                  <button type="button" onClick={() => onAgregar(d, mes)} title={`agregar ocasión el ${d} de ${MESES[mes - 1]}`}
                    className="font-mono text-[12px] leading-none text-text-dim opacity-0 group-hover:opacity-100 hover:text-acid transition-opacity cursor-pointer">+</button>
                </div>
                {(porDia.get(d) ?? []).map((f) => <Bannersito key={f.id} f={f} />)}
              </>
            )}
          </div>
        ))}
      </div>
      {/* móvil: día por día */}
      <div className="md:hidden flex flex-col gap-2">
        {Array.from({ length: diasEnMes }, (_, k) => k + 1).map((d) => (
          <div key={d} className={`border border-rule p-2 ${yaPaso(d) ? 'opacity-50' : ''} ${(porDia.get(d) ?? []).length === 0 ? 'py-1' : 'bg-bg-soft'}`}>
            <div className="flex items-center justify-between mb-1">
              <p className={`font-mono text-[11px] ${esHoy(d) ? 'text-acid' : 'text-text-dim'}`}>{d} de {MESES[mes - 1]}{esHoy(d) ? ' · hoy' : ''}</p>
              <button type="button" onClick={() => onAgregar(d, mes)} className="font-mono text-[14px] leading-none text-text-dim hover:text-acid px-1">+</button>
            </div>
            {(porDia.get(d) ?? []).map((f) => <Bannersito key={f.id} f={f} />)}
          </div>
        ))}
      </div>
      <p className="font-mono text-[10px] text-text-dim mt-3">
        ✓ = libros ya confirmados en catálogo · borde punteado = falta verificar · naranja = hueco de acervo · ! = requiere cuidado · pasa el cursor por un día y pica + para agregar una ocasión ahí
      </p>
    </div>
  )
}
