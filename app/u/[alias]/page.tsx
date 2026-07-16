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
  avatar_url: string | null
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
    .select('id, handle, bio, rol, created_at, avatar_url')
    .eq('handle', alias)
    .single<Perfil>()

  if (error || !perfil) {
    notFound()
  }

  // Contador publico de rentas (RPC de solo agregados; cuenta recogidos + devueltos)
  const { data: rentas } = await supabase.rpc('rentas_count', { p_handle: alias })

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

        <div className="flex items-center gap-5 mb-6">
          {perfil.avatar_url && (
            <div className="w-[88px] h-[88px] rounded-full overflow-hidden bg-bg-card border border-rule-strong shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={perfil.avatar_url} alt={`foto de ${perfil.handle}`} className="w-full h-full object-cover" />
            </div>
          )}
          <h1 className="font-mono uppercase leading-tight text-[clamp(36px,5vw,72px)] text-[#c5c4f5]">
            {perfil.handle}
          </h1>
        </div>

        <div className="border-t border-[#9091c4]/15 pt-6 mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono-tl text-[clamp(10px,0.85vw,13px)] uppercase tracking-wide opacity-70">
          <div>
            <span className="opacity-60">&gt; en tlacuilo desde</span>
            <br />
            <span className="opacity-100">{fechaRegistro}</span>
          </div>
          {(rentas ?? 0) > 0 && (
            <div>
              <span className="opacity-60">&gt; libros rentados</span>
              <br />
              <span className="opacity-100">{rentas}</span>
            </div>
          )}
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
