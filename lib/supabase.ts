import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // PKCE es el flujo correcto para OAuth (Google) y para los enlaces
    // de confirmación / recuperación que llegan por correo.
    flowType: 'pkce',
    // Detecta el ?code= en la URL al volver de Google / del email y
    // canjea la sesión automáticamente.
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  },
})
