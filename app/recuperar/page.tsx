'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import Ojito from '@/components/Ojito'

type Modo = 'pedir' | 'verificando' | 'nueva'

// Traduce los errores comunes de supabase al tono de la casa.
function traducirError(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('expired') || m.includes('invalid')) {
    return 'el enlace ya expiró o ya se usó. pide uno nuevo.'
  }
  if (m.includes('session missing')) {
    return 'el enlace no abrió sesión en este navegador. pide uno nuevo.'
  }
  if (m.includes('different from the old')) {
    return 'la contraseña nueva no puede ser igual a la anterior.'
  }
  if (m.includes('password should be')) {
    return 'la contraseña necesita mínimo 8 caracteres.'
  }
  if (m.includes('rate limit') || m.includes('security purposes')) {
    return 'demasiados intentos seguidos. espera un minuto y vuelve a intentar.'
  }
  return m
}

export default function RecuperarPage() {
  const router = useRouter()
  const [modo, setModo] = useState<Modo>('pedir')

  // --- modo "pedir": enviar correo de recuperación ---
  const [correo, setCorreo] = useState('')
  const [enviado, setEnviado] = useState(false)

  // --- modo "nueva": poner contraseña nueva ---
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [actualizada, setActualizada] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tokenHash = params.get('token_hash')

    // Flujo nuevo: el correo trae ?token_hash= y lo canjeamos aquí mismo.
    // No depende de nada guardado en el navegador, así que funciona aunque
    // el enlace se abra en otro navegador, otro dispositivo o modo privado.
    if (tokenHash) {
      setModo('verificando')
      supabase.auth
        .verifyOtp({ type: 'recovery', token_hash: tokenHash })
        .then(({ error: otpError }) => {
          if (otpError) {
            setModo('pedir')
            setError(traducirError(otpError.message))
          } else {
            setModo('nueva')
          }
        })
      return
    }

    // Flujo viejo (?code=): el cliente de Supabase lo canjea solo
    // (detectSessionInUrl) y dispara PASSWORD_RECOVERY, pero únicamente si
    // estamos en el mismo navegador donde se pidió el enlace.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setModo('nueva')
    })
    if (params.get('code')) {
      setModo('nueva')
    }
    return () => sub.subscription.unsubscribe()
  }, [])

  const pedirEnlace = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(correo, {
      redirectTo: `${window.location.origin}/recuperar`,
    })
    setLoading(false)
    if (resetError) {
      setError(traducirError(resetError.message))
    } else {
      setEnviado(true)
    }
  }

  const guardarPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error: updError } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (updError) {
      // Sin sesión no hay forma de guardar: regresamos a pedir un enlace
      // nuevo en lugar de dejar al usuario atorado en el formulario.
      if (updError.message.toLowerCase().includes('session missing')) {
        setModo('pedir')
        setError('el enlace no abrió sesión en este navegador. pide uno nuevo.')
      } else {
        setError(traducirError(updError.message))
      }
    } else {
      setActualizada(true)
      setTimeout(() => router.replace('/mi-tlacuilo'), 1800)
    }
  }

  return (
    <main className="min-h-screen bg-[#15151d] text-[#9091c4] font-futura">
      <Header />

      <section className="max-w-md mx-auto px-8 py-24 font-mono">
        <div className="uppercase tracking-widest opacity-60 mb-3 text-[clamp(10px,0.75vw,12px)]">
          // tlacuilo.org · recuperar acceso
        </div>
        <div className="border-b border-[#9091c4]/30 mb-14" />

        {/* ============ MODO: VERIFICANDO ENLACE ============ */}
        {modo === 'verificando' && (
          <p className="text-[clamp(13px,1vw,16px)]">
            &gt; verificando enlace<span className="animate-pulse">_</span>
          </p>
        )}

        {/* ============ MODO: PEDIR ENLACE ============ */}
        {modo === 'pedir' && !enviado && (
          <>
            <p className="mb-10 text-[clamp(13px,1vw,16px)]">
              &gt; te enviamos un enlace para restablecerla.
            </p>
            <form onSubmit={pedirEnlace} className="space-y-7 text-[clamp(13px,1vw,16px)]">
              <div>
                <label className="block mb-1 opacity-60 text-[clamp(11px,0.85vw,13px)]">
                  correo .....:
                </label>
                <input
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  required
                  autoFocus
                  className="w-full bg-transparent border-b border-[#9091c4]/40 focus:border-[#9091c4] focus:outline-none py-1 font-mono text-[#9091c4]"
                />
              </div>

              {error && (
                <p className="text-red-300 text-[clamp(11px,0.85vw,13px)]">
                  &gt; error: {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-10 hover:underline disabled:opacity-50 text-[clamp(13px,1vw,16px)]"
              >
                {loading ? (
                  <>&gt; enviando<span className="animate-pulse">_</span></>
                ) : (
                  <>&gt; enviar enlace<span className="ml-1 animate-pulse">▮</span></>
                )}
              </button>
            </form>
          </>
        )}

        {/* ============ MODO: PEDIR ENLACE · ENVIADO ============ */}
        {modo === 'pedir' && enviado && (
          <>
            <p className="mb-6 text-[clamp(13px,1vw,16px)]">&gt; revisa tu correo.</p>
            <p className="leading-relaxed text-[clamp(12px,0.95vw,15px)] opacity-90">
              si <strong className="text-[#9091c4]">{correo}</strong> tiene cuenta,
              te llegó un enlace para poner una contraseña nueva.
            </p>
            <p className="mt-8 opacity-60 text-[clamp(11px,0.85vw,13px)]">
              (si no aparece, revisa spam.)
            </p>
          </>
        )}

        {/* ============ MODO: NUEVA CONTRASEÑA ============ */}
        {modo === 'nueva' && !actualizada && (
          <>
            <p className="mb-10 text-[clamp(13px,1vw,16px)]">
              &gt; escribe tu contraseña nueva.
            </p>
            <form onSubmit={guardarPassword} className="space-y-7 text-[clamp(13px,1vw,16px)]">
              <div>
                <label className="block mb-1 opacity-60 text-[clamp(11px,0.85vw,13px)]">
                  contraseña..:
                </label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoFocus
                    autoComplete="new-password"
                    className="w-full bg-transparent border-b border-[#9091c4]/40 focus:border-[#9091c4] focus:outline-none py-1 pr-20 font-mono text-[#9091c4]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    aria-label={showPwd ? 'ocultar contraseña' : 'ver contraseña'}
                    className="absolute right-0 top-1/2 -translate-y-1/2 font-mono text-[clamp(10px,0.8vw,12px)] opacity-60 hover:opacity-100"
                  >
                    <Ojito abierto={showPwd} />
                  </button>
                </div>
                <p className="mt-1 text-[clamp(10px,0.8vw,12px)] uppercase tracking-wider opacity-60">
                  &gt; mínimo 8 caracteres
                </p>
              </div>

              {error && (
                <p className="text-red-300 text-[clamp(11px,0.85vw,13px)]">
                  &gt; error: {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-8 hover:underline disabled:opacity-50 text-[clamp(13px,1vw,16px)]"
              >
                {loading ? (
                  <>&gt; guardando<span className="animate-pulse">_</span></>
                ) : (
                  <>&gt; guardar contraseña<span className="ml-1 animate-pulse">▮</span></>
                )}
              </button>
            </form>
          </>
        )}

        {/* ============ MODO: NUEVA · LISTO ============ */}
        {modo === 'nueva' && actualizada && (
          <>
            <p className="mb-6 text-[clamp(13px,1vw,16px)]">&gt; contraseña actualizada ✓</p>
            <p className="opacity-80 text-[clamp(12px,0.95vw,15px)]">
              entrando a tu tlacuilo<span className="animate-pulse">_</span>
            </p>
          </>
        )}

        <div className="mt-16 pt-6 border-t border-[#9091c4]/20 opacity-70 text-[clamp(11px,0.85vw,13px)]">
          &gt; ya te acordaste?{' '}
          <a href="/login" className="underline hover:no-underline">
            entrar
          </a>
        </div>
      </section>
    </main>
  )
}
