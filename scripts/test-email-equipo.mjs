// TEST DE CORREO AL EQUIPO
// Manda un correo de prueba con la misma config que /api/emails/cita
// (misma key, mismo from, mismos destinatarios) y imprime la respuesta
// COMPLETA de Resend para diagnosticar por qué no llegan los avisos.
//
// Correr desde la raiz del repo tlacuilo-web:
//   node scripts/test-email-equipo.mjs

import { Resend } from 'resend'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const env = {}
for (const linea of readFileSync(resolve(process.cwd(), '.env.local'), 'utf8').split('\n')) {
  const m = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/)
  if (m) env[m[1]] = m[2]
}

if (!env.RESEND_API_KEY) {
  console.error('No hay RESEND_API_KEY en .env.local')
  process.exit(1)
}

const EQUIPO = [
  'tlacuilo.biblioteca@gmail.com',
  'sammantha.lucia@gmail.com',
  'marinaorracal@gmail.com',
]

const resend = new Resend(env.RESEND_API_KEY)

console.log('mandando prueba a:', EQUIPO.join(', '))
const res = await resend.emails.send({
  from: 'Tlacuilo <hola@tlacuilo.org>',
  to: EQUIPO,
  subject: 'PRUEBA · aviso de reserva al equipo',
  text: 'Si estás leyendo esto, los avisos de libros apartados sí pueden llegar. Fecha: ' + new Date().toISOString(),
})

console.log('\nrespuesta completa de Resend:')
console.log(JSON.stringify(res, null, 2))
if (res.error) {
  console.log('\n>>> AHÍ ESTÁ EL PROBLEMA ↑ (típicamente: dominio no verificado en la cuenta nueva, o API key de la cuenta vieja)')
} else {
  console.log('\n>>> Resend aceptó el correo. Si no llega en 2 min, revisa SPAM y la pestaña Emails del dashboard de Resend.')
}
