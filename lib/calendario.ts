// Modelo de datos y helpers del calendario de contenido (herramienta interna,
// no publica). Las 9 categorias y sus slugs vienen de la minuta de Marina.

export const CATEGORIAS = [
  { slug: 'dias_mundiales', label: 'Dias mundiales / conmemoraciones oficiales' },
  { slug: 'autores', label: 'Autores / escritores / personajes' },
  { slug: 'historia_mexico', label: 'Historia de Mexico' },
  { slug: 'historia_general', label: 'Historia general / mundo' },
  { slug: 'publicaciones_estrenos', label: 'Publicaciones y estrenos' },
  { slug: 'movimientos_arte', label: 'Movimientos, manifiestos e instituciones de arte' },
  { slug: 'acervo_propio', label: 'Fechas propias del acervo' },
  { slug: 'niche_cultura_pop', label: 'Niche / cultura pop' },
  { slug: 'premios', label: 'Premios y reconocimientos' },
] as const

export type CategoriaSlug = (typeof CATEGORIAS)[number]['slug']

export function labelCategoria(slug: string): string {
  return CATEGORIAS.find((c) => c.slug === slug)?.label ?? slug
}

export const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

export type EstadoAcervo = 'confirmado' | 'verificar' | 'hueco'
export type Tono = 'neutral' | 'requiere_cuidado'

export const ESTADO_LABEL: Record<EstadoAcervo, string> = {
  confirmado: 'confirmado en catalogo',
  verificar: 'verificar en catalogo',
  hueco: 'hueco de acervo',
}

export const ESTADO_CLASE: Record<EstadoAcervo, string> = {
  confirmado: 'text-acid border-acid/40',
  verificar: 'text-text-dim border-rule',
  hueco: 'text-loan border-loan/40',
}

export type CalendarioFecha = {
  id: string
  mes: number
  dia: number
  categoria: string
  titulo: string
  contexto: string
  gancho: string
  plan_de_libros: string
  estado_acervo: EstadoAcervo
  tono: Tono
  tono_nota: string | null
  nota_interna: string | null
  created_at: string
}

export function fechaCorta(mes: number, dia: number): string {
  const nombre = MESES[mes - 1] ?? String(mes)
  return `${dia} de ${nombre}`
}
