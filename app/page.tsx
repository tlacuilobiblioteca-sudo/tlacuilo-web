'use client'

import { useEffect, useRef, useState } from 'react'
import Header from '@/components/Header'
import Biblioticker from '@/components/Biblioticker'

/* ============================================================
   POOLS DE COPY — del booklet impreso de Tlacuilo
   ============================================================ */

type HeroLema = { head: string; pop: string; tail: string }

const HERO_POOL: HeroLema[] = [
  { head: 'UNA BIBLIOTECA NO ES UN EDIFICIO. ES UNA', pop: 'CULTURA DE ACCESO', tail: '' },
  { head: 'UNA BIBLIOTECA QUE NO PRESTA ES', pop: 'UNA CÁRCEL DE LIBROS', tail: '' },
  { head: '', pop: 'MI COSA ES TU COSA', tail: '' },
  { head: 'TLACUILO ES UNA', pop: 'ACCIÓN DIRECTA', tail: ' SOBRE LAS COSAS' },
  { head: 'TLACUILO ES PARA', pop: 'HABLAR CON LOS MUERTOS', tail: '' },
  { head: 'UN LIBRO QUE NUNCA ES LEÍDO', pop: 'ES UN LIBRO MUERTO', tail: '' },
  { head: 'UN LIBRO DEBE', pop: 'ACOMPAÑARTE', tail: ' A TODAS PARTES' },
  { head: 'TODOS SOMOS', pop: 'TLACUILOS', tail: '' },
]

/* ============================================================
   UTILS
   ============================================================ */

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/* ============================================================
   PÁGINA
   ============================================================ */

const STEPS = [
  { n: '01', t: 'Encuentra', d: <>explora el catálogo. busca por título, autor o categoría.</> },
  { n: '02', t: 'Aparta', d: <>guarda los libros que te interesan en tu morral.</> },
  { n: '03', t: 'Visita', d: <>agenda lun a vie, 10am-7pm, en Coyoacán.</> },
  { n: '04', t: 'Devuelve', d: <>2 meses máximo. después regresan a circular.</> },
]

const VISITS = [5, 10, 15, 20, 25, 30, 35, 40, 45]
const MAX_VISIT = 45

const CTA_PRIMARY = 'font-mono text-[13px] lowercase tracking-[0.06em] px-[26px] py-3.5 bg-invert-bg text-invert-fg border border-invert-bg font-bold no-underline inline-block transition-all duration-200 hover:bg-text-bright hover:border-text-bright hover:-translate-y-px cursor-pointer'

const CTA_GHOST = 'font-mono text-[13px] lowercase tracking-[0.06em] px-[26px] py-3.5 bg-transparent text-text border border-rule-strong no-underline inline-block transition-all duration-200 hover:text-text-bright hover:border-text-bright hover:-translate-y-px cursor-pointer'

export default function Home() {
  // Hero fijo: 1 lema random elegido al cargar. Cambia solo al recargar.
  const [heroLema, setHeroLema] = useState<HeroLema>(HERO_POOL[0])
  const escalaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setHeroLema(pickRandom(HERO_POOL))
  }, [])

  // Visibility pause: cuando la tab no está visible, pausamos animaciones
  // para no quemar batería ni datos del usuario.
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) {
        document.body.classList.add('anim-paused')
      } else {
        document.body.classList.remove('anim-paused')
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      document.body.classList.remove('anim-paused')
    }
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

        <h1 className="font-sonoran font-black uppercase text-text text-[clamp(38px,5.6vw,84px)] leading-[1.02] tracking-[0.04em] max-w-[1080px]">
          {heroLema.head && heroLema.head + ' '}
          <span className="pop">{heroLema.pop}</span>
          {heroLema.tail}
        </h1>

        <p className="font-sans font-medium text-text max-w-[600px] tracking-[0.02em] text-[clamp(15px,1.5vw,18px)] leading-[1.55]">
          una biblioteca pública en tu bolsillo. préstamo gratis de libros,
          vinilos, arte y objetos físicos — sin precio, sin candado, con confianza.
        </p>

        <div className="flex gap-3.5 flex-wrap justify-center mt-1.5">
          <a className={CTA_PRIMARY} href="/biblioteca">explorar la biblioteca</a>
          <a className={CTA_GHOST} href="https://instagram.com/tlacuilobiblioteca" target="_blank" rel="noreferrer">
            dm @tlacuilobiblioteca
          </a>
        </div>

        {/* State chips · stamps de manifiesto */}
        <div className="flex gap-3 flex-wrap justify-center mt-4 max-w-[640px]">
          {['sin precio', 'sin candado', 'sin algoritmo', 'sin intermediario'].map((label) => (
            <span
              key={label}
              className="inline-flex items-center gap-2 px-3 py-1.5 border border-rule-strong font-mono text-[11px] uppercase tracking-[0.08em] text-text-dim"
            >
              <span className="w-2 h-2 rounded-full bg-text-dim animate-pulse-dot" />
              {label}
            </span>
          ))}
        </div>

      </section>

      {/* ============ BIBLIOTICKER (3 hileras de letanías) ============ */}
      <Biblioticker />

      {/* ============ CÓMO FUNCIONA ============ */}
      <section className="px-14 pt-[90px] pb-[100px] border-t border-rule max-md:px-5">
        <h2 className="font-sonoran font-black uppercase text-text leading-none tracking-[0.04em] mb-[18px] text-[clamp(28px,3.8vw,56px)]">
          la confianza<br />crece con cada visita.
        </h2>
        <p className="font-sans text-[15px] text-text-dim leading-[1.6] max-w-[620px] mb-12">
          tlacuilo es un sistema de préstamo de objetos físicos. la biblioteca
          se mueve por confianza, y la confianza se gana usándola.
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

      {/* ============ TODOS SOMOS TLACUILOS (federación v0) ============ */}
      <section className="px-14 pt-[90px] pb-[100px] border-t border-rule max-md:px-5">
        <p className="font-mono uppercase tracking-[0.2em] text-xs text-text-dim mb-3">
          &gt; federación
        </p>
        <h2 className="font-sonoran font-black uppercase text-text leading-none tracking-[0.04em] mb-[18px] text-[clamp(28px,3.8vw,56px)]">
          no somos una.<br />somos muchas.
        </h2>
        <p className="font-sans text-[15px] text-text-dim leading-[1.6] max-w-[620px] mb-10">
          tlacuilo es solo el comienzo. cualquiera podrá subir su biblioteca
          personal y compartirla. cada casa una sucursal, cada lectora bibliotecaria.
          una red distribuida, sin precio, sin intermediario.
        </p>
        <div className="flex gap-3.5 flex-wrap items-center">
          <span className="inline-flex items-center gap-2 px-4 py-3 border border-rule bg-bg-soft font-mono text-[12px] uppercase tracking-[0.06em] text-text-dim">
            <span className="w-2 h-2 rounded-full bg-loan animate-pulse-dot" />
            próximamente · federación v0
          </span>
          <span className="font-mono text-[11px] text-text-faint lowercase tracking-wider">
            (avísanos si quieres ser nodo)
          </span>
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
        <div className="w-[34px] h-10 relative">
          <img src="/logodark.svg" alt="tlacuilo" className="logo-dark absolute inset-0 w-full h-full object-contain opacity-70" />
          <img src="/logolight.svg" alt="tlacuilo" className="logo-light absolute inset-0 w-full h-full object-contain opacity-70" aria-hidden="true" />
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
