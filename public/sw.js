// Punto Fresco — Service Worker (escrito a mano, compatible con Turbopack).
//
// Estrategia deliberada para una app de ventas en tiempo real:
//   - Cacheamos SOLO assets estáticos inmutables (JS/CSS con hash, imágenes).
//   - Las páginas, los RSC y las llamadas a Supabase van SIEMPRE a la red,
//     nunca a caché, para que las ventas y gastos se vean al instante.
//   - Al activarse, borra todas las cachés viejas (incluidas las del Service
//     Worker anterior de next-pwa) para limpiar dispositivos ya instalados.

const CACHE = 'pf-static-v1'

function isStaticAsset(url) {
  if (url.pathname.startsWith('/_next/static/')) return true
  return /\.(?:js|css|png|jpe?g|svg|gif|webp|ico|woff2?)$/i.test(url.pathname)
}

self.addEventListener('install', () => {
  // Tomar control apenas se instala, reemplazando al SW anterior.
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys()
      await Promise.all(
        names.filter((n) => n !== CACHE).map((n) => caches.delete(n))
      )
      await self.clients.claim()
    })()
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  // Solo mismo origen y solo assets estáticos. Todo lo demás (navegaciones,
  // RSC, Supabase) no se intercepta: lo maneja el navegador contra la red.
  if (url.origin !== self.location.origin) return
  if (!isStaticAsset(url)) return

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE)
      const cached = await cache.match(request)
      if (cached) return cached
      const response = await fetch(request)
      if (response && response.ok) cache.put(request, response.clone())
      return response
    })()
  )
})
