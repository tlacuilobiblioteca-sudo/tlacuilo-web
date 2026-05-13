'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'

export default function LoginPage() {
  const router = useRouter()
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-transparent border-b border-[#9091c4]/40 focus:border-[#9091c4] focus:outline-none py-1 font-mono text-[#9091c4]"
            />
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

        <div className="mt-16 pt-6 border-t border-[#9091c4]/20 opacity-70 text-[clamp(11px,0.85vw,13px)]">
          &gt; primera vez aquí?{' '}
          <a href="/registro" className="underline hover:no-underline">
            solicita acceso
          </a>
        </div>
      </section>
    </main>
  )
}
