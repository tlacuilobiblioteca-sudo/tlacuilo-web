'use client'

import { useEffect, useRef } from 'react'

/**
 * Terminal Boot: ventana flotante tipo arranque de OS con typewriter effect.
 * Estática (no toca Supabase). Loop infinito cada ~6s después de terminar.
 *
 * Posición: usar `absolute` desde el hero. Hidden en mobile.
 */

type Line = {
  t: string
  cls?: string         // class del color de la línea (dim, ok, blk, bright)
  post?: string        // texto que aparece DESPUÉS del typing (ej. [ok])
  pcls?: string        // class del color del post (ok, blk)
}

const LINES: Line[] = [
  { t: 'tlacuilo os · arranque', cls: 'dim' },
  { t: 'commons protocol · cdmx · 2026', cls: 'dim' },
  { t: '' },
  { t: '> mount /acervo ............ ', post: '[ok]',      pcls: 'ok' },
  { t: '> load códice .............. ', post: '[ok]',      pcls: 'ok' },
  { t: '> init préstamo ............ ', post: '[ok]',      pcls: 'ok' },
  { t: '> verify confianza ......... ', post: '[ok]',      pcls: 'ok' },
  { t: '> deny profit_motive ....... ', post: '[blocked]', pcls: 'blk' },
  { t: '> deny algoritmo ........... ', post: '[blocked]', pcls: 'blk' },
  { t: '> deny intermediario ....... ', post: '[blocked]', pcls: 'blk' },
  { t: '> deny pdfs ................ ', post: '[blocked]', pcls: 'blk' },
  { t: '' },
  { t: 'lema activado:', cls: 'dim' },
  { t: '  "mi cosa es tu cosa"', cls: 'bright' },
  { t: '' },
  { t: '> sistema listo. esperando lectores.' },
  { t: '> _' },
]

const COLOR: Record<string, string> = {
  dim: 'text-text-dim',
  ok: 'text-available',
  blk: 'text-loan',
  bright: 'text-text-bright font-bold',
}

export default function TerminalBoot() {
  const screenRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const screen = screenRef.current
    if (!screen) return

    // Limpiar el fallback estático antes de empezar a tipear
    screen.innerHTML = ''

    let li = 0
    let ci = 0
    let buf = ''
    let stopped = false

    const type = () => {
      if (stopped) return
      // Si la tab no está visible, no quemar batería: esperar a que vuelva
      if (document.hidden) {
        timeoutRef.current = setTimeout(type, 500)
        return
      }

      if (li >= LINES.length) {
        // Terminó. Reset y volver a empezar después de 6s.
        timeoutRef.current = setTimeout(() => {
          if (stopped) return
          screen.innerHTML = ''
          li = 0
          ci = 0
          buf = ''
          type()
        }, 6000)
        return
      }

      const cur = LINES[li]

      // Línea vacía → empty line + avanzar
      if (!cur.t) {
        const empty = document.createElement('div')
        empty.innerHTML = '&nbsp;'
        empty.className = 'min-h-[1em]'
        screen.appendChild(empty)
        li++
        ci = 0
        buf = ''
        timeoutRef.current = setTimeout(type, 80)
        return
      }

      // Typing char por char
      if (ci < cur.t.length) {
        buf += cur.t[ci++]
        const last = screen.lastElementChild as HTMLElement | null
        if (last && last.dataset.active === '1') {
          last.innerHTML = `${escapeHtml(buf)}<span class="caret"></span>`
        } else {
          const d = document.createElement('div')
          d.className = `min-h-[1em] ${cur.cls ? COLOR[cur.cls] || '' : ''}`
          d.dataset.active = '1'
          d.innerHTML = `${escapeHtml(buf)}<span class="caret"></span>`
          screen.appendChild(d)
        }
        timeoutRef.current = setTimeout(type, 14 + Math.random() * 22)
      } else {
        // Línea completa → quitar caret, agregar post (ej. [ok])
        const last = screen.lastElementChild as HTMLElement | null
        if (last) {
          last.dataset.active = '0'
          let html = escapeHtml(buf)
          if (cur.post) {
            html += `<span class="${cur.pcls ? COLOR[cur.pcls] || '' : ''}">${escapeHtml(cur.post)}</span>`
          }
          last.innerHTML = html
        }
        li++
        ci = 0
        buf = ''
        timeoutRef.current = setTimeout(type, 120)
      }
    }

    type()

    return () => {
      stopped = true
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <div
      aria-hidden="true"
      className="absolute bottom-6 right-6 w-[300px] p-4 bg-bg-card border border-rule font-mono text-[12.5px] leading-relaxed text-text lowercase hidden md:block z-10"
    >
      {/* Fallback estático — si JS no carga, se ve este snapshot del estado final */}
      <div ref={screenRef} className="whitespace-pre-wrap">
        <div className="text-text-dim">tlacuilo os · arranque</div>
        <div className="text-text-dim">commons protocol · cdmx · 2026</div>
        <div className="min-h-[1em]">&nbsp;</div>
        <div>&gt; mount /acervo ............ <span className="text-available">[ok]</span></div>
        <div>&gt; verify confianza .......... <span className="text-available">[ok]</span></div>
        <div>&gt; deny profit_motive ........ <span className="text-loan">[blocked]</span></div>
        <div>&gt; deny algoritmo ............ <span className="text-loan">[blocked]</span></div>
        <div className="min-h-[1em]">&nbsp;</div>
        <div className="text-text-dim">lema activado:</div>
        <div className="text-text-bright font-bold">  &quot;mi cosa es tu cosa&quot;</div>
        <div className="min-h-[1em]">&nbsp;</div>
        <div>&gt; sistema listo. esperando lectores.</div>
      </div>
    </div>
  )
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
