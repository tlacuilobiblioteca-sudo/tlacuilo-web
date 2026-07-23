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
  // Solo TRUE cuando el próximo cambio del count viene de una interacción
  // del usuario (agregar/quitar). Fetch inicial y navegación entre pages
  // NO activan el badge.
  const nextChangeByUser = useRef(false)
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
    // Cuando otro componente dispara 'tl:morral' (usuario agregó/quitó),
    // marcamos que el siguiente cambio del count es por acción del usuario
    // para que el badge aparezca.
    const onChange = () => {
      nextChangeByUser.current = true
      load()
    }
    window.addEventListener('tl:morral', onChange)
    return () => {
      mounted = false
      window.removeEventListener('tl:morral', onChange)
    }
  }, [userId])

  // Badge solo aparece si el cambio del count viene de una acción del
  // usuario (evento 'tl:morral'). Navegación entre pages, mount o fetch
  // inicial NO lo muestran, aunque el count cambie de 0 a N.
  useEffect(() => {
    if (nextChangeByUser.current && count > 0) {
      setBadgeVisible(true)
      if (count > prev.current) setBump(true)
      if (hideTimer.current) clearTimeout(hideTimer.current)
      hideTimer.current = setTimeout(() => {
        setBadgeVisible(false)
        setBump(false)
      }, 2500)
      nextChangeByUser.current = false
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
      className="relative text-text hover:text-text-bright transition-colors inline-flex items-end self-end pb-0 -mb-[3px]"
    >
      <style
        dangerouslySetInnerHTML={{
          __html:
            '@keyframes tl-bump{0%{transform:scale(1)}40%{transform:scale(1.35)}100%{transform:scale(1)}}.tl-bump{animation:tl-bump .35s ease}',
        }}
      />
      {/* morral · icono custom de tlacuilo (variante C · dimensiones marina para tamaño chico)
          diseño marina · path del file figma tR9uFoPn7WOcdrjuYcZAiC */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 10 19"
        strokeWidth="0.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-[clamp(11px,0.9vw,14px)] h-auto block"
        aria-hidden="true"
      >
        {/* cuerpo cuadrado */}
        <path d="M9.58697 7.11694H0.431152V16.2728H9.58697V7.11694Z" />
        {/* línea horizontal de refuerzo top */}
        <path d="M0.431152 7.97522H9.58697" />
        {/* 6 flecos verticales */}
        <path d="M0.431152 16.33V18.0467" />
        <path d="M1.11768 16.33V18.39" />
        <path d="M1.8042 16.33V18.0467" />
        <path d="M8.21338 16.33V18.0467" />
        <path d="M8.90039 16.33V18.39" />
        <path d="M9.58691 16.33V18.0467" />
        {/* asa con loop derecho */}
        <path d="M0.430881 7.11686C-0.427477 3.39731 1.86148 0.25 5.00879 0.25C8.1561 0.25 9.30058 2.53895 8.1561 3.68343C7.01162 4.54179 5.86715 3.39731 6.7255 2.53895C7.58386 1.96672 9.01446 2.25283 9.5867 7.11686" />
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
