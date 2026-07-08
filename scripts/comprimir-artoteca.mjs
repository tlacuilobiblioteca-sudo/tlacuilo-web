// COMPRESOR DE IMAGENES DE LA ARTOTECA
// Las piezas de artoteca se subieron como PNG gigantes (~1.2 MB promedio,
// 91 MB en total). Este script las baja del bucket "portadas", las convierte
// a WebP (max 1200px, q82 — mismo estandar que portadas-cascada), sube el
// .webp, actualiza portada_url (+cache buster nuevo) y borra el .png viejo.
//
// Correr desde la raiz del repo tlacuilo-web (usa .env.local):
//   node scripts/comprimir-artoteca.mjs           -> corre completo
//   node scripts/comprimir-artoteca.mjs --dry     -> solo reporta, no toca nada
//   node scripts/comprimir-artoteca.mjs --limite 5 -> solo 5 (para probar)
//   node scripts/comprimir-artoteca.mjs --keep-png -> no borra los png originales

import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'
import { readFileSync } from 'node:fs'
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
if (!URL_SB || !SERVICE_KEY) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const sb = createClient(URL_SB, SERVICE_KEY)
const BUCKET = 'portadas'
const DRY = process.argv.includes('--dry')
const KEEP_PNG = process.argv.includes('--keep-png')
const iLim = process.argv.indexOf('--limite')
const LIMITE = iLim > -1 ? parseInt(process.argv[iLim + 1], 10) : Infinity

const fmt = (b) => (b / 1024).toFixed(0) + ' kB'

async function main() {
  // Piezas de artoteca cuya portada sigue siendo PNG en nuestro bucket
  const { data: piezas, error } = await sb
    .from('libros')
    .select('id, titulo, portada_url')
    .eq('teca', 'artoteca')
    .not('portada_url', 'is', null)
    .like('portada_url', `%/${BUCKET}/%.png%`)

  if (error) {
    console.error('Error consultando libros:', error.message)
    process.exit(1)
  }
  if (!piezas || piezas.length === 0) {
    console.log('No hay PNGs de artoteca pendientes. Todo comprimido ✓')
    return
  }

  console.log(`${piezas.length} piezas por comprimir${DRY ? ' (DRY RUN)' : ''}\n`)

  let ok = 0
  let fallas = 0
  let bytesAntes = 0
  let bytesDespues = 0

  for (const [i, pieza] of piezas.slice(0, LIMITE).entries()) {
    const etiqueta = `[${i + 1}/${Math.min(piezas.length, LIMITE)}] ${pieza.titulo?.slice(0, 40) ?? pieza.id}`
    try {
      // 1. bajar el png original
      const nombrePng = `${pieza.id}.png`
      const { data: blob, error: errDown } = await sb.storage.from(BUCKET).download(nombrePng)
      if (errDown || !blob) throw new Error(`download: ${errDown?.message ?? 'vacio'}`)
      const original = Buffer.from(await blob.arrayBuffer())

      // 2. convertir a webp max 1200px q82 (mismo estandar que portadas-cascada)
      const webp = await sharp(original)
        .rotate() // respeta EXIF
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer()

      bytesAntes += original.length
      bytesDespues += webp.length
      console.log(`${etiqueta}: ${fmt(original.length)} → ${fmt(webp.length)}`)

      if (DRY) { ok++; continue }

      // 3. subir webp
      const nombreWebp = `${pieza.id}.webp`
      const { error: errUp } = await sb.storage
        .from(BUCKET)
        .upload(nombreWebp, webp, { contentType: 'image/webp', upsert: true })
      if (errUp) throw new Error(`upload: ${errUp.message}`)

      // 4. actualizar portada_url con cache buster nuevo
      const urlNueva = `${URL_SB}/storage/v1/object/public/${BUCKET}/${nombreWebp}?v=${Date.now()}`
      const { error: errDb } = await sb
        .from('libros')
        .update({ portada_url: urlNueva })
        .eq('id', pieza.id)
      if (errDb) throw new Error(`update: ${errDb.message}`)

      // 5. borrar el png viejo (a menos que --keep-png)
      if (!KEEP_PNG) {
        const { error: errDel } = await sb.storage.from(BUCKET).remove([nombrePng])
        if (errDel) console.warn(`  aviso: no pude borrar ${nombrePng}: ${errDel.message}`)
      }

      ok++
    } catch (e) {
      fallas++
      console.error(`${etiqueta}: FALLO · ${e.message}`)
    }
  }

  console.log(`\n---- resumen ----`)
  console.log(`ok: ${ok} · fallas: ${fallas}`)
  console.log(`peso: ${fmt(bytesAntes)} → ${fmt(bytesDespues)} (ahorro ${fmt(bytesAntes - bytesDespues)})`)
  if (DRY) console.log('DRY RUN: no se subio ni borro nada.')
}

main()
