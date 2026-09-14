'use client'

import { use, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import TecaLayout from '@/components/TecaLayout'
import AdminNav from '@/components/AdminNav'
import { useEditorGate } from '@/components/useEditorGate'
import {
  CATEGORIAS,
  MESES,
  type CalendarioFecha,
  type EstadoAcervo,
  type Tono,
} from '@/lib/calendario'

type LibroVinculado = {
  libro_id: string
  confirmado_at: string
  libros: { id: string; titulo: string; autor: string | null; teca: string; disponible: boolean } | null
}

type LibroResultado = {
  id: string
  titulo: string
  autor: string | null
  teca: string
  disponible: boolean
}

export default function AdminCalendarioFichaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { loading, isEditor, editorId } = useEditorGate()

  const [ficha, setFicha] = useState<CalendarioFecha | null>(null)
  const [vinculados, setVinculados] = useState<LibroVinculado[]>([])
  const [cargando, setCargando] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  const [busquedaLibro, setBusquedaLibro] = useState('')
  const [resultados, setResultados] = useState<LibroResultado[]>([])
  const [buscando, setBuscando] = useState(false)

  const cargar = useCallback(async () => {
    if (!isEditor) return
    const [{ data: f }, { data: lv }] = await Promise.all([
      supabase.from('calendario_fechas').select('*').eq('id', id).single(),
      supabase
        .from('calendario_fecha_libros')
        .select('libro_id, confirmado_at, libros(id, titulo, autor, teca, disponible)')
        .eq('calendario_fecha_id', id),
    ])
    setFicha((f ?? null) as CalendarioFecha | null)
    setVinculados((lv ?? []) as unknown as LibroVinculado[])
    setCargando(false)
  }, [isEditor, id])

  useEffect(() => {
    cargar()
  }, [cargar, refreshKey])

  // Busqueda en el catalogo real (titulo o autor).
  useEffect(() => {
    const s = busquedaLibro.trim().replace(/[%_]/g, '')
    if (!s) {
      setResultados([])
      return
    }
    let vivo = true
    setBuscando(true)
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('libros')
        .select('id, titulo, autor, teca, disponible')
        .or(`titulo.ilike.%${s}%,autor.ilike.%${s}%`)
        .limit(20)
      if (vivo) {
        setResultados((data ?? []) as LibroResultado[])
        setBuscando(false)
      }
    }, 300)
    return () => {
      vivo = false
      clearTimeout(t)
    }
  }, [busquedaLibro])

  async function actualizarCampo(campo: keyof CalendarioFecha, valor: string | number | null) {
    if (!ficha) return
    await supabase.from('calendario_fechas').update({ [campo]: valor }).eq('id', ficha.id)
    setRefreshKey((k) => k + 1)
  }

  async function vincular(libroId: string) {
    await supabase.from('calendario_fecha_libros').insert({
      calendario_fecha_id: id,
      libro_id: libroId,
      confirmado_por: editorId,
    })
    if (ficha?.estado_acervo !== 'confirmado') {
      await supabase.from('calendario_fechas').update({ estado_acervo: 'confirmado' }).eq('id', id)
    }
    setBusquedaLibro('')
    setRefreshKey((k) => k + 1)
  }

  async function desvincular(libroId: string) {
    await supabase
      .from('calendario_fecha_libros')
      .delete()
      .eq('calendario_fecha_id', id)
      .eq('libro_id', libroId)
    setRefreshKey((k) => k + 1)
  }

  if (loading || !isEditor || cargando) {
    return (
      <TecaLayout>
        <section className="px-10 py-20 max-w-4xl mx-auto">
          <p className="opacity-70 font-mono">&gt; cargando<span className="animate-pulse">_</span></p>
        </section>
      </TecaLayout>
    )
  }

  if (!ficha) {
    return (
      <TecaLayout>
        <AdminNav />
        <section className="px-10 pt-10 max-w-3xl mx-auto">
          <p className="font-mono text-sm text-text-dim">no se encontro esta ficha.</p>
          <Link href="/admin/calendario" className="font-mono text-sm underline">
            volver al calendario
          </Link>
        </section>
      </TecaLayout>
    )
  }

  return (
    <TecaLayout>
      <AdminNav />
      <section className="px-10 pt-10 pb-20 max-w-3xl mx-auto max-md:px-5 font-mono">
        <Link href="/admin/calendario" className="text-[11px] uppercase tracking-[0.08em] text-text-dim hover:text-text-bright">
          ← calendario de contenido
        </Link>

        <div className="mt-4 mb-8 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-text-dim">dia</span>
            <input
              type="number"
              min={1}
              max={31}
              defaultValue={ficha.dia}
              onBlur={(e) => actualizarCampo('dia', Number(e.target.value))}
              className="bg-transparent border border-rule text-sm px-2 py-1.5 outline-none focus:border-text w-16"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-text-dim">mes</span>
            <select
              defaultValue={ficha.mes}
              onChange={(e) => actualizarCampo('mes', Number(e.target.value))}
              className="bg-transparent border border-rule text-sm px-2 py-1.5 outline-none focus:border-text"
            >
              {MESES.map((m, i) => (
                <option key={m} value={i + 1} className="bg-tinta">
                  {m}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 flex-1 min-w-[220px]">
            <span className="text-[10px] uppercase tracking-wider text-text-dim">categoria</span>
            <select
              defaultValue={ficha.categoria}
              onChange={(e) => actualizarCampo('categoria', e.target.value)}
              className="bg-transparent border border-rule text-sm px-2 py-1.5 outline-none focus:border-text"
            >
              {CATEGORIAS.map((c) => (
                <option key={c.slug} value={c.slug} className="bg-tinta">
                  {c.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <textarea
          defaultValue={ficha.titulo}
          onBlur={(e) => actualizarCampo('titulo', e.target.value)}
          rows={2}
          className="w-full bg-transparent border-b border-rule text-text-bright text-[22px] leading-snug py-1 outline-none focus:border-text resize-none mb-8"
        />

        <Campo label="contexto (3-6 lineas, dato citable + fuente)" valor={ficha.contexto} onGuardar={(v) => actualizarCampo('contexto', v)} filas={5} />
        <Campo label="gancho (angulo de copy sugerido)" valor={ficha.gancho} onGuardar={(v) => actualizarCampo('gancho', v)} filas={3} />
        <Campo label="plan de libros (que buscar / mostrar del catalogo)" valor={ficha.plan_de_libros} onGuardar={(v) => actualizarCampo('plan_de_libros', v)} filas={3} />

        <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1 mb-6">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-text-dim">estado de acervo</span>
            <select
              value={ficha.estado_acervo}
              onChange={(e) => actualizarCampo('estado_acervo', e.target.value as EstadoAcervo)}
              className="bg-transparent border border-rule text-sm px-2 py-1.5 outline-none focus:border-text"
            >
              <option value="confirmado" className="bg-tinta">confirmado en catalogo</option>
              <option value="verificar" className="bg-tinta">verificar en catalogo</option>
              <option value="hueco" className="bg-tinta">hueco de acervo (no inventar)</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-text-dim">tono</span>
            <select
              value={ficha.tono}
              onChange={(e) => actualizarCampo('tono', e.target.value as Tono)}
              className="bg-transparent border border-rule text-sm px-2 py-1.5 outline-none focus:border-text"
            >
              <option value="neutral" className="bg-tinta">neutral</option>
              <option value="requiere_cuidado" className="bg-tinta">requiere cuidado</option>
            </select>
          </label>
        </div>

        {ficha.tono === 'requiere_cuidado' && (
          <Campo
            label="que cuidar (nota de tono)"
            valor={ficha.tono_nota ?? ''}
            onGuardar={(v) => actualizarCampo('tono_nota', v || null)}
            filas={2}
            destacado
          />
        )}

        <Campo
          label="nota interna (decisiones abiertas, correcciones pendientes — no va al post)"
          valor={ficha.nota_interna ?? ''}
          onGuardar={(v) => actualizarCampo('nota_interna', v || null)}
          filas={2}
        />

        {/* ============ LIBROS ============ */}
        <div className="mt-10 pt-8 border-t border-rule">
          <h2 className="text-[11px] uppercase tracking-[0.12em] text-acid mb-4">libros del catalogo</h2>

          {vinculados.length === 0 ? (
            <p className="text-xs text-text-dim mb-5">
              sin libros vinculados todavia. si la busqueda de abajo no encuentra nada, es un hueco de
              acervo real — no inventar un titulo.
            </p>
          ) : (
            <div className="flex flex-col gap-2 mb-6">
              {vinculados.map((v) => (
                <div key={v.libro_id} className="border border-rule p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-text-bright truncate">{v.libros?.titulo ?? '(libro eliminado)'}</p>
                    {v.libros?.autor && <p className="text-xs text-text-dim truncate">{v.libros.autor}</p>}
                  </div>
                  <button
                    onClick={() => desvincular(v.libro_id)}
                    className="shrink-0 text-[10px] uppercase tracking-wider text-text-dim hover:text-loan"
                  >
                    × quitar
                  </button>
                </div>
              ))}
            </div>
          )}

          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-text-dim">buscar en el catalogo real</span>
            <input
              value={busquedaLibro}
              onChange={(e) => setBusquedaLibro(e.target.value)}
              placeholder="titulo o autor..."
              className="bg-transparent border-b border-rule text-sm py-2 outline-none focus:border-text"
            />
          </label>

          {buscando && <p className="text-xs text-text-dim mt-2">buscando...</p>}

          {!buscando && busquedaLibro.trim() && (
            <div className="flex flex-col gap-2 mt-3">
              {resultados.length === 0 ? (
                <p className="text-xs text-loan">
                  sin resultados en el catalogo para &ldquo;{busquedaLibro.trim()}&rdquo; — esto es un hueco de
                  acervo. no mostrar un titulo que no este aqui.
                </p>
              ) : (
                resultados
                  .filter((r) => !vinculados.some((v) => v.libro_id === r.id))
                  .map((r) => (
                    <div key={r.id} className="border border-rule p-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm text-text-bright truncate">{r.titulo}</p>
                        <p className="text-xs text-text-dim truncate">
                          {r.autor ?? 'sin autor'} · {r.teca}
                          {!r.disponible && ' · no disponible'}
                        </p>
                      </div>
                      <button
                        onClick={() => vincular(r.id)}
                        className="shrink-0 text-[10px] uppercase tracking-wider text-acid hover:text-text-bright"
                      >
                        + vincular
                      </button>
                    </div>
                  ))
              )}
            </div>
          )}
        </div>
      </section>
    </TecaLayout>
  )
}

function Campo({
  label,
  valor,
  onGuardar,
  filas = 3,
  destacado = false,
}: {
  label: string
  valor: string
  onGuardar: (v: string) => void
  filas?: number
  destacado?: boolean
}) {
  return (
    <label className="flex flex-col gap-1 mb-6">
      <span className={`text-[10px] uppercase tracking-wider ${destacado ? 'text-loan' : 'text-text-dim'}`}>{label}</span>
      <textarea
        defaultValue={valor}
        onBlur={(e) => onGuardar(e.target.value)}
        rows={filas}
        className={`bg-transparent border p-2.5 text-sm leading-relaxed outline-none focus:border-text resize-y ${
          destacado ? 'border-loan/40' : 'border-rule'
        }`}
      />
    </label>
  )
}
