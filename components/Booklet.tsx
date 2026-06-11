'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import CoverPage from './booklet/CoverPage'

/* react-pageflip no soporta SSR — dynamic import sin ssr.
   Loader vacío mientras carga del lado del cliente. */
const HTMLFlipBook = dynamic(() => import('react-pageflip'), {
  ssr: false,
  loading: () => null,
})

/* ============================================================
   <Booklet />
   Flipbook 3D del booklet impreso de Tlacuilo.
   - 7 páginas reconstruidas vectorialmente del file Figma tR9uFoPn7WOcdrjuYcZAiC
   - Cada página es JSX vivo (editable, escalable, sin pesados PNGs)
   - Cerrado muestra portada centrada · click abre · flip 3D
   - No autoplay (respeta canon de tlacuilo)
   ============================================================ */

/* Cada página: si Marina exporta el PNG desde Figma a /public/booklet/, se usa.
   Si todavía no está, cae al fallback (Cover JSX vectorial o placeholder gris). */
type Page = {
  src: string
  alt: string
  fallback: React.ReactNode
}

const PAGES: Page[] = [
  { src: '/booklet/01-cover.png', alt: 'Tlacuilo · portada', fallback: <CoverPage /> },
  { src: '/booklet/02-spread5.png', alt: 'Qué es Tlacuilo · Un tlacuilo es', fallback: <Placeholder label="Spread 5" /> },
  { src: '/booklet/03-spread6.png', alt: 'No nos incumben · Tecas Tlacuilo', fallback: <Placeholder label="Spread 6" /> },
  { src: '/booklet/04-spread7.png', alt: 'Cárcel · Libertad a los', fallback: <Placeholder label="Spread 7" /> },
  { src: '/booklet/05-spread8.png', alt: 'Spread 8', fallback: <Placeholder label="Spread 8" /> },
  { src: '/booklet/06-spread9.png', alt: 'In Tlahcuilo · El pintor', fallback: <Placeholder label="Spread 9" /> },
  { src: '/booklet/07-back.png', alt: 'Tlacuilo · contraportada', fallback: <Placeholder label="Contraportada" /> },
]

function Placeholder({ label }: { label: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-[#2A2838] text-bone font-mono text-xs uppercase tracking-[0.12em] opacity-60 text-center px-6">
      <span>{label}<br />pendiente · exporta el PNG desde Figma</span>
    </div>
  )
}

function PageImage({ src, alt, fallback }: Page) {
  const [failed, setFailed] = useState(false)
  if (failed) return <>{fallback}</>
  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover block select-none"
      draggable={false}
      onError={() => setFailed(true)}
    />
  )
}

export default function Booklet() {
  const bookRef = useRef<any>(null)
  const [dims, setDims] = useState<{ w: number; h: number }>({ w: 500, h: 500 })
  const [page, setPage] = useState(0)
  const [opened, setOpened] = useState(false)

  // Ajusta el tamaño del booklet al viewport (responsive).
  // Aspect ratio 3:4 (libro vertical, como el Figma original 456x618 = ~0.74).
  useEffect(() => {
    const updateDims = () => {
      const vw = Math.min(window.innerWidth, 1800)
      const vh = window.innerHeight
      const ratio = 0.74 // ancho / alto · vertical formato libro

      // Cuando está abierto se ven 2 páginas, ancho total = 2 * pageW.
      // Cuando está cerrado se ve 1 página, ancho = pageW.
      // Calculamos pageH primero (limitado por viewport vertical), luego pageW.
      const maxByHeight = vh * 0.88
      const maxByWidthOpen = (vw * 0.92) / 2 / ratio // para no salirse cuando abre

      let h = Math.min(maxByHeight, maxByWidthOpen, 900)
      // Mínimo razonable
      h = Math.max(h, 360)
      const w = Math.round(h * ratio)
      setDims({ w, h: Math.round(h) })
    }
    updateDims()
    window.addEventListener('resize', updateDims)
    return () => window.removeEventListener('resize', updateDims)
  }, [])

  const goPrev = () => bookRef.current?.pageFlip()?.flipPrev()
  const goNext = () => bookRef.current?.pageFlip()?.flipNext()

  const totalPages = PAGES.length

  return (
    <div className="relative w-full flex flex-col items-center justify-center gap-6 py-6">
      <div
        className="relative"
        style={{
          width: opened ? dims.w * 2 : dims.w,
          height: dims.h,
          transition: 'width 0.4s ease',
        }}
      >
        <HTMLFlipBook
          ref={bookRef}
          width={dims.w}
          height={dims.h}
          size="stretch"
          minWidth={200}
          maxWidth={900}
          minHeight={200}
          maxHeight={900}
          showCover={true}
          maxShadowOpacity={0.4}
          mobileScrollSupport={true}
          drawShadow={true}
          flippingTime={700}
          usePortrait={true}
          startPage={0}
          autoSize={false}
          clickEventForward={true}
          useMouseEvents={true}
          swipeDistance={30}
          showPageCorners={true}
          disableFlipByClick={false}
          className="booklet-flip"
          style={{}}
          startZIndex={0}
          onFlip={(e: any) => {
            setPage(e.data)
            setOpened(e.data > 0 && e.data < totalPages - 1)
          }}
          onChangeOrientation={() => {}}
          onChangeState={() => {}}
          onInit={() => {}}
          onUpdate={() => {}}
        >
          {PAGES.map((p, i) => (
            <div key={i} className="booklet-page bg-bone overflow-hidden">
              <PageImage {...p} />
            </div>
          ))}
        </HTMLFlipBook>
      </div>

      {/* Controles · solo aparecen cuando el libro está abierto */}
      <div className="flex items-center gap-6 font-mono uppercase tracking-[0.12em] text-[clamp(11px,0.95vw,13px)] text-text-dim">
        <button
          type="button"
          onClick={goPrev}
          disabled={page === 0}
          className="hover:text-text-bright transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ← anterior
        </button>
        <span className="font-micro text-[10px] tracking-[0.12em] text-dirty tabular-nums">
          {String(page + 1).padStart(2, '0')} / {String(totalPages).padStart(2, '0')}
        </span>
        <button
          type="button"
          onClick={goNext}
          disabled={page === totalPages - 1}
          className="hover:text-text-bright transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          siguiente →
        </button>
      </div>

      {/* Hint inicial */}
      {page === 0 && (
        <p className="font-micro text-[10px] uppercase tracking-[0.14em] text-text-faint">
          {'>'} clic en la portada para abrir el booklet
        </p>
      )}
    </div>
  )
}
