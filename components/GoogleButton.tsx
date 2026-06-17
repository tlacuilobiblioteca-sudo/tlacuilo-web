'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Botón "continuar con Google".
 * Lanza el flujo OAuth de Supabase y vuelve a /auth/callback,
 * que recoge la sesión y manda a /mi-tlacuilo.
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
