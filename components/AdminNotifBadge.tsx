'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const SEEN_KEY = 'tlacuilo:notif:lastSeen'

/**
 * Botón a /admin/notificaciones con contador de novedades desde la
 * última vez que el editor abrió el panel (guardado en localStorage).
 * Cuenta reservas y lectores nuevos. Se usa dentro de la zona editora.
 */
export default function AdminNotifBadge() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let since = window.localStorage.getItem(SEEN_KEY)
    if (!since) {
      since = new Date().toISOString()
      window.localStorage.setItem(SEEN_KEY, since)
    }
    const run = async () => {
      const [r1, r2] = await Promise.all([
        supabase
          .from('prestamos')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'apartado')
          .gt('added_at', since),
        supabase
          .from('perfiles_publicos')
          .select('id', { count: 'exact', head: true })
          .gt('created_at', since),
      ])
      setCount((r1.count ?? 0) + (r2.count ?? 0))
    }
    run()
  }, [])

  return (
    <Link
      href="/admin/notificaciones"
      className="inline-flex items-center gap-2 bg-tinta text-bone border border-tinta rounded-sm px-3 py-2 font-micro text-[11px] uppercase tracking-[0.08em] hover:bg-brillante hover:text-bone transition-colors"
    >
      Notificaciones
      {count > 0 && (
        <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-acid text-tinta text-[10px] leading-none">
          {count}
        </span>
      )}
    </Link>
  )
}
