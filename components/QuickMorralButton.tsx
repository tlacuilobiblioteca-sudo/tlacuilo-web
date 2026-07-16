'use client'

import { useState, useEffect, MouseEvent } from 'react'
import { supabase } from '@/lib/supabase'

type Props = {
  libroId: string
}

/**
 * Botón compacto para agregar/quitar libros del morral desde el grid de /biblioteca.
 * - Sin sesión: oculto (no estorba)
 * - Sin estado: muestra "+ morral"
 * - En morral: muestra "✓ en morral · quitar"
 * - Apartado/recogido: oculto (no debe poder quitarse desde aquí)
 *
 * Importante: hace e.preventDefault() para no disparar el link del card al picotear.
 *
 * 2026-07-17 · El morral es también la wishlist (tope sano de 50; el límite
 * por visita vive en el checkout). Dispara 'tl:morral' para el contador
 * del header.
 */

const MAX_MORRAL = 50

const notifyMorral = () => {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('tl:morral'))
}

export default function QuickMorralButton({ libroId }: Props) {
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [inMorral, setInMorral] = useState(false)
  const [otherState, setOtherState] = useState(false)
  const [prestamoId, setPrestamoId] = useState<string | null>(null)
  const [full, setFull] = useState(false)

  useEffect(() => {
    let mounted = true
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!mounted) return
      if (!user) {
        setLoading(false)
        return
      }
      setUserId(user.id)
      const { data } = await supabase
        .from('prestamos')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('libro_id', libroId)
        .in('status', ['morral', 'apartado', 'recogido'])
        .maybeSingle()
      if (!mounted) return
      if (data) {
        setPrestamoId(data.id)
        if (data.status === 'morral') setInMorral(true)
        else setOtherState(true)
      }
      setLoading(false)
    }
    init()
    return () => {
      mounted = false
    }
  }, [libroId])

  const handleClick = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!userId || working) return
    setWorking(true)
    setFull(false)
    if (inMorral && prestamoId) {
      const { error } = await supabase.from('prestamos').delete().eq('id', prestamoId)
      if (!error) {
        setInMorral(false)
        setPrestamoId(null)
        notifyMorral()
      }
    } else {
      // Tope sano del morral (el límite por visita vive en el checkout)
      const { count } = await supabase
        .from('prestamos')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'morral')
      if ((count ?? 0) >= MAX_MORRAL) {
        setFull(true)
        setWorking(false)
        return
      }
      const { data, error } = await supabase
        .from('prestamos')
        .insert({ user_id: userId, libro_id: libroId, status: 'morral' })
        .select('id')
        .single()
      if (!error && data) {
        setInMorral(true)
        setPrestamoId(data.id)
        notifyMorral()
      }
    }
    setWorking(false)
  }

  if (loading || !userId || otherState) return null

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={working}
      className={`font-mono text-[14px] lowercase tracking-wider mt-2 self-start transition-colors disabled:opacity-50 ${
        inMorral
          ? 'text-text-bright hover:text-loan'
          : 'text-text-dim hover:text-text-bright'
      }`}
    >
      {working ? '...' : full ? 'morral lleno (50)' : inMorral ? '✓ en morral · quitar' : '+ morral'}
    </button>
  )
}
