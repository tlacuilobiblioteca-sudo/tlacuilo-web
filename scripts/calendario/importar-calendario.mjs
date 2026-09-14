// Carga las fichas del mega calendario de contenido (scripts/calendario/fichas.json)
// a la tabla calendario_fechas. Por default es DRY RUN; con --aplicar inserta de verdad.
// Correr desde la raiz del repo tlacuilo-web (usa .env.local):
//   node scripts/calendario/importar-calendario.mjs            -> dry run
//   node scripts/calendario/importar-calendario.mjs --aplicar  -> inserta
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const env = {}
for (const linea of readFileSync(resolve(process.cwd(), '.env.local'), 'utf8').split('\n')) {
  const m = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/)
  if (m) env[m[1]] = m[2]
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const APLICAR = process.argv.includes('--aplicar')
const aqui = dirname(fileURLToPath(import.meta.url))
const fichas = JSON.parse(readFileSync(resolve(aqui, 'fichas.json'), 'utf8'))

const { count } = await sb.from('calendario_fechas').select('id', { count: 'exact', head: true })
console.log(`fichas en el json: ${fichas.length} · ya en la tabla: ${count}`)
if (!APLICAR) { console.log('dry run — pasa --aplicar para insertar'); process.exit(0) }
if (count > 0) { console.error('la tabla ya tiene filas; no inserto para no duplicar'); process.exit(1) }

for (let i = 0; i < fichas.length; i += 50) {
  const lote = fichas.slice(i, i + 50)
  const { error } = await sb.from('calendario_fechas').insert(lote)
  if (error) { console.error('error en lote', i, error.message); process.exit(1) }
  console.log(`insertadas ${Math.min(i + 50, fichas.length)}/${fichas.length}`)
}
console.log('listo')
