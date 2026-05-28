'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import TecaLayout from '@/components/TecaLayout'
import Cover from '@/components/Cover'

type Perfil = {
  id: string
  handle: string | null
  bio: string | null
  rol: string
  created_at: string
}

type Libro = {
  id: string
  titulo: string
  autor: string | null
  anio: number | null
  portada_url: string | null
  isbn: string | null
}

type Prestamo = {
  id: string
  status: 'morral' | 'apartado' | 'recogido' | 'devuelto'
  added_at: string
  visit_at: string | null
  libros: Libro
}

function formatVisita(iso: string): string {
  const d = new Date(iso)
  const dia = d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })
  const bloque = d.getHours() < 14 ? 'mañana' : 'tarde'
  return `${dia} · ${bloque}`
}

export default function MiTlacuiloPage() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [correo, setCorreo] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [morral, setMorral] = useState<Prestamo[]>([])
  const [visitas, setVisitas] = useState<Prestamo[]>([])

  const [bioDraft, setBioDraft] = useState('')
  const [savingBio, setSavingBio] = useState(false)
  const [bioMsg, setBioMsg] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!mounted) return
      if (!user) {
        router.push('/login')
        return
      }
      setCorreo(user.email ?? null)

      const [{ data: perfilData }, { data: prestamosData }] = await Promise.all([
        supabase
          .from('perfiles')
          .select('id, handle, bio, rol, created_at')
          .eq('id', user.id)
          .single<Perfil>(),
        supabase
          .from('prestamos')
          .select('id, status, added_at, visit_at, libros (id, titulo, autor, anio, portada_url, isbn)')
          .eq('user_id', user.id)
          .in('status', ['morral', 'apartado', 'recogido'])
          .order('added_at', { ascending: false }),
      ])

      if (!mounted) return

      if (perfilData) {
        setPerfil(perfilData)
        setBioDraft(perfilData.bio ?? '')
      }

      if (prestamosData) {
        const all = prestamosData as unknown as Prestamo[]
        setMorral(all.filter((p) => p.status === 'morral'))
        setVisitas(all.filter((p) => p.status === 'apartado' || p.status === 'recogido'))
      }

      setLoading(false)
    }

    load()
    return () => { mounted = false }
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleSaveBio = async () => {
    if (!perfil) return
    setSavingBio(true)
    setBioMsg(null)
    const { error } = await supabase.from('perfiles').update({ bio: bioDraft.trim() || null }).eq('id', perfil.id)
    setSavingBio(false)
    if (error) {
      setBioMsg('> error al guardar')
    } else {
      setPerfil({ ...perfil, bio: bioDraft.trim() || null })
      setBioMsg('> guardado ✓')
      setTimeout(() => setBioMsg(null), 2500)
    }
  }

  const handleRemoveFromMorral = async (prestamoId: string) => {
    const { error } = await supabase.from('prestamos').delete().eq('id', prestamoId)
    if (!error) setMorral((m) => m.filter((p) => p.id !== prestamoId))
  }

  if (loading) {
    return (
      <TecaLayout>
        <section className="px-10 py-20 max-w-7xl mx-auto">
          <p className="opacity-70 font-mono text-[clamp(13px,1vw,16px)]">
            &gt; cargando tu tlacuilo<span className="animate-pulse">_</span>
          </p>
        </section>
      </TecaLayout>
    )
  }

  const alias = perfil?.handle ?? 'sin-alias'
  const bioChanged = (bioDraft.trim() || null) !== (perfil?.bio ?? null)

  return (
    <TecaLayout>
      <section className="px-10 pt-10 pb-12 max-w-7xl mx-auto max-md:px-5">
        <p className="font-micro uppercase tracking-[0.12em] text-[11px] text-text-dim mb-3">
          mi tlacuilo
        </p>
        <h1 className="font-sans font-light leading-none mb-3 text-[clamp(34px,4vw,56px)] tracking-[-0.01em] text-text">
          Hola, {alias}.
        </h1>
        <p className="text-[clamp(13px,1vw,15px)] text-text-dim mb-10">
          tu perfil público está en{' '}
          <Link href={`/u/${alias}`} className="text-text underline hover:text-text-bright transition-colors">
            tlacuilo.org/u/{alias}
          </Link>
        </p>

        {perfil?.rol === 'editor' && (
          <div className="mb-14">
            <div className="font-micro uppercase tracking-[0.12em] text-[10px] text-dirty mb-3">
              · zona editora · administración tlacuilo
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/libros"
                className="inline-flex items-baseline gap-2 bg-tinta text-bone border border-tinta rounded-sm px-3 py-2 font-micro text-[11px] uppercase tracking-[0.08em] hover:bg-dirty hover:text-tinta transition-colors"
              >
                Libros · agregar / editar
              </Link>
              <Link
                href="/admin/portadas"
                className="inline-flex items-baseline gap-2 bg-tinta text-bone border border-tinta rounded-sm px-3 py-2 font-micro text-[11px] uppercase tracking-[0.08em] hover:bg-dirty hover:text-tinta transition-colors"
              >
                Portadas · subir
              </Link>
              <Link
                href="/admin/prestamos"
                className="inline-flex items-baseline gap-2 bg-tinta text-bone border border-tinta rounded-sm px-3 py-2 font-micro text-[11px] uppercase tracking-[0.08em] hover:bg-dirty hover:text-tinta transition-colors"
              >
                Préstamos activos
              </Link>
              <Link
                href="/admin/selecciones"
                className="inline-flex items-baseline gap-2 bg-tinta text-bone border border-tinta rounded-sm px-3 py-2 font-micro text-[11px] uppercase tracking-[0.08em] hover:bg-dirty hover:text-tinta transition-colors"
              >
                Selecciones del landing
              </Link>
              <Link
                href="/admin/eventos"
                className="inline-flex items-baseline gap-2 bg-tinta text-bone border border-tinta rounded-sm px-3 py-2 font-micro text-[11px] uppercase tracking-[0.08em] hover:bg-dirty hover:text-tinta transition-colors"
              >
                Eventos del calendario
              </Link>
            </div>
          </div>
        )}

        <div className="mb-14 border-t border-rule pt-8">
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="font-sans font-light text-[clamp(22px,2.4vw,34px)] tracking-[-0.005em] text-text">
              Mi morral
            </h2>
            <span className="font-micro text-[10px] uppercase tracking-[0.12em] text-dirty">
              {morral.length} {morral.length === 1 ? 'libro' : 'libros'}
            </span>
          </div>

          {morral.length === 0 ? (
            <div className="border border-rule p-6 bg-bg-soft">
              <p className="font-mono text-sm opacity-70 mb-3">
                &gt; tu morral está vacío.
              </p>
              <Link href="/biblioteca" className="font-mono text-xs uppercase tracking-wider underline hover:text-text-bright">
                explorar la biblioteca →
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                {morral.map((p) => (
                  <div key={p.id} className="flex flex-col gap-2">
                    <Link href={`/biblioteca/${p.libros.id}`} className="block group">
                      <div className="aspect-[2/3] bg-bg-soft flex items-center justify-center text-text-dim p-2 text-center overflow-hidden text-[10px] mb-2 group-hover:opacity-90 transition-opacity">
                        <Cover titulo={p.libros.titulo} portada_url={p.libros.portada_url} isbn={p.libros.isbn} autor={p.libros.autor} />
                      </div>
                      <p className="font-medium leading-tight text-[clamp(11px,0.9vw,14px)] line-clamp-2">{p.libros.titulo}</p>
                      <p className="opacity-70 text-[10px] line-clamp-1">{p.libros.autor ?? '—'}</p>
                    </Link>
                    <button
                      onClick={() => handleRemoveFromMorral(p.id)}
                      className="font-mono text-[10px] uppercase tracking-wider opacity-60 hover:opacity-100 hover:text-loan text-left transition-colors"
                    >
                      × quitar
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex items-center gap-4">
                <Link
                  href="/checkout"
                  className="font-mono text-sm lowercase tracking-wider bg-invert-bg text-invert-fg px-6 py-3 hover:opacity-90 transition-opacity inline-block"
                >
                  agendar visita →
                </Link>
                <span className="font-mono text-xs opacity-50 uppercase tracking-wider">
                  lun-vie · mín. 1 día de anticipación
                </span>
              </div>
            </>
          )}
        </div>

        <div className="mb-14 border-t border-rule pt-8">
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="font-sans font-light text-[clamp(22px,2.4vw,34px)] tracking-[-0.005em] text-text">
              Mis visitas
            </h2>
            <span className="font-micro text-[10px] uppercase tracking-[0.12em] text-dirty">
              {visitas.length} {visitas.length === 1 ? 'libro' : 'libros'}
            </span>
          </div>

          {visitas.length === 0 ? (
            <div className="border border-rule p-6 bg-bg-soft">
              <p className="font-mono text-sm opacity-70">
                &gt; aún no tienes visitas agendadas.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {visitas.map((p) => (
                <Link key={p.id} href={`/biblioteca/${p.libros.id}`} className="block opacity-95 hover:opacity-100">
                  <div className="aspect-[2/3] bg-bg-soft flex items-center justify-center text-text-dim p-2 text-center overflow-hidden text-[10px] mb-2">
                    <Cover titulo={p.libros.titulo} portada_url={p.libros.portada_url} isbn={p.libros.isbn} autor={p.libros.autor} />
                  </div>
                  <p className="font-medium leading-tight text-[clamp(11px,0.9vw,14px)] line-clamp-2">{p.libros.titulo}</p>
                  <p className="opacity-70 text-[10px] line-clamp-1">{p.libros.autor ?? '—'}</p>
                  <p className="font-mono text-[10px] uppercase tracking-wider mt-1 opacity-70">
                    {p.visit_at ? <>· {formatVisita(p.visit_at)}</> : null}
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-wider opacity-50">
                    · {p.status === 'apartado' ? 'apartado' : 'recogido'}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-rule pt-8 mt-4">
          <h2 className="font-micro uppercase tracking-[0.12em] text-[11px] text-text-dim mb-2">
            tu bio · la ven los demás
          </h2>
          <p className="opacity-50 text-[10px] mb-3">
            &gt; máx. 280 caracteres · una línea, una frase, lo que quieras decir.
          </p>
          <textarea
            value={bioDraft}
            onChange={(e) => setBioDraft(e.target.value.slice(0, 280))}
            placeholder="ej: lectora de novela latinoamericana del XX, devuelvo a tiempo."
            rows={3}
            className="w-full bg-bg-soft border border-rule focus:border-rule-strong focus:outline-none p-3 font-mono text-[clamp(12px,0.95vw,15px)] text-text-bright placeholder:opacity-30 resize-none"
          />
          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={handleSaveBio}
              disabled={savingBio || !bioChanged}
              className="uppercase tracking-wide hover:underline disabled:opacity-40 disabled:cursor-not-allowed text-[clamp(11px,0.9vw,14px)]"
            >
              {savingBio ? <>&gt; guardando<span className="animate-pulse">_</span></> : <>&gt; guardar bio</>}
            </button>
            <span className="opacity-50 text-[10px]">{bioDraft.length}/280</span>
            {bioMsg && (
              <span className={`text-[10px] uppercase tracking-wider ${bioMsg.includes('✓') ? 'text-available' : 'text-loan'}`}>
                {bioMsg}
              </span>
            )}
          </div>
        </div>

        <div className="border-t border-rule pt-8 mt-12">
          <h2 className="font-micro uppercase tracking-[0.12em] text-[11px] text-text-dim mb-4">
            tu identidad · solo tú la ves
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-8 text-[clamp(12px,0.95vw,15px)] mb-8">
            <div>
              <dt className="opacity-50 uppercase tracking-wide text-[10px]">alias .......:</dt>
              <dd className="text-text-bright">{alias}</dd>
            </div>
            <div>
              <dt className="opacity-50 uppercase tracking-wide text-[10px]">correo .....:</dt>
              <dd>{correo ?? '—'}</dd>
            </div>
            <div>
              <dt className="opacity-50 uppercase tracking-wide text-[10px]">rol ........:</dt>
              <dd>{perfil?.rol ?? 'lector'}</dd>
            </div>
            <div>
              <dt className="opacity-50 uppercase tracking-wide text-[10px]">desde ......:</dt>
              <dd>
                {perfil?.created_at
                  ? new Date(perfil.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'long' })
                  : '—'}
              </dd>
            </div>
          </dl>
          <button onClick={handleLogout} className="uppercase tracking-wide hover:underline text-[clamp(11px,0.9vw,14px)]">
            &gt; salir
          </button>
        </div>
      </section>
    </TecaLayout>
  )
}
