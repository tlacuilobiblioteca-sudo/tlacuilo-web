'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

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

type Borrador = {
  titulo: string
  descripcion: string
  fecha_inicio: string // formato datetime-local
  fecha_fin: string
  ubicacion: string
  url: string
}

const BORRADOR_VACIO: Borrador = {
  titulo: '',
  descripcion: '',
  fecha_inicio: '',
  fecha_fin: '',
  ubicacion: '',
  url: '',
}

/* ============================================================
   Helpers
   ============================================================ */

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    d.getFullYear() +
    '-' +
    pad(d.getMonth() + 1) +
    '-' +
    pad(d.getDate()) +
    'T' +
    pad(d.getHours()) +
    ':' +
    pad(d.getMinutes())
  )
}

function fromDatetimeLocal(v: string): string | null {
  if (!v) return null
  return new Date(v).toISOString()
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
   Lista de eventos (pública) + edición inline para editores
   ============================================================ */

export default function ListaEventos({ eventos, year }: { eventos: Evento[]; year: number }) {
  const router = useRouter()
  const [esEditor, setEsEditor] = useState(false)

  // 'nuevo' abre el form de creación; un id abre la edición de ese evento.
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [borrador, setBorrador] = useState<Borrador>(BORRADOR_VACIO)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let activo = true
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: perfil } = await supabase
        .from('perfiles')
        .select('rol')
        .eq('id', user.id)
        .single()
      if (activo && perfil?.rol === 'editor') setEsEditor(true)
    }
    check()
    return () => {
      activo = false
    }
  }, [])

  const abrirNuevo = () => {
    setEditandoId('nuevo')
    setBorrador(BORRADOR_VACIO)
    setError(null)
  }

  const abrirEdicion = (e: Evento) => {
    setEditandoId(e.id)
    setBorrador({
      titulo: e.titulo,
      descripcion: e.descripcion ?? '',
      fecha_inicio: toDatetimeLocal(e.fecha_inicio),
      fecha_fin: toDatetimeLocal(e.fecha_fin),
      ubicacion: e.ubicacion ?? '',
      url: e.url ?? '',
    })
    setError(null)
  }

  const cerrar = () => {
    setEditandoId(null)
    setError(null)
  }

  const guardar = async () => {
    if (!borrador.titulo.trim() || !borrador.fecha_inicio) {
      setError('título y fecha de inicio son obligatorios.')
      return
    }
    setGuardando(true)
    setError(null)
    const payload = {
      titulo: borrador.titulo.trim(),
      descripcion: borrador.descripcion.trim() || null,
      fecha_inicio: fromDatetimeLocal(borrador.fecha_inicio),
      fecha_fin: fromDatetimeLocal(borrador.fecha_fin),
      ubicacion: borrador.ubicacion.trim() || null,
      url: borrador.url.trim() || null,
    }
    const { error: dbError } =
      editandoId === 'nuevo'
        ? await supabase.from('eventos').insert(payload)
        : await supabase.from('eventos').update(payload).eq('id', editandoId as string)
    setGuardando(false)
    if (dbError) {
      setError(dbError.message.toLowerCase())
      return
    }
    cerrar()
    router.refresh()
  }

  const eliminar = async () => {
    if (editandoId === null || editandoId === 'nuevo') return
    if (!window.confirm('¿eliminar este evento del calendario?')) return
    setGuardando(true)
    const { error: dbError } = await supabase.from('eventos').delete().eq('id', editandoId)
    setGuardando(false)
    if (dbError) {
      setError(dbError.message.toLowerCase())
      return
    }
    cerrar()
    router.refresh()
  }

  /* ============ Formulario inline (nuevo y edición) ============ */

  const formulario = (
    <div className="border border-rule bg-bg-soft p-5 flex flex-col gap-3 max-w-[640px]">
      <input
        value={borrador.titulo}
        onChange={(e) => setBorrador({ ...borrador, titulo: e.target.value })}
        placeholder="título *"
        autoFocus
        className="bg-transparent border-b border-rule font-mono text-sm py-2 outline-none focus:border-text text-text placeholder:text-text-dim"
      />
      <textarea
        value={borrador.descripcion}
        onChange={(e) => setBorrador({ ...borrador, descripcion: e.target.value })}
        placeholder="descripción"
        rows={3}
        className="bg-transparent border border-rule font-mono text-xs p-2 outline-none focus:border-text text-text placeholder:text-text-dim resize-y"
      />
      <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
        <label className="flex flex-col gap-1">
          <span className="font-micro text-[10px] uppercase tracking-[0.08em] text-text-dim">
            fecha inicio *
          </span>
          <input
            type="datetime-local"
            value={borrador.fecha_inicio}
            onChange={(e) => setBorrador({ ...borrador, fecha_inicio: e.target.value })}
            className="bg-transparent border border-rule font-mono text-xs px-2 py-1.5 outline-none focus:border-text text-text"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-micro text-[10px] uppercase tracking-[0.08em] text-text-dim">
            fecha fin (opcional)
          </span>
          <input
            type="datetime-local"
            value={borrador.fecha_fin}
            onChange={(e) => setBorrador({ ...borrador, fecha_fin: e.target.value })}
            className="bg-transparent border border-rule font-mono text-xs px-2 py-1.5 outline-none focus:border-text text-text"
          />
        </label>
      </div>
      <input
        value={borrador.ubicacion}
        onChange={(e) => setBorrador({ ...borrador, ubicacion: e.target.value })}
        placeholder="ubicación"
        className="bg-transparent border-b border-rule font-mono text-xs py-2 outline-none focus:border-text text-text placeholder:text-text-dim"
      />
      <input
        value={borrador.url}
        onChange={(e) => setBorrador({ ...borrador, url: e.target.value })}
        placeholder="url (opcional)"
        className="bg-transparent border-b border-rule font-mono text-xs py-2 outline-none focus:border-text text-text placeholder:text-text-dim"
      />

      {error && (
        <p className="font-mono text-[12px] text-loan">&gt; error: {error}</p>
      )}

      <div className="flex items-center gap-3 flex-wrap mt-1">
        <button
          onClick={guardar}
          disabled={guardando || !borrador.titulo.trim() || !borrador.fecha_inicio}
          className="inline-flex items-center bg-brillante text-bone border border-tinta rounded-sm px-4 py-2 font-micro text-[11px] uppercase tracking-[0.08em] disabled:opacity-30 hover:bg-tinta hover:text-acid transition-colors"
        >
          {guardando ? 'guardando...' : editandoId === 'nuevo' ? 'crear evento' : 'guardar cambios'}
        </button>
        <button
          onClick={cerrar}
          disabled={guardando}
          className="inline-flex items-center border border-rule rounded-sm px-3 py-2 font-micro text-[11px] uppercase tracking-[0.08em] text-text-dim hover:text-text transition-colors"
        >
          cancelar
        </button>
        {editandoId !== 'nuevo' && (
          <button
            onClick={eliminar}
            disabled={guardando}
            className="ml-auto inline-flex items-center border border-rule rounded-sm px-3 py-2 font-micro text-[10px] uppercase tracking-[0.08em] text-text-dim hover:bg-loan hover:text-bg hover:border-loan transition-colors"
          >
            × eliminar
          </button>
        )}
      </div>
    </div>
  )

  /* ============ Render ============ */

  return (
    <section className="px-10 pt-10 pb-16 max-md:px-5">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
        <h2 className="font-sans font-light text-[clamp(22px,2.4vw,34px)] tracking-[-0.005em] text-text">
          Eventos del año
        </h2>
        {esEditor && editandoId === null && (
          <button
            onClick={abrirNuevo}
            className="inline-flex items-center border border-tinta rounded-sm px-3 py-2 font-micro text-[11px] uppercase tracking-[0.08em] bg-tinta text-bone hover:bg-brillante transition-colors"
          >
            + nuevo evento
          </button>
        )}
      </div>

      {esEditor && editandoId === 'nuevo' && <div className="mb-8">{formulario}</div>}

      {eventos.length === 0 && editandoId !== 'nuevo' ? (
        <p className="font-mono text-sm text-text-dim lowercase">
          sin eventos registrados en {year}.
        </p>
      ) : (
        <ul className="flex flex-col gap-8 max-w-4xl">
          {eventos.map((e) => (
            <li key={e.id} className="border-t border-rule pt-6">
              {editandoId === e.id ? (
                formulario
              ) : (
                <>
                  <div className="font-micro text-[11px] uppercase tracking-[0.12em] text-acid mb-2">
                    {formatFechaLarga(e.fecha_inicio)}
                    {e.fecha_fin && (
                      <span className="text-text-dim">
                        {' '}a {formatFechaCorta(e.fecha_fin)}
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

                  <div className="flex items-center gap-5 flex-wrap">
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
                    {esEditor && editandoId === null && (
                      <button
                        onClick={() => abrirEdicion(e)}
                        className="inline-block font-micro text-[11px] uppercase tracking-[0.12em] text-text-dim hover:text-acid underline"
                      >
                        editar
                      </button>
                    )}
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
