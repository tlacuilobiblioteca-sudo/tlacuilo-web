'use client'

/**
 * Cover para piezas de Artoteca (a diferencia de Cover de libros que busca en
 * OpenLibrary/Google Books, las piezas de arte solo tienen el archivo subido
 * a Supabase Storage).
 *
 * Diseño: aspect natural · object-contain. Si una pieza es horizontal o
 * cuadrada, se respeta. No fuerza a 2:3 vertical.
 */

type Props = {
  titulo: string
  portada_url: string | null
}

export default function ArtCover({ titulo, portada_url }: Props) {
  if (!portada_url) {
    return (
      <div className="w-full aspect-[3/4] bg-bg-soft flex items-center justify-center p-3 text-text-dim">
        <span className="font-serif italic leading-tight text-center text-[clamp(10px,0.85vw,13px)]">
          {titulo}
        </span>
      </div>
    )
  }

  return (
    <img
      src={portada_url}
      alt={titulo}
      className="w-full h-auto object-contain bg-bg-soft"
      loading="lazy"
      decoding="async"
    />
  )
}
