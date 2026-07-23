'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

/**
 * Morral del header · contador vivo de objetos en status=morral.
 *
 * Ocupa el lugar donde vivía el ThemeToggle (retirado 2026-07-17: Tlacuilo
 * es dark-only por diseño). Click → /mi-tlacuilo, donde vive el morral.
 *
 * Se actualiza escuchando el evento global 'tl:morral' que disparan
 * MorralButton y QuickMorralButton al agregar/quitar. El brinquito del
 * badge solo ocurre como consecuencia del click del usuario (regla de
 * la casa: nada de movimiento autoplay).
 */
export default function MorralHeader() {
  const [userId, setUserId] = useState<string | null>(null)
  const [count, setCount] = useState(0)
  const [bump, setBump] = useState(false)
  const prev = useRef(0)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id ?? null))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!userId) {
      setCount(0)
      return
    }
    let mounted = true
    const load = async () => {
      const { count: n } = await supabase
        .from('prestamos')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'morral')
      if (mounted) setCount(n ?? 0)
    }
    load()
    const onChange = () => load()
    window.addEventListener('tl:morral', onChange)
    return () => {
      mounted = false
      window.removeEventListener('tl:morral', onChange)
    }
  }, [userId])

  // brinquito cuando el contador sube (respuesta directa a la acción del usuario)
  useEffect(() => {
    if (count > prev.current) {
      setBump(true)
      const t = setTimeout(() => setBump(false), 400)
      prev.current = count
      return () => clearTimeout(t)
    }
    prev.current = count
  }, [count])

  if (!userId) return null

  return (
    <Link
      href="/mi-tlacuilo"
      aria-label={count === 1 ? 'Tu morral: 1 objeto' : `Tu morral: ${count} objetos`}
      className="relative text-text hover:text-text-bright transition-colors inline-flex items-center"
    >
      <style
        dangerouslySetInnerHTML={{
          __html:
            '@keyframes tl-bump{0%{transform:scale(1)}40%{transform:scale(1.35)}100%{transform:scale(1)}}.tl-bump{animation:tl-bump .35s ease}',
        }}
      />
      {/* morral · icono custom de tlacuilo (cuerpo cuadrado + flecos + asa con loop)
          diseño marina · path del file de figma tR9uFoPn7WOcdrjuYcZAiC */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 170 326"
        strokeWidth="12"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-[clamp(18px,1.6vw,24px)] h-auto"
        aria-hidden="true"
      >
        {/* cuerpo cuadrado */}
        <path d="M4.98909 125V285H164.989V125H4.98909Z" />
        {/* 6 flecos */}
        <path d="M31.9891 285L25.9891 320" />
        <path d="M39.9891 285V323" />
        <path d="M47.9891 285L51.9891 320" />
        <path d="M121.989 285L117.989 320" />
        <path d="M129.989 285V323" />
        <path d="M137.989 285L141.989 320" />
        {/* asa: sale de ambas esquinas, sube, loop del lado derecho, baja */}
        <path d="M6.16709 123C-8.83291 58 31.1671 3 86.1671 3C141.167 3 161.167 43 141.167 63C121.167 78 101.167 58 116.167 43C131.167 33 156.167 38 166.167 123" />
      </svg>
      {count > 0 && (
        <span
          className={`absolute top-[35%] -right-2 min-w-[15px] h-[15px] px-[3px] rounded-full bg-morado text-bone font-mono text-[9px] leading-[15px] text-center ${bump ? 'tl-bump' : ''}`}
        >
          {count > 99 ? '99' : count}
        </span>
      )}
    </Link>
  )
}
