import type { MetadataRoute } from 'next'

/**
 * PWA manifest de Tlacuilo.
 * Cuando un usuario visita el sitio desde Safari/Chrome en su celular y le da
 * "Agregar a pantalla de inicio", iOS/Android leen este manifest para decidir
 * el icono, nombre, color de tema y cómo abrir la app (fullscreen, sin barra).
 *
 * Editores (Marina, Pedro, Samm) que se instalan tlacuilo así obtienen un acceso
 * directo en su home screen que abre fullscreen y se siente como app nativa.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Tlacuilo · activación de bibliotecas',
    short_name: 'Tlacuilo',
    description:
      'Sistema de préstamo de objetos físicos. Libros, vinilos, arte. CDMX, los comunes.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#6E6BA0',
    theme_color: '#15151D',
    lang: 'es-MX',
    categories: ['books', 'education', 'social'],
    icons: [
      {
        src: '/TLACUILOLOGONEGRO.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
