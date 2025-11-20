// ==================== CONFIG ====================
// const CACHE_VERSION = "v2"; // GANTI setiap ada rilis baru
// const CACHE_NAME = `viniela-cache-${CACHE_VERSION}`;

// const URLS_TO_CACHE = [
//   "/",
//   "/index.html",
// Tambah asset static lain di sini kalau mau pre-cache:
// '/styles.css',
// '/main.js',
// ];

// ==================== INSTALL ====================
// self.addEventListener("install", (event) => {
//   event.waitUntil(
//     (async () => {
//       const cache = await caches.open(CACHE_NAME);
//       try {
//         await cache.addAll(URLS_TO_CACHE);
//         console.log("[SW] Precache success:", URLS_TO_CACHE);
//       } catch (err) {
//         console.error("[SW] Precache failed:", err);
//         // jangan fail install, cukup log
//       }
//       // biar SW baru cepat masuk ke fase waiting
//       self.skipWaiting();
//     })()
//   );
// });

// ==================== ACTIVATE ====================
// self.addEventListener("activate", (event) => {
//   event.waitUntil(
//     (async () => {
//       const cacheWhitelist = [CACHE_NAME];
//       const cacheNames = await caches.keys();

//       await Promise.all(
//         cacheNames.map((name) => {
//           if (!cacheWhitelist.includes(name)) {
//             console.log("[SW] Deleting old cache:", name);
//             return caches.delete(name);
//           }
//           return undefined;
//         })
//       );

// langsung kontrol semua client
// await self.clients.claim();
//     })()
//   );
// });

// ==================== FETCH ====================
// self.addEventListener("fetch", (event) => {
// const { request } = event;

// cuma handle GET (biarkan POST/PUT/DELETE langsung ke network)
// if (request.method !== "GET") {
//   return;
// }

// 1) HTML / navigasi: NETWORK FIRST, fallback ke cache
// if (request.mode === "navigate") {
//   event.respondWith(
//     (async () => {
//       try {
//         const networkResponse = await fetch(request);

// simpan HTML terbaru ke cache
//   const cache = await caches.open(CACHE_NAME);
//   cache.put(request, networkResponse.clone()).catch((err) => {
//     console.error("[SW] Failed to cache page:", err);
//   });

//   return networkResponse;
// } catch (err) {
//   console.warn("[SW] Network failed for navigate, using cache:", err);

// coba pakai cache untuk request ini
// const cached = await caches.match(request);
// if (cached) return cached;

// fallback terakhir, pakai index.html
// const fallback = await caches.match("/index.html");
// if (fallback) return fallback;

// kalau semua gagal, lempar error
//         throw err;
//       }
//     })()
//   );
//   return;
// }

// 2) ASSET (JS/CSS/IMG dll): CACHE FIRST, fallback ke network
// event.respondWith(
//   (async () => {
// coba dari cache dulu
// const cachedResponse = await caches.match(request);
// if (cachedResponse) {
//   return cachedResponse;
// }

// try {
//   const networkResponse = await fetch(request);

// hanya cache response yang OK & basic
//   if (
//     !networkResponse ||
//     networkResponse.status !== 200 ||
//     networkResponse.type !== "basic"
//   ) {
//     return networkResponse;
//   }

//   const responseToCache = networkResponse.clone();

//   const cache = await caches.open(CACHE_NAME);
//   cache.put(request, responseToCache).catch((err) => {
//     console.error("[SW] Failed to cache asset:", err);
//   });

//   return networkResponse;
// } catch (err) {
//   console.error("[SW] Network failed for asset:", err);
// di sini bisa disiapkan fallback gambar / asset default kalau mau
//       throw err;
//     }
//   })()
// );
// });
