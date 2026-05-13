'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

/**
 * Link "Mi Tlacuilo" / "Entrar" auth-aware.
 * Renderizado client-side porque depende del estado de sesión.
 */
export default function AuthLink({ className }: { className?: string }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  if (loading) {
    return <span className={className} aria-hidden="true">·····</span>
  }

  return (
    <a href={user ? '/mi-tlacuilo' : '/login'} className={className}>
      Mi Tlacuilo
    </a>
  )
}
