'use client'

import { useEffect, useRef, useState } from 'react'

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

type Props = {
  text: string
  className?: string
  /** Velocidad del scramble en ms por letra. Default 28. */
  speed?: number
}

/**
 * ScrambleText — al hover, las letras se reorganizan caóticamente
 * y aterrizan letra por letra hasta revelar el texto original.
 * User-driven (mouseenter). Tlacuilo = escriba; el scramble es literal.
 */
export default function ScrambleText({
  text,
  className = '',
  speed = 28,
}: Props) {
  const [display, setDisplay] = useState(text)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Sync external text changes (por si Supabase actualiza categorías)
  useEffect(() => {
    setDisplay(text)
  }, [text])

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const handleEnter = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)

    let iter = 0
    intervalRef.current = setInterval(() => {
      const next = text
        .split('')
        .map((char, i) => {
          if (char === ' ' || char === '·') return char
          if (i < iter) return text[i]
          return CHARS[Math.floor(Math.random() * CHARS.length)]
        })
        .join('')

      setDisplay(next)
      iter += 1

      if (iter > text.length) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        setDisplay(text)
      }
    }, speed)
  }

  const handleLeave = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setDisplay(text)
  }

  return (
    <span
      className={className}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {display}
    </span>
  )
}
