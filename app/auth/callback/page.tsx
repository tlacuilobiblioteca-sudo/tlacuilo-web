'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type OtpType = 'signup' | 'recovery' | 'invite' | 'magiclink' | 'email_change' | 'email'

/**
 * Punto de retorno de OAuth (Google) y de los enlaces de confirmación.
 *
 * Dos flujos:
 * 1) ?token_hash= (enlaces de correo nuevos): lo canjeamos aquí con
 *    verifyOtp. No depende de nada guardado en el navegador, así que
 *    funciona aunque el enlace se abra en otro navegador o dispositivo.
 * 2) ?code= (OAuth / enlaces viejos): el cliente de Supabase lo canjea solo
 *    (detectSessionInUrl); esperamos la sesión y redirigimos.
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

    const params = new URLSearchParams(window.location.search)
    const hashParams = new URLSearchParams(window.location.hash.slice(1))

    // Si Supabase ya nos regresó un error (enlace usado, expirado...),
    // lo decimos en /login en vez de quedarnos callados.
    if (params.get('error_description') || hashParams.get('error_description')) {
      router.replace('/login?msg=enlace')
      return
    }

    // 1) Enlace de correo con token_hash: canje directo, a prueba de
    //    navegador cruzado.
    const tokenHash = params.get('token_hash')
    if (tokenHash) {
      const type = (params.get('type') as OtpType) || 'signup'
      supabase.auth.verifyOtp({ type, token_hash: tokenHash }).then(({ error }) => {
        if (error) {
          // El enlace ya se usó o expiró. Si el correo ya quedó confirmado,
          // con entrar basta: el aviso se muestra en /login.
          router.replace('/login?msg=enlace')
        } else {
          irADestino()
        }
      })
      return
    }

    // 2) OAuth / enlaces viejos con ?code=

    // Por si la sesión ya quedó lista al montar.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) irADestino()
    })

    // Escuchamos el evento de inicio de sesión que dispara el canje del code.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) irADestino()
    })

    // Red de seguridad: si en 8s no hubo sesión, volvemos a login con aviso.
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
