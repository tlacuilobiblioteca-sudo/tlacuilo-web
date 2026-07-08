/**
 * Compresión de imágenes en el navegador, antes de subir a Storage.
 * Regla de la casa (2026-07-08): TODO lo que suba un admin sale de aquí
 * mega comprimido. WebP, máx 1200px, y si aún pesa, segunda pasada más dura.
 *
 * Nunca lanza: si de plano no puede decodificar, regresa el original
 * (y lo deja registrado en consola).
 */

const TARGET_BYTES = 450 * 1024 // arriba de esto, segunda pasada

async function decodificar(file: File): Promise<ImageBitmap | HTMLImageElement | null> {
  // 1. vía rápida
  try {
    return await createImageBitmap(file)
  } catch {
    /* sigue el fallback */
  }
  // 2. fallback: <img> con object URL (algunos formatos/navegadores)
  try {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.decoding = 'async'
    const cargada = await new Promise<HTMLImageElement | null>((resolve) => {
      img.onload = () => resolve(img)
      img.onerror = () => resolve(null)
      img.src = url
    })
    URL.revokeObjectURL(url)
    return cargada
  } catch {
    return null
  }
}

function dimensiones(src: ImageBitmap | HTMLImageElement): { w: number; h: number } {
  if (src instanceof HTMLImageElement) {
    return { w: src.naturalWidth, h: src.naturalHeight }
  }
  return { w: src.width, h: src.height }
}

async function encodear(
  src: ImageBitmap | HTMLImageElement,
  maxDim: number,
  quality: number
): Promise<Blob | null> {
  const { w: ow, h: oh } = dimensiones(src)
  if (!ow || !oh) return null
  const scale = Math.min(1, maxDim / Math.max(ow, oh))
  const w = Math.max(1, Math.round(ow * scale))
  const h = Math.max(1, Math.round(oh * scale))

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.drawImage(src, 0, 0, w, h)

  // webp; si el navegador no sabe encodear webp (Safari viejo), cae a jpeg
  let blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, 'image/webp', quality)
  )
  if (!blob || !blob.type.includes('webp')) {
    blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
  }
  return blob
}

export async function comprimirImagen(
  file: File,
  opts?: { maxDim?: number; quality?: number }
): Promise<File> {
  const maxDim = opts?.maxDim ?? 1200
  const quality = opts?.quality ?? 0.8

  const src = await decodificar(file)
  if (!src) {
    console.warn(`comprimirImagen: no pude decodificar ${file.name} (${file.type}), sube tal cual`)
    return file
  }

  // Pasada 1
  let blob = await encodear(src, maxDim, quality)

  // Pasada 2 (mega comprimida): si sigue pesada, aprieta calidad y dimensión
  if (blob && blob.size > TARGET_BYTES) {
    const duro = await encodear(src, Math.min(maxDim, 1000), 0.65)
    if (duro && duro.size < blob.size) blob = duro
  }

  if (src instanceof ImageBitmap) src.close()

  if (!blob) return file

  // Conservar el original solo si de verdad ya era más ligero que lo comprimido
  if (blob.size >= file.size) return file

  const ext = blob.type.includes('webp') ? 'webp' : 'jpg'
  const base = file.name.replace(/\.\w+$/, '')
  return new File([blob], `${base}.${ext}`, { type: blob.type })
}
