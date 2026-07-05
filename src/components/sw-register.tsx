'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    // updateViaCache: 'none' evita que el navegador cachee sw.js, así las
    // actualizaciones del Service Worker se toman de inmediato.
    navigator.serviceWorker
      .register('/sw.js', { updateViaCache: 'none' })
      .catch(() => {})
  }, [])
  return null
}
