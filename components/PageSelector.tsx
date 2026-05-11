'use client'

import { useState } from 'react'

type Props = {
  currentPage: number
  totalPages: number
  categoria?: string
}

export default function PageSelector({ currentPage, totalPages, categoria }: Props) {
  const [open, setOpen] = useState(false)

  const buildUrl = (p: number) => {
    const sp = new URLSearchParams()
    sp.set('page', String(p))
    if (categoria) sp.set('categoria', categoria)
    return '/biblioteca?' + sp.toString()
  }

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="opacity-70 hover:opacity-100 uppercase tracking-wide hover:underline cursor-pointer"
      >
        {currentPage} / {totalPages}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50">
            <div className="bg-[#7C7AB0] text-black p-5 shadow-lg max-h-[60vh] overflow-y-auto min-w-[400px]">
              <div className="grid grid-cols-10 gap-x-4 gap-y-2 text-[clamp(10px,0.85vw,13px)] tracking-normal normal-case">
                {pages.map((p) => (
                  <a
                    key={p}
                    href={buildUrl(p)}
                    className={p === currentPage ? 'text-center font-bold hover:underline' : 'text-center opacity-80 hover:opacity-100 hover:underline'}
                    onClick={() => setOpen(false)}
                  >
                    {p}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
