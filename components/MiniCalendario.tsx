'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Mini calendario de mi tlacuilo (2026-07-17, reemplaza a /calendario).
 * Dos colores: tus visitas (verde disponible) y eventos de tlacuilo (periwinkle).
 * Navegación por mes solo con click, sin autoplay.
 */

type Dia = { visitas: number; eventos: string[] }

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

export default function MiniCalendario() {
  const hoy = new Date()
  const [cursor, setCursor] = useState(new Date(hoy.getFullYear(), hoy.getMonth(), 1))
  const [dias, setDias] = useState<Record<number, Dia>>({})

  useEffect(() => {
    let mounted = true
    const load = async () => {
      const ini = cursor.toISOString()
      const fin = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1).toISOString()
      const { data: { user } } = await supabase.auth.getUser()
      const [vis, evs] = await Promise.all([
        user
          ? supabase.from('prestamos').select('visit_at').eq('user_id', user.id).in('status', ['apartado', 'recogido']).not('visit_at', 'is', null).gte('visit_at', ini).lt('visit_at', fin)
          : Promise.resolve({ data: [] as { visit_at: string }[] }),
        supabase.from('eventos').select('titulo, fecha_inicio').gte('fecha_inicio', ini).lt('fecha_inicio', fin),
      ])
      if (!mounted) return
      const map: Record<number, Dia> = {}
      const get = (d: number) => (map[d] ??= { visitas: 0, eventos: [] })
      for (const v of vis.data ?? []) {
        if (v.visit_at) get(new Date(v.visit_at).getDate()).visitas += 1
      }
      for (const e of evs.data ?? []) {
        get(new Date(e.fecha_inicio).getDate()).eventos.push(e.titulo)
      }
      setDias(map)
    }
    load()
    return () => { mounted = false }
  }, [cursor])

  const nDias = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()
  const offset = (new Date(cursor.getFullYear(), cursor.getMonth(), 1).getDay() + 6) % 7
  const esHoy = (d: number) => hoy.getFullYear() === cursor.getFullYear() && hoy.getMonth() === cursor.getMonth() && hoy.getDate() === d

  return (
    <div className="max-w-[340px]">
      <div className="flex items-center justify-between mb-3 font-mono text-[12px] lowercase tracking-wider">
        <button type="button" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="px-2 opacity-60 hover:opacity-100 cursor-pointer" aria-label="mes anterior">←</button>
        <span className="uppercase tracking-[0.14em]">{MESES[cursor.getMonth()]} {cursor.getFullYear()}</span>
        <button type="button" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="px-2 opacity-60 hover:opacity-100 cursor-pointer" aria-label="mes siguiente">→</button>
      </div>
      <div className="grid grid-cols-7 gap-1 font-mono text-[11px]">
        {['l', 'm', 'x', 'j', 'v', 's', 'd'].map((d) => (
          <span key={d} className="text-center opacity-40">{d}</span>
        ))}
        {Array.from({ length: offset }, (_, i) => <span key={'b' + i} />)}
        {Array.from({ length: nDias }, (_, i) => {
          const d = i + 1
          const info = dias[d]
          return (
            <span key={d} className={'relative text-center py-1 ' + (esHoy(d) ? 'border border-rule-strong' : '')}>
              <span className={info ? 'text-text-bright' : 'opacity-50'}>{d}</span>
              {info && (
                <span className="absolute left-1/2 -translate-x-1/2 bottom-0 flex gap-[3px]">
                  {info.visitas > 0 && <span className="w-[5px] h-[5px] rounded-full bg-available" />}
                  {info.eventos.length > 0 && <span className="w-[5px] h-[5px] rounded-full bg-periwinkle" />}
                </span>
              )}
            </span>
          )
        })}
      </div>
      <div className="mt-4 space-y-1 font-mono text-[11px] lowercase tracking-wider">
        {Object.entries(dias).sort(([a], [b]) => Number(a) - Number(b)).map(([d, info]) => (
          <div key={d}>
            {info.visitas > 0 && (
              <p><span className="text-available">●</span> <span className="opacity-80">{d} · tu visita · {info.visitas} {info.visitas === 1 ? 'objeto' : 'objetos'}</span></p>
            )}
            {info.eventos.map((t) => (
              <p key={t}><span className="text-periwinkle">●</span> <span className="opacity-80">{d} · {t}</span></p>
            ))}
          </div>
        ))}
        {Object.keys(dias).length === 0 && <p className="opacity-40">&gt; sin visitas ni eventos este mes</p>}
      </div>
    </div>
  )
}
