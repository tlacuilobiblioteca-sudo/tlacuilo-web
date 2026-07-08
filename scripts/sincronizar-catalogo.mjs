// Sincroniza la tabla "libros" (teca=biblioteca) con el export limpio de LibraryThing.
// Por default es DRY RUN: solo muestra que pasaria. Con --aplicar ejecuta de verdad.
// Antes de aplicar, guarda un backup completo de la tabla en ./backup-libros-<fecha>.json
//
// Correr desde la raiz del repo tlacuilo-web (usa .env.local):
//   node "<ruta a este archivo>" "<ruta al catalogo_limpio json>"            -> dry run
//   node "<ruta a este archivo>" "<ruta al catalogo_limpio json>" --aplicar -> aplica
//
// Que hace:
//   BORRA   libros de biblioteca cuyo librarything_id ya no esta en el json
//           (si un libro tiene prestamos/selecciones, NO lo borra y lo reporta)
//   INSERTA libros del json que no existen en la DB
//   ACTUALIZA titulo, autor, isbn, anio y categorias cuando difieren
//   NO TOCA artoteca ni videoteca, ni portadas existentes

import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'node:fs'
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

const rutaJson = process.argv[2]
const APLICAR = process.argv.includes('--aplicar')
if (!rutaJson) {
  console.error('Uso: node sincronizar-catalogo.mjs "<ruta al json limpio>" [--aplicar]')
  process.exit(1)
}

const sb = createClient(URL_SB, SERVICE_KEY)

// ---- colecciones que no son categorias tematicas ----
const COLS_DEFAULT = new Set([
  'Your library', 'Wishlist', 'Currently reading', 'To read', 'Read but unowned', 'Favorites',
])

// ---- decodificar entidades HTML que LT deja en titulos/autores ----
const ENT = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ', aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú', ntilde: 'ñ', Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú', Ntilde: 'Ñ', uuml: 'ü', Uuml: 'Ü', auml: 'ä', ouml: 'ö', ccedil: 'ç', Ccedil: 'Ç', agrave: 'à', egrave: 'è' }
const decodificar = s => s
  ? s.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&([a-zA-Z]+);/g, (m, e) => ENT[e] ?? m)
  : s

// ---- mapear una entrada del export LT a una fila de libros ----
function mapear(ltId, b) {
  // autor en formato "Nombre Apellido"
  let autor = b.authors?.[0]?.fl || null
  if (!autor && b.primaryauthor) {
    const partes = b.primaryauthor.split(',')
    autor = partes.length === 2 ? `${partes[1].trim()} ${partes[0].trim()}` : b.primaryauthor
  }
  // isbn: preferir el de 13 digitos
  let isbn = null
  const candidatos = []
  if (b.isbn && typeof b.isbn === 'object') candidatos.push(...Object.values(b.isbn))
  if (b.originalisbn) candidatos.push(b.originalisbn)
  const limpios = candidatos.map(x => String(x).replace(/[^0-9Xx]/g, '')).filter(x => x.length === 10 || x.length === 13)
  isbn = limpios.find(x => x.length === 13) || limpios[0] || null

  const anio = (b.date || '').match(/\b(1[5-9]\d\d|20\d\d)\b/)?.[1]
  const categorias = (b.collections || []).filter(c => !COLS_DEFAULT.has(c))

  return {
    librarything_id: String(ltId),
    titulo: decodificar((b.title || '').trim()),
    autor: decodificar(autor),
    isbn,
    anio: anio ? parseInt(anio, 10) : null,
    categorias: categorias.length ? categorias.sort() : null,
  }
}

const igual = (a, b) => {
  const na = a == null || a === '' ? null : a
  const nb = b == null || b === '' ? null : b
  if (Array.isArray(na) || Array.isArray(nb)) {
    return JSON.stringify([...(na || [])].sort()) === JSON.stringify([...(nb || [])].sort())
  }
  return na === nb
}

// ---- cargar json limpio ----
const catalogo = JSON.parse(readFileSync(rutaJson, 'utf8'))
const deseado = new Map()
for (const [k, b] of Object.entries(catalogo)) {
  const ltId = String(b.books_id || k)
  deseado.set(ltId, mapear(ltId, b))
}
console.log(`Catalogo limpio: ${deseado.size} libros`)

// ---- bajar toda la tabla libros (paginado) ----
const filas = []
for (let desde = 0; ; desde += 1000) {
  const { data, error } = await sb.from('libros').select('*').range(desde, desde + 999)
  if (error) { console.error('Error leyendo libros:', error.message); process.exit(1) }
  filas.push(...data)
  if (data.length < 1000) break
}
console.log(`DB actual: ${filas.length} filas totales`)

const biblioteca = filas.filter(f => f.teca === 'biblioteca')
const otrasTecas = filas.filter(f => f.teca !== 'biblioteca')
const porLtId = new Map()
const sinLtId = []
for (const f of biblioteca) {
  if (f.librarything_id) porLtId.set(String(f.librarything_id), f)
  else sinLtId.push(f)
}

// proteccion: cosas de artoteca/videoteca que alguien catalogo en LibraryThing
// no deben insertarse como libros de biblioteca
const normalizar = s => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const ltIdsOtrasTecas = new Set(otrasTecas.filter(f => f.librarything_id).map(f => String(f.librarything_id)))
const clavesOtrasTecas = new Set(otrasTecas.map(f => `${normalizar(f.titulo)}|${normalizar(f.autor)}`))

// ---- calcular diff ----
const aBorrar = [...porLtId.entries()].filter(([lt]) => !deseado.has(lt)).map(([, f]) => f)
const aInsertar = []
const enOtraTeca = []
for (const [lt, m] of deseado) {
  if (porLtId.has(lt)) continue
  if (ltIdsOtrasTecas.has(lt) || clavesOtrasTecas.has(`${normalizar(m.titulo)}|${normalizar(m.autor)}`)) {
    enOtraTeca.push(m)
    continue
  }
  aInsertar.push(m)
}
const aActualizar = []
for (const [lt, m] of deseado) {
  const f = porLtId.get(lt)
  if (!f) continue
  const patch = {}
  for (const campo of ['titulo', 'autor', 'isbn', 'anio', 'categorias']) {
    if (!igual(m[campo], f[campo])) patch[campo] = m[campo]
  }
  if (Object.keys(patch).length) aActualizar.push({ id: f.id, titulo: f.titulo, patch })
}

console.log('\n================ DIFF ================')
console.log(`BORRAR:     ${aBorrar.length} libros (ya no estan en el catalogo limpio)`)
console.log(`INSERTAR:   ${aInsertar.length} libros nuevos`)
console.log(`ACTUALIZAR: ${aActualizar.length} libros con datos que cambiaron`)
console.log(`(biblioteca sin librarything_id, no se tocan: ${sinLtId.length})`)
if (enOtraTeca.length) {
  console.log(`PROTEGIDOS: ${enOtraTeca.length} del export ya viven en artoteca/videoteca — NO se insertan:`)
  enOtraTeca.forEach(m => console.log(`  ${m.titulo} — ${m.autor || 's/a'}`))
}
console.log('======================================\n')

const muestra = (arr, fmt, n = 15) => arr.slice(0, n).forEach(x => console.log('  ' + fmt(x)))
if (aBorrar.length) { console.log('Ejemplos a borrar:'); muestra(aBorrar, f => `${f.titulo} — ${f.autor || 's/a'}`) }
if (aInsertar.length) { console.log('\nEjemplos a insertar:'); muestra(aInsertar, m => `${m.titulo} — ${m.autor || 's/a'}`) }
if (aActualizar.length) { console.log('\nEjemplos a actualizar:'); muestra(aActualizar, u => `${u.titulo}: ${Object.keys(u.patch).join(', ')}`) }

// reporte completo para revisar con calma
const fecha = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
const rutaReporte = `sync-reporte-${fecha}.json`
writeFileSync(rutaReporte, JSON.stringify({ aBorrar, aInsertar, aActualizar }, null, 1))
console.log(`\nReporte completo del diff: ${rutaReporte}`)

if (!APLICAR) {
  console.log('\nDRY RUN — no se toco nada. Revisa y vuelve a correr con --aplicar')
  process.exit(0)
}

// ---- backup completo antes de tocar ----
const rutaBackup = `backup-libros-${fecha}.json`
writeFileSync(rutaBackup, JSON.stringify(filas, null, 1))
console.log(`\nBackup completo de libros: ${rutaBackup}`)

// ---- borrar (respetando prestamos/selecciones) ----
let borrados = 0
const noBorrados = []
for (const f of aBorrar) {
  const { error } = await sb.from('libros').delete().eq('id', f.id)
  if (error) noBorrados.push({ titulo: f.titulo, error: error.message })
  else borrados++
}
console.log(`Borrados: ${borrados}`)
if (noBorrados.length) {
  console.log(`NO se pudieron borrar ${noBorrados.length} (probablemente tienen prestamos):`)
  noBorrados.forEach(x => console.log(`  ${x.titulo}: ${x.error}`))
}

// ---- insertar en lotes ----
let insertados = 0
for (let i = 0; i < aInsertar.length; i += 500) {
  const lote = aInsertar.slice(i, i + 500).map(m => ({ ...m, teca: 'biblioteca', disponible: true }))
  const { error } = await sb.from('libros').insert(lote)
  if (error) { console.error(`Error insertando lote ${i}: ${error.message}`); process.exit(1) }
  insertados += lote.length
  console.log(`Insertados ${insertados}/${aInsertar.length}`)
}

// ---- actualizar (en tandas de 20 en paralelo) ----
let actualizados = 0, fallosUpd = 0
for (let i = 0; i < aActualizar.length; i += 20) {
  const tanda = aActualizar.slice(i, i + 20)
  const resultados = await Promise.all(
    tanda.map(u => sb.from('libros').update(u.patch).eq('id', u.id))
  )
  for (const r of resultados) r.error ? fallosUpd++ : actualizados++
  if ((i / 20) % 25 === 0) console.log(`Actualizados ${actualizados}/${aActualizar.length}`)
}
console.log(`Actualizados: ${actualizados}, fallos: ${fallosUpd}`)

console.log('\nListo. La tabla libros quedo sincronizada con el catalogo limpio.')
