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
      {/* morral (bolsa) · mismo trazo 1.6 que el icono de calendario */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.6"
        stroke="currentColor"
        className="w-[clamp(14px,1.2vw,18px)] h-[clamp(14px,1.2vw,18px)]"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z"
        />
      </svg>
      {count > 0 && (
        <span
          className={`absolute -top-1.5 -right-2.5 min-w-[15px] h-[15px] px-[3px] rounded-full bg-morado text-bone font-mono text-[9px] leading-[15px] text-center ${bump ? 'tl-bump' : ''}`}
        >
          {count > 99 ? '99' : count}
        </span>
      )}
    </Link>
  )
}
