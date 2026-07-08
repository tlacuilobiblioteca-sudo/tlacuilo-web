'use client'

import { useEffect, useState } from 'react'

/**
 * Biblioticker — 1 hilera de letanías del booklet impreso.
 * Pool aleatorio por carga. Sin Supabase: data hardcoded.
 *
 * Marquee animado (Marina lo pidió explícitamente 2026-07-08; excepción
 * al no-autoplay). Se pausa al hover, con tab oculta (anim-paused) y
 * con prefers-reduced-motion.
 */

const POOLS: string[][] = [
  // un tlacuilo es un...
  ['escritor', 'pintor', 'escriba', 'cronista', 'lector', 'bibliófilo',
   'estudiante', 'archivista', 'divulgador', 'prosodio', 'maestro', 'bibliotecario']
    .map((x) => 'UN TLACUILO ES UN ' + x.toUpperCase()),
  // libertad a los...
  ['objetos', 'pinturas', 'discos', 'grabados', 'cassettes', '16mm',
   'revistas', 'vhs', 'carteles', 'fotografías', 'dvd', 'libros']
    .map((x) => 'LIBERTAD A LOS ' + x.toUpperCase()),
  // no nos incumben los...
  ['pdfs', 'torrents', 'wavs', 'descargas', 'jpgs', 'nft', 'memes', 'i.a.']
    .map((x) => 'NO NOS INCUMBEN LOS ' + x.toUpperCase()),
  // un libro se lee en...
  ['la cama', 'la hamaca', 'la fila', 'la recepción', 'el metro',
   'el camión', 'el avión', 'el café', 'el baño', 'el sofá']
    .map((x) => 'UN LIBRO SE LEE EN ' + x.toUpperCase()),
]

export default function Biblioticker() {
  // Pool inicial estable para SSR. Random después de hidratar.
  const [items, setItems] = useState<string[]>(POOLS[0])

  useEffect(() => {
    setItems(POOLS[Math.floor(Math.random() * POOLS.length)])
  }, [])

  // Contenido duplicado para loop continuo (el keyframe recorre -50%)
  const renderItems = (ariaHidden: boolean) => (
    <div
      aria-hidden={ariaHidden || undefined}
      className="flex gap-10 whitespace-nowrap font-mono text-[clamp(13px,1.4vw,18px)] text-text uppercase tracking-[0.1em] pr-10"
    >
      {items.map((item, i) => (
        <span key={i} className="inline-flex items-center gap-10">
          <span>{item}</span>
          <span className="text-text-dim">·</span>
        </span>
      ))}
    </div>
  )

  return (
    <section className="border-y border-rule bg-bg-soft overflow-hidden">
      <div className="flex items-center h-[clamp(44px,5vw,60px)]">
        <div className="ticker-track flex shrink-0">
          {renderItems(false)}
          {renderItems(true)}
        </div>
      </div>
    </section>
  )
}
