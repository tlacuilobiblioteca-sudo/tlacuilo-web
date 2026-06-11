'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import LibroEditorModal from './LibroEditorModal'

/* ============================================================
   Botón flotante "editar" que solo se muestra a usuarios con rol=editor.
   Cuando hace click abre el LibroEditorModal sobre el libro indicado.

   Uso típico:
     <AdminEditButton libroId={libro.id} />
        en cards del landing, biblioteca, /biblioteca/[id], etc.

   Variantes de presentación:
     variant="chip"  → chip rectangular (default, para cards)
     variant="floating" → botón flotante absoluto en esquina (para detail pages)
   ============================================================ */

type Props = {
  libroId: string
  variant?: 'chip' | 'floating'
}

export default function AdminEditButton({ libroId, variant = 'chip' }: Props) {
  const [isEditor, setIsEditor] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (cancelled || !user) return
      const { data: perfil } = await supabase
        .from('perfiles')
        .select('rol')
        .eq('id', user.id)
        .single()
      if (cancelled) return
      setIsEditor(perfil?.rol === 'editor')
    }
    check()
    return () => { cancelled = true }
  }, [])

  if (!isEditor) return null

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setOpen(true)
  }

  const buttonClass = variant === 'floating'
    ? 'inline-flex items-center gap-1.5 bg-brillante text-bone border border-tinta rounded-sm px-3 py-2 font-micro text-[11px] uppercase tracking-[0.08em] hover:bg-tinta hover:text-acid transition-colors shadow-md'
    : 'inline-flex items-center gap-1 bg-brillante text-bone border border-tinta rounded-sm px-2 py-1 font-micro text-[9px] uppercase tracking-[0.06em] hover:bg-tinta hover:text-acid transition-colors'

  return (
    <>
      <button type="button" onClick={handleClick} className={buttonClass} title="Editar este libro (solo admins)">
        ✎ editar
      </button>

      {open && (
        <LibroEditorModal
          libroId={libroId}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
