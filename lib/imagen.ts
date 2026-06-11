/**
 * Compresión de imágenes en el navegador, antes de subir a Storage.
 * Reduce dimensiones y recomprime a webp para que nada tarde en cargar.
 */
export async function comprimirImagen(
  file: File,
  opts?: { maxDim?: number; quality?: number }
): Promise<File> {
  const maxDim = opts?.maxDim ?? 1200
  const quality = opts?.quality ?? 0.8

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    // formato raro que el navegador no decodifica: se sube tal cual
    return file
  }

  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
  const w = Math.max(1, Math.round(bitmap.width * scale))
  const h = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return file
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, 'image/webp', quality)
  )
  if (!blob) return file

  // Si no ganamos nada (ya era chica y ligera), conservar el original
  if (scale === 1 && blob.size >= file.size) return file

  const base = file.name.replace(/\.\w+$/, '')
  return new File([blob], `${base}.webp`, { type: 'image/webp' })
}
