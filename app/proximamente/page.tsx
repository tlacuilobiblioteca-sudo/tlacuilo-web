import Link from 'next/link'
import Header from '@/components/Header'

/** Destino de secciones aún sin catalogar (2026-07-17): ningún link muere en "#". */
export default function ProximamentePage() {
  return (
    <>
      <Header />
      <section className="px-10 py-24 max-w-3xl mx-auto max-md:px-5">
        <p className="font-mono uppercase tracking-[0.2em] text-[clamp(10px,0.8vw,13px)] opacity-60 mb-2">&gt; próximamente</p>
        <h1 className="font-mono uppercase tracking-wide leading-tight text-[clamp(28px,3.5vw,52px)] text-text-bright mb-4">
          Estamos catalogando
        </h1>
        <p className="opacity-70 mb-8 text-[clamp(14px,1.1vw,17px)]">próximamente lo ves aquí.</p>
        <Link href="/" className="font-mono text-sm uppercase tracking-wider underline hover:text-text-bright">
          ← volver
        </Link>
      </section>
    </>
  )
}
