/* ==========================================================
   Service Worker — Anjali v4
   ROLE:
   Offline support, cache stability, fast startup
   WITHOUT interfering with voice, learning, or reasoning.
   ========================================================== */

"use strict";

/* ===============================
   VERSIONING
   =============================== */
const SW_VERSION = "anjali-sw-v4";
const CACHE_STATIC = `anjali-static-${SW_VERSION}`;
const CACHE_DYNAMIC = `anjali-dynamic-${SW_VERSION}`;

/* ===============================
   FILES SAFE TO CACHE (APP SHELL)
   =============================== */
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/admin.html",
  "/talk_to_anjali.html",
  "/manifest.json",

  // Core
  "/core/AnjaliCore.js",
  "/core/ContextMemory.js",

  // Reasoning
  "/reasoning/ReasoningEngine.js",

  // Knowledge
  "/learning/KnowledgeBase.js",
  "/answer/KnowledgeAnswerEngine.js",

  // Response
  "/response/ResponseEngine.js",

  // Voice UI (logic only, not audio streams)
  "/voice/tts.js",
  "/voice/stt.js",
  "/voice/STT_LongListening.js",

  // Presence
  "/presence/AnjaliPresence.js",

  // Basic Emotion (safe)
  "/emotion/EmotionPerceptionEngine.js",
  "/emotion/ToneAnalysisEngine.js",

  // Assets
  "/avatar.png"
];

/* ===============================
   INSTALL
   =============================== */
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

/* ===============================
   ACTIVATE
   =============================== */
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (
            key !== CACHE_STATIC &&
            key !== CACHE_DYNAMIC
          ) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

/* ===============================
   FETCH STRATEGY
   =============================== */
self.addEventListener("fetch", event => {
  const req = event.request;

  /* ⚠️ Do NOT cache POST / voice / dynamic calls */
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  /* ❌ Never touch microphone / TTS / STT streams */
  if (
    url.pathname.includes("/voice/") &&
    req.headers.get("accept")?.includes("audio")
  ) {
    return;
  }

  /* ===============================
     STATIC FILES → Cache First
     =============================== */
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(req).then(cached => {
        return cached || fetch(req);
      })
    );
    return;
  }

  /* ===============================
     OTHER GET → Network First
     =============================== */
  event.respondWith(
    fetch(req)
      .then(res => {
        return caches.open(CACHE_DYNAMIC).then(cache => {
          cache.put(req, res.clone());
          return res;
        });
      })
      .catch(() => {
        return caches.match(req);
      })
  );
});

/* ===============================
   MESSAGE CHANNEL (Future use)
   =============================== */
self.addEventListener("message", event => {
  if (!event.data) return;

  if (event.data.type === "ANJALI_CLEAR_CACHE") {
    caches.keys().then(keys => {
      keys.forEach(k => caches.delete(k));
    });
  }
});
