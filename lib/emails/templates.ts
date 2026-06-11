/**
 * Templates de los 3 emails del ciclo de préstamo en Tlacuilo.
 *
 * Cada función devuelve { subject, html, text } listo para mandar via Resend.
 *
 * Voz: manifiesto Tlacuilo. Terminal style en mono. Lowercase intencional.
 * Sin em-dashes, sin guiones decorativos, sin emojis (excepto · y →).
 *
 * Cuando llegue tlacuilo.org y conectemos Resend:
 *   import { Resend } from 'resend'
 *   import { emailPrestamoConfirmado } from '@/lib/emails/templates'
 *   const { subject, html, text } = emailPrestamoConfirmado({...})
 *   await resend.emails.send({
 *     from: 'hola@tlacuilo.org',
 *     to: userEmail,
 *     subject, html, text
 *   })
 */

export type LibroEmail = {
  titulo: string
  autor: string | null
}

export type EmailContent = {
  subject: string
  html: string
  text: string
}

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]
const DIAS = [
  'domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado',
]

function formatFecha(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  return `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`
}

function librosToHtml(libros: LibroEmail[]): string {
  return libros
    .map(
      (l) => `
        <li style="margin: 0 0 8px 0; padding: 0;">
          <span style="color: #c5c5e8; font-weight: 500;">${escapeHtml(l.titulo)}</span>
          ${l.autor ? `<br><span style="color: #888; font-size: 13px;">${escapeHtml(l.autor)}</span>` : ''}
        </li>`
    )
    .join('')
}

function librosToText(libros: LibroEmail[]): string {
  return libros.map((l) => `  · ${l.titulo}${l.autor ? ` · ${l.autor}` : ''}`).join('\n')
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Estructura base del HTML. Dark theme matching el sitio.
 * Tipografías web safe (fallback de Courier para mono).
 */
function shell(title: string, body: string, cta?: { label: string; href: string }): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
</head>
<body style="margin: 0; padding: 0; background: #15151d; font-family: 'Courier New', Courier, monospace; color: #e8e8f0; line-height: 1.5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: #15151d;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 560px;">
          <tr>
            <td style="padding-bottom: 24px;">
              <p style="margin: 0; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #888;">
                &gt; tlacuilo · biblioteca pública
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 0 24px 0;">
              ${body}
            </td>
          </tr>
          ${
            cta
              ? `<tr>
            <td style="padding: 8px 0 24px 0;">
              <a href="${escapeHtml(cta.href)}" style="display: inline-block; background: #9091c4; color: #15151d; padding: 12px 20px; text-decoration: none; font-size: 13px; text-transform: lowercase; letter-spacing: 0.05em;">
                ${escapeHtml(cta.label)} →
              </a>
            </td>
          </tr>`
              : ''
          }
          <tr>
            <td style="padding-top: 24px; border-top: 1px solid #2a2a3a; font-size: 11px; color: #666; letter-spacing: 0.05em;">
              <p style="margin: 0;">tlacuilo. biblioteca pública en coyoacán.</p>
              <p style="margin: 4px 0 0 0;">cdmx · 2026</p>
              <p style="margin: 12px 0 0 0; font-size: 10px;">
                este correo es parte del ciclo de préstamo. <br>
                escríbenos a <a href="mailto:hola@tlacuilo.org" style="color: #9091c4;">hola@tlacuilo.org</a> si algo se rompió.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ============================================
// EMAIL 1: PRÉSTAMO CONFIRMADO
// dispara cuando editor marca status: apartado → recogido
// ============================================
export function emailPrestamoConfirmado(params: {
  handle: string
  libros: LibroEmail[]
  dueAt: string | Date
}): EmailContent {
  const { handle, libros, dueAt } = params
  const fechaTexto = formatFecha(dueAt)
  const cuantos = libros.length === 1 ? 'un libro' : `${libros.length} libros`

  const subject = `tu morral salió de la biblioteca. vuelve antes del ${formatFecha(dueAt).split(' de ')[0]} ${formatFecha(dueAt).split(' de ')[1]}`

  const text = `
hola ${handle},

te llevaste ${cuantos} del acervo de tlacuilo:

${librosToText(libros)}

vuelven antes del ${fechaTexto}.

son 30 días. son tuyos hasta entonces.

cuídalos. léelos. devuélvelos.

tlacuilo. biblioteca pública en coyoacán.
hola@tlacuilo.org
`.trim()

  const body = `
    <h1 style="margin: 0 0 8px 0; font-size: 24px; color: #e8e8f0; font-weight: 500;">
      hola ${escapeHtml(handle)},
    </h1>
    <p style="margin: 0 0 20px 0; font-size: 14px; color: #c5c5e8;">
      te llevaste ${cuantos} del acervo de tlacuilo:
    </p>
    <ul style="margin: 0 0 24px 0; padding-left: 20px; list-style: '· ';">
      ${librosToHtml(libros)}
    </ul>
    <p style="margin: 0 0 12px 0; font-size: 14px;">
      <span style="color: #888;">vuelven antes del</span><br>
      <span style="color: #9091c4; font-weight: 500; font-size: 16px;">${escapeHtml(fechaTexto)}</span>
    </p>
    <p style="margin: 16px 0 0 0; font-size: 13px; color: #888;">
      son 30 días. son tuyos hasta entonces.
    </p>
    <p style="margin: 12px 0 0 0; font-size: 13px; color: #c5c5e8;">
      cuídalos. léelos. devuélvelos.
    </p>
  `

  return {
    subject,
    html: shell('préstamo confirmado', body),
    text,
  }
}

// ============================================
// EMAIL 2: RECORDATORIO DE DEVOLUCIÓN
// dispara 3 días antes de due_at (cron job)
// ============================================
export function emailRecordatorioDevolucion(params: {
  handle: string
  libros: LibroEmail[]
  dueAt: string | Date
  diasFaltantes?: number
}): EmailContent {
  const { handle, libros, dueAt, diasFaltantes = 3 } = params
  const fechaTexto = formatFecha(dueAt)
  const diasTxt = diasFaltantes === 1 ? '1 día' : `${diasFaltantes} días`

  const subject = `te quedan ${diasTxt} con tu morral`

  const text = `
${handle},

faltan ${diasTxt} para devolver:

${librosToText(libros)}

fecha límite: ${fechaTexto}

si necesitas más tiempo, escríbenos a hola@tlacuilo.org.
si ya terminaste, agéndate para regresar a la biblioteca.

tlacuilo. biblioteca pública en coyoacán.
`.trim()

  const body = `
    <h1 style="margin: 0 0 8px 0; font-size: 22px; color: #e8e8f0; font-weight: 500;">
      ${escapeHtml(handle)},
    </h1>
    <p style="margin: 0 0 20px 0; font-size: 14px; color: #c5c5e8;">
      faltan <strong style="color: #9091c4;">${escapeHtml(diasTxt)}</strong> para devolver:
    </p>
    <ul style="margin: 0 0 24px 0; padding-left: 20px; list-style: '· ';">
      ${librosToHtml(libros)}
    </ul>
    <p style="margin: 0 0 16px 0; font-size: 14px;">
      <span style="color: #888;">fecha límite</span><br>
      <span style="color: #9091c4; font-size: 16px;">${escapeHtml(fechaTexto)}</span>
    </p>
    <p style="margin: 20px 0 0 0; font-size: 13px; color: #888;">
      si necesitas otra semana, escríbenos. si ya terminaste, agéndate para regresar.
    </p>
  `

  return {
    subject,
    html: shell('te quedan días con tu morral', body, {
      label: 'agendar devolución',
      href: 'https://tlacuilo.org/mi-tlacuilo',
    }),
    text,
  }
}

// ============================================
// EMAIL 3: DEVOLUCIÓN CONFIRMADA
// dispara cuando editor marca status: recogido → devuelto
// ============================================
export function emailDevolucionConfirmada(params: {
  handle: string
  libros: LibroEmail[]
}): EmailContent {
  const { handle, libros } = params

  const subject = 'gracias. tu morral volvió a tlacuilo.'

  const text = `
${handle},

recibimos:

${librosToText(libros)}

quedan libres para el próximo lector. tu morral está vacío.

el catálogo entero está abierto en tlacuilo.org/biblioteca.

tlacuilo. biblioteca pública en coyoacán.
`.trim()

  const body = `
    <h1 style="margin: 0 0 8px 0; font-size: 22px; color: #e8e8f0; font-weight: 500;">
      gracias, ${escapeHtml(handle)}.
    </h1>
    <p style="margin: 0 0 20px 0; font-size: 14px; color: #c5c5e8;">
      recibimos:
    </p>
    <ul style="margin: 0 0 24px 0; padding-left: 20px; list-style: '· ';">
      ${librosToHtml(libros)}
    </ul>
    <p style="margin: 0 0 12px 0; font-size: 14px; color: #c5c5e8;">
      quedan libres para el próximo lector. tu morral está vacío.
    </p>
    <p style="margin: 16px 0 0 0; font-size: 13px; color: #888;">
      el catálogo entero está abierto, listo para tu siguiente viaje.
    </p>
  `

  return {
    subject,
    html: shell('gracias por devolver', body, {
      label: 'explorar la biblioteca',
      href: 'https://tlacuilo.org/biblioteca',
    }),
    text,
  }
}

// ============================================
// EMAIL 0: CITA AGENDADA
// dispara cuando el usuario confirma checkout (status: morral → apartado)
// ============================================
export const DIRECCION_BIBLIOTECA = 'Europa 13, Coyoacán'

function bloqueDeVisita(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  return d.getHours() < 14 ? 'mañana · 10:00 a 14:30' : 'tarde · 16:00 a 19:00'
}

export function emailCitaAgendada(params: {
  handle: string
  libros: LibroEmail[]
  visitAt: string | Date
}): EmailContent {
  const { handle, libros, visitAt } = params
  const fechaTexto = formatFecha(visitAt)
  const bloque = bloqueDeVisita(visitAt)
  const cuantos = libros.length === 1 ? 'un objeto' : `${libros.length} objetos`

  const subject = `tu visita quedó agendada · ${fechaTexto}`

  const text = `
hola ${handle},

tu morral está apartado. ${cuantos} te esperan en la biblioteca:

${librosToText(libros)}

cuándo: ${fechaTexto}
bloque: ${bloque}
dónde: ${DIRECCION_BIBLIOTECA}

12 horas antes te mandamos un recordatorio para confirmar.

tlacuilo. biblioteca pública en coyoacán.
hola@tlacuilo.org
`.trim()

  const body = `
    <h1 style="margin: 0 0 8px 0; font-size: 24px; color: #e8e8f0; font-weight: 500;">
      hola ${escapeHtml(handle)},
    </h1>
    <p style="margin: 0 0 20px 0; font-size: 14px; color: #c5c5e8;">
      tu morral está apartado. ${cuantos} te esperan en la biblioteca:
    </p>
    <ul style="margin: 0 0 24px 0; padding-left: 20px; list-style: '· ';">
      ${librosToHtml(libros)}
    </ul>
    <p style="margin: 0 0 6px 0; font-size: 14px;">
      <span style="color: #888;">cuándo</span><br>
      <span style="color: #9091c4; font-weight: 500; font-size: 16px;">${escapeHtml(fechaTexto)}</span>
    </p>
    <p style="margin: 0 0 6px 0; font-size: 14px;">
      <span style="color: #888;">bloque</span><br>
      <span style="color: #e8e8f0;">${escapeHtml(bloque)}</span>
    </p>
    <p style="margin: 0 0 12px 0; font-size: 14px;">
      <span style="color: #888;">dónde</span><br>
      <span style="color: #e8e8f0;">${escapeHtml(DIRECCION_BIBLIOTECA)}</span>
    </p>
    <p style="margin: 16px 0 0 0; font-size: 13px; color: #888;">
      12 horas antes te mandamos un recordatorio para confirmar tu visita.
    </p>
  `

  return {
    subject,
    html: shell('tu visita quedó agendada', body),
    text,
  }
}

// ============================================
// EMAIL 0.5: RECORDATORIO DE CITA (12 horas antes)
// dispara via cron · botones asistiré / no asistiré (sin reply)
// ============================================
export function emailRecordatorioCita(params: {
  handle: string
  libros: LibroEmail[]
  visitAt: string | Date
  urlSi: string
  urlNo: string
}): EmailContent {
  const { handle, libros, visitAt, urlSi, urlNo } = params
  const fechaTexto = formatFecha(visitAt)
  const bloque = bloqueDeVisita(visitAt)

  const subject = `mañana nos vemos · ${fechaTexto} · confirma tu visita`

  const text = `
hola ${handle},

tu visita a la biblioteca es en menos de 12 horas:

cuándo: ${fechaTexto}
bloque: ${bloque}
dónde: ${DIRECCION_BIBLIOTECA}

tu morral apartado:

${librosToText(libros)}

confirma aquí:

  asistiré → ${urlSi}
  no asistiré → ${urlNo}

si no puedes venir no pasa nada, tus objetos vuelven a tu morral
y agendas otra visita cuando quieras.

tlacuilo. biblioteca pública en coyoacán.
`.trim()

  const body = `
    <h1 style="margin: 0 0 8px 0; font-size: 24px; color: #e8e8f0; font-weight: 500;">
      hola ${escapeHtml(handle)},
    </h1>
    <p style="margin: 0 0 20px 0; font-size: 14px; color: #c5c5e8;">
      tu visita a la biblioteca es en menos de 12 horas.
    </p>
    <p style="margin: 0 0 6px 0; font-size: 14px;">
      <span style="color: #888;">cuándo</span><br>
      <span style="color: #9091c4; font-weight: 500; font-size: 16px;">${escapeHtml(fechaTexto)}</span>
    </p>
    <p style="margin: 0 0 6px 0; font-size: 14px;">
      <span style="color: #888;">bloque</span><br>
      <span style="color: #e8e8f0;">${escapeHtml(bloque)}</span>
    </p>
    <p style="margin: 0 0 20px 0; font-size: 14px;">
      <span style="color: #888;">dónde</span><br>
      <span style="color: #e8e8f0;">${escapeHtml(DIRECCION_BIBLIOTECA)}</span>
    </p>
    <p style="margin: 0 0 8px 0; font-size: 14px; color: #c5c5e8;">tu morral apartado:</p>
    <ul style="margin: 0 0 28px 0; padding-left: 20px; list-style: '· ';">
      ${librosToHtml(libros)}
    </ul>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td style="padding-right: 12px;">
          <a href="${escapeHtml(urlSi)}" style="display: inline-block; background: #B8F200; color: #15151d; padding: 12px 22px; text-decoration: none; font-size: 13px; text-transform: lowercase; letter-spacing: 0.05em; font-weight: bold;">
            asistiré →
          </a>
        </td>
        <td>
          <a href="${escapeHtml(urlNo)}" style="display: inline-block; background: transparent; color: #e8e8f0; border: 1px solid #555; padding: 11px 22px; text-decoration: none; font-size: 13px; text-transform: lowercase; letter-spacing: 0.05em;">
            no asistiré
          </a>
        </td>
      </tr>
    </table>
    <p style="margin: 24px 0 0 0; font-size: 12px; color: #888;">
      si no puedes venir no pasa nada: tus objetos vuelven a tu morral y agendas otra visita cuando quieras.
    </p>
  `

  return {
    subject,
    html: shell('confirma tu visita', body),
    text,
  }
}
