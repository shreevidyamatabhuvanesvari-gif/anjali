/* ==========================================================
   Service Worker — v4
   ROLE:
   Offline support + performance cache
   SAFE: Does NOT interfere with reasoning or answers
   ========================================================== */

const CACHE_VERSION = "anjali-cache-v4";
const CORE_ASSETS = [
  "/", 
  "/index.html",
  "/admin.html",

  // Core
  "/core/AnjaliCore.js",
  "/core/ContextMemory.js",

  // Reasoning & Knowledge
  "/reasoning/ReasoningEngine.js",
  "/learning/KnowledgeBase.js",
  "/learning/ExperienceMemory.js",
  "/answer/KnowledgeAnswerEngine.js",

  // Response & Voice
  "/response/ResponseEngine.js",
  "/voice/stt.js",
  "/voice/tts.js",

  // UI / Assets
  "/avatar.png"
];

/* ===============================
   INSTALL
   =============================== */
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => {
      return cache.addAll(CORE_ASSETS);
    })
  );
  self.skipWaiting(); // activate immediately
});

/* ===============================
   ACTIVATE
   =============================== */
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_VERSION) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim(); // control open pages
});

/* ===============================
   FETCH (SAFE STRATEGY)
   =============================== */
self.addEventListener("fetch", event => {
  const req = event.request;

  // ⚠️ Do NOT cache POST / voice / dynamic calls
  if (req.method !== "GET") return;

  // Only cache same-origin requests
  if (!req.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;

      return fetch(req)
        .then(resp => {
          // Clone & store only valid responses
          if (
            resp &&
            resp.status === 200 &&
            resp.type === "basic"
          ) {
            const respClone = resp.clone();
            caches.open(CACHE_VERSION).then(cache => {
              cache.put(req, respClone);
            });
          }
          return resp;
        })
        .catch(() => {
          // Offline fallback (HTML only)
          if (req.headers.get("accept")?.includes("text/html")) {
            return caches.match("/index.html");
          }
        });
    })
  );
});

/* ===============================
   MESSAGE (OPTIONAL CONTROL)
   =============================== */
self.addEventListener("message", event => {
  if (event.data === "CLEAR_CACHE") {
    caches.delete(CACHE_VERSION);
  }
});
