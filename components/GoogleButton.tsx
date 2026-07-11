'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Botón "continuar con Google".
 * Lanza el flujo OAuth de Supabase y vuelve a /auth/callback,
 * que recoge la sesión y manda a /mi-tlacuilo.
 *
 * Nunca falla en silencio: si el navegador bloquea el brinco a Google
 * (content blockers, filtros, modo privado restrictivo), lo decimos
 * y sugerimos el camino del correo.
 */
export default function GoogleButton({
  label = 'continuar con google',
}: {
  label?: string
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGoogle = async () => {
    setLoading(true)
    setError(null)
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { prompt: 'select_account' },
        },
      })
      // Si no hay error, el navegador ya se fue a Google.
      if (oauthError) {
        setError(oauthError.message.toLowerCase())
        setLoading(false)
        return
      }
      // Red de seguridad: si en 4s seguimos aquí, el navegador bloqueó
      // la redirección (filtros/extensiones). Lo hacemos visible.
      setTimeout(() => {
        setError(
          'tu navegador bloqueó la conexión con google. intenta en otro navegador, o entra con tu correo y contraseña.'
        )
        setLoading(false)
      }, 4000)
    } catch {
      // Excepciones (storage bloqueado, red cortada por filtros, etc.)
      setError(
        'tu navegador bloqueó la conexión con google. intenta en otro navegador, o entra con tu correo y contraseña.'
      )
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleGoogle}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 border border-[#9091c4]/40 hover:border-[#9091c4] py-2.5 font-mono text-[clamp(12px,0.9vw,14px)] tracking-wide disabled:opacity-50 transition-colors"
      >
        <span aria-hidden="true" className="opacity-70">[g]</span>
        {loading ? <>&gt; conectando con google...</> : <>&gt; {label}</>}
      </button>
      {error && (
        <p className="mt-2 text-red-300 text-[clamp(10px,0.8vw,12px)]">
          &gt; error: {error}
        </p>
      )}
    </div>
  )
}
