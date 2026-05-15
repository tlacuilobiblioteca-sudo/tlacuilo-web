'use client'

import { useState, useEffect } from 'react'

type Props = {
  titulo: string
  portada_url: string | null
  isbn: string | null
  autor: string | null
}

type Stage =
  | 'db'
  | 'openlib_isbn'
  | 'google_isbn'
  | 'openlib_search'
  | 'google_search'
  | 'failed'

export default function Cover({ titulo, portada_url, isbn, autor }: Props) {
  const [src, setSrc] = useState<string | null>(null)
  const [stage, setStage] = useState<Stage>('db')

  useEffect(() => {
    let cancelled = false

    const cleanIsbn = isbn ? isbn.replace(/[^0-9X]/gi, '') : ''
    const hasValidIsbn = cleanIsbn.length === 10 || cleanIsbn.length === 13

    if (portada_url) {
      if (!cancelled) {
        setSrc(portada_url)
        setStage('db')
      }
    } else if (hasValidIsbn) {
      if (!cancelled) {
        setSrc('https://covers.openlibrary.org/b/isbn/' + cleanIsbn + '-L.jpg?default=false')
        setStage('openlib_isbn')
      }
    } else {
      // Sin ISBN: vamos directo a buscar por título+autor
      if (!cancelled) {
        tryOpenLibrarySearch()
      }
    }

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portada_url, isbn])

  const tryGoogleByISBN = async () => {
    const cleanIsbn = isbn ? isbn.replace(/[^0-9X]/gi, '') : ''
    if (!cleanIsbn) {
      tryOpenLibrarySearch()
      return
    }
    try {
      const resp = await fetch(
        'https://www.googleapis.com/books/v1/volumes?q=isbn:' + cleanIsbn + '&maxResults=1'
      )
      const data = await resp.json()
      const thumb = data.items?.[0]?.volumeInfo?.imageLinks?.thumbnail
      if (thumb) {
        setSrc(thumb.replace('http:', 'https:'))
        setStage('google_isbn')
      } else {
        tryOpenLibrarySearch()
      }
    } catch {
      tryOpenLibrarySearch()
    }
  }

  const tryOpenLibrarySearch = async () => {
    if (!titulo) {
      setStage('failed')
      return
    }
    try {
      const params = new URLSearchParams()
      params.set('title', titulo)
      if (autor) params.set('author', autor)
      params.set('limit', '1')

      const resp = await fetch('https://openlibrary.org/search.json?' + params.toString())
      const data = await resp.json()
      const cover_i = data.docs?.[0]?.cover_i
      if (cover_i) {
        setSrc('https://covers.openlibrary.org/b/id/' + cover_i + '-L.jpg')
        setStage('openlib_search')
      } else {
        tryGoogleSearch()
      }
    } catch {
      tryGoogleSearch()
    }
  }

  const tryGoogleSearch = async () => {
    if (!titulo) {
      setStage('failed')
      return
    }
    try {
      const q =
        'intitle:' +
        encodeURIComponent(titulo) +
        (autor ? '+inauthor:' + encodeURIComponent(autor) : '')
      const resp = await fetch(
        'https://www.googleapis.com/books/v1/volumes?q=' + q + '&maxResults=1'
      )
      const data = await resp.json()
      const thumb = data.items?.[0]?.volumeInfo?.imageLinks?.thumbnail
      if (thumb) {
        setSrc(thumb.replace('http:', 'https:'))
        setStage('google_search')
      } else {
        setStage('failed')
      }
    } catch {
      setStage('failed')
    }
  }

  const handleError = () => {
    if (stage === 'openlib_isbn') {
      tryGoogleByISBN()
    } else if (stage === 'google_isbn') {
      tryOpenLibrarySearch()
    } else if (stage === 'openlib_search') {
      tryGoogleSearch()
    } else {
      setStage('failed')
    }
  }

  if (stage === 'failed' || !src) {
    return <span className="font-serif italic leading-tight">{titulo}</span>
  }

  return (
    <img
      src={src}
      alt={titulo}
      className="w-full h-full object-cover"
      loading="lazy"
      decoding="async"
      onError={handleError}
    />
  )
}
