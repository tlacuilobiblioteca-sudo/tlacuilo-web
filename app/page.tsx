'use client'

import { useEffect, useRef, useState } from 'react'
import Header from '@/components/Header'

/* ============================================================
   POOLS DE COPY — del booklet impreso de Tlacuilo
   ============================================================ */

type HeroLema = { head: string; pop: string; tail: string }

const HERO_POOL: HeroLema[] = [
  { head: 'TLACUILO NO ES UN EDIFICIO.', pop: 'CULTURA DE ACCESO', tail: ' ES UNA CULTURA DE ACCESO.' },
  { head: 'UNA BIBLIOTECA QUE NO PRESTA', pop: 'UNA CÁRCEL DE LIBROS', tail: ' ES UNA CÁRCEL DE LIBROS.' },
  { head: '', pop: 'MI COSA ES TU COSA', tail: '.' },
  { head: 'TLACUILO ES UNA', pop: 'ACCIÓN DIRECTA', tail: ' SOBRE LAS COSAS.' },
  { head: 'TLACUILO ES PARA', pop: 'HABLAR CON LOS MUERTOS', tail: '.' },
  { head: 'UN LIBRO QUE NUNCA ES LEÍDO', pop: 'ES UN LIBRO MUERTO', tail: '.' },
  { head: 'UN LIBRO DEBE', pop: 'ACOMPAÑARTE', tail: ' A TODAS PARTES.' },
]

type Letania = { label: string; items: string[] }

const BANNER_POOL: Letania[] = [
  {
    label: 'libertad a los...',
    items: ['objetos', 'pinturas', 'discos', 'grabados', 'cassettes', '16mm', 'revistas', 'vhs', 'carteles', 'fotografías', 'dvd', 'libros']
      .map((x) => 'LIBERTAD A LOS ' + x.toUpperCase()),
  },
  {
    label: 'un tlacuilo es un...',
    items: ['escritor', 'pintor', 'escriba', 'cronista', 'lector', 'bibliófilo', 'estudiante', 'archivista', 'divulgador', 'prosodio', 'maestro', 'bibliotecario']
      .map((x) => 'UN TLACUILO ES UN ' + x.toUpperCase()),
  },
  {
    label: 'no nos incumben...',
    items: ['pdfs', 'torrents', 'wavs', 'descargas', 'jpgs', 'nft', 'memes', 'i.a.']
      .map((x) => 'NO NOS INCUMBEN LOS ' + x.toUpperCase()),
  },
  {
    label: 'un libro se lee en...',
    items: ['la cama', 'la hamaca', 'la fila', 'la recepción', 'el metro', 'el camión', 'el avión', 'el café', 'el baño', 'el sofá']
      .map((x) => 'UN LIBRO SE LEE EN ' + x.toUpperCase()),
  },
]

/* ============================================================
   UTILS
   ============================================================ */

function dayHash(): number {
  const d = new Date()
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = arr.slice()
  let s = seed
  const rand = () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/* ============================================================
   PÁGINA
   ============================================================ */

const STEPS = [
  { n: '01', t: 'Consulta el catálogo', d: <>por código QR o explorando las tecas en línea.</> },
  { n: '02', t: 'Manda un DM', d: <>a <b className="font-bold">@tlacuilobiblioteca</b> con tus libros o pidiendo recomendaciones.</> },
  { n: '03', t: 'Acordamos visita', d: <>te enviamos dirección, día y horario. recoges en persona.</> },
  { n: '04', t: '2 meses máximo', d: <>para devolverlos. después regresan al acervo común.</> },
]

const VISITS = [5, 10, 15, 20, 25, 30, 35, 40, 45]
const MAX_VISIT = 45

const CTA_PRIMARY = 'font-mono text-[13px] lowercase tracking-[0.06em] px-[26px] py-3.5 bg-invert-bg text-invert-fg border border-invert-bg font-bold no-underline inline-block transition-all duration-200 hover:bg-text-bright hover:border-text-bright hover:-translate-y-px cursor-pointer'

const CTA_GHOST = 'font-mono text-[13px] lowercase tracking-[0.06em] px-[26px] py-3.5 bg-transparent text-text border border-rule-strong no-underline inline-block transition-all duration-200 hover:text-text-bright hover:border-text-bright hover:-translate-y-px cursor-pointer'

export default function Home() {
  const [heroLemas, setHeroLemas] = useState<HeroLema[]>([HERO_POOL[0]])
  const [heroIdx, setHeroIdx] = useState(0)
  const [heroFading, setHeroFading] = useState(false)
  const [letania, setLetania] = useState<Letania>(BANNER_POOL[0])
  const escalaRef = useRef<HTMLDivElement>(null)

  // Hero: 3 lemas elegidos por semilla diaria
  useEffect(() => {
    const chosen = seededShuffle(HERO_POOL, dayHash()).slice(0, 3)
    setHeroLemas(chosen)
    setHeroIdx(0)
  }, [])

  // Hero: rotación cada 9s
  useEffect(() => {
    if (heroLemas.length < 2) return
    const interval = setInterval(() => {
      setHeroFading(true)
      setTimeout(() => {
        setHeroIdx((i) => (i + 1) % heroLemas.length)
        setHeroFading(false)
      }, 500)
    }, 9000)
    return () => clearInterval(interval)
  }, [heroLemas])

  // Banner: 1 letanía aleatoria por visita
  useEffect(() => {
    setLetania(pickRandom(BANNER_POOL))
  }, [])

  // Escala: animar barras al entrar al viewport
  useEffect(() => {
    if (!escalaRef.current) return
    const bars = escalaRef.current.querySelectorAll<HTMLDivElement>('.escala-bar')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            bars.forEach((b, i) => {
              setTimeout(() => {
                const h = b.dataset.h
                if (h) b.style.setProperty('--h', h)
                b.classList.add('in')
              }, 80 * i)
            })
            observer.disconnect()
          }
        })
      },
      { threshold: 0.3 }
    )
    observer.observe(escalaRef.current)
    return () => observer.disconnect()
  }, [])

  const heroLema = heroLemas[heroIdx] ?? HERO_POOL[0]
  const trackItems = letania.items

  return (
    <>
      <Header />

      {/* ============ HERO ============ */}
      <section className="relative flex flex-col items-center justify-center text-center gap-7 min-h-[62vh] px-14 pt-[60px] pb-[100px] max-md:px-5">
        <div className="font-mono text-xs text-text-dim tracking-[0.18em] lowercase">
          activación de bibliotecas
          <span className="inline-block w-1.5 h-1.5 bg-text mx-2.5 align-baseline animate-pulse-dot" />
          cdmx
        </div>

        <h1 className={`hero-h1 font-sonoran font-black uppercase text-text text-[clamp(38px,5.6vw,84px)] leading-[1.02] tracking-[0.04em] max-w-[1080px] min-h-[1.1em] ${heroFading ? 'fading' : ''}`}>
          {heroLema.head && heroLema.head + ' '}
          <span className="pop">{heroLema.pop}</span>
          {heroLema.tail}
        </h1>

        <p className="font-sans font-medium text-text max-w-[600px] tracking-[0.02em] text-[clamp(15px,1.5vw,18px)] leading-[1.55]">
          una biblioteca pública en tu bolsillo. préstamo gratis de libros,
          vinilos, arte y objetos físicos — sin precio, sin candado, con confianza.
        </p>

        <div className="flex gap-3.5 flex-wrap justify-center mt-1.5">
          <a className={CTA_PRIMARY} href="/biblioteca">explorar el acervo</a>
          <a className={CTA_GHOST} href="https://instagram.com/tlacuilobiblioteca" target="_blank" rel="noreferrer">
            dm @tlacuilobiblioteca
          </a>
        </div>
      </section>

      {/* ============ BANNER MARQUEE ============ */}
      <section className="relative border-y border-rule bg-bg-soft overflow-hidden">
        <div className="absolute top-3.5 left-6 z-[3] font-mono text-[11px] text-text-dim tracking-[0.18em] lowercase bg-bg px-2.5 py-1 border border-rule">
          &gt; {letania.label}
        </div>
        <div className="flex items-center h-[108px] overflow-hidden">
          <div className="flex gap-12 whitespace-nowrap font-sonoran font-black uppercase text-text leading-none tracking-[0.05em] text-[clamp(32px,3.8vw,56px)] will-change-transform animate-slide-l">
            {[...trackItems, ...trackItems].map((item, i) => (
              <span key={i} className="inline-flex gap-12 items-center">
                <span>{item}</span>
                <span className="text-text-dim font-black">/</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CÓMO FUNCIONA ============ */}
      <section className="px-14 pt-[90px] pb-[100px] border-t border-rule max-md:px-5">
        <h2 className="font-sonoran font-black uppercase text-text leading-none tracking-[0.04em] mb-[18px] text-[clamp(28px,3.8vw,56px)]">
          la confianza<br />crece con cada visita.
        </h2>
        <p className="font-sans text-[15px] text-text-dim leading-[1.6] max-w-[620px] mb-12">
          tlacuilo es un sistema de préstamo de objetos físicos. el acervo se
          mueve por confianza, y la confianza se gana usándolo.
        </p>

        <div className="grid grid-cols-4 gap-3.5 mb-[60px] max-[860px]:grid-cols-2">
          {STEPS.map((s) => (
            <div key={s.n} className="relative flex flex-col gap-2 border border-rule bg-bg-card px-4 py-[18px]">
              <div className="font-mono text-[11px] text-text-dim tracking-[0.18em] lowercase">{s.n}</div>
              <div className="font-sonoran font-black uppercase text-text leading-[1.15] tracking-[0.04em] text-[clamp(15px,1.5vw,19px)]">{s.t}</div>
              <div className="font-sans text-[13px] text-text-dim leading-[1.5]">{s.d}</div>
            </div>
          ))}
        </div>

        <div className="mt-[30px]">
          <div className="font-mono text-xs text-text-dim tracking-[0.18em] lowercase mb-[18px]">
            &gt; el préstamo escala con tus visitas
          </div>
          <div ref={escalaRef} className="grid grid-cols-9 gap-2 items-end h-[220px] border-b border-rule">
            {VISITS.map((n, i) => {
              const pct = Math.round((n / MAX_VISIT) * 100)
              return (
                <div
                  key={n}
                  className="escala-bar relative flex flex-col items-center justify-end h-full"
                  data-h={`${pct}%`}
                >
                  <div className="escala-bar-col flex items-start justify-center pt-1.5 font-mono text-[11px] font-bold text-invert-fg tracking-[0.04em]">{n}</div>
                  <div className="absolute -bottom-[22px] left-0 right-0 text-center font-mono text-[10px] text-text-dim tracking-[0.06em] lowercase">{i + 1}ª · {n}</div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-12 font-sonoran font-black uppercase text-text leading-[1.15] tracking-[0.04em] text-[clamp(20px,2.4vw,32px)] max-w-[680px]">
          en tu <span className="pop pop-sm">1ª</span> visita: 5 libros.<br />
          en tu <span className="pop pop-sm">9ª</span>: 45.
        </div>

        <div className="flex gap-3.5 flex-wrap mt-10">
          <a className={CTA_PRIMARY} href="https://instagram.com/tlacuilobiblioteca" target="_blank" rel="noreferrer">
            agendar mi primera visita
          </a>
          <a className={CTA_GHOST} href="#">
            ver el manifiesto completo
          </a>
        </div>
      </section>

      {/* ============ CIERRE NÁHUATL ============ */}
      <section className="px-14 pt-[90px] pb-[80px] border-t border-rule bg-[#101018] max-md:px-5">
        <div className="grid grid-cols-2 gap-12 max-w-[1100px] mx-auto max-[780px]:grid-cols-1 max-[780px]:gap-8">
          <div>
            <h3 className="font-mono text-xs text-text-dim tracking-[0.18em] lowercase mb-6">&gt; in tlahcuilo · náhuatl</h3>
            <div className="font-sonoran font-black uppercase text-text leading-[1.2] tracking-[0.03em] text-[clamp(22px,2.6vw,36px)]">
              in qualli tlahcuilo<br />
              mihmati · yolteutl<br />
              tlayolteuiani<br />
              moyolnonotzani
            </div>
          </div>
          <div>
            <h3 className="font-mono text-xs text-text-dim tracking-[0.18em] lowercase mb-6">&gt; el pintor · español</h3>
            <div className="font-sonoran font-black uppercase text-text leading-[1.2] tracking-[0.03em] text-[clamp(22px,2.6vw,36px)]">
              el buen pintor:<br />
              <span className="text-text-dim">entendido,</span><br />
              <span className="text-text-dim">dios en su corazón.</span><br />
              diviniza con su corazón las cosas.<br />
              dialoga con su propio corazón.
            </div>
          </div>
        </div>
        <div className="mt-[60px] text-center font-mono text-xs text-text-faint tracking-[0.18em] lowercase">
          — spread 7 del booklet · fragmento del códice florentino
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="grid grid-cols-[auto_1fr_auto] gap-8 items-center px-14 py-9 border-t border-rule font-mono text-xs text-text-dim tracking-[0.04em] lowercase max-[700px]:grid-cols-1 max-[700px]:gap-4 max-[700px]:text-center max-[700px]:justify-items-center">
        <div className="w-[34px] h-10">
          <img src="/logodark.svg" alt="tlacuilo" className="w-full h-full object-contain opacity-70" />
        </div>
        <div className="flex flex-wrap gap-[22px]">
          <a href="https://instagram.com/tlacuilobiblioteca" target="_blank" rel="noreferrer" className="text-text no-underline hover:text-text-bright transition-colors">@tlacuilobiblioteca</a>
          <a href="#" className="text-text no-underline hover:text-text-bright transition-colors">manifiesto</a>
          <a href="#" className="text-text no-underline hover:text-text-bright transition-colors">booklet</a>
          <a href="/biblioteca" className="text-text no-underline hover:text-text-bright transition-colors">catálogo</a>
          <a href="mailto:hola@tlacuilo.mx" className="text-text no-underline hover:text-text-bright transition-colors">contacto</a>
        </div>
        <div className="text-text-faint">© tlacuilo · 2026 · cdmx · los comunes</div>
      </footer>
    </>
  )
}
