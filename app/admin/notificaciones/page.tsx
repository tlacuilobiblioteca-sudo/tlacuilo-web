'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import TecaLayout from '@/components/TecaLayout'

const SEEN_KEY = 'tlacuilo:notif:lastSeen'

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

function fechaCorta(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${DIAS[d.getDay()].slice(0, 3)} ${d.getDate()} ${MESES[d.getMonth()]}`
}

function fechaHora(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  const hh = d.getHours().toString().padStart(2, '0')
  const mm = d.getMinutes().toString().padStart(2, '0')
  return `${fechaCorta(iso)} · ${hh}:${mm}`
}

function bloque(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).getHours() < 14 ? 'mañana' : 'tarde'
}

function isToday(iso: string | null): boolean {
  if (!iso) return false
  const d = new Date(iso)
  const t = new Date()
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate()
}

type PerfilRef = { handle: string | null } | null
type LibroRef = { titulo: string; autor: string | null } | null

type Reserva = {
  id: string
  added_at: string
  visit_at: string | null
  libros: LibroRef
  perfiles_publicos: PerfilRef
}
type Lector = { id: string; handle: string | null; created_at: string; rol: string }
type Vencido = {
  id: string
  due_at: string | null
  libros: LibroRef
  perfiles_publicos: PerfilRef
}

export default function AdminNotificacionesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isEditor, setIsEditor] = useState(false)
  const [prevSeen, setPrevSeen] = useState<number>(() => Date.now())

  const [reservas, setReservas] = useState<Reserva[]>([])
  const [lectores, setLectores] = useState<Lector[]>([])
  const [vencidos, setVencidos] = useState<Vencido[]>([])
  const [hoy, setHoy] = useState<Reserva[]>([])

  // Lee la última visita ANTES de sobreescribirla, para marcar lo nuevo.
  useEffect(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem(SEEN_KEY) : null
    if (stored) {
      setPrevSeen(new Date(stored).getTime())
    } else {
      setPrevSeen(Date.now())
    }
  }, [])

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      const { data: perfil } = await supabase.from('perfiles').select('rol').eq('id', user.id).single()
      if (perfil?.rol !== 'editor') {
        router.push('/mi-tlacuilo')
        return
      }
      setIsEditor(true)
      setLoading(false)
    }
    check()
  }, [router])

  const load = useCallback(async () => {
    if (!isEditor) return
    const ahora = new Date().toISOString()

    const [r1, r2, r3] = await Promise.all([
      supabase
        .from('prestamos')
        .select('id, added_at, visit_at, libros (titulo, autor), perfiles_publicos!user_id (handle)')
        .eq('status', 'apartado')
        .order('added_at', { ascending: false }),
      supabase
        .from('perfiles_publicos')
        .select('id, handle, created_at, rol')
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('prestamos')
        .select('id, due_at, libros (titulo, autor), perfiles_publicos!user_id (handle)')
        .eq('status', 'recogido')
        .lt('due_at', ahora)
        .order('due_at', { ascending: true }),
    ])

    const apartados = (r1.data ?? []) as unknown as Reserva[]
    setReservas(apartados)
    setHoy(apartados.filter((p) => isToday(p.visit_at)))
    setLectores((r2.data ?? []) as unknown as Lector[])
    setVencidos((r3.data ?? []) as unknown as Vencido[])

    // Ya viste todo: marca la visita y resetea el badge.
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SEEN_KEY, ahora)
    }
  }, [isEditor])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <TecaLayout>
        <section className="px-10 py-20 max-w-5xl mx-auto">
          <p className="opacity-70 font-mono text-[clamp(13px,1vw,16px)]">
            &gt; verificando permisos<span className="animate-pulse">_</span>
          </p>
        </section>
      </TecaLayout>
    )
  }
  if (!isEditor) return null

  const esNuevo = (iso: string) => new Date(iso).getTime() > prevSeen
  const nuevasReservas = reservas.filter((r) => esNuevo(r.added_at)).length
  const nuevosLectores = lectores.filter((l) => esNuevo(l.created_at)).length

  return (
    <TecaLayout>
      <section className="px-10 pt-8 pb-16 max-w-5xl mx-auto max-md:px-5 font-mono">
        <p className="uppercase tracking-[0.2em] text-[clamp(10px,0.8vw,13px)] opacity-60 mb-2">
          &gt; admin / notificaciones
        </p>
        <h1 className="leading-tight mb-2 text-[clamp(28px,3.5vw,52px)] uppercase tracking-wide text-text-bright">
          Notificaciones
        </h1>
        <p className="opacity-70 mb-10 text-[clamp(13px,1vw,17px)]">
          Lo que ha pasado en el acervo. Lo marcado como nuevo apareció desde tu última visita.
        </p>

        {/* NUEVAS RESERVAS */}
        <Categoria titulo="Nuevas reservas" nuevos={nuevasReservas} total={reservas.length} vacio="nadie ha apartado todavía.">
          {reservas.map((r) => (
            <Fila key={r.id} nuevo={esNuevo(r.added_at)}>
              <span className="text-text-bright">@{r.perfiles_publicos?.handle ?? 'sin-alias'}</span>
              <span className="opacity-70"> apartó </span>
              <span className="text-text-bright">{r.libros?.titulo ?? '—'}</span>
              <span className="opacity-50"> · visita {fechaCorta(r.visit_at)} ({bloque(r.visit_at)})</span>
              <span className="opacity-40 block text-[11px] mt-0.5">{fechaHora(r.added_at)}</span>
            </Fila>
          ))}
        </Categoria>

        {/* NUEVOS LECTORES */}
        <Categoria titulo="Nuevos lectores" nuevos={nuevosLectores} total={lectores.length} vacio="aún no hay perfiles.">
          {lectores.map((l) => (
            <Fila key={l.id} nuevo={esNuevo(l.created_at)}>
              <span className="text-text-bright">@{l.handle ?? 'sin-alias'}</span>
              <span className="opacity-70"> se unió</span>
              {l.rol === 'editor' && <span className="text-acid"> · editor</span>}
              <span className="opacity-40 block text-[11px] mt-0.5">{fechaCorta(l.created_at)}</span>
            </Fila>
          ))}
        </Categoria>

        {/* VISITAS DE HOY */}
        <Categoria titulo="Visitas de hoy" nuevos={0} total={hoy.length} vacio="nadie viene hoy.">
          {hoy.map((r) => (
            <Fila key={r.id} nuevo={false}>
              <span className="text-text-bright">@{r.perfiles_publicos?.handle ?? 'sin-alias'}</span>
              <span className="opacity-70"> viene por </span>
              <span className="text-text-bright">{r.libros?.titulo ?? '—'}</span>
              <span className="opacity-50"> · {bloque(r.visit_at)}</span>
            </Fila>
          ))}
        </Categoria>

        {/* DEVOLUCIONES VENCIDAS */}
        <Categoria titulo="Devoluciones vencidas" nuevos={0} total={vencidos.length} vacio="nada vencido. todo en orden." alerta>
          {vencidos.map((v) => (
            <Fila key={v.id} nuevo={false} alerta>
              <span className="text-text-bright">@{v.perfiles_publicos?.handle ?? 'sin-alias'}</span>
              <span className="opacity-70"> no ha devuelto </span>
              <span className="text-text-bright">{v.libros?.titulo ?? '—'}</span>
              <span className="text-loan"> · venció {fechaCorta(v.due_at)}</span>
            </Fila>
          ))}
        </Categoria>

        <div className="mt-10 pt-6 border-t border-rule text-[clamp(11px,0.85vw,13px)] opacity-70">
          <Link href="/admin/prestamos" className="underline hover:no-underline">
            ir a gestionar préstamos →
          </Link>
        </div>
      </section>
    </TecaLayout>
  )
}

function Categoria({
  titulo,
  nuevos,
  total,
  vacio,
  alerta = false,
  children,
}: {
  titulo: string
  nuevos: number
  total: number
  vacio: string
  alerta?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="mb-10 border-t border-rule pt-6">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="uppercase tracking-wide text-[clamp(15px,1.5vw,20px)] text-text-bright">
          {titulo}
        </h2>
        <span className="text-[11px] uppercase tracking-wider">
          {nuevos > 0 && <span className="text-acid">{nuevos} nuevo{nuevos === 1 ? '' : 's'} · </span>}
          <span className={alerta && total > 0 ? 'text-loan' : 'opacity-50'}>{total} total</span>
        </span>
      </div>
      {total === 0 ? (
        <p className="opacity-50 text-[clamp(12px,0.95vw,14px)]">&gt; {vacio}</p>
      ) : (
        <div className="flex flex-col gap-2">{children}</div>
      )}
    </div>
  )
}

function Fila({
  nuevo,
  alerta = false,
  children,
}: {
  nuevo: boolean
  alerta?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={`border p-3 text-[clamp(12px,0.95vw,14px)] ${alerta ? 'border-loan/50' : 'border-rule'} bg-bg-soft ${nuevo ? 'border-l-2 border-l-acid' : ''}`}>
      {nuevo && <span className="text-acid text-[10px] uppercase tracking-wider mr-2">· nuevo</span>}
      {children}
    </div>
  )
}
