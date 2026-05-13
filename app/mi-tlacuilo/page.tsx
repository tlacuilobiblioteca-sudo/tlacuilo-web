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
      <main className="min-h-screen bg-[#15151d] text-[#9091c4] font-futura">
        <Header />
        <section className="px-10 py-20 max-w-7xl mx-auto">
          <p className="opacity-70 font-mono text-[clamp(13px,1vw,16px)]">
            &gt; cargando tu tlacuilo<span className="animate-pulse">_</span>
          </p>
        </section>
      </main>
    )
  }

  const primerNombre = perfil?.nombre_completo?.split(' ')[0] ?? 'lectora'

  return (
    <main className="min-h-screen bg-[#15151d] text-[#9091c4] font-futura">
      <Header />

      <section className="px-10 pt-8 pb-12 max-w-7xl mx-auto">
        <h1 className="font-sonoran leading-tight mb-2 text-[clamp(28px,3vw,48px)] uppercase tracking-wide">
          Hola, {primerNombre}
        </h1>
        <p className="opacity-70 mb-12 text-[clamp(13px,1vw,17px)]">
          Bienvenida a tu Tlacuilo.
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <div className="bg-[#9091c4]/8 p-6 border border-[#9091c4]/15">
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

          <div className="bg-[#9091c4]/8 p-6 border border-[#9091c4]/15">
            <h2 className="font-bold uppercase tracking-wide mb-3 text-[clamp(11px,0.9vw,14px)]">
              Tu wishlist
            </h2>
            <p className="opacity-70 text-[clamp(11px,0.9vw,14px)]">
              Aún no has agregado libros a tu wishlist.
            </p>
          </div>
        </div>

        <div className="border-t border-[#9091c4]/20 pt-8 mt-8 font-mono">
          <h2 className="uppercase tracking-wide mb-4 opacity-70 text-[clamp(11px,0.9vw,14px)]">
            // tu identidad (solo tú lo ves)
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-8 text-[clamp(12px,0.95vw,15px)] mb-8">
            <div>
              <dt className="opacity-50 uppercase tracking-wide text-[clamp(10px,0.8vw,12px)]">nombre .....:</dt>
              <dd>{perfil?.nombre_completo ?? '—'}</dd>
            </div>
            <div>
              <dt className="opacity-50 uppercase tracking-wide text-[clamp(10px,0.8vw,12px)]">correo .....:</dt>
              <dd>{correo ?? '—'}</dd>
            </div>
            <div>
              <dt className="opacity-50 uppercase tracking-wide text-[clamp(10px,0.8vw,12px)]">teléfono ...:</dt>
              <dd>{perfil?.telefono ?? '—'}</dd>
            </div>
            <div>
              <dt className="opacity-50 uppercase tracking-wide text-[clamp(10px,0.8vw,12px)]">rol ........:</dt>
              <dd>{perfil?.rol ?? 'miembro'}</dd>
            </div>
          </dl>

          <button
            onClick={handleLogout}
            className="uppercase tracking-wide hover:underline text-[clamp(11px,0.9vw,14px)]"
          >
            &gt; salir
          </button>
        </div>
      </section>
    </main>
  )
}
