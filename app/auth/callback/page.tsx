'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

/**
 * Punto de retorno de OAuth (Google) y de los enlaces de confirmación.
 * El cliente de Supabase (detectSessionInUrl) canjea el ?code= solo;
 * aquí solo esperamos a que aparezca la sesión y mandamos a /mi-tlacuilo.
 */
export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    let done = false

    const irADestino = () => {
      if (done) return
      done = true
      router.replace('/mi-tlacuilo')
    }

    // 1) Por si la sesión ya quedó lista al montar.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) irADestino()
    })

    // 2) Escuchamos el evento de inicio de sesión que dispara el canje del code.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) irADestino()
    })

    // 3) Red de seguridad: si en 8s no hubo sesión, volvemos a login con aviso.
    const t = setTimeout(() => {
      if (!done) router.replace('/login?error=oauth')
    }, 8000)

    return () => {
      sub.subscription.unsubscribe()
      clearTimeout(t)
    }
  }, [router])

  return (
    <main className="min-h-screen bg-[#15151d] text-[#9091c4] font-mono flex items-center justify-center px-8">
      <p className="text-[clamp(13px,1vw,16px)]">
        &gt; estableciendo sesión<span className="animate-pulse">_</span>
      </p>
    </main>
  )
}
