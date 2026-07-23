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
  // El badge NO es permanente. Solo aparece cuando cambia el contador
  // (o cuando el usuario hace hover). Después se desvanece.
  const [badgeVisible, setBadgeVisible] = useState(false)
  const prev = useRef(0)
  const firstLoad = useRef(true)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  // Cuando cambia el contador:
  //  · si es la primera carga (viene de la DB) → no mostrar badge (nada de notif permanente)
  //  · si es una interacción del usuario → mostrar badge por 2.5s con bump y luego apagar
  useEffect(() => {
    // Skip la primera carga (viene de fetch inicial)
    if (firstLoad.current) {
      firstLoad.current = false
      prev.current = count
      return
    }

    if (count !== prev.current && count > 0) {
      setBadgeVisible(true)
      if (count > prev.current) setBump(true)
      if (hideTimer.current) clearTimeout(hideTimer.current)
      hideTimer.current = setTimeout(() => {
        setBadgeVisible(false)
        setBump(false)
      }, 2500)
    } else if (count === 0) {
      setBadgeVisible(false)
      setBump(false)
    }
    prev.current = count
  }, [count])

  // Hover: si tienes cosas, mostrar badge. Al salir, apagar después de 700ms
  const showBadge = () => {
    if (count === 0) return
    if (hideTimer.current) clearTimeout(hideTimer.current)
    setBadgeVisible(true)
  }
  const hideBadgeSoon = () => {
    if (count === 0) return
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setBadgeVisible(false), 700)
  }

  if (!userId) return null

  return (
    <Link
      href="/mi-tlacuilo"
      aria-label={count === 1 ? 'Tu morral: 1 objeto' : `Tu morral: ${count} objetos`}
      onMouseEnter={showBadge}
      onMouseLeave={hideBadgeSoon}
      onFocus={showBadge}
      onBlur={hideBadgeSoon}
      className="relative text-text hover:text-text-bright transition-colors inline-flex items-end self-end pb-[2px]"
    >
      <style
        dangerouslySetInnerHTML={{
          __html:
            '@keyframes tl-bump{0%{transform:scale(1)}40%{transform:scale(1.35)}100%{transform:scale(1)}}.tl-bump{animation:tl-bump .35s ease}',
        }}
      />
      {/* morral · icono custom de tlacuilo (variante C: outline + línea top + flecos verticales)
          diseño marina · path del file figma tR9uFoPn7WOcdrjuYcZAiC */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 165 318"
        strokeWidth="6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-[clamp(14px,1.2vw,18px)] h-auto block"
        aria-hidden="true"
      >
        {/* cuerpo cuadrado */}
        <path d="M163.676 120.5H3.67615V280.5H163.676V120.5Z" />
        {/* línea horizontal de refuerzo top */}
        <path d="M3.67615 135.5H163.676" />
        {/* 6 flecos verticales */}
        <path d="M3.67615 281.5V311.5" />
        <path d="M15.6761 281.5V317.5" />
        <path d="M27.6761 281.5V311.5" />
        <path d="M139.676 281.5V311.5" />
        <path d="M151.676 281.5V317.5" />
        <path d="M163.676 281.5V311.5" />
        {/* asa con loop derecho */}
        <path d="M3.67617 120.5C-11.3238 55.5 28.6762 0.5 83.6762 0.5C138.676 0.5 158.676 40.5 138.676 60.5C118.676 75.5 98.6762 55.5 113.676 40.5C128.676 30.5 153.676 35.5 163.676 120.5" />
      </svg>
      {count > 0 && (
        <span
          aria-hidden={!badgeVisible}
          className={`absolute top-[30%] -right-2 min-w-[15px] h-[15px] px-[3px] rounded-full bg-morado text-bone font-mono text-[9px] leading-[15px] text-center transition-opacity duration-300 pointer-events-none ${
            badgeVisible ? 'opacity-100' : 'opacity-0'
          } ${bump ? 'tl-bump' : ''}`}
        >
          {count > 99 ? '99' : count}
        </span>
      )}
    </Link>
  )
}
