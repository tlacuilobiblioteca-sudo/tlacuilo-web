'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import TecaLayout from '@/components/TecaLayout'
import Cover from '@/components/Cover'

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
}

const PAGE_SIZE = 25

const MOTIVOS_PRESET = ['reparación', 'estudio', 'archivado']

export default function AdminLibrosPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isEditor, setIsEditor] = useState(false)
  const [libros, setLibros] = useState<Libro[]>([])
  const [search, setSearch] = useState('')
  const [filtroSinPortada, setFiltroSinPortada] = useState(false)
  const [filtroJoyas, setFiltroJoyas] = useState(false)
  const [filtroNoDisponibles, setFiltroNoDisponibles] = useState(false)
  const [estadoMenuOpen, setEstadoMenuOpen] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)

  const [editingLibro, setEditingLibro] = useState<Libro | null>(null)
  const [uploadTab, setUploadTab] = useState<'file' | 'url'>('file')
  const [uploadUrl, setUploadUrl] = useState('')
  const [uploading, setUploading] = useState(false)

  const [showAdd, setShowAdd] = useState(false)
  const [newTitulo, setNewTitulo] = useState('')
  const [newAutor, setNewAutor] = useState('')
  const [newAnio, setNewAnio] = useState<string>('')
  const [newIsbn, setNewIsbn] = useState('')
  const [newCategorias, setNewCategorias] = useState('')
  const [newDescripcion, setNewDescripcion] = useState('')
  const [newPortadaUrl, setNewPortadaUrl] = useState('')
  const [newEspecial, setNewEspecial] = useState(false)
  const [searchingApi, setSearchingApi] = useState(false)
  const [apiMsg, setApiMsg] = useState<string | null>(null)
  const [savingNew, setSavingNew] = useState(false)

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      const { data: perfil } = await supabase
        .from('perfiles')
        .select('rol')
        .eq('id', user.id)
        .single()
      if (perfil?.rol !== 'editor') {
        router.push('/mi-tlacuilo')
        return
      }
      setIsEditor(true)
      setLoading(false)
    }
    check()
  }, [router])

  const loadLibros = useCallback(async () => {
    if (!isEditor) return
    let q = supabase
      .from('libros')
      .select(
        'id, titulo, autor, anio, isbn, portada_url, categorias, descripcion, edicion_especial, disponible, motivo',
        { count: 'estimated' }
      )
    if (search.trim()) {
      const s = search.trim().replace(/[%_]/g, '')
      q = q.or(`titulo.ilike.%${s}%,autor.ilike.%${s}%`)
    }
    if (filtroSinPortada) q = q.is('portada_url', null)
    if (filtroJoyas) q = q.eq('edicion_especial', true)
    if (filtroNoDisponibles) q = q.eq('disponible', false)
    q = q.order('titulo').range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
    const { data, count } = await q
    setLibros((data ?? []) as Libro[])
    setTotal(count ?? 0)
  }, [isEditor, search, filtroSinPortada, filtroJoyas, filtroNoDisponibles, page, refreshKey])

  useEffect(() => {
    loadLibros()
  }, [loadLibros])

  useEffect(() => {
    setPage(0)
  }, [search, filtroSinPortada, filtroJoyas, filtroNoDisponibles])

  async function buscarEnApi() {
    if (!newTitulo.trim()) {
      setApiMsg('> escribe al menos un título primero')
      return
    }
    setSearchingApi(true)
    setApiMsg(null)
    try {
      const params = new URLSearchParams({ title: newTitulo, limit: '1' })
      if (newAutor.trim()) params.set('author', newAutor)
      const res = await fetch(`https://openlibrary.org/search.json?${params}`)
      const data = await res.json()
      if (data.docs && data.docs.length > 0) {
        const d = data.docs[0]
        if (!newAutor.trim() && d.author_name?.[0]) setNewAutor(d.author_name[0])
        if (d.first_publish_year) setNewAnio(String(d.first_publish_year))
        if (d.isbn?.[0]) setNewIsbn(d.isbn[0])
        if (d.cover_i) setNewPortadaUrl(`https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg`)
        setApiMsg('> datos rellenados desde open library ✓')
      } else {
        setApiMsg('> sin resultados en open library')
      }
    } catch (e) {
      setApiMsg('> error consultando api')
    }
    setSearchingApi(false)
  }

  function resetNewForm() {
    setNewTitulo('')
    setNewAutor('')
    setNewAnio('')
    setNewIsbn('')
    setNewCategorias('')
    setNewDescripcion('')
    setNewPortadaUrl('')
    setNewEspecial(false)
    setApiMsg(null)
  }

  async function agregarLibro() {
    if (!newTitulo.trim() || !newAutor.trim()) {
      alert('título y autor son obligatorios')
      return
    }
    setSavingNew(true)
    const payload: Record<string, unknown> = {
      titulo: newTitulo.trim(),
      autor: newAutor.trim(),
      edicion_especial: newEspecial,
    }
    if (newAnio) payload.anio = parseInt(newAnio, 10)
    if (newIsbn.trim()) payload.isbn = newIsbn.trim()
    if (newCategorias.trim()) {
      payload.categorias = newCategorias.split(',').map((s) => s.trim()).filter(Boolean)
    }
    if (newDescripcion.trim()) payload.descripcion = newDescripcion.trim()
    if (newPortadaUrl.trim()) payload.portada_url = newPortadaUrl.trim()
    const { error } = await supabase.from('libros').insert(payload)
    setSavingNew(false)
    if (error) {
      alert('error al guardar: ' + error.message)
      return
    }
    resetNewForm()
    setShowAdd(false)
    setRefreshKey((k) => k + 1)
  }

  async function uploadPortadaFile(file: File) {
    if (!editingLibro) return
    setUploading(true)
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
    const path = `${editingLibro.id}.${ext}`
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
      .eq('id', editingLibro.id)
    setUploading(false)
    if (updErr) {
      alert('error actualizando libro: ' + updErr.message)
      return
    }
    setEditingLibro(null)
    setUploadUrl('')
    setRefreshKey((k) => k + 1)
  }

  async function setPortadaFromUrl() {
    if (!editingLibro || !uploadUrl.trim()) return
    setUploading(true)
    const { error } = await supabase
      .from('libros')
      .update({ portada_url: uploadUrl.trim() })
      .eq('id', editingLibro.id)
    setUploading(false)
    if (error) {
      alert('error: ' + error.message)
      return
    }
    setUploadUrl('')
    setEditingLibro(null)
    setRefreshKey((k) => k + 1)
  }

  async function setEstadoLibro(libro: Libro, motivo: string | null) {
    // motivo === null → vuelve a disponible
    // motivo presente → disponible=false con esa razón
    const payload = motivo
      ? { disponible: false, motivo }
      : { disponible: true, motivo: null }
    const { error } = await supabase
      .from('libros')
      .update(payload)
      .eq('id', libro.id)
    if (error) {
      alert('error: ' + error.message)
      return
    }
    setLibros((ls) =>
      ls.map((l) => (l.id === libro.id ? { ...l, ...payload } : l))
    )
    setEstadoMenuOpen(null)
  }

  async function toggleEspecial(libro: Libro) {
    const { error } = await supabase
      .from('libros')
      .update({ edicion_especial: !libro.edicion_especial })
      .eq('id', libro.id)
    if (error) {
      alert('error: ' + error.message)
      return
    }
    setLibros((ls) =>
      ls.map((l) => (l.id === libro.id ? { ...l, edicion_especial: !libro.edicion_especial } : l))
    )
  }

  if (loading) {
    return (
      <TecaLayout>
        <section className="px-10 py-20 max-w-7xl mx-auto">
          <p className="opacity-70 font-mono text-[clamp(13px,1vw,16px)]">
            &gt; verificando permisos<span className="animate-pulse">_</span>
          </p>
        </section>
      </TecaLayout>
    )
  }

  if (!isEditor) return null

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <TecaLayout>
      <section className="px-10 pt-10 pb-16 max-w-7xl mx-auto max-md:px-5">
        <p className="font-micro uppercase tracking-[0.12em] text-[11px] text-dirty mb-3">
          admin · libros
        </p>
        <h1 className="font-sans font-light leading-none mb-3 text-[clamp(32px,3.8vw,52px)] tracking-[-0.01em] text-text">
          Catálogo
        </h1>
        <p className="text-text-dim mb-8 text-[clamp(13px,1vw,15px)]">
          subir portadas, agregar libros, marcar joyas, controlar disponibilidad · <span className="font-mono">{total.toLocaleString('es-MX')}</span> libros aprox.
        </p>

        {/* TOOLBAR · search + chip filters + CTA agregar */}
        <div className="border-t border-rule pt-5 mb-6 flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar título o autor..."
            className="flex-1 min-w-[220px] bg-bone text-tinta border border-tinta px-4 py-2 font-micro text-[12px] tracking-[0.02em] placeholder:text-tinta/40 placeholder:italic outline-none focus:border-text-bright"
          />

          <button
            onClick={() => setFiltroSinPortada(!filtroSinPortada)}
            className={`inline-flex items-center border border-tinta rounded-sm px-3 py-2 font-micro text-[10px] uppercase tracking-[0.08em] transition-colors ${filtroSinPortada ? 'bg-dirty text-tinta' : 'bg-tinta text-bone hover:bg-dirty hover:text-tinta'}`}
          >
            sin portada
          </button>

          <button
            onClick={() => setFiltroJoyas(!filtroJoyas)}
            className={`inline-flex items-center border border-tinta rounded-sm px-3 py-2 font-micro text-[10px] uppercase tracking-[0.08em] transition-colors ${filtroJoyas ? 'bg-dirty text-tinta' : 'bg-tinta text-bone hover:bg-dirty hover:text-tinta'}`}
          >
            ★ joyas
          </button>

          <button
            onClick={() => setFiltroNoDisponibles(!filtroNoDisponibles)}
            className={`inline-flex items-center border border-tinta rounded-sm px-3 py-2 font-micro text-[10px] uppercase tracking-[0.08em] transition-colors ${filtroNoDisponibles ? 'bg-dirty text-tinta' : 'bg-tinta text-bone hover:bg-dirty hover:text-tinta'}`}
          >
            no disponibles
          </button>

          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center bg-dirty text-tinta border border-tinta rounded-sm px-4 py-2 font-micro text-[11px] uppercase tracking-[0.08em] hover:bg-tinta hover:text-dirty transition-colors"
          >
            + agregar libro
          </button>
        </div>

        {libros.length === 0 ? (
          <div className="border border-rule p-8 bg-bg-soft text-center">
            <p className="font-mono opacity-70">&gt; no se encontraron libros con esos filtros</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {libros.map((l) => {
              const noDisponible = !l.disponible
              return (
                <div key={l.id} className="flex flex-col gap-1 group relative">
                  {l.edicion_especial && (
                    <span
                      title="Edición especial"
                      className="absolute top-1 right-1 z-10 bg-invert-bg text-invert-fg font-mono text-[10px] px-1.5 py-0.5"
                    >
                      ★
                    </span>
                  )}
                  {noDisponible && (
                    <span
                      title={l.motivo ?? 'no disponible'}
                      className="absolute top-1 left-1 z-10 bg-loan text-bg font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5"
                    >
                      {l.motivo ?? 'no disp.'}
                    </span>
                  )}
                  <div className={`aspect-[2/3] bg-bg-soft flex items-center justify-center text-text-dim p-2 text-center overflow-hidden text-[10px] mb-1 ${noDisponible ? 'opacity-50' : ''}`}>
                    <Cover
                      titulo={l.titulo}
                      portada_url={l.portada_url}
                      isbn={l.isbn}
                      autor={l.autor}
                    />
                  </div>
                  <p className="font-medium leading-tight text-[11px] line-clamp-2">{l.titulo}</p>
                  <p className="opacity-60 text-[10px] line-clamp-1">{l.autor ?? '—'}</p>
                  <div className="flex gap-2 mt-1 font-mono text-[10px] uppercase tracking-wider flex-wrap">
                    <button
                      onClick={() => {
                        setEditingLibro(l)
                        setUploadTab('file')
                        setUploadUrl('')
                      }}
                      className="opacity-70 hover:opacity-100 hover:text-text-bright underline"
                    >
                      portada
                    </button>
                    <button
                      onClick={() => toggleEspecial(l)}
                      className={`opacity-70 hover:opacity-100 hover:text-text-bright underline ${l.edicion_especial ? 'text-text-bright' : ''}`}
                    >
                      {l.edicion_especial ? '× joya' : '★ joya'}
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => setEstadoMenuOpen(estadoMenuOpen === l.id ? null : l.id)}
                        className={`opacity-70 hover:opacity-100 hover:text-text-bright underline ${noDisponible ? 'text-loan' : ''}`}
                      >
                        estado ▾
                      </button>
                      {estadoMenuOpen === l.id && (
                        <div className="absolute left-0 top-full mt-1 z-20 bg-bg-card border border-rule-strong min-w-[140px] py-1 shadow-lg">
                          <button
                            onClick={() => setEstadoLibro(l, null)}
                            className={`block w-full text-left px-3 py-1.5 text-[10px] hover:bg-bg-soft ${l.disponible && !l.motivo ? 'text-text-bright' : ''}`}
                          >
                            · disponible
                          </button>
                          {MOTIVOS_PRESET.map((m) => (
                            <button
                              key={m}
                              onClick={() => setEstadoLibro(l, m)}
                              className={`block w-full text-left px-3 py-1.5 text-[10px] hover:bg-bg-soft ${l.motivo === m ? 'text-text-bright' : ''}`}
                            >
                              · {m}
                            </button>
                          ))}
                          <button
                            onClick={() => {
                              const custom = window.prompt('Motivo personalizado:')
                              if (custom?.trim()) setEstadoLibro(l, custom.trim())
                            }}
                            className="block w-full text-left px-3 py-1.5 text-[10px] hover:bg-bg-soft opacity-70"
                          >
                            · otro...
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-4 font-mono text-sm">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1 border border-rule hover:border-rule-strong disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← anterior
            </button>
            <span className="opacity-70 text-xs">
              página {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1 border border-rule hover:border-rule-strong disabled:opacity-30 disabled:cursor-not-allowed"
            >
              siguiente →
            </button>
          </div>
        )}

        {editingLibro && (
          <div
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => !uploading && setEditingLibro(null)}
          >
            <div
              className="bg-bg-base border border-rule-strong max-w-lg w-full p-6 font-mono"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-xs uppercase tracking-wider opacity-60 mb-1">
                &gt; portada de
              </p>
              <h2 className="text-base text-text-bright mb-1">{editingLibro.titulo}</h2>
              <p className="text-xs opacity-70 mb-6">{editingLibro.autor ?? '—'}</p>

              <div className="flex gap-3 border-b border-rule mb-4 text-xs uppercase tracking-wider">
                <button
                  onClick={() => setUploadTab('file')}
                  className={`pb-2 ${uploadTab === 'file' ? 'text-text-bright border-b-2 border-text-bright -mb-px' : 'opacity-60 hover:opacity-100'}`}
                >
                  subir archivo
                </button>
                <button
                  onClick={() => setUploadTab('url')}
                  className={`pb-2 ${uploadTab === 'url' ? 'text-text-bright border-b-2 border-text-bright -mb-px' : 'opacity-60 hover:opacity-100'}`}
                >
                  pegar url
                </button>
              </div>

              {uploadTab === 'file' && (
                <div>
                  <p className="opacity-70 text-xs mb-3">
                    &gt; jpg, png, webp · máx 5mb
                  </p>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={uploading}
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) uploadPortadaFile(f)
                    }}
                    className="block w-full text-xs file:mr-3 file:py-2 file:px-4 file:border file:border-rule file:bg-bg-soft file:text-text-bright file:font-mono file:uppercase file:tracking-wider file:text-xs hover:file:border-rule-strong"
                  />
                  {uploading && (
                    <p className="mt-2 text-xs opacity-70">
                      &gt; subiendo<span className="animate-pulse">_</span>
                    </p>
                  )}
                </div>
              )}

              {uploadTab === 'url' && (
                <div className="flex flex-col gap-3">
                  <input
                    type="url"
                    value={uploadUrl}
                    onChange={(e) => setUploadUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-bg-soft border border-rule focus:border-rule-strong focus:outline-none px-3 py-2 text-xs text-text-bright placeholder:opacity-30"
                  />
                  <button
                    onClick={setPortadaFromUrl}
                    disabled={uploading || !uploadUrl.trim()}
                    className="self-start px-4 py-2 bg-invert-bg text-invert-fg text-xs uppercase tracking-wider hover:opacity-90 disabled:opacity-40"
                  >
                    {uploading ? 'guardando...' : 'guardar url'}
                  </button>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => !uploading && setEditingLibro(null)}
                  disabled={uploading}
                  className="text-xs uppercase tracking-wider opacity-60 hover:opacity-100"
                >
                  × cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {showAdd && (
          <div
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => !savingNew && setShowAdd(false)}
          >
            <div
              className="bg-bg-base border border-rule-strong max-w-xl w-full p-6 font-mono my-8"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-xs uppercase tracking-wider opacity-60 mb-1">
                &gt; nuevo libro
              </p>
              <h2 className="font-mono uppercase tracking-wide text-text-bright text-lg mb-4">
                Agregar libro
              </h2>

              <div className="flex flex-col gap-3 text-xs">
                <label className="flex flex-col gap-1">
                  <span className="opacity-70 uppercase tracking-wider">título *</span>
                  <input
                    value={newTitulo}
                    onChange={(e) => setNewTitulo(e.target.value)}
                    className="bg-bg-soft border border-rule focus:border-rule-strong focus:outline-none px-3 py-2 text-text-bright"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="opacity-70 uppercase tracking-wider">autor *</span>
                  <input
                    value={newAutor}
                    onChange={(e) => setNewAutor(e.target.value)}
                    className="bg-bg-soft border border-rule focus:border-rule-strong focus:outline-none px-3 py-2 text-text-bright"
                  />
                </label>

                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <button
                    type="button"
                    onClick={buscarEnApi}
                    disabled={searchingApi || !newTitulo.trim()}
                    className="px-3 py-2 border border-rule hover:border-rule-strong disabled:opacity-40 uppercase tracking-wider"
                  >
                    {searchingApi ? 'buscando...' : '⌕ autorrellenar con open library'}
                  </button>
                  {apiMsg && <span className="opacity-70">{apiMsg}</span>}
                </div>

                <div className="border-t border-rule pt-3 mt-2">
                  <p className="opacity-60 text-[10px] uppercase tracking-wider mb-2">
                    // opcionales
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1">
                      <span className="opacity-70 uppercase tracking-wider">año</span>
                      <input
                        type="number"
                        value={newAnio}
                        onChange={(e) => setNewAnio(e.target.value)}
                        className="bg-bg-soft border border-rule focus:border-rule-strong focus:outline-none px-3 py-2 text-text-bright"
                      />
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="opacity-70 uppercase tracking-wider">isbn</span>
                      <input
                        value={newIsbn}
                        onChange={(e) => setNewIsbn(e.target.value)}
                        className="bg-bg-soft border border-rule focus:border-rule-strong focus:outline-none px-3 py-2 text-text-bright"
                      />
                    </label>
                  </div>

                  <label className="flex flex-col gap-1 mt-3">
                    <span className="opacity-70 uppercase tracking-wider">
                      categorías (separadas por coma)
                    </span>
                    <input
                      value={newCategorias}
                      onChange={(e) => setNewCategorias(e.target.value)}
                      placeholder="ej: ANARQUISMO, FILOSOFIA"
                      className="bg-bg-soft border border-rule focus:border-rule-strong focus:outline-none px-3 py-2 text-text-bright placeholder:opacity-30"
                    />
                  </label>

                  <label className="flex flex-col gap-1 mt-3">
                    <span className="opacity-70 uppercase tracking-wider">descripción</span>
                    <textarea
                      value={newDescripcion}
                      onChange={(e) => setNewDescripcion(e.target.value)}
                      rows={3}
                      className="bg-bg-soft border border-rule focus:border-rule-strong focus:outline-none px-3 py-2 text-text-bright resize-none"
                    />
                  </label>

                  <label className="flex flex-col gap-1 mt-3">
                    <span className="opacity-70 uppercase tracking-wider">
                      portada url (open library / google)
                    </span>
                    <input
                      type="url"
                      value={newPortadaUrl}
                      onChange={(e) => setNewPortadaUrl(e.target.value)}
                      placeholder="https://..."
                      className="bg-bg-soft border border-rule focus:border-rule-strong focus:outline-none px-3 py-2 text-text-bright placeholder:opacity-30"
                    />
                  </label>

                  <label className="flex items-center gap-2 mt-4 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newEspecial}
                      onChange={(e) => setNewEspecial(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="uppercase tracking-wider">
                      ★ edición especial / joya
                    </span>
                  </label>
                </div>
              </div>

              <div className="mt-6 flex justify-between items-center">
                <button
                  onClick={() => {
                    resetNewForm()
                    setShowAdd(false)
                  }}
                  disabled={savingNew}
                  className="text-xs uppercase tracking-wider opacity-60 hover:opacity-100"
                >
                  × cancelar
                </button>
                <button
                  onClick={agregarLibro}
                  disabled={savingNew || !newTitulo.trim() || !newAutor.trim()}
                  className="px-4 py-2 bg-invert-bg text-invert-fg text-xs uppercase tracking-wider hover:opacity-90 disabled:opacity-40"
                >
                  {savingNew ? 'guardando...' : 'guardar libro →'}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </TecaLayout>
  )
}
