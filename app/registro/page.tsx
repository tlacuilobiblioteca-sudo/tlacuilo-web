'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'

export default function RegistroPage() {
  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [telefono, setTelefono] = useState('')
  const [password, setPassword] = useState('')
  const [terminos, setTerminos] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!terminos) {
      setError('acepta los términos para continuar.')
      return
    }
    setLoading(true)
    setError(null)

    const { error: signUpError } = await supabase.auth.signUp({
      email: correo,
      password,
      options: {
        data: {
          nombre_completo: nombre,
          telefono,
        },
      },
    })

    setLoading(false)

    if (signUpError) {
      setError(signUpError.message)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <main className="min-h-screen bg-[#15151d] text-[#9091c4] font-futura">
        <Header />
        <section className="max-w-md mx-auto px-8 py-24 font-mono">
          <div className="uppercase tracking-widest opacity-60 mb-3 text-[clamp(10px,0.75vw,12px)]">
            // tlacuilo.org · acceso pendiente
          </div>
          <div className="border-b border-[#9091c4]/30 mb-14" />

          <p className="mb-6 text-[clamp(13px,1vw,16px)]">
            &gt; solicitud enviada.
          </p>
          <p className="leading-relaxed text-[clamp(12px,0.95vw,15px)] opacity-90">
            te enviamos un enlace de confirmación a{' '}
            <strong className="text-[#9091c4]">{correo}</strong>.
            <br />
            dale clic para activar tu acceso.
          </p>
          <p className="mt-8 opacity-60 text-[clamp(11px,0.85vw,13px)]">
            (si no aparece, revisa spam.)
          </p>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#15151d] text-[#9091c4] font-futura">
      <Header />

      <section className="max-w-md mx-auto px-8 py-24 font-mono">
        <div className="uppercase tracking-widest opacity-60 mb-3 text-[clamp(10px,0.75vw,12px)]">
          // tlacuilo.org · solicitar acceso
        </div>
        <div className="border-b border-[#9091c4]/30 mb-14" />

        <p className="mb-10 text-[clamp(13px,1vw,16px)]">
          &gt; describe quién eres.
        </p>

        <form onSubmit={handleSubmit} className="space-y-7 text-[clamp(13px,1vw,16px)]">
          <div>
            <label className="block mb-1 opacity-60 text-[clamp(11px,0.85vw,13px)]">
              nombre completo .....:
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              autoFocus
              className="w-full bg-transparent border-b border-[#9091c4]/40 focus:border-[#9091c4] focus:outline-none py-1 font-mono text-[#9091c4]"
            />
          </div>

          <div>
            <label className="block mb-1 opacity-60 text-[clamp(11px,0.85vw,13px)]">
              correo electrónico ..:
            </label>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
              className="w-full bg-transparent border-b border-[#9091c4]/40 focus:border-[#9091c4] focus:outline-none py-1 font-mono text-[#9091c4]"
            />
          </div>

          <div>
            <label className="block mb-1 opacity-60 text-[clamp(11px,0.85vw,13px)]">
              teléfono ............:
            </label>
            <input
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="w-full bg-transparent border-b border-[#9091c4]/40 focus:border-[#9091c4] focus:outline-none py-1 font-mono text-[#9091c4]"
            />
          </div>

          <div>
            <label className="block mb-1 opacity-60 text-[clamp(11px,0.85vw,13px)]">
              contraseña ..........:
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-transparent border-b border-[#9091c4]/40 focus:border-[#9091c4] focus:outline-none py-1 font-mono text-[#9091c4]"
            />
          </div>

          <label className="flex items-start gap-2 mt-6 text-[clamp(11px,0.85vw,13px)] opacity-80">
            <input
              type="checkbox"
              checked={terminos}
              onChange={(e) => setTerminos(e.target.checked)}
              className="mt-1 accent-[#9091c4]"
            />
            <span>acepto las condiciones de paso.</span>
          </label>

          {error && (
            <p className="text-red-300 text-[clamp(11px,0.85vw,13px)]">
              &gt; error: {error.toLowerCase()}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-8 hover:underline disabled:opacity-50 text-[clamp(13px,1vw,16px)]"
          >
            {loading ? (
              <>&gt; enviando<span className="animate-pulse">_</span></>
            ) : (
              <>&gt; enviar solicitud<span className="ml-1 animate-pulse">▮</span></>
            )}
          </button>
        </form>

        <div className="mt-16 pt-6 border-t border-[#9091c4]/20 opacity-70 text-[clamp(11px,0.85vw,13px)]">
          &gt; ya tienes acceso?{' '}
          <a href="/login" className="underline hover:no-underline">
            entrar
          </a>
        </div>
      </section>
    </main>
  )
}
