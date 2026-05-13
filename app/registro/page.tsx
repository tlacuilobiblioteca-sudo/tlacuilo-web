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
      setError('Acepta los términos para continuar.')
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
      <main className="min-h-screen bg-[#9794C4] text-black font-sans">
        <Header />
        <section className="px-8 py-20 max-w-md mx-auto text-center">
          <h1 className="font-bold uppercase tracking-wide mb-6 text-[clamp(14px,1.2vw,18px)]">
            Ya eres parte de Tlacuilo
          </h1>
          <p className="leading-relaxed text-[clamp(13px,1vw,16px)]">
            Te enviamos un correo de confirmación a <strong>{correo}</strong>.
            Dale clic al link para activar tu cuenta.
          </p>
          <p className="mt-6 opacity-70 text-[clamp(11px,0.9vw,14px)]">
            Si no aparece en tu bandeja, revisa la carpeta de spam.
          </p>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#9794C4] text-black font-sans">
      <Header />

      <section className="px-8 py-16 max-w-md mx-auto">
        <h1 className="text-center font-bold uppercase tracking-wide mb-10 text-[clamp(14px,1.2vw,18px)]">
          Regístrate
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Nombre completo"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            className="bg-transparent border border-black/40 rounded-full px-6 py-3 placeholder:text-black/50 focus:outline-none focus:border-black text-[clamp(13px,1vw,16px)]"
          />
          <input
            type="email"
            placeholder="Correo electrónico"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
            className="bg-transparent border border-black/40 rounded-full px-6 py-3 placeholder:text-black/50 focus:outline-none focus:border-black text-[clamp(13px,1vw,16px)]"
          />
          <input
            type="tel"
            placeholder="Teléfono"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            className="bg-transparent border border-black/40 rounded-full px-6 py-3 placeholder:text-black/50 focus:outline-none focus:border-black text-[clamp(13px,1vw,16px)]"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="bg-transparent border border-black/40 rounded-full px-6 py-3 placeholder:text-black/50 focus:outline-none focus:border-black text-[clamp(13px,1vw,16px)]"
          />

          <label className="flex items-start gap-2 mt-2 text-[clamp(11px,0.9vw,14px)]">
            <input
              type="checkbox"
              checked={terminos}
              onChange={(e) => setTerminos(e.target.checked)}
              className="mt-1"
            />
            <span>Acepto los términos y condiciones de Tlacuilo.</span>
          </label>

          {error && (
            <p className="text-red-900 bg-red-100 px-4 py-2 rounded text-[clamp(11px,0.9vw,14px)]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="self-center uppercase tracking-wide font-bold mt-6 hover:underline disabled:opacity-50 text-[clamp(13px,1vw,16px)]"
          >
            {loading ? 'Creando cuenta...' : 'IR'}
          </button>

          <p className="text-center mt-6 opacity-70 text-[clamp(11px,0.9vw,14px)]">
            ¿Ya tienes cuenta?{' '}
            <a href="/login" className="underline opacity-100">
              Inicia sesión
            </a>
          </p>
        </form>
      </section>
    </main>
  )
}
