'use client'

import TlacuiloWordmark from './TlacuiloWordmark'

/* ============================================================
   CoverPage — Portada del booklet
   Replicado del file Figma tR9uFoPn7WOcdrjuYcZAiC (nodeId 8001:777)
   - Fondo: #2A2838 (lilac depth)
   - 6 logos TLACUILO stackeados verticalmente
   - 5 logos en morado vibrante #5930CB
   - 1 logo (el 4to de 6) en verde lima #B8F200 como acento
   ============================================================ */

const COVER_BG = '#2A2838'
const PURPLE = '#5930CB'
const LIME = '#B8F200'

// 6 logos · misma estructura, 4to es verde lima (índice 3)
const ROWS = [PURPLE, PURPLE, PURPLE, LIME, PURPLE, PURPLE]

export default function CoverPage() {
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center px-[8%] py-[10%]"
      style={{ background: COVER_BG }}
    >
      <div className="flex flex-col items-stretch justify-center gap-[1.2%] w-full max-w-[68%]">
        {ROWS.map((color, i) => (
          <TlacuiloWordmark
            key={i}
            color={color}
            className="w-full h-auto block"
          />
        ))}
      </div>
    </div>
  )
}
