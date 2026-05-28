import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import TecaLayout from '@/components/TecaLayout'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

type Perfil = {
  id: string
  handle: string
  bio: string | null
  rol: string | null
  created_at: string
}

export default async function PerfilPublicoPage({
  params,
}: {
  params: Promise<{ alias: string }>
}) {
  const { alias } = await params

  // La columna en DB sigue siendo `handle`. La ruta usa `alias` por UI.
  // Consultamos la VIEW pública perfiles_publicos (no perfiles directo),
  // porque la tabla `perfiles` tiene RLS que solo deja ver tu propio perfil.
  const { data: perfil, error } = await supabase
    .from('perfiles_publicos')
    .select('id, handle, bio, rol, created_at')
    .eq('handle', alias)
    .single<Perfil>()

  if (error || !perfil) {
    notFound()
  }

  const fechaRegistro = new Date(perfil.created_at).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
  })

  return (
    <TecaLayout>
      <section className="px-6 md:px-10 pt-6 pb-4 max-w-3xl mx-auto">
        <Link
          href="/"
          className="uppercase tracking-wide opacity-70 hover:opacity-100 hover:underline text-[clamp(10px,0.8vw,13px)] font-mono-tl"
        >
          ← Volver
        </Link>
      </section>

      <section className="px-6 md:px-10 pb-20 max-w-3xl mx-auto">
        <p className="font-mono-tl uppercase tracking-[0.2em] text-[clamp(10px,0.8vw,13px)] opacity-60 mb-3">
          &gt; alias
        </p>

        <h1 className="font-mono uppercase leading-tight text-[clamp(36px,5vw,72px)] text-[#c5c4f5] mb-6">
          {perfil.handle}
        </h1>

        {perfil.bio && (
          <div className="mb-10 max-w-[60ch]">
            <p className="text-[clamp(14px,1.1vw,18px)] leading-relaxed opacity-90 whitespace-pre-wrap">
              {perfil.bio}
            </p>
          </div>
        )}

        <div className="border-t border-[#9091c4]/15 pt-6 mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono-tl text-[clamp(10px,0.85vw,13px)] uppercase tracking-wide opacity-70">
          <div>
            <span className="opacity-60">&gt; en tlacuilo desde</span>
            <br />
            <span className="opacity-100">{fechaRegistro}</span>
          </div>
          {perfil.rol && perfil.rol !== 'lector' && (
            <div>
              <span className="opacity-60">&gt; rol</span>
              <br />
              <span className="opacity-100">{perfil.rol}</span>
            </div>
          )}
        </div>

        <p className="mt-12 font-mono text-[clamp(10px,0.8vw,13px)] uppercase tracking-[0.15em] opacity-50">
          biblioteca tlacuilo · coyoacán · 2026
        </p>
      </section>
    </TecaLayout>
  )
}
