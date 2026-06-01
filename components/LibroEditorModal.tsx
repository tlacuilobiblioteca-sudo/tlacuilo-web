'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

/* ============================================================
   Editor RICO de un libro
   - Modal usado desde admin/libros, landing, y biblioteca/[id]
   - Solo deberían abrirlo usuarios con rol=editor (el AdminEditButton lo controla)
   - Drag-and-drop de portada · edit fields · toggles · delete
   - Todos los writes van directo a Supabase
   - Al cerrar/guardar/eliminar dispara router.refresh() para que el caller
     (landing, biblioteca, etc.) vuelva a fetchear data fresca
   ============================================================ */

type Teca = 'biblioteca' | 'artoteca' | 'fonoteca' | 'videoteca' | 'editorial'

type Libro = {
  id: string
  titulo: string
  autor: string | null
  anio: number | null
  isbn: string | null
  portada_url: string | null
  categorias: string[] | null
  descripcion: string | null
  edicion_especial: boolean
  disponible: boolean
  motivo: string | null
  teca: Teca
  formato: string | null
}

export const MOTIVOS_PRESET = ['solo consulta', 'reparación', 'estudio', 'archivado']
const TECAS_OPCIONES: Teca[] = ['biblioteca', 'artoteca', 'fonoteca', 'videoteca', 'editorial']

type Props = {
  libroId: string
  onClose: () => void
}

export default function LibroEditorModal({ libroId, onClose }: Props) {
  const router = useRouter()
  const [libro, setLibro] = useState<Libro | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Form
  const [editTitulo, setEditTitulo] = useState('')
  const [editAutor, setEditAutor] = useState('')
  const [editAnio, setEditAnio] = useState('')
  const [editIsbn, setEditIsbn] = useState('')
  const [editCategorias, setEditCategorias] = useState('')
  const [editDescripcion, setEditDescripcion] = useState('')
  const [editTeca, setEditTeca] = useState<Teca>('biblioteca')
  const [editFormato, setEditFormato] = useState('')

  // UI state
  const [uploading, setUploading] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const [editMsg, setEditMsg] = useState<string | null>(null)
  const [draggingOver, setDraggingOver] = useState(false)
  const [uploadUrl, setUploadUrl] = useState('')

  // Fetch libro al montar
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const { data, error } = await supabase
        .from('libros')
        .select('id, titulo, autor, anio, isbn, portada_url, categorias, descripcion, edicion_especial, disponible, motivo, teca, formato')
        .eq('id', libroId)
        .single<Libro>()
      if (cancelled) return
      if (error || !data) {
        setLoadError(error?.message ?? 'no se encontró el libro')
        return
      }
      setLibro(data)
      setEditTitulo(data.titulo)
      setEditAutor(data.autor ?? '')
      setEditAnio(data.anio ? String(data.anio) : '')
      setEditIsbn(data.isbn ?? '')
      setEditCategorias((data.categorias ?? []).join(', '))
      setEditDescripcion(data.descripcion ?? '')
      setEditTeca(data.teca ?? 'biblioteca')
      setEditFormato(data.formato ?? '')
    }
    load()
    return () => { cancelled = true }
  }, [libroId])

  if (loadError) {
    return (
      <Backdrop onClose={onClose}>
        <div className="bg-bg-card border border-tinta p-6 max-w-md w-full shadow-2xl">
          <p className="font-mono text-sm text-loan">error: {loadError}</p>
          <button onClick={onClose} className="mt-4 font-micro text-[10px] uppercase tracking-[0.08em] underline">
            cerrar
          </button>
        </div>
      </Backdrop>
    )
  }

  if (!libro) {
    return (
      <Backdrop onClose={onClose}>
        <div className="bg-bg-card border border-tinta p-6 max-w-md w-full shadow-2xl">
          <p className="font-mono text-sm text-text-dim">cargando libro...</p>
        </div>
      </Backdrop>
    )
  }

  /* ============ Handlers de upload de portada ============ */

  async function uploadPortadaFile(file: File) {
    if (!libro) return
    setUploading(true)
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
    const path = `${libro.id}.${ext}`
    const { error: upErr } = await supabase.storage
      .from('portadas')
      .upload(path, file, { upsert: true, contentType: file.type })
    if (upErr) {
      alert('error subiendo: ' + upErr.message)
      setUploading(false)
      return
    }
    const { data: pub } = supabase.storage.from('portadas').getPublicUrl(path)
    const finalUrl = `${pub.publicUrl}?v=${Date.now()}`
    const { error: updErr } = await supabase
      .from('libros')
      .update({ portada_url: finalUrl })
      .eq('id', libro.id)
    setUploading(false)
    if (updErr) {
      alert('error actualizando: ' + updErr.message)
      return
    }
    setLibro({ ...libro, portada_url: finalUrl })
    router.refresh()
  }

  async function setPortadaFromUrl() {
    if (!libro || !uploadUrl.trim()) return
    setUploading(true)
    const { error } = await supabase
      .from('libros')
      .update({ portada_url: uploadUrl.trim() })
      .eq('id', libro.id)
    setUploading(false)
    if (error) {
      alert('error: ' + error.message)
      return
    }
    setLibro({ ...libro, portada_url: uploadUrl.trim() })
    setUploadUrl('')
    router.refresh()
  }

  /* ============ Toggles rápidos ============ */

  async function toggleEspecial() {
    if (!libro) return
    const next = !libro.edicion_especial
    const { error } = await supabase
      .from('libros')
      .update({ edicion_especial: next })
      .eq('id', libro.id)
    if (error) { alert('error: ' + error.message); return }
    setLibro({ ...libro, edicion_especial: next })
    router.refresh()
  }

  async function setEstado(motivo: string | null) {
    if (!libro) return
    const payload = motivo
      ? { disponible: false, motivo }
      : { disponible: true, motivo: null }
    const { error } = await supabase
      .from('libros')
      .update(payload)
      .eq('id', libro.id)
    if (error) { alert('error: ' + error.message); return }
    setLibro({ ...libro, ...payload })
    router.refresh()
  }

  /* ============ Guardar fields ============ */

  async function guardarEdiciones() {
    if (!libro) return
    if (!editTitulo.trim() || !editAutor.trim()) {
      setEditMsg('título y autor son obligatorios')
      return
    }
    setSavingEdit(true)
    setEditMsg(null)
    const cats = editCategorias.split(',').map((s) => s.trim()).filter(Boolean)
    const payload = {
      titulo: editTitulo.trim(),
      autor: editAutor.trim() || null,
      anio: editAnio ? parseInt(editAnio, 10) : null,
      isbn: editIsbn.trim() || null,
      categorias: cats.length > 0 ? cats : null,
      descripcion: editDescripcion.trim() || null,
      teca: editTeca,
      formato: editFormato.trim() || null,
    }
    const { error } = await supabase
      .from('libros')
      .update(payload)
      .eq('id', libro.id)
    setSavingEdit(false)
    if (error) {
      setEditMsg('error: ' + error.message)
      return
    }
    setLibro({ ...libro, ...payload })
    setEditMsg('guardado ✓')
    setTimeout(() => setEditMsg(null), 2200)
    router.refresh()
  }

  async function eliminarLibro() {
    if (!libro) return
    if (!confirm(`Eliminar permanentemente "${libro.titulo}"? Esta acción NO se puede deshacer.`)) return
    const { error } = await supabase.from('libros').delete().eq('id', libro.id)
    if (error) { alert('error: ' + error.message); return }
    onClose()
    router.refresh()
  }

  /* ============ Render ============ */

  return (
    <Backdrop onClose={() => !uploading && !savingEdit && onClose()}>
      <div
        className="bg-bg-card border border-tinta max-w-3xl w-full p-6 my-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="font-micro text-[11px] uppercase tracking-[0.12em] text-dirty mb-1">
              editando libro
            </p>
            <h2 className="font-sans font-light text-[clamp(20px,2.2vw,28px)] tracking-[-0.005em] text-text leading-tight">
              {libro.titulo}
            </h2>
          </div>
          <button
            onClick={() => !uploading && !savingEdit && onClose()}
            disabled={uploading || savingEdit}
            className="font-micro text-[10px] uppercase tracking-[0.08em] text-text-dim hover:text-text-bright"
          >
            × cerrar
          </button>
        </div>

        <div className="grid grid-cols-[180px_1fr] gap-6 max-md:grid-cols-1">
          {/* PORTADA · drop zone + upload + paste URL */}
          <div className="flex flex-col gap-3">
            <div
              onDragOver={(e) => { e.preventDefault(); setDraggingOver(true) }}
              onDragLeave={() => setDraggingOver(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDraggingOver(false)
                const f = e.dataTransfer.files?.[0]
                if (f && f.type.startsWith('image/')) uploadPortadaFile(f)
              }}
              className={`aspect-[2/3] bg-bg-soft flex items-center justify-center text-text-dim p-2 text-center text-[10px] border-2 border-dashed transition-colors ${
                draggingOver ? 'border-dirty bg-dirty/10' : 'border-rule'
              }`}
            >
              {libro.portada_url ? (
                <img src={libro.portada_url} alt={libro.titulo} className="w-full h-full object-cover" />
              ) : (
                <span className="font-micro uppercase tracking-[0.08em] text-text-dim">
                  {draggingOver ? '↓ soltar imagen ↓' : 'arrastra una imagen aquí'}
                </span>
              )}
            </div>

            <label className="font-micro text-[10px] uppercase tracking-[0.08em] text-text-dim cursor-pointer text-center border border-tinta px-2 py-1.5 hover:bg-dirty hover:text-tinta transition-colors">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) uploadPortadaFile(f)
                  e.target.value = ''
                }}
                className="hidden"
              />
              + subir archivo
            </label>

            <div className="flex flex-col gap-1.5">
              <input
                type="url"
                value={uploadUrl}
                onChange={(e) => setUploadUrl(e.target.value)}
                placeholder="o pega URL..."
                className="w-full bg-bone text-tinta border border-tinta px-2 py-1.5 font-micro text-[10px] placeholder:text-tinta/40 outline-none focus:border-text-bright"
              />
              <button
                onClick={setPortadaFromUrl}
                disabled={uploading || !uploadUrl.trim()}
                className="font-micro text-[10px] uppercase tracking-[0.08em] border border-tinta px-2 py-1.5 hover:bg-dirty hover:text-tinta disabled:opacity-30 transition-colors"
              >
                guardar URL
              </button>
            </div>

            {uploading && (
              <p className="font-micro text-[10px] text-text-dim lowercase">subiendo...</p>
            )}
          </div>

          {/* CAMPOS EDITABLES */}
          <div className="flex flex-col gap-3">
            {/* TECA selector · siempre arriba para que se vea claro */}
            <div className="flex flex-col gap-2 pb-3 border-b border-rule">
              <span className="font-micro text-[10px] uppercase tracking-[0.08em] text-text-dim">teca</span>
              <div className="flex flex-wrap gap-2">
                {TECAS_OPCIONES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setEditTeca(t)}
                    className={`inline-flex items-center border border-tinta rounded-sm px-3 py-1.5 font-micro text-[10px] uppercase tracking-[0.08em] transition-colors ${
                      editTeca === t
                        ? 'bg-dirty text-tinta'
                        : 'bg-tinta text-bone hover:bg-dirty hover:text-tinta'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex flex-col gap-1">
              <span className="font-micro text-[10px] uppercase tracking-[0.08em] text-text-dim">título *</span>
              <input
                value={editTitulo}
                onChange={(e) => setEditTitulo(e.target.value)}
                className="bg-bone text-tinta border border-tinta px-3 py-2 font-mono text-[13px] outline-none focus:border-text-bright"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="font-micro text-[10px] uppercase tracking-[0.08em] text-text-dim">formato (vhs, dvd, lp, cassette, etc.)</span>
              <input
                value={editFormato}
                onChange={(e) => setEditFormato(e.target.value)}
                placeholder={editTeca === 'videoteca' ? 'vhs, dvd, bluray, 16mm...' : editTeca === 'fonoteca' ? 'lp, ep, cassette, cd...' : 'opcional'}
                className="bg-bone text-tinta border border-tinta px-3 py-2 font-mono text-[13px] outline-none focus:border-text-bright"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="font-micro text-[10px] uppercase tracking-[0.08em] text-text-dim">autor *</span>
              <input
                value={editAutor}
                onChange={(e) => setEditAutor(e.target.value)}
                className="bg-bone text-tinta border border-tinta px-3 py-2 font-mono text-[13px] outline-none focus:border-text-bright"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="font-micro text-[10px] uppercase tracking-[0.08em] text-text-dim">año</span>
                <input
                  type="number"
                  value={editAnio}
                  onChange={(e) => setEditAnio(e.target.value)}
                  className="bg-bone text-tinta border border-tinta px-3 py-2 font-mono text-[13px] outline-none focus:border-text-bright"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-micro text-[10px] uppercase tracking-[0.08em] text-text-dim">ISBN</span>
                <input
                  value={editIsbn}
                  onChange={(e) => setEditIsbn(e.target.value)}
                  className="bg-bone text-tinta border border-tinta px-3 py-2 font-mono text-[13px] outline-none focus:border-text-bright"
                />
              </label>
            </div>

            <label className="flex flex-col gap-1">
              <span className="font-micro text-[10px] uppercase tracking-[0.08em] text-text-dim">categorías (separadas por comas)</span>
              <input
                value={editCategorias}
                onChange={(e) => setEditCategorias(e.target.value)}
                className="bg-bone text-tinta border border-tinta px-3 py-2 font-mono text-[13px] outline-none focus:border-text-bright"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="font-micro text-[10px] uppercase tracking-[0.08em] text-text-dim">descripción</span>
              <textarea
                value={editDescripcion}
                onChange={(e) => setEditDescripcion(e.target.value)}
                rows={3}
                className="bg-bone text-tinta border border-tinta px-3 py-2 font-mono text-[13px] outline-none focus:border-text-bright resize-y"
              />
            </label>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-rule">
              <button
                type="button"
                onClick={toggleEspecial}
                className={`inline-flex items-center border border-tinta rounded-sm px-3 py-1.5 font-micro text-[10px] uppercase tracking-[0.08em] transition-colors ${
                  libro.edicion_especial ? 'bg-dirty text-tinta' : 'bg-tinta text-bone hover:bg-dirty hover:text-tinta'
                }`}
              >
                {libro.edicion_especial ? '★ joya' : '☆ marcar joya'}
              </button>

              <button
                type="button"
                onClick={() => setEstado(null)}
                className={`inline-flex items-center border border-tinta rounded-sm px-3 py-1.5 font-micro text-[10px] uppercase tracking-[0.08em] transition-colors ${
                  libro.disponible && !libro.motivo
                    ? 'bg-available text-tinta border-available'
                    : 'bg-tinta text-bone hover:bg-available hover:text-tinta hover:border-available'
                }`}
              >
                ● disponible
              </button>

              {MOTIVOS_PRESET.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setEstado(m)}
                  className={`inline-flex items-center border border-tinta rounded-sm px-3 py-1.5 font-micro text-[10px] uppercase tracking-[0.08em] transition-colors ${
                    libro.motivo === m
                      ? 'bg-loan text-tinta border-loan'
                      : 'bg-tinta text-bone hover:bg-loan hover:text-tinta hover:border-loan'
                  }`}
                >
                  ○ {m}
                </button>
              ))}

              <button
                type="button"
                onClick={() => {
                  const custom = window.prompt('Motivo personalizado:')
                  if (custom?.trim()) setEstado(custom.trim())
                }}
                className="inline-flex items-center border border-rule rounded-sm px-3 py-1.5 font-micro text-[10px] uppercase tracking-[0.08em] text-text-dim hover:bg-tinta hover:text-bone hover:border-tinta transition-colors"
              >
                + otro motivo
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-rule mt-2">
              <button
                type="button"
                onClick={guardarEdiciones}
                disabled={savingEdit}
                className="inline-flex items-center bg-dirty text-tinta border border-tinta rounded-sm px-4 py-2 font-micro text-[11px] uppercase tracking-[0.08em] disabled:opacity-30 hover:bg-tinta hover:text-dirty transition-colors"
              >
                {savingEdit ? 'guardando...' : '✓ guardar cambios'}
              </button>

              {editMsg && (
                <span className={`font-micro text-[10px] uppercase tracking-[0.08em] ${editMsg.includes('✓') ? 'text-available' : 'text-loan'}`}>
                  {editMsg}
                </span>
              )}

              <button
                type="button"
                onClick={eliminarLibro}
                disabled={savingEdit}
                className="ml-auto inline-flex items-center border border-loan rounded-sm px-3 py-1.5 font-micro text-[10px] uppercase tracking-[0.08em] text-loan hover:bg-loan hover:text-bg disabled:opacity-30 transition-colors"
              >
                × eliminar libro
              </button>
            </div>
          </div>
        </div>
      </div>
    </Backdrop>
  )
}

/* ============================================================
   Backdrop común (overlay oscuro + scroll)
   ============================================================ */

function Backdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/70 z-[1000] flex items-start justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      {children}
    </div>
  )
}
