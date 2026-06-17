import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import {
  emailCitaAgendada,
  emailNuevaReservaEquipo,
  EMAILS_EQUIPO,
  type LibroEmail,
} from '@/lib/emails/templates'

/**
 * POST /api/emails/cita
 * Manda el correo de "tu visita quedó agendada" al usuario logueado.
 * Auth: header Authorization: Bearer <access_token de supabase>.
 * Body: { visitAt: string (ISO) }
 */
export async function POST(req: NextRequest) {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (!token) {
    return NextResponse.json({ error: 'sin token' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )

  const { data: { user }, error: userErr } = await supabase.auth.getUser(token)
  if (userErr || !user?.email) {
    return NextResponse.json({ error: 'sesión inválida' }, { status: 401 })
  }

  let visitAt: string
  try {
    const body = await req.json()
    visitAt = String(body.visitAt)
    if (Number.isNaN(Date.parse(visitAt))) throw new Error()
  } catch {
    return NextResponse.json({ error: 'visitAt inválido' }, { status: 400 })
  }

  const [{ data: prestamos }, { data: perfil }] = await Promise.all([
    supabase
      .from('prestamos')
      .select('id, libros (titulo, autor)')
      .eq('user_id', user.id)
      .eq('status', 'apartado')
      .eq('visit_at', visitAt),
    supabase.from('perfiles').select('handle').eq('id', user.id).single(),
  ])

  if (!prestamos || prestamos.length === 0) {
    return NextResponse.json({ error: 'sin préstamos para esa visita' }, { status: 404 })
  }

  const libros = prestamos.map((p) => p.libros) as unknown as LibroEmail[]
  const { subject, html, text } = emailCitaAgendada({
    handle: perfil?.handle ?? 'lector',
    libros,
    visitAt,
  })

  const resend = new Resend(process.env.RESEND_API_KEY)

  // 1) Correo al lector (confirmación de su visita).
  const { error: sendErr } = await resend.emails.send({
    from: 'Tlacuilo <hola@tlacuilo.org>',
    to: user.email,
    subject,
    html,
    text,
  })

  // 2) Aviso al equipo (no debe bloquear ni romper si falla).
  const equipoMail = emailNuevaReservaEquipo({
    handle: perfil?.handle ?? 'lector',
    correoLector: user.email,
    libros,
    visitAt,
  })
  const { error: equipoErr } = await resend.emails.send({
    from: 'Tlacuilo <hola@tlacuilo.org>',
    to: EMAILS_EQUIPO,
    subject: equipoMail.subject,
    html: equipoMail.html,
    text: equipoMail.text,
  })

  return NextResponse.json({
    ok: !sendErr,
    lector: sendErr ? sendErr.message : 'enviado',
    equipo: equipoErr ? equipoErr.message : 'enviado',
  })
}
