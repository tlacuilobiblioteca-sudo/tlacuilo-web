'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'

type Perfil = {
  id: string
  nombre_completo: string | null
  telefono: string | null
  rol: string
  created_at: string
}

export default function MiTlacuiloPage() {
  const router = useRouter()
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [correo, setCorreo] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push('/login')
        return
      }
      setCorreo(user.email ?? null)

      const { data } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setPerfil(data as Perfil)
      setLoading(false)
    })
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#9794C4] text-black font-sans">
        <Header />
        <section className="px-8 py-20 max-w-7xl mx-auto">
          <p className="opacity-70 text-[clamp(13px,1vw,16px)]">Cargando tu Tlacuilo...</p>
        </section>
      </main>
    )
  }

  const primerNombre = perfil?.nombre_completo?.split(' ')[0] ?? 'Lectora'

  return (
    <main className="min-h-screen bg-[#9794C4] text-black font-sans">
      <Header />

      <section className="px-8 pt-8 pb-12 max-w-7xl mx-auto">
        <h1 className="font-bold leading-tight mb-2 text-[clamp(28px,3vw,48px)]">
          Hola, {primerNombre}
        </h1>
        <p className="opacity-70 mb-12 text-[clamp(13px,1vw,17px)]">
          Bienvenida a tu Tlacuilo.
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <div className="bg-black/10 p-6">
            <h2 className="font-bold uppercase tracking-wide mb-3 text-[clamp(11px,0.9vw,14px)]">
              Tus préstamos activos
            </h2>
            <p className="opacity-70 text-[clamp(11px,0.9vw,14px)]">
              Todavía no has apartado ningún libro.
            </p>
            <a
              href="/biblioteca"
              className="inline-block mt-4 uppercase tracking-wide hover:underline text-[clamp(11px,0.9vw,14px)]"
            >
              Explorar biblioteca →
            </a>
          </div>

          <div className="bg-black/10 p-6">
            <h2 className="font-bold uppercase tracking-wide mb-3 text-[clamp(11px,0.9vw,14px)]">
              Tu wishlist
            </h2>
            <p className="opacity-70 text-[clamp(11px,0.9vw,14px)]">
              Aún no has agregado libros a tu wishlist.
            </p>
          </div>
        </div>

        <div className="border-t border-black/20 pt-8 mt-8">
          <h2 className="font-bold uppercase tracking-wide mb-4 text-[clamp(11px,0.9vw,14px)]">
            Información de tu cuenta
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-8 text-[clamp(12px,0.95vw,15px)] mb-6">
            <div>
              <dt className="opacity-60 uppercase tracking-wide text-[clamp(10px,0.8vw,12px)]">Nombre</dt>
              <dd>{perfil?.nombre_completo ?? '—'}</dd>
            </div>
            <div>
              <dt className="opacity-60 uppercase tracking-wide text-[clamp(10px,0.8vw,12px)]">Correo</dt>
              <dd>{correo ?? '—'}</dd>
            </div>
            <div>
              <dt className="opacity-60 uppercase tracking-wide text-[clamp(10px,0.8vw,12px)]">Teléfono</dt>
              <dd>{perfil?.telefono ?? '—'}</dd>
            </div>
            <div>
              <dt className="opacity-60 uppercase tracking-wide text-[clamp(10px,0.8vw,12px)]">Tipo de cuenta</dt>
              <dd className="capitalize">{perfil?.rol ?? 'miembro'}</dd>
            </div>
          </dl>

          <button
            onClick={handleLogout}
            className="uppercase tracking-wide hover:underline text-[clamp(11px,0.9vw,14px)]"
          >
            Cerrar sesión
          </button>
        </div>
      </section>
    </main>
  )
}
