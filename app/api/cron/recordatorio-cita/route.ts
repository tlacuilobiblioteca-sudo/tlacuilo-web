import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { emailRecordatorioCita, type LibroEmail } from '@/lib/emails/templates'

const SITE_URL = 'https://www.tlacuilo.org'

type Row = {
  id: string
  user_id: string
  visit_at: string
  rsvp_token: string
  libros: { titulo: string; autor: string | null } | null
}

/**
 * GET /api/cron/recordatorio-cita
 * Lo dispara pg_cron (Supabase) cada 15 minutos.
 * Busca visitas apartadas que ocurren dentro de las próximas 12 horas
 * y que aún no recibieron recordatorio; manda el correo con RSVP.
 * Auth: Authorization: Bearer <CRON_SECRET>.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? ''
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'no' }, { status: 401 })
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'falta SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const ahora = new Date()
  const en12h = new Date(ahora.getTime() + 12 * 60 * 60 * 1000)

  const { data, error } = await admin
    .from('prestamos')
    .select('id, user_id, visit_at, rsvp_token, libros (titulo, autor)')
    .eq('status', 'apartado')
    .is('recordatorio_cita_enviado_at', null)
    .gt('visit_at', ahora.toISOString())
    .lte('visit_at', en12h.toISOString())

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  const rows = (data ?? []) as unknown as Row[]
  if (rows.length === 0) {
    return NextResponse.json({ ok: true, enviados: 0 })
  }

  // Agrupar por usuario + visita (una visita = un correo, aunque lleve 5 objetos)
  const grupos = new Map<string, Row[]>()
  for (const r of rows) {
    const key = `${r.user_id}|${r.visit_at}`
    if (!grupos.has(key)) grupos.set(key, [])
    grupos.get(key)!.push(r)
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  let enviados = 0

  for (const [, grupo] of grupos) {
    const { user_id, visit_at, rsvp_token } = grupo[0]

    const [{ data: userRes }, { data: perfil }] = await Promise.all([
      admin.auth.admin.getUserById(user_id),
      admin.from('perfiles').select('handle').eq('id', user_id).single(),
    ])
    const email = userRes?.user?.email
    if (!email) continue

    const libros = grupo
      .map((g) => g.libros)
      .filter(Boolean) as LibroEmail[]

    const { subject, html, text } = emailRecordatorioCita({
      handle: perfil?.handle ?? 'lector',
      libros,
      visitAt: visit_at,
      urlSi: `${SITE_URL}/api/rsvp?token=${rsvp_token}&r=si`,
      urlNo: `${SITE_URL}/api/rsvp?token=${rsvp_token}&r=no`,
    })

    const { error: sendErr } = await resend.emails.send({
      from: 'Tlacuilo <tlacuilo@tlacuilo.org>',
      to: email,
      subject,
      html,
      text,
    })
    if (sendErr) continue

    await admin
      .from('prestamos')
      .update({ recordatorio_cita_enviado_at: new Date().toISOString() })
      .in('id', grupo.map((g) => g.id))
    enviados++
  }

  return NextResponse.json({ ok: true, enviados })
}
