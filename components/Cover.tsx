'use client'

import { useState, useEffect } from 'react'

type Props = {
  titulo: string
  portada_url: string | null
  isbn: string | null
}

export default function Cover({ titulo, portada_url, isbn }: Props) {
  const [src, setSrc] = useState<string | null>(null)
  const [stage, setStage] = useState<'db' | 'openlib' | 'google' | 'failed'>('db')

  useEffect(() => {
    if (portada_url) {
      setSrc(portada_url)
      setStage('db')
      return
    }

    const cleanIsbn = isbn ? isbn.replace(/[^0-9X]/gi, '') : ''
    if (cleanIsbn.length === 10 || cleanIsbn.length === 13) {
      setSrc('https://covers.openlibrary.org/b/isbn/' + cleanIsbn + '-L.jpg?default=false')
      setStage('openlib')
    } else {
      setStage('failed')
    }
  }, [portada_url, isbn])

  const tryGoogleBooks = async () => {
    const cleanIsbn = isbn ? isbn.replace(/[^0-9X]/gi, '') : ''
    if (!cleanIsbn) {
      setStage('failed')
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
        setStage('google')
      } else {
        setStage('failed')
      }
    } catch {
      setStage('failed')
    }
  }

  const handleError = () => {
    if (stage === 'openlib') {
      tryGoogleBooks()
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
      onError={handleError}
    />
  )
}
