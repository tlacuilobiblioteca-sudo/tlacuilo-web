import { redirect } from 'next/navigation'

/**
 * /calendario se retiró 2026-07-17: el calendarito ahora vive en mi tlacuilo
 * (tus visitas en un color, eventos en otro) y los próximos eventos se asoman
 * en el landing. Redirect para no dejar links viejos en 404.
 * ListaEventos.tsx queda sin uso por si se revive.
 */
export default function CalendarioPage() {
  redirect('/mi-tlacuilo')
}
