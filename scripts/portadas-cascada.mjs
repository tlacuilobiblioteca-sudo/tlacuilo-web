// EL SCRIPT MAMADISIMO DE PORTADAS
// Busca portada para cada libro sin portada_url, en cascada:
//   1. Open Library por ISBN
//   2. Google Books por ISBN
//   3. Open Library por titulo+autor
//   4. Google Books por titulo+autor
//   5. Internet Archive por titulo+autor
//   6. LibraryThing por ISBN (solo si hay LT_DEVKEY en .env.local)
// Lo que encuentra: valida que sea imagen real, convierte a WebP (max 1200px, q82),
// sube al bucket "portadas" como <id>.webp y actualiza portada_url + has_portada.
//
// ES RESUMIBLE: guarda progreso en ./portadas-progreso.json. Si se interrumpe,
// vuelve a correrlo y retoma donde iba sin repetir libros ya resueltos.
//
// Correr desde la raiz del repo tlacuilo-web (usa .env.local):
//   node "<ruta a este archivo>"                  -> corre completo
//   node "<ruta a este archivo>" --dry            -> no sube ni escribe DB, solo reporta
//   node "<ruta a este archivo>" --limite 50      -> solo procesa 50 (para probar)
//   node "<ruta a este archivo>" --reintentar     -> vuelve a intentar los que fallaron antes
//
// Al final escribe ./portadas-huerfanas.csv con los libros que no encontro
// en ninguna fuente (para la fase manual / publishers).

import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

// ---- leer .env.local sin dependencias ----
const env = {}
try {
  for (const linea of readFileSync(resolve(process.cwd(), '.env.local'), 'utf8').split('\n')) {
    const m = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/)
    if (m) env[m[1]] = m[2]
  }
} catch {
  console.error('No encontre .env.local — corre este script desde la raiz del repo tlacuilo-web')
  process.exit(1)
}

const URL_SB = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY
const LT_DEVKEY = env.LT_DEVKEY || null
const GB_KEY = env.GOOGLE_BOOKS_KEY || null // opcional: sube la cuota de Google Books
if (!URL_SB || !SERVICE_KEY) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const sb = createClient(URL_SB, SERVICE_KEY)
const BUCKET = 'portadas'
const DRY = process.argv.includes('--dry')
const REINTENTAR = process.argv.includes('--reintentar')
const iLim = process.argv.indexOf('--limite')
const LIMITE = iLim > -1 ? parseInt(process.argv[iLim + 1], 10) : Infinity
// --fuentes google        -> usa solo las fuentes cuyo nombre contenga "google"
// --fuentes openlibrary,ia -> varias, separadas por coma
const iFuentes = process.argv.indexOf('--fuentes')
const FUENTES_FILTRO = iFuentes > -1 ? process.argv[iFuentes + 1].split(',') : null

const UA = 'TlacuiloPortadas/1.0 (biblioteca de prestamo; tlacuilo.org; contacto: marinaorracal@gmail.com)'
const PAUSA_MS = 350 // pausa entre requests para no maltratar las APIs
const dormir = ms => new Promise(r => setTimeout(r, ms))

// fuentes que devolvieron 429/403: se apagan por el resto de la corrida
const fuentesApagadas = new Set()

// ---- progreso ----
const RUTA_PROGRESO = 'portadas-progreso.json'
let progreso = {}
if (existsSync(RUTA_PROGRESO)) {
  progreso = JSON.parse(readFileSync(RUTA_PROGRESO, 'utf8'))
  console.log(`Progreso previo: ${Object.keys(progreso).length} libros ya procesados`)
}
let sinGuardar = 0
const guardarProgreso = (force = false) => {
  sinGuardar++
  if (force || sinGuardar >= 20) {
    writeFileSync(RUTA_PROGRESO, JSON.stringify(progreso))
    sinGuardar = 0
  }
}

// ---- helpers http ----
async function jalarJson(url) {
  await dormir(PAUSA_MS)
  const resp = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(20000) })
  if (resp.status === 429 || resp.status === 403) throw Object.assign(new Error(`HTTP ${resp.status}`), { rateLimit: true })
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  return resp.json()
}

async function jalarImagen(url, minPx = 180) {
  await dormir(PAUSA_MS)
  const resp = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000), redirect: 'follow' })
  if (resp.status === 429 || resp.status === 403) throw Object.assign(new Error(`HTTP ${resp.status}`), { rateLimit: true })
  if (!resp.ok) return null
  const buf = Buffer.from(await resp.arrayBuffer())
  // filtrar pixeles de relleno y placeholders diminutos
  if (buf.length < 2500) return null
  try {
    const meta = await sharp(buf).metadata()
    if (!meta.width || !meta.height || meta.width < minPx || meta.height < minPx) return null
  } catch { return null }
  return buf
}

// Google Books casi siempre da thumbnails de ~128px con zoom=1;
// pedimos zoom mas grande primero y de ultima aceptamos la miniatura.
async function jalarImagenGoogle(url) {
  const base = url.replace('http:', 'https:').replace('&edge=curl', '')
  const candidatos = base.includes('zoom=1')
    ? [base.replace('zoom=1', 'zoom=3'), base.replace('zoom=1', 'zoom=2'), base]
    : [base]
  for (let i = 0; i < candidatos.length; i++) {
    const esUltimo = i === candidatos.length - 1
    const buf = await jalarImagen(candidatos[i], esUltimo ? 110 : 300)
    if (buf) return buf
  }
  return null
}

// ---- limpieza de titulo para busquedas ----
function tituloBusqueda(t) {
  let s = (t || '').replace(/\(.*?\)/g, ' ').replace(/\s+/g, ' ').trim()
  // si tiene subtitulo largo, quedarse con la parte principal
  const antes = s.split(/[:;]/)[0].trim()
  if (antes.length >= 8) s = antes
  return s
}

// ---- las fuentes de la cascada ----
const fuentes = [
  {
    nombre: 'openlibrary_isbn',
    necesita: l => !!l.isbnLimpio,
    async buscar(l) {
      return jalarImagen(`https://covers.openlibrary.org/b/isbn/${l.isbnLimpio}-L.jpg?default=false`)
    },
  },
  {
    nombre: 'google_isbn',
    necesita: l => !!l.isbnLimpio,
    async buscar(l) {
      const d = await jalarJson(`https://www.googleapis.com/books/v1/volumes?q=isbn:${l.isbnLimpio}&maxResults=1${GB_KEY ? `&key=${GB_KEY}` : ''}`)
      const img = d.items?.[0]?.volumeInfo?.imageLinks
      const url = img?.extraLarge || img?.large || img?.medium || img?.thumbnail
      if (!url) return null
      return jalarImagenGoogle(url)
    },
  },
  {
    nombre: 'openlibrary_busqueda',
    necesita: l => !!l.tituloB,
    async buscar(l) {
      const p = new URLSearchParams({ title: l.tituloB, limit: '3' })
      if (l.autor) p.set('author', l.autor)
      const d = await jalarJson(`https://openlibrary.org/search.json?${p}`)
      const doc = (d.docs || []).find(x => x.cover_i)
      if (!doc) return null
      return jalarImagen(`https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`)
    },
  },
  {
    nombre: 'google_busqueda',
    necesita: l => !!l.tituloB,
    async buscar(l) {
      const q = `intitle:"${l.tituloB}"` + (l.autor ? `+inauthor:"${l.autor}"` : '')
      const d = await jalarJson(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=3${GB_KEY ? `&key=${GB_KEY}` : ''}`)
      for (const item of d.items || []) {
        const img = item.volumeInfo?.imageLinks
        const url = img?.extraLarge || img?.large || img?.medium || img?.thumbnail
        if (url) {
          const buf = await jalarImagenGoogle(url)
          if (buf) return buf
        }
      }
      return null
    },
  },
  {
    nombre: 'internet_archive',
    necesita: l => !!l.tituloB,
    async buscar(l) {
      let q = `title:(${JSON.stringify(l.tituloB)}) AND mediatype:(texts)`
      if (l.autor) q += ` AND creator:(${JSON.stringify(l.autor)})`
      const p = new URLSearchParams({ q, output: 'json', rows: '3' })
      p.append('fl[]', 'identifier')
      const d = await jalarJson(`https://archive.org/advancedsearch.php?${p}`)
      for (const doc of d.response?.docs || []) {
        const buf = await jalarImagen(`https://archive.org/services/img/${doc.identifier}`)
        if (buf) return buf
      }
      return null
    },
  },
  {
    nombre: 'librarything_isbn',
    necesita: l => !!l.isbnLimpio && !!LT_DEVKEY,
    async buscar(l) {
      return jalarImagen(`https://covers.librarything.com/devkey/${LT_DEVKEY}/large/isbn/${l.isbnLimpio}`)
    },
  },
]

// ---- procesar un libro ----
// yaIntentadas: fuentes que en corridas pasadas ya dijeron "no" para este libro; no se repiten.
// Devuelve { buf, fuente, completadas } donde completadas = fuentes que hoy respondieron "no" en firme.
async function procesar(libro, yaIntentadas = []) {
  const completadas = []
  for (const fuente of fuentes) {
    if (FUENTES_FILTRO && !FUENTES_FILTRO.some(t => fuente.nombre.includes(t.trim()))) continue
    if (fuentesApagadas.has(fuente.nombre)) continue
    if (!fuente.necesita(libro)) continue
    if (yaIntentadas.includes(fuente.nombre)) continue
    try {
      const buf = await fuente.buscar(libro)
      if (buf) return { buf, fuente: fuente.nombre, completadas }
      completadas.push(fuente.nombre)
    } catch (e) {
      if (e.rateLimit) {
        fuentesApagadas.add(fuente.nombre)
        console.log(`  !! ${fuente.nombre} nos limito (${e.message}) — apagada por esta corrida`)
      }
      // cualquier otro error: seguir con la siguiente fuente, sin marcarla como agotada
    }
  }
  return { buf: null, completadas }
}

// ---- main ----
const libros = []
for (let desde = 0; ; desde += 1000) {
  const { data, error } = await sb
    .from('libros')
    .select('id, titulo, autor, isbn')
    .eq('teca', 'biblioteca')
    .is('portada_url', null)
    .order('id')
    .range(desde, desde + 999)
  if (error) { console.error('Error leyendo libros:', error.message); process.exit(1) }
  libros.push(...data)
  if (data.length < 1000) break
}

const pendientes = libros.filter(l => {
  const p = progreso[l.id]
  if (!p) return true
  if (p.estado === 'ok') return false
  if (p.estado === 'agotado') return false // huerfana definitiva: ya paso por todo
  return REINTENTAR // los 'miss' solo se reintentan con --reintentar
})

console.log(`${libros.length} libros sin portada en DB, ${pendientes.length} pendientes en esta corrida`)
if (DRY) console.log('MODO DRY: no se sube nada ni se escribe la DB\n')

let ok = 0, miss = 0, errores = 0
const porFuente = {}
const inicio = Date.now()

for (const [i, libro] of pendientes.entries()) {
  if (i >= LIMITE) break

  const isbnLimpio = (libro.isbn || '').replace(/[^0-9Xx]/g, '')
  libro.isbnLimpio = isbnLimpio.length === 10 || isbnLimpio.length === 13 ? isbnLimpio : null
  libro.tituloB = tituloBusqueda(libro.titulo)

  const etiqueta = `[${i + 1}/${Math.min(pendientes.length, LIMITE)}] ${(libro.titulo || '?').slice(0, 55)}`

  try {
    const yaIntentadas = progreso[libro.id]?.intentadas || []
    const resultado = await procesar(libro, yaIntentadas)
    if (!resultado.buf) {
      miss++
      // acumular que fuentes ya dijeron "no" en firme para este libro
      const intentadas = [...new Set([...yaIntentadas, ...resultado.completadas])]
      // agotado = todas las fuentes que aplican a este libro ya respondieron "no"
      const aplicables = fuentes.filter(f => f.necesita(libro)).map(f => f.nombre)
      const agotado = aplicables.every(n => intentadas.includes(n))
      progreso[libro.id] = { estado: agotado ? 'agotado' : 'miss', intentadas, ts: Date.now() }
      console.log(`${etiqueta}  -- no encontrada${agotado ? ' (definitiva)' : ''}`)
    } else {
      const webp = await sharp(resultado.buf)
        .rotate()
        .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer()

      if (!DRY) {
        const nombre = `${libro.id}.webp`
        const { error: eUp } = await sb.storage.from(BUCKET).upload(nombre, webp, {
          upsert: true, contentType: 'image/webp', cacheControl: '31536000',
        })
        if (eUp) throw new Error(`upload: ${eUp.message}`)
        const url = sb.storage.from(BUCKET).getPublicUrl(nombre).data.publicUrl
        // has_portada es columna generada: se actualiza sola al poner portada_url
        const { error: eDb } = await sb.from('libros')
          .update({ portada_url: url })
          .eq('id', libro.id)
        if (eDb) throw new Error(`db: ${eDb.message}`)
      }
      ok++
      porFuente[resultado.fuente] = (porFuente[resultado.fuente] || 0) + 1
      progreso[libro.id] = { estado: DRY ? 'dry' : 'ok', fuente: resultado.fuente, ts: Date.now() }
      console.log(`${etiqueta}  OK (${resultado.fuente}, ${(webp.length / 1024).toFixed(0)}kB)`)
    }
  } catch (e) {
    errores++
    progreso[libro.id] = { estado: 'error', error: e.message, ts: Date.now() }
    console.log(`${etiqueta}  ERROR: ${e.message}`)
  }

  guardarProgreso()

  if ((i + 1) % 100 === 0) {
    const min = (Date.now() - inicio) / 60000
    const porMin = (i + 1) / min
    const faltan = Math.min(pendientes.length, LIMITE) - i - 1
    console.log(`\n--- ${i + 1} procesados | ${ok} ok, ${miss} miss, ${errores} err | ~${porMin.toFixed(0)}/min | faltan ~${(faltan / porMin / 60).toFixed(1)} hrs ---\n`)
  }
}

guardarProgreso(true)

// ---- resumen y huerfanas ----
console.log('\n================ RESUMEN ================')
console.log(`Encontradas: ${ok}  |  Sin portada: ${miss}  |  Errores: ${errores}`)
for (const [f, n] of Object.entries(porFuente).sort((a, b) => b[1] - a[1])) console.log(`  ${f}: ${n}`)
if (fuentesApagadas.size) console.log(`Fuentes que nos limitaron: ${[...fuentesApagadas].join(', ')} (corre de nuevo mas tarde con --reintentar)`)

const huerfanas = libros.filter(l => ['miss', 'agotado'].includes(progreso[l.id]?.estado))
if (huerfanas.length) {
  const esc = s => `"${String(s || '').replace(/"/g, '""')}"`
  const csv = 'id,titulo,autor,isbn\n' + huerfanas.map(l => [l.id, esc(l.titulo), esc(l.autor), l.isbn || ''].join(',')).join('\n')
  writeFileSync('portadas-huerfanas.csv', csv)
  console.log(`\n${huerfanas.length} huerfanas guardadas en portadas-huerfanas.csv (fase manual / publishers)`)
}
console.log('=========================================')
