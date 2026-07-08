'use client'

import { useState, ReactNode } from 'react'

/* ============================================================
   BOOKLET INTERACTIVO · /manifesto
   Libro pasa-páginas con el copy canónico del booklet impreso
   (7 spreads). Placeholder de diseño: cuando Marina exporte los
   SVGs finales por página, se montan tal cual aquí.
   Sin autoplay: solo gira por click / flechas / teclado.
   ============================================================ */

const litany = 'font-mono text-[clamp(8px,1vw,12.5px)] leading-[1.9] uppercase tracking-[0.06em]'
const heading = 'font-mono font-medium text-[clamp(9px,1.1vw,13px)] uppercase tracking-[0.14em] mb-5'
const lema = 'font-acacia uppercase text-[clamp(14px,2.2vw,26px)] leading-[1.15]'
const nota = 'font-micro text-[clamp(7.5px,0.95vw,11px)] leading-[1.8] tracking-[0.04em]'
const pgNum = 'mt-auto font-micro text-[9px] tracking-[0.14em] opacity-45 uppercase'

function Pg({ children }: { children: ReactNode }) {
  return <div className="w-full h-full p-[7%_9%] flex flex-col">{children}</div>
}

const PORTADA = (
  <Pg>
    <div className="font-acacia uppercase text-[clamp(20px,3.4vw,42px)] leading-[1.22] tracking-[0.02em] my-auto">
      {Array.from({ length: 7 }, (_, i) => (
        <span key={i} className={`block ${i === 3 ? 'opacity-35' : ''}`}>TLACUILO</span>
      ))}
    </div>
  </Pg>
)

const PAGES: { front: ReactNode; back: ReactNode; frontCover?: boolean; backCover?: boolean }[] = [
  {
    front: PORTADA,
    frontCover: true,
    back: (
      <Pg>
        <h3 className={heading}>Manifiesto</h3>
        <ul className={litany}>
          <li>TLACUILO NO ES UN EDIFICIO</li>
          <li>TLACUILO NO ES UNA COLECCIÓN DE LIBROS</li>
          <li>TLACUILO ES UN SISTEMA DE PRÉSTAMO DE OBJETOS</li>
          <li>TLACUILO ES UN SISTEMA DE GESTIÓN DEL BIEN COMÚN</li>
          <li>TLACUILO ES UNA CULTURA DE ACCESO</li>
          <li>TLACUILO ES PARA HABLAR CON LOS MUERTOS</li>
        </ul>
        <span className={pgNum}>1</span>
      </Pg>
    ),
  },
  {
    front: (
      <Pg>
        <h3 className={heading}>Un tlacuilo es</h3>
        <ul className={litany}>
          <li>ESCRITOR · PINTOR · ESCRIBA</li>
          <li>CRONISTA · LECTOR · BIBLIÓFILO</li>
          <li>ESTUDIANTE · ARCHIVISTA</li>
          <li>DIVULGADOR · PROSODIO</li>
          <li>MAESTRO · BIBLIOTECARIO</li>
        </ul>
        <span className={pgNum}>2</span>
      </Pg>
    ),
    back: (
      <Pg>
        <h3 className={heading}>No nos incumben</h3>
        <ul className={litany}>
          <li>PDFS · TORRENTS · WAVS</li>
          <li>DESCARGAS · JPGS · NFT</li>
          <li>MEMES · I.A.</li>
        </ul>
        <span className={pgNum}>3</span>
      </Pg>
    ),
  },
  {
    front: (
      <Pg>
        <h3 className={heading}>Tecas tlacuilo</h3>
        <ul className={litany}>
          <li>BIBLIOTECA · ARTOTECA · FILMOTECA</li>
          <li>FONOTECA · GLIPTOTECA · LUDOTECA</li>
          <li>FOTOTECA · FANZINOTECA · HEMEROTECA</li>
          <li>PINACOTECA · FILATELOTECA · MAPOTECA</li>
          <li>NUMISMOTECA · VIDEOTECA</li>
          <li>DIAPOSITECA · HOLOTECA</li>
        </ul>
        <span className={pgNum}>4</span>
      </Pg>
    ),
    back: (
      <Pg>
        <p className={lema}>Una biblioteca que no presta es una cárcel de libros</p>
        <h3 className={`${heading} mt-7`}>Un libro se lee en</h3>
        <ul className={litany}>
          <li>CAMA · HAMACA · FILA · RECEPCIÓN</li>
          <li>METRO · CAMIÓN · AVIÓN</li>
          <li>CAFÉ · BAÑO · SOFÁ</li>
        </ul>
        <span className={pgNum}>5</span>
      </Pg>
    ),
  },
  {
    front: (
      <Pg>
        <h3 className={heading}>Libertad a los</h3>
        <ul className={litany}>
          <li>OBJETOS · PINTURAS · DISCOS</li>
          <li>GRABADOS · CASSETTES · 16MM</li>
          <li>REVISTAS · VHS · CARTELES</li>
          <li>FOTOGRAFÍAS · DVD · LIBROS</li>
        </ul>
        <span className={pgNum}>6</span>
      </Pg>
    ),
    back: (
      <Pg>
        <p className={lema}>Un libro que nunca es leído es un libro muerto</p>
        <p className={`${lema} mt-4`}>Un libro debe acompañarte a todas partes</p>
        <p className={`${lema} mt-4`}>Mi cosa es tu cosa</p>
        <span className={pgNum}>7</span>
      </Pg>
    ),
  },
  {
    front: (
      <Pg>
        <h3 className={heading}>Manual usuarix</h3>
        <p className={nota}>
          TLACUILO ES UNA ACCIÓN DIRECTA SOBRE LAS COSAS.<br />
          PRESTAR Y TOMAR PRESTADO.<br /><br />
          catálogo vía QR<br />
          recomendaciones por DM · @TLACUILOBIBLIOTECA<br />
          agenda tu visita para recoger materiales<br /><br />
          servicio de préstamo · CDMX
        </p>
        <span className={pgNum}>8</span>
      </Pg>
    ),
    back: (
      <Pg>
        <h3 className={heading}>Logística</h3>
        <p className={nota}>
          préstamo máximo · 2 meses<br /><br />
          escala de confianza por visita:<br />
          1ª · 5 libros<br />2ª · 10<br />3ª · 15<br />4ª · 20<br />5ª · 25<br />
          6ª · 30<br />7ª · 35<br />8ª · 40<br />9ª · 45
        </p>
        <span className={pgNum}>9</span>
      </Pg>
    ),
  },
  {
    front: (
      <Pg>
        <div className="my-auto">
          <p className={lema}>@tlacuilobiblioteca</p>
          <p className={`${nota} mt-4`}>hola@tlacuilo.org · cdmx · coyoacán</p>
        </div>
        <span className={pgNum}>10</span>
      </Pg>
    ),
    back: (
      <Pg>
        <h3 className={heading}>In tlahcuilo · náhuatl</h3>
        <p className={`${lema} text-[clamp(12px,1.7vw,20px)]`}>
          in qualli tlahcuilo<br />
          mihmati · yolteutl<br />
          tlayolteuiani<br />
          moyolnonotzani
        </p>
        <span className={pgNum}>11</span>
      </Pg>
    ),
  },
  {
    front: (
      <Pg>
        <h3 className={heading}>El pintor · español</h3>
        <p className={`${lema} text-[clamp(12px,1.7vw,20px)]`}>
          el buen pintor:<br />
          <span className="opacity-60">entendido, dios en su corazón.</span><br />
          diviniza con su corazón las cosas.<br />
          dialoga con su propio corazón.
        </p>
        <p className={`${nota} mt-auto opacity-60`}>fragmento del códice florentino</p>
        <span className={pgNum}>12</span>
      </Pg>
    ),
    backCover: true,
    back: (
      <Pg>
        <div className="my-auto self-center text-center">
          <span
            role="img"
            aria-label="tlacuilo"
            className="logo-wordmark w-[140px] mx-auto"
            style={{ backgroundColor: '#6E6BA0' }}
          />
          <p className="font-micro text-[10px] tracking-[0.14em] uppercase mt-6 opacity-70">
            mi cosa es tu cosa.
          </p>
        </div>
        <span className={`${pgNum} self-center`}>tlacuilo · cdmx · los comunes</span>
      </Pg>
    ),
  },
]

export default function BookletViewer() {
  const [pos, setPos] = useState(0)
  const N = PAGES.length
  const go = (p: number) => setPos(Math.max(0, Math.min(N, p)))

  return (
    <div
      className="flex flex-col items-center gap-7 outline-none"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') go(pos + 1)
        if (e.key === 'ArrowLeft') go(pos - 1)
      }}
    >
      <div className="booklet-scene w-full flex justify-center">
        <div className="booklet w-[min(88vw,860px)] aspect-[900/620]">
          {PAGES.map((sheet, i) => (
            <div
              key={i}
              className={`booklet-sheet ${i < pos ? 'flipped' : ''}`}
              style={{ zIndex: i < pos ? i + 1 : N - i }}
              onClick={() => (i < pos ? go(i) : go(i + 1))}
            >
              <div className={`booklet-face front ${sheet.frontCover ? 'booklet-cover' : ''}`}>
                {sheet.front}
              </div>
              <div className={`booklet-face back ${sheet.backCover ? 'booklet-cover' : ''}`}>
                {sheet.back}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-5">
        <button
          type="button"
          aria-label="página anterior"
          disabled={pos === 0}
          onClick={() => go(pos - 1)}
          className="font-micro text-[13px] px-4 py-2 border border-rule-strong text-text hover:border-text-bright disabled:opacity-25 transition-colors cursor-pointer disabled:cursor-default"
        >
          ←
        </button>
        <div className="flex gap-2">
          {PAGES.map((_, i) => (
            <span
              key={i}
              className={`w-[7px] h-[7px] rounded-full transition-colors ${
                i === Math.max(0, pos - 1) ? 'bg-morado' : 'bg-rule'
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          aria-label="página siguiente"
          disabled={pos === N}
          onClick={() => go(pos + 1)}
          className="font-micro text-[13px] px-4 py-2 border border-rule-strong text-text hover:border-text-bright disabled:opacity-25 transition-colors cursor-pointer disabled:cursor-default"
        >
          →
        </button>
      </div>
    </div>
  )
}
