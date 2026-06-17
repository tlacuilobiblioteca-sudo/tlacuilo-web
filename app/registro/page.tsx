'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import GoogleButton from '@/components/GoogleButton'

type AliasStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

export default function RegistroPage() {
  const [alias, setAlias] = useState('')
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [terminos, setTerminos] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aliasStatus, setAliasStatus] = useState<AliasStatus>('idle')

  // Validación de formato + disponibilidad del alias (debounced)
  useEffect(() => {
    if (!alias) {
      setAliasStatus('idle')
      return
    }
    // Reglas: 3-20 chars, letras minúsculas / números / guion bajo / guion
    const valid = /^[a-z0-9_-]{3,20}$/.test(alias)
    if (!valid) {
      setAliasStatus('invalid')
      return
    }
    setAliasStatus('checking')
    const timer = setTimeout(async () => {
      // Usamos la VIEW pública para que la query funcione antes de auth
      // (el usuario aún no está logueado cuando se valida disponibilidad)
      const { data } = await supabase
        .from('perfiles_publicos')
        .select('handle')
        .eq('handle', alias)
        .maybeSingle()
      setAliasStatus(data ? 'taken' : 'available')
    }, 400)
    return () => clearTimeout(timer)
  }, [alias])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!terminos) {
      setError('acepta las condiciones para continuar.')
      return
    }
    if (aliasStatus !== 'available') {
      setError('elige un alias válido y disponible.')
      return
    }
    setLoading(true)
    setError(null)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: correo,
      password,
      options: {
        data: { handle: alias }, // El trigger lo lee para perfiles.handle
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (signUpError) {
      setLoading(false)
      setError(signUpError.message)
      return
    }

    // Backup: aseguramos que perfiles.handle quede con el alias elegido
    if (data.user) {
      await supabase
        .from('perfiles')
        .update({ handle: alias })
        .eq('id', data.user.id)
    }

    setLoading(false)
    setSuccess(true)
  }

  // Mensaje + color para el status del alias
  const aliasMsg = (() => {
    switch (aliasStatus) {
      case 'checking':
        return { txt: '> verificando...', cls: 'opacity-60' }
      case 'available':
        return { txt: '> disponible ✓', cls: 'text-green-500' }
      case 'taken':
        return { txt: '> ya está tomado', cls: 'text-orange-400' }
      case 'invalid':
        return { txt: '> 3-20 caracteres: a-z, 0-9, _ o -', cls: 'text-orange-400' }
      default:
        return { txt: '> elige un alias para identificarte', cls: 'opacity-60' }
    }
  })()

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
            dale clic para activar tu alias{' '}
            <strong className="text-[#c5c4f5]">{alias}</strong>.
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
          &gt; elige un alias y entra al acervo.
        </p>

        <div className="mb-8">
          <GoogleButton label="registrarme con google" />
          <p className="mt-2 opacity-50 text-[clamp(10px,0.8vw,12px)]">
            &gt; con google eliges tu alias después, dentro.
          </p>
          <div className="flex items-center gap-3 mt-7 opacity-40 text-[clamp(10px,0.8vw,12px)]">
            <span className="flex-1 border-b border-[#9091c4]/30" />
            <span>o con tu correo</span>
            <span className="flex-1 border-b border-[#9091c4]/30" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-7 text-[clamp(13px,1vw,16px)]">
          {/* ALIAS */}
          <div>
            <label className="block mb-1 opacity-60 text-[clamp(11px,0.85vw,13px)]">
              alias ...............:
            </label>
            <input
              type="text"
              value={alias}
              onChange={(e) => setAlias(e.target.value.toLowerCase().trim())}
              required
              autoFocus
              autoComplete="username"
              placeholder="ej. tlacuilo_01"
              className="w-full bg-transparent border-b border-[#9091c4]/40 focus:border-[#9091c4] focus:outline-none py-1 font-mono text-[#c5c4f5] placeholder:opacity-30"
            />
            <p className={`mt-1 text-[clamp(10px,0.8vw,12px)] uppercase tracking-wider ${aliasMsg.cls}`}>
              {aliasMsg.txt}
            </p>
          </div>

          {/* CORREO */}
          <div>
            <label className="block mb-1 opacity-60 text-[clamp(11px,0.85vw,13px)]">
              correo electrónico ..:
            </label>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
              autoComplete="email"
              className="w-full bg-transparent border-b border-[#9091c4]/40 focus:border-[#9091c4] focus:outline-none py-1 font-mono text-[#9091c4]"
            />
          </div>

          {/* CONTRASEÑA */}
          <div>
            <label className="block mb-1 opacity-60 text-[clamp(11px,0.85vw,13px)]">
              contraseña ..........:
            </label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
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
            <p className="mt-1 text-[clamp(10px,0.8vw,12px)] uppercase tracking-wider opacity-60">
              &gt; mínimo 8 caracteres
            </p>
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
            disabled={loading || aliasStatus !== 'available'}
            className="mt-8 hover:underline disabled:opacity-50 disabled:cursor-not-allowed text-[clamp(13px,1vw,16px)]"
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
