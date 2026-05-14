'use client'

import { useEffect, useState } from 'react'

/**
 * Biblioticker — 1 hilera de letanías del booklet scrolling.
 * Pool aleatorio por carga (cambia al recargar la página).
 * Sin Supabase: data hardcoded del booklet impreso.
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
    <section className="border-y border-rule bg-bg-soft overflow-hidden">
      <div className="flex items-center h-[clamp(96px,11vw,140px)] overflow-hidden">
        <div
          className="flex gap-14 whitespace-nowrap font-mono font-bold text-[clamp(24px,3vw,44px)] text-text will-change-transform uppercase tracking-[0.08em]"
          style={{ animation: 'slideL 60s linear infinite' }}
        >
          {[...items, ...items].map((item, i) => (
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
