// IMPORTADOR DE PRESTAMOS HISTORICOS (google form pre-sistema)
// Lee scripts/historicos_google_form.json (generado del xlsx "Usuarios al
// 6 de abril 2022", sin domicilios ni telefonos) y lo sube a la tabla
// prestamos_historicos con fuente='google_form'.
//
// Idempotente: borra lo previamente importado de esa fuente antes de subir.
//
// Correr desde la raiz del repo tlacuilo-web (usa .env.local):
//   node scripts/importar-historicos.mjs          -> importa
//   node scripts/importar-historicos.mjs --dry    -> solo reporta

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const env = {}
try {
  for (const linea of readFileSync(resolve(process.cwd(), '.env.local'), 'utf8').split('\n')) {
    const m = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/)
    if (m) env[m[1]] = m[2]
  }
} catch {
  console.error('No encontre .env.local — corre desde la raiz del repo')
  process.exit(1)
}

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const DRY = process.argv.includes('--dry')
const FUENTE = 'google_form'

const filas = JSON.parse(
  readFileSync(resolve(process.cwd(), 'scripts/historicos_google_form.json'), 'utf8')
)
const totalLibros = filas.reduce((s, f) => s + (f.n_libros || 0), 0)
console.log(`${filas.length} solicitudes · ${totalLibros} préstamos (por libro)${DRY ? ' · DRY RUN' : ''}`)

if (DRY) process.exit(0)

// limpiar importación previa de esta fuente (idempotencia)
const { error: delErr } = await sb.from('prestamos_historicos').delete().eq('fuente', FUENTE)
if (delErr) { console.error('error limpiando:', delErr.message); process.exit(1) }

// insertar en lotes de 200
for (let i = 0; i < filas.length; i += 200) {
  const lote = filas.slice(i, i + 200).map((f) => ({ ...f, fuente: FUENTE }))
  const { error } = await sb.from('prestamos_historicos').insert(lote)
  if (error) { console.error(`error en lote ${i}:`, error.message); process.exit(1) }
  console.log(`lote ${i / 200 + 1} · ${lote.length} filas ✓`)
}

const { data } = await sb.rpc('total_prestamos')
console.log(`\nlisto. total_prestamos() ahora regresa: ${data}`)
