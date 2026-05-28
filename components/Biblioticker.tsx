'use client'

import { useEffect, useState } from 'react'

/**
 * Biblioticker — 1 hilera de letanías del booklet impreso.
 * Pool aleatorio por carga. Sin Supabase: data hardcoded.
 *
 * Sin auto-scroll (decisión Marina 2026-05-25: cero auto-movimiento).
 * El usuario puede arrastrar/scroll horizontal con trackpad si quiere ver todo.
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

  return (
    <section className="border-y border-rule bg-bg-soft">
      <div className="flex items-center h-[clamp(96px,11vw,140px)] overflow-x-auto overflow-y-hidden scrollbar-thin">
        <div className="flex gap-14 whitespace-nowrap font-mono font-bold text-[clamp(24px,3vw,44px)] text-text uppercase tracking-[0.08em] px-8">
          {items.map((item, i) => (
            <span key={i} className="inline-flex items-center gap-14">
              <span>{item}</span>
              <span className="text-text-dim">·</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
