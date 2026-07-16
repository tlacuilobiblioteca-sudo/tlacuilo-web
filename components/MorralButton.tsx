'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

type MorralButtonProps = {
  libroId: string
}

type PrestamoStatus = 'morral' | 'apartado' | 'recogido' | 'devuelto'

/**
 * Botón que toggle un libro al morral del usuario logueado.
 * - Si no hay sesión: link a /login
 * - Si ya está en su morral: muestra "✓ en tu morral · quitar"
 * - Si ya está apartado/recogido: muestra estado actual (no se puede borrar)
 * - Si no: botón "+ a mi morral"
 *
 * 2026-07-17 · El morral es también la wishlist: puedes juntar lo que te
 * interese (tope sano de 50) y el límite real por visita se aplica en el
 * checkout, donde escoges cuáles te llevas. Dispara 'tl:morral' para que
 * el contador del header se actualice.
 */

const MAX_MORRAL = 50

const notifyMorral = () => {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('tl:morral'))
}

export default function MorralButton({ libroId }: MorralButtonProps) {
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [prestamoId, setPrestamoId] = useState<string | null>(null)
  const [status, setStatus] = useState<PrestamoStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!mounted) return

      if (!user) {
        setUserId(null)
        setLoading(false)
        return
      }
      setUserId(user.id)

      // Buscar si ya tiene este libro en estado activo (no devuelto)
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
        setStatus(data.status as PrestamoStatus)
      }
      setLoading(false)
    }

    init()
    return () => { mounted = false }
  }, [libroId])

  const addToMorral = async () => {
    if (!userId) return
    setWorking(true)
    setError(null)

    // Tope sano del morral (el límite por visita vive en el checkout)
    const { count } = await supabase
      .from('prestamos')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'morral')
    if ((count ?? 0) >= MAX_MORRAL) {
      setError(`tu morral ya trae ${MAX_MORRAL} cosas; agenda una visita o suelta algo`)
      setWorking(false)
      return
    }

    const { data, error: insertError } = await supabase
      .from('prestamos')
      .insert({ user_id: userId, libro_id: libroId, status: 'morral' })
      .select('id')
      .single()

    if (insertError) {
      setError(insertError.message)
    } else if (data) {
      setPrestamoId(data.id)
      setStatus('morral')
      notifyMorral()
    }
    setWorking(false)
  }

  const removeFromMorral = async () => {
    if (!prestamoId) return
    setWorking(true)
    setError(null)

    const { error: deleteError } = await supabase
      .from('prestamos')
      .delete()
      .eq('id', prestamoId)

    if (deleteError) {
      setError(deleteError.message)
    } else {
      setPrestamoId(null)
      setStatus(null)
      notifyMorral()
    }
    setWorking(false)
  }

  if (loading) {
    return (
      <div className="font-mono text-xs text-text-dim lowercase tracking-wider mb-6">
        &gt; cargando...
      </div>
    )
  }

  // Sin sesión → CTA a login
  if (!userId) {
    return (
      <a
        href="/login"
        className="self-start font-mono text-sm lowercase tracking-wider bg-invert-bg text-invert-fg px-6 py-3 hover:bg-text-bright transition-colors inline-block mb-6"
      >
        inicia sesión para apartar
      </a>
    )
  }

  // Ya está apartado (confirmó visita)
  if (status === 'apartado') {
    return (
      <div className="self-start font-mono text-sm text-text uppercase tracking-wider px-6 py-3 border border-rule-strong inline-block mb-6">
        ya apartado · espera tu visita
      </div>
    )
  }

  // Lo tiene físicamente
  if (status === 'recogido') {
    return (
      <div className="self-start font-mono text-sm text-text uppercase tracking-wider px-6 py-3 border border-rule-strong inline-block mb-6">
        lo tienes prestado
      </div>
    )
  }

  // En el morral (todavía no agenda visita)
  if (status === 'morral') {
    return (
      <div className="flex flex-col gap-2 items-start mb-6">
        <button
          onClick={removeFromMorral}
          disabled={working}
          className="font-mono text-sm lowercase tracking-wider border border-rule-strong text-text px-6 py-3 hover:text-text-bright hover:border-text-bright transition-colors inline-block disabled:opacity-50 cursor-pointer"
        >
          {working ? '> quitando...' : '✓ en tu morral · quitar'}
        </button>
        <a href="/mi-tlacuilo" className="font-mono text-xs text-text-dim hover:text-text-bright underline lowercase tracking-wider">
          ver tu morral →
        </a>
      </div>
    )
  }

  // Default: no está en su morral → mostrar botón para agregar
  return (
    <div className="flex flex-col gap-2 items-start mb-6">
      <button
        onClick={addToMorral}
        disabled={working}
        className="font-mono text-sm lowercase tracking-wider bg-invert-bg text-invert-fg font-bold px-6 py-3 hover:bg-text-bright transition-colors inline-block disabled:opacity-50 cursor-pointer"
      >
        {working ? '> agregando...' : '+ a mi morral'}
      </button>
      {error && (
        <p className="font-mono text-xs text-loan lowercase">&gt; {error}</p>
      )}
    </div>
  )
}
