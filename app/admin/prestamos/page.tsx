'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { comprimirImagen } from '@/lib/imagen'
import { CHECKOUT_STEPS, getMaxObjetosCheckout, setMaxObjetosCheckout } from '@/lib/config'
import TecaLayout from '@/components/TecaLayout'

type Libro = {
  id: string
  titulo: string
  autor: string | null
}

type Perfil = {
  id: string
  handle: string | null
}

type Prestamo = {
  id: string
  status: 'morral' | 'apartado' | 'recogido' | 'devuelto'
  added_at: string
  visit_at: string | null
  picked_up_at: string | null
  returned_at: string | null
  due_at: string | null
  notes: string | null
  user_id: string
  asistencia: 'asistire' | 'no_asistire' | null
  foto_registro_url: string | null
  libros: Libro
  perfiles_publicos: Perfil
}

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

function formatVisita(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  const dia = `${DIAS[d.getDay()].slice(0, 3)} ${d.getDate()} ${MESES[d.getMonth()].slice(0, 3)}`
  const bloque = d.getHours() < 14 ? 'mañana (10-14:30)' : 'tarde (16-19)'
  return `${dia} · ${bloque}`
}

function formatDueDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${d.getDate()} ${MESES[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`
}

function isToday(iso: string | null): boolean {
  if (!iso) return false
  const d = new Date(iso)
  const today = new Date()
  return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate()
}

function isThisWeek(iso: string | null): boolean {
  if (!iso) return false
  const d = new Date(iso)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const inWeek = new Date(today)
  inWeek.setDate(today.getDate() + 7)
  return d >= today && d <= inWeek
}

type Filtro = 'todos' | 'hoy' | 'semana' | 'recogidos' | 'vencidos'

export default function AdminPrestamosPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isEditor, setIsEditor] = useState(false)
  const [prestamos, setPrestamos] = useState<Prestamo[]>([])
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [working, setWorking] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [maxObjetos, setMaxObjetosLocal] = useState<number | null>(null)
  const [savingLimite, setSavingLimite] = useState(false)
  const [limiteMsg, setLimiteMsg] = useState<string | null>(null)
  const [subiendoFoto, setSubiendoFoto] = useState<string | null>(null)

  async function subirFotoRegistro(p: Prestamo, file: File | null) {
    if (!file) return
    setSubiendoFoto(p.id)
    try {
      const comprimida = await comprimirImagen(file, { maxDim: 1200, quality: 0.8 })
      const path = `${p.id}.webp`
      const { error: upErr } = await supabase.storage
        .from('registro')
        .upload(path, comprimida, { upsert: true, contentType: comprimida.type })
      if (upErr) throw new Error(upErr.message)
      const { data: pub } = supabase.storage.from('registro').getPublicUrl(path)
      const url = `${pub.publicUrl}?v=${Date.now()}`
      const { error: updErr } = await supabase
        .from('prestamos')
        .update({ foto_registro_url: url })
        .eq('id', p.id)
      if (updErr) throw new Error(updErr.message)
      setPrestamos((prev) => prev.map((x) => (x.id === p.id ? { ...x, foto_registro_url: url } : x)))
    } catch (e) {
      console.error('foto registro:', e)
      alert('no se pudo subir la foto del ejemplar')
    }
    setSubiendoFoto(null)
  }

  useEffect(() => {
    if (!isEditor) return
    getMaxObjetosCheckout().then(setMaxObjetosLocal)
  }, [isEditor])

  async function guardarLimite(n: number) {
    setSavingLimite(true)
    setLimiteMsg(null)
    const err = await setMaxObjetosCheckout(n)
    if (err) {
      setLimiteMsg(null)
      console.error('error guardando límite:', err)
    } else {
      setMaxObjetosLocal(n)
      setLimiteMsg('✓ guardado')
      setTimeout(() => setLimiteMsg(null), 2500)
    }
    setSavingLimite(false)
  }

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      const { data: perfil } = await supabase
        .from('perfiles')
        .select('rol')
        .eq('id', user.id)
        .single()
      if (perfil?.rol !== 'editor') {
        router.push('/mi-tlacuilo')
        return
      }
      setIsEditor(true)
      setLoading(false)
    }
    check()
  }, [router])

  const loadPrestamos = useCallback(async () => {
    if (!isEditor) return
    const { data, error } = await supabase
      .from('prestamos')
      .select(`
        id, status, added_at, visit_at, picked_up_at, returned_at, due_at, notes, user_id,
        asistencia, foto_registro_url,
        libros (id, titulo, autor),
        perfiles_publicos!user_id (id, handle)
      `)
      .in('status', ['apartado', 'recogido'])
      .order('visit_at', { ascending: true, nullsFirst: false })
    if (error) {
      console.error('error cargando préstamos:', error)
      return
    }
    setPrestamos((data ?? []) as unknown as Prestamo[])
  }, [isEditor, refreshKey])

  useEffect(() => {
    loadPrestamos()
  }, [loadPrestamos])

  async function marcarRecogido(p: Prestamo) {
    setWorking(p.id)
    const pickedUp = new Date()
    const dueAt = new Date(pickedUp)
    dueAt.setDate(dueAt.getDate() + 30)
    const { error } = await supabase
      .from('prestamos')
      .update({
        status: 'recogido',
        picked_up_at: pickedUp.toISOString(),
        due_at: dueAt.toISOString(),
      })
      .eq('id', p.id)
    if (!error) {
      await supabase.from('libros').update({ disponible: false }).eq('id', p.libros.id)
    }
    setWorking(null)
    if (error) {
      alert('error: ' + error.message)
      return
    }
    setRefreshKey((k) => k + 1)
  }

  async function marcarDevuelto(p: Prestamo) {
    setWorking(p.id)
    const { error } = await supabase
      .from('prestamos')
      .update({
        status: 'devuelto',
        returned_at: new Date().toISOString(),
      })
      .eq('id', p.id)
    if (!error) {
      await supabase.from('libros').update({ disponible: true }).eq('id', p.libros.id)
    }
    setWorking(null)
    if (error) {
      alert('error: ' + error.message)
      return
    }
    setRefreshKey((k) => k + 1)
  }

  if (loading) {
    return (
      <TecaLayout>
        <section className="px-10 py-20 max-w-7xl mx-auto">
          <p className="opacity-70 font-mono text-[clamp(13px,1vw,16px)]">
            &gt; verificando permisos<span className="animate-pulse">_</span>
          </p>
        </section>
      </TecaLayout>
    )
  }

  if (!isEditor) return null

  const filtered = prestamos.filter((p) => {
    if (filtro === 'todos') return true
    if (filtro === 'hoy') return p.status === 'apartado' && isToday(p.visit_at)
    if (filtro === 'semana') return p.status === 'apartado' && isThisWeek(p.visit_at)
    if (filtro === 'recogidos') return p.status === 'recogido'
    if (filtro === 'vencidos') return p.status === 'recogido' && p.due_at && new Date(p.due_at) < new Date()
    return true
  })

  const counts = {
    todos: prestamos.length,
    hoy: prestamos.filter((p) => p.status === 'apartado' && isToday(p.visit_at)).length,
    semana: prestamos.filter((p) => p.status === 'apartado' && isThisWeek(p.visit_at)).length,
    recogidos: prestamos.filter((p) => p.status === 'recogido').length,
    vencidos: prestamos.filter((p) => p.status === 'recogido' && p.due_at && new Date(p.due_at) < new Date()).length,
  }

  return (
    <TecaLayout>
      <section className="px-10 pt-8 pb-16 max-w-7xl mx-auto">
        <p className="font-mono uppercase tracking-[0.2em] text-[clamp(10px,0.8vw,13px)] opacity-60 mb-2">
          &gt; admin / préstamos
        </p>
        <h1 className="font-mono leading-tight mb-2 text-[clamp(28px,3.5vw,52px)] uppercase tracking-wide text-text-bright">
          Préstamos activos
        </h1>
        <p className="opacity-70 mb-8 text-[clamp(13px,1vw,17px)]">
          Reservas pendientes de recoger + libros en circulación. Marca al entregar y al recibir.
        </p>

        {/* LÍMITE GLOBAL · objetos por checkout */}
        <div className="border border-rule p-4 mb-6 flex flex-wrap items-center gap-4 font-mono text-xs">
          <span className="uppercase tracking-wider opacity-70">
            límite de objetos por checkout (global):
          </span>
          <select
            value={maxObjetos ?? ''}
            onChange={(e) => guardarLimite(Number(e.target.value))}
            disabled={savingLimite || maxObjetos === null}
            className="bg-tinta text-bone border border-rule-strong px-3 py-2 font-mono text-xs cursor-pointer disabled:opacity-50"
          >
            {CHECKOUT_STEPS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          {savingLimite && <span className="opacity-60">&gt; guardando...</span>}
          {limiteMsg && <span className="text-available">{limiteMsg}</span>}
        </div>

        <div className="border-y border-rule py-4 mb-6 flex flex-wrap items-center gap-2 font-mono text-xs">
          {([
            ['todos', 'todos', counts.todos],
            ['hoy', 'visita hoy', counts.hoy],
            ['semana', 'esta semana', counts.semana],
            ['recogidos', 'en préstamo', counts.recogidos],
            ['vencidos', '⚠ vencidos', counts.vencidos],
          ] as [Filtro, string, number][]).map(([id, label, count]) => (
            <button
              key={id}
              onClick={() => setFiltro(id)}
              className={`px-3 py-2 border uppercase tracking-wider transition-colors ${filtro === id ? 'border-invert-bg bg-invert-bg text-invert-fg' : 'border-rule hover:border-rule-strong'}`}
            >
              {label} ({count})
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="border border-rule p-8 bg-bg-soft text-center font-mono">
            <p className="opacity-70">&gt; no hay préstamos con este filtro</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 font-mono">
            {filtered.map((p) => {
              const vencido = p.status === 'recogido' && p.due_at && new Date(p.due_at) < new Date()
              return (
                <div
                  key={p.id}
                  className={`border p-4 ${vencido ? 'border-loan' : 'border-rule'} bg-bg-soft`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-text-bright text-sm font-medium leading-tight">
                        {p.libros.titulo}
                      </p>
                      <p className="opacity-70 text-xs mt-0.5">
                        {p.libros.autor ?? '—'}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] uppercase tracking-wider">
                        <span className="opacity-70">
                          @{p.perfiles_publicos?.handle ?? 'sin-alias'}
                        </span>
                        {p.status === 'apartado' && (
                          <span className="opacity-70">
                            visita: <span className="text-text-bright">{formatVisita(p.visit_at)}</span>
                          </span>
                        )}
                        {p.status === 'recogido' && (
                          <span className="opacity-70">
                            devolver antes del:{' '}
                            <span className={vencido ? 'text-loan' : 'text-text-bright'}>
                              {formatDueDate(p.due_at)}
                            </span>
                          </span>
                        )}
                        <span className={`uppercase ${p.status === 'apartado' ? 'text-text-bright' : 'text-available'}`}>
                          · {p.status}
                        </span>
                        {p.status === 'apartado' && p.asistencia === 'asistire' && (
                          <span className="text-available">· ✓ confirmó asistencia</span>
                        )}
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        {p.foto_registro_url ? (
                          <a href={p.foto_registro_url} target="_blank" rel="noreferrer" className="block w-12 h-16 overflow-hidden border border-rule shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={p.foto_registro_url} alt="foto del ejemplar" className="w-full h-full object-cover" />
                          </a>
                        ) : null}
                        <label className="font-micro text-[10px] uppercase tracking-[0.08em] text-text-dim cursor-pointer border border-rule px-2 py-1.5 hover:text-text-bright hover:border-rule-strong transition-colors">
                          {subiendoFoto === p.id
                            ? '> subiendo...'
                            : p.foto_registro_url
                              ? 'cambiar foto del ejemplar'
                              : '+ foto del ejemplar'}
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            disabled={subiendoFoto === p.id}
                            onChange={(e) => subirFotoRegistro(p, e.target.files?.[0] ?? null)}
                          />
                        </label>
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      {p.status === 'apartado' && (
                        <button
                          onClick={() => marcarRecogido(p)}
                          disabled={working === p.id}
                          className="px-3 py-2 bg-invert-bg text-invert-fg text-xs uppercase tracking-wider hover:opacity-90 disabled:opacity-40 whitespace-nowrap"
                        >
                          {working === p.id ? '...' : '✓ recogido'}
                        </button>
                      )}
                      {p.status === 'recogido' && (
                        <button
                          onClick={() => marcarDevuelto(p)}
                          disabled={working === p.id}
                          className="px-3 py-2 bg-invert-bg text-invert-fg text-xs uppercase tracking-wider hover:opacity-90 disabled:opacity-40 whitespace-nowrap"
                        >
                          {working === p.id ? '...' : '↩ devuelto'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </TecaLayout>
  )
}
