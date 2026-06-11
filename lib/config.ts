import { supabase } from '@/lib/supabase'

/** Pasos permitidos para el límite global de objetos por checkout. */
export const CHECKOUT_STEPS = [5, 10, 15, 20, 25, 30, 35, 40, 45] as const

const DEFAULT_MAX = 5

/** Lee el límite global de objetos por checkout desde la tabla config. */
export async function getMaxObjetosCheckout(): Promise<number> {
  const { data } = await supabase
    .from('config')
    .select('valor')
    .eq('clave', 'max_objetos_checkout')
    .maybeSingle()
  const n = Number(data?.valor)
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_MAX
}

/** Escribe el límite global (solo editores pasan el RLS). */
export async function setMaxObjetosCheckout(valor: number): Promise<string | null> {
  const { error } = await supabase
    .from('config')
    .upsert({ clave: 'max_objetos_checkout', valor: String(valor), updated_at: new Date().toISOString() })
  return error ? error.message : null
}
