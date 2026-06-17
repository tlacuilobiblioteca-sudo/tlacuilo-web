'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import GoogleButton from '@/components/GoogleButton'

export default function LoginPage() {
  const router = useRouter()
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Aviso si el retorno de Google falló (lo manda /auth/callback).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('error') === 'oauth') {
      setError('no se pudo entrar con google. intenta de nuevo.')
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: correo,
      password,
    })

    setLoading(false)

    if (signInError) {
      setError(signInError.message)
    } else {
      router.push('/mi-tlacuilo')
      router.refresh()
    }
  }

  return (
    <main className="min-h-screen bg-[#15151d] text-[#9091c4] font-futura">
      <Header />

      <section className="max-w-md mx-auto px-8 py-24 font-mono">
        <div className="uppercase tracking-widest opacity-60 mb-3 text-[clamp(10px,0.75vw,12px)]">
          // tlacuilo.org · acceso
        </div>
        <div className="border-b border-[#9091c4]/30 mb-14" />

        <p className="mb-10 text-[clamp(13px,1vw,16px)]">
          &gt; identifícate.
        </p>

        <div className="mb-8">
          <GoogleButton />
          <div className="flex items-center gap-3 mt-8 opacity-40 text-[clamp(10px,0.8vw,12px)]">
            <span className="flex-1 border-b border-[#9091c4]/30" />
            <span>o con tu correo</span>
            <span className="flex-1 border-b border-[#9091c4]/30" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-7 text-[clamp(13px,1vw,16px)]">
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
                className="w-full bg-transparent border-b border-[#9091c4]/40 focus:border-[#9091c4] focus:outline-none py-1 pr-20 font-mono text-[#9091c4]"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                aria-label={showPwd ? 'ocultar contraseña' : 'ver contraseña'}
                className="absolute right-0 top-1/2 -translate-y-1/2 font-mono text-[clamp(10px,0.8vw,12px)] opacity-60 hover:opacity-100"
              >
                {showPwd ? '[ocultar]' : '[ver]'}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-300 text-[clamp(11px,0.85vw,13px)]">
              &gt; error: {error.toLowerCase()}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-10 hover:underline disabled:opacity-50 text-[clamp(13px,1vw,16px)]"
          >
            {loading ? (
              <>&gt; conectando<span className="animate-pulse">_</span></>
            ) : (
              <>&gt; entrar<span className="ml-1 animate-pulse">▮</span></>
            )}
          </button>
        </form>

        <div className="mt-10 opacity-70 text-[clamp(11px,0.85vw,13px)]">
          &gt; olvidaste tu contraseña?{' '}
          <a href="/recuperar" className="underline hover:no-underline">
            recupérala
          </a>
        </div>

        <div className="mt-6 pt-6 border-t border-[#9091c4]/20 opacity-70 text-[clamp(11px,0.85vw,13px)]">
          &gt; primera vez aquí?{' '}
          <a href="/registro" className="underline hover:no-underline">
            solicita acceso
          </a>
        </div>
      </section>
    </main>
  )
}
